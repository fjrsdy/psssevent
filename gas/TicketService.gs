/**
 * ============================================================================
 *  SIMANEV PSSDM — Sistem Manajemen Event
 *  File   : TicketService.gs
 *  Fungsi : Membangun HTML e-ticket + kirim email e-ticket otomatis
 * ============================================================================
 */

/**
 * Susun HTML e-ticket (dipakai untuk halaman web & isi email).
 * Inline CSS agar aman dibuka di Gmail, Outlook, dan browser HP.
 */
function buildTicketHtml_(bundle) {
  var reg = bundle.registration;
  var p = bundle.participant || {};
  var e = bundle.event || {};
  var qrUrl = qrImageUrl(buildQrPayload_(reg));

  var statusLabel = reg.status === REG_STATUS.CHECKED_IN ? 'SUDAH CHECK-IN' : 'AKTIF';
  var statusColor = reg.status === REG_STATUS.CHECKED_IN ? '#059669' : '#f59e0b';

  var html = '' +
    '<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;' +
    'background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #e2e8f0;">' +

    '<div style="background:linear-gradient(135deg,#0f3d4a,#0b2e4a);padding:28px 26px;color:#ffffff;">' +
      '<div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#93c5fd;font-weight:bold;">' +
        APP_CONFIG.APP_NAME + '</div>' +
      '<div style="font-size:22px;font-weight:bold;margin-top:8px;line-height:1.3;">E-Ticket Peserta</div>' +
      '<div style="font-size:12px;color:#cbd5e1;margin-top:4px;">' + escapeHtml_(e.title || '') + '</div>' +
    '</div>' +

    '<div style="padding:22px 26px;">' +
      '<table style="width:100%;border-collapse:collapse;font-size:13px;">' +
        ticketRow_('No. Tiket', '<b style="color:#0f3d4a;">' + escapeHtml_(reg.ticketNumber) + '</b>') +
        ticketRow_('Nama Peserta', escapeHtml_(p.fullName || '-')) +
        ticketRow_('Email', escapeHtml_(p.email || '-')) +
        ticketRow_('Instansi', escapeHtml_(p.organization || '-')) +
        ticketRow_('Tanggal', escapeHtml_(fmtDateLong_(e.startDate))) +
        ticketRow_('Waktu', escapeHtml_(fmtTime_(e.startDate) + ' - ' + fmtTime_(e.endDate))) +
        ticketRow_('Lokasi', escapeHtml_((e.venue || '-') + (e.city ? ', ' + e.city : ''))) +
      '</table>' +

      '<div style="text-align:center;margin-top:22px;padding:18px;background:#f1f5f9;border-radius:18px;">' +
        '<img src="' + qrUrl + '" width="190" height="190" alt="QR Code" style="display:block;margin:0 auto;" />' +
        '<div style="font-family:monospace;font-size:12px;letter-spacing:2px;color:#334155;margin-top:12px;font-weight:bold;">' +
          escapeHtml_(reg.qrCode) + '</div>' +
        '<div style="font-size:11px;color:#64748b;margin-top:6px;">Tunjukkan QR Code ini kepada petugas saat check-in</div>' +
      '</div>' +
    '</div>' +

    '<div style="background:' + statusColor + ';padding:14px;text-align:center;color:#ffffff;font-weight:bold;font-size:13px;">' +
      'STATUS: ' + statusLabel +
    '</div>' +

    '<div style="background:#0f172a;padding:16px 26px;color:#94a3b8;font-size:11px;line-height:1.7;">' +
      escapeHtml_(APP_CONFIG.APP_TAGLINE) + '<br/>' +
      escapeHtml_(APP_CONFIG.CONTACT_ADDRESS) + ' &middot; ' + escapeHtml_(APP_CONFIG.CONTACT_PHONE) +
    '</div>' +
    '</div>';

  return html;
}

function ticketRow_(label, value) {
  return '<tr>' +
    '<td style="padding:8px 0;color:#64748b;width:38%;vertical-align:top;">' + label + '</td>' +
    '<td style="padding:8px 0;color:#0f172a;">' + value + '</td>' +
    '</tr>';
}

