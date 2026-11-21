import React from 'react';

/** Decorative geometric paper-cut vignettes for the Vintage Pop UI Lab only.
 * No words, content data, new media fetches or interaction states. */
export type VintagePopArtKind =
 'library'|'book'|'globe'|'hci'|'supply'|'sampling'|'telescope'|'idea'|'journal'|'notes'|'guide';
export function VintagePopArt({kind='book',size='spot'}:{
 kind?:VintagePopArtKind;size?:'spot'|'hero'|'tiny'
}){
 const books=kind==='library'||kind==='book'||kind==='guide';
 const globe=kind==='globe';
 const hci=kind==='hci';
 const supply=kind==='supply';
 const sampling=kind==='sampling';
 const telescope=kind==='telescope';
 const idea=kind==='idea';
 const journal=kind==='journal'||kind==='notes';
 return <svg className={'li-pop-art li-pop-art--'+kind+' li-pop-art--'+size}
  viewBox="0 0 300 220" xmlns="http://www.w3.org/2000/svg"
  fill="none" aria-hidden="true" focusable="false">
  <circle cx="161" cy="103" r="84" fill="#5b836c"/>
  <circle cx="222" cy="39" r="24" fill="#dccfea"/>
  <path d="M35 173L88 107L130 177Z" fill="#7b233b"/>
  <g fill="#214d3a" opacity=".9">
   <path d="M48 40L53 51L65 53L55 61L57 73L47 67L36 72L38 60L29 53L42 50Z"/>
   <circle cx="256" cy="170" r="5"/>
  </g>
  {books&&<g stroke="#214d3a" strokeWidth="3" strokeLinejoin="round">
   <path d="M63 143L134 132L158 148L88 160Z" fill="#dccfea"/>
   <path d="M88 160L158 148V169L88 181Z" fill="#fff6dc"/>
   <path d="M63 143L88 160V181L63 163Z" fill="#7b233b"/>
   <path d="M99 166L151 157M100 173L151 164" strokeWidth="1.4"/>
   <path d="M96 110L174 91L192 110L116 130Z" fill="#fde9b3"/>
   <path d="M116 130L192 110V135L116 153Z" fill="#5b836c"/>
   <path d="M96 110L116 130V153L96 133Z" fill="#214d3a"/>
   <path d="M134 136L185 122" strokeWidth="1.4"/>
   <path d="M129 78C150 66 171 70 185 86L185 119C165 105 145 102 129 112Z" fill="#fff9e8"/>
   <path d="M129 78C109 68 88 70 73 87V118C94 106 112 106 129 112Z" fill="#fff5d9"/>
   <path d="M129 78V112M82 91C98 85 113 87 122 94M137 92C151 87 166 89 178 96" strokeWidth="2"/>
   <path d="M186 57L194 65L205 63L198 73L202 83L191 78L183 85L183 73L174 66Z" fill="#7b233b"/>
  </g>}
  {globe&&<g stroke="#214d3a" strokeWidth="3" strokeLinejoin="round">
   <circle cx="151" cy="108" r="59" fill="#fff8df"/>
   <ellipse cx="151" cy="108" rx="27" ry="59"/>
   <path d="M93 108H209M101 82H202M101 133H201M151 49V168"/>
   <path d="M130 62L140 69L133 85L150 98L138 115L114 100L118 83Z" fill="#769682" strokeWidth="2"/>
   <path d="M177 102L196 108L190 133L174 142L162 128Z" fill="#769682" strokeWidth="2"/>
   <path d="M149 169L149 188M122 188H178" strokeWidth="6"/>
  </g>}
  {hci&&<g stroke="#214d3a" strokeWidth="3" strokeLinejoin="round">
   <rect x="73" y="63" width="152" height="107" rx="4" fill="#fff9e9"/>
   <rect x="73" y="63" width="152" height="19" fill="#dccfea"/>
   <circle cx="87" cy="73" r="3" fill="#214d3a"/><circle cx="98" cy="73" r="3" fill="#214d3a"/>
   <rect x="88" y="96" width="49" height="55" fill="#d5e1d8"/>
   <path d="M151 101H207M151 114H198M151 127H209M151 142H186" strokeWidth="4"/>
   <path d="M146 151L160 185L166 170L180 181L190 171L175 159L188 153Z"
    fill="#7b233b"/>
  </g>}
  {supply&&<g stroke="#214d3a" strokeWidth="3" strokeLinejoin="round">
   <path d="M78 94L122 75L167 94L123 114Z" fill="#dccfea"/>
   <path d="M78 94L123 114V166L78 145Z" fill="#5b836c"/>
   <path d="M123 114L167 94V145L123 166Z" fill="#fff6da"/>
   <path d="M175 118L203 106L234 119L203 132Z" fill="#d5e1d8"/>
   <path d="M175 118L203 132V166L175 150Z" fill="#7b233b"/>
   <path d="M203 132L234 119V150L203 166Z" fill="#fff6da"/>
   <path d="M105 104V156M139 110V152M87 145H151M187 145L200 152M211 144L227 137" strokeWidth="2"/>
   <path d="M176 64L211 64M201 55L211 64L201 73" strokeWidth="5"/>
  </g>}
  {sampling&&<g stroke="#214d3a" strokeWidth="2.5">
   <rect x="67" y="55" width="164" height="109" fill="#fff9e8"/>
   {Array.from({length:18},(_,i)=><g key={i} transform={`translate(${88+(i%6)*25} ${77+Math.floor(i/6)*28})`}>
    <circle r="5.2" fill={i%5===0?'#7b233b':'#769682'}/>
    <path d="M-8 11Q0 4 8 11" fill="none"/>
   </g>)}
   <circle cx="163" cy="120" r="45" stroke="#7b233b" strokeWidth="7" fill="#d5e1d8" fillOpacity=".1"/>
   <path d="M196 153L229 181" stroke="#214d3a" strokeWidth="10" strokeLinecap="round"/>
  </g>}
  {telescope&&<g stroke="#214d3a" strokeWidth="3" strokeLinejoin="round">
   <path d="M77 84L187 45L211 65L99 110Z" fill="#dccfea"/>
   <path d="M92 86L111 104L98 116L77 96Z" fill="#7b233b"/>
   <path d="M185 45L207 37L226 57L211 65Z" fill="#fff7e1"/>
   <path d="M153 94L159 145M159 145L120 188M159 145L201 188" strokeWidth="7" strokeLinecap="round"/>
   <path d="M113 188H206" strokeWidth="5"/>
  </g>}
  {idea&&<g stroke="#214d3a" strokeWidth="3" strokeLinejoin="round">
   <path d="M155 44C113 44 98 76 106 103C111 125 130 129 136 148H177
    C182 127 204 120 207 92C213 65 194 44 155 44Z" fill="#fff7dc"/>
   <path d="M137 147H177V165H137ZM142 169H174V182H142Z" fill="#7b233b"/>
   <path d="M142 103L155 118L169 101M155 118V146"/>
   <path d="M157 20V35M99 41L111 53M213 42L200 55M87 101H100M213 102H228" strokeWidth="5" strokeLinecap="round"/>
  </g>}
  {journal&&<g stroke="#214d3a" strokeWidth="3" strokeLinejoin="round">
   <path d="M86 60H211V175H86Z" fill="#fff7df"/>
   <path d="M86 60H211V86H86Z" fill="#dccfea"/>
   <path d="M109 50V69M188 50V69" strokeWidth="7"/>
   <path d="M105 107H190M105 123H190M105 139H158" strokeWidth="3"/>
   <circle cx="189" cy="151" r="30" fill="#d5e1d8"/>
   <path d="M176 152L186 162L204 141" strokeWidth="6" strokeLinecap="round"/>
   <path d="M62 154Q55 110 78 92M63 154Q77 130 91 127" stroke="#769682" strokeWidth="6"/>
  </g>}
  <path d="M34 192Q143 210 255 188" stroke="#214d3a" strokeWidth="2" strokeDasharray="4 7"/>
 </svg>;
}
