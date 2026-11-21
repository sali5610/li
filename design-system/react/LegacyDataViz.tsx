import React from 'react';
import {LiIcon} from './LucideIcons';
import type {ReactNode} from 'react';

export type ActivityMode='overload'|'recover'|'start'|'focus';
export interface CalendarRecord {date:string;mode?:ActivityMode;count?:number}
export interface MonthCalendarProps {
 year:number;month:number;selectedDate:string;todayDate:string;
 records:readonly CalendarRecord[];onSelectDate:(date:string)=>void;
 onMonthChange?:(year:number,month:number)=>void;
 locale?:'vi'|'en';showTodayAction?:boolean;
 /** Activity counts share the library calendar's tile grammar without inventing a study-mode status. */
 colorScale?:'mode'|'activity';
}
const pad=(v:number)=>String(v).padStart(2,'0');
const dayKey=(y:number,m:number,d:number)=>y+'-'+pad(m)+'-'+pad(d);
function nextMonth(year:number,month:number,delta:number){
 const d=new Date(Date.UTC(year,month-1+delta,1));
 return [d.getUTCFullYear(),d.getUTCMonth()+1] as const;
}
export function MonthCalendar({year,month,selectedDate,todayDate,records,
 onSelectDate,onMonthChange,locale='vi',showTodayAction=true,colorScale='mode'}:MonthCalendarProps){
 if(month<1||month>12)throw Error('MonthCalendar month must be 1–12');
 const total=new Date(Date.UTC(year,month,0)).getUTCDate();
 const first=(new Date(Date.UTC(year,month-1,1)).getUTCDay()+6)%7;
 const byDate=new Map(records.map(r=>[r.date,r]));
 const weekdays=locale==='en'?['M','T','W','T','F','S','S']:
  ['T2','T3','T4','T5','T6','T7','CN'];
 const monthName=new Intl.DateTimeFormat(locale==='en'?'en-US':'vi-VN',
  {month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(year,month-1,1)));
 const move=(direction:number)=>{
  const [y,m]=nextMonth(year,month,direction);onMonthChange?.(y,m);
 };
 // "today" always comes from the consumer's local calendar timezone.
 const todayYear=Number(todayDate.slice(0,4)),todayMonth=Number(todayDate.slice(5,7));
 const visibleTodayMonth=year===todayYear&&month===todayMonth;
 const jumpToday=()=>{
  if(!visibleTodayMonth)onMonthChange?.(todayYear,todayMonth);
  if(visibleTodayMonth||onMonthChange)onSelectDate(todayDate);
 };
 return <section className="li-legacy-calendar" data-li-legacy="month-calendar" data-calendar-scale={colorScale}>
  <header><strong>{monthName}</strong>
   <div className="li-legacy-calendar-actions">
    {showTodayAction&&<button className="li-legacy-today-action" type="button" onClick={jumpToday}
     disabled={!visibleTodayMonth&&!onMonthChange} data-active={selectedDate===todayDate}
     aria-label={locale==='vi'?'Đi tới hôm nay':'Jump to today'}>
     {locale==='vi'?'Hôm nay':'Today'}</button>}
    {onMonthChange?<><button type="button" onClick={()=>move(-1)}
      aria-label={locale==='vi'?'Tháng trước':'Previous month'}><LiIcon name="chevron-left" size={18}/></button>
     <button type="button" onClick={()=>move(1)}
      aria-label={locale==='vi'?'Tháng sau':'Next month'}><LiIcon name="chevron-right" size={18}/></button></>:null}
   </div>
  </header>
  <div className="li-legacy-calendar-grid" role="group"
   aria-label={locale==='vi'?'Lịch theo tháng':'Monthly calendar'}>
   {weekdays.map((day,i)=><span className="li-legacy-calendar-weekday"
    key={i}>{day}</span>)}
   {Array.from({length:first},(_,i)=><span key={'blank'+i} aria-hidden="true"/>)}
   {Array.from({length:total},(_,i)=>{
    const date=dayKey(year,month,i+1),record=byDate.get(date);
    const count=record?.count,hasCount=typeof count==='number';
    const intensity=colorScale==='activity'&&hasCount?
     (count===0?'zero':count<=2?'low':count<=6?'medium':'high'):'none';
    const status=record?(hasCount?
     String(count)+' '+(locale==='vi'?'hoạt động':'activities'):
     record.mode|| (locale==='vi'?'đã ghi nhận':'recorded')):
     (locale==='vi'?'chưa ghi nhận':'no record');
    return <button key={date} type="button" data-mode={record?.mode||'none'}
     data-activity-level={colorScale==='activity'?intensity:undefined}
     data-recorded={Boolean(record)} data-today={date===todayDate}
     aria-pressed={date===selectedDate} aria-label={date+' · '+status}
     onClick={()=>onSelectDate(date)}>
     {i+1}{hasCount&&colorScale!=='activity'?<span className="li-legacy-calendar-count" aria-hidden="true" >{count}</span>:null}
     <span className="li-legacy-calendar-dot" aria-hidden="true"/>
    </button>;
   })}
  </div>
 </section>;
}

