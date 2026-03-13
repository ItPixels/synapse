/**
 * Debounced MutationObserver wrapper.
 * Watches a container for DOM changes and fires a callback
 * after a period of silence (no new mutations).
 */
export function createDebouncedObserver(
  target: Element,
  callback: () => void,
  debounceMs = 3000,
): MutationObserver {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const observer = new MutationObserver(() => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      callback();
      timeoutId = null;
    }, debounceMs);
  });

  observer.observe(target, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  return observer;
}
