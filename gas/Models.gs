/**
 * ============================================================================
 *  SIMANEV PSSDM — Sistem Manajemen Event
 *  File   : Models.gs
 *  Fungsi : Model data Event, Participant, Registration + validasi kehadiran
 * ============================================================================
 */

/* ============================== EVENTS ================================== */

function listEvents() {
  return readAll_(SHEETS.EVENTS)
    .map(function (e) { return serialize_(e, true); })
    .sort(function (a, b) { return String(b.startDate).localeCompare(String(a.startDate)); });
}

function getEventById(id) {
  return serialize_(findOne_(SHEETS.EVENTS, 'id', id), true);
}

function getEventBySlug(slug) {
  return serialize_(findOne_(SHEETS.EVENTS, 'slug', slug), true);
}

function createEvent(data) {
  var title = clean_(data.title);
  if (!title) throw new Error('Judul event wajib diisi.');

  var baseSlug = slugify_(title);
  var slug = baseSlug;
  var n = 1;
  while (findOne_(SHEETS.EVENTS, 'slug', slug)) {
    slug = baseSlug + '-' + (++n);
  }

  var event = {
    id: newId_('EVT', SHEETS.EVENTS),
    title: title,
    slug: slug,
    category: clean_(data.category) || 'Pelatihan',
    description: clean_(data.description),
    info: clean_(data.info),
    startDate: data.startDate ? new Date(data.startDate) : new Date(),
    endDate: data.endDate ? new Date(data.endDate) : new Date(),
    venue: clean_(data.venue) || '-',
    city: clean_(data.city) || '-',
    maxParticipants: Number(data.maxParticipants) || APP_CONFIG.DEFAULT_MAX_PARTICIPANTS,
    status: clean_(data.status) || EVENT_STATUS.OPEN,
    imageUrl: clean_(data.imageUrl),
    bloggerPostId: '',
    bloggerUrl: '',
    createdAt: new Date()
  };
  insertRow_(SHEETS.EVENTS, event);
  return serialize_(event, true);
}

function updateEvent(id, changes) {
  var row = findOne_(SHEETS.EVENTS, 'id', id);
  if (!row) throw new Error('Event tidak ditemukan.');
  var allowed = ['title', 'category', 'description', 'info', 'startDate', 'endDate',
    'venue', 'city', 'maxParticipants', 'status', 'imageUrl'];
  var payload = {};
  allowed.forEach(function (key) {
    if (changes[key] !== undefined) payload[key] = changes[key];
  });
  updateRow_(SHEETS.EVENTS, row._row, payload);
  return getEventById(id);
}

/* ============================ PARTICIPANTS =============================== */

function createParticipant(data) {
  var participant = {
    id: newId_('PES', SHEETS.PARTICIPANTS),
    fullName: clean_(data.fullName),
    email: clean_(data.email).toLowerCase(),
    phone: clean_(data.phone),
    organization: clean_(data.organization),
    position: clean_(data.position),
    address: clean_(data.address),
    createdAt: new Date()
  };
  insertRow_(SHEETS.PARTICIPANTS, participant);
  return serialize_(participant, true);
}

function getParticipantById(id) {
  return serialize_(findOne_(SHEETS.PARTICIPANTS, 'id', id), true);
}

/* =========================== REGISTRATIONS ============================== */

/** Jumlah peserta terdaftar pada sebuah event */
function countRegistrations(eventId) {
  return findAll_(SHEETS.REGISTRATIONS, 'eventId', eventId)
    .filter(function (r) { return r.status !== REG_STATUS.CANCELLED; }).length;
}

/** Cek apakah email sudah terdaftar pada event */
function findRegistrationByEmail(eventId, email) {
  var target = clean_(email).toLowerCase();
  var regs = findAll_(SHEETS.REGISTRATIONS, 'eventId', eventId);
  for (var i = 0; i < regs.length; i++) {
    var p = findOne_(SHEETS.PARTICIPANTS, 'id', regs[i].participantId);
    if (p && String(p.email).toLowerCase() === target) return regs[i];
  }
  return null;
}

/** Buat pendaftaran baru + generate nomor tiket & QR code */
function createRegistration(eventId, participant) {
  var event = findOne_(SHEETS.EVENTS, 'id', eventId);
  if (!event) throw new Error('Event tidak ditemukan.');

  if (String(event.status) !== EVENT_STATUS.OPEN) {
    throw new Error('Pendaftaran event ini sudah ditutup.');
  }

  var total = countRegistrations(eventId);
  var quota = Number(event.maxParticipants) || APP_CONFIG.DEFAULT_MAX_PARTICIPANTS;
  if (total >= quota) {
    throw new Error('Kuota peserta sudah penuh (' + quota + ' peserta).');
  }

  var existing = findRegistrationByEmail(eventId, participant.email);
  if (existing) {
    throw new Error('Email ini sudah terdaftar dengan nomor tiket ' + existing.ticketNumber + '.');
  }

  var person = createParticipant(participant);
  var seq = nextSeq_(SHEETS.REGISTRATIONS);
  var eventSeq = String(event.id).split('-')[1];

  var registration = {
    id: newId_('REG', SHEETS.REGISTRATIONS),
    eventId: eventId,
    participantId: person.id,
    ticketNumber: 'TIC-' + pad_(eventSeq, 4) + '-' + pad_(seq, 4),
    qrCode: 'PSSDM-' + newQrToken_(),
    status: REG_STATUS.REGISTERED,
    checkedInAt: '',
    checkedInBy: '',
    registeredAt: new Date()
  };
  insertRow_(SHEETS.REGISTRATIONS, registration);

  return {
    registration: serialize_(registration, true),
    participant: person,
    event: serialize_(event, true)
  };
}

