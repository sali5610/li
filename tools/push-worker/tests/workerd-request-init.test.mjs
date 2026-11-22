import test from 'node:test';
import assert from 'node:assert/strict';
import {Miniflare} from 'miniflare';

test('real workerd RequestInit rejects redirect:error but accepts manual, without external I/O',async()=>{
 const mf=new Miniflare({
  workers:[{config:{name:'li-redirect-qa',compatibilityDate:'2026-11-21',env:{},
   manifest:{mainModule:'index.mjs',modules:{'index.mjs':{type:'ESModule',contents:`export default {
   async fetch(){
     const common={method:'POST',cache:'no-store',credentials:'omit',
      headers:{Authorization:'Bearer synthetic-test-only'},body:'{}'};
     let badThrows=false;
     try{
      new Request('https://neon.example.invalid/rpc/li_is_invited',
       {...common,redirect:'error'});
     }catch(e){badThrows=e instanceof TypeError;}
     let manualWorks=false;
     try{
      const request=new Request('https://neon.example.invalid/rpc/li_is_invited',
       {...common,redirect:'manual'});
      manualWorks=request.redirect==='manual';
     }catch{manualWorks=false;}
     return Response.json({badThrows,manualWorks});
   }
  }`}}}}]
 });
 try{
  const res=await mf.dispatchFetch('http://localhost/');
  assert.equal(res.status,200);
  const data=await res.json();
  assert.equal(data.badThrows,true,'current Cloudflare workerd rejects redirect:error before HTTP');
  assert.equal(data.manualWorks,true,'manual redirect permits safe 3xx rejection by caller');
 }finally{await mf.dispose();}
});
