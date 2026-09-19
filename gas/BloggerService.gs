/**
 * ============================================================================
 *  SIMANEV PSSDM — Sistem Manajemen Event
 *  File   : BloggerService.gs
 *  Fungsi : Publikasi informasi event ke Blogger (portal publik)
 * ----------------------------------------------------------------------------
 *  SYARAT:
 *  1. Aktifkan Advanced Service "Blogger API v3" pada editor Apps Script
 *     (Services + > Blogger API v3) — sudah dideklarasikan di appsscript.json.
 *  2. Isi APP_CONFIG.BLOG_ID dan APP_CONFIG.BLOG_URL.
 * ============================================================================
 */

/** Cek ketersediaan layanan Blogger */
function bloggerEnabled_() {
  if (typeof Blogger === 'undefined' || !APP_CONFIG.BLOG_ID) return false;
  return true;
}

/** Judul postingan Blogger untuk sebuah event */
function bloggerTitle_(event) {
  return '[' + (event.category || 'Event') + '] ' + event.title;
}

/** Label/kategori postingan */
function bloggerLabels_(event) {
  var labels = [event.category || 'Event', 'Pusat Standardisasi', 'SDM Kelautan dan Perikanan'];
  if (event.city) labels.push(event.city);
  return labels;
}

/**
 * Bangun HTML postingan Blogger.
 * Inline CSS karena Blogger menyaring atribut <style> pada beberapa tema.
 */
function buildEventPostHtml_(event) {
  var registerUrl = (APP_CONFIG.APP_URL ? APP_CONFIG.APP_URL : '') +
    (APP_CONFIG.APP_URL ? (APP_CONFIG.APP_URL.indexOf('?') > -1 ? '&' : '?') : '') +
    'page=register&event=' + encodeURIComponent(event.slug);

  var ticketUrl = (APP_CONFIG.APP_URL || '') +
    (APP_CONFIG.APP_URL ? (APP_CONFIG.APP_URL.indexOf('?') > -1 ? '&' : '?') : '') +
    'page=ticket';

  var card = function (label, value, icon) {
    return '<tr><td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;width:160px;' +
      'background:#f8fafc;color:#0f3d4a;font-weight:bold;white-space:nowrap;">' + (icon || '') + ' ' + label + '</td>' +
      '<td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;color:#334155;">' + value + '</td></tr>';
  };

  var quota = Number(event.maxParticipants) || APP_CONFIG.DEFAULT_MAX_PARTICIPANTS;
  var seatsLeft = Math.max(quota - countRegistrations(event.id), 0);
  var statusBadge = String(event.status) === EVENT_STATUS.OPEN
    ? '<span style="background:#dcfce7;color:#166534;padding:4px 12px;border-radius:999px;' +
      'font-size:12px;font-weight:bold;">PENDAFTARAN DIBUKA</span>'
    : '<span style="background:#fee2e2;color:#991b1b;padding:4px 12px;border-radius:999px;' +
      'font-size:12px;font-weight:bold;">PENDAFTARAN DITUTUP</span>';

  var html = '' +
    '<div style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;">' +
      '<p style="font-size:14px;line-height:1.8;">' + escapeHtml_(event.description || '') + '</p>' +
      (event.info ? '<p style="font-size:14px;line-height:1.8;color:#475569;">' + escapeHtml_(event.info) + '</p>' : '') +

      '<div style="margin:18px 0;">' + statusBadge + '</div>' +

      '<table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;' +
        'border-radius:12px;overflow:hidden;font-size:14px;">' +
        card('Tanggal', '<b>' + fmtDateLong_(event.startDate) + '</b>', '📅') +
        card('Waktu', fmtTime_(event.startDate) + ' &ndash; ' + fmtTime_(event.endDate), '⏰') +
        card('Tempat', escapeHtml_(event.venue || '-'), '📍') +
        card('Kota', escapeHtml_(event.city || '-'), '🏙️') +
        card('Kategori', escapeHtml_(event.category || '-'), '🏷️') +
        card('Kuota', quota + ' peserta &middot; <b>' + seatsLeft + ' kursi tersisa</b>', '🎟️') +
      '</table>' +

      '<div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:16px;padding:18px 20px;margin-top:22px;">' +
        '<div style="font-weight:bold;color:#0f3d4a;margin-bottom:6px;">Alur pendaftaran peserta</div>' +
        '<ol style="margin:0;padding-left:20px;font-size:14px;line-height:1.9;color:#334155;">' +
          '<li>Isi formulir pendaftaran online.</li>' +
          '<li>Sistem membuat <b>QR Code</b> dan <b>e-ticket</b> otomatis.</li>' +
          '<li>E-ticket dikirim ke email Anda (simpan / screenshot).</li>' +
          '<li>Saat hari-H, tunjukkan QR Code kepada petugas.</li>' +
          '<li>Petugas memindai QR &mdash; kehadiran tervalidasi <b>otomatis</b>.</li>' +
        '</ol>' +
      '</div>' +

      (registerUrl
        ? '<div style="text-align:center;margin:26px 0;">' +
            '<a href="' + registerUrl + '" style="background:#f59e0b;color:#0f172a;padding:14px 34px;' +
            'border-radius:12px;text-decoration:none;font-weight:bold;display:inline-block;' +
            'font-size:16px;">DAFTAR SEKARANG</a>' +
            '<div style="font-size:12px;color:#64748b;margin-top:10px;">' +
              'Sudah punya tiket? <a href="' + ticketUrl + '" style="color:#0f766e;">Lihat e-ticket</a>' +
            '</div>' +
          '</div>'
        : '') +

      '<p style="font-size:12px;color:#64748b;line-height:1.7;">' +
        'Informasi lebih lanjut: ' + escapeHtml_(APP_CONFIG.CONTACT_EMAIL) + ' &middot; ' +
        escapeHtml_(APP_CONFIG.CONTACT_PHONE) + '<br/>' + escapeHtml_(APP_CONFIG.APP_TAGLINE) +
      '</p>' +
    '</div>';

  return html;
}

