/**
 * ============================================================================
 *  SIMANEV PSSDM — Sistem Manajemen Event
 *  File   : AdminMenu.gs
 *  Fungsi : Menu Spreadsheet, data contoh, ekspor laporan, alat admin
 * ============================================================================
 */

/** Menu pada Google Spreadsheet database */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('SIMANEV PSSDM')
    .addItem('1. Setup / Perbaiki Database', 'menuSetupDatabase')
    .addItem('2. Isi Data Event Contoh', 'menuSeedSampleData')
    .addSeparator()
    .addItem('Buka Aplikasi (Web App)', 'menuOpenWebApp')
    .addItem('Buka Halaman Scan Check-in', 'menuOpenScanner')
    .addItem('Buka Dashboard', 'menuOpenDashboard')
    .addSeparator()
    .addItem('Publikasikan SEMUA Event ke Blogger', 'menuSyncBlogger')
    .addItem('Publikasikan SATU Event ke Blogger', 'menuPublishOneEvent')
    .addItem('Kirim Semua E-Ticket (pilih event)', 'menuSendTickets')
    .addItem('Kirim Pengingat Belum Check-in', 'menuSendReminders')
    .addSeparator()
    .addItem('Buat Laporan Ringkas', 'menuCreateReport')
    .addItem('Info Konfigurasi', 'menuShowConfig')
    .addToUi();
}

function menuSetupDatabase() {
  var result = setupDatabase();
  SpreadsheetApp.getUi().alert(
    'Database siap.\n\nSpreadsheet ID: ' + result.spreadsheetId +
    '\n\nSalin ID ini ke APP_CONFIG.SPREADSHEET_ID pada file Config.gs ' +
    'agar konfigurasi permanen.'
  );
}

function menuSeedSampleData() {
  var count = seedSampleData();
  SpreadsheetApp.getUi().alert('Data contoh berhasil dibuat.\n\nEvent: ' + count.events +
    '\nPeserta: ' + count.participants + '\nPendaftaran: ' + count.registrations);
}

function menuOpenWebApp() {
  openUrl_(APP_CONFIG.APP_URL || '');
}

function menuOpenScanner() {
  openUrl_(buildAppLink_('scan'));
}

function menuOpenDashboard() {
  openUrl_(buildAppLink_('dashboard'));
}

function menuSyncBlogger() {
  var result = syncEventsToBlogger();
  SpreadsheetApp.getUi().alert(
    'Publikasi Blogger selesai.\n\nDibuat: ' + result.published +
    '\nDiperbarui: ' + result.updated + '\nGagal: ' + result.failed +
    (result.errors.length ? '\n\n' + result.errors.join('\n') : '')
  );
}

/**
 * Dialog pemilih event sederhana (berbasis ui.prompt).
 * Mengembalikan object event, atau null bila dibatalkan.
 */
function pickEvent_(actionLabel) {
  var ui = SpreadsheetApp.getUi();
  var events = listEvents();
  if (!events.length) {
    ui.alert('Belum ada event. Jalankan "Isi Data Event Contoh" terlebih dahulu.');
    return null;
  }
  var list = events.map(function (e, i) {
    return (i + 1) + '. ' + e.title + '  (' + fmtDateShort_(e.startDate) + ')';
  }).join('\n');

  var response = ui.prompt(actionLabel + ' \u2014 pilih event',
    'Masukkan NOMOR event:\n\n' + list, ui.ButtonSet.OK_CANCEL);
  if (response.getSelectedButton() !== ui.Button.OK) return null;

  var idx = parseInt(response.getResponseText(), 10);
  if (isNaN(idx) || idx < 1 || idx > events.length) {
    ui.alert('Nomor event tidak valid.');
    return null;
  }
  return events[idx - 1];
}

function menuSendTickets() {
  var event = pickEvent_('Kirim e-ticket');
  if (!event) return;
  var result = sendAllTicketsForEvent(event.id);
  SpreadsheetApp.getUi().alert('E-ticket terkirim: ' + result.sent +
    '\nGagal: ' + result.failed +
    (result.errors.length ? '\n\n' + result.errors.join('\n') : ''));
}

