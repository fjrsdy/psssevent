/**
 * ============================================================================
 *  SIMANEV PSSDM — Sistem Manajemen Event
 *  File   : Utils.gs
 *  Fungsi : Helper umum (format tanggal, string, validasi, id unik)
 * ============================================================================
 */

/** Format Date -> string ISO (yyyy-MM-dd'T'HH:mm:ss) */
function toIso_(value) {
  if (value === null || value === undefined || value === '') return '';
  if (Object.prototype.toString.call(value) === '[object Date]') {
    return Utilities.formatDate(value, APP_CONFIG.TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss");
  }
  return String(value);
}

/** Format Date -> "Senin, 15 Agustus 2025" */
function fmtDateLong_(value) {
  if (!value) return '-';
  var d = parseDate_(value);
  if (!d) return String(value);
  var days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  var months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  return days[d.getDay()] + ', ' + d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
}

/** Format Date -> "Sen, 15 Agu 2025" */
function fmtDateShort_(value) {
  if (!value) return '-';
  var d = parseDate_(value);
  if (!d) return String(value);
  var days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  var months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return days[d.getDay()] + ', ' + d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
}

/** Format Date -> "08:00 WIB" */
function fmtTime_(value) {
  if (!value) return '';
  var d = parseDate_(value);
  if (!d) return '';
  return Utilities.formatDate(d, APP_CONFIG.TIMEZONE, 'HH:mm') + ' WIB';
}

/** Konversi nilai sheet (Date/string) menjadi Date */
function parseDate_(value) {
  if (!value) return null;
  if (Object.prototype.toString.call(value) === '[object Date]') return value;
  var s = String(value).trim();
  var m = s.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (m) {
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]),
      Number(m[4]), Number(m[5]), Number(m[6] || 0));
  }
  var fallback = new Date(s);
  return isNaN(fallback.getTime()) ? null : fallback;
}

/** Normalisasi teks (trim + hilangkan spasi ganda) */
function clean_(value) {
  return String(value === null || value === undefined ? '' : value).trim().replace(/\s+/g, ' ');
}

/** Escape HTML untuk mencegah injection pada template */
function escapeHtml_(value) {
  return String(value === null || value === undefined ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Slug URL dari judul event */
function slugify_(text) {
  return clean_(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 80);
}

/** Validasi alamat email sederhana */
function isEmail_(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(clean_(value));
}

/** Awalan angka: 7 -> "007" */
function pad_(num, len) {
  var s = String(Math.abs(parseInt(num, 10) || 0));
  while (s.length < (len || 3)) s = '0' + s;
  return s;
}

/** Nomor urut unik per sheet (aman dengan LockService) */
function nextSeq_(sheetName) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var props = PropertiesService.getScriptProperties();
    var key = 'SEQ_' + sheetName;
    var n = Number(props.getProperty(key) || 0) + 1;
    props.setProperty(key, String(n));
    return n;
  } finally {
    lock.releaseLock();
  }
}

/** ID baru dengan format PREFIX-000123 */
function newId_(prefix, sheetName) {
  return prefix + '-' + pad_(nextSeq_(sheetName), 6);
}

/** Token unik untuk QR (8 karakter hexadecimal uppercase) */
function newQrToken_() {
  return Utilities.getUuid().replace(/-/g, '').substring(0, 8).toUpperCase();
}

/** Ambil inisial nama untuk avatar */
function initials_(name) {
  var parts = clean_(name).split(' ').filter(Boolean);
  var out = '';
  for (var i = 0; i < parts.length && out.length < 2; i++) out += parts[i].charAt(0);
  return out.toUpperCase();
}

/** Ambil email akun yang sedang menjalankan skrip */
function currentUserEmail_() {
  try {
    return Session.getActiveUser().getEmail() || APP_CONFIG.SCANNER_NAME;
  } catch (err) {
    return APP_CONFIG.SCANNER_NAME;
  }
}

/** Log ke console (terlihat di Eksekusi Apps Script) */
function logInfo_(message, data) {
  console.log('[SIMANEV] ' + message, data === undefined ? '' : data);
}
