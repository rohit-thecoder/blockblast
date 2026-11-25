const STYLE_ID = 'blockblast-web-runtime-style';

/** Adds browser-only input and layout protections for standalone and iframe play. */
export function installWebRuntime() {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return undefined;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    html, body, #root { width: 100%; min-height: 100%; margin: 0; overflow: hidden; }
    body { overscroll-behavior: none; -webkit-user-select: none; user-select: none; }
    #root { display: flex; touch-action: none; }
  `;
  document.head.appendChild(style);

  const preventKeyScroll = (event: KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const target = event.target as HTMLElement | null;
    if (target?.isContentEditable || target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;
    if (event.key === ' ' || event.key === 'ArrowUp' || event.key === 'ArrowDown') event.preventDefault();
  };
  const preventWheelScroll = (event: WheelEvent) => event.preventDefault();
  window.addEventListener('keydown', preventKeyScroll);
  window.addEventListener('wheel', preventWheelScroll, { passive: false });

  return () => {
    window.removeEventListener('keydown', preventKeyScroll);
    window.removeEventListener('wheel', preventWheelScroll);
    style.remove();
  };
}
