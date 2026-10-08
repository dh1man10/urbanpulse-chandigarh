const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, 'dist');
const port = Number(process.env.PORT || 4173);
const planning = require('./dist/planning-model.js');
const apiModule = import('./server/handler.mjs');
const opsModule=import('./server/operations.mjs');
fs.mkdirSync(path.join(__dirname,'.local-data'),{recursive:true});
const DB=require('./server/local-db.cjs').localDatabase(path.join(__dirname,'.local-data/operations.sqlite'));
const localStore = path.join(__dirname, '.local-snapshots');
const BUCKET = { async put(key,body) { fs.mkdirSync(localStore,{recursive:true}); fs.writeFileSync(path.join(localStore,key.split('/')[1]+'.json'),body); }, async get(key) { const file=path.join(localStore,key.split('/')[1]+'.json'); return fs.existsSync(file)?{text:async()=>fs.readFileSync(file,'utf8')}:null; } };
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript' };
http.createServer(async (req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch { res.writeHead(400).end(); return; }
  if(pathname.startsWith('/api/')) {
    try { const request=new Request('http://'+req.headers.host+req.url,{method:req.method,headers:req.headers,...(['GET','HEAD'].includes(req.method)?{}:{body:require('node:stream').Readable.toWeb(req),duplex:'half'})}); const result=(await (await opsModule).operationsAPI(request,{DB})) || (await (await apiModule).scenarioAPI(request,{BUCKET},planning.validate));res.writeHead(result?.status||404,result?Object.fromEntries(result.headers):{});res.end(result?Buffer.from(await result.arrayBuffer()):'Not found'); } catch { res.writeHead(500).end('Request failed'); } return;
  }
  const file = path.resolve(root, '.' + (/^\/(studio|comparison|timeline|report|visitor|operator|traffic)?\/?$/.test(pathname) ? '/index.html' : pathname));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (error, data) => { if (error) { res.writeHead(404).end('Not found'); return; } res.writeHead(200, { 'Content-Type': (types[path.extname(file)] || 'application/octet-stream') + '; charset=utf-8', 'Cache-Control':'no-store' }); res.end(data); });
}).listen(port, '127.0.0.1', () => console.log(`UrbanPulse: http://localhost:${port}`));
