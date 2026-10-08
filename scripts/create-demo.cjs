const fs=require('node:fs'),path=require('node:path'),m=require('../dist/model.js');
const base={name:'Sector 17 Festival — improved plan',venue:'plaza',date:'2026-10-10',time:'18:00',attendance:5000,carShare:55,occupancy:2.5,parking:850,window:2,duration:4,shuttles:5,extraParking:100,stagger:1,closedRoads:[]};
const a=m.simulate(base,'a');
const candidate=m.roads.find(road=>a.routes.some(p=>p?.ids.includes(road.id)) && !road.name.startsWith('Local') && !road.name.startsWith('Access') && (()=>{const r=m.simulate({...base,closedRoads:[road.id]},'b');return r.unreachable===0&&r.emergency!==null;})());
if(candidate)base.closedRoads=[candidate.id];
fs.writeFileSync(path.join(__dirname,'../demo-scenario.json'),JSON.stringify({version:2,plan:base},null,2));
console.log('Demo scenario created; closure:',candidate?.name,candidate?.id);
