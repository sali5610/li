/** Compile-time contract proving an app React component can import public DS API.
 * Preview fixture only, not a second UI source or the learner app runtime. */
import React from 'react';
import {Button,Card,Text,Heading,InlineFeedback,SaveStatus,LanguageSwitch,Breadcrumb,SourceStatus,Disclosure,ActionMenu,AppHeader,CatalogShell,LearningFlowShell,FeedbackScene} from './index';
export function AppConsumerContract(){
 return <Card variant="flat-study" aria-label="App UI surface" data-app-consumer>
   <Heading role="titleSmall">Tàng Thư</Heading>
   <Text role="support">Một component, một source.</Text>
   <Button variant="secondary" type="button">Tiếp tục</Button>
   <InlineFeedback tone="info" message="Chỉ là trạng thái UI" />
   <SaveStatus state="unsaved" message="Chưa lưu" />
   <LanguageSwitch label="Language" value="vi" onChange={()=>{}} viLabel="Tiếng Việt" enLabel="English" />
   <Breadcrumb label="Path" items={[{label:'Library',href:'#library'},{label:'Current'}]} />
   <SourceStatus title="Source" sourceLabel="Reference pending" state="unreviewed" statusLabel="Not reviewed" />
   <Disclosure summary="Explain">Example explanation.</Disclosure>
   <ActionMenu label="Actions" items={[{id:'view',label:'View',onSelect:()=>{}}]} />
   <AppHeader brand="li." homeHref="#home" navLabel="Nav" activeId="study" items={[{id:'study',label:'Study',href:'#study'}]}/>
   <CatalogShell title="Library" countLabel="0 results"><p>Empty</p></CatalogShell>
   <LearningFlowShell title="Lesson" progressLabel="Progress" prompt={<p>Prompt</p>} response={<p>Answer</p>} actions={<Button>Next</Button>}/>
   <FeedbackScene kind="empty" title="No results" message="No records yet." />
 </Card>;
}