function menuSendReminders() {
  var event = pickEvent_('Kirim pengingat');
  if (!event) return;
  var result = sendRemindersForEvent(event.id);
  SpreadsheetApp.getUi().alert('Pengingat terkirim ke ' + result.sent + ' peserta.');
}

/** Publikasikan satu event (pilihan lewat dialog) ke Blogger */
function menuPublishOneEvent() {
  var event = pickEvent_('Publikasikan ke Blogger');
  if (!event) return;
  try {
    var result = publishEventToBlogger(event.id);
    SpreadsheetApp.getUi().alert('Berhasil dipublikasikan.\n\n' + result.title +
      (result.url ? '\n' + result.url : ''));
  } catch (err) {
    SpreadsheetApp.getUi().alert('Gagal: ' + err.message);
  }
}

/** Buat sheet "Laporan" berisi rekap per event + daftar hadir */
function menuCreateReport() {
  createReportSheet();
  SpreadsheetApp.getUi().alert('Laporan selesai dibuat pada sheet "Laporan".');
}

function menuShowConfig() {
  var ss = getSpreadsheet_();
  SpreadsheetApp.getUi().alert(
    'SPREADSHEET_ID: ' + (APP_CONFIG.SPREADSHEET_ID || ss.getId()) +
    '\nBLOG_ID: ' + (APP_CONFIG.BLOG_ID || '(kosong)') +
    '\nBLOG_URL: ' + (APP_CONFIG.BLOG_URL || '(kosong)') +
    '\nAPP_URL: ' + (APP_CONFIG.APP_URL || '(kosong — isi setelah deploy)') +
    '\nKuota email hari ini: ' + MailApp.getRemainingDailyQuota()
  );
}

/* ============================ HELPER ==================================== */

/** Buka URL pada tab baru dari menu Spreadsheet (menggunakan sidebar) */
function openUrl_(url) {
  if (!url) {
    SpreadsheetApp.getUi().alert('APP_URL belum diisi. Deploy Web App terlebih dahulu, ' +
      'lalu tempel URL /exec pada Config.gs.');
    return;
  }
  var html = HtmlService.createHtmlOutput(
    '<script>window.open(' + JSON.stringify(url) + ', "_blank");' +
    'google.script.host.close();</script>'
  );
  SpreadsheetApp.getUi().showModalDialog(html, 'Membuka aplikasi…');
}

/** Bangun tautan Web App dengan parameter */
function buildAppLink_(page, extra) {
  var base = APP_CONFIG.APP_URL || '';
  if (!base) return '';
  var joiner = base.indexOf('?') > -1 ? '&' : '?';
  var link = base + joiner + 'page=' + page;
  if (extra) link += '&' + extra;
  return link;
}

