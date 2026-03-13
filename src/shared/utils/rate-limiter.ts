/**
 * Simple sliding window rate limiter for API calls.
 */
export class RateLimiter {
  private timestamps: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Check if a request can proceed. Returns true if within limits.
   */
  canProceed(): boolean {
    this.cleanup();
    return this.timestamps.length < this.maxRequests;
  }

  /**
   * Record a request. Returns true if the request was allowed.
   */
  record(): boolean {
    this.cleanup();
    if (this.timestamps.length >= this.maxRequests) {
      return false;
    }
    this.timestamps.push(Date.now());
    return true;
  }

  /**
   * Time in ms until the next request can be made.
   * Returns 0 if a request can be made now.
   */
  getWaitTime(): number {
    this.cleanup();
    if (this.timestamps.length < this.maxRequests) return 0;
    const oldest = this.timestamps[0];
    if (oldest === undefined) return 0;
    return Math.max(0, oldest + this.windowMs - Date.now());
  }

  /**
   * Remove expired timestamps.
   */
  private cleanup(): void {
    const cutoff = Date.now() - this.windowMs;
    this.timestamps = this.timestamps.filter((t) => t > cutoff);
  }
}

/** Global rate limiter for summarization API (10 per minute). */
export const summarizationLimiter = new RateLimiter(10, 60_000);
