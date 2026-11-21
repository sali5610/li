import React from 'react';

/** Monochrome blue, deliberately sparse archival line drawings.
 * Decorative only: all labels, data and actions stay in the shared React layouts. */
export type BookwormArtKind='stack'|'open'|'shelf';
export function BookwormIllustration({kind='stack'}:{kind?:BookwormArtKind}){
 return <svg className={'li-bookworm-art li-bookworm-art--'+kind}
  viewBox="0 0 360 260" fill="none" xmlns="http://www.w3.org/2000/svg"
  aria-hidden="true" focusable="false">
  <g stroke="#547E9F" strokeWidth="1.65" strokeLinejoin="round" strokeLinecap="round">
   {kind==='stack'&&<>
    {/* Three slender engraved books, no flat filled stickers. */}
    <path d="M76 199L236 181L289 199L130 217Z" fill="#F6F1E8"/>
    <path d="M130 217L289 199V215L130 234Z" fill="#F6F1E8"/>
    <path d="M76 199V213L130 234V217Z"/>
    <path d="M137 222L283 205M137 227L284 210M91 207L125 223"/>
    <path d="M95 168L248 153L278 170L121 188Z" fill="#F6F1E8"/>
    <path d="M121 188V204L278 187V170Z"/>
    <path d="M95 168V184L121 204V188Z"/>
    <path d="M130 194L269 178M130 199L269 183M101 178L116 186"/>
    <path d="M106 142L239 128L268 146L134 162Z" fill="#F6F1E8"/>
    <path d="M134 162V178L268 161V146Z"/>
    <path d="M106 142V157L134 178V162Z"/>
    <path d="M143 167L262 152M143 172L262 157M116 150L129 158"/>
    {/* A small rabbit, in the spirit of a found antique book engraving. */}
    <path d="M154 126C146 111 150 100 162 95C175 89 185 96 193 101
      C204 90 220 91 227 100C239 118 229 133 211 136L180 135
      C166 139 159 136 154 126Z"/>
    <path d="M189 100C181 80 179 57 186 40C199 51 203 76 202 98"/>
    <path d="M208 97C210 75 218 54 228 46C233 62 226 85 222 101"/>
    <path d="M185 46C194 59 197 80 195 92M220 57C217 67 215 80 214 90"
      strokeWidth=".9"/>
    <path d="M184 112C178 121 177 130 179 135M202 127L208 136M214 128L220 136"/>
    <path d="M221 111L232 114L221 118M226 118L241 115M224 121L240 124" strokeWidth="1.1"/>
    <circle cx="211" cy="107" r="2" fill="#547E9F" stroke="none"/>
    <path d="M168 102C158 97 153 98 147 106C144 114 151 120 158 119"/>
    <path d="M155 140L231 131" strokeWidth=".9" strokeDasharray="2 5"/>
   </>}
   {kind==='open'&&<>
    <path d="M180 207C150 190 115 183 77 192V95C111 83 155 94 180 114Z"
      fill="#F6F1E8"/>
    <path d="M180 207C210 190 245 183 283 192V95C249 83 205 94 180 114Z"
      fill="#F6F1E8"/>
    <path d="M180 114V207M65 199L180 217L295 199" strokeWidth="2"/>
    <path d="M91 113C116 106 148 115 168 129M91 128C119 122 149 132 168 144
     M91 145C118 139 148 147 168 159M91 161C123 156 147 166 168 176
     M192 129C216 113 251 106 269 113M192 144C219 128 246 121 269 128
     M192 159C218 145 246 139 269 145M192 176C214 163 245 155 269 161"
     strokeWidth="1.2"/>
    <path d="M205 100V66H222V106L213.5 98Z"/>
    <path d="M112 76V55M102 65H123M246 55L251 45M253 75L263 70" strokeWidth="1.2"/>
   </>}
   {kind==='shelf'&&<>
    <path d="M85 61H129V210H85Z" fill="#F6F1E8"/>
    <path d="M135 48H180V210H135Z" fill="#F6F1E8"/>
    <path d="M186 76H218V210H186Z" fill="#F6F1E8"/>
    <path d="M234 73L270 65L299 204L263 212Z" fill="#F6F1E8"/>
    <path d="M96 76H119M96 84H119M96 186H119M96 194H119
     M147 62H168M147 70H168M147 182H168M147 191H168
     M195 94H209M195 184H209M244 91L268 86M264 188L289 183"
      strokeWidth="1.1"/>
    <path d="M157 106C147 120 147 139 157 152C167 139 167 120 157 106Z"/>
    <path d="M152 127H163M157 113V148" strokeWidth="1.1"/>
    <path d="M89 213H302M83 218H306" strokeWidth="2.4"/>
    <path d="M212 75V43H227V75L219.5 67Z"/>
   </>}
   <path d="M68 235H301M102 240H260" strokeWidth=".8" opacity=".52"/>
   <path d="M61 147L53 143M300 103L309 98M74 88L66 82" strokeWidth="1.05" opacity=".62"/>
  </g>
 </svg>;
}
