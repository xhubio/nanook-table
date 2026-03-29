# Defense in Depth

Strategien um Bugs von vornherein zu verhindern und schneller zu finden.
Ergaenzung zum `systematic-debugging` Skill.

## 1. Praeventive Massnahmen

### 1.1 TypeScript Strict Mode voll ausnutzen

Das Projekt hat `strict: true` aktiviert — nutze es:

- `strict: true` — Grundlage fuer alles
- `noUnusedLocals` — Tote Variablen frueh erkennen
- `noUnusedParameters` — Ungenutzte Parameter aufdecken
- `noImplicitReturns` — Alle Code-Pfade muessen returnen
- `noFallthroughCasesInSwitch` — Switch-Cases brauchen break/return

### 1.2 Exhaustive Checks

Nutze TypeScript's Type-System fuer erschoepfende Pruefungen:

```typescript
type Status = 'active' | 'inactive' | 'pending'

function handleStatus(status: Status): string {
  switch (status) {
    case 'active':
      return 'Aktiv'
    case 'inactive':
      return 'Inaktiv'
    case 'pending':
      return 'Ausstehend'
    default: {
      // Compile-Error wenn ein Status vergessen wird
      const _exhaustive: never = status
      throw new Error(`Unknown status: ${status}`)
    }
  }
}
```

### 1.3 Null-Safety

```typescript
// Statt optional chaining mit stillem Fallthrough:
const name = user?.name  // Stille null-Propagation

// Besser: Explizit behandeln:
if (!user) {
  throw new Error('User not found')
}
const name = user.name
```

## 2. Defensive Programmierung an Systemgrenzen

### 2.1 Was sind Systemgrenzen?

Stellen wo Daten von "aussen" kommen:
- XLSX-Dateien (Benutzer-Input, koennen beliebige Strukturen haben)
- Datei-System (Dateien koennen fehlen)
- Externe APIs (koennen Fehler zurueckgeben)
- Serialisierte Daten (JSON, koennen veraltet oder fehlerhaft sein)

### 2.2 Validierung an Grenzen, Vertrauen intern

```typescript
// An der Grenze: Validieren (z.B. XLSX-Import)
function importCell(sheet: string, col: number, row: number): CellValue {
  const raw = importer.getCell(sheet, col, row)
  return validateCellValue(raw)  // Validierung hier
}

// Intern: Nicht nochmal validieren
function processTestcase(testcase: ValidatedTestcase): TestData {
  // Kein erneutes Pruefen — der Typ garantiert Korrektheit
  return generateData(testcase.fields)
}
```

### 2.3 Wo NICHT defensiv sein

Innerhalb eines Packages muss nicht jede Funktion ihre Inputs validieren.
TypeScript's Typ-System gibt hier die Garantie.

```typescript
// NICHT: Defensive Programmierung intern
function add(a: number, b: number): number {
  if (typeof a !== 'number') throw new Error('a must be number')  // Unnoetig!
  return a + b
}

// STATT: TypeScript vertrauen
function add(a: number, b: number): number {
  return a + b  // TypeScript stellt sicher dass a und b number sind
}
```

## 3. Fehlerbehandlungs-Strategien

### 3.1 Fail Fast

Bei unerwarteten Zustaenden sofort abbrechen statt weiter zu machen:

```typescript
function getTestcase(id: string): TestcaseDefinition {
  const tc = table.getTestcase(id)
  if (!tc) {
    throw new Error(`Testcase ${id} not found`)  // Sofort abbrechen
  }
  return tc
}
```

### 3.2 Fehler-Propagierung

Fehler durch die Aufrufkette nach oben propagieren lassen:

```typescript
// Gut: Fehler propagieren
async function processTable(path: string): Promise<TestData[]> {
  const importer = await loadXlsx(path)   // Wirft wenn Datei fehlt
  const model = await parseTable(importer) // Wirft wenn Format falsch
  return generateData(model)
}

// Schlecht: Fehler verschlucken
async function processTable(path: string): Promise<TestData[] | null> {
  try {
    const importer = await loadXlsx(path)
    const model = await parseTable(importer)
    return generateData(model)
  } catch {
    return null  // Fehler verschluckt — Aufrufer weiss nicht was schiefging
  }
}
```

## 4. Checkliste fuer robusteren Code

- [ ] TypeScript strict Mode Checks alle eingehalten
- [ ] Exhaustive Checks fuer Union Types
- [ ] Validierung an Systemgrenzen (XLSX-Import, Datei-System)
- [ ] Fehler propagieren statt verschlucken
- [ ] Tests fuer Fehlerfaelle (nicht nur Happy Path)
- [ ] Null-Handling explizit (nicht mit ?. verschleiern)
