/**
 * Both endpoints are PUBLIC branch URLs, never credentials.
 * This is a separate, unreleased research page, not the public li. app.
 */
export const AUTH_ORIGIN='https://li5610.pages.dev';
export const NEON_AUTH_URL='https://ep-misty-snow-azfrrm3o.neonauth.c-3.ap-southeast-1.aws.neon.tech/li/auth';
export const NEON_DATA_API_URL='https://ep-misty-snow-azfrrm3o.apirest.c-3.ap-southeast-1.aws.neon.tech/li/rest/v1';

/** Fail closed on localhost and preview domains: both are not in managed Auth trusted origins. */
export function isTrustedAuthOrigin(origin:string):boolean{
 return origin===AUTH_ORIGIN;
}
