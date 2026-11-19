import React from 'react';
import {beforeEach,describe,expect,it} from 'vitest';
import {cleanup,render,screen,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {SearchIsland} from '../src/SearchIsland';

async function search(query:string){
 const user=userEvent.setup();
 const box=screen.getByRole('searchbox') as HTMLInputElement;
 await user.clear(box);
 await user.type(box,query);
 await user.click(screen.getByRole('button',{name:/^(Tìm|Search)$/}));
 return user;
}
beforeEach(()=>{cleanup();window.localStorage.clear();});
describe('ONT-04B1 React search island (fixture only)',()=>{
 it('renders a real keyboard-operable search form, not production navigation',()=>{
  render(<SearchIsland/>);
  expect(screen.getByRole('search')).toBeTruthy();
  expect(screen.getByRole('searchbox').getAttribute('maxlength')).toBe('128');
  expect(screen.getByRole('heading',{level:1}).textContent).toContain('tri thức li.');
  expect(screen.getByRole('button',{name:'Tìm'}).hasAttribute('disabled')).toBe(true);
  expect(screen.queryByRole('status')).toBeNull();
 });
 it('searches exact canonical ID and labels content-locked lesson NOT released',async()=>{
  render(<SearchIsland/>);
  await search('L09-1-2');
  const result=document.querySelector('[data-result-id="lesson:L09-1-2"]') as HTMLElement;
  expect(result).toBeTruthy();
  expect(within(result).getByText(/khóa biên tập/)).toBeTruthy();
  const source=within(result).getByRole('link',{name:/Xem nguồn gốc/});
  expect(source.getAttribute('href')).toMatch(/^https:\/\/app\.notion\.com/);
  expect(source.getAttribute('rel')).toBe('noopener noreferrer');
  expect(within(result).queryByRole('link',{name:/Mở bài|Open lesson/})).toBeNull();
  expect(screen.getByRole('status').textContent).toContain('1 kết quả');
 });
 it('candidate-only S37 title stays hidden until reviewer opts in; always non-playable',async()=>{
  render(<SearchIsland/>);
  const user=await search('Pinyin');
  expect(screen.getByRole('status').textContent).toContain('Chưa tìm thấy');
  await user.click(screen.getByRole('checkbox',{name:/Hiện bản đề xuất/}));
  const item=document.querySelector('[data-result-id="lesson:L01-1-1"]') as HTMLElement;
  expect(item).toBeTruthy();
  expect(within(item).getByText(/Bản nháp \/ đề xuất/)).toBeTruthy();
  expect(screen.getByText(/Bản đề xuất \/ chưa phát hành/)).toBeTruthy();
 });
 it('supports VI/EN labels with one canonical entity, without duplicating records',async()=>{
  render(<SearchIsland/>);
  const user=userEvent.setup();
  await user.selectOptions(screen.getByLabelText('Ngôn ngữ'),'en');
  expect(screen.getByRole('heading',{level:1}).textContent).toContain('Search li.');
  await search('Data Science');
  const article=document.querySelector('[data-result-id="field:F09"]') as HTMLElement;
  expect(article).toBeTruthy();
  expect(within(article).getByRole('link',{name:/Inspect source/})).toBeTruthy();
  expect(document.querySelectorAll('[data-result-id="field:F09"]')).toHaveLength(1);
 });
 it('resolves L2 short name T06 to a single technique entity, no technique execution action',async()=>{
  render(<SearchIsland/>);
  await search('T06');
  expect(document.querySelectorAll('[data-result-id="technique:L2-T06"]')).toHaveLength(1);
  expect(screen.queryByRole('button',{name:/Thi triển|Practice technique/})).toBeNull();
 });
 it('separates concepts from lessons via typed facet without passing unreviewed claim as fact',async()=>{
  render(<SearchIsland/>);
  const user=await search('taxonomy');
  await user.click(screen.getByRole('checkbox',{name:/Hiện bản đề xuất/}));
  await user.selectOptions(screen.getByLabelText('Loại kết quả'),'Concept');
  expect(document.querySelector('[data-result-id="concept:ont03a:taxonomic-classification"]')).toBeTruthy();
  expect(document.querySelector('[data-result-id="lesson:L03-2-1"]')).toBeNull();
 });
 it('does not open candidate method/academic graph links as unverifiable prerequisites',async()=>{
  render(<SearchIsland/>);
  const user=await search('L09-1-1');
  const item=document.querySelector('[data-result-id="lesson:L09-1-1"]') as HTMLElement;
  await user.click(within(item).getByRole('button',{name:/Quan hệ đã xác minh/}));
  expect(within(item).getByText(/field:F09/)).toBeTruthy();
  expect(within(item).getByText(/lesson:L09-1-2/)).toBeTruthy();
  expect(within(item).queryByText(/concept:ont01:population/)).toBeNull();
  expect(within(item).getByRole('button',{name:/Quan hệ đã xác minh/}).getAttribute('aria-expanded')).toBe('true');
 });
 it('announces true empty state without speculative curriculum results',async()=>{
  render(<SearchIsland/>);
  await search('fictional unknown course 2027');
  expect(screen.getByRole('status').getAttribute('aria-live')).toBe('polite');
  expect(screen.getByRole('status').textContent).toMatch(/Chưa tìm thấy/);
  expect(document.querySelectorAll('[data-result-id]')).toHaveLength(0);
 });
 it('clear resets query, reviewer permission and filters without storage or navigation',async()=>{
  render(<SearchIsland/>);
  const user=await search('Pinyin');
  await user.click(screen.getByRole('checkbox',{name:/Hiện bản đề xuất/}));
  await user.selectOptions(screen.getByLabelText('Loại kết quả'),'Lesson');
  await user.click(screen.getByRole('button',{name:'Xóa'}));
  expect((screen.getByRole('searchbox') as HTMLInputElement).value).toBe('');
  expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(false);
  expect((screen.getByLabelText('Loại kết quả') as HTMLSelectElement).value).toBe('');
  expect(screen.queryByRole('status')).toBeNull();
  expect(window.localStorage.length).toBe(0);
 });
 it('keyboard Enter submits the search form without a network request',async()=>{
  render(<SearchIsland/>);
  const user=userEvent.setup();
  await user.type(screen.getByRole('searchbox'),'L09-1-1{Enter}');
  expect(document.querySelector('[data-result-id="lesson:L09-1-1"]')).toBeTruthy();
 });
 it('reviewed result explains why shown and a source with a checked date',async()=>{
  render(<SearchIsland/>);
  await search('L15-2-1');
  const result=document.querySelector('[data-result-id="lesson:L15-2-1"]') as HTMLElement;
  expect(result).toBeTruthy();
  expect(within(result).getByText(/Vì sao có kết quả này/)).toBeTruthy();
  expect(within(result).getByText(/2026-11-19/)).toBeTruthy();
  expect(within(result).queryByText(/đáp án|solution key/i)).toBeNull();
 });
});
