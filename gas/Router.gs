/**
 * ============================================================================
 *  SIMANEV PSSDM — Sistem Manajemen Event
 *  File   : Router.gs
 *  Fungsi : Router Web App (doGet) + JSON API (doPost) + include template
 * ============================================================================
 */

/**
 * ROUTER HALAMAN (Web App)
 * URL: .../exec?page=home|events|event|register|ticket|scan|dashboard
 *
 * Semua halaman dirender oleh satu SPA (Index.html) lalu routing dilakukan
 * di sisi klien berdasarkan parameter `page`. Halaman `checkin` akan langsung
 * memproses check-in otomatis dari tautan QR.
 */
function doGet(e) {
  var params = (e && e.parameter) ? e.parameter : {};
  var page = String(params.page || 'home').toLowerCase();

  var allowed = ['home', 'events', 'event', 'register', 'ticket', 'scan',
    'checkin', 'dashboard', 'admin'];

  var template = HtmlService.createTemplateFromFile('Index');
  template.page = allowed.indexOf(page) > -1 ? page : 'home';
  template.slug = params.slug || params.event || '';
  template.code = params.code || '';
  template.appUrl = APP_CONFIG.APP_URL || '';

  return template
    .evaluate()
    .setTitle(APP_CONFIG.APP_NAME + ' — Manajemen Event')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1')
    .setFaviconUrl('https://ssl.gstatic.com/docs/spreadsheets/favicon3.ico')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * JSON API (dipakai gadget Blogger, scanner eksternal, integrasi lain).
 * Contoh:
 *   POST /exec  {"action":"publicEvents"}
 *   POST /exec  {"action":"checkin","code":"PSSDM-AB12CD34","scanner":"Petugas 1"}
 *   POST /exec  {"action":"ticket","code":"TIC-0001-0001"}
 */
function doPost(e) {
  var body = {};
  try {
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }
  } catch (err) {
    body = {};
  }
  if (!body.action && e && e.parameter) body.action = e.parameter.action;
  if (!body.code && e && e.parameter) body.code = e.parameter.code;

  var result;
  try {
    switch (String(body.action || '')) {
      case 'publicEvents':
        result = { ok: true, events: decorateEvents_(listEvents()) };
        break;
      case 'event':
        result = apiGetEvent(body.slug);
        break;
      case 'register':
        result = apiRegister(body);
        break;
      case 'ticket':
        result = apiGetTicket(body.code);
        break;
      case 'lookup':
        result = apiLookup(body.code);
        break;
      case 'checkin':
        result = apiCheckIn(body.code, body.scanner);
        break;
      case 'dashboard':
        result = apiGetDashboard();
        break;
      case 'participants':
        result = apiEventParticipants(body.eventId);
        break;
      case 'health':
        result = { ok: true, app: APP_CONFIG.APP_NAME, time: toIso_(new Date()) };
        break;
      default:
        result = {
          ok: false,
          message: 'Aksi tidak dikenal. Gunakan: publicEvents, event, register, ' +
            'ticket, lookup, checkin, dashboard, participants, health.'
        };
    }
  } catch (err) {
    result = { ok: false, message: err.message };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Sertakan sub-template HTML (Styles/Scripts) */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
