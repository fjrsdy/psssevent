/**
 * ============================================================================
 *  SIMANEV PSSDM — Sistem Manajemen Event
 *  File   : QrService.gs
 *  Fungsi : Generate QR Code (image URL & blob) + payload check-in
 * ============================================================================
 */

/**
 * Ambil payload yang di-encode ke dalam QR Code.
 * Jika APP_URL sudah diisi, QR berisi tautan check-in (bisa langsung dibuka
 * oleh aplikasi kamera HP). Jika tidak, QR hanya berisi kode tiket.
 */
function buildQrPayload_(registration) {
  var base = (APP_CONFIG.APP_URL || '').split('?')[0];
  var code = registration.qrCode;
  if (base) {
    var joiner = base.indexOf('?') > -1 ? '&' : '?';
    return base + joiner + 'page=checkin&code=' + encodeURIComponent(code);
  }
  return 'PSSDM|' + registration.ticketNumber + '|' + code;
}

/**
 * Ambil potongan kode dari payload QR apa pun bentuknya:
 *  - URL lengkap   : https://.../exec?page=checkin&code=PSSDM-AB12CD34
 *  - Format pipa   : PSSDM|TIC-0001-0001|PSSDM-AB12CD34
 *  - Kode langsung : PSSDM-AB12CD34 / TIC-0001-0001 / REG-000001
 */
function parseQrPayload_(raw) {
  var value = clean_(raw);
  if (!value) return '';

  // URL -> ambil parameter "code"
  if (value.indexOf('http') === 0) {
    var m = value.match(/[?&]code=([^&]+)/i);
    if (m) return decodeURIComponent(m[1]);
    // fallback: segmen terakhir setelah '?'
    var q = value.split('?')[0];
    var segs = q.split('/').filter(Boolean);
    return segs.length ? segs[segs.length - 1] : value;
  }

  // Format pipa -> ambil elemen terakhir
  if (value.indexOf('|') > -1) {
    var parts = value.split('|').filter(Boolean);
    return parts[parts.length - 1];
  }

  return value;
}

/** URL gambar QR Code (PNG) siap dipakai di <img> atau email */
function qrImageUrl(text, size) {
  var s = size || APP_CONFIG.QR_SIZE;
  return 'https://api.qrserver.com/v1/create-qr-code/?size=' + s + 'x' + s +
    '&margin=8&bgcolor=ffffff&color=0f172a&data=' + encodeURIComponent(text);
}

/** Blob gambar QR (dipakai untuk lampiran gambar inline di email) */
function qrImageBlob_(text) {
  var url = qrImageUrl(text, 400);
  var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  if (response.getResponseCode() !== 200) {
    throw new Error('Gagal membuat gambar QR: ' + response.getContentText());
  }
  return response.getBlob().setName('qr-ticket.png');
}

/** QR URL untuk sebuah pendaftaran */
function qrForRegistration_(registration) {
  return qrImageUrl(buildQrPayload_(registration));
}
