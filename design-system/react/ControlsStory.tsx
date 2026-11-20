/** UX-DS-35 Stage04: actual native-control React atoms; fixture-only state. */
import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Checkbox,Radio,Field,Icon,IconButton} from './Controls';
import type {IconName} from './Controls';
import './controls.css';
import './controls-story.css';
import './focus.css';

const params=new URLSearchParams(location.search);
if(params.get('state')==='focus')document.documentElement.dataset.dsFocusDemo='true';
const atom=params.get('story')||'checkbox';
const variant=params.get('variant')||'Default';
const state=params.get('state')||'default';
const en=params.get('lang')==='en';
const copy=(vi:string,english:string)=>en?english:vi;
const names:Record<string,string>={checkbox:'Checkbox',radio:'Radio',field:'Field',
 icon:'Icon',iconButton:'IconButton'};
function Example(){
 const [checked,setChecked]=useState(state==='checked');
 const [radio,setRadio]=useState(state==='selected'?'second':'first');
 const [value,setValue]=useState(state==='error'?'?':'');
 const [hits,setHits]=useState(0);
 const disabled=state==='disabled';
 const icons:Record<string,IconName>={Search:'search',Check:'check',Info:'info',
 Close:'close',Back:'chevron-left',Book:'book-open'};
 const icon=icons[variant]||'search';
 switch(atom){
 case 'checkbox':
  return <div className="li-control-demo" data-story-checkbox>
    <Checkbox checked={checked} onChange={e=>setChecked(e.target.checked)}
      disabled={disabled} label={copy('Cho phép xem thông báo (mẫu thử)',
        'Allow demo notifications')}/>
    <p role="status">{checked?copy('Đã chọn (chỉ demo)','Checked (demo only)'):
      copy('Chưa chọn','Not selected')}</p>
  </div>;
 case 'radio':
  return <fieldset className="li-control-demo" data-story-radio>
    <legend>{copy('Chọn một cỡ hiển thị','Select one layout density')}</legend>
    <Radio name="demo-density" value="first" checked={radio==='first'} disabled={disabled}
      onChange={()=>setRadio('first')} label={copy('Gọn','Compact')}/>
    <Radio name="demo-density" value="second" checked={radio==='second'} disabled={disabled}
      onChange={()=>setRadio('second')} label={copy('Thoáng','Comfortable')}/>
  </fieldset>;
 case 'field':
  return <div data-story-field><Field kind={variant==='Textarea'?'textarea':'input'}
    label={copy('Ghi chú minh họa','Sample note')}
    hint={copy('Chỉ thử UI. Nội dung không được lưu.','UI only. This text is not saved.')}
    placeholder={copy('Nhập nội dung…','Type something…')}
    value={value} onChange={e=>setValue(e.target.value)}
    disabled={disabled} readOnly={state==='readonly'}
    error={state==='error'?copy('Cần kiểm tra lại nội dung.','Review this entry.'):undefined}/>
  </div>;
 case 'icon':
  return <div className="li-control-demo" data-story-icon>
    <Icon name={icon} label={copy('Biểu tượng minh họa','Sample icon')}/>
    <p>{copy('Icon độc lập, không phải nút.','Standalone icon, not a button.')}</p>
  </div>;
 case 'iconButton':
  return <div className="li-control-demo" data-story-icon-button>
    <IconButton icon={icon} label={copy('Thử thao tác','Try action')}
      onClick={()=>setHits(n=>n+1)} disabled={disabled}/>
    <p role="status">{copy('Số lượt bấm thử: ','Demo activations: ')}{hits}</p>
  </div>;
 default:return <p>{copy('Chưa có mẫu','No specimen')}</p>;
 }
}
function Story(){
 return <main className="li-control-story" data-ui-react-control="mounted"
  data-control-name={atom} lang={en?'en':'vi'}>
   <p className="li-control-kicker">UX-DS-35 / STAGE04 / REACT</p>
   <h1>{names[atom]||'Control'}</h1>
   <div className="li-control-sample"><Example/></div>
   <p className="li-control-caution">{copy('Trạng thái giả lập · Chưa duyệt G2 · Không lưu dữ liệu.',
     'Fixture state · G2 open · No data saved.')}</p>
  </main>;
}
const root=document.getElementById('react-controls-root');
if(!root)throw Error('Missing controls story root');
createRoot(root).render(<Story/>);
