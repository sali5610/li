import {appUiStore} from './app-store.js';

/** Typed React consumer for the ONE canonical app route controller.
 * It preserves old route history, URL query cleanup, focus, activity and
 * account guards without dispatching synthetic clicks into hidden DOM.
 */
export type AppRoutePort={
 navigate:(id:string,options?:{focus?:boolean;remember?:boolean;syncUrl?:boolean})=>boolean;
 back:()=>boolean;
 getCurrent:()=>string;
 hasRoute:(id:string)=>boolean;
};
declare global{interface Window{liAppRouter?:AppRoutePort;}}
export function openRoute(id:string):boolean{
 const succeeded=window.liAppRouter?.navigate(id)===true;
 if(succeeded)syncCanonicalRoute();
 return succeeded;
}
export function goBack():boolean{
 const succeeded=window.liAppRouter?.back()===true;
 if(succeeded)syncCanonicalRoute();
 return succeeded;
}
export function currentRoute():string{
 return window.liAppRouter?.getCurrent()||'home';
}
/** Synchronize from the existing app router, never route around it. */
export function syncCanonicalRoute():void{
 appUiStore.getState().setRoute(currentRoute());
}
export function hasRoute(id:string):boolean{
 return window.liAppRouter?.hasRoute(id)===true;
}
