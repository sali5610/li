import React from 'react';
import {createRoot} from 'react-dom/client';
import exact from './l09-exact.generated.json';
import '../../../site/assets/design-tokens.css';
import './pilot.css';
import {Pilot} from './Pilot';

const root=document.getElementById('root');
if(!root)throw Error('Pilot mount is missing');
// The auth harness is an opt-in island inside this UNRELEASED research build.
 // One HTML entry guarantees Vite emits both routes without touching site/.
if(new URLSearchParams(window.location.search).get('pilot')==='auth'){
 void import('./auth/main.js');
}else{
 root.dataset.sourceSha256=exact.sourceSha256;
 root.dataset.exactLessonId=exact.lessonId;
 createRoot(root).render(<Pilot/>);
}
