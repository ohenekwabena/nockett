/**
 * Validate a post-login `redirect` target.
 *
 * Only a same-origin, path-absolute URL is allowed. Anything else — an absolute
 * URL with a scheme, a protocol-relative `//host`, a backslash trick `/\host`,
 * or control characters a browser might normalize into a scheme — falls back to
 * `fallback`. This keeps the `redirect` query param from being abused as an
 * open redirect into a phishing site after a user signs in.
 */
export function safeInternalPath(path: string | null | undefined, fallback = "/dashboard"): string {
  if (!path) return fallback;
  // Must begin with a single "/" — a path-absolute reference, not "//" or "/\".
  if (!path.startsWith("/")) return fallback;
  if (path.startsWith("//") || path.startsWith("/\\")) return fallback;
  // Reject ASCII control characters (tab/newline/CR/NUL): a browser may strip
  // them and turn "/<ctrl>/host" into protocol-relative "//host".
  for (let i = 0; i < path.length; i++) {
    const code = path.charCodeAt(i);
    if (code <= 0x1f || code === 0x7f) return fallback;
  }
  return path;
}
