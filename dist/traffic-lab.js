(function(root){
 'use strict';
 // Bounded, deterministic lane simulation; not a calibrated city traffic model.
 function simulate(options={}){
  const demand=Number(options.demand??1600),minutes=Number(options.minutes??10),speed=Number(options.speed??35),cycle=Number(options.cycle??80),green=Number(options.green??38),closed=!!options.closed;
  if(![demand,minutes,speed,cycle,green].every(Number.isFinite)||demand<0||demand>6000||minutes<1||minutes>15||speed<10||speed>60||cycle<30||cycle>150||green<10||green>cycle-14)throw new Error('Check demand, duration, speed and green time. Leave at least 10 seconds for east–west plus 4 clearance seconds.');
  const dt=.2,length=400,stop=180,vmax=speed/3.6,lanes=Array.from({length:8},()=>[]),waiting=[[],[],[],[]];
  let randomState=123456789,id=0,completed=0,totalTime=0,laneChanges=0,maxQueue=0,queueSum=0,maxExternal=0;const frames=[];
  const random=()=>{randomState=(Math.imul(1664525,randomState)+1013904223)>>>0;return randomState/4294967296;};
  const phase=t=>{const v=t%cycle;return v<green?'NS':v<green+2?'clear':v<cycle-2?'EW':'clear';};
  for(let tick=0;tick<minutes*60/dt;tick++){
   const t=tick*dt,signal=phase(t);
   for(let dir=0;dir<4;dir++)if(random()<demand/4/3600*dt)waiting[dir].push({id:++id,born:t});
   for(let dir=0;dir<4;dir++){
    const allowed=[dir*2,...(closed&&dir===0?[]:[dir*2+1])];
    allowed.sort((a,b)=>lanes[a].length-lanes[b].length);
    for(const lane of allowed){if(!waiting[dir].length)break;const rear=lanes[lane].at(-1);if(!rear||rear.x>9){const arrival=waiting[dir].shift();lanes[lane].push({...arrival,x:0,v:Math.min(vmax,rear?rear.v:8)});}}
   }
   // Limited discretionary lane changes before the intersection, with front/rear gaps.
   if(tick%5===0)for(let lane=0;lane<8;lane++){
    if(closed&&lane<2)continue;const other=lane^1;
    for(let i=lanes[lane].length-1;i>=1;i--){const car=lanes[lane][i],leader=lanes[lane][i-1];if(car.x>150||leader.x-car.x>20)continue;
     const ahead=lanes[other].filter(c=>c.x>=car.x).at(-1),behind=lanes[other].find(c=>c.x<car.x);
     if((!ahead||ahead.x-car.x>25)&&(!behind||car.x-behind.x>20)){lanes[lane].splice(i,1);lanes[other].push(car);lanes[other].sort((a,b)=>b.x-a.x);laneChanges++;}
    }
   }
   let queued=0;
   for(let lane=0;lane<8;lane++){
    const cars=lanes[lane],dir=Math.floor(lane/2),go=signal===(dir<2?'NS':'EW');
    for(let i=0;i<cars.length;i++){
     const car=cars[i],leader=cars[i-1];let boundary=leader?leader.x-7:Infinity;
     if(!go&&car.x<=stop)boundary=Math.min(boundary,stop);
     const gap=Math.max(0,boundary-car.x),safe=Math.sqrt(2*2.5*gap),following=leader?Math.max(0,(leader.x-car.x-7)/1.3):vmax;
     const target=Math.min(vmax,safe,following);
     car.v=Math.max(0,Math.min(car.v+1.6*dt,target));car.x=Math.min(boundary,car.x+car.v*dt);
     if(car.v<.5&&car.x<=stop)queued++;
    }
    while(cars[0]?.x>=length){const done=cars.shift();completed++;totalTime+=t+dt-done.born;}
   }
   const external=waiting.reduce((n,a)=>n+a.length,0);maxExternal=Math.max(maxExternal,external);maxQueue=Math.max(maxQueue,queued);queueSum+=queued;
   if(tick%10===0)frames.push({t:Math.round(t),signal,queued,external,completed,cars:lanes.flatMap((cars,lane)=>cars.map(c=>({lane,x:Math.round(c.x*10)/10,v:Math.round(c.v*10)/10,id:c.id})))});
  }
  const remaining=lanes.reduce((n,a)=>n+a.length,0),waitingCount=waiting.reduce((n,a)=>n+a.length,0);
  return {frames,generated:id,completed,remaining,waiting:waitingCount,maxExternal,maxQueue,averageQueue:queueSum/(minutes*60/dt),averageTime:completed?totalTime/completed:null,delay:completed?Math.max(0,totalTime/completed-length/vmax):null,laneChanges,options:{demand,minutes,speed,cycle,green,closed}};
 }
 const api={simulate};if(typeof module!=='undefined')module.exports=api;else root.TrafficLab=api;
})(globalThis);
