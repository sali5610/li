'use strict';
const fs=require('node:fs'),path=require('node:path'),{gzipSync}=require('node:zlib');
const folder=__dirname, modes=['vanilla','react','lit'];
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
 const full=path.join(dir,entry.name);return entry.isDirectory()?walk(full):[full];
});}
const result=modes.map(mode=>{
 const dist=path.join(folder,'dist',mode);
 if(!fs.existsSync(dist))throw Error('Build missing '+mode);
 const files=walk(dist).filter(f=>/\.(js|css|html)$/.test(f));
 const source=files.filter(f=>f.endsWith('.js')).map(f=>fs.readFileSync(f));
 const css=files.filter(f=>f.endsWith('.css')).map(f=>fs.readFileSync(f));
 if(!source.length||!css.length)throw Error('Missing assets '+mode);
 const gz=sources=>sources.reduce((n,b)=>n+gzipSync(b,{level:9,mtime:0}).length,0);
 return {variant:mode,jsBytes:source.reduce((s,b)=>s+b.byteLength,0),
  jsGzipBytes:gz(source),cssGzipBytes:gz(css),assetCount:files.length};
});
console.log('LI_STEP16_BUNDLE '+JSON.stringify({build:'Vite bundled, same shared state/data/CSS and same minifier',results:result}));
