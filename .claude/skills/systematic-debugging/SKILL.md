---
name: systematic-debugging
description: >
  Strukturiertes Debugging mit Root-Cause-Analyse statt Trial-and-Error.
  Folgt einem systematischen Prozess um Fehlerursachen zu finden und zu beheben.
  Trigger: "debug", "systematisch debuggen", "root cause", "fehler finden",
  "bug analysieren", "systematic debugging", "why is this failing"
version: 0.1.0
---

# Systematic Debugging — Strukturiertes Fehlersuchen

Strukturierter Debugging-Prozess der Root-Cause-Analyse statt Trial-and-Error verfolgt.
Ziel: Die eigentliche Ursache finden und beheben, nicht nur Symptome behandeln.

## 1. Grundprinzip

**Niemals raten. Immer verstehen.**

```
Symptom beobachten
    ↓
Hypothese bilden
    ↓
Hypothese testen (mit minimalem Experiment)
    ↓
Ursache verstehen
    ↓
Fix implementieren
    ↓
Verifizieren (Test schreiben)
```

## 2. Debugging-Prozess

### 2.1 Symptom praezise beschreiben

Bevor du irgendetwas tust, beschreibe das Problem exakt:

- **Was**: Was passiert? Was sollte stattdessen passieren?
- **Wo**: Welches Package? Welche Datei? Welche Funktion?
- **Wann**: Immer? Nur unter bestimmten Bedingungen? Seit wann?
- **Fehlermeldung**: Exakter Text, Stack Trace

### 2.2 Reproduzieren

Stelle sicher dass du den Fehler reproduzieren kannst:

```bash
cd xhubioTable/<package>
npx vitest run tests/<test>.test.ts
# oder
npm run build
# oder
npm run test
```

Wenn du den Fehler nicht reproduzieren kannst:
- Sind die Voraussetzungen korrekt? (Dependencies installiert, etc.)
- Ist es ein Flaky Test? (Mehrfach ausfuehren)
- Ist es umgebungsabhaengig?

### 2.3 Hypothesen bilden

Liste moegliche Ursachen auf:

| # | Hypothese | Wahrscheinlichkeit | Wie testen |
|---|-----------|-------------------|------------|
| 1 | ... | Hoch/Mittel/Niedrig | ... |
| 2 | ... | Hoch/Mittel/Niedrig | ... |
| 3 | ... | Hoch/Mittel/Niedrig | ... |

**Beginne mit der wahrscheinlichsten Hypothese.**

### 2.4 Hypothese testen

Teste die Hypothese mit dem kleinsten moeglichen Experiment:

- Einen Log-Output einfuegen
- Einen Breakpoint setzen
- Einen Wert in der Test-Fixture aendern
- Eine Bedingung invertieren

**NICHT**: Einfach Code aendern und hoffen dass es hilft.

### 2.5 Root Cause identifizieren

Wenn die Hypothese bestaetigt wird:
- Warum tritt diese Ursache auf?
- Ist es ein Code-Fehler, ein Design-Fehler, oder ein Verstaendnis-Fehler?
- Gibt es weitere Stellen im Code die denselben Fehler haben?

Fuer detaillierte Root-Cause-Analyse: Siehe `root-cause-tracing.md`

### 2.6 Fix implementieren

Der Fix soll:
- Die Ursache beheben, nicht das Symptom
- Minimal sein (keine unnoetige Aenderungen)
- Durch einen Test abgesichert sein

```
1. Test schreiben der den Bug reproduziert (Red)
2. Fix implementieren (Green)
3. Alle existierenden Tests ausfuehren (keine Regression)
```

### 2.7 Verifizieren

```bash
cd xhubioTable/<package>
npm run test
```

Alle Tests gruen? Gut. Bug ist gefixt.

## 3. Haeufige Fehlerquellen in diesem Projekt

| Bereich | Typische Ursache | Wo suchen |
|---------|-----------------|-----------|
| TypeScript-Fehler | Interface-Aenderung nicht propagiert | Package-Abhaengigkeiten pruefen |
| Build-Fehler | Fehlende Dependency | `package.json`, `npm install` |
| Import-Fehler | Falscher Pfad oder fehlendes Export | `src/index.ts` (Exports), `tsconfig.json` |
| Test-Fehler | Fixture veraltet oder falscher Mock | `tests/fixtures/`, Test-Setup |
| Runtime-Fehler | Null/Undefined nicht behandelt | TypeScript strict pruefen |
| XLSX-Parser-Fehler | Spalten/Zeilen-Index falsch | Importer und Parser pruefen |

## 4. Debugging-Tools

### 4.1 TypeScript Compiler

```bash
npx tsc --noEmit  # Nur Type-Checking, kein Output
```

### 4.2 Vitest im Watch-Modus

```bash
npx vitest watch tests/<test>.test.ts  # Automatisch bei Aenderungen
```

### 4.3 Vitest mit Logging

```bash
npx vitest run tests/<test>.test.ts --reporter=verbose
```

### 4.4 Node Debugger

```bash
npm run debug  # Build mit sourcemaps + jest/vitest mit --inspect-brk
```

## 5. Eskalation

Wenn du nach 3 Hypothesen-Zyklen die Ursache nicht gefunden hast:

1. **Zusammenfassen**: Was weisst du? Was hast du versucht?
2. **User einbeziehen**: Beschreibe das Problem und bitte um Input
3. **Scope erweitern**: Vielleicht liegt die Ursache in einem anderen Package
4. **Defense-in-Depth pruefen**: Siehe `defense-in-depth.md`

## 6. Anti-Patterns beim Debugging

- **Shotgun Debugging**: Vieles gleichzeitig aendern und hoffen
- **Symptom-Behandlung**: Fehlermeldung unterdruecken statt Ursache fixen
- **Copy-Paste-Fix**: StackOverflow-Loesung einfuegen ohne zu verstehen
- **Grosse Aenderungen**: Halben Code umschreiben statt den Bug zu finden
- **Blame Game**: "Das Package ist kaputt" statt die Ursache im eigenen Code zu suchen

## 7. Regeln

- **Hypothese vor Aenderung**: Immer erst verstehen, dann aendern
- **Ein Fix pro Bug**: Nicht mehrere Bugs gleichzeitig fixen
- **Test fuer jeden Fix**: Jeder Bug-Fix bekommt einen Regressionstest
- **Aufschreiben**: Bei komplexen Bugs die Analyse dokumentieren
- **Monorepo-Kontext**: Fehler koennen in anderen Packages verursacht werden
