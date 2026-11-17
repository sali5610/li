#!/usr/bin/env python3
"""Recover the actual li. high-fi and package it as a static Pages site."""
from pathlib import Path
import re
import urllib.request

BASE="https://li-step15-arborium-hifi-review.vercel.app/"
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"site"
ASSETS=["laoly-neutral.png","laoly-guide-rest.png","laoly-mode-start.png","laoly-mode-focus.png","laoly-mode-overload.png","laoly-mode-recover.png","lucide.min.js"]

def fetch(name):
    request=urllib.request.Request(BASE+name,headers={"User-Agent":"li-hifi-migration/1.0"})
    with urllib.request.urlopen(request,timeout=60) as r:
        if r.status!=200: raise RuntimeError(f"{name}: HTTP {r.status}")
        return r.read()

def once(html, needle):
    count=html.count(needle)
    if count!=1: raise RuntimeError(f"Expected one {needle[:80]!r}; found {count}")

def build():
    (OUT/"assets").mkdir(parents=True,exist_ok=True)
    html=fetch("").decode("utf-8")
    for name in ASSETS:
        context=html.find(name)
        print("Asset lookup",name,"HTML reference:",repr(html[max(0,context-115):context+len(name)+35]),flush=True)
        if name=="lucide.min.js":
            remote="https://unpkg.com/lucide@1.50.0/dist/umd/lucide.min.js"
            request=urllib.request.Request(remote,headers={"User-Agent":"li-hifi-migration/1.0"})
            with urllib.request.urlopen(request,timeout=60) as response:
                asset=response.read()
            html=html.replace('src="'+remote+'"','src="./assets/lucide.min.js"')
        else:
            asset=fetch("assets/"+name)
        if name.endswith(".png") and not asset.startswith(b"\x89PNG\r\n\x1a\n"):
            raise RuntimeError(f"Not PNG: {name}")
        (OUT/"assets"/name).write_bytes(asset)
        html=re.sub(r'(?:\./[^"<>]*?_files/|(?<=src=")/)'+re.escape(name),
                    './assets/'+name,html)
        html=html.replace('src="/assets/'+name+'"','src="./assets/'+name+'"')
        html=html.replace('src="'+name+'"','src="./assets/'+name+'"')
    # GitHub project Pages lives under /li/; absolute root /assets would break mode avatars.
    html=html.replace('image:"/assets/', 'image:"./assets/')
    html=re.sub(r'<!-- saved from url=.*? -->\s*','',html,count=1)
    # Keep the original live JS and 13-method data; modify only scoped S107 items.
    btnpattern=r'<button\s+class="action alt"\s+id="export-library".*?</button>'
    matches=re.findall(btnpattern,html,flags=re.S)
    if len(matches)!=1: raise RuntimeError("Old export action missing or duplicate")
    html=re.sub(btnpattern,'',html,count=1,flags=re.S)
    button=matches[0].replace('id="export-library"','id="export-personal-data"')
    warning='Xóa dữ liệu trang web có thể làm mất ghi chép. Bạn có thể xuất bản sao trong Tủ Riêng.'
    once(html,warning)
    replacement='Xóa dữ liệu trang web có thể làm mất Bút Ký, câu hỏi đã lưu và bản nháp. Hãy xuất bản sao trước khi xóa.'
    section=('<div class="settings-data-actions">'+button+
      '<button class="action alt" id="import-personal-trigger" type="button">Nhập bản sao</button>'+
      '<input id="import-personal-data" type="file" accept=".json,application/json" aria-label="Chọn bản sao JSON li." class="visually-hidden-file">'+
      '</div><p class="small">Đổi thiết bị hoặc website? Xuất tệp từ trang cũ rồi nhập vào đây. Dữ liệu vẫn lưu trên trình duyệt này.</p>')
    html=html.replace(warning+'</p>',replacement+'</p>'+section)
    privacy='Nội dung bạn nhập chưa được lưu trên thiết bị hoặc đồng bộ. Hãy sao chép nếu muốn giữ lại.'
    once(html,privacy)
    html=html.replace(privacy,'Lão Lý hiện dùng hội thoại có sẵn. Ghi chép của bạn không tự động được gửi tới dịch vụ AI bên ngoài.')
    once(html,'document.getElementById("export-library")')
    html=html.replace('document.getElementById("export-library")','document.getElementById("export-personal-data")')
    html=html.replace('a.download="li-tu-rien-"','a.download="li-du-lieu-"')
    marker=' if(liStorageError)toast("Không đọc được dữ liệu đã lưu. Tạm dừng ghi mới để tránh ghi đè.");'
    once(html,marker)
    html=html.replace(marker,r'''
 // S110: explicit, validated manual import between Vercel and GitHub origins.
 const importTrigger=document.getElementById("import-personal-trigger");
 const importInput=document.getElementById("import-personal-data");
 importTrigger?.addEventListener("click",()=>importInput?.click());
 importInput?.addEventListener("change",async()=>{
  const file=importInput.files?.[0];if(!file)return;
  try{
   if(file.size>10*1024*1024)throw Error("large");
   const data=JSON.parse(await file.text());
   if(!data||data.schema!==1||!Array.isArray(data.cases)||!Array.isArray(data.questions)||
      typeof data.draft!=="string"||
      !data.cases.every(x=>x&&typeof x.title==="string"&&typeof x.revision==="string"&&typeof x.correct==="boolean")||
      !data.questions.every(x=>x&&typeof x.question==="string"))throw Error("schema");
   const oldRaw=window.localStorage.getItem(LI_STORAGE_KEY);
   const oldDraft=window.localStorage.getItem(LI_DRAFT_KEY);
   const existing=Boolean(oldRaw&&oldRaw!=='{"schema":1,"cases":[],"questions":[]}')||Boolean(oldDraft||field?.value);
   if(!window.confirm(existing
     ?"Nhập sẽ THAY THẾ Bút Ký, Dấu Trang và bản nháp đang lưu ở đây. Hãy xuất bản sao trước. Tiếp tục?"
     :"Nhập bản sao vào thiết bị này?"))return;
   const next=JSON.stringify({schema:1,cases:data.cases,questions:data.questions,updatedAt:new Date().toISOString()});
   try{
    window.localStorage.setItem(LI_STORAGE_KEY,next);
    window.localStorage.setItem(LI_DRAFT_KEY,data.draft);
    if(window.localStorage.getItem(LI_STORAGE_KEY)!==next||window.localStorage.getItem(LI_DRAFT_KEY)!==data.draft)throw Error("readback");
   }catch(e){
    try{
     if(oldRaw===null)window.localStorage.removeItem(LI_STORAGE_KEY);else window.localStorage.setItem(LI_STORAGE_KEY,oldRaw);
     if(oldDraft===null)window.localStorage.removeItem(LI_DRAFT_KEY);else window.localStorage.setItem(LI_DRAFT_KEY,oldDraft);
    }catch(recoverError){}
    throw Error("write");
   }
   processedCases.splice(0,processedCases.length,...data.cases);
   savedQuestions.splice(0,savedQuestions.length,...data.questions);
   if(field)field.value=data.draft;
   liStorageError=false;
   renderCaseArchive();renderSavedQuestions();
   toast("Đã nhập "+data.cases.length+" Bút Ký và "+data.questions.length+" Dấu Trang.");
  }catch(e){toast(e.message==="large"?"Tệp vượt quá 10 MB.":e.message==="write"?
    "Không thể lưu bản sao trên thiết bị này. Hãy giữ bản JSON.":"Tệp JSON không hợp lệ hoặc không đúng bản sao li.");}
  finally{importInput.value="";}
 });
'''+marker)
    css=r'''
/* S107 — card gap audit: scoped so other pages keep their spacing. */
#page-settings > .section-shell > .editorial-grid{gap:30px!important}
#page-settings > .section-shell > .editorial-grid > .stack-sm{gap:30px!important}
#page-settings .settings-data-actions{display:flex;align-items:center;flex-wrap:wrap;gap:12px;margin:16px 0 10px}
#page-settings .settings-data-actions>.action{min-width:130px}
#page-settings .visually-hidden-file{position:absolute;left:-9999px;width:1px;height:1px}
@media(max-width:600px){
#page-settings > .section-shell > .editorial-grid{gap:28px!important}
#page-settings > .section-shell > .editorial-grid>.stack-sm{gap:28px!important}
#page-settings .settings-data-actions>.action{flex:1}
}
/* S107 — larger full figure at same Guide frame size; feet anchored at base. */
#page-guide .guide-mentor{position:relative;overflow:visible!important}
#page-guide .guide-mentor .guide-mentor-illustration{
position:absolute!important;z-index:1;left:-12px;bottom:-3px;
width:118px!important;height:118px!important;max-width:none!important;
transform:none!important;object-fit:contain;object-position:center bottom;pointer-events:none}
#page-guide .guide-mentor .guide-mentor-copy{grid-column:2;position:relative;z-index:2}
@media(max-width:640px){#page-guide .guide-mentor .guide-mentor-illustration{
width:106px!important;height:106px!important;left:-12px;bottom:-3px}}
@media(max-width:360px){#page-guide .guide-mentor .guide-mentor-illustration{
width:94px!important;height:94px!important;left:-10px;bottom:-3px}}
'''
    once(html,'</head>')
    html=html.replace('</head>','<style>'+css+'</style></head>')
    for needle in ['id="export-personal-data"','id="import-personal-data"','id="method-count"','const processedCases=liInitialState.cases;']:
        once(html,needle)
    if html.count('data-ly-mode=')!=4:raise RuntimeError("Four mode selector count differs from S106")
    (OUT/"index.html").write_text(html,encoding="utf-8")
    (OUT/".nojekyll").write_text("")
    print(f"Imported {len(html)} chars from live Hi-Fi with {len(ASSETS)} runtime assets")

if __name__=="__main__":build()
