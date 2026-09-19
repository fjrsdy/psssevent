/**
 * ============================================================================
 *  SIMANEV PSSDM — Sistem Manajemen Event
 *  Pusat Standardisasi dan Sertifikasi SDM Kelautan dan Perikanan
 * ----------------------------------------------------------------------------
 *  File   : Config.gs
 *  Fungsi : Konfigurasi utama aplikasi (Spreadsheet, Blogger, Web App)
 * ============================================================================
 */

var APP_CONFIG = {
  // Nama aplikasi yang tampil di header e-ticket & email
  APP_NAME: 'SIMANEV PSSDM',
  APP_SHORT: 'PSSDM Kelautan & Perikanan',
  APP_TAGLINE: 'Pusat Standardisasi dan Sertifikasi SDM Kelautan dan Perikanan',

  // ------------------------------------------------------------------
  // WAJIB DILENGKAPI SETELAH DEPLOY PERTAMA
  // ------------------------------------------------------------------
  // ID Google Spreadsheet yang dipakai sebagai database.
  // Kosongkan ('') agar sistem otomatis membuat spreadsheet baru
  // saat menjalankan menu "Setup Database".
  SPREADSHEET_ID: '',

  // ID Blog Blogger (Blogger > Setelan > Blog ID) untuk publikasi event
  BLOG_ID: '',

  // URL publik blog, contoh: https://pssdm-event.blogspot.com
  BLOG_URL: '',

  // URL Web App hasil deploy (…/exec). Dipakai untuk membuat isi QR Code
  // berupa tautan check-in yang bisa langsung dibuka dari kamera HP.
  APP_URL: '',

  // ------------------------------------------------------------------
  // OPSIONAL
  // ------------------------------------------------------------------
  TIMEZONE: 'Asia/Jakarta',
  QR_SIZE: 220,
  EMAIL_SUBJECT_PREFIX: '[SIMANEV PSSDM]',
  DEFAULT_MAX_PARTICIPANTS: 100,
  SCANNER_NAME: 'Petugas Check-in',
  CONTACT_EMAIL: 'info@pssdm-kelautan.go.id',
  CONTACT_PHONE: '(021) 351-2345',
  CONTACT_ADDRESS: 'Jl. Medan Merdeka Timur No. 16, Jakarta Pusat'
};

/** Nama sheet (tabel) di Google Sheets */
var SHEETS = {
  EVENTS: 'Events',
  PARTICIPANTS: 'Participants',
  REGISTRATIONS: 'Registrations',
  CHECKIN_LOG: 'CheckinLog'
};

/** Header/kolom tiap sheet — urutan menentukan struktur spreadsheet */
var SCHEMA = {
  Events: [
    'id', 'title', 'slug', 'category', 'description', 'info',
    'startDate', 'endDate', 'venue', 'city', 'maxParticipants',
    'status', 'imageUrl', 'bloggerPostId', 'bloggerUrl', 'createdAt'
  ],
  Participants: [
    'id', 'fullName', 'email', 'phone', 'organization', 'position',
    'address', 'createdAt'
  ],
  Registrations: [
    'id', 'eventId', 'participantId', 'ticketNumber', 'qrCode',
    'status', 'checkedInAt', 'checkedInBy', 'registeredAt'
  ],
  CheckinLog: [
    'id', 'registrationId', 'qrCode', 'result', 'scannerName', 'scannedAt'
  ]
};

/** Status event */
var EVENT_STATUS = { OPEN: 'open', CLOSED: 'closed', DONE: 'done' };

/** Status pendaftaran */
var REG_STATUS = {
  REGISTERED: 'registered',
  CHECKED_IN: 'checked_in',
  CANCELLED: 'cancelled'
};

/** Kategori label untuk tampilan */
var CATEGORY_LABELS = {
  'Sertifikasi': 'Sertifikasi',
  'Seminar': 'Seminar',
  'Pelatihan': 'Pelatihan',
  'Workshop': 'Workshop',
  'Rapat': 'Rapat Koordinasi'
};
