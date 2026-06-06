---
name: Gym Tracker
description: Strumento di gestione coach-cliente per il fitness — serio, tecnico, preciso
colors:
  primary: "oklch(0.38 0.175 150)"
  primary-dark: "oklch(0.57 0.195 150)"
  amber-cardio: "oklch(0.65 0.155 55)"
  background: "oklch(1 0 0)"
  foreground: "oklch(0.13 0.010 150)"
  card: "oklch(0.99 0.005 150)"
  muted-surface: "oklch(0.965 0.007 150)"
  border-subtle: "oklch(0.922 0.007 150)"
  destructive: "oklch(0.577 0.245 27.325)"
typography:
  title:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0.01em"
  mono:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "14px"
  "2xl": "18px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "oklch(0.985 0 0)"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "oklch(0.33 0.175 150)"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "{spacing.md}"
  badge-secondary:
    backgroundColor: "{colors.muted-surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
---

# Design System: Gym Tracker

## 1. Overview

**Creative North Star: "Il Cronometro di Gara"**

Questo sistema visivo si ispira agli strumenti di misurazione atletica — Strava, Garmin Connect, i display dei cicloergometri professionali. Ogni elemento ha uno scopo preciso: portare il dato in primo piano senza distrazioni. La grafica è al servizio dei numeri, non il contrario. Il verde sport-tech (hue 150°, OKLCH) è l'unico accento cromatico di sistema — raro, quindi significativo.

Il registro è quello dell'attrezzatura tecnica: bordi netti, spaziatura rigorosa, gerarchia leggibile in meno di due secondi anche con le mani occupate in palestra. Non c'è posto per illustrazioni, badge gamificati o sfumature decorative. Se un elemento non porta informazione, non esiste.

Il colore canonico è espresso in OKLCH — tecnologia display-P3 wide-gamut. I valori hex approssimati sono riportati in prosa per referenza, ma il frontmatter YAML è normativo.

**Key Characteristics:**
- Paletta monocromatica verde (hue 150°) + ambra (hue 55°, solo cardio)
- Typography system-font-first: Geist carica istantaneamente, nessun FOUT
- Tonal layering invece di shadows: profondità ottenuta via opacità su primary
- Touch-first: target minimi 44px, input numerici con `inputmode="decimal"`
- Reduced-motion compliant: tutte le transizioni rispettano `prefers-reduced-motion`

## 2. Colors: La Palette del Dato

Palette monocromatica con un solo accento caldo. La scarsità del verde è intenzionale — dove appare, guida l'attenzione.

### Primary
- **Verde Atleta** (`oklch(0.38 0.175 150)` ≈ `#0f6b40`): colore primario di sistema. Usato su CTA principali, stati attivi della navigazione, indicatori di forza nel calendario, icone di stato. Mai come sfondo di superficie.
- **Verde Atleta Dark** (`oklch(0.57 0.195 150)` ≈ `#20a864`): variante dark-mode del primary, più luminosa per mantenere il contrasto 4.5:1 su superfici scure.

### Secondary
- **Ambra Cardio** (`oklch(0.65 0.155 55)` ≈ `#c97d10`): riservato esclusivamente alle sessioni cardio nel calendario e nei badge. Crea distinzione semantica forza/cardio senza aggiungere un terzo accent generico.

### Neutral
- **Fondo Bianco** (`oklch(1 0 0)` = `#ffffff`): sfondo app in light mode.
- **Quasi-Nero Verdastro** (`oklch(0.13 0.010 150)` ≈ `#141a16`): testo primario. Leggermente tintato di verde per coerenza con la palette, mai nero puro.
- **Superficie Card** (`oklch(0.99 0.005 150)` ≈ `#fafefb`): sfondo card, appena distinto dal background.
- **Superficie Muted** (`oklch(0.965 0.007 150)` ≈ `#f4f7f4`): chip, badge, aree secondarie.
- **Bordo Sottile** (`oklch(0.922 0.007 150)` ≈ `#e7ede8`): divisori e bordi card. Mai più spesso di 1px.
- **Testo Secondario** (`oklch(0.48 0.012 150)` ≈ `#5a6e5f`): label, descrizioni, metadata.
- **Rosso Errore** (`oklch(0.577 0.245 27.325)` ≈ `#de4224`): destructive actions e messaggi di errore.

