// Conteggio anonimo di pagine viste e azioni: nessun cookie, nessun identificativo.
export function track(event: string) {
  if (location.hostname === 'localhost' || navigator.doNotTrack === '1') return;
  try {
    navigator.sendBeacon('/api/hit', JSON.stringify({ e: event, p: location.pathname }));
  } catch { /* il conteggio non deve mai disturbare la pagina */ }
}
