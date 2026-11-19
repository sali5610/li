import {beforeEach,afterEach,describe,expect,it} from 'vitest';
import {cleanup,screen,waitFor} from '@testing-library/react';
import {mountTypedSearch,isLocalSearchCandidate} from '../src/site-entry';

const local={protocol:'http:',hostname:'localhost',pathname:'/site/index.html',search:'?li-search-react=typed-v1'};
function fixture(){
 document.body.innerHTML='<section id="page-search"><div class="section-shell" id="li-search-shell"><button type="button" class="utility-back">Quay lại</button><p id="native-heading">Tra Cứu</p><input id="global-search" aria-label="native search"/><div id="global-results" hidden>Legacy result</div><div id="li-typed-search-root" hidden></div></div></section>';
 return {
  back:document.querySelector('.utility-back') as HTMLButtonElement,
  nativeHeading:document.getElementById('native-heading') as HTMLElement,
  nativeInput:document.getElementById('global-search') as HTMLInputElement,
  results:document.getElementById('global-results') as HTMLElement,
  host:document.getElementById('li-typed-search-root') as HTMLElement
 };
}
let close:(()=>void)|undefined;
beforeEach(()=>{
 window.history.replaceState({},'', '/site/index.html?li-search-react=typed-v1');
 window.localStorage.clear();
 close=undefined;
});
afterEach(()=>{
 close?.();
 cleanup();
 document.body.innerHTML='';
 window.history.replaceState({},'', '/');
});
describe('ONT-04B2a localhost native search bridge (NOT deployed)',()=>{
 it('accepts only explicitly flagged localhost or 127.0.0.1 candidate, not public/prod',()=>{
  expect(isLocalSearchCandidate(local)).toBe(true);
  expect(isLocalSearchCandidate({...local,hostname:'127.0.0.1'})).toBe(true);
  for(const rejected of [
   {...local,hostname:'li5610.pages.dev'},
   {...local,hostname:'sali5610.github.io'},
   {...local,protocol:'https:'},
   {...local,pathname:'/'},
   {...local,pathname:'/site/other.html'},
   {...local,search:'?li-search-react=no'},
   {...local,search:''}
  ])expect(isLocalSearchCandidate(rejected)).toBe(false);
 });
 it('waits for React tree, then hides only legacy search content and retains native back',async()=>{
  const el=fixture();
  close=await mountTypedSearch(el.host);
  await waitFor(()=>expect(screen.getByRole('search')).toBeTruthy());
  expect(el.host.hidden).toBe(false);
  expect(el.host.dataset.liSearchMount).toBe('active');
  expect(el.back.hidden).toBe(false);
  expect(el.nativeHeading.hidden).toBe(true);
  expect(el.nativeInput.hidden).toBe(true);
  expect(el.results.hidden).toBe(true);
  expect(document.querySelectorAll('main')).toHaveLength(0); // nested main landmarks not introduced
  expect(document.querySelectorAll('[data-li-search-island]')).toHaveLength(1);
 });
 it('disposer restores old hidden states EXACTLY, including originally hidden result panel',async()=>{
  const el=fixture();
  expect(el.results.hidden).toBe(true);
  close=await mountTypedSearch(el.host);
  close();close=undefined;
  await waitFor(()=>expect(el.host.dataset.liSearchMount).toBeUndefined());
  expect(el.host.hidden).toBe(true);
  expect(el.nativeHeading.hidden).toBe(false);
  expect(el.nativeInput.hidden).toBe(false);
  expect(el.results.hidden).toBe(true);
  expect(el.back.hidden).toBe(false);
 });
 it('rejects any external host or disallowed origin without altering native fallback',async()=>{
  const el=fixture();
  await expect(mountTypedSearch(el.host,{location:{...local,hostname:'li5610.pages.dev'}})).rejects.toThrow('SEARCH_CANDIDATE_ORIGIN_DENIED');
  expect(el.nativeInput.hidden).toBe(false);
  expect(el.host.hidden).toBe(true);
  expect(el.host.dataset.liSearchMount).toBeUndefined();
 });
 it('rejects disconnected/wrong parent host and leaves native content visible',async()=>{
  const el=fixture();
  el.host.remove();
  await expect(mountTypedSearch(el.host)).rejects.toThrow('SEARCH_HOST_INVALID');
  expect(el.nativeInput.hidden).toBe(false);
  expect(el.back.hidden).toBe(false);
 });
 it('prevents duplicate React mount / duplicate writer',async()=>{
  const el=fixture();
  close=await mountTypedSearch(el.host);
  await expect(mountTypedSearch(el.host)).rejects.toThrow('SEARCH_HOST_ALREADY_MOUNTED_OR_DISCONNECTED');
 });
 it('browser pagehide releases candidate mount and restores native controls',async()=>{
  const el=fixture();
  close=await mountTypedSearch(el.host);
  window.dispatchEvent(new Event('pagehide'));
  close=undefined;
  expect(el.nativeInput.hidden).toBe(false);
  expect(el.back.hidden).toBe(false);
  expect(el.host.hidden).toBe(true);
 });
 it('candidate does not write to user state, auth or attempt storage',async()=>{
  const el=fixture();
  window.localStorage.setItem('synthetic.unrelated','untouched');
  close=await mountTypedSearch(el.host);
  expect(window.localStorage.length).toBe(1);
  expect(window.localStorage.getItem('synthetic.unrelated')).toBe('untouched');
  expect(window.localStorage.getItem('li.review.L09-1-2.v1')).toBe(null);
 });
 it('screen renders read-only source search, with no navigation to lessons',async()=>{
  const el=fixture();close=await mountTypedSearch(el.host);
  await waitFor(()=>expect(screen.getByRole('searchbox')).toBeTruthy());
  expect(screen.getByRole('button',{name:'Tìm'}).hasAttribute('disabled')).toBe(true);
  expect(screen.queryByRole('link',{name:/Mở bài|Open lesson/})).toBeNull();
 });
});
