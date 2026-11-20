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
 return window.liAppRouter?.navigate(id)===true;
}
export function goBack():boolean{
 return window.liAppRouter?.back()===true;
}
export function currentRoute():string{
 return window.liAppRouter?.getCurrent()||'home';
}
export function hasRoute(id:string):boolean{
 return window.liAppRouter?.hasRoute(id)===true;
}
