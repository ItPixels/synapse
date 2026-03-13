/**
 * Security utilities for sanitizing data.
 */

/**
 * Sanitize a string for safe DOM insertion (prevent XSS).
 * Uses textContent approach — no innerHTML needed.
 */
export function sanitizeText(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Validate and sanitize a URL. Returns null if invalid or unsafe.
 */
export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    // Only allow http(s) protocols
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.href;
  } catch {
    return null;
  }
}

/**
 * Strip potential script injection from text content.
 * Removes <script> tags and event handlers.
 */
export function stripScriptContent(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, "");
}

/**
 * Validate that a string is a safe CSS class name.
 */
export function isSafeClassName(name: string): boolean {
  return /^[a-zA-Z_-][a-zA-Z0-9_-]*$/.test(name);
}

/**
 * Truncate a string safely with max byte length (for storage limits).
 */
export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength - 3)}...`;
}
