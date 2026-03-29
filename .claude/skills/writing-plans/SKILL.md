---
name: writing-plans
description: >
  Erstellt detaillierte, ausfuehrbare Implementierungsplaene aus Design-Dokumenten.
  Ergebnis ist ein Plan in REQUIREMENTS/PLAN/ mit konkreten Schritten.
  Trigger: "write plan", "plan erstellen", "implementierungsplan",
  "write implementation plan", "plan schreiben", "ausfuehrbaren plan erstellen"
version: 0.1.0
---

# Writing Plans — Implementierungsplaene erstellen

Erstellt einen detaillierten, ausfuehrbaren Implementierungsplan aus einem Design-Dokument
oder einer Feature-Beschreibung. Der Plan enthaelt konkrete Schritte die einzeln
ausgefuehrt und verifiziert werden koennen.

## 1. Vorbereitung

Bevor du den Plan schreibst:

1. Lies das Design-Dokument (falls vorhanden, z.B. aus `/brainstorm`)
2. Lies `CLAUDE.md` fuer Projekt-Konventionen
3. Lies bestehenden Code der betroffenen Packages unter `xhubioTable/`

## 2. Analyse

### 2.1 Betroffene Packages identifizieren

Liste alle Packages die geaendert werden muessen:

| Package | Aenderungstyp |
|---------|---------------|
| `xhubioTable/<name>` | Neu / Aenderung / Erweiterung |

### 2.2 Abhaengigkeits-Reihenfolge bestimmen

Sortiere die Packages nach Abhaengigkeiten (Blaetter zuerst):
1. logger, model (Basis-Packages)
2. model-decision, model-matrix, data-generator (abhaengig von model)
3. file-processor, importer-xlsx (Parser-Layer)
4. processor (orchestriert alles)

### 2.3 Risiken identifizieren

- Breaking Changes in Interfaces
- Neue Dependencies
- Performance-Auswirkungen

## 3. Plan schreiben

### 3.1 Plan-Format

Erstelle den Plan in `REQUIREMENTS/PLAN/` mit folgendem Format:

**Dateiname**: `REQUIREMENTS/PLAN/plan-<feature-name>.md`

**Struktur**:

```markdown
# Plan: <Feature-Name>

## Referenz
- Design-Doc: `REQUIREMENTS/PLAN/design-<name>.md` (falls vorhanden)
- Betroffene Packages: <Liste>

## Voraussetzungen
- <Was muss vorher erledigt sein>

## Schritte

### Schritt 1: <Beschreibung>
**Package**: `xhubioTable/<package>`
**Typ**: Interface / Implementation / Test / Config
**Dateien**:
- `src/<datei>.ts` — <Was aendern>
- `tests/<datei>.test.ts` — <Was testen>

**Implementierung**:
<Konkrete Beschreibung was zu tun ist>

**Verifikation**:
```bash
cd xhubioTable/<package>
npm run build
npm run test
```

**Abhaengigkeiten**: Keine / Schritt X muss vorher abgeschlossen sein

---

### Schritt 2: <Beschreibung>
...

## Verifikation (Gesamt)

```bash
# Alle betroffenen Packages bauen und testen
cd xhubioTable/<package-1> && npm run test
cd xhubioTable/<package-2> && npm run test
```

## Rollback-Plan
<Was tun wenn es schiefgeht>
```

### 3.2 Regeln fuer gute Plaene

**Granularitaet:**
- Jeder Schritt betrifft idealerweise ein Package
- Ein Schritt sollte in 15-60 Minuten umsetzbar sein
- Zu grosse Schritte aufteilen, zu kleine zusammenfassen

**Reihenfolge:**
- Interfaces und Types zuerst
- Implementation nach Dependency-Reihenfolge (Blaetter zuerst)
- Tests zusammen mit Implementation (TDD wenn moeglich)

**Verifikation:**
- Jeder Schritt hat einen konkreten Verifikations-Befehl
- Mindestens `npm run build` nach jedem Schritt
- `npm run test` wenn Tests betroffen sind

**Testbarkeit:**
- Jeder Schritt beschreibt welche Tests geschrieben/geaendert werden
- Test-Dateien in `tests/`, Fixtures in `tests/fixtures/`
- Coverage-relevante Pfade identifizieren

**Parallelisierbarkeit:**
- Markiere welche Schritte parallel ausfuehrbar sind
- Maximal 6 parallele Sub-Agents
- Abhaengige Schritte klar kennzeichnen

## 4. Review mit User

Stelle dem User den Plan vor und frage:

1. Ist die Reihenfolge sinnvoll?
2. Fehlen Schritte?
3. Sind die Verifikations-Schritte ausreichend?
4. Gibt es Bedenken zu einzelnen Schritten?

## 5. Regeln

- **Sprache**: Plan auf Deutsch (technische Begriffe auf Englisch)
- **Konkret**: Keine vagen Beschreibungen, konkrete Dateien und Aenderungen
- **Verifizierbar**: Jeder Schritt muss pruefbar sein
- **Monorepo-Kontext**: Commands laufen im jeweiligen Package-Verzeichnis
- **Keine Implementierung**: In dieser Phase wird kein Code geschrieben
- **Build-Commands**: `npm run build` (format + lint + tsc), `npm run test` (build + jest)

## 6. Naechster Schritt

Nach Abschluss des Plans empfehle dem User:
- `/execute-plan REQUIREMENTS/PLAN/plan-<name>.md` um den Plan auszufuehren
- Oder: Einzelne Schritte manuell ausfuehren wenn der Plan zu komplex ist
