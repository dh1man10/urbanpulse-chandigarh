const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..','dist');
function edit(file,changes){let s=fs.readFileSync(path.join(root,file),'utf8');for(const [from,to] of changes){if(!s.includes(from))throw Error('Missing edit target: '+from.slice(0,80));s=s.replace(from,to);}fs.writeFileSync(path.join(root,file),s);}
edit('model.js',[
 ["const venue=data.venues.find(v=>v.id===input.venue)||data.venues[0],end=nearest(venue.point);","const venue=input.venue==='custom'?{id:'custom',name:'Custom event location',point:input.entrance||input.customVenue,eventPoint:input.customVenue}:data.venues.find(v=>v.id===input.venue)||data.venues[0],end=nearest(venue.point); if(!venueGates.has(end)){venueGates.set(end,gatePoints.map(p=>[...major].sort((a,b)=>distance(p,nodes.get(a))-distance(p,nodes.get(b))).find(id=>route(openGraph,id,end))));hospitalAccess.set(end,[...major].sort((a,b)=>distance(hospital.point,nodes.get(a))-distance(hospital.point,nodes.get(b))).find(id=>route(openGraph,id,end)));}"],
 ["const gates=venueGates.get(venue.id),g=graph(closed)","const gates=venueGates.get(end),g=graph(closed)"],
 ["return {...r,closed:shut,volume:shut?0:Math.round(r.capacity*r.baseline+flow),ratio:shut?0:r.baseline+flow/r.capacity};","const background=input.trafficCounts?.[r.id]?.volume??r.capacity*r.baseline;return {...r,background,measured:!!input.trafficCounts?.[r.id],eventFlow:flow,closed:shut,volume:shut?0:Math.round(background+flow),ratio:shut?0:(background+flow)/r.capacity};"],
 ["hospitalAccess.get(venue.id),end","hospitalAccess.get(end),end"],
 ["hospitalAccess.get(venue.id)))","hospitalAccess.get(end)))"],
 ["return {cars,peak,network","return {gateNodes:gates,endNode:end,hospitalNode:hospitalAccess.get(end),cars,peak,network"],
 ["!data.venues.some(x=>x.id===v.venue)","!(data.venues.some(x=>x.id===v.venue)||(v.venue==='custom'&&v.customVenue))"]
]);
edit('index.html',[
 ['<script defer src="app.js"></script>','<script defer src="planning-model.js"></script><script defer src="app.js"></script><script defer src="planning-ui.js"></script>'],
 ['<option value="plaza">Sector 17 · Plaza</option>','<option value="custom">Custom location (place on map)</option><option value="plaza" selected>Sector 17 · Plaza</option>'],
 ['<section id="comparison"','<section id="advanced-planning" class="panel advanced-planning"></section><section id="comparison"'],
 ['<button class="button light" id="export-plan">','<button class="button light" id="share-plan">Create share link</button><button class="button light" id="export-plan">'],
 ['Prototype v2.0','Prototype v3.0']
]);
edit('app.js',[
 ['return UrbanModel.validate(v);','if(window.PlanningUI)Object.assign(v,PlanningUI.read());return UrbanModel.validate(v);'],
 ["closedRoads=[...v.closedRoads];$('attendance-value')","closedRoads=[...v.closedRoads];if(window.PlanningUI)PlanningUI.fill(v);$('attendance-value')"],
 ['renderSuggestions();renderFindings(r);','renderSuggestions();renderFindings(r);if(window.PlanningUI)PlanningUI.render();'],
 ['report.document.close();}','if(window.PlanningUI)report.document.write(PlanningUI.report());report.document.close();}'],
 ["if(data.version!==2)","if(![2,3].includes(data.version))"],
 ["JSON.stringify({version:2,plan:readInputs()}","JSON.stringify({version:3,plan:readInputs()}"]
]);
