const DATA_KEY = "AKADEMI_WORKSPACE_DATA";

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

function loadDataFromProperties() {
  const raw = PropertiesService.getScriptProperties().getProperty(DATA_KEY);
  if (!raw) return defaultData();

  try {
    const parsed = JSON.parse(raw);
    return normalizeData(parsed);
  } catch (e) {
    return defaultData();
  }
}

function saveDataToProperties(data) {
  const clean = normalizeData(data);
  PropertiesService.getScriptProperties().setProperty(DATA_KEY, JSON.stringify(clean));
  return clean;
}

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || "load";

  if (action === "reset") {
    PropertiesService.getScriptProperties().deleteProperty(DATA_KEY);
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, data: defaultData() }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const data = loadDataFromProperties();

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
      const saved = saveDataToProperties(payload.data || {});
      return ContentService
        .createTextOutput(JSON.stringify({ ok: true, data: saved }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "reset") {
      PropertiesService.getScriptProperties().deleteProperty(DATA_KEY);
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
