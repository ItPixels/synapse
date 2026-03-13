import { PLATFORM_CONFIGS } from "@/shared/constants/platforms";
import type { AIPlatform, PlatformConfig } from "@/shared/types";

/**
 * Detects which AI platform the current page belongs to.
 * Returns null if the URL doesn't match any known platform.
 */
export function detectPlatform(url: string): AIPlatform | null {
  for (const config of Object.values(PLATFORM_CONFIGS)) {
    if (config.urlPatterns.some((pattern) => pattern.test(url))) {
      return config.platform;
    }
  }
  return null;
}

/**
 * Returns the full platform config for the current URL, or null.
 */
export function getPlatformConfig(url: string): PlatformConfig | null {
  const platform = detectPlatform(url);
  if (!platform) return null;
  return PLATFORM_CONFIGS[platform];
}
