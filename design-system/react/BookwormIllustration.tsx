import React from 'react';

/** Small geometric engravings for the opt-in Bookworm Lab layout.
 * Pure SVG, aria-hidden and independent of screen state or external assets. */
export type BookwormArtKind='stack'|'open'|'shelf';
export function BookwormIllustration({kind='stack'}:{kind?:BookwormArtKind}){
 return <svg className={'li-bookworm-art li-bookworm-art--'+kind}
  viewBox="0 0 360 260" fill="none" xmlns="http://www.w3.org/2000/svg"
  aria-hidden="true" focusable="false">
  <circle cx="180" cy="124" r="105" fill="#F5D47D"/>
  <path d="M77 218H290" stroke="#29648C" strokeWidth="2" strokeLinecap="round"/>
  <path d="M94 226H276M122 232H240" stroke="#29648C" strokeOpacity=".45" strokeWidth="1.6"/>
  {kind==='stack'&&<>
   <g stroke="#29648C" strokeWidth="2.7" strokeLinejoin="round" strokeLinecap="round">
    <path d="M97 192L240 178L276 195L133 210Z" fill="#F8F1E3"/>
    <path d="M133 210V225L276 210V195L133 210Z" fill="#F6E0B1"/>
    <path d="M97 192V205L133 225V210Z" fill="#DA856B"/>
    <path d="M121 165L246 151L269 170L143 184Z" fill="#2B668E"/>
    <path d="M143 184V199L269 185V170Z" fill="#F8F1E3"/>
    <path d="M121 165V180L143 199V184Z" fill="#E9B04B"/>
    <path d="M108 140L232 129L259 149L135 161Z" fill="#F7F0DE"/>
    <path d="M135 161V177L259 165V149Z" fill="#E3AF4F"/>
    <path d="M108 140V154L135 177V161Z" fill="#D78775"/>
    <path d="M149 171L250 161M144 215L263 202M146 190L253 178" strokeWidth="1.4" strokeOpacity=".6"/>
   </g>
   <g stroke="#29648C" strokeWidth="2.7" strokeLinejoin="round" strokeLinecap="round">
    <path d="M172 128C151 118 145 103 155 91C161 84 178 89 187 96C193 81 214 84 223 96C235 112 223 134 210 137L172 128Z" fill="#F8F1E3"/>
    <path d="M194 98C188 77 185 50 193 39C206 46 210 74 210 93" fill="#F8F1E3"/>
    <path d="M173 97C164 79 150 57 155 43C170 46 182 68 185 92" fill="#F8F1E3"/>
    <path d="M201 120C215 110 224 121 230 135" fill="#F8F1E3"/>
    <circle cx="213" cy="106" r="2.4" fill="#29648C" stroke="none"/>
    <path d="M224 113L233 115L224 118M198 132L203 137" />
    <path d="M223 118L241 116M222 121L238 126" strokeWidth="1.3"/>
   </g>
  </>}
  {kind==='open'&&<>
   <g stroke="#29648C" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
    <path d="M180 196C151 177 117 171 85 181V103C117 89 157 103 180 119Z" fill="#F9F1E1"/>
    <path d="M180 196C209 177 243 171 275 181V103C243 89 203 103 180 119Z" fill="#FFF9EA"/>
    <path d="M180 119V196M97 120C129 112 151 123 169 135M97 138C127 131 149 143 169 151M97 154C127 148 149 157 169 167M191 136C213 122 241 112 262 119M191 153C218 137 240 133 262 137M191 168C214 154 239 148 261 153" strokeWidth="1.7"/>
    <path d="M76 189L180 208L286 189" strokeWidth="3"/>
    <path d="M193 98V69H214V108" fill="#E88B77"/>
    <path d="M193 69L203.5 79L214 69" strokeWidth="1.8"/>
   </g>
   <circle cx="116" cy="71" r="5" fill="#28648C"/>
   <path d="M243 61L243 83M232 72H254M260 94L266 100M94 84L99 89" stroke="#29648C" strokeWidth="2"/>
  </>}
  {kind==='shelf'&&<>
   <g stroke="#29648C" strokeWidth="2.5" strokeLinejoin="round">
    <rect x="83" y="73" width="37" height="134" rx="3" fill="#D48473"/>
    <rect x="125" y="59" width="42" height="148" rx="3" fill="#F8F1E3"/>
    <rect x="172" y="81" width="36" height="126" rx="3" fill="#E7B44A"/>
    <path d="M225 87L265 77L294 205L254 214Z" fill="#F5E4BE"/>
    <path d="M95 90H110M92 176H111M139 76H153M139 93H153M139 176H153M183 103H197M182 188H198M237 103L271 96M255 189L285 182" strokeWidth="1.6"/>
    <circle cx="145" cy="139" r="14"/>
    <path d="M141 127V151M149 127V151" strokeWidth="1.5"/>
    <path d="M88 209H299" strokeWidth="6" strokeLinecap="round"/>
   </g>
   <path d="M184 68V38H197V68L190 61Z" fill="#E48779" stroke="#29648C" strokeWidth="2"/>
   <circle cx="274" cy="55" r="6" fill="#29648C"/>
  </>}
  <path d="M66 156C58 152 54 146 52 137M290 65L299 58M62 94L71 97" stroke="#29648C" strokeOpacity=".55" strokeWidth="1.8" strokeLinecap="round"/>
 </svg>;
}