/** Ambil data tiket lengkap berdasarkan kode QR / nomor tiket / ID */
function getTicketBundle(code) {
  var reg = findOne_(SHEETS.REGISTRATIONS, 'qrCode', code) ||
            findOne_(SHEETS.REGISTRATIONS, 'ticketNumber', code) ||
            findOne_(SHEETS.REGISTRATIONS, 'id', code);
  if (!reg) return null;
  var participant = findOne_(SHEETS.PARTICIPANTS, 'id', reg.participantId);
  var event = findOne_(SHEETS.EVENTS, 'id', reg.eventId);
  return {
    registration: serialize_(reg, true),
    participant: serialize_(participant, true),
    event: serialize_(event, true)
  };
}

/** Daftar peserta sebuah event (untuk dashboard) */
function listEventParticipants(eventId) {
  var out = [];
  findAll_(SHEETS.REGISTRATIONS, 'eventId', eventId).forEach(function (reg) {
    var p = findOne_(SHEETS.PARTICIPANTS, 'id', reg.participantId);
    out.push({
      registration: serialize_(reg, true),
      participant: serialize_(p, true)
    });
  });
  return out;
}

/**
 * CHECK-IN + VALIDASI KEHADIRAN OTOMATIS
 * Mengembalikan object hasil, tidak pernah melempar error ke klien.
 */
function checkIn(code, scannerName) {
  var scannedBy = clean_(scannerName) || APP_CONFIG.SCANNER_NAME;
  var parsedCode = parseQrPayload_(code);
  var bundle = getTicketBundle(parsedCode);

  if (!bundle) {
    writeCheckinLog_('', parsedCode, 'NOT_FOUND', scannedBy);
    return {
      ok: false,
      code: 'NOT_FOUND',
      message: 'QR Code tidak dikenali. Tiket tidak terdaftar dalam sistem.'
    };
  }

  var reg = bundle.registration;
  var logId = reg.id;

  if (reg.status === REG_STATUS.CANCELLED) {
    writeCheckinLog_(logId, parsedCode, 'CANCELLED', scannedBy);
    return {
      ok: false, code: 'CANCELLED',
      message: 'Tiket telah dibatalkan. Hubungi panitia.',
      ticket: bundle
    };
  }

  if (reg.status === REG_STATUS.CHECKED_IN) {
    writeCheckinLog_(logId, parsedCode, 'DUPLICATE', scannedBy);
    return {
      ok: true, duplicate: true, code: 'DUPLICATE',
      message: 'Peserta SUDAH check-in sebelumnya pada ' +
        fmtDateLong_(reg.checkedInAt) + ' ' + fmtTime_(reg.checkedInAt) + '.',
      ticket: bundle
    };
  }

  // Validasi jadwal: tidak bisa check-in lebih dari 1 hari sebelum event
  var event = bundle.event;
  var startAt = parseDate_(event.startDate);
  if (startAt) {
    var now = new Date();
    var tooEarly = (startAt.getTime() - now.getTime()) > 24 * 60 * 60 * 1000;
    if (tooEarly) {
      writeCheckinLog_(logId, parsedCode, 'TOO_EARLY', scannedBy);
      return {
        ok: false, code: 'TOO_EARLY',
        message: 'Check-in belum dibuka. Event dimulai ' + fmtDateLong_(event.startDate) + '.',
        ticket: bundle
      };
    }
  }

  var row = findOne_(SHEETS.REGISTRATIONS, 'id', reg.id);
  setCell_(SHEETS.REGISTRATIONS, row._row, 'status', REG_STATUS.CHECKED_IN);
  setCell_(SHEETS.REGISTRATIONS, row._row, 'checkedInAt', new Date());
  setCell_(SHEETS.REGISTRATIONS, row._row, 'checkedInBy', scannedBy);
  writeCheckinLog_(logId, parsedCode, 'SUCCESS', scannedBy);

  return {
    ok: true, duplicate: false, code: 'SUCCESS',
    message: 'Check-in berhasil. Kehadiran peserta tervalidasi otomatis.',
    ticket: getTicketBundle(reg.qrCode)
  };
}

/** Catat setiap percobaan scan (berhasil maupun gagal) */
function writeCheckinLog_(registrationId, code, result, scannerName) {
  insertRow_(SHEETS.CHECKIN_LOG, {
    id: newId_('LOG', SHEETS.CHECKIN_LOG),
    registrationId: registrationId || '',
    qrCode: code || '',
    result: result,
    scannerName: scannerName,
    scannedAt: new Date()
  });
}

/** Riwayat scan terbaru */
function recentCheckins(limit) {
  return readAll_(SHEETS.CHECKIN_LOG)
    .sort(function (a, b) {
      return new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime();
    })
    .slice(0, limit || 15)
    .map(function (row) {
      var bundle = row.registrationId ? getTicketBundle(row.registrationId) : null;
      return {
        result: row.result,
        scannerName: row.scannerName,
        scannedAt: toIso_(row.scannedAt),
        qrCode: row.qrCode,
        participantName: bundle && bundle.participant ? bundle.participant.fullName : 'Tidak dikenal',
        ticketNumber: bundle && bundle.registration ? bundle.registration.ticketNumber : '-'
      };
    });
}
