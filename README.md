# CutPilot

Ottimizzatore di taglio per pannelli (2D) e barre/profilati (1D), in tedesco e italiano.
Nome di progetto provvisorio.

## Cosa fa

- **2D**: tagli a ghigliottina (passanti), spessore lama, rifilo per bordo, rotazione dei pezzi e vincolo di venatura.
- **1D**: barre con spessore lama e rifilo iniziale.
- Import della distinta da CSV o Excel (`.xlsx`), schema di taglio in SVG, stampa / PDF dal browser.
- Tutto gira nel browser: nessun server, nessun account, nessun dato inviato.

## Comandi

```
npm install
npm run dev      # sviluppo
npm test         # test del motore
npm run build    # sito statico in dist/
```

## Struttura

- `src/engine/` – motore, funzioni pure senza dipendenze (`cut1d.ts`, `cut2d.ts`)
- `tests/` – test del motore, inclusi 500 casi casuali con controllo di validità
- `src/main.ts`, `src/i18n.ts`, `src/import.ts` – interfaccia
- `de/`, `it/` – una pagina per lingua

## Limiti noti

- Un solo formato di pannello (o barra) per calcolo; nessun magazzino di ritagli.
- Il 2D usa euristiche a ghigliottina: buone soluzioni, non l'ottimo dimostrato.
- Nessun confronto ancora fatto con i risultati dei concorrenti.
- Niente account, pagamenti o salvataggio in cloud: fuori dal perimetro di questa versione.
- I tag `hreflang` vanno aggiunti alle pagine `de/` e `it/` con URL assoluti quando il dominio è scelto.
