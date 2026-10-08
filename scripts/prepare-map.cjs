const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const raw = JSON.parse(fs.readFileSync(path.join(root, 'osm-source.json'), 'utf8').replace(/^\uFEFF/,''));
const roads = raw.elements.filter(e=>e.type==='way' && e.tags?.highway && e.geometry?.length>1 && e.tags.access!=='private').map(e=>({id:String(e.id),name:e.tags.name || `${e.tags.highway === 'service' ? 'Access' : 'Local'} road · ${String(e.id).slice(-4)}`,kind:e.tags.highway,oneway:e.tags.oneway==='yes'?1:e.tags.oneway==='-1'?-1:0,nodes:e.nodes.map(String),points:e.geometry.map(p=>[p.lat,p.lon])}));
const places = raw.elements.filter(e=>['parking','hospital'].includes(e.tags?.amenity) && !/pet|veterinary/i.test(e.tags.name||'')).map(e=>{const c=e.center || (e.lat?{lat:e.lat,lon:e.lon}:e.bounds?{lat:(e.bounds.minlat+e.bounds.maxlat)/2,lon:(e.bounds.minlon+e.bounds.maxlon)/2}:null);return c?{id:String(e.id),type:e.tags.amenity,name:e.tags.name || `Mapped ${e.tags.amenity} · ${String(e.id).slice(-4)}`,point:[c.lat,c.lon]}:null;}).filter(Boolean);
const data={source:'OpenStreetMap contributors · ODbL',downloaded:new Date().toISOString().slice(0,10),roads,places,venues:[{id:'plaza',name:'Sector 17 Plaza',point:[30.7404,76.7821]},{id:'grounds',name:'Sector 17 Parade Ground',point:[30.7355,76.7786]}]};
fs.writeFileSync(path.join(root,'dist/map-data.js'),'/* OpenStreetMap contributors, ODbL. Approximate venue pins; synthetic traffic capacities. */\n(function(root){ const data='+JSON.stringify(data)+'; root.CityData=data; if(typeof module!=="undefined") module.exports=data; })(typeof window!=="undefined"?window:globalThis);\n');
console.log(`${roads.length} mapped road segments, ${places.length} places packaged.`);