/** Dapatkan HTML e-ticket berdasarkan kode tiket/QR (untuk halaman web) */
function getTicketHtml(code) {
  var bundle = getTicketBundle(parseQrPayload_(code));
  if (!bundle) return '<div style="padding:20px;font-family:Arial;">Tiket tidak ditemukan.</div>';
  return buildTicketHtml_(bundle);
}

/**
 * Kirim e-ticket + QR Code ke email peserta.
 * Gambar QR disematkan sebagai inline image (cid) agar tampil di semua klien.
 */
function sendTicketEmail(code) {
  var bundle = getTicketBundle(parseQrPayload_(code));
  if (!bundle) throw new Error('Tiket tidak ditemukan.');
  if (!bundle.participant || !bundle.participant.email) throw new Error('Email peserta tidak tersedia.');

  var qrCid = 'qrcode_' + newQrToken_();
  var html = buildTicketHtml_(bundle).replace(
    qrImageUrl(buildQrPayload_(bundle.registration)),
    'cid:' + qrCid
  );

  var subject = APP_CONFIG.EMAIL_SUBJECT_PREFIX + ' E-Ticket ' +
    bundle.registration.ticketNumber + ' — ' + bundle.event.title;

  var mailOptions = {
    htmlBody: html,
    inlineImages: {},
    name: APP_CONFIG.APP_SHORT
  };
  mailOptions.inlineImages[qrCid] = qrImageBlob_(buildQrPayload_(bundle.registration));

  MailApp.sendEmail(bundle.participant.email, subject, 'E-ticket Anda terlampir.', mailOptions);

  logInfo_('E-ticket terkirim', bundle.participant.email);
  return { ok: true, sentTo: bundle.participant.email, ticketNumber: bundle.registration.ticketNumber };
}

/** Kirim e-ticket untuk semua peserta sebuah event */
function sendAllTicketsForEvent(eventId) {
  var results = { sent: 0, failed: 0, errors: [] };
  listEventParticipants(eventId).forEach(function (item) {
    try {
      sendTicketEmail(item.registration.qrCode);
      results.sent++;
      Utilities.sleep(500); // hindari pembatasan kuota email
    } catch (err) {
      results.failed++;
      results.errors.push(item.participant.email + ': ' + err.message);
    }
  });
  return results;
}

/** Kirim pengingat (reminder) ke peserta yang belum check-in */
function sendRemindersForEvent(eventId) {
  var event = getEventById(eventId);
  if (!event) throw new Error('Event tidak ditemukan.');
  var sent = 0;
  listEventParticipants(eventId).forEach(function (item) {
    if (item.registration.status !== REG_STATUS.REGISTERED) return;
    var qrUrl = qrForRegistration_(item.registration);
    var html =
      '<div style="font-family:Arial;font-size:14px;color:#0f172a;">' +
      '<p>Yth. <b>' + escapeHtml_(item.participant.fullName) + '</b>,</p>' +
      '<p>Ini pengingat bahwa Anda terdaftar pada:</p>' +
      '<p><b>' + escapeHtml_(event.title) + '</b><br/>' +
      escapeHtml_(fmtDateLong_(event.startDate) + ' ' + fmtTime_(event.startDate)) + '<br/>' +
      escapeHtml_(event.venue + ', ' + event.city) + '</p>' +
      '<p>No. Tiket Anda: <b>' + escapeHtml_(item.registration.ticketNumber) + '</b></p>' +
      '<p style="text-align:center"><img src="' + qrUrl + '" width="180" height="180"/></p>' +
      '<p>Mohon tunjukkan QR di atas saat check-in. Terima kasih.</p>' +
      '<p style="color:#64748b;font-size:12px;">' + escapeHtml_(APP_CONFIG.APP_TAGLINE) + '</p>' +
      '</div>';
    MailApp.sendEmail(item.participant.email,
      APP_CONFIG.EMAIL_SUBJECT_PREFIX + ' Pengingat Event: ' + event.title,
      'Pengingat event Anda.', { htmlBody: html, name: APP_CONFIG.APP_SHORT });
    sent++;
    Utilities.sleep(400);
  });
  return { ok: true, sent: sent };
}
