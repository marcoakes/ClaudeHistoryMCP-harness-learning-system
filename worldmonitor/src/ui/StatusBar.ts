export function renderStatusBar(el: HTMLElement, lastRefresh: number | null): void {
  const text = lastRefresh
    ? `Last refresh: ${new Date(lastRefresh).toLocaleTimeString()}`
    : 'Waiting for first refresh';
  el.innerHTML = `<div class="status-chip">${text}</div>`;
}
