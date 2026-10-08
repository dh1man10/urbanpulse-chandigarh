const assert=require('node:assert/strict');
const {localDatabase}=require('../server/local-db.cjs');
(async()=>{
 const {operationsAPI}=await import('../server/operations.mjs');const DB=localDatabase(':memory:');
 const event=crypto.randomUUID(),key='a'.repeat(64);let pass='b'.repeat(64),other='c'.repeat(64);
 async function call(path,body,admin=false){const r=await operationsAPI(new Request('https://example.test/api/operations/'+path+(body?'':'?event='+event),{method:body?'POST':'GET',headers:{...(body?{'Content-Type':'application/json'}:{}),...(admin?{Authorization:'Bearer '+key}:{})},...(body?{body:JSON.stringify({event,...body})}:{})}),{DB});return {status:r.status,data:await r.json()};}
 assert.equal((await call('events',{id:event,operatorKey:key,name:'Demo',date:'2026-10-10',capacity:5})).status,201);
 let inventory=(await call('inventory')).data;const lot=inventory.lots.find(l=>!l.accessible).id;
 assert.equal((await call('lot',{lot,capacity:1,price:10000,open:true})).status,401);
 assert.equal((await call('lot',{lot,capacity:1,price:10000,open:true},true)).status,200);
 assert.equal((await call('reserve',{token:other,name:'Price mismatch',lot,price:9000})).status,409);
 const attempts=await Promise.all([call('reserve',{token:pass,name:'One',lot,price:10000}),call('reserve',{token:other,name:'Two',lot,price:10000})]);
 assert.deepEqual(attempts.map(x=>x.status).sort(),[201,409]);
 // Either concurrent request may reserve the last space; follow the winner.
 if(attempts[0].status!==201)[pass,other]=[other,pass];
 assert.equal((await call('reserve',{token:pass,name:'Retry',lot,price:10000})).status,200);
 assert.equal((await call('lot',{lot,capacity:0,price:10000,open:true},true)).status,409);
 assert.equal((await call('lot',{lot,capacity:1,price:12000,open:true},true)).status,200);
 assert.equal((await call('pass',{token:pass})).data.pass.price,10000);
 assert.equal((await call('checkin',{token:pass,action:'entry'})).status,401);
 assert.equal((await call('checkin',{token:pass,action:'exit'},true)).status,409);
 assert.equal((await call('checkin',{token:pass,action:'entry'},true)).status,200);
 assert.equal((await call('checkin',{token:pass,action:'entry'},true)).status,409);
 assert.equal((await call('cancel',{token:pass})).status,409);
 assert.equal((await call('checkin',{token:pass,action:'attendee'},true)).status,200);
 assert.equal((await call('checkin',{token:pass,action:'attendee'},true)).status,409);
 assert.equal((await call('checkin',{token:pass,action:'exit'},true)).status,200);
 assert.equal((await call('checkin',{token:pass,action:'entry'},true)).status,409);
 assert.equal((await call('reserve',{token:other,name:'Two',lot,price:12000})).status,201);
 assert.equal((await call('cancel',{token:other})).status,200);
 assert.equal((await call('checkin',{token:other,action:'entry'},true)).status,409);
 inventory=(await call('inventory')).data;assert.equal(inventory.lots.find(l=>l.id===lot).reserved,0);assert.equal(inventory.stats.registered,1);
 const accessible=inventory.lots.find(l=>l.accessible);assert.equal((await call('reserve',{token:'d'.repeat(64),name:'Access',lot:accessible.id,price:accessible.price})).status,400);
 assert.equal((await call('reserve',{token:'e'.repeat(64),name:'Walk-in',lot:null})).status,201);
 assert.equal((await call('checkin',{token:'e'.repeat(64),action:'entry'},true)).status,409);
 assert.equal((await call('lot',{lot,capacity:1,price:12000,open:false},true)).status,200);
 assert.equal((await call('reserve',{token:'f'.repeat(64),name:'Closed',lot,price:12000})).status,409);
 const wrongEvent=await operationsAPI(new Request('https://example.test/api/operations/pass',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({event:crypto.randomUUID(),token:pass})}),{DB});assert.equal(wrongEvent.status,404);
 DB.close();console.log('PASS: atomic last-space booking, idempotency, operator authorization, price locking, duplicate scans, cancellation, accessible zones, full/closed inventory, and event isolation.');
})().catch(e=>{console.error(e);process.exitCode=1;});

