const assert=require('node:assert/strict');
const m=require('../dist/model.js');
const input={name:'Festival',venue:'plaza',date:'2026-10-10',time:'18:00',attendance:5000,carShare:55,occupancy:2.5,parking:850,window:2,duration:4,shuttles:0,extraParking:0,stagger:0,closedRoads:[]};
assert.equal(m.validate(input),input);
const a=m.simulate(input,'a'), b=m.simulate(input,'b');
assert.equal(a.cars,1100);assert.equal(a.demand,935);assert.equal(a.shortage,85);
assert.deepEqual(a,b);assert.equal(a.unreachable,0);assert.ok(a.emergencyRoute);
assert.equal(a.timeline.reduce((s,t)=>s+t.arrival,0),a.cars);assert.equal(a.timeline.reduce((s,t)=>s+t.departure,0),a.cars);assert.equal(a.timeline.at(-1).parked,0);
const shuttles=m.simulate({...input,shuttles:5},'b');assert.ok(shuttles.cars<a.cars);assert.ok(shuttles.shortage<a.shortage);
const stagger=m.simulate({...input,stagger:1},'b');assert.ok(stagger.peak<a.peak);assert.equal(stagger.cars,a.cars);
const parking=m.simulate({...input,extraParking:100},'b');assert.equal(parking.shortage,0);assert.equal(parking.travel,a.travel);
const closedId=a.emergencyRoute.ids[0];const restricted=m.simulate({...input,closedRoads:[closedId]},'b');assert.ok(restricted.network.find(r=>r.id===closedId).closed);assert.ok(!restricted.emergencyRoute || !restricted.emergencyRoute.ids.includes(closedId));
const blocked=m.simulate({...input,closedRoads:m.roads.map(r=>r.id)},'b');assert.equal(blocked.emergency,null);assert.equal(blocked.travel,null);assert.equal(blocked.unreachable,4);
const zero=m.simulate({...input,carShare:0},'b');assert.equal(zero.cars,0);assert.equal(zero.demand,0);
assert.equal(m.simulate({...input,parking:0},'b').shortage,935);
for(let share=0;share<=10;share++){const small=m.simulate({...input,attendance:500,carShare:share,window:3,occupancy:8},'a');assert.ok(small.timeline.every(t=>t.arrival>=0&&t.departure>=0&&t.parked>=0));assert.equal(small.timeline.reduce((s,t)=>s+t.arrival,0),small.cars);assert.equal(small.timeline.at(-1).parked,0);}
assert.throws(()=>m.validate({...input,occupancy:0}));assert.throws(()=>m.validate({...input,closedRoads:['invalid']}));assert.throws(()=>m.validate({...input,attendance:'5000'}));
console.log(JSON.stringify({status:'PASS',roads:m.roads.length,hospital:m.hospital.name,baseline:{cars:a.cars,travel:a.travel,emergency:a.emergency,shortage:a.shortage},shuttles:{cars:shuttles.cars,shortage:shuttles.shortage},closure:{id:closedId,emergency:restricted.emergency}},null,2));
