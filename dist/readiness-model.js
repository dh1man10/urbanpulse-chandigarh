(function(root){
 'use strict';
 const empty=()=>({evidence:[],observations:[],checks:[],tasks:[],incidents:[],reviews:[]});
 const limits={evidence:50,observations:100,checks:30,tasks:50,incidents:100,reviews:50};
 function validate(value){
  if(value===undefined)return empty();
  if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid readiness notebook.');
  const out=empty();
  for(const [key,max] of Object.entries(limits)){
   if(!Array.isArray(value[key])||value[key].length>max)throw Error('Invalid '+key+' records.');
   out[key]=value[key].map(row=>{
    if(!row||typeof row!=='object'||Array.isArray(row))throw Error('Invalid notebook record.');
    const clean={};for(const [k,v] of Object.entries(row)){
     if(!/^[a-zA-Z]{1,30}$/.test(k)||!['string','number','boolean'].includes(typeof v)||(typeof v==='string'&&v.length>1200)||(typeof v==='number'&&!Number.isFinite(v)))throw Error('Invalid notebook field.');
     clean[k]=v;
    }
    if(key==='observations'&&(!Number.isFinite(row.predicted)||row.predicted<0||!Number.isFinite(row.actual)||row.actual<0||!['traffic','parking'].includes(row.metric)||row.independent!==true))throw Error('Invalid independent observation.');
    return clean;
   });
  }
  return out;
 }
 function accuracy(rows,metric){const sample=rows.filter(r=>r.metric===metric),n=sample.length;if(!n)return null;const total=sample.reduce((s,r)=>s+r.actual,0),error=sample.reduce((s,r)=>s+Math.abs(r.predicted-r.actual),0);return {n,mae:error/n,wape:total?100*error/total:null,bias:sample.reduce((s,r)=>s+r.predicted-r.actual,0)/n};}
 function age(date,today=new Date().toISOString().slice(0,10)){const stamp=Date.parse(date+'T00:00:00Z');if(!Number.isFinite(stamp)||new Date(stamp).toISOString().slice(0,10)!==date)return 'Invalid date';const days=Math.floor((Date.parse(today+'T00:00:00Z')-stamp)/86400000);return days<0?'Future date':days>30?days+' days old · review':days+' days old';}
 const api={empty,validate,accuracy,age};root.ReadinessModel=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
