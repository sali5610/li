(function(){
"use strict";
const find=selector=>document.querySelector(selector);
const findAll=selector=>Array.from(document.querySelectorAll(selector));
const state={route:"guide",width:390};
const labels={guide:"Thần Chú",home:"Home",settings:"Settings",library:"Tủ Riêng",dashboard:"Dashboard",catalog:"Môn học"};
function controlState(selector,key,value){
  findAll(selector).forEach(button=>{
    button.setAttribute("aria-pressed",String(button.dataset[key]===String(value)));
  });
}
function setViewport(width){
  if(![320,360,375,390,402,600,820,1440].includes(width))return;
  state.width=width;
  find("#preview-device").style.width=width+"px";
  find("#preview-name").textContent=labels[state.route]+" · "+width+"px";
  controlState("[data-width]","width",width);
}
function setRoute(route){
  if(!Object.prototype.hasOwnProperty.call(labels,route))return;
  state.route=route;
  const url="./index.html?page="+encodeURIComponent(route);
  find("#app-preview").src=url;
  find("#open-live").href=url;
  find("#preview-name").textContent=labels[route]+" · "+state.width+"px";
  controlState("[data-route]","route",route);
}
findAll("[data-width]").forEach(button=>button.addEventListener("click",()=>setViewport(Number(button.dataset.width))));
findAll("[data-route]").forEach(button=>button.addEventListener("click",()=>setRoute(button.dataset.route)));
for(const selector of ["[data-demo-nav]","[data-demo-filter]"]){
  findAll(selector).forEach(button=>button.addEventListener("click",()=>{
    findAll(selector).forEach(item=>item.setAttribute("aria-pressed",String(item===button)));
  }));
}
let timer;
findAll("[data-demo]").forEach(button=>button.addEventListener("click",()=>{
  const toast=find("#demo-toast");
  toast.hidden=false;
  toast.textContent="Specimen "+button.dataset.demo+" · chức năng thật ở Live Responsive.";
  clearTimeout(timer);
  timer=setTimeout(()=>{toast.hidden=true;},3200);
}));
findAll(".rail-nav a").forEach(link=>link.addEventListener("click",()=>{
  findAll(".rail-nav a").forEach(item=>item.removeAttribute("aria-current"));
  link.setAttribute("aria-current","location");
}));
setViewport(390);
})();
