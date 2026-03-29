---
name: brainstorming
description: >
  Strukturierte Brainstorming-Session fuer neue Features oder technische Entscheidungen.
  Ergebnis ist ein Design-Dokument in REQUIREMENTS/PLAN/.
  Trigger: "brainstorm", "let's brainstorm", "ideenfindung", "design session",
  "lass uns brainstormen", "feature brainstorming"
version: 0.1.0
---

# Brainstorming — Strukturierte Ideenfindung

Fuehrt eine strukturierte Brainstorming-Session durch, um Ideen fuer ein Feature oder eine
technische Entscheidung zu sammeln, zu bewerten und in ein Design-Dokument zu ueberfuehren.

## 1. Vorbereitung

Bevor du mit dem Brainstorming beginnst:

1. Lies `CLAUDE.md` um den Projekt-Kontext zu verstehen
2. Pruefe `REQUIREMENTS/PLAN/` ob bereits verwandte Dokumente existieren
3. Pruefe `REQUIREMENTS/DONE/` ob aehnliche Features bereits implementiert wurden

## 2. Thema erfassen

Frage den User nach:

### 2.1 Problem-Definition

- Was ist das Problem oder die Anforderung?
- Warum ist es wichtig? (Business Value, technische Notwendigkeit)
- Wer sind die Betroffenen? (User, Entwickler, Admins)

### 2.2 Kontext und Einschraenkungen

- Welche bestehenden Packages sind betroffen?
- Gibt es technische Einschraenkungen?
- Gibt es zeitliche Einschraenkungen?
- Abhaengigkeiten zu anderen Packages?

### 2.3 Erfolgs-Kriterien

- Woran erkennt man, dass das Feature erfolgreich ist?
- Was sind die Mindestanforderungen (MVP)?
- Was waere "nice to have"?

## 3. Brainstorming-Phase

### 3.1 Loesungsansaetze sammeln

Generiere mindestens 3 verschiedene Loesungsansaetze:

| # | Ansatz | Kurzbeschreibung | Aufwand | Risiko |
|---|--------|-------------------|---------|--------|
| 1 | ... | ... | S/M/L/XL | Low/Med/High |
| 2 | ... | ... | S/M/L/XL | Low/Med/High |
| 3 | ... | ... | S/M/L/XL | Low/Med/High |

Fuer jeden Ansatz:
- **Pro**: Vorteile dieses Ansatzes
- **Contra**: Nachteile und Risiken
- **Betroffene Packages**: Welche Packages muessen geaendert werden
- **Neue Packages**: Ob neue Packages erstellt werden muessen

### 3.2 Trade-Off-Analyse

Bewerte die Ansaetze nach:

| Kriterium | Ansatz 1 | Ansatz 2 | Ansatz 3 |
|-----------|----------|----------|----------|
| Komplexitaet | | | |
| Wartbarkeit | | | |
| Performance | | | |
| Erweiterbarkeit | | | |
| Testbarkeit | | | |
| Kompatibilitaet | | | |

### 3.3 Empfehlung

Empfehle einen Ansatz mit Begruendung. Stelle sicher dass der User zustimmt bevor
du zum naechsten Schritt gehst.

## 4. Design-Dokument erstellen

Erstelle ein Design-Dokument in `REQUIREMENTS/PLAN/` mit folgendem Format:

**Dateiname**: `REQUIREMENTS/PLAN/design-<feature-name>.md`

**Struktur**:

```markdown
# Design: <Feature-Name>

## Status
ENTWURF | IN REVIEW | GENEHMIGT

## Problem
<Problembeschreibung aus Schritt 2.1>

## Kontext
<Kontext und Einschraenkungen aus Schritt 2.2>

## Erfolgs-Kriterien
<Aus Schritt 2.3>

## Loesungsansaetze
<Zusammenfassung der Ansaetze aus Schritt 3.1>

## Entscheidung
<Gewaehlter Ansatz mit Begruendung aus Schritt 3.3>

## Betroffene Packages
- `xhubioTable/<package>` — Aenderungsbeschreibung

## Offene Fragen
- <Fragen die noch geklaert werden muessen>

## Naechste Schritte
1. Plan erstellen mit `/write-plan`
2. ...
```

## 5. Regeln

- **Sprache**: Design-Dokument auf Deutsch (technische Begriffe auf Englisch)
- **Keine Implementierung**: In dieser Phase wird kein Code geschrieben
- **Keine Annahmen**: Wenn etwas unklar ist, frage den User
- **Monorepo-Kontext**: Immer beruecksichtigen welche Packages betroffen sind
- **Dependency-Hierarchie**: Aenderungen muessen die Package-Abhaengigkeiten respektieren
- **Bestehende Patterns**: Loesungen muessen zu bestehenden Patterns passen

## 6. Naechster Schritt

Nach Abschluss des Brainstormings empfehle dem User:
- `/write-plan <pfad-zum-design-doc>` um einen detaillierten Implementierungsplan zu erstellen
