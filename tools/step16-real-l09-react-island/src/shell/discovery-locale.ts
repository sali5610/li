import {useEffect,useState} from 'react';

export type DiscoveryLocale='vi'|'en';
type LanguageWindow=Window&{liLanguage?:{get:()=>string}};
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
