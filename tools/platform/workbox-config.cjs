/* STAGING ONLY. Generated after the unified Auth+lesson shell is assembled.
 * No Neon, OAuth, external origin, personal progress, or QA data in caches.
 * User-visible content can only be used offline after valid authentication logic allows it.
 * This is a MULTI-PAGE static site (the React Studio and lesson documents have real URLs).
 * Do not add navigateFallback: routing every navigation to /li/index.html hijacks
 * /li/design-system/ into the invited-only app login gate on iOS Safari.
 */
module.exports={
 globDirectory:"site",
 globPatterns:["index.html","manifest.webmanifest","assets/*.{js,css,svg}",
  "assets/li-content-adapter.mjs","content-packs/search.json",
  "content-packs/graph.json","content-packs/course-catalog.json",
  "content-packs/answerability.json"],
 globIgnores:["**/*.map","**/*qa-secrets*"],
 swDest:"site/sw.js",
 mode:"production",
 maximumFileSizeToCacheInBytes:5*1024*1024,
 cleanupOutdatedCaches:true,
 // HTML uses ?v=cache-version, which must still resolve to the revisioned precache offline.
 ignoreURLParametersMatching:[/^v$/,/^utm_/,/^fbclid$/],
 clientsClaim:true,
 // Hotfix: activate the corrected worker when an already-installed broken worker updates.
 // No indexedDB, account or cached private data is altered by this worker upgrade.
 skipWaiting:true,
 // Keep Workbox precache routing for /li/index.html and /li/;
 // never rewrite other HTML documents (Studio, Component Library, lessons) as the app.
 runtimeCaching:[
  {urlPattern:new RegExp("^/li/assets/.*[.](?:png|jpe?g|webp|gif|avif)$","i"),
   handler:"CacheFirst",
   options:{cacheName:"li-staging-images",cacheableResponse:{statuses:[200]},
    expiration:{maxEntries:80,maxAgeSeconds:30*24*60*60}}}
 ]
};
