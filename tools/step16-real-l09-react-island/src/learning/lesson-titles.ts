import titles from '../../../../content/editorial/lesson-titles.v1.json';
type Locale='vi'|'en';
const authored:Readonly<Record<string,Readonly<Record<Locale,string>>>>=titles.lessons;
export function lessonTitles(id:string){return authored[id];}
export function lessonTitle(id:string,locale:Locale,fallback:string){return authored[id]?.[locale]??fallback;}
export function lessonTitleAliases(id:string,fallback:string){const t=authored[id];return t?[t.vi,t.en,fallback].join(' '):fallback;}
// Legacy private shelf and catalog read the same authored map, not persisted locale text.
if(typeof window!=='undefined')Object.assign(window,{liAuthoredLessonTitles:authored});
