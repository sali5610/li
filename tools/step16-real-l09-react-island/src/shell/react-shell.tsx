import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import './react-shell.css';

/** The visual chrome of the invited app is React-owned. The existing legacy
 * toast() function is retained as a fallback for a failed React bundle only;
 * all mounted UI and Undo affordances are rendered here.
 */
type Undo=()=>boolean|void;
type ToastPort={show:(message:string,undo?:Undo|null)=>void};
type ToastWindow=Window&{liReactToastPort?:ToastPort};
type Notice={serial:number;message:string;undo:Undo|null};
const app=window as ToastWindow;

function Brand(){
 return <>
  <img className="brand-stamp" src="./assets/li-seal.svg?v=exact-header-s146"
   alt="" aria-hidden="true" width={42} height={42}/>
  <span className="brand-copy"><span className="logo">li.</span></span>
 </>;
}
function Footer(){
 return <><b>li. (理)</b><span className="footer-tagline">THE WORLD OF KNOWING WHY</span></>;
}
function Notification({host}:{host:HTMLElement}){
 const [notice,setNotice]=useState<Notice|null>(null);
 const serial=useRef(0);
 useEffect(()=>{
  const port:ToastPort={show:(message,undo=null)=>{
   setNotice({serial:++serial.current,message:String(message),undo:typeof undo==='function'?undo:null});
  }};
  app.liReactToastPort=port;
  // Auth explicitly publishes its lifecycle; no DOM polling or observer.
  // Never retain the former learner's private toast/Undo on sign-out.
  const onAuth=(event:Event)=>{
   if((event as CustomEvent<{verified?:boolean}>).detail?.verified===false)
    setNotice(null);
  };
  window.addEventListener('li:auth-verified-changed',onAuth);
  return ()=>{
   window.removeEventListener('li:auth-verified-changed',onAuth);
   if(app.liReactToastPort===port)delete app.liReactToastPort;
  };
 },[]);
 useEffect(()=>{
  host.style.display=notice?'flex':'none';
  if(!notice)return;
  const current=notice.serial;
  const timer=window.setTimeout(()=>{
   setNotice(previous=>previous?.serial===current?null:previous);
  },notice.undo?7000:2600);
  return ()=>window.clearTimeout(timer);
 },[host,notice?.serial]);
 const undo=()=>{
  const action=notice?.undo;
  if(!action)return;
  // React stops offering the undo before invoking a possibly slow write.
  setNotice(null);
  let restored=false;
  try{restored=action()!==false;}catch{restored=false;}
  setNotice({serial:++serial.current,
   message:restored?'Đã hoàn tác.':'Không thể hoàn tác. Dữ liệu chưa được khôi phục.',
   undo:null});
 };
 return notice?<>
  <span className="li-snackbar-message">{notice.message}</span>
  {notice.undo&&<button type="button" className="li-snackbar-undo"
   aria-label={'Hoàn tác: '+notice.message} onClick={undo}>Hoàn tác</button>}
 </>:null;
}

/** No additional product routes and no parallel app tree. React replaces
 * the existing static brand/footer and the original toast's children in place.
 */
export function mountReactChrome(){
 const brand=document.querySelector<HTMLElement>('.header .brand');
 const footer=document.querySelector<HTMLElement>('.app > .footer');
 const toast=document.getElementById('toast');
 if(!brand||!footer||!toast)throw Error('REACT_CHROME_HOST_MISSING');
 const brandRoot=createRoot(brand),footerRoot=createRoot(footer),toastRoot=createRoot(toast);
 toast.classList.add('li-react-toast-owner');
 brandRoot.render(<Brand/>);
 footerRoot.render(<Footer/>);
 toastRoot.render(<Notification host={toast}/>);
 return ()=>{
  toastRoot.unmount();brandRoot.unmount();footerRoot.unmount();
  toast.classList.remove('li-react-toast-owner');
  toast.style.display='none';
 };
}
