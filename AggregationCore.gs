"use strict";

function toDateOnly(value) {
  var date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (isNaN(date.getTime())) throw new Error("売上日に不正な値があります。");
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function periodKey(dateValue, cadence) {
  var date = toDateOnly(dateValue); var y = date.getFullYear(); var m = String(date.getMonth() + 1).padStart(2, "0"); var d = String(date.getDate()).padStart(2, "0");
  if (cadence === "daily") return y + "-" + m + "-" + d;
  if (cadence === "monthly") return y + "-" + m;
  if (cadence === "weekly") { var monday = new Date(date); var day = (monday.getDay() + 6) % 7; monday.setDate(monday.getDate() - day); return periodKey(monday, "daily"); }
  throw new Error("集計単位はdaily、weekly、monthlyのいずれかです。");
}

function normalizeRecord(row, rowNumber) {
  var amount = Number(row[1]); var count = Number(row[2]); var owner = String(row[3] || "").trim(); var category = String(row[4] || "").trim();
  if (!Number.isFinite(amount) || amount < 0) throw new Error(rowNumber + "行目の金額が不正です。");
  if (!Number.isFinite(count) || count < 0 || !Number.isInteger(count)) throw new Error(rowNumber + "行目の件数が不正です。");
  if (!owner || !category) throw new Error(rowNumber + "行目の担当者またはカテゴリが空です。");
  return { date: toDateOnly(row[0]), amount: amount, count: count, owner: owner, category: category };
}

function aggregateRows(rows, cadence) {
  var groups = new Map();
  rows.forEach(function(row, index) {
    if (row.every(function(value) { return value === "" || value == null; })) return;
    var record = normalizeRecord(row, index + 2); var period = periodKey(record.date, cadence); var key = [period, record.owner, record.category].join("\u0001");
    var current = groups.get(key) || { period: period, owner: record.owner, category: record.category, amount: 0, count: 0 };
    current.amount += record.amount; current.count += record.count; groups.set(key, current);
  });
  return Array.from(groups.values()).sort(function(a, b) { return a.period.localeCompare(b.period) || a.owner.localeCompare(b.owner) || a.category.localeCompare(b.category); }).map(function(item) { return [item.period, item.owner, item.category, item.amount, item.count]; });
}

if (typeof module !== "undefined") module.exports = { toDateOnly, periodKey, normalizeRecord, aggregateRows };

