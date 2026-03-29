---
name: executing-plans
description: >
  Fuehrt einen bestehenden Implementierungsplan Schritt fuer Schritt aus.
  Jeder Schritt wird einzeln implementiert, gebaut und getestet.
  Trigger: "execute plan", "plan ausfuehren", "implement plan",
  "plan umsetzen", "schritte ausfuehren", "plan abarbeiten"
version: 0.1.0
---

# Executing Plans — Plaene ausfuehren

Fuehrt einen bestehenden Implementierungsplan (`REQUIREMENTS/PLAN/plan-*.md`) Schritt fuer
Schritt aus. Jeder Schritt wird einzeln implementiert, gebaut und getestet bevor zum
naechsten gewechselt wird.

## 1. Vorbereitung

1. Lies den referenzierten Plan vollstaendig
2. Lies das zugehoerige Design-Dokument (falls referenziert)
3. Lies `CLAUDE.md` fuer Projekt-Konventionen
4. Pruefe die Voraussetzungen aus dem Plan
5. Erstelle eine TaskList mit allen Schritten aus dem Plan

## 2. Ausfuehrungs-Regeln

### 2.1 Ein Schritt nach dem anderen

- Arbeite jeden Schritt einzeln ab
- Markiere den aktuellen Schritt als `in_progress` in der TaskList
- Wechsle erst zum naechsten Schritt wenn der aktuelle vollstaendig verifiziert ist
- Markiere abgeschlossene Schritte als `completed`

### 2.2 Verifikation nach jedem Schritt

Nach jedem Schritt ausfuehren (im jeweiligen Package-Verzeichnis):

```bash
cd xhubioTable/<package>
npm run build    # Format + Lint + TypeScript
npm run test     # Build + Jest
```

**Wenn der Build fehlschlaegt:**
1. Fehler analysieren (TypeScript-Fehler, Lint-Fehler, Format-Fehler)
2. Fehler beheben
3. Erneut bauen
4. Erst nach erfolgreichem Build zum naechsten Schritt

**Wenn Tests fehlschlagen:**
1. Test-Output analysieren
2. Ist es ein echter Bug oder ein Test-Problem?
3. Bug fixen oder Test anpassen
4. Erneut testen
5. Erst nach gruenen Tests zum naechsten Schritt

### 2.3 Abweichungen vom Plan

Wenn waehrend der Ausfuehrung klar wird, dass der Plan angepasst werden muss:

1. **Kleine Anpassung**: Notiere die Abweichung und mache weiter
2. **Grosse Abweichung**: Stoppe und besprich mit dem User
3. **Neuer Schritt noetig**: Fuege ihn in die TaskList ein
4. **Schritt unnoetig**: Markiere als `deleted` mit Begruendung

### 2.4 Parallelisierung

Wenn der Plan parallele Schritte vorsieht:
- Nutze Sub-Agents (Task Tool) fuer parallele Ausfuehrung
- Maximal 6 Sub-Agents gleichzeitig
- Jeder Sub-Agent bearbeitet genau einen Schritt
- Warte auf Abschluss aller parallelen Schritte bevor abhaengige Schritte starten
- Siehe `dispatching-parallel-agents` Skill fuer Details

## 3. TDD-Integration

Wenn der Plan Tests vorsieht, folge dem TDD-Zyklus:

1. **Red**: Test schreiben der fehlschlaegt
2. **Green**: Minimale Implementation die den Test bestehen laesst
3. **Refactor**: Code aufraeumen ohne Verhalten zu aendern

Siehe `test-driven-development` Skill fuer Details.

## 4. Nach Abschluss aller Schritte

### 4.1 Gesamt-Verifikation

Fuehre die Gesamt-Verifikation aus dem Plan aus:

```bash
# Alle betroffenen Packages bauen und testen
cd xhubioTable/<package-1> && npm run test
cd xhubioTable/<package-2> && npm run test
# ...
```

### 4.2 Plan-Status aktualisieren

Aktualisiere den Status im Plan-Dokument:
- `## Status` auf `ABGESCHLOSSEN` setzen
- Datum hinzufuegen
- Etwaige Abweichungen dokumentieren

### 4.3 Abschluss-Pruefung

Fuehre den `verification-before-completion` Skill aus:
- Alle Builds gruen?
- Alle Tests gruen?
- Keine unbeabsichtigten Aenderungen?

## 5. Fehlerbehandlung

| Situation | Vorgehen |
|-----------|----------|
| Build-Fehler | Fehler fixen, erneut bauen |
| Test-Fehler | Analysieren: Bug oder Test-Problem? Fixen. |
| Dependency-Fehler | `npm install` ausfuehren, ggf. Package-Version pruefen |
| Type-Fehler in abhaengigem Package | Zuerst das Basis-Package fixen, dann `npm run build`, dann abhaengiges Package |
| Plan-Schritt unklar | User fragen, nicht raten |
| Unerwartete Seiteneffekte | Stoppen, analysieren, mit User besprechen |

## 6. Regeln

- **Kein Schritt ueberspringen**: Auch wenn ein Schritt trivial erscheint
- **Immer verifizieren**: Build + Test nach jedem Schritt
- **Monorepo-Kontext**: Commands im jeweiligen Package-Verzeichnis ausfuehren
- **Keine eigenmaechtigen Erweiterungen**: Nur das implementieren was im Plan steht
- **Bei Zweifeln fragen**: Lieber einmal zu viel fragen als falsch implementieren
