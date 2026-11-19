/**
 * Both endpoints are PUBLIC branch URLs, never credentials.
 * This is a separate, unreleased research page, not the public li. app.
 */
/**
 * Staging is built only when the maintainer's GitHub Pages workflow explicitly
 * sets this compile-time flag. Untrusted third-party preview/localhost origins
 * remain forbidden; do NOT check a user-controlled URL/query parameter.
 */
export const IS_GITHUB_STAGING=import.meta.env.VITE_LI_AUTH_TARGET==='github-pages-staging';
export const AUTH_ORIGIN=IS_GITHUB_STAGING?'https://sali5610.github.io':'https://li5610.pages.dev';
export const NEON_AUTH_URL='https://ep-misty-snow-azfrrm3o.neonauth.c-3.ap-southeast-1.aws.neon.tech/li/auth';
export const NEON_DATA_API_URL='https://ep-misty-snow-azfrrm3o.apirest.c-3.ap-southeast-1.aws.neon.tech/li/rest/v1';

/**
 * Auth redirect/origin gate is exactly one environment-specific trusted host.
 * Neon Auth must separately allow the staging origin before real Google OAuth.
 * GitHub Pages staging is PUBLIC; no learner data or privileged keys shipped.
 */
export function isTrustedAuthOrigin(origin:string):boolean{
 return origin===AUTH_ORIGIN;
}
