/**
 * ============================================================================
 *  SIMANEV PSSDM — Sistem Manajemen Event
 *  File   : WebAppApi.gs
 *  Fungsi : Fungsi server yang dipanggil dari browser (google.script.run)
 *           dan dari API eksternal (doPost / gadget Blogger).
 * ============================================================================
 */

/** Data halaman utama (portal): event mendatang + statistik ringkas */
function apiGetHome() {
  var events = listEvents();
  var now = new Date().getTime();
  var upcoming = events.filter(function (e) {
    return parseDate_(e.endDate ? e.endDate : e.startDate).getTime() >= now;
  });
  var past = events.filter(function (e) { return upcoming.indexOf(e) === -1; });

  return {
    ok: true,
    config: publicConfig_(),
    upcoming: decorateEvents_(upcoming),
    past: decorateEvents_(past).slice(0, 3),
    stats: globalStats_()
  };
}

/** Daftar semua event (untuk halaman Events & Register) */
function apiGetEvents() {
  return { ok: true, config: publicConfig_(), events: decorateEvents_(listEvents()) };
}

/** Detail satu event + sisa kuota */
function apiGetEvent(slug) {
  var event = getEventBySlug(slug);
  if (!event) return { ok: false, message: 'Event tidak ditemukan.' };
  var participants = listEventParticipants(event.id);
  var checkedIn = participants.filter(function (p) {
    return p.registration.status === REG_STATUS.CHECKED_IN;
  }).length;
  return {
    ok: true,
    config: publicConfig_(),
    event: decorateEvent_(event),
    registered: participants.length,
    checkedIn: checkedIn,
    seatsLeft: Math.max(Number(event.maxParticipants) - participants.length, 0)
  };
}

/**
 * Pendaftaran peserta: validasi input -> simpan -> generate tiket & QR.
 * Mengembalikan bundle tiket untuk langsung ditampilkan sebagai e-ticket.
 */
function apiRegister(form) {
  try {
    var data = form || {};
    var eventId = clean_(data.eventId);
    var fullName = clean_(data.fullName);
    var email = clean_(data.email).toLowerCase();

    if (!eventId) return { ok: false, message: 'Event tidak dipilih.' };
    if (!fullName) return { ok: false, message: 'Nama lengkap wajib diisi.' };
    if (!isEmail_(email)) return { ok: false, message: 'Format email tidak valid.' };

    var result = createRegistration(eventId, {
      fullName: fullName,
      email: email,
      phone: clean_(data.phone),
      organization: clean_(data.organization),
      position: clean_(data.position),
      address: clean_(data.address)
    });

    var bundle = {
      registration: result.registration,
      participant: result.participant,
      event: result.event
    };

    // Kirim e-ticket via email (gagal kirim tidak membatalkan pendaftaran)
    var emailStatus = 'skipped';
    try {
      var sent = sendTicketEmail(result.registration.qrCode);
      emailStatus = 'sent:' + sent.sentTo;
    } catch (err) {
      emailStatus = 'failed:' + err.message;
    }

    return {
      ok: true,
      message: 'Pendaftaran berhasil. Nomor tiket Anda: ' + result.registration.ticketNumber,
      emailStatus: emailStatus,
      ticket: decorateTicket_(bundle),
      ticketHtml: buildTicketHtml_(bundle)
    };
  } catch (err) {
    return { ok: false, message: err.message };
  }
}

/** Ambil e-ticket berdasarkan kode QR / nomor tiket */
function apiGetTicket(code) {
  var bundle = getTicketBundle(parseQrPayload_(code));
  if (!bundle) return { ok: false, message: 'Tiket tidak ditemukan. Periksa kembali kode Anda.' };
  return {
    ok: true,
    ticket: decorateTicket_(bundle),
    ticketHtml: buildTicketHtml_(bundle)
  };
}

/** Pratinjau tiket tanpa melakukan check-in (validasi manual petugas) */
function apiLookup(code) {
  var bundle = getTicketBundle(parseQrPayload_(code));
  if (!bundle) return { ok: false, message: 'QR tidak dikenali.' };
  return { ok: true, ticket: decorateTicket_(bundle) };
}

/** Check-in + validasi kehadiran otomatis */
function apiCheckIn(code, scannerName) {
  var result = checkIn(code, scannerName || APP_CONFIG.SCANNER_NAME);
  return {
    ok: result.ok,
    code: result.code,
    duplicate: !!result.duplicate,
    message: result.message,
    ticket: result.ticket ? decorateTicket_(result.ticket) : null,
    recent: recentCheckins(10)
  };
}

/** Riwayat scan terbaru */
function apiRecentCheckins(limit) {
  return { ok: true, recent: recentCheckins(limit || 20) };
}

