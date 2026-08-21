# ObroNOW — Restyling sito

Restyling del sito di un produttore di cerniere per cancelli. Progetto usato anche per imparare architettura, design system e modellazione dati.

## Stack

- **[Astro](https://astro.build)** in modalità SSG (static site generation) — le pagine sono generate come HTML statico in fase di build, non ad ogni richiesta. Ottimo per SEO e performance; ogni aggiornamento contenuti richiede un nuovo deploy.
- **Deploy target**: Vercel (deploy automatico da GitHub, preview per ogni PR).

## Struttura

```text
/
├── public/          # asset statici (immagini, PDF schede tecniche, ecc.)
├── src/
│   └── pages/        # ogni file .astro/.md qui diventa una route
└── package.json
```

## Comandi

| Comando           | Azione                                      |
| ------------------ | -------------------------------------------- |
| `npm install`       | Installa le dipendenze                       |
| `npm run dev`       | Avvia il dev server su `localhost:4321`      |
| `npm run build`     | Build di produzione in `./dist/`             |
| `npm run preview`   | Preview della build in locale prima del deploy |

## Roadmap

- [ ] Raccogliere contenuti e asset del sito attuale
- [ ] Definire schema dati del catalogo prodotti (content collections Astro)
- [ ] Bozza wireframe / design system (componenti riusabili: card prodotto, nav, footer)
- [ ] Pagine: Home, Catalogo, Scheda prodotto, Chi siamo, Contatti
- [ ] Structured data SEO (schema.org `Product`) sulle schede prodotto
- [ ] Collegare il repo a Vercel per il deploy automatico
