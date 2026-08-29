const SPREADSHEET_ID = "PASTE_YOUR_SPREADSHEET_ID_HERE";

const COLLECTIONS = [
  "roles",
  "users",
  "employees",
  "programs",
  "classes",
  "class_participants",
  "modules",
  "module_versions",
  "learning_objectives",
  "questions",
  "assessments",
  "assessment_attempts",
  "assessment_answers",
  "content_sections",
  "activities",
  "assignments",
  "submissions",
  "submission_reviews",
  "attendance",
  "nps_responses",
  "module_reviews",
  "notifications",
  "audit_logs",
  "templates",
  "journey",
  "settings"
];

function defaultData() {
  const data = {};
  COLLECTIONS.forEach((c) => {
    data[c] = [];
  });
  return data;
}

function normalizeData(input) {
  const base = defaultData();
  if (!input || typeof input !== "object") return base;

  COLLECTIONS.forEach((key) => {
    const value = input[key];
    base[key] = Array.isArray(value) ? value : [];
  });

  return base;
}

function getSpreadsheet() {
  try {
    if (SPREADSHEET_ID && SPREADSHEET_ID !== "PASTE_YOUR_SPREADSHEET_ID_HERE") {
      return SpreadsheetApp.openById(SPREADSHEET_ID);
    }
  } catch (e) {
    // fallback: create a new spreadsheet if ID not valid
  }

  return SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.create("Akademi Workspace");
}

function getOrCreateSheet(sheetName) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  return sheet;
}

function collectHeaders(rows) {
  const set = new Set();
  rows.forEach((row) => {
    if (row && typeof row === "object") {
      Object.keys(row).forEach((key) => set.add(key));
    }
  });
  return Array.from(set);
}

function writeRowsToSheet(sheet, rows) {
  const headers = collectHeaders(rows);
  const values = [];

  if (headers.length > 0) {
    values.push(headers);
    rows.forEach((row) => {
      const arr = headers.map((key) => {
        const value = row && Object.prototype.hasOwnProperty.call(row, key) ? row[key] : "";
        if (value === undefined || value === null) return "";
        if (typeof value === "object") return JSON.stringify(value);
        return value;
      });
      values.push(arr);
    });
  }

  sheet.clear();
  if (values.length > 0) {
    sheet.getRange(1, 1, values.length, values[0].length).setValues(values);
  }
}

function readRowsFromSheet(sheet) {
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];

  const headers = values[0];
  const rows = [];

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (!row || row.every((cell) => cell === "" || cell === null || cell === undefined)) {
      continue;
    }

    const obj = {};
    headers.forEach((header, index) => {
      const raw = row[index];
      obj[header] = raw;
    });
    rows.push(obj);
  }

  return rows;
}

function loadDataFromSpreadsheet() {
  const result = defaultData();
  try {
    const ss = getSpreadsheet();
    COLLECTIONS.forEach((collection) => {
      const sheet = ss.getSheetByName(collection);
      if (sheet) {
        result[collection] = readRowsFromSheet(sheet);
      }
    });
  } catch (e) {
    return defaultData();
  }
  return result;
}

function saveDataToSpreadsheet(data) {
  const clean = normalizeData(data);
  const ss = getSpreadsheet();

  COLLECTIONS.forEach((collection) => {
    const sheet = getOrCreateSheet(collection);
    writeRowsToSheet(sheet, clean[collection] || []);
  });

  return clean;
}

function clearAllSheets() {
  const ss = getSpreadsheet();
  COLLECTIONS.forEach((collection) => {
    const sheet = ss.getSheetByName(collection);
    if (sheet) {
      sheet.clear();
    }
  });
}

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || "load";

  if (action === "reset") {
    clearAllSheets();
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, data: defaultData() }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const data = loadDataFromSpreadsheet();
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const raw = e && e.postData && e.postData.contents ? e.postData.contents : "{}";
    const payload = JSON.parse(raw || "{}");
    const action = payload.action || "save";

    if (action === "save") {
      const saved = saveDataToSpreadsheet(payload.data || {});
      return ContentService
        .createTextOutput(JSON.stringify({ ok: true, data: saved }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "reset") {
      clearAllSheets();
      return ContentService
        .createTextOutput(JSON.stringify({ ok: true, data: defaultData() }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, message: "Unsupported action" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
