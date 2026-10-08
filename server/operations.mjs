const opsJSON=(value,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
const opsHash=async text=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),b=>b.toString(16).padStart(2,'0')).join('');
const opsToken=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
const opsID=value=>typeof value==='string'&&/^[a-f0-9-]{36}$/.test(value);
function opsInt(value,min,max){if(!Number.isInteger(value)||value<min||value>max)throw new Error('Invalid number.');return value;}
function opsText(value,max){if(typeof value!=='string'||!value.trim()||value.trim().length>max)throw new Error('Invalid text.');return value.trim();}
async function opsBody(request){
 if(!request.headers.get('Content-Type')?.includes('application/json'))throw new Error('Send JSON.');
 const reader=request.body?.getReader();if(!reader)throw new Error('Missing request.');let length=0,parts=[];
 while(true){const {value,done}=await reader.read();if(done)break;length+=value.length;if(length>8192){await reader.cancel();throw new Error('Request too large.');}parts.push(value);}
 const data=new Uint8Array(length);let i=0;for(const part of parts){data.set(part,i);i+=part.length;}return JSON.parse(new TextDecoder().decode(data));
}
export async function operationsAPI(request,env){
 const url=new URL(request.url),path=url.pathname;if(!path.startsWith('/api/operations/'))return null;
 if(!env.DB)return opsJSON({error:'Booking storage is unavailable. Please retry later.'},503);
 if(!['GET','POST'].includes(request.method))return opsJSON({error:'Method not allowed.'},405);
 if(request.method==='POST'&&request.headers.get('Origin')&&request.headers.get('Origin')!==url.origin)return opsJSON({error:'Origin not allowed.'},403);
 const DB=env.DB,p=(sql,...args)=>DB.prepare(sql).bind(...args),now=new Date().toISOString();
 try{
  const body=request.method==='POST'?await opsBody(request):{};
  const eventID=url.searchParams.get('event')||body.event;
  if(path==='/api/operations/events'&&request.method==='POST'){
   if(!opsID(body.id)||!opsToken(body.operatorKey))throw new Error('Invalid event credentials.');
   const hash=await opsHash(body.operatorKey),existing=await p('SELECT operator_hash FROM ops_events WHERE id=?',body.id).first();
   if(existing)return existing.operator_hash===hash?opsJSON({id:body.id},200):opsJSON({error:'Event identifier already used.'},409);
   const name=opsText(body.name,80),date=opsText(body.date,10),capacity=opsInt(body.capacity,1,2000);
   if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date+'T00:00:00Z')))throw new Error('Invalid date.');
   await DB.batch([p('INSERT INTO ops_events VALUES (?,?,?,?,?,?)',body.id,hash,name,date,capacity,now),...[
    ['plaza','Sample Plaza parking',120,5000,0],['remote','Sample remote parking',200,3000,0],['accessible','Sample accessible parking',12,5000,1]
   ].map(([id,label,cap,price,accessible])=>p('INSERT INTO ops_lots VALUES (?,?,?,?,?,?,?,?)',body.id+'-'+id,body.id,label,cap,price,accessible,1,now))]);
   return opsJSON({id:body.id},201);
  }
  if(!opsID(eventID))throw new Error('Choose an event first.');
  const event=await p('SELECT * FROM ops_events WHERE id=?',eventID).first();if(!event)return opsJSON({error:'Event not found. Check the event link.'},404);
  async function operator(){const token=request.headers.get('Authorization')?.replace(/^Bearer /,'');return opsToken(token)&&await opsHash(token)===event.operator_hash;}
  if(path==='/api/operations/inventory'&&request.method==='GET'){
   const lots=(await p("SELECT l.*, (SELECT COUNT(*) FROM ops_passes p WHERE p.lot_id=l.id AND p.status='active' AND p.parking!='exited') AS reserved, (SELECT COUNT(*) FROM ops_passes p WHERE p.lot_id=l.id AND p.status='active' AND p.parking='inside') AS occupied FROM ops_lots l WHERE event_id=? ORDER BY accessible,name",eventID).all()).results;
   const stats=await p("SELECT COUNT(*) AS registered, COALESCE(SUM(checked),0) AS checked FROM ops_passes WHERE event_id=? AND status='active'",eventID).first();
   return opsJSON({event:{id:event.id,name:event.name,date:event.date,capacity:event.capacity},lots,stats,updated:now,sample:true});
  }
  if(path==='/api/operations/reserve'&&request.method==='POST'){
   if(!opsToken(body.token))throw new Error('Invalid pass code.');const hash=await opsHash(body.token),name=opsText(body.name,60);
   const existing=await p('SELECT event_id FROM ops_passes WHERE token_hash=?',hash).first();if(existing)return existing.event_id===eventID?opsJSON({ok:true}):opsJSON({error:'Pass already belongs to another event.'},409);
   const lot=body.lot?await p('SELECT * FROM ops_lots WHERE id=? AND event_id=?',body.lot,eventID).first():null;
   if(body.lot&&!lot)throw new Error('Invalid parking zone.');
   if(lot?.accessible&&!body.accessible)throw new Error('Confirm that you need accessible parking.');
   const inserted=await p(`INSERT INTO ops_passes (token_hash,event_id,name,lot_id,price,status,checked,parking,created,updated)
    SELECT ?,?,?,?,COALESCE((SELECT price FROM ops_lots WHERE id=?),0),'active',0,?, ?,?
    WHERE (SELECT COUNT(*) FROM ops_passes WHERE event_id=? AND status='active') < (SELECT capacity FROM ops_events WHERE id=?)
    AND (? IS NULL OR EXISTS (SELECT 1 FROM ops_lots l WHERE l.id=? AND l.event_id=? AND l.open=1 AND l.price=? AND (SELECT COUNT(*) FROM ops_passes r WHERE r.lot_id=l.id AND r.status='active' AND r.parking!='exited')<l.capacity))`,hash,eventID,name,lot?.id||null,lot?.id||null,lot?'reserved':'none',now,now,eventID,eventID,lot?.id||null,lot?.id||null,eventID,body.price??0).run();
   if(!inserted.meta.changes)return opsJSON({error:'Event or parking is full, closed, or the price changed. Refresh availability and try again.'},409);
   return opsJSON({ok:true},201);
  }
  if(path==='/api/operations/pass'&&request.method==='POST'){
   if(!opsToken(body.token))throw new Error('Invalid pass code.');const pass=await p('SELECT p.*,l.name AS lot_name,e.name AS event_name,e.date AS event_date FROM ops_passes p JOIN ops_events e ON p.event_id=e.id LEFT JOIN ops_lots l ON p.lot_id=l.id WHERE p.token_hash=? AND p.event_id=?',await opsHash(body.token),eventID).first();
   if(!pass)return opsJSON({error:'Pass not found for this event.'},404);delete pass.token_hash;return opsJSON({pass});
  }
  if(path==='/api/operations/cancel'&&request.method==='POST'){
   if(!opsToken(body.token))throw new Error('Invalid pass code.');const r=await p("UPDATE ops_passes SET status='cancelled',updated=? WHERE token_hash=? AND event_id=? AND status='active' AND checked=0 AND parking IN ('reserved','none')",now,await opsHash(body.token),eventID).run();
   return r.meta.changes?opsJSON({ok:true}):opsJSON({error:'Cannot cancel: already used, cancelled, or not found.'},409);
  }
  if(!await operator())return opsJSON({error:'Enter the operator key for this event.'},401);
  if(path==='/api/operations/operator'&&request.method==='GET')return opsJSON({ok:true});
  if(path==='/api/operations/lot'&&request.method==='POST'){
   const cap=opsInt(body.capacity,0,2000),price=opsInt(body.price,0,1000000),open=body.open===true?1:0;
   const r=await p("UPDATE ops_lots SET capacity=?,price=?,open=?,updated=? WHERE id=? AND event_id=? AND ?>=(SELECT COUNT(*) FROM ops_passes WHERE lot_id=? AND status='active' AND parking!='exited')",cap,price,open,now,body.lot,eventID,cap,body.lot).run();
   return r.meta.changes?opsJSON({ok:true}):opsJSON({error:'Capacity cannot be below active reservations, or parking zone was not found.'},409);
  }
  if(path==='/api/operations/checkin'&&request.method==='POST'){
   if(!opsToken(body.token))throw new Error('Invalid pass code.');
   const changes={attendee:"checked=1",entry:"parking='inside'",exit:"parking='exited'"},conditions={attendee:'checked=0',entry:"lot_id IS NOT NULL AND parking='reserved'",exit:"parking='inside'"};
   if(!changes[body.action])throw new Error('Invalid scan action.');
   const r=await p(`UPDATE ops_passes SET ${changes[body.action]},updated=? WHERE token_hash=? AND event_id=? AND status='active' AND ${conditions[body.action]}`,now,await opsHash(body.token),eventID).run();
   return r.meta.changes?opsJSON({ok:true,message:{attendee:'Attendee checked in.',entry:'Parking entry recorded.',exit:'Parking exit recorded. Space released.'}[body.action]}):opsJSON({error:'No change: invalid, cancelled, already scanned, or wrong scan order. A pass allows one parking entry.'},409);
  }
  return opsJSON({error:'Not found.'},404);
 }catch(error){if(error instanceof SyntaxError||/Invalid|Choose|Confirm|Send|Missing|too large/.test(error.message))return opsJSON({error:error.message},400);console.error('Operations request failed',error.message);return opsJSON({error:'Could not complete the request. Keep your pass code and retry.'},503);}
}