/** Data dashboard: statistik global, laporan per event, scan terakhir */
function apiGetDashboard() {
  var events = listEvents();
  var perEvent = decorateEvents_(events).map(function (e) {
    var participants = listEventParticipants(e.id);
    var checkedIn = participants.filter(function (p) {
      return p.registration.status === REG_STATUS.CHECKED_IN;
    }).length;
    return {
      id: e.id,
      title: e.title,
      slug: e.slug,
      dateShort: e.dateShort,
      venue: e.venue,
      city: e.city,
      quota: e.maxParticipants,
      registered: participants.length,
      checkedIn: checkedIn,
      pending: participants.length - checkedIn,
      rate: participants.length ? Math.round(checkedIn / participants.length * 100) : 0,
      status: e.status,
      bloggerUrl: e.bloggerUrl
    };
  });

  return {
    ok: true,
    config: publicConfig_(),
    stats: globalStats_(),
    events: perEvent,
    recent: recentCheckins(12)
  };
}

/** Daftar peserta sebuah event (untuk tabel dashboard) */
function apiEventParticipants(eventId) {
  return {
    ok: true,
    participants: listEventParticipants(eventId).map(function (item) {
      return {
        ticketNumber: item.registration.ticketNumber,
        qrCode: item.registration.qrCode,
        status: item.registration.status,
        checkedInAt: toIso_(item.registration.checkedInAt),
        checkedInBy: item.registration.checkedInBy,
        fullName: item.participant ? item.participant.fullName : '-',
        email: item.participant ? item.participant.email : '-',
        organization: item.participant ? item.participant.organization : '-',
        ticketUrl: qrImageUrl(buildQrPayload_(item.registration), 120)
      };
    })
  };
}

/* ========================== HELPER RESPONSE ============================= */

/** Konfigurasi yang boleh diketahui klien */
function publicConfig_() {
  return {
    appName: APP_CONFIG.APP_NAME,
    appShort: APP_CONFIG.APP_SHORT,
    tagline: APP_CONFIG.APP_TAGLINE,
    appUrl: APP_CONFIG.APP_URL,
    blogUrl: APP_CONFIG.BLOG_URL,
    contact: {
      email: APP_CONFIG.CONTACT_EMAIL,
      phone: APP_CONFIG.CONTACT_PHONE,
      address: APP_CONFIG.CONTACT_ADDRESS
    }
  };
}

/** Tambahkan kolom bantu tampilan pada daftar event */
function decorateEvents_(events) {
  return events.map(decorateEvent_);
}

function decorateEvent_(event) {
  var out = {};
  Object.keys(event).forEach(function (k) { out[k] = event[k]; });
  out.dateLong = fmtDateLong_(event.startDate);
  out.dateShort = fmtDateShort_(event.startDate);
  out.startTime = fmtTime_(event.startDate);
  out.endTime = fmtTime_(event.endDate);
  out.isUpcoming = parseDate_(event.endDate ? event.endDate : event.startDate).getTime() >= new Date().getTime();
  out.isOpen = String(event.status) === EVENT_STATUS.OPEN;
  out.badge = out.isOpen ? 'Pendaftaran Dibuka' : (String(event.status) === EVENT_STATUS.DONE ? 'Selesai' : 'Ditutup');
  return out;
}

/** Tambahkan kolom bantu tampilan pada tiket (termasuk URL QR) */
function decorateTicket_(bundle) {
  var reg = bundle.registration;
  var out = {
    registration: reg,
    participant: bundle.participant,
    event: decorateEvent_(bundle.event),
    qrUrl: qrImageUrl(buildQrPayload_(reg), APP_CONFIG.QR_SIZE),
    qrPayload: buildQrPayload_(reg),
    checkedIn: reg.status === REG_STATUS.CHECKED_IN,
    checkedInLong: reg.checkedInAt ? (fmtDateLong_(reg.checkedInAt) + ' ' + fmtTime_(reg.checkedInAt)) : '',
    initials: bundle.participant ? initials_(bundle.participant.fullName) : ''
  };
  return out;
}

/** Statistik global untuk dashboard */
function globalStats_() {
  var participants = readAll_(SHEETS.PARTICIPANTS);
  var registrations = readAll_(SHEETS.REGISTRATIONS);
  var events = readAll_(SHEETS.EVENTS);
  var checkedIn = registrations.filter(function (r) {
    return String(r.status) === REG_STATUS.CHECKED_IN;
  }).length;
  return {
    totalEvents: events.length,
    totalParticipants: participants.length,
    totalRegistrations: registrations.length,
    totalCheckedIn: checkedIn,
    totalPending: registrations.length - checkedIn,
    attendanceRate: registrations.length ? Math.round(checkedIn / registrations.length * 100) : 0
  };
}