export interface ActivityBarDatum {
 date:string;lesson:number|null;problem:number|null;input:number|null;
}
export interface StackedActivityChartProps {
 days:readonly ActivityBarDatum[];selectedDate:string;todayDate:string;
 onSelectDate:(date:string)=>void;onToday?:()=>void;
 maxTotal?:number;locale?:'vi'|'en';
}
export function StackedActivityChart({days,selectedDate,todayDate,onSelectDate,
 onToday,maxTotal,locale='vi'}:StackedActivityChartProps){
 if(days.length>7)throw Error('StackedActivityChart accepts a seven-day window');
 const max=Math.max(1,maxTotal||0,...days.map(d=>(d.lesson||0)+(d.problem||0)+(d.input||0)));
 const todayVisible=days.some(day=>day.date===todayDate);
 const jumpToday=()=>{
  // Caller must reposition older windows; selecting an invisible day is invalid.
  if(onToday)onToday();
  else if(todayVisible)onSelectDate(todayDate);
 };
 return <section className="li-legacy-chart" data-li-legacy="stacked-activity">
  <header className="li-legacy-chart-header">
   <div className="li-legacy-chart-legend" aria-label={locale==='vi'?'Chú giải':'Legend'}>
    <span data-series="lesson">{locale==='vi'?'Bài':'Lessons'}</span>
    <span data-series="problem">{locale==='vi'?'Vấn đề':'Problems'}</span>
    <span data-series="input">Input</span>
   </div>
   <button className="li-legacy-today-action" type="button" onClick={jumpToday}
    disabled={!todayVisible&&!onToday} data-active={selectedDate===todayDate}
    aria-label={locale==='vi'?'Đi tới hôm nay':'Jump to today'}>
    {locale==='vi'?'Hôm nay':'Today'}</button>
  </header>
  <div className="li-legacy-chart-bars" role="group"
   aria-label={locale==='vi'?'Hoạt động bảy ngày':'Seven-day activity'}>
   {days.map(d=>{
    const absent=d.lesson===null&&d.problem===null&&d.input===null;
    const total=(d.lesson||0)+(d.problem||0)+(d.input||0);
    return <button type="button" key={d.date} data-today={d.date===todayDate}
     aria-pressed={d.date===selectedDate} onClick={()=>onSelectDate(d.date)}
     aria-label={d.date+' — '+(absent?'no record':total+' activities')}>
     <span className="li-legacy-chart-total">{absent?'—':total}</span>
     <span className="li-legacy-chart-track" aria-hidden="true">
      {!absent&&(['lesson','problem','input'] as const).map(k=><span
       key={k} data-series={k} style={{height:((d[k]||0)/max*100)+'%'}}/>)}
     </span>
     <span>{Number(d.date.slice(-2))}</span>
    </button>;
   })}
  </div>
 </section>;
}

export interface LaoLyStateSceneProps {
 kind:'loading'|'error';artworkSrc:string;title:string;description:string;
 action?:ReactNode;
}
export function LaoLyStateScene({kind,artworkSrc,title,description,action}:LaoLyStateSceneProps){
 return <section className="li-legacy-laoly-state" data-li-legacy="laoly-state"
  data-state={kind} role={kind==='error'?'alert':'status'}
  aria-busy={kind==='loading'||undefined}>
  <img src={artworkSrc} alt="" aria-hidden="true" decoding="async"
   loading={kind==='loading'?'eager':'lazy'}/>
  <h3>{title}</h3><p>{description}</p>
  {action?<div>{action}</div>:null}
 </section>;
}
