import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Button,Dialog} from './index';
import './components.css';
import './controls.css';
import './dialog.css';
import './dialog-story.css';
const params=new URLSearchParams(location.search);
const en=params.get('lang')==='en', long=params.get('state')==='long';
const t=(vi:string,english:string)=>en?english:vi;
function Example(){
 const [open,setOpen]=useState(false);
 return <main className="li-dialog-story" data-ui-react-dialog="mounted" lang={en?'en':'vi'}>
  <p className="li-dialog-kicker">UX-DS-35 / STAGE04 / REACT</p>
  <h1>Dialog</h1>
  <Button onClick={()=>setOpen(true)}>{t('Mở hộp thoại','Open dialog')}</Button>
  <Dialog open={open} onRequestClose={()=>setOpen(false)}
   title={t('Xác nhận thao tác','Confirm action')} closeLabel={t('Đóng hộp thoại','Close dialog')}
   description={t('Mẫu giao diện. Không có dữ liệu được ghi.','UI fixture. Nothing is saved.')}
   footer={<Button variant="secondary" onClick={()=>setOpen(false)}>{t('Đóng','Close')}</Button>}>
   <p>{long?t('Đây là đoạn văn minh họa dài để thử cuộn nội dung khi cửa sổ thấp. '.repeat(14),
     'Long example copy verifies scrolling in a short viewport. '.repeat(14)):
     t('Nhấn Escape hoặc nút đóng. Focus trở lại nút Mở.',
       'Press Escape or Close. Focus returns to the opener.')}</p>
  </Dialog>
  <p className="li-dialog-footnote">{t('Dialog native · focus/keyboard · G2 chưa duyệt.',
  'Native dialog · focus/keyboard · G2 open.')}</p>
 </main>;
}
const root=document.getElementById('react-dialog-root');
if(!root)throw Error('Missing dialog story root');
createRoot(root).render(<Example/>);