/** Buat sheet rekap laporan lengkap */
function createReportSheet() {
  var ss = getSpreadsheet_();
  var sh = ss.getSheetByName('Laporan') || ss.insertSheet('Laporan');
  sh.clear();
  sh.getRange(1, 1).setValue('LAPORAN EVENT — ' + APP_CONFIG.APP_NAME).setFontWeight('bold').setFontSize(13);
  sh.getRange(2, 1).setValue('Dibuat: ' + fmtDateLong_(new Date()) + ' ' + fmtTime_(new Date()) +
    ' oleh ' + currentUserEmail_());

  var headers = ['Event', 'Tanggal', 'Tempat', 'Kuota', 'Terdaftar', 'Hadir', 'Belum Hadir', 'Tingkat Kehadiran (%)'];
  sh.getRange(4, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#0f3d4a').setFontColor('#ffffff');

  var rowIdx = 5;
  listEvents().forEach(function (event) {
    var participants = listEventParticipants(event.id);
    var checkedIn = participants.filter(function (p) {
      return p.registration.status === REG_STATUS.CHECKED_IN;
    }).length;
    sh.getRange(rowIdx++, 1, 1, headers.length).setValues([[
      event.title,
      fmtDateShort_(event.startDate),
      event.venue + ', ' + event.city,
      Number(event.maxParticipants),
      participants.length,
      checkedIn,
      participants.length - checkedIn,
      participants.length ? Math.round(checkedIn / participants.length * 100) : 0
    ]]);
  });

  sh.setColumnWidth(1, 380);
  sh.setFrozenRows(4);
  sh.getRange('A1:H' + (rowIdx - 1)).setVerticalAlignment('middle');
  return sh;
}

/**
 * DATA CONTOH — 3 event + beberapa peserta & pendaftaran.
 * Aman dijalankan berulang (data lama dengan judul sama tidak diduplikasi).
 */
function seedSampleData() {
  setupDatabase();
  var created = { events: 0, participants: 0, registrations: 0 };

  var samples = [
    {
      title: 'Workshop Sertifikasi Kompetensi SDM Kelautan dan Perikanan',
      category: 'Sertifikasi',
      description: 'Workshop tiga hari untuk meningkatkan kompetensi SDM kelautan melalui sertifikasi profesional yang diakui secara nasional.',
      info: 'Materi mencakup pemetaan kompetensi sektor kelautan dan praktik penilaian oleh asesor berlisensi.',
      startDate: '2026-03-16T08:00',
      endDate: '2026-03-18T16:00',
      venue: 'Aula Utama Pusat Standardisasi',
      city: 'Jakarta',
      maxParticipants: 120,
      imageUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&q=80'
    },
    {
      title: 'Seminar Nasional Inovasi Perikanan Berkelanjutan',
      category: 'Seminar',
      description: 'Pertemuan praktisi, akademisi, dan pembuat kebijakan membahas inovasi teknologi perikanan berkelanjutan Indonesia.',
      info: 'Topik utama: budidaya laut dalam, pemantauan stok ikan berbasis AI, dan kebijakan perikanan berkelanjutan.',
      startDate: '2026-04-09T09:00',
      endDate: '2026-04-09T17:00',
      venue: 'Gedung Konvensi Maritim',
      city: 'Surabaya',
      maxParticipants: 300,
      imageUrl: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&q=80'
    },
    {
      title: 'Pelatihan Audit Internal Sistem Manajemen Mutu Perikanan',
      category: 'Pelatihan',
      description: 'Pelatihan intensif auditor internal sistem manajemen mutu sektor perikanan sesuai standar nasional dan internasional.',
      info: 'Peserta mempelajari teknik audit, penyusunan laporan, dan tindakan korektif-preventif.',
      startDate: '2026-05-20T08:30',
      endDate: '2026-05-22T16:30',
      venue: 'Balai Pelatihan Kelautan',
      city: 'Makassar',
      maxParticipants: 60,
      imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&q=80'
    }
  ];

  var events = [];
  samples.forEach(function (s) {
    var existing = findOne_(SHEETS.EVENTS, 'title', s.title);
    if (existing) {
      events.push(existing);
    } else {
      var created2 = createEvent(s);
      events.push(findOne_(SHEETS.EVENTS, 'id', created2.id));
      created.events++;
    }
  });

  // Peserta contoh untuk event pertama (satu sudah check-in)
  var demo = [
    { fullName: 'Dr. Andi Wijaya', email: 'andi.wijaya@kkp.go.id', phone: '0812111122233', organization: 'Kementerian Kelautan dan Perikanan', position: 'Kepala Subdirektorat', address: 'Jakarta Pusat', checkIn: false },
    { fullName: 'Siti Rahmawati, S.Pi', email: 'siti.rahmawati@unhas.ac.id', phone: '0822111122233', organization: 'Universitas Hasanuddin', position: 'Dosen Perikanan', address: 'Makassar', checkIn: true },
    { fullName: 'Bayu Prasetyo, M.Sc', email: 'bayu.prasetyo@bpip.go.id', phone: '0853111122233', organization: 'BRSDM Kelautan', position: 'Peneliti', address: 'Jakarta Selatan', checkIn: false }
  ];

  var target = events[0];
  demo.forEach(function (d) {
    var existingReg = findRegistrationByEmail(target.id, d.email);
    if (existingReg) return;
    var result = createRegistration(target.id, {
      fullName: d.fullName, email: d.email, phone: d.phone,
      organization: d.organization, position: d.position, address: d.address
    });
    created.participants++;
    created.registrations++;
    if (d.checkIn) {
      checkIn(result.registration.qrCode, 'Petugas Demo');
    }
  });

  return created;
}
