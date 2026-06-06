---
target: dashboard + workout logger + admin
total_score: 23
p0_count: 0
p1_count: 3
timestamp: 2026-06-06T10-43-48Z
slug: src-app-app-dashboard-page-tsx
---
## Design Health Score

| # | Heuristica | Score | Finding |
|---|-----------|-------|---------|
| 1 | Visibility of System Status | 2 | Nessun timer visibile durante il workout |
| 2 | Match System / Real World | 3 | RPE e zona intensità senza spiegazione |
| 3 | User Control and Freedom | 2 | Rimozione set istantanea; nessuna protezione mid-workout |
| 4 | Consistency and Standards | 3 | BookOpen icon senza label |
| 5 | Error Prevention | 2 | No conferma su eliminazione; no validazione bounds |
| 6 | Recognition Rather Than Recall | 3 | W1-W6 senza unità |
| 7 | Flexibility and Efficiency | 2 | Nessuna scorciatoia; no copia programma |
| 8 | Aesthetic and Minimalist Design | 3 | Post-palette pulito |
| 9 | Error Recovery | 2 | "Errore nel salvataggio" generico x3 |
| 10 | Help and Documentation | 1 | Zero tooltip/help per coach |
| Total | | 23/40 | Acceptable |

## Priority Issues

[P1] Perdita dati nel workout logger
[P1] Errori generici senza recovery
[P1] Zero help per coach nuovi (RPE, zona intensità)
[P2] Nessun timer durante workout
[P2] BookOpen icon-only senza label

## Persona Red Flags

Marco (Coach): RPE senza spiegazione, W1-W6 senza unità, errori generici
Casey (Mobile): Back browser = perdita workout
Jordan (Primo cliente): Empty state non insegna nulla
