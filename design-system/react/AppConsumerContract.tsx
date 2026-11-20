/** Compile-time contract proving an app React component can import public DS API.
 * Preview fixture only, not a second UI source or the learner app runtime. */
import React from 'react';
import {Button,Card,Text,Heading,InlineFeedback,SaveStatus,LanguageSwitch,Breadcrumb} from './index';
export function AppConsumerContract(){
 return <Card variant="flat-study" aria-label="App UI surface" data-app-consumer>
   <Heading role="titleSmall">Tàng Thư</Heading>
   <Text role="support">Một component, một source.</Text>
   <Button variant="secondary" type="button">Tiếp tục</Button>
   <InlineFeedback tone="info" message="Chỉ là trạng thái UI" />
   <SaveStatus state="unsaved" message="Chưa lưu" />
   <LanguageSwitch label="Language" value="vi" onChange={()=>{}} viLabel="Tiếng Việt" enLabel="English" />
   <Breadcrumb label="Path" items={[{label:'Library',href:'#library'},{label:'Current'}]} />
 </Card>;
}
