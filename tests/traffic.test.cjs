const assert=require('node:assert/strict'),{simulate}=require('../dist/traffic-lab.js');
const a=simulate(),b=simulate({closed:true}),high=simulate({demand:6000,closed:true}),empty=simulate({demand:0});
assert.equal(a.generated,b.generated);assert.deepEqual(simulate(),a);
for(const r of [a,b,high,empty]){assert.equal(r.generated,r.completed+r.remaining+r.waiting);for(const f of r.frames){for(let lane=0;lane<8;lane++){const cars=f.cars.filter(c=>c.lane===lane).sort((a,b)=>b.x-a.x);for(let i=1;i<cars.length;i++)assert.ok(cars[i-1].x-cars[i].x>=6.89,'Vehicles overlap');}}}
assert.ok(high.maxQueue>a.maxQueue);assert.ok(high.waiting>0);assert.equal(empty.completed,0);assert.equal(empty.delay,null);assert.throws(()=>simulate({green:80,cycle:80}));
console.log('PASS: repeatable A/B arrivals, vehicle conservation, lane spacing, overload queues, empty demand, and invalid signal timing.');
