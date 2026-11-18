/* Step16 v2 backup candidate — branch-only until G3 review.
 * No network, backend, IndexedDB, analytics, service worker or secrets.
 * Explicit local JSON export/import. SHA-256 detects corruption, not authenticity.
 */
(function (root) {
  "use strict";
  const STORAGE_KEYS=Object.freeze([
    "li.private.library.v1","li.private.case-draft.v1","li.buddy-address.v1",
    "li.study-mode.v1","li.app.locale.v1","li.companion.position.v1",
    "li.private.lesson.visits.v1","li.private.problem.visits.v1",
    "li.personal.daily.v1","li.personal.daily.enabled.v1","li.spell.t02.due.v1"
  ]);
  const fixed=new Set(STORAGE_KEYS),lessonPattern=/^li\.review\.[A-Za-z0-9-]{1,64}\.v1$/;
  const FORMAT="li-backup",VERSION=2,MAX_BYTES=10*1024*1024,MAX_RECORDS=1000;
  const encode=new TextEncoder();
  const supported=key=>fixed.has(key)||lessonPattern.test(key);
  const bytes=value=>encode.encode(value).byteLength;
  function fault(code) { const error=new Error(code);error.code=code;throw error; }
  function jsonObject(value) {
    try { const data=JSON.parse(value);return data&&typeof data==="object"&&!Array.isArray(data)?data:null; }
    catch(e) { return null; }
  }
  function records(storage) {
    const output=[],unknown=[];
    for(let i=0;i<storage.length;i++){
      const key=storage.key(i);
      if(typeof key!=="string"||!key.startsWith("li."))continue;
      if(!supported(key)){unknown.push(key);continue;}
      const value=storage.getItem(key);
      if(typeof value!=="string")fault("unreadable");
      output.push({key,value});
    }
    if(unknown.length)fault("unknown-keys");
    if(output.length>MAX_RECORDS)fault("too-many");
    output.sort((a,b)=>a.key.localeCompare(b.key,"en"));
    return output;
  }
  async function checksum(entries) {
    if(!root.crypto||!root.crypto.subtle)fault("crypto");
    const raw=await root.crypto.subtle.digest("SHA-256",encode.encode(JSON.stringify(entries)));
    return Array.from(new Uint8Array(raw),n=>n.toString(16).padStart(2,"0")).join("");
  }
  async function exportJSON(storage,{draftValue}={}) {
    const snapshot=records(storage);
    if(draftValue!==undefined){
      const previous=snapshot.find(entry=>entry.key==="li.private.case-draft.v1");
      if(previous)previous.value=draftValue;
      else snapshot.push({key:"li.private.case-draft.v1",value:draftValue});
      snapshot.sort((a,b)=>a.key.localeCompare(b.key,"en"));
    }
    const data={format:FORMAT,version:VERSION,exportedAt:new Date().toISOString(),
      sourceOrigin:root.location.origin,records:snapshot,digest:await checksum(snapshot)};
    const text=JSON.stringify(data);
    if(bytes(text)>MAX_BYTES)fault("large");
    return text;
  }
  function assertValue(key,value){
    if(typeof value!=="string")fault("invalid-record");
    if(key==="li.private.case-draft.v1")return;
    if(key==="li.study-mode.v1"&&!["start","focus","overload","recover"].includes(value))fault("invalid-record");
    if(key==="li.app.locale.v1"&&!["vi","en"].includes(value))fault("invalid-record");
    if(key==="li.personal.daily.enabled.v1"&&!["true","false"].includes(value))fault("invalid-record");
    if(["li.study-mode.v1","li.app.locale.v1","li.personal.daily.enabled.v1"].includes(key))return;
    const data=jsonObject(value);
    if(!data)fault("invalid-record");
    if(key==="li.private.library.v1"&&(data.schema!==1||!Array.isArray(data.cases)||!Array.isArray(data.questions)||!Array.isArray(data.ideas)||!Array.isArray(data.savedContent)))fault("invalid-record");
    if(key==="li.buddy-address.v1"&&(!["warm","teasing","serious"].every(k=>typeof data[k]==="string"&&data[k].length<=100)))fault("invalid-record");
    if((key==="li.private.lesson.visits.v1"||key==="li.private.problem.visits.v1")&&(data.schema!==1||!Array.isArray(data.items)))fault("invalid-record");
    if(key==="li.personal.daily.v1"&&(data.schema!==1||!data.days||typeof data.days!=="object"||Array.isArray(data.days)))fault("invalid-record");
    if(key==="li.spell.t02.due.v1"&&!Number.isFinite(data.due))fault("invalid-record");
    if(key==="li.companion.position.v1"&&(!Number.isFinite(data.x)||!Number.isFinite(data.y)||data.x<0||data.y<0||data.x>1||data.y>1))fault("invalid-record");
  }
  function legacy(data){
    if(data.schema!==1||!Array.isArray(data.cases)||!Array.isArray(data.questions)||typeof data.draft!=="string")fault("schema");
    if(!data.cases.every(x=>x&&typeof x.title==="string"&&typeof x.revision==="string"&&typeof x.correct==="boolean"))fault("schema");
    if(!data.questions.every(x=>x&&typeof x.question==="string"))fault("schema");
    if(data.ideas!==undefined&&(!Array.isArray(data.ideas)||!data.ideas.every(x=>x&&typeof x.id==="string"&&typeof x.text==="string"&&x.text.length<=5000&&typeof x.savedAt==="string")))fault("schema");
    if(data.savedContent!==undefined&&(!Array.isArray(data.savedContent)||!data.savedContent.every(x=>x&&["lesson","case"].includes(x.type)&&typeof x.id==="string"&&typeof x.savedAt==="string")))fault("schema");
    if(data.buddyNames!==undefined&&(!data.buddyNames||typeof data.buddyNames!=="object"||Array.isArray(data.buddyNames)||!["warm","teasing","serious"].every(k=>typeof data.buddyNames[k]==="string"&&data.buddyNames[k].length<=100)))fault("schema");
    const output=[
      {key:"li.private.library.v1",value:JSON.stringify({schema:1,cases:data.cases,questions:data.questions,ideas:data.ideas||[],savedContent:data.savedContent||[],updatedAt:data.exportedAt||new Date(0).toISOString()})},
      {key:"li.private.case-draft.v1",value:data.draft}
    ];
    if(data.buddyNames!==undefined)output.push({key:"li.buddy-address.v1",value:JSON.stringify(data.buddyNames)});
    return output.sort((a,b)=>a.key.localeCompare(b.key,"en"));
  }
  async function parse(text){
    if(typeof text!=="string"||bytes(text)>MAX_BYTES)fault("large");
    let data;
    try{data=JSON.parse(text);}catch(e){fault("json");}
    if(!data||typeof data!=="object"||Array.isArray(data))fault("schema");
    if(data.schema===1)return{entries:legacy(data),kind:"legacy",mode:"merge",warning:"partial"};
    if(data.format!==FORMAT||data.version!==VERSION||!Number.isFinite(Date.parse(data.exportedAt))||
      typeof data.sourceOrigin!=="string"||!Array.isArray(data.records)||data.records.length>MAX_RECORDS||
      !/^[a-f0-9]{64}$/.test(data.digest||""))fault("schema");
    const seen=new Set();
    for(const row of data.records){
      if(!row||typeof row.key!=="string"||!supported(row.key)||seen.has(row.key))fault("invalid-record");
      assertValue(row.key,row.value);
      seen.add(row.key);
    }
    if(await checksum(data.records)!==data.digest)fault("checksum");
    return{entries:data.records,kind:"full",mode:"replace",warning:null};
  }
  async function preview(storage,text){
    const incoming=await parse(text);
    const before=records(storage);
    const existing=new Map(before.map(x=>[x.key,x.value]));
    const wanted=new Map(incoming.entries.map(x=>[x.key,x.value]));
    return{
      kind:incoming.kind,mode:incoming.mode,warning:incoming.warning,
      total:incoming.entries.length,
      add:incoming.entries.filter(x=>!existing.has(x.key)).length,
      update:incoming.entries.filter(x=>existing.has(x.key)&&existing.get(x.key)!==x.value).length,
      remove:incoming.mode==="replace"?before.filter(x=>!wanted.has(x.key)).length:0,
      unchanged:incoming.entries.filter(x=>existing.get(x.key)===x.value).length,
      fingerprint:await checksum(before)
    };
  }
  function rollback(storage,before,touched) {
    const old=new Map(before.map(row=>[row.key,row.value]));
    const errors=[];
    for(const key of touched){
      try{
        if(old.has(key))storage.setItem(key,old.get(key));
        else storage.removeItem(key);
        if(storage.getItem(key)!==(old.has(key)?old.get(key):null))errors.push(key);
      }catch(e){errors.push(key);}
    }
    return errors.length===0;
  }
  async function importJSON(storage,text,{confirmed=false,fingerprint}={}){
    const plan=await preview(storage,text);
    if(!confirmed)return{applied:false,plan};
    if(typeof fingerprint!=="string"||fingerprint!==plan.fingerprint)fault("changed");
    const incoming=await parse(text),before=records(storage);
    const touched=[...new Set([...before.map(x=>x.key),...incoming.entries.map(x=>x.key)])];
    try {
      for(const {key,value} of incoming.entries){
        storage.setItem(key,value);
        if(storage.getItem(key)!==value)fault("write");
      }
      if(incoming.mode==="replace"){
        const keep=new Set(incoming.entries.map(x=>x.key));
        for(const {key} of before)if(!keep.has(key)){
          storage.removeItem(key);
          if(storage.getItem(key)!==null)fault("write");
        }
      }
    }catch(e){
      if(!rollback(storage,before,touched))fault("rollback-failed");
      fault("write");
    }
    return{applied:true,plan};
  }
  root.LiBackupV2=Object.freeze({STORAGE_KEYS,exportJSON,parse,preview,importJSON});
})(window);
