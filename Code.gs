"use strict";

function onOpen() {
  SpreadsheetApp.getUi().createMenu("定期集計").addItem("初期設定", "setupScheduledReport").addItem("ダミーデータ作成", "createDummyData").addItem("今すぐ集計", "runScheduledAggregation").addItem("トリガー更新", "configureAggregationTrigger").addToUi();
}

function setupScheduledReport() {
  var book = SpreadsheetApp.getActive();
  resetSheet_(book, "設定", [["項目", "値"], ["集計単位", "monthly"], ["実行時刻（0-23）", 9]]);
  resetSheet_(book, "元データ", [["売上日", "金額", "件数", "担当者", "カテゴリ"]]);
  resetSheet_(book, "ダッシュボード", [["期間", "担当者", "カテゴリ", "金額合計", "件数合計"]]);
  resetSheet_(book, "実行ログ", [["実行日時", "状態", "入力件数", "出力件数", "詳細"]]);
}

function resetSheet_(book, name, values) { var sheet = book.getSheetByName(name) || book.insertSheet(name); sheet.clear(); sheet.getRange(1, 1, values.length, values[0].length).setValues(values); sheet.getRange(1, 1, 1, values[0].length).setFontWeight("bold"); sheet.setFrozenRows(1); sheet.autoResizeColumns(1, values[0].length); return sheet; }

function createDummyData() {
  var book = SpreadsheetApp.getActive(); var sheet = book.getSheetByName("元データ") || resetSheet_(book, "元データ", [["売上日", "金額", "件数", "担当者", "カテゴリ"]]);
  var rows = [[new Date(2026, 7, 1), 120000, 3, "山田", "保守"], [new Date(2026, 7, 2), 80000, 2, "佐藤", "開発"], [new Date(2026, 7, 8), 45000, 1, "山田", "開発"], [new Date(2026, 8, 1), 150000, 4, "佐藤", "保守"]];
  if (sheet.getLastRow() > 1) sheet.getRange(2, 1, sheet.getLastRow() - 1, 5).clearContent(); sheet.getRange(2, 1, rows.length, 5).setValues(rows);
}

function getSettings_(book) { var sheet = book.getSheetByName("設定"); if (!sheet) throw new Error("先に初期設定を実行してください。"); return { cadence: String(sheet.getRange("B2").getValue()).trim(), hour: Number(sheet.getRange("B3").getValue()) }; }

function runScheduledAggregation() {
  var lock = LockService.getScriptLock(); if (!lock.tryLock(5000)) throw new Error("別の集計処理が実行中です。");
  var book = SpreadsheetApp.getActive(); var log = book.getSheetByName("実行ログ") || resetSheet_(book, "実行ログ", [["実行日時", "状態", "入力件数", "出力件数", "詳細"]]);
  try {
    var source = book.getSheetByName("元データ"); if (!source) throw new Error("元データシートがありません。"); var rowCount = Math.max(0, source.getLastRow() - 1); var rows = rowCount ? source.getRange(2, 1, rowCount, 5).getValues() : [];
    var output = aggregateRows(rows, getSettings_(book).cadence); var dashboard = resetSheet_(book, "ダッシュボード", [["期間", "担当者", "カテゴリ", "金額合計", "件数合計"]]); if (output.length) dashboard.getRange(2, 1, output.length, 5).setValues(output); dashboard.autoResizeColumns(1, 5);
    log.appendRow([new Date(), "成功", rows.length, output.length, "ダッシュボードを置換更新"]);
  } catch (error) { log.appendRow([new Date(), "失敗", 0, 0, error.message]); throw error; } finally { lock.releaseLock(); }
}

function configureAggregationTrigger() { var settings = getSettings_(SpreadsheetApp.getActive()); replaceAggregationTrigger(settings.cadence, settings.hour); }

