import React from 'react';
import curriculum from '../../../../content/curriculum/legacy-catalog.v1.json';
import {Button,Text} from '../../../../design-system/react/index';
import './library-taxonomy.css';

/** The existing published Catalog owns taxonomy; private notes only store stable IDs. */
type TaxonomyRecord={fieldId?:string|null;lessonId?:string|null};
type FilterValue={group:string;field:string;lesson:string};
export const emptyTaxonomy:FilterValue={group:'all',field:'all',lesson:'all'};
const groups=curriculum.groups;
const fields=groups.flatMap(group=>group.fields.map(field=>({
 id:field.id,name:field.name,groupId:group.id,groupName:group.title,groupNameEn:group.titleEn,
 lessons:field.courses.flatMap(course=>course.lessons.map(lesson=>({id:lesson.id,title:lesson.title})))
})));
const byField=new Map(fields.map(item=>[item.id,item]));
const byLesson=new Map(fields.flatMap(field=>field.lessons.map(lesson=>[lesson.id,{field,...lesson}] as const)));
// Legacy storage port validates selections against this read-only Catalog allowlist.
(window as Window&{liTaxonomyFieldIds?:string[]}).liTaxonomyFieldIds=fields.map(item=>item.id);

const english=()=>((window as Window&{liLanguage?:{get?:()=>string}}).liLanguage?.get?.()==='en');
const label=(vi:string,en:string)=>english()?en:vi;
export function metadataOf(record:TaxonomyRecord){
 const explicit=record.fieldId?byField.get(record.fieldId):undefined;
 const fromLesson=record.lessonId?byLesson.get(record.lessonId):undefined;
 const field=explicit||fromLesson?.field||null;
 const lesson=fromLesson&&field?.id===fromLesson.field.id?fromLesson:null;
 return {groupId:field?.groupId||null,fieldId:field?.id||null,lessonId:lesson?.id||null};
}
export function matchesTaxonomy(record:TaxonomyRecord,value:FilterValue){
 const ref=metadataOf(record);
 if(value.group==='unclassified')return !ref.groupId;
 if(value.group!=='all'&&ref.groupId!==value.group)return false;
 if(value.field!=='all'&&ref.fieldId!==value.field)return false;
 if(value.lesson!=='all'&&ref.lessonId!==value.lesson)return false;
 return true;
}
export function fieldLabel(id:string|null|undefined){
 return byField.get(id||'')?.name||null;
}
export function FieldPicker({id,value,onChange}:{
 id:string;value:string|null|undefined;onChange:(fieldId:string|null)=>void
}){
 return <label className="li-note-field-picker" htmlFor={id}>
  <span>{label('Gắn vào chuyên ngành (không bắt buộc)','Link to a field (optional)')}</span>
  <select id={id} className="searchbox li-taxonomy-select" value={value||''}
   onChange={event=>onChange(event.target.value||null)}>
   <option value="">{label('Chưa gắn chuyên ngành','No field selected')}</option>
   {groups.map(group=><optgroup key={group.id} label={english()?group.titleEn:group.title}>
    {group.fields.map(field=><option key={field.id} value={field.id}>{field.name}</option>)}
   </optgroup>)}
  </select>
 </label>;
}
type DropdownOption={value:string;label:string};
function TaxonomyDropdown({label:heading,value,options,onChange,disabled=false}:{
 label:string;value:string;options:DropdownOption[];
 onChange:(next:string)=>void;disabled?:boolean
}){
 return <label className="li-taxonomy-dropdown">
  <span>{heading}</span>
  <select className="li-taxonomy-select" value={value} disabled={disabled}
   onChange={event=>onChange(event.target.value)}>
   {options.map(option=><option value={option.value} key={option.value}>{option.label}</option>)}
  </select>
 </label>;
}
export function TaxonomyFilters({records,value,onChange,onClear,otherFiltersActive=false}:{
 records:TaxonomyRecord[];value:FilterValue;onChange:(next:FilterValue)=>void;
 onClear?:()=>void;otherFiltersActive?:boolean
}){
 const available=records.map(metadataOf);
 const groupIds=new Set(available.map(item=>item.groupId).filter(Boolean));
 const hasUnclassified=available.some(item=>!item.groupId);
 const groupOptions=[
  {value:'all',label:label('Tất cả ngành','All groups')},
  ...groups.filter(group=>groupIds.has(group.id)).map(group=>({
   value:group.id,label:english()?group.titleEn:group.title
  })),
  ...(hasUnclassified?[{value:'unclassified',label:label('Chưa phân loại','Unclassified')}]:[])
 ];
 const fieldIds=new Set(available.filter(ref=>value.group==='all'||ref.groupId===value.group)
  .map(ref=>ref.fieldId).filter(Boolean));
 const fieldOptions=[{value:'all',label:label('Tất cả chuyên ngành','All fields')},
  ...fields.filter(field=>fieldIds.has(field.id)).map(field=>({value:field.id,label:field.name}))];
 const lessonIds=new Set(available.filter(ref=>
  (value.group==='all'||ref.groupId===value.group)&&
  (value.field==='all'||ref.fieldId===value.field)).map(ref=>ref.lessonId).filter(Boolean));
 const lessonOptions=[{value:'all',label:label('Tất cả bài','All lessons')},
  ...Array.from(lessonIds).flatMap(id=>{
   const entry=id?byLesson.get(id):undefined;
   return entry?[{value:entry.id,label:entry.title}]:[];
  })];
 const isFiltered=value.group!=='all'||value.field!=='all'||value.lesson!=='all';
 return <div className="li-library-taxonomy" role="group"
  aria-label={label('Lọc theo chương trình học','Filter by curriculum')}>
  <div className="li-library-taxonomy-fields">
   <TaxonomyDropdown label={label('Ngành','Group')} value={value.group}
    options={groupOptions} disabled={groupOptions.length===1}
    onChange={group=>onChange({group,field:'all',lesson:'all'})}/>
   <TaxonomyDropdown label={label('Chuyên ngành','Field')} value={value.field}
    options={fieldOptions} disabled={value.group==='unclassified'||fieldOptions.length===1}
    onChange={field=>onChange({...value,field,lesson:'all'})}/>
   <TaxonomyDropdown label={label('Bài','Lesson')} value={value.lesson}
    options={lessonOptions} disabled={value.group==='unclassified'||lessonOptions.length===1}
    onChange={lesson=>onChange({...value,lesson})}/>
  </div>
  <div className="li-library-taxonomy-footer">
   {!records.length&&<Text role="support">{label('Chưa có mục nào để lọc.','Nothing saved to filter yet.')}</Text>}
   <Button variant="ghost" className="li-library-taxonomy-reset"
    disabled={!isFiltered&&!otherFiltersActive} onClick={()=>onClear?.()||onChange(emptyTaxonomy)}>
    {label('Xóa bộ lọc','Clear filters')}
   </Button>
  </div>
 </div>;
}
