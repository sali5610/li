/* Cloudflare first-party Auth-only or AI candidate PWA; no source-site mutation and no auth,
 * OAuth, Neon or private-data API response is ever cached. Origin scope is /.
 * Keep GitHub Pages' separate /li/ Workbox configuration unchanged. */
const target=process.env.LI_CLOUDFLARE_AI_BUILD==='1'?
 'dist-cloudflare-ai-candidate':'dist-cloudflare-auth-candidate';
module.exports={
 globDirectory:target,
 globPatterns:[
  'index.html','manifest.webmanifest','assets/*.{js,css,svg}',
  'assets/li-content-adapter.mjs',
  'content-packs/search.json','content-packs/graph.json',
  'content-packs/course-catalog.json','content-packs/answerability.json'
 ],
 globIgnores:['**/*.map','**/*qa-secrets*'],
 importScripts:['assets/li-push-handler.js'],
 swDest:target+'/sw.js',
 mode:'production',
 maximumFileSizeToCacheInBytes:5*1024*1024,
 cleanupOutdatedCaches:true,
 ignoreURLParametersMatching:[/^v$/,/^utm_/,/^fbclid$/],
 clientsClaim:true,
 skipWaiting:true,
 // Navigation to /api/auth/* or Google verifier callbacks must reach the
 // server's first-party Auth Worker (never a cached index.html response).
 runtimeCaching:[{
  urlPattern:new RegExp('^/assets/.*[.](?:png|jpe?g|webp|gif|avif)$','i'),
  handler:'CacheFirst',
  options:{cacheName:'li-first-party-images',
   cacheableResponse:{statuses:[200]},
   expiration:{maxEntries:80,maxAgeSeconds:30*24*60*60}}
 }]
};
