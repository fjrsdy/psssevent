/**
 * ============================================================================
 *  SIMANEV PSSDM — Sistem Manajemen Event
 *  File   : SheetService.gs
 *  Fungsi : Google Sheets sebagai database (create/read/update/delete)
 * ============================================================================
 */

/** Ambil (atau buat) spreadsheet database */
function getSpreadsheet_() {
  var ss;
  if (APP_CONFIG.SPREADSHEET_ID) {
    ss = SpreadsheetApp.openById(APP_CONFIG.SPREADSHEET_ID);
  } else {
    var props = PropertiesService.getScriptProperties();
    var cachedId = props.getProperty('SPREADSHEET_ID');
    if (cachedId) {
      ss = SpreadsheetApp.openById(cachedId);
    } else {
      ss = SpreadsheetApp.create(APP_CONFIG.APP_NAME + ' — Database');
      props.setProperty('SPREADSHEET_ID', ss.getId());
    }
  }
  return ss;
}

/** Ambil sheet berdasarkan nama; buat bila belum ada */
function getSheet_(sheetName) {
  var ss = getSpreadsheet_();
  var sh = ss.getSheetByName(sheetName);
  if (!sh) {
    sh = ss.insertSheet(sheetName);
    var headers = SCHEMA[sheetName] || [];
    if (headers.length) {
      sh.getRange(1, 1, 1, headers.length).setValues([headers]);
      sh.getRange(1, 1, 1, headers.length)
        .setFontWeight('bold')
        .setBackground('#0f3d4a')
        .setFontColor('#ffffff');
      sh.setFrozenRows(1);
    }
  }
  return sh;
}

/**
 * Setup database: buat semua sheet, atur header & format.
 * Dipanggil dari menu Spreadsheet atau tombol di halaman Dashboard.
 */
function setupDatabase() {
  var ss = getSpreadsheet_();
  Object.keys(SCHEMA).forEach(function (name) {
    var sh = getSheet_(name);
    var headers = SCHEMA[name];
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    sh.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#0f3d4a')
      .setFontColor('#ffffff');
    sh.setFrozenRows(1);
    sh.getRange(1, 1, sh.getMaxRows(), headers.length).setVerticalAlignment('middle');
  });

  // Hapus sheet default "Sheet1" bila masih kosong
  var defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && ss.getSheets().length > 4 && defaultSheet.getLastRow() < 2) {
    ss.deleteSheet(defaultSheet);
  }

  logInfo_('Database siap', ss.getId());
  return { ok: true, spreadsheetId: ss.getId(), url: ss.getUrl() };
}

/** Baca seluruh baris sebuah sheet menjadi array of object */
function readAll_(sheetName) {
  var sh = getSheet_(sheetName);
  var lastRow = sh.getLastRow();
  if (lastRow < 2) return [];
  var headers = SCHEMA[sheetName];
  var values = sh.getRange(2, 1, lastRow - 1, headers.length).getValues();
  var rows = [];
  for (var i = 0; i < values.length; i++) {
    if (!values[i][0]) continue; // lewati baris kosong
    var obj = { _row: i + 2 };
    for (var j = 0; j < headers.length; j++) obj[headers[j]] = values[i][j];
    rows.push(obj);
  }
  return rows;
}

/** Tambah satu baris baru; mengembalikan object lengkap (termasuk _row) */
function insertRow_(sheetName, data) {
  var sh = getSheet_(sheetName);
  var headers = SCHEMA[sheetName];
  var row = headers.map(function (h) {
    var v = data[h];
    return v === undefined || v === null ? '' : v;
  });
  sh.appendRow(row);
  var rowNumber = sh.getLastRow();
  var out = { _row: rowNumber };
  headers.forEach(function (h, idx) { out[h] = row[idx]; });
  return out;
}

/** Perbarui seluruh kolom pada baris tertentu */
function updateRow_(sheetName, rowNumber, data) {
  var sh = getSheet_(sheetName);
  var headers = SCHEMA[sheetName];
  var current = sh.getRange(rowNumber, 1, 1, headers.length).getValues()[0];
  var updated = headers.map(function (h, idx) {
    return data[h] === undefined || data[h] === null ? current[idx] : data[h];
  });
  sh.getRange(rowNumber, 1, 1, headers.length).setValues([updated]);
  return updated;
}

/** Perbarui satu kolom pada baris tertentu */
function setCell_(sheetName, rowNumber, header, value) {
  var idx = SCHEMA[sheetName].indexOf(header);
  if (idx < 0) throw new Error('Kolom tidak dikenal: ' + header);
  getSheet_(sheetName).getRange(rowNumber, idx + 1).setValue(value);
}

/** Cari baris pertama yang kolom `header` bernilai `value` */
function findOne_(sheetName, header, value) {
  var rows = readAll_(sheetName);
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][header]) === String(value)) return rows[i];
  }
  return null;
}

/** Cari semua baris yang kolom `header` bernilai `value` */
function findAll_(sheetName, header, value) {
  return readAll_(sheetName).filter(function (r) {
    return String(r[header]) === String(value);
  });
}

/** Ubah row sheet menjadi object yang aman dikirim ke klien (string ISO) */
function serialize_(obj, excludeMeta) {
  if (!obj) return null;
  var out = {};
  Object.keys(obj).forEach(function (key) {
    if (excludeMeta && key === '_row') return;
    var v = obj[key];
    out[key] = (Object.prototype.toString.call(v) === '[object Date]') ? toIso_(v) : v;
  });
  return out;
}
