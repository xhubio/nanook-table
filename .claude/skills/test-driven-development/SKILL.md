---
name: test-driven-development
description: >
  Enforces Test-Driven Development (TDD) workflow: Red → Green → Refactor.
  Tests werden VOR der Implementierung geschrieben.
  Trigger: "tdd", "test driven", "test first", "red green refactor",
  "tests zuerst schreiben", "test-driven development"
version: 0.1.0
---

# Test-Driven Development — Tests zuerst

Enforces den TDD-Workflow: Erst den Test schreiben (Red), dann die minimale
Implementierung (Green), dann aufraeumen (Refactor). Stellt sicher dass
Code immer durch Tests abgesichert ist.

## 1. Wann verwenden

- Bei neuer Funktionalitaet (neue Funktionen, neue Module)
- Bei Bug-Fixes (erst den Bug als Test reproduzieren)
- Bei Refactorings (erst Tests sicherstellen, dann refactorn)
- Wenn ein Plan-Schritt explizit TDD vorsieht

## 2. Der TDD-Zyklus

### 2.1 Red — Test schreiben

Schreibe einen Test der fehlschlaegt:

```typescript
// tests/<feature>.test.ts
import { describe, it, expect } from 'vitest'

describe('<Feature>', () => {
  it('should <erwartetes verhalten>', () => {
    // Arrange
    const input = ...

    // Act
    const result = featureFunction(input)

    // Assert
    expect(result).toEqual(expectedOutput)
  })
})
```

Verifiziere dass der Test fehlschlaegt:

```bash
cd xhubioTable/<package>
npx vitest run tests/<feature>.test.ts
```

**Erwartung**: Test schlaegt fehl (Red).

**WICHTIG**: Wenn der Test sofort gruen ist, stimmt etwas nicht:
- Testet der Test wirklich das neue Verhalten?
- Ist die Funktion vielleicht schon implementiert?
- Ist der Test tautologisch? (Siehe `testing-anti-patterns.md`)

### 2.2 Green — Minimale Implementierung

Implementiere das Minimum das noetig ist um den Test zu bestehen:

- Keine zusaetzlichen Features
- Keine Optimierungen
- Keine Fehlerbehandlung die nicht getestet wird
- Nur genau das was der Test verlangt

Verifiziere:

```bash
npx vitest run tests/<feature>.test.ts
```

**Erwartung**: Test ist gruen (Green).

### 2.3 Refactor — Aufraeumen

Jetzt den Code aufraeumen OHNE das Verhalten zu aendern:

- Duplikate entfernen
- Bessere Namen waehlen
- Struktur verbessern
- Aber: Keine neuen Features!

Verifiziere dass alle Tests immer noch gruen sind:

```bash
npm run test
```

**Erwartung**: Alle Tests gruen, Build erfolgreich.

### 2.4 Naechster Test

Wiederhole den Zyklus fuer das naechste Verhalten.

## 3. Test-Struktur

### 3.1 Verzeichnisse

```
<package>/
├── src/           # Produktionscode
├── tests/
│   ├── fixtures/  # Test-Daten (Input-Dateien, Expected-Outputs)
│   ├── volatile/  # Waehrend Tests generierte Dateien
│   └── *.test.ts  # Test-Dateien
```

### 3.2 Test-Datei-Aufbau

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'

// Imports aus dem zu testenden Modul
import { myFunction } from '../src/myModule'

describe('myFunction', () => {
  // Happy Path
  it('should handle normal input correctly', () => {
    // ...
  })

  // Edge Cases
  it('should handle empty input', () => {
    // ...
  })

  it('should handle null/undefined', () => {
    // ...
  })

  // Error Cases
  it('should throw on invalid input', () => {
    expect(() => myFunction(invalidInput)).toThrow()
  })
})
```

### 3.3 Test-Kategorien

| Kategorie | Beschreibung | Prioritaet |
|-----------|-------------|-----------|
| Happy Path | Normaler Anwendungsfall | Hoch |
| Edge Cases | Grenzwerte, leere Inputs | Hoch |
| Error Cases | Ungueltige Inputs, Fehler | Mittel |
| Integration | Zusammenspiel mehrerer Module | Mittel |
| Performance | Grosse Datenmengen, Timeouts | Niedrig |

## 4. Coverage

Vitest mit V8 Coverage:

```bash
npm run test  # Inkludiert Coverage-Report
```

**Ziel**: Keine Coverage-Verschlechterung. Neue Features sollen angemessen
abgedeckt sein (keine 100%-Pflicht, aber kritische Pfade muessen getestet sein).

## 5. Anti-Patterns vermeiden

Lies `.claude/skills/test-driven-development/testing-anti-patterns.md` fuer
eine Liste von Test-Anti-Patterns die vermieden werden muessen.

Die wichtigsten:
- **Tautologische Tests**: Tests die immer gruen sind
- **Implementation-Testing**: Tests die sich an die Implementation koppeln
- **God Tests**: Ein Test der zu viel auf einmal testet
- **Flaky Tests**: Tests die manchmal fehlschlagen

## 6. Bug-Fix mit TDD

Bei Bug-Fixes ist TDD besonders wertvoll:

1. **Reproduce**: Schreibe einen Test der den Bug reproduziert
2. **Red**: Verifiziere dass der Test fehlschlaegt
3. **Fix**: Behebe den Bug
4. **Green**: Verifiziere dass der Test jetzt gruen ist
5. **Regression**: Der Test schuetzt vor zukuenftigen Regressionen

## 7. Regeln

- **Test-First**: Immer erst den Test, dann die Implementierung
- **Kleine Schritte**: Ein Test, eine Aenderung, verifizieren
- **Keine Implementierung ohne Test**: Jede neue Funktion braucht einen Test
- **Tests sind Dokumentation**: Tests beschreiben das erwartete Verhalten
- **Monorepo-Kontext**: Tests im jeweiligen Package-Verzeichnis ausfuehren
