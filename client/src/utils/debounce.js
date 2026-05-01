export function debounce(fn, delayMs) {
  let timer = null;
  return (...args) => {
    if (timer) {
      window.clearTimeout(timer);
    }
    timer = window.setTimeout(() => {
      timer = null;
      fn(...args);
    }, delayMs);
  };
}
