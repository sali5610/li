import {useEffect,useState} from 'react';

export type DiscoveryLocale='vi'|'en';
export type BilingualCopy=readonly [vi:string,en:string];
type LanguageWindow=Window&{liLanguage?:{get:()=>string;translate?:(value:string)=>string}};
export function discoveryLocale():DiscoveryLocale{
 return (window as LanguageWindow).liLanguage?.get?.()==='en'?'en':'vi';
}
/** React locale follows the app language port, never translated DOM mutations. */
export function useDiscoveryLocale():DiscoveryLocale{
 const [locale,setLocale]=useState<DiscoveryLocale>(discoveryLocale);
 useEffect(()=>{
  const sync=()=>setLocale(discoveryLocale());
  window.addEventListener('li:localechange',sync);
  return()=>window.removeEventListener('li:localechange',sync);
 },[]);
 return locale;
}
export function localized(locale:DiscoveryLocale,vi:string,en:string):string{
 return locale==='en'?en:vi;
}

/** Localize authored app data such as catalog titles and status messages. */
export function authoredCopy(value:string):string{
 return (window as LanguageWindow).liLanguage?.translate?.(value)??value;
}
