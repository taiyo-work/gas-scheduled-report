"use strict";

var AGGREGATION_HANDLER = "runScheduledAggregation";

function replaceAggregationTrigger(cadence, hour) {
  hour = Number(hour); if (!Number.isInteger(hour) || hour < 0 || hour > 23) throw new Error("実行時刻は0〜23の整数です。");
  ScriptApp.getProjectTriggers().filter(function(trigger) { return trigger.getHandlerFunction() === AGGREGATION_HANDLER; }).forEach(function(trigger) { ScriptApp.deleteTrigger(trigger); });
  var builder = ScriptApp.newTrigger(AGGREGATION_HANDLER).timeBased().atHour(hour);
  if (cadence === "daily") builder.everyDays(1).create();
  else if (cadence === "weekly") builder.onWeekDay(ScriptApp.WeekDay.MONDAY).create();
  else if (cadence === "monthly") builder.onMonthDay(1).create();
  else throw new Error("集計単位が不正です。");
}

