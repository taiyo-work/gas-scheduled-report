"use strict";
const assert=require("assert");const core=require("../AggregationCore.gs");let n=0;function test(name,fn){fn();n++;console.log(`PASS ${name}`)}
test("monthly aggregation is deterministic",()=>{const rows=[[new Date(2026,7,1),100,1,"A","開発"],[new Date(2026,7,3),200,2,"A","開発"]];assert.deepStrictEqual(core.aggregateRows(rows,"monthly"),[["2026-08","A","開発",300,3]])});
test("weekly key begins on Monday",()=>assert.strictEqual(core.periodKey(new Date(2026,7,12),"weekly"),"2026-08-10"));
test("rejects negative amount",()=>assert.throws(()=>core.aggregateRows([[new Date(),-1,1,"A","開発"]],"daily"),/金額/));
test("skips blank rows",()=>assert.deepStrictEqual(core.aggregateRows([["","","","",""]],"monthly"),[]));
console.log(`RESULT ${n}/${n} passed`);

