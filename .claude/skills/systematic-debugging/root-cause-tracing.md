# Root-Cause Tracing

Techniken zur Identifikation der eigentlichen Fehlerursache, wenn der Fehler nicht
offensichtlich ist.

## 1. Die 5-Whys Methode

Frage fuenfmal "Warum?" um von Symptom zur Ursache zu gelangen:

```
Symptom: Test schlaegt fehl mit "TypeError: Cannot read property 'name' of undefined"

Warum 1: Weil `testcase` undefined ist
Warum 2: Weil der Parser null zurueckgibt
Warum 3: Weil die Zelle im XLSX leer ist
Warum 4: Weil die Test-Fixture eine veraltete Spaltenstruktur hat
Warum 5: Weil nach dem Model-Refactoring die Fixtures nicht aktualisiert wurden

Root Cause: Fixtures nicht aktualisiert nach Model-Refactoring
Fix: Fixtures aktualisieren + Test fuer Fixture-Konsistenz
```

## 2. Binary Search / Bisect

Wenn unklar ist welche Aenderung den Fehler verursacht hat:

### Code-Bisect

1. Kommentiere die Haelfte des verdaechtigen Codes aus
2. Tritt der Fehler noch auf?
   - Ja → Fehler ist in der aktiven Haelfte
   - Nein → Fehler ist in der auskommentierten Haelfte
3. Wiederhole mit der relevanten Haelfte

### Git-Bisect

```bash
git bisect start
git bisect bad         # Aktueller Commit ist kaputt
git bisect good <hash> # Letzter bekannter guter Commit
# Git checkt automatisch die Mitte aus
# Teste und markiere: git bisect good / git bisect bad
```

## 3. Datenfluss-Analyse

Verfolge den Datenfluss von Input zu Output:

```
XLSX-Datei → Importer → Parser → Table-Model → Processor → Generator → Writer → Output

Wo weicht der tatsaechliche Wert vom erwarteten ab?
```

Technik:
1. Logge den Wert an jedem Uebergabepunkt
2. Finde die Stelle wo erwarteter und tatsaechlicher Wert divergieren
3. Die Ursache liegt in der Funktion VOR der Divergenz

## 4. Dependency-Chain-Analyse

In diesem Monorepo kann der Fehler in einer Dependency liegen:

```
Fehler in processor
    ↑ nutzt
model-decision (Verdacht: Aenderung verursacht Fehler in processor)
    ↑ nutzt
model (Oder: Aenderung in model propagiert durch model-decision nach processor)
```

Vorgehen:
1. Pruefe die Package-Abhaengigkeiten in den jeweiligen `package.json`
2. Baue jedes Package in der Chain einzeln: `npm run build`
3. Teste jedes Package: `npm run test`
4. Finde das erste Package in der Chain das fehlschlaegt

## 5. Zustandsanalyse

Wenn der Fehler von Zustand abhaengt:

### Fragen
- Was ist der aktuelle Zustand?
- Was sollte der Zustand sein?
- Wann wurde der Zustand zuletzt korrekt gesetzt?
- Was hat den Zustand seitdem veraendert?

### Techniken
- State vor und nach jeder Mutation loggen
- Immutable Data Structures verwenden um unerwartete Mutationen zu verhindern
- Vitest Spies um Funktionsaufrufe zu tracken

## 6. Type-System als Debugging-Tool

TypeScript's Type-System kann beim Debugging helfen:

```typescript
// Temporaer: Typ explizit annotieren um Compiler-Fehler zu provozieren
const result: ExpectedType = suspiciousFunction()
// TypeScript zeigt wo der Typ nicht passt
```

```typescript
// satisfies fuer praezisere Typ-Pruefung
const config = loadConfig() satisfies ExpectedConfig
```

## 7. Minimales Reproduktions-Beispiel

Wenn der Fehler in komplexem Code auftritt:

1. Erstelle eine minimale Test-Datei
2. Reduziere den Input auf das Minimum das den Fehler ausloest
3. Entferne alles was nicht zum Fehler beitraegt
4. Der uebrig gebliebene Code zeigt die Ursache

```typescript
// tests/volatile/debug-minimal.test.ts
import { describe, it, expect } from 'vitest'

describe('minimal reproduction', () => {
  it('reproduces the bug with minimal setup', () => {
    // Minimaler Input der den Fehler ausloest
    const input = { /* ... */ }
    const result = buggyFunction(input)
    expect(result).toEqual(expected)
  })
})
```

## 8. Checkliste fuer schwer auffindbare Bugs

- [ ] Ist es ein Timing-Problem? (async/await fehlt?)
- [ ] Ist es ein Import-Problem? (falsches Modul importiert?)
- [ ] Ist es ein Typ-Kompatibilitaets-Problem? (structural typing Ueberraschung?)
- [ ] Ist es ein Scope-Problem? (Closure ueber falsche Variable?)
- [ ] Ist es ein Reihenfolge-Problem? (Initialisierung vor Nutzung?)
- [ ] Ist es ein Caching-Problem? (Veralteter Build in dist/?)
- [ ] Ist es ein Package-Version-Problem? (`npm install` vergessen?)
