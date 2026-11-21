import React from 'react';
import './notebook-theme.css';

/** Small handwritten marginal note. Presentation-only; no local state. */
export function NotebookAnnotation({text,tone='wine'}:{
 text:string;tone?:'wine'|'blue'
}){
 return <p className="li-notebook-annotation" data-note-tone={tone}>
  <span className="li-notebook-annotation-mark" aria-hidden="true">✳</span>
  <span>{text}</span>
 </p>;
}
