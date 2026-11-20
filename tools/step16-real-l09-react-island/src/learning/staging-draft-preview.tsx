import React,{useMemo,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {initial} from '../native-bridge';
import type {Attempt} from '../native-bridge';
import type {LearningPorts} from './ports';
import {SectionedJourney} from './SectionedJourney';
import type {SectionedLesson} from './SectionedJourney';
import {neonSessionPort} from '../auth/neon-client';
import {NEON_DATA_API_URL} from '../auth/config';
import {checkInviteAccess} from '../sync/invite-access';
import '../../../../design-system/react/atoms.css';
import '../../../../design-system/react/components.css';
import '../../../../design-system/react/controls.css';
import './journey.css';

/** Invited-account STAGING preview of all 17 source-preserving drafts.
 * Not an editorial release: no catalog entries, content packs or Neon writes.
 * Practice is isolated under a per-account, per-lesson localStorage key.
 */
const IDS=[
 'L03-1-1','L03-1-3','L03-2-1','L03-2-2','L03-2-3',
 'L09-1-3','L09-2-1','L09-2-2','L09-2-3','L09-3-1','L09-3-2','L09-3-3',
 'L15-2-1','L15-2-3','L15-3-1','L15-3-2','L15-3-3'
] as const;
const modules=import.meta.glob('../../../../content/editorial/normalized/*.draft.v1.json',
 {eager:true,import:'default'}) as Record<string,unknown>;
type SourceDraft={
 id:string;title:{sourceTitle:string};reviewState:string;publishState:string;
 rights:{releaseAuthorized:boolean};content:{
  format:string;localized:Record<'vi'|'en',{
   intro_md:string;sections:Array<{role:string;heading:string;body_md:string;
    feedback_md?:string|null;feedback_gate?:string}>;
   assessment:{questions:string[];rubricCriteria:string[][]}
  }>;technique:{primary:string};companion:{structuredMoments:unknown[]}
 };
};
const drafts=new Map(Object.values(modules).map(raw=>{
 const d=raw as SourceDraft;
 return [d.id,d] as const;
}));
function draftLesson(id:string):SectionedLesson{
 if(!IDS.some(x=>x===id))throw Error('PREVIEW_ID_NOT_IN_BATCH_17');
 const d=drafts.get(id);
 if(!d||d.id!==id||d.publishState!=='draft'||d.reviewState!=='proposed'||
  d.rights?.releaseAuthorized!==false||d.content?.format!=='editorial-sectioned-draft-v1'||
  !['vi','en'].every(loc=>{
   const c=d.content.localized[loc as 'vi'|'en'];
   return !!c?.intro_md&&Array.isArray(c.sections)&&
    c.sections.some(s=>s.role==='guided')&&
    c.sections.some(s=>s.role==='methods'&&
     !!s.feedback_md&&s.feedback_gate==='AFTER_MEANINGFUL_METHOD_ATTEMPT')&&
    c.sections.some(s=>s.role==='independent')&&
    c.assessment?.questions?.length===4&&c.assessment?.rubricCriteria?.length===4;
  })||d.content.companion?.structuredMoments?.length!==6)
  throw Error('PREVIEW_DRAFT_INCOMPLETE '+id);
 const field=id.startsWith('L03')?'Human–Computer Interaction':
  id.startsWith('L09')?'Data Science':'Supply Chain Management';
 // Presentation adapter only. Preserve actual proposed/draft status; do not
 // write any approved metadata to the source, catalog or content compiler.
 return {...d,version:'personal-preview-2026-11-21-'+id,
  title:{vi:d.title.sourceTitle,en:d.title.sourceTitle},
  hierarchy:{field:{title:field}},
  content:{...d.content,format:'editorial-sectioned-v1'}
 } as unknown as SectionedLesson;
}
const MISSING='li:missing';
function previewKey(uid:string,id:string):string{
 return 'li.personal.preview.batch17.v1:'+uid+':'+id;
}
function safeRead(key:string):{attempt:Attempt;revision:string}{
 const raw=localStorage.getItem(key);
 if(raw===null)return {attempt:initial(),revision:MISSING};
 const obj:unknown=JSON.parse(raw);
 if(!obj||typeof obj!=='object'||Array.isArray(obj))throw Error('PREVIEW_SAVED_STATE_INVALID');
 const a={...initial(),...obj} as Attempt;
 if(!Array.isArray(a.draft)||a.draft.length!==4||
   !Array.isArray(a.ratings)||a.ratings.length!==4)
  throw Error('PREVIEW_SAVED_STATE_INVALID');
 return {attempt:a,revision:raw};
}
function previewPorts(id:string,onBack:()=>void):LearningPorts{
 let verifiedUid:string|null=null;
 function check(lessonId:string,uid:string){
  if(lessonId!==id||!verifiedUid||uid!==verifiedUid||
   !document.documentElement.classList.contains('li-auth-verified'))
   throw Error('PREVIEW_INVITED_ACCOUNT_REQUIRED');
 }
 return {
  auth:{async requireInvitedLearner(){
   if(!document.documentElement.classList.contains('li-auth-verified'))
    throw Error('PREVIEW_LOGIN_REQUIRED');
   const session=await neonSessionPort.getSession();
   const uid=session.data?.user?.id;
   if(session.error||!uid||!await checkInviteAccess(NEON_DATA_API_URL,neonSessionPort))
    throw Error('PREVIEW_INVITE_REQUIRED');
   verifiedUid=uid;
   return {subjectId:uid};
  }},
  attempts:{
   async load({lessonId,subjectId}){
    check(lessonId,subjectId);
    return safeRead(previewKey(subjectId,id));
   },
   async save({lessonId,subjectId,attempt,expectedRevision}){
    check(lessonId,subjectId);
    if(!Array.isArray(attempt.draft)||attempt.draft.length!==4||
      !Array.isArray(attempt.ratings)||attempt.ratings.length!==4)
     throw Error('PREVIEW_ATTEMPT_INVALID');
    const key=previewKey(subjectId,id);
    const current=localStorage.getItem(key);
    if((current??MISSING)!==expectedRevision)throw Error('PREVIEW_REVISION_CONFLICT');
    const value=JSON.stringify(attempt);
    if(value.length>60000)throw Error('PREVIEW_RECORD_TOO_LARGE');
    localStorage.setItem(key,value);
    if(localStorage.getItem(key)!==value)throw Error('PREVIEW_SAVE_FAILED');
    return {revision:value};
   }
  },
  sync:{async getStatus({lessonId,subjectId}){
   check(lessonId,subjectId);
   return 'on-device';
  }},
  navigation:{openCatalog:onBack},
  search:{openSearch(query){
   const router=window as Window&{liAppRouter?:{navigate:(id:string)=>boolean};
    liSearch?:{render?:(text:string)=>void}};
   if(router.liAppRouter?.navigate('search'))router.liSearch?.render?.(query);
  }}
 };
}
function BatchPreview(){
 const [selected,setSelected]=useState<string|null>(null);
 const lesson=useMemo(()=>selected?draftLesson(selected):null,[selected]);
 const ports=useMemo(()=>selected?previewPorts(selected,()=>setSelected(null)):null,[selected]);
 if(lesson&&ports)return <div className="section-shell" data-li-batch17-preview="lesson">
  <button className="btn secondary" type="button" onClick={()=>setSelected(null)}>
   ← Danh sách 17 bài
  </button>
  <SectionedJourney key={lesson.id} lesson={lesson} ports={ports} preview/>
 </div>;
 return <div className="section-shell" data-li-batch17-preview="list">
  <div className="kicker">STAGING · HỌC THỬ CÁ NHÂN</div>
  <h1 className="display-title">17 bài đã có thể học thử</h1>
  <p className="intro">Chọn bài → đọc → luyện phương pháp → làm 4 câu → đối chiếu → xem tiến độ.
   Đây là bản thảo cho việc học cá nhân, không phải nội dung đã được xác nhận học thuật.</p>
  <p role="note">Tiến độ thử được lưu riêng trên <strong>thiết bị này</strong> theo tài khoản đã mời.
   Chưa đồng bộ giữa iPhone, Safari và iPad. Tàng Thư chính và bài học đã phát hành không đổi.</p>
  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:'12px'}}>
   {IDS.map(id=><button key={id} type="button" className="surface"
     style={{textAlign:'left',cursor:'pointer',padding:'16px'}}
     onClick={()=>setSelected(id)}>
     <strong>{id}</strong>
     <span style={{display:'block',marginTop:'8px'}}>{drafts.get(id)?.title?.sourceTitle||'Bài học'}</span>
   </button>)}
  </div>
 </div>;
}
/** Added ONLY to the integrated GitHub Pages staging entrypoint. */
export function mountStagingDraftPreview():void{
 if(import.meta.env.VITE_LI_AUTH_TARGET!=='github-pages-staging')return;
 const main=document.getElementById('main');
 const tools=document.querySelector('.header .tools');
 if(!main||!tools||document.getElementById('page-draftPreview'))
  throw Error('BATCH17_PREVIEW_STAGE_HOST_MISSING');
 const page=document.createElement('section');
 page.id='page-draftPreview';page.className='page';page.tabIndex=-1;
 const host=document.createElement('div');
 host.id='li-batch17-preview-host';page.append(host);main.append(page);
 const button=document.createElement('button');
 button.id='li-batch17-preview-link';
 button.type='button';button.className='tool-button';
 button.textContent='17 bài';
 button.setAttribute('aria-label','Học thử 17 bài riêng trên staging');
 button.hidden=true;tools.append(button);
 button.addEventListener('click',()=>{
  if(!document.documentElement.classList.contains('li-auth-verified'))return;
  const nav=window as Window&{liAppRouter?:{navigate:(id:string)=>boolean}};
  nav.liAppRouter?.navigate('draftPreview');
 });
 let dispose:(()=>void)|null=null;
 const update=()=>{
  const verified=document.documentElement.classList.contains('li-auth-verified');
  button.hidden=!verified;
  if(verified&&page.classList.contains('active')&&!dispose){
   const root=createRoot(host);
   root.render(<BatchPreview/>);
   dispose=()=>root.unmount();
  }else if((!verified||!page.classList.contains('active'))&&dispose){
   dispose();dispose=null;
  }
 };
 const observer=new MutationObserver(update);
 observer.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
 observer.observe(page,{attributes:true,attributeFilter:['class']});
 update();
}
