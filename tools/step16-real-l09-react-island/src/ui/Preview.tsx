import React,{useState} from 'react';
import {Button,IconButton,TextInput,TextAreaField,Card,ActionGroup,Navigation,Feedback,Dialog} from './Shared';

/** Browser-mounted fixture, NOT an app route or product adoption. Synthetic state only. */
export function Preview(){
 const [locale,setLocale]=useState<'vi'|'en'>('vi'),[active,setActive]=useState('guide');
 const [value,setValue]=useState(''),[error,setError]=useState(false),[modal,setModal]=useState(false);
 const en=locale==='en';
 const items=[{id:'home',href:'#home',label:en?'Home':'Đại Sảnh'},{id:'guide',href:'#guide',label:en?'Methods':'Thần Chú'},
   {id:'library',href:'#library',label:en?'Library':'Tàng Thư'},{id:'saved',href:'#saved',label:en?'Saved':'Tủ Riêng'}];
 return <main className="pilot li-ui-preview" lang={locale} data-ui-preview="uxds35-stage02b">
   <h1>{en?'Shared UI contract fixture':'Mẫu kiểm thử shared UI'}</h1>
   <ActionGroup aria-label="Language">
     <Button variant="secondary" data-ui-locale="vi" aria-pressed={locale==='vi'} onClick={()=>setLocale('vi')}>VI</Button>
     <Button variant="secondary" data-ui-locale="en" aria-pressed={locale==='en'} onClick={()=>setLocale('en')}>EN</Button>
   </ActionGroup>
   <Navigation label={en?'Global navigation':'Điều hướng chính'} items={items} currentId={active}/>
   <ActionGroup aria-label={en?'Actions':'Thao tác'}>
     <Button data-ui-primary onClick={()=>setError(true)}>{en?'Validate':'Kiểm tra'}</Button>
     <Button variant="secondary" data-ui-secondary onClick={()=>setError(false)}>{en?'Clear':'Xoá lỗi'}</Button>
     <IconButton label={en?'More information':'Thông tin thêm'} data-ui-icon variant="secondary"><span aria-hidden="true">i</span></IconButton>
     <Button loading data-ui-loading>{en?'Loading':'Đang xử lý'}</Button>
   </ActionGroup>
   <Card aria-label="Fields and feedback">
     <TextInput data-ui-field label={en?'Answer':'Trả lời'} value={value} onChange={e=>setValue(e.target.value)}
       hint={en?'Enter a short response':'Nhập câu trả lời ngắn'} error={error&&!value?en?'A response is required':'Cần nhập câu trả lời':undefined}/>
     <TextInput data-ui-readonly label={en?'Read only':'Chỉ đọc'} value="Source" readOnly/>
     <TextInput data-ui-disabled label={en?'Disabled':'Vô hiệu'} defaultValue="Unavailable" disabled/>
     <TextAreaField label={en?'Notes':'Ghi chú'} defaultValue="" rows={2}/>
     <Feedback tone={error&&!value?'error':'info'} data-ui-feedback>{error&&!value?(en?'Please correct the answer':'Vui lòng sửa câu trả lời'):(en?'Not saved':'Chưa lưu')}</Feedback>
   </Card>
   <Card tone="tinted"><p>{en?'Tinted surface':'Surface nền phụ'}</p></Card>
   <Button data-ui-open onClick={()=>setModal(true)}>{en?'Open dialog':'Mở hộp thoại'}</Button>
   <Dialog open={modal} title={en?'Preview dialog':'Hộp thoại thử nghiệm'} onRequestClose={()=>setModal(false)}>
     <p>{en?'Temporary content; no persistence':'Nội dung thử; không ghi dữ liệu'}</p>
     <a href="#dialog-detail">{en?'Read detail':'Đọc chi tiết'}</a>
     <details><summary>{en?'More':'Thêm'}</summary><p>Fixture</p></details>
     <TextInput label={en?'In dialog':'Trong hộp thoại'}/>
   </Dialog>
   <p className="pilot-caution">UX-DS-35 Stage02B DRAFT · synthetic fixture only · G2 OPEN</p>
 </main>;
}
