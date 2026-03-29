# Testing Anti-Patterns

Haeufige Fehler beim Schreiben von Tests. Vermeide diese Patterns.

## 1. Tautologische Tests

Tests die immer gruen sind, egal was die Implementierung macht.

**Schlecht:**
```typescript
it('should return something', () => {
  const result = myFunction()
  expect(result).toBeDefined()  // Fast immer wahr
})

it('should work', () => {
  const result = myFunction(input)
  expect(result).toEqual(result)  // Immer wahr
})
```

**Gut:**
```typescript
it('should return the sum of two numbers', () => {
  const result = add(2, 3)
  expect(result).toBe(5)  // Konkrete Erwartung
})
```

## 2. Implementation-Testing

Tests die sich an interne Implementierungsdetails koppeln statt an Verhalten.

**Schlecht:**
```typescript
it('should call internal method', () => {
  const spy = vi.spyOn(service, '_internalMethod')
  service.doSomething()
  expect(spy).toHaveBeenCalled()  // Koppelt an Implementierung
})
```

**Gut:**
```typescript
it('should produce the expected output', () => {
  const result = service.doSomething()
  expect(result).toEqual(expectedOutput)  // Testet Verhalten
})
```

## 3. God Tests

Ein Test der zu viel auf einmal testet. Wenn er fehlschlaegt, ist unklar warum.

**Schlecht:**
```typescript
it('should handle everything correctly', () => {
  // 50 Zeilen Setup
  // 20 Zeilen Act
  // 30 Zeilen Assert mit 15 expect()
})
```

**Gut:**
```typescript
it('should parse the header', () => { /* ... */ })
it('should validate the body', () => { /* ... */ })
it('should calculate the total', () => { /* ... */ })
```

## 4. Flaky Tests

Tests die manchmal gruen und manchmal rot sind.

**Ursachen:**
- Abhaengigkeit von Systemzeit (`Date.now()`, Timestamps)
- Abhaengigkeit von Dateisystem-Reihenfolge
- Nicht-deterministische Sortierung
- Race Conditions bei async Code
- Abhaengigkeit von externen Services

**Loesung:**
- Zeiten mocken (`vi.useFakeTimers()`)
- Deterministische Sortierung erzwingen
- Async-Code korrekt mit `await` behandeln
- Externe Services mocken

## 5. Test-Duplikation

Mehrere Tests die dasselbe testen, nur mit minimal anderen Worten.

**Schlecht:**
```typescript
it('should add numbers', () => {
  expect(add(1, 2)).toBe(3)
})
it('should sum numbers', () => {
  expect(add(2, 3)).toBe(5)
})
it('should calculate addition', () => {
  expect(add(4, 5)).toBe(9)
})
```

**Gut:**
```typescript
it('should add two positive numbers', () => {
  expect(add(2, 3)).toBe(5)
})
it('should handle negative numbers', () => {
  expect(add(-1, 3)).toBe(2)
})
it('should handle zero', () => {
  expect(add(0, 5)).toBe(5)
})
```

## 6. Test-Reihenfolge-Abhaengigkeit

Tests die nur in einer bestimmten Reihenfolge funktionieren.

**Schlecht:**
```typescript
let sharedState: string

it('should create', () => {
  sharedState = create('test')  // Setzt State fuer naechsten Test
})
it('should find', () => {
  const found = find(sharedState)  // Braucht State vom vorherigen Test
})
```

**Gut:**
```typescript
it('should create', () => {
  const id = create('test')
  expect(id).toBeDefined()
})
it('should find after create', () => {
  const id = create('test')  // Eigenes Setup
  const found = find(id)
  expect(found).toBeDefined()
})
```

## 7. Fehlende Negativ-Tests

Nur Happy Path testen, keine Fehlerfaelle.

**Schlecht:**
```typescript
describe('parseTable', () => {
  it('should parse valid table', () => { /* ... */ })
  // Keine Tests fuer ungueltige Inputs
})
```

**Gut:**
```typescript
describe('parseTable', () => {
  it('should parse valid table', () => { /* ... */ })
  it('should throw on missing required field', () => { /* ... */ })
  it('should throw on invalid cell format', () => { /* ... */ })
  it('should handle empty spreadsheet', () => { /* ... */ })
})
```

## 8. Assertion-freie Tests

Tests die keine Assertions haben oder deren Assertions nichts Sinnvolles pruefen.

**Schlecht:**
```typescript
it('should not throw', () => {
  myFunction()  // Keine Assertion, nur "wirft nicht"
})
```

**Gut:**
```typescript
it('should return processed data', () => {
  const result = myFunction()
  expect(result.status).toBe('processed')
  expect(result.items).toHaveLength(3)
})
```

## 9. Snapshot-Missbrauch

Snapshots fuer alles verwenden statt fuer sinnvolle Faelle.

**Schlecht:**
```typescript
it('should work', () => {
  expect(complexFunction(input)).toMatchSnapshot()  // Was wird eigentlich getestet?
})
```

**Gut:**
Snapshots nur fuer:
- Serialisierte Outputs (XML, JSON-Dokumente)
- Komplexe Strukturen wo manuelle Assertion unpraktisch ist
- Regressionstests fuer bestehenden Output

## 10. Over-Mocking

Zu viel mocken, so dass der Test nichts Reales mehr testet.

**Schlecht:**
```typescript
it('should process', () => {
  vi.mock('../src/moduleA')
  vi.mock('../src/moduleB')
  vi.mock('../src/moduleC')
  // Alles ist gemockt — was wird eigentlich getestet?
  const result = process()
  expect(result).toBeDefined()
})
```

**Gut:**
- Nur externe Abhaengigkeiten mocken (APIs, Datenbank, Dateisystem)
- Interne Module moeglichst nicht mocken
- Wenn viel Mocking noetig ist: Ist das Design vielleicht zu stark gekoppelt?
