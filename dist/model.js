(function(root){
 'use strict';
 const data = typeof module !== 'undefined' ? require('./map-data.js') : root.CityData;
 const distance=(a,b)=>Math.hypot((a[0]-b[0])*111.2,(a[1]-b[1])*95.5);
 const nodes=new Map(), major=new Set();
 const roads=data.roads.map(r=>{let length=0;r.points.forEach((p,i)=>{nodes.set(r.nodes[i],p);if(['secondary','tertiary'].includes(r.kind))major.add(r.nodes[i]);if(i)length+=distance(p,r.points[i-1]);});return {...r,length,capacity:r.kind==='secondary'?1200:r.kind==='tertiary'?800:450,baseline:.32+(Number(r.id)%27)/100};});
 const nearest=p=>[...major].reduce((best,id)=>!best||distance(p,nodes.get(id))<distance(p,nodes.get(best))?id:best,null);
 const hospital=data.places.find(p=>/GMSH/.test(p.name))||data.places.find(p=>/Civil Hospital/.test(p.name));
 function graph(closed,network){const g=new Map(); const add=(a,b,road,km)=>{if(!g.has(a))g.set(a,[]);const ratio=network?.get(road.id)?.ratio||road.baseline;g.get(a).push({to:b,id:road.id,cost:km/(road.kind==='secondary'?35:25)*60*(1+.15*Math.min(ratio,2.5)**4),km});};roads.forEach(r=>{if(closed.has(r.id))return;r.nodes.forEach((id,i)=>{if(!i)return;const prev=r.nodes[i-1],km=distance(r.points[i-1],r.points[i]);if(r.oneway!==-1)add(prev,id,r,km);if(r.oneway!==1)add(id,prev,r,km);});});return g;}
 function route(g,start,end){const costs=new Map([[start,0]]),prev=new Map(),queue=new Set([start]);while(queue.size){let u=null;for(const v of queue)if(u===null||costs.get(v)<costs.get(u))u=v;queue.delete(u);if(u===end)break;for(const e of g.get(u)||[]){const cost=costs.get(u)+e.cost;if(cost<(costs.get(e.to)??Infinity)){costs.set(e.to,cost);prev.set(e.to,{from:u,...e});queue.add(e.to);}}}if(!costs.has(end))return null;const ids=[],points=[nodes.get(end)];let at=end,km=0;while(at!==start){const e=prev.get(at);if(!e)return null;ids.unshift(e.id);km+=e.km;at=e.from;points.unshift(nodes.get(at));}return {ids:[...new Set(ids)],points,minutes:costs.get(end)+2,km};}
 const gatePoints=[[30.749,76.777],[30.746,76.791],[30.731,76.784],[30.735,76.770]];
 const openGraph=graph(new Set());
 const venueGates=new Map(data.venues.map(venue=>{const end=nearest(venue.point);return [venue.id,gatePoints.map(p=>[...major].sort((a,b)=>distance(p,nodes.get(a))-distance(p,nodes.get(b))).find(id=>route(openGraph,id,end)))];}));
 const hospitalAccess=new Map(data.venues.map(venue=>{const end=nearest(venue.point);return [venue.id,[...major].sort((a,b)=>distance(hospital.point,nodes.get(a))-distance(hospital.point,nodes.get(b))).find(id=>route(openGraph,id,end))];}));
 function timeline(input,cars,window){const slots=[];for(let t=-3;t<input.duration+2;t+=.5)slots.push({t,arrival:0,departure:0,parked:0});const distribute=(eligible,total,key)=>{const weights=eligible.map((_,i)=>1+Math.min(i,eligible.length-1-i));const sum=weights.reduce((a,b)=>a+b,0);let used=0;const fractions=eligible.map((s,i)=>{const exact=total*weights[i]/sum;s[key]=Math.floor(exact);used+=s[key];return {i,remainder:exact-Math.floor(exact)};}).sort((a,b)=>b.remainder-a.remainder);for(let i=0;i<total-used;i++)eligible[fractions[i].i][key]++;};distribute(slots.filter(s=>s.t>=-window && s.t<0),cars,'arrival');distribute(slots.filter(s=>s.t>=input.duration),cars,'departure');let count=0;slots.forEach(s=>{count+=s.arrival-s.departure;s.parked=Math.round(count*.85);});return slots;}
 function simulate(input,scenario='a'){
  const b=scenario==='b', closed=new Set(b?input.closedRoads:[]), window=b?Math.min(3,input.window+input.stagger):input.window;
  const shuttlePassengers=b?Math.min(input.attendance*input.carShare/100,input.shuttles*40*2):0;
  const cars=Math.ceil((input.attendance*input.carShare/100-shuttlePassengers)/input.occupancy);
  const slots=timeline(input,cars,window),peak=Math.max(...slots.map(s=>s.arrival*2));
  const venue=input.venue==='custom'?{id:'custom',name:'Custom event location',point:input.entrance||input.customVenue,eventPoint:input.customVenue}:data.venues.find(v=>v.id===input.venue)||data.venues[0],end=nearest(venue.point); if(!venueGates.has(end)){venueGates.set(end,gatePoints.map(p=>[...major].sort((a,b)=>distance(p,nodes.get(a))-distance(p,nodes.get(b))).find(id=>route(openGraph,id,end))));hospitalAccess.set(end,[...major].sort((a,b)=>distance(hospital.point,nodes.get(a))-distance(hospital.point,nodes.get(b))).find(id=>route(openGraph,id,end)));}
  const gates=venueGates.get(end),g=graph(closed),routes=gates.map(gate=>route(g,gate,end));
  const busRate=b?input.shuttles*2/window:0;
  const network=roads.map(r=>{const shut=closed.has(r.id);const flow=routes.filter(p=>p?.ids.includes(r.id)).length/4*(peak+busRate);const background=input.trafficCounts?.[r.id]?.volume??r.capacity*r.baseline;return {...r,background,measured:!!input.trafficCounts?.[r.id],eventFlow:flow,closed:shut,volume:shut?0:Math.round(background+flow),ratio:shut?0:(background+flow)/r.capacity};});
  const trafficGraph=graph(closed,new Map(network.map(r=>[r.id,r])));
  const timed=gates.map(gate=>route(trafficGraph,gate,end));
  const reachable=timed.filter(Boolean),travel=reachable.length?+(reachable.reduce((s,r)=>s+r.minutes,0)/reachable.length).toFixed(1):null;
  const emergencyRoute=route(trafficGraph,hospitalAccess.get(end),end);
  const demand=Math.max(...slots.map(s=>s.parked)),supply=input.parking+(b?input.extraParking:0);
  const sites=data.places.filter(p=>p.type==='parking').sort((a,z)=>distance(a.point,venue.point)-distance(z.point,venue.point)).slice(0,3);
  const capacities=[Math.round(input.parking*.5),Math.round(input.parking*.3)];capacities.push(input.parking-capacities[0]-capacities[1]);
  if(b&&input.extraParking>0){sites.push({id:'remote',name:'Proposed remote parking',point:[30.7328,76.7792],proposed:true});capacities.push(input.extraParking);}
  let remaining=demand;const parking=sites.map((p,i)=>{const occupied=Math.min(remaining,capacities[i]);remaining-=occupied;return {...p,capacity:capacities[i],occupied,free:capacities[i]-occupied};});
  return {gateNodes:gates,endNode:end,hospitalNode:hospitalAccess.get(end),cars,peak,network,travel,demand,supply,shortage:Math.max(0,demand-supply),emergency:emergencyRoute?+emergencyRoute.minutes.toFixed(1):null,emergencyRoute,accessOffsetKm:distance(hospital.point,nodes.get(hospitalAccess.get(end))),affected:network.filter(r=>!r.closed&&r.ratio>=.85).length,closed:[...closed],timeline:slots,parking,window,shuttlePassengers,unreachable:4-reachable.length,routes:timed,venue};
 }
 function validate(v){if(!v||typeof v!=='object')throw Error('Invalid scenario file.');const ranges={attendance:[500,15000],carShare:[0,100],occupancy:[1,8],parking:[0,10000],window:[1,3],duration:[1,8],shuttles:[0,100],extraParking:[0,5000],stagger:[0,2]};for(const [k,[lo,hi]] of Object.entries(ranges)){if(!Number.isFinite(v[k])||v[k]<lo||v[k]>hi)throw Error(`Invalid ${k}.`);}if(Math.abs(v.occupancy*10-Math.round(v.occupancy*10))>1e-8||v.attendance%100!==0||![1,2,3].includes(v.window)||!Number.isInteger(v.duration)||!Number.isInteger(v.shuttles)||!Number.isInteger(v.parking)||!Number.isInteger(v.extraParking)||!Number.isInteger(v.carShare)||![0,1,2].includes(v.stagger))throw Error('Invalid input increments.');if(!(data.venues.some(x=>x.id===v.venue)||(v.venue==='custom'&&v.customVenue))||typeof v.name!=='string'||!v.name.trim()||v.name.length>70||!/^\d{4}-\d{2}-\d{2}$/.test(v.date)||Number.isNaN(Date.parse(v.date))||!/^([01]\d|2[0-3]):[0-5]\d$/.test(v.time))throw Error('Invalid event details.');if(!Array.isArray(v.closedRoads)||v.closedRoads.length>roads.length||v.closedRoads.some(id=>!roads.some(r=>r.id===id)))throw Error('Unknown road in scenario file.');return v;}
 const api={simulate,validate,roads,hospital,distance,route,graph,nearest};root.UrbanModel=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);



