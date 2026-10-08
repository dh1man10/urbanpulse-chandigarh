export async function scenarioAPI(request, env, validate) {
 const url=new URL(request.url),base='/api/scenarios';
 const json=(value,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
 if(!url.pathname.startsWith(base))return null;
 if(!env.BUCKET)return json({error:'Cloud storage is unavailable. Export your scenario to keep a copy.'},503);
 try {
  if(url.pathname===base && request.method==='POST'){
   if(request.headers.get('Origin') && request.headers.get('Origin')!==url.origin)return json({error:'Origin not allowed.'},403);
   if(!request.headers.get('Content-Type')?.includes('application/json'))return json({error:'Send JSON.'},415);
   const reader=request.body?.getReader();if(!reader)return json({error:'Missing scenario.'},400);let length=0,chunks=[];while(true){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>64000){await reader.cancel();return json({error:'Scenario exceeds 64 KB. Export JSON for larger plans.'},413);}chunks.push(value);}const bytes=new Uint8Array(length);let at=0;for(const part of chunks){bytes.set(part,at);at+=part.length;}const data=JSON.parse(new TextDecoder().decode(bytes));if(data.version!==3)return json({error:'Unsupported scenario version.'},400);const plan=validate(data.plan),body=JSON.stringify({version:3,plan});const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(body));const id=Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');await env.BUCKET.put('scenarios/'+id,body,{httpMetadata:{contentType:'application/json'}});return json({id},201);
  }
  const id=url.pathname.slice(base.length+1);if(request.method==='GET'&&/^[a-f0-9]{64}$/.test(id)){const file=await env.BUCKET.get('scenarios/'+id);return file?new Response(await file.text(),{headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}}):json({error:'Snapshot not found.'},404);}
  return json({error:'Not found.'},404);
 }catch(error){if(error instanceof SyntaxError || /Invalid|Unknown|outside|must|exceed|Place|Use up|Invalid/.test(error.message))return json({error:'Invalid scenario: '+error.message},400);console.error('Scenario storage request failed');return json({error:'Cloud save failed. Your inputs are unchanged; try again or export JSON.'},503);}
}
