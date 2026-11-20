import React from 'react';
import type {ReactNode} from 'react';
import {Heading,Text,Progress} from './Atoms';
import {Container,Grid,Stack,Cluster} from './Layout';
import {InlineFeedback,SaveStatus} from './Molecules';
import type {SaveState,FeedbackTone} from './Molecules';

/** UX-DS-35 Stage06: imported, responsive visual structure only.
 * No router, course state, account, persistence, validation or network IO. */
export interface AppNavItem {id:string;label:string;href:string}
export interface AppHeaderProps {
 brand:string;homeHref:string;navLabel:string;items:readonly AppNavItem[];
 activeId?:string;subtitle?:string;actions?:ReactNode;
}
export function AppHeader({brand,homeHref,navLabel,items,activeId,subtitle,actions}:AppHeaderProps){
 if(!brand.trim()||!homeHref.trim()||!navLabel.trim())throw Error('AppHeader needs brand, real home href and navigation label');
 return <header className="li-ds-app-header" data-li-template="app-header">
  <div className="li-ds-app-brand">
   <a href={homeHref} className="li-ds-app-brand-link">{brand}</a>
   {subtitle?<span>{subtitle}</span>:null}
  </div>
  {items.length?<nav aria-label={navLabel} className="li-ds-app-navigation">
   <ul>{items.map(item=><li key={item.id}>
    <a href={item.href} aria-current={item.id===activeId?'page':undefined}>{item.label}</a>
   </li>)}</ul>
  </nav>:null}
  {actions?<div className="li-ds-app-utilities">{actions}</div>:null}
 </header>;
}

export interface HomeMirrorShellProps {
 artwork:ReactNode;title:string;question:string;actions:ReactNode;
 note?:string;artworkLabel:string;
}
export function HomeMirrorShell({artwork,title,question,actions,note,artworkLabel}:HomeMirrorShellProps){
 return <section className="li-ds-home-mirror" data-li-template="home-mirror" aria-label={title}>
  <div className="li-ds-home-mirror-art" role="img" aria-label={artworkLabel}>{artwork}</div>
  <div className="li-ds-home-mirror-content">
   <Text role="caption">{title}</Text>
   <Heading level={2} role="titleLarge">{question}</Heading>
   {note?<Text role="support">{note}</Text>:null}
   <div className="li-ds-home-mirror-actions">{actions}</div>
  </div>
 </section>;
}

export interface CatalogShellProps {
 title:string;description?:string;search?:ReactNode;filters?:ReactNode;
 asideTitle?:string;aside?:ReactNode;children:ReactNode;
 countLabel?:string;
}
export function CatalogShell({title,description,search,filters,asideTitle,aside,
 children,countLabel}:CatalogShellProps){
 return <Container measure="wide" data-li-template="catalog-shell" className="li-ds-catalog">
  <div className="li-ds-catalog-intro">
   <Heading level={1} role="headline">{title}</Heading>
   {description?<Text role="body">{description}</Text>:null}
  </div>
  {search||filters?<div className="li-ds-catalog-tools">
   {search?<div>{search}</div>:null}
   {filters?<div>{filters}</div>:null}
  </div>:null}
  <div className="li-ds-catalog-body" data-with-aside={aside?'true':undefined}>
   {aside?<aside className="li-ds-catalog-aside" aria-label={asideTitle||title}>
    {asideTitle?<Heading level={2} role="titleSmall">{asideTitle}</Heading>:null}
    {aside}
   </aside>:null}
   <section className="li-ds-catalog-results" aria-label={countLabel||title}>
    {countLabel?<Text role="caption">{countLabel}</Text>:null}
    {children}
   </section>
  </div>
 </Container>;
}

export interface LearningFlowShellProps {
 title:string;eyebrow?:string;stepLabel?:string;
 progressLabel:string;progressValue?:number;progressMax?:number;
 prompt:ReactNode;response:ReactNode;feedback?:ReactNode;actions:ReactNode;
 saveState?:SaveState;saveMessage?:string;
}
export function LearningFlowShell({title,eyebrow,stepLabel,progressLabel,progressValue,
 progressMax=100,prompt,response,feedback,actions,saveState,saveMessage}:LearningFlowShellProps){
 if((saveState===undefined)!==(saveMessage===undefined))
  throw Error('LearningFlowShell saveState and saveMessage must be supplied together');
 return <Container measure="reading" data-li-template="learning-flow" className="li-ds-learning">
  <header className="li-ds-learning-head">
   {eyebrow?<Text role="caption">{eyebrow}</Text>:null}
   <Heading level={1} role="headline">{title}</Heading>
   <div className="li-ds-learning-progress">
    <Cluster distribution="between" space="2">
     <Text role="support">{progressLabel}</Text>
     {stepLabel?<Text role="caption">{stepLabel}</Text>:null}
    </Cluster>
    <Progress label={progressLabel} value={progressValue} max={progressMax}/>
   </div>
  </header>
  <section className="li-ds-learning-prompt">{prompt}</section>
  <section className="li-ds-learning-response">{response}</section>
  {feedback?<div className="li-ds-learning-feedback">{feedback}</div>:null}
  <footer className="li-ds-learning-footer">
   <div className="li-ds-learning-actions">{actions}</div>
   {saveState&&saveMessage?<SaveStatus state={saveState} message={saveMessage}/>:null}
  </footer>
 </Container>;
}

export interface AccountShellProps {
 title:string;description?:string;mode:'access'|'settings';
 children:ReactNode;aside?:ReactNode;footer?:ReactNode;
}
export function AccountShell({title,description,mode,children,aside,footer}:AccountShellProps){
 return <Container measure="reading" data-li-template="account-shell" className="li-ds-account"
  data-mode={mode}>
  <header><Heading level={1} role="headline">{title}</Heading>
   {description?<Text role="body">{description}</Text>:null}</header>
  <div className="li-ds-account-panel">{children}</div>
  {aside?<aside className="li-ds-account-note">{aside}</aside>:null}
  {footer?<footer className="li-ds-account-footer">{footer}</footer>:null}
 </Container>;
}

export type SceneKind='loading'|'empty'|'error'|'complete';
export interface FeedbackSceneProps {
 kind:SceneKind;title:string;message:string;action?:ReactNode;details?:ReactNode;
}
export function FeedbackScene({kind,title,message,action,details}:FeedbackSceneProps){
 const tone:FeedbackTone=kind==='loading'?'loading':kind==='error'?'error':
  kind==='complete'?'success':'info';
 return <Container measure="reading" data-li-template="feedback-scene" className="li-ds-feedback-scene">
  <div className="li-ds-feedback-scene-mark" aria-hidden="true">{kind==='loading'?'…':
   kind==='complete'?'✓':kind==='error'?'!':'∅'}</div>
  <Heading level={1} role="headline">{title}</Heading>
  <InlineFeedback tone={tone} message={message}/>
  {details?<div className="li-ds-feedback-scene-details">{details}</div>:null}
  {action?<div className="li-ds-feedback-scene-action">{action}</div>:null}
 </Container>;
}
