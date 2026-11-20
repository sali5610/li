// SYNC-161 one-time LIVE Data API route/security smoke. No Google JWT, no user data.
import {randomUUID} from 'node:crypto';
const url='https://ep-misty-snow-azfrrm3o.apirest.c-3.ap-southeast-1.aws.neon.tech/li/rest/v1/rpc/li_apply_user_edit_v1';
const request={
 p_item_type:'__li_sync161_invalid_type__', // even authenticated never writes
 p_item_id:'__li_sync161_route_probe__',
 p_payload:{qa_probe:true},
 p_deleted_at:null,
 p_base_revision:0,
 p_op_id:randomUUID()
};
const response=await fetch(url,{
 method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},
 body:JSON.stringify(request),signal:AbortSignal.timeout(15000),
 cache:'no-store',redirect:'error'
});
const raw=await response.text();
let code=null;
try{const body=JSON.parse(raw);code=typeof body.code==='string'?body.code:null;}
catch{code='NON_JSON';}
console.log('LIVE RPC route anonymous-negative:',JSON.stringify({http_status:response.status,code}));
if(response.ok)throw new Error('SECURITY_FAILURE_UNAUTHENTICATED_RPC_ACCEPTED');
if(code==='PGRST202')throw new Error('SCHEMA_CACHE_OR_ROLE_VISIBILITY_RPC_NOT_DISCOVERABLE');
if(response.status>=500)throw new Error('LIVE_DATA_API_SERVER_ERROR');
if(![400,401,403,404,405].includes(response.status))
 throw new Error('UNEXPECTED_DATA_API_STATUS');
console.log('PASS anonymous request rejected; no client JWT or learner payload used.');