### Named Rules
**La Regola del Verde Raro.** Il primary appare su ≤15% della superficie visibile di ogni schermata. Quando tutto è verde, niente è importante.

**La Regola dei Due Accenti.** Verde = forza/principale. Ambra = cardio. Nessun terzo colore semantico. Il viola, il blu, il teal: vietati come accent di sistema.

## 3. Typography

**Font principale:** Geist (sans-serif, Next.js default, ottimizzato per leggibilità a schermo)
**Font mono:** Geist Mono (numeri e dati tabulari)

**Character:** Geist è una scelta deliberata per questo contesto product-register: il sistema-font fallback è quasi identico, elimina il rischio di FOUT in palestra su connessioni lente, e la sua geometria pulita riflette l'estetica tecnica del brand. Non è una scelta "di default" — è la font giusta per lo strumento giusto.

### Hierarchy

- **Title** (700, 1.5rem/24px, lh 1.2, ls -0.02em): titoli di pagina (`h1`). Unico punto di peso massimo per schermata.
- **Heading** (700, 1.25rem/20px, lh 1.3): intestazioni di sezione, titoli card principali. `text-xl font-bold`.
- **Body** (400, 0.875rem/14px, lh 1.5): testo di corpo, descrizioni, paragrafi. Minimo 14px su mobile (l'utente in palestra non può avvicinarsi allo schermo).
- **Label** (500, 0.75rem/12px, lh 1.3, ls 0.01em): metadati, date, contatori secondari. `text-xs font-medium`.
- **Mono Data** (400, 0.75rem/12px, lh 1.4): pesi, rep, RPE, volumi. Sempre `font-mono tabular-nums` — l'allineamento verticale è parte dell'informazione.

### Named Rules
**La Regola del Mono.** Qualsiasi numero che l'utente confronta visivamente (pesi, reps, volume, RPE) usa `font-mono tabular-nums`. Un font proporzionale in una lista di numeri è un bug visivo.

**La Regola del Titolo Unico.** Una sola `h1` per schermata, sempre `text-2xl font-bold`. Nessuna competizione tipografica tra sezioni.

## 4. Elevation

Il sistema è piatto per default. Non ci sono box-shadow strutturali sulle card a riposo — la profondità è ottenuta tramite tonal layering: la card ha `oklch(0.99 0.005 150)` su un background `oklch(1 0 0)`, una differenza di 1% lightness visivamente percepibile senza ombra.

Gli hover state sui componenti interattivi (card, button) usano `shadow-sm` → `shadow-md` come risposta al focus/hover — le ombre appaiono solo come feedback di stato, non come decorazione.

### Named Rules
**La Regola del Piatto-di-Default.** Nessuna ombra a riposo. `shadow-sm` solo su hover/focus come segnale interattivo. `shadow-md` solo per elementi elevati sopra la surface (dropdown, dialog, popover).

## 5. Components

### Buttons
- **Shape:** gently rounded (10px / `rounded-lg`)
- **Primary:** verde atleta `oklch(0.38 0.175 150)` su foreground bianco. Padding `px-4 py-2`. Peso font: 500.
- **Hover / Focus:** darkening a `oklch(0.33 0.175 150)`, `focus-visible:ring-2 focus-visible:ring-ring`. Transizione 150ms ease.
- **Outline:** bordo 1px `border-border`, sfondo trasparente. Per azioni secondarie.
- **Ghost:** nessun bordo né sfondo. Solo per azioni terziarie inline (es. "Vedi storico completo →").
- **Size "sm":** `h-9 px-3 text-sm`. Usato quasi ovunque — l'app è densa, i bottoni grandi rubano spazio ai dati.

### Cards / Containers
- **Corner Style:** gently rounded (10px)
- **Background:** `oklch(0.99 0.005 150)` light / `oklch(0.155 0.009 150)` dark
- **Shadow Strategy:** nessuna ombra a riposo; `hover:shadow-md` per card cliccabili
- **Border:** 1px `oklch(0.922 0.007 150)` — solo visibile, non strutturale
- **Internal Padding:** `p-4` standard; `p-5` per sezioni ricche

### Inputs / Fields
- **Style:** bordo 1px `border-input`, sfondo `oklch(0.965 0.007 150)`, radius 8px
- **Focus:** `ring-2 ring-ring` verde atleta, `ring-offset-2`
- **Altezza:** `h-11` (44px) per touch target mobile; mai sotto 44px
- **Numeri:** sempre `inputmode="decimal"` o `type="number"` per aprire la tastiera numerica su mobile

### Navigation
- **Desktop sidebar (md+):** 240px fixed left. Item attivo: `bg-primary text-primary-foreground`. Item inattivo: `text-muted-foreground hover:bg-muted hover:text-foreground`. Font 14px/medium.
- **Mobile bottom nav:** fixed bottom, 5 item, icona 20px + label 10px. Stato attivo: `text-primary`, `stroke-[2.5]` per peso visivo. Mai backdrop-blur — troppo costoso su Android entry-level.

### Chips / Category Filters
- **Inattivo:** `bg-muted text-muted-foreground`, radius full
- **Attivo:** colore semantico opaco (es. `bg-blue-600 text-white` per PUSH, `bg-emerald-600` per PULL). I colori per categoria esercizio sono eccezioni deliberate al sistema monocromatico — servono come mappa visiva rapida.
- **Accessibility:** `aria-pressed={isSelected}` obbligatorio

### Workout Data Card (componente firma)
La griglia di set (ultimo allenamento, logger): sfondo `bg-muted/40`, interno `p-3`. Ogni riga mostra `Set N` + `Xkg × Y @RPE`. Tutto `font-mono tabular-nums`. Il colore della riga non cambia tra set — l'uniformità crea ritmo di scansione.

## 6. Do's and Don'ts

### Do:
- **Do** usare `tabular-nums font-mono` per qualsiasi numero confrontabile: pesi, reps, RPE, volume, PR.
- **Do** mantenere touch target ≥ 44px per qualsiasi elemento interattivo — i clienti usano l'app con le mani occupate o i guanti.
- **Do** mostrare sempre il contesto di programma (settimana, giorno, nome scheda) prima di chiedere input all'utente.
- **Do** usare `aria-pressed` su tutti i filtri/chip toggle.
- **Do** aggiungere `role="alert" aria-live="polite"` sui messaggi di errore inline.
- **Do** applicare `inputmode="decimal"` su tutti gli input numerici per aprire la tastiera numerica su iOS/Android.
- **Do** rispettare `prefers-reduced-motion` — avvolgere le transizioni in `@media (prefers-reduced-motion: no-preference)`.

### Don't:
- **Don't** usare template Bootstrap, sfumature viola-arancio, foto stock di manubri, o badge fitness gamificati — queste sono le anti-reference esplicite del prodotto.
- **Don't** aggiungere blue navy + donut chart, hero con laptop mockup, copy stile "supercharge your performance" — register SaaS corporate generico, vietato.
- **Don't** usare verde neon, emoji motivazionali, gamification spinta — register consumer fitness teen, estraneo al brand.
- **Don't** aggiungere illustrazioni decorative o icone ornamentali che non portano informazione. Ogni pixel serve un dato.
- **Don't** usare più di due famiglie di font — Geist + Geist Mono è il massimo.
- **Don't** mettere testo a meno di 14px su mobile — l'atleta in palestra non può avvicinarsi allo schermo.
- **Don't** aggiungere un terzo colore accent oltre verde (forza) e ambra (cardio). Il teal, il viola, il blu: non esistono nel vocabolario cromatico.
- **Don't** usare `box-shadow` strutturali su card a riposo — il sistema è flat by default.
- **Don't** omettere `tabular-nums` su numeri in lista. Un font proporzionale in una colonna di pesi è un bug visivo.
