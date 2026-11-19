/**
 * CUR-TD-06 research-only Notion learner export guard.
 * NOT a deployed endpoint. NEVER pass client-controlled manifest or Notion fetch text.
 * Only trusted editor-side callers may supply the allowlist and pinned source hash.
 */
import { createHash, timingSafeEqual } from 'node:crypto';

const PAGE_URL = /<page\s+url="https:\/\/app\.notion\.com\/p\/([0-9a-f-]{32,36})"[^>]*>/g;
const BODY_OPEN = '<content>\n';
const BODY_CLOSE = '\n</content>';
const UNSAFE = [
  /(?:app\s*\.\s*notion\s*\.\s*com\s*\/\s*p\s*\/|notion\s*\.\s*so\s*\/)/i,
  /(?:teacher[\s-]*(?:key|ledger)|answer[\s-]*key|reference\s+solution|independent\s+answer|đáp\s*án\s*mẫu|đáp\s*án\s*độc\s*lập|editor[\s-]*only)/i,
  /<\s*\/?\s*(?:script|iframe|object|embed|form|input|link-preview|page|ancestor-path|properties|callout|mention)\b/i,
  /(?:javascript\s*:|data\s*:\s*text\/html|onerror\s*=|onclick\s*=)/i,
];

export class ExportDenied extends Error {
  constructor(reason) { super(`CUR_TD_EXPORT_DENIED:${reason}`); this.name = 'ExportDenied'; }
}

const deny = (why) => { throw new ExportDenied(why); };
const normId = (value) => typeof value === 'string' ? value.toLowerCase().replaceAll('-', '') : '';
const isDigest = (s) => typeof s === 'string' && /^[0-9a-f]{64}$/.test(s);
const occurrences = (s, needle) => {
  let count = 0, i = 0;
  while ((i = s.indexOf(needle, i)) !== -1) { count += 1; i += needle.length; }
  return count;
};
const canonical = (s) => {
  const entities = s.replace(/&#(?:x([0-9a-f]+)|([0-9]+));/gi, (_, hex, dec) => {
    const n = parseInt(hex ?? dec, hex ? 16 : 10);
    return n > 0 && n < 0x110000 ? String.fromCodePoint(n) : _;
  }).replace(/&(?:amp|period|sol|colon|lt|gt);/gi, (x) => ({
    '&amp;': '&', '&period;': '.', '&sol;': '/', '&colon;': ':', '&lt;': '<', '&gt;': '>',
  })[x.toLowerCase()] ?? x);
  let decoded = entities;
  try { decoded = decodeURIComponent(entities); } catch { /* malformed percent escapes are not interpreted */ }
  return decoded.normalize('NFKC').replace(/[\u200b-\u200f\u2060\ufeff]/g, '');
};
const indexHeader = (body, header) => {
  if (typeof header !== 'string' || !/^#{1,3} [^\n]+$/.test(header)) deny('BAD_MANIFEST_HEADER');
  const marker = `\n${header}\n`;
  const haystack = `\n${body}\n`;
  if (occurrences(haystack, marker) !== 1) deny('HEADER_MISSING_OR_DUPLICATED');
  return haystack.indexOf(marker); // index relative to body because of the prefixed newline
};

/** Pinned digest is of Notion <content> body (not volatile fetch timestamp). */
export const hashNotionBody = (body) => createHash('sha256').update(body, 'utf8').digest('hex');

/**
 * Expected `manifest` (trusted editor-side static record, NOT client input):
 * { [sourceNotionPageId]: { version, sha256, viStart, enStart, end,
 *    minimumLocaleChars, forbiddenFingerprints: [known unique answer snippets] } }
 */
export function exportLearnerFromNotion({ sourceId, rawNotionFetch, manifest }) {
  if (typeof rawNotionFetch !== 'string' || Buffer.byteLength(rawNotionFetch) > 500_000) deny('SOURCE_SIZE');
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) deny('NO_TRUSTED_MANIFEST');
  const key = Object.keys(manifest).find((k) => normId(k) === normId(sourceId));
  if (!key || normId(sourceId).length !== 32) deny('SOURCE_NOT_ALLOWLISTED');
  const cfg = manifest[key];
  if (!cfg || !isDigest(cfg.sha256) || !/^[a-zA-Z0-9_.:-]{3,90}$/.test(cfg.version ?? '')) deny('UNPINNED_SOURCE');
  if (!Array.isArray(cfg.forbiddenFingerprints) || cfg.forbiddenFingerprints.length === 0 ||
      cfg.forbiddenFingerprints.some((x) => typeof x !== 'string' || x.length < 5)) deny('NO_ANSWER_FINGERPRINT_REVIEW');

  const urls = [...rawNotionFetch.matchAll(PAGE_URL)];
  if (urls.length !== 1 || normId(urls[0][1]) !== normId(sourceId)) deny('SOURCE_PAGE_ID_MISMATCH');
  if (occurrences(rawNotionFetch, BODY_OPEN) !== 1 || occurrences(rawNotionFetch, BODY_CLOSE) !== 1) deny('PAGE_ENVELOPE');
  const open = rawNotionFetch.indexOf(BODY_OPEN) + BODY_OPEN.length;
  const close = rawNotionFetch.lastIndexOf(BODY_CLOSE);
  if (close <= open) deny('PAGE_ENVELOPE');
  const body = rawNotionFetch.slice(open, close);
  const actual = Buffer.from(hashNotionBody(body), 'hex');
  const pinned = Buffer.from(cfg.sha256, 'hex');
  if (!timingSafeEqual(actual, pinned)) deny('SOURCE_REVISION_CHANGED');

  const vi = indexHeader(body, cfg.viStart);
  const en = indexHeader(body, cfg.enStart);
  const end = indexHeader(body, cfg.end);
  if (!(vi < en && en < end)) deny('LOCALE_BOUNDARY_ORDER');
  const viText = body.slice(vi, en).trim();
  const enText = body.slice(en, end).trim();
  const minChars = cfg.minimumLocaleChars ?? 300;
  if (!Number.isInteger(minChars) || minChars < 100 || viText.length < minChars || enText.length < minChars) deny('LOCALE_INCOMPLETE');
  const combined = canonical(`${viText}\n${enText}`);
  if (UNSAFE.some((re) => re.test(combined)) || cfg.forbiddenFingerprints.some((x) => combined.includes(canonical(x)))) deny('SPOILER_OR_UNSAFE_PAYLOAD');

  // Deliberately no source/editorial URLs or teacher fields in serialized output.
  return Object.freeze({ version: cfg.version, researchOnly: true, published: false,
    languages: Object.freeze({ vi: viText, en: enText }) });
}
