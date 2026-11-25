/* Cloudflare Auth-only candidate PWA; no source-site mutation and no auth,
 * OAuth, Neon or private-data API response is ever cached. Origin scope is /.
 * Keep GitHub Pages' separate /li/ Workbox configuration unchanged. */
module.exports={
 globDirectory:'dist-cloudflare-auth-candidate',
 globPatterns:[
  'index.html','manifest.webmanifest','assets/**/*.{js,mjs,css,svg,json}',
  'assets/home-li-*.webp','assets/discipline/*.webp','assets/groups/*.webp','assets/portals/*.webp',
  'assets/laoly-state-loading.png','assets/laoly-state-error.png','assets/laoly-*.png',
  'content-packs/*.{js,json}','lessons/companion/*.json'
 ],
 globIgnores:['**/*.map','**/*qa-secrets*'],
 importScripts:['assets/li-push-handler.js'],
 swDest:'dist-cloudflare-auth-candidate/sw.js',
 mode:'production',
 maximumFileSizeToCacheInBytes:5*1024*1024,
 cleanupOutdatedCaches:true,
 ignoreURLParametersMatching:[/^v$/,/^utm_/,/^fbclid$/],
 clientsClaim:true,
 // Wait for explicit learner consent; Workbox handles SKIP_WAITING messages.
 skipWaiting:false,
 // Only public SPA document routes may fall back to the precached shell.
 // OAuth callbacks and API paths must always reach the server, never the shell.
 navigateFallback:'index.html',
 navigateFallbackAllowlist:[/^\/(?:index\.html)?(?:\?|$)/],
 navigateFallbackDenylist:[/[?&](?:code|state|error|neon_auth_session_verifier|oauth|pilot)=/i],
 // Only public assets; never cache private API responses.
 runtimeCaching:[{
  urlPattern:new RegExp('^/assets/.*[.](?:png|jpe?g|webp|gif|avif)$','i'),
  handler:'CacheFirst',
  options:{cacheName:'li-first-party-images',
   cacheableResponse:{statuses:[200]},
   expiration:{maxEntries:80,maxAgeSeconds:30*24*60*60}}
 }]
};