/** Publikasikan (atau perbarui) sebuah event sebagai postingan Blogger */
function publishEventToBlogger(eventId) {
  if (!bloggerEnabled_()) {
    throw new Error('Layanan Blogger belum aktif. Aktifkan "Blogger API v3" pada Services ' +
      'dan isi APP_CONFIG.BLOG_ID di file Config.gs.');
  }

  var event = findOne_(SHEETS.EVENTS, 'id', eventId);
  if (!event) throw new Error('Event tidak ditemukan.');

  var body = {
    kind: 'blogger#post',
    title: bloggerTitle_(event),
    content: buildEventPostHtml_(serialize_(event, true)),
    labels: bloggerLabels_(event)
  };

  var post;
  if (event.bloggerPostId) {
    // Perbarui postingan yang sudah ada
    post = Blogger.Posts.update(body, APP_CONFIG.BLOG_ID, event.bloggerPostId);
    logInfo_('Postingan Blogger diperbarui', post.getId());
  } else {
    post = Blogger.Posts.insert(body, APP_CONFIG.BLOG_ID, { isDraft: false });
    setCell_(SHEETS.EVENTS, event._row, 'bloggerPostId', post.getId());
    logInfo_('Postingan Blogger dibuat', post.getId());
  }

  var url = (post.getUrl && post.getUrl()) ? post.getUrl() :
    (APP_CONFIG.BLOG_URL ? APP_CONFIG.BLOG_URL + '/' + post.getId() + '.html' : '');
  if (url) setCell_(SHEETS.EVENTS, event._row, 'bloggerUrl', url);

  return {
    ok: true,
    postId: post.getId(),
    url: url,
    title: bloggerTitle_(event)
  };
}

/** Publikasikan semua event berstatus open yang belum ada di Blogger */
function syncEventsToBlogger() {
  var results = { published: 0, updated: 0, failed: 0, errors: [] };
  readAll_(SHEETS.EVENTS).forEach(function (event) {
    try {
      var existed = !!event.bloggerPostId;
      publishEventToBlogger(event.id);
      if (existed) results.updated++; else results.published++;
    } catch (err) {
      results.failed++;
      results.errors.push(event.title + ': ' + err.message);
    }
  });
  return results;
}

/** Hapus postingan Blogger milik sebuah event */
function removeEventFromBlogger(eventId) {
  var event = findOne_(SHEETS.EVENTS, 'id', eventId);
  if (!event || !event.bloggerPostId) return { ok: false, message: 'Tidak ada postingan Blogger.' };
  if (!bloggerEnabled_()) throw new Error('Layanan Blogger belum aktif.');
  Blogger.Posts.remove(APP_CONFIG.BLOG_ID, event.bloggerPostId);
  setCell_(SHEETS.EVENTS, event._row, 'bloggerPostId', '');
  setCell_(SHEETS.EVENTS, event._row, 'bloggerUrl', '');
  return { ok: true, message: 'Postingan dihapus.' };
}

/**
 * Widget daftar event untuk sidebar Blogger (HTML/JavaScript).
 * Tempel hasil fungsi ini pada gadget HTML/JavaScript di Blogger.
 * Widget memanggil endpoint doPost Web App Anda.
 */
function buildBloggerWidgetScript() {
  if (!APP_CONFIG.APP_URL) throw new Error('Isi APP_CONFIG.APP_URL terlebih dahulu.');
  return '' +
    '<div id="pssdm-event-widget">Memuat event…</div>\n' +
    '<script>\n' +
    '(function(){\n' +
    '  var url = ' + JSON.stringify(APP_CONFIG.APP_URL) + ';\n' +
    '  fetch(url, {method:"POST",headers:{"Content-Type":"application/json"},' +
    'body:JSON.stringify({action:"publicEvents"})})\n' +
    '    .then(function(r){return r.json();})\n' +
    '    .then(function(d){\n' +
    '      var list = (d.events||[]).slice(0,5).map(function(e){\n' +
    '        return "<li><a href=\\"" + url + "?page=event&slug=" + encodeURIComponent(e.slug) + ' +
    '\\" target=\\"_blank\\">" + e.title + "</a><br/><small>" + e.dateShort + " &middot; " + e.city + "</small></li>";\n' +
    '      }).join("");\n' +
    '      document.getElementById("pssdm-event-widget").innerHTML = ' +
    '"<h3>Event Terbaru</h3><ul>" + list + "</ul>";\n' +
    '    })\n' +
    '    .catch(function(){document.getElementById("pssdm-event-widget").innerHTML="Event tidak tersedia.";});\n' +
    '})();\n' +
    '<\/script>';
}
