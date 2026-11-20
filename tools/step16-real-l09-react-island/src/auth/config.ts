/// <reference types="vite/client" />
/**
 * Staging is static GitHub Pages; only Cloudflare production can safely host
 * the first-party Auth proxy needed by iPhone home-screen PWA storage.
 */
export const IS_GITHUB_STAGING=import.meta.env.VITE_LI_AUTH_TARGET==='github-pages-staging';
/** Only the two compiled, integrated invited-only app targets can own learner
 * state. Auth research pages must NOT become a private-data app by accident. */
export const IS_INTEGRATED_LI_APP=IS_GITHUB_STAGING||
 import.meta.env.VITE_LI_AUTH_TARGET==='cloudflare-first-party';
export const AUTH_ORIGIN=IS_GITHUB_STAGING?'https://sali5610.github.io':'https://li5610.pages.dev';
export const NEON_AUTH_URL='https://ep-misty-snow-azfrrm3o.neonauth.c-3.ap-southeast-1.aws.neon.tech/li/auth';
export const NEON_DATA_API_URL='https://ep-misty-snow-azfrrm3o.apirest.c-3.ap-southeast-1.aws.neon.tech/li/rest/v1';

/** Browser-facing origin is first-party only when its server proxy is deployed.
 * Staging deliberately retains old Neon Auth until the live app host can
 * serve an equivalent first-party endpoint; no false login-persistence claim. */
export const AUTH_API_URL=IS_GITHUB_STAGING?NEON_AUTH_URL:AUTH_ORIGIN+'/api/auth';

export function isTrustedAuthOrigin(origin:string):boolean{
 return origin===AUTH_ORIGIN;
}
