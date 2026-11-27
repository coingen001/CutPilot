# CutPilot

Ottimizzatore di taglio per pannelli (2D) e barre/profilati (1D), in tedesco, italiano, francese (millimetri) e inglese per gli Stati Uniti (pollici).
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
- `de/`, `it/`, `en-us/`, `fr/` – pagine per lingua, con note legali e privacy

## Limiti noti

- Un solo formato di pannello (o barra) per calcolo; nessun magazzino di ritagli.
- Il 2D usa euristiche a ghigliottina: buone soluzioni, non l'ottimo dimostrato.
- Nessun confronto ancora fatto con i risultati dei concorrenti.
- Niente account, pagamenti o salvataggio in cloud: fuori dal perimetro di questa versione.
- I tag `hreflang` vanno aggiunti alle pagine `de/` e `it/` con URL assoluti quando il dominio è scelto.

## Confronto con i concorrenti

`bench/distinte/` contiene 12 distinte di prova (8 pannelli, 4 barre). `npm run bench` calcola per ognuna
il risultato di CutPilot e il limite teorico, e scrive `bench/risultati-cutpilot.csv`.

Parametri da usare uguali nei programmi concorrenti:

- Pannelli: 2800 × 2070 mm, lama 4 mm, rifilo 10 mm per bordo, tutti i pezzi ruotabili.
- Barre: 6000 mm, lama 3 mm, nessun rifilo.

Il limite teorico è un minimo calcolato su area o lunghezza: nessun programma può scendere sotto,
ma spesso non è raggiungibile. Il confronto che conta è con i concorrenti.

## Pagine

Le pagine HTML in `de/`, `it/`, `en-us/` e `fr/` sono generate da `scripts/pages.py`
(home, strumenti per materiale, prezzi, note legali, privacy). Per cambiare un testo
si modifica lo script e si riesegue `python3 scripts/pages.py`.

- Strumenti per materiale: stessa applicazione con valori iniziali propri (formato, lama, rifilo, venatura).
- Prezzi: i piani PRO e Business raccolgono l'email in lista d'attesa con Netlify Forms (modulo `waitlist`).
- Salvataggio progetti: funzione PRO. Il pulsante è visibile e, quando si prova, mostra l'invito al piano; l'ultima distinta resta comunque nel browser.
- Statistiche: contatore interno senza cookie (`netlify/functions/hit.mts`), report su `/admin` (accesso con la chiave `STATS_KEY` impostata su Netlify).
- Stati Uniti: misure in pollici, scritte e lette come frazioni (`src/units.ts`).
