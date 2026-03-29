---
name: create-equivalence-class-table
description: >
  Erstellt formatierte Excel-Dateien mit Nanook Decision Tables (Entscheidungstabellen)
  fuer beliebige Test-Objekte (Pages, APIs, Formulare). Inkl. Farbformatierung, Formeln,
  korrekter Marker-Logik, CASCADE-Muster und 100% Coverage.
  Trigger: "create equivalence class table", "decision table erstellen",
  "equivalenzklassentabelle", "testdaten tabelle", "nanook table"
version: 0.1.0
---

# Nanook Decision Table erstellen

Erstellt formatierte Excel-Dateien mit Nanook Decision Tables fuer beliebige Test-Objekte
(Pages, APIs, Formulare). Inkl. Farbformatierung, Formeln, korrekter Marker-Logik und 100% Coverage.

## Technologie
- **exceljs** (nicht xlsx) — wird benoetigt fuer Cell-Styling (Fills, Fonts) und Formeln
- Nanook's `ImporterXlsx` liest die erzeugte Datei — daher muss die Struktur exakt dem ParserDecision-Format entsprechen

## Allgemeiner Workflow: Vom Testobjekt zur Decision Table

### Schritt 1: Testobjekt analysieren
- Welche Felder hat die Page/Form/API?
- Welche Felder sind Pflicht, welche optional?
- Welche Validierungsregeln gelten? (min/max, Format, Abhaengigkeiten)
- Gibt es logische Feldgruppen? (Adresse, Datum, Positionen)

### Schritt 2: Feldgruppen bilden → Tabellen-Struktur
- **< 6 Felder**: Eine einzelne Tabelle reicht
- **6-8 Felder**: Pruefen ob Aufteilung sinnvoll ist
- **> 8 Felder**: Aufteilen in Sub-Tabellen (siehe Multi-Sheet Strategie)
- Orientierung am Testobjekt: UI-Tabs, API-Objekte, fachliche Domaenen

### Schritt 3: EqClasses definieren pro Feld
- Fuer jedes Feld: Welche Equivalenzklassen gibt es? (siehe Muster unten)
- Mindestens 2 EqClasses pro Feld (valid + mind. 1 invalid/Variante)
- Namen beschreibend waehlen: "valid", "empty", "tooLong", "negative"

### Schritt 4: Testfaelle planen
- 1 Happy-Path TC (alle Felder valid)
- 1 Error-TC pro nicht-bevorzugter EqClass (fuer 100% CASCADE)
- Optional: Weitere valid-Varianten (z.B. optionale Felder leer)
- TC-Reihenfolge: **Error-TCs zuerst, Valid-TCs zuletzt** (lesbarer CASCADE)

### Schritt 5: Coverage vorausberechnen
```
total = Produkt aller EqClass-Anzahlen
Benoetigte TCs fuer 100% CASCADE = (Summe aller nicht-bevorzugten EqClasses) + 1 Happy
```

### Schritt 6: Excel erzeugen und verifizieren
- Script ausfuehren → Excel generieren
- In Spreadsheet oeffnen → Farben, Formeln, Marker pruefen
- Nanook-Generate ausfuehren → Fixtures pruefen

## Spalten-Layout (ParserDecision)

| Spalte | Inhalt |
|--------|--------|
| A (1) | Name / Feldname |
| B (2) | Section-Typ (FieldSection, FieldSubSection, ExecuteSection, ...) |
| C (3) | Equivalence-Class-Name / Anzahl (bei FieldSubSection Header) |
| D (4) | Generator / TDG |
| E (5) | Comment |
| F+ (6+) | Testfall-Spalten |

## Zeilen-Reihenfolge im Excel

```
<DECISION_TABLE>     ← Header mit TC-Namen in Spalte F+
Execute              ← ExecuteSection: T/F pro TC
NeverExecute         ← NeverExecuteSection: T/F (optional)
Multiply             ← MultiplicitySection: 1 pro TC
FieldSection         ← Gruppen-Header (z.B. "Billing Address")
  FieldSubSection    ← Feld-Header (z.B. "billingName"), C=COUNTA-Formel
    EqClass-Zeilen   ← Equivalence-Klassen mit Markern
  FieldSubSection    ← naechstes Feld
    ...
GeneratorSwitch      ← GeneratorSwitchSection (optional)
Filter               ← FilterSection (optional)
Summary              ← SummarySection mit Coverage-Formeln
Expected Result      ← MultiRowSection
Tags                 ← TagSection
<END>
```

## Alle Section-Typen (10 total)

### Immer verwendet
| Section | Typ | Zeilen | Beschreibung |
|---------|-----|--------|-------------|
| FieldSection | Multi-Row | 1+ FSS | Gruppiert Felder (z.B. "Billing Address") |
| FieldSubSection | Multi-Row | 1+ EqClass | Ein Feld mit seinen Equivalence-Klassen |
| ExecuteSection | Single-Row | 1 | T=generieren, F=nur per Referenz nutzbar |
| MultiplicitySection | Single-Row | 1 | Wie oft TC generieren (default: 1) |
| SummarySection | Single-Row | 1 | Coverage-Berechnung (max. 1 pro Tabelle) |
| MultiRowSection | Multi-Row | 1+ | Expected Results, Error Messages, Actions |
| TagSection | Multi-Row | 1+ | Labels/Tags fuer TCs (happy-path, smoke, etc.) |

### Optional / Fortgeschritten
| Section | Typ | Beschreibung |
|---------|-----|-------------|
| NeverExecuteSection | Single-Row | Gegenteil von ExecuteSection: T=nicht generieren wenn referenziert |
| FilterSection | Multi-Row | Filter-Ausdruecke fuer bedingte TC-Inklusion. Nur auf Master-TCs, nicht auf referenzierte |
| GeneratorSwitchSection | Multi-Row | Bestimmte Generatoren pro TC abschalten |

### ExecuteSection Werte
- **True**: `x`, `1`, `y`, `j`, `yes`, `ja`, `si`, `true`, `ok`, `T` (case-insensitive)
- **False**: `F` oder jeder andere Wert
- **ACHTUNG**: 'x' wird als TRUE erkannt! Fuer Sub-Tabellen immer 'F' verwenden

## Marker-System

### Marker-Typen
| Marker | Bedeutung | COUNTA | Datengenerierung |
|--------|-----------|--------|------------------|
| `x` | Ausgewaehlt (einziger Wert) | Ja | Wird verwendet |
| `a` | Bevorzugt (bei mehreren) | Ja | Wird bevorzugt gewaehlt |
| `e` | Fallback (bei mehreren) | Ja | Nur wenn kein `a` vorhanden |
| `i` | Impossible (logisch unmoeglich) | Ja | Wird NICHT verwendet |
| leer | Nicht markiert | Nein | Wird nicht verwendet |

### Marker-Regeln nach Testfall-Typ

**1. Zielfeld (das Feld das dieser TC testet):**
- NUR die Ziel-EqClass mit `x` markieren
- Alle anderen EqClasses leer lassen
- COUNTA = 1

**2. Happy-Path TC, Nicht-Zielfeld:**
- NUR die gueltige EqClass mit `x` markieren
- Keine `e` auf ungueltigen Werten (logisch falsch: "all valid" kann nicht "Invalid > 100%" abdecken)
- COUNTA = 1

**3. Fehler-TC, Nicht-Zielfeld:**
- Gueltige EqClass mit `a` markieren (wird bevorzugt gewaehlt)
- Alle anderen EqClasses mit `e` markieren (zaehlen fuer Coverage)
- COUNTA = Anzahl EqClasses → erhoehte Coverage
- Grund: Bei Fehler-TCs ist es egal was in Nicht-Zielfeldern steht, wir testen ja den Fehler

**4. Impossible (`i`):**
- Fuer logisch unmoegliche Kombinationen (z.B. UI blendet Feld aus)
- Zaehlt fuer COUNTA/Coverage aber wird nicht generiert
- Dient dazu die Tabelle auf 100% Coverage zu bringen

### Regel: Einzelner Marker = immer `x`
Wenn fuer ein Feld in einem TC nur EINE EqClass markiert ist, muss `x` verwendet werden (nicht `a`).

## Formeln (alle Werte als Excel-Formeln, keine statischen Zahlen)

### FieldSubSection Header (Spalte C)
```
=COUNTA(C_eqStart:C_eqEnd)
```
Zaehlt die EqClass-Namen → ergibt Anzahl der Equivalence-Klassen.

### FieldSubSection Header (TC-Spalten)
```
=COUNTA(F_eqStart:F_eqEnd)
```
Zaehlt die Marker pro TC → ergibt wie viele EqClasses dieser TC abdeckt.

### Summary (Spalte C) — Gesamtkombinationen
```
=C_fss1 * C_fss2 * C_fss3 * ...
```
Produkt aller FieldSubSection-C-Werte = Gesamtzahl moeglicher Kombinationen.

### Summary (TC-Spalten) — Pro-TC Coverage
```
=F_fss1 * F_fss2 * F_fss3 * ...
```
Produkt aller FieldSubSection-COUNTA-Werte fuer diesen TC.

### Summary (Spalte E) — Summe aller TC-Coverages
```
=SUM(F_summary:lastTC_summary)
```

### Summary (Spalte D) — Prozent
```
=E_summary / C_summary
```
Format: `0.00%`

## Farbformatierung

| Zeilen-Typ | Hintergrund | Schrift |
|---|---|---|
| `<DECISION_TABLE>` Header | Dunkelblau #0070C0 | Weiss, Bold |
| ExecuteSection | Blau #4472C4 | Weiss |
| MultiplicitySection | Blau #4472C4 | Weiss |
| FieldSection Header | Blau #4472C4 | Weiss |
| FieldSubSection Header | Blau #4472C4 | Weiss |
| EqClass Datenzeilen | Kein Fill | Standard |
| SummarySection | Gruen #00B050 | Weiss, Bold |
| MultiRowSection Header | Gruen #00B050 | Blau |
| MultiRowSection Daten | Kein Fill | Standard |
| TagSection Header | Blau #4472C4 | Weiss |
| TagSection Daten | Kein Fill | Standard |
| `<END>` | Blau #4472C4 | Weiss |

## TC-Spalten Formatierung
- Horizontal: center
- Vertical: middle
- Breite: 5

## Spaltenbreiten
- A (Name): 25
- B (Type): 20
- C (EqClass): 30
- D (Generator): 15 (bzw. 35 wenn kein Percent in D)
- E (Comment): 30

## EqClass-Muster fuer gaengige Feldtypen

### Pflicht-Textfeld (z.B. Name, Strasse)
| EqClass | Generator | Kommentar |
|---------|-----------|-----------|
| valid | `gen:N:faker:person.fullName` | Gueltiger Wert |
| empty | `` | Pflichtfeld leer |
| whitespace | `   ` | Nur Leerzeichen |
| tooLong | `gen:N:faker:string.alpha(300)` | Ueber max. Laenge |

### Optionales Textfeld (z.B. Notizen, Kommentar)
| EqClass | Generator | Kommentar |
|---------|-----------|-----------|
| valid | `gen:N:faker:lorem.paragraph` | Gueltiger Wert |
| empty | `` | Optional leer (valid!) |

### Email-Feld
| EqClass | Generator | Kommentar |
|---------|-----------|-----------|
| valid | `gen:N:faker:internet.email` | Gueltige Email |
| invalid | `not-an-email` | Falsches Format |
| empty | `` | Leer (Pflicht=Error, Optional=Valid) |

### Numerisches Feld (z.B. Menge, Preis)
| EqClass | Generator | Kommentar |
|---------|-----------|-----------|
| valid | `100` | Gueltiger Wert |
| zero | `0` | Nullwert (je nach Kontext valid/invalid) |
| negative | `-1` | Negativer Wert |
| tooHigh | `999999` | Ueber Maximum |

### Datumsfeld
| EqClass | Generator | Kommentar |
|---------|-----------|-----------|
| valid | `2026-03-01` | Gueltiges Datum |
| empty | `` | Kein Datum |
| past | `2020-01-01` | Datum in der Vergangenheit |
| future | `2030-12-31` | Datum in der Zukunft |

### Select/Dropdown (z.B. Land, Typ)
| EqClass | Generator | Kommentar |
|---------|-----------|-----------|
| valid | `DE` | Gueltiger Wert |
| invalid | `UNGUELTIG` | Nicht in der Liste |
| empty | `` | Keine Auswahl |

### Boolean/Checkbox
| EqClass | Generator | Kommentar |
|---------|-----------|-----------|
| true | `true` | Aktiviert |
| false | `false` | Deaktiviert |

### Hinweise zu EqClasses
- Nicht jedes Feld braucht alle Varianten — nur die **fachlich relevanten**
- Weniger EqClasses = kleinerer Kombinationsraum = leichter 100% erreichbar
- `i` (impossible) fuer logisch unmoegliche Kombinationen (z.B. UI blendet Feld aus)
- Bei Abhaengigkeiten zwischen Feldern: Pruefen ob Referenzen/Self-Refs noetig sind

## Daten in Zellen: Statisch, Generator, Referenz

### Statische Daten
Jeder Wert der NICHT mit `gen:` oder `ref:` beginnt wird direkt als Testdaten uebernommen.
```
DE              ← Wird als String "DE" verwendet
100             ← Wird als String "100" verwendet
not-an-email    ← Wird als String verwendet
```

### Generator-Syntax
```
gen:<instanceId>:<generatorName>:<parameter>
```
| Teil | Beschreibung |
|------|-------------|
| instanceId | Gruppiert zusammengehoerige Generierungen. Gleiche ID = gleiche Daten |
| generatorName | Name des registrierten Generators (z.B. "faker") |
| parameter | Generator-spezifisch (z.B. Faker-Funktion) |

**Instance-ID Reuse** — Zusammengehoerige Felder:
```
gen:1:faker:person.fullName    ← Person 1
gen:1:faker:internet.email     ← Email von Person 1 (gleiche Instanz!)
gen:2:faker:person.fullName    ← Person 2 (andere Instanz)
```

**Haeufige Faker-Funktionen:**
```
person.fullName, person.firstName, person.lastName
internet.email, internet.url
location.street, location.city, location.zipCode, location.country
lorem.paragraph, lorem.sentence, lorem.word
commerce.productName, commerce.price
string.alpha(N), string.numeric(N), string.uuid
date.recent, date.future, date.past
phone.number
```

### Self-References
Referenziert ein anderes Feld im gleichen Testfall:
```
ref:::fieldName:    ← Wert von "fieldName" im selben TC
```
Nuetzlich wenn ein Feld vom Wert eines anderen abhaengt.

## Testfall-Definition

Jeder Testfall braucht:
1. **Name** (im Header)
2. **Typ**: Happy-Path oder Fehler-TC (bestimmt Marker-Logik)
3. **Zielfeld(er)**: Welche(s) Feld(er) testet dieser TC
4. **Ziel-EqClass**: Welche EqClass wird im Zielfeld ausgewaehlt
5. **Expected Result**: Ergebnis im MultiRowSection
6. **Tags**: Kategorisierung im TagSection

## Datenstruktur fuer Feld-Definitionen

```typescript
interface EqClass {
  name: string          // EqClass-Name (z.B. "valid", "empty")
  generator: string     // Generator/Wert (z.B. "gen:1:faker:person.fullName")
  comment: string       // Beschreibung
  targetTcs: string[]   // Welche TCs waehlen diese EqClass als Ziel
  preferred: boolean    // Ist dies der gueltige/bevorzugte Wert?
}

interface FieldDef {
  name: string          // Feldname
  eqClasses: EqClass[]  // Equivalence-Klassen
  targetTcs: string[]   // Welche TCs testen dieses Feld
}

interface SectionDef {
  name: string          // Section-Name (z.B. "Billing Address")
  fields: FieldDef[]    // Felder in dieser Section
}
```

## Verifikation nach Erstellung

1. `npx tsx scripts/create-<name>-table.ts` — Excel erzeugen
2. Excel in LibreOffice/Numbers oeffnen — Farben, Formeln, Marker pruefen
3. `npx tsx scripts/generate-<name>-fixtures.ts` — Nanook parst und generiert
4. Pruefen: Korrekte Anzahl Fixtures, Daten korrekt

## Referenzen zwischen Tabellen (Nanook's Kern-Feature)

### Konzept
Eine Haupt-Tabelle kann auf Sub-Tabellen verweisen. Die Referenz steht als **Generator-Wert** in einer EqClass-Zeile (Spalte D).

### Referenz-Syntax
```
ref:InstanceId:TableName:FieldName:TestcaseName
```

**ACHTUNG:** FieldName kommt VOR TestcaseName! (Code: `parts[3]=targetFieldName, parts[4]=targetTestcaseName`)

| Teil | Pflicht | Beschreibung |
|------|---------|-------------|
| `ref` | Ja | Keyword (parts[0]) |
| InstanceId | Nein | Gruppiert zusammengehoerige Referenzen (parts[1]) |
| TableName | Nein | Ziel-Tabelle, leer = gleiche Tabelle (parts[2]) |
| FieldName | Nein | Spezifisches Feld, leer = kein Datenwert (parts[3]) |
| TestcaseName | Ja | Ziel-Testfall (parts[4]) |

### Beispiele
```
ref:1:BillingAddress:billingName:validAddress   ← Feld billingName aus validAddress in BillingAddress
ref:1:BillingAddress:street:validAddress        ← selbe Instanz, anderes Feld
ref:1:BillingAddress::validAddress              ← ohne FieldName (nur Instanz erzeugen)
ref:::password:                                  ← Self-Reference (gleiche Tabelle)
```

### Range-Referenzen
```
ref::TableName::[tc_prefix_1-N]
```
- Eckige Klammern `[prefix_1-N]` referenzieren mehrere TCs (prefix_1, prefix_2, ..., prefix_N)
- InstanceId MUSS leer sein bei Ranges (Code prueft das und loggt Error)
- Erzeugt eine Kopie des aufrufenden TCs pro referenziertem TC
- **Kartesisches Produkt**: Mehrere Range-Referenzen in einem TC multiplizieren sich!

#### Range-Parsing (Code: `processRanges`)
```
[invalid_1-7]   → invalid_1, invalid_2, ..., invalid_7
[valid_1-2]     → valid_1, valid_2
[T3-4]          → T3, T4
[a1-3,b1-2]     → a1, a2, a3, b1, b2  (Komma-separierte Ranges)
```
Regex: `/(\D*)(\d+)-(\d+)$/` — Nicht-Ziffern-Prefix + Start-Nummer + End-Nummer

### Valid/Invalid-Strategie mit Ranges

Sub-Tabellen-TCs benennen nach Schema `valid_N` und `invalid_N`.
Die Haupt-Tabelle hat dann nur 2 EqClasses pro Referenzfeld:

```
billingScenario (FieldSubSection)
  valid      | ref::BillingAddress::valid_1           | Single-Ref (1 Fixture)
  invalid    | ref::BillingAddress::[invalid_1-7]     | Range-Ref (7 Fixtures)
```

**Warum "valid" als Single-Ref, "invalid" als Range:**
- Error-TCs brauchen jede Fehlervariante → Range expandiert automatisch
- Non-Target-Felder referenzieren immer valid_1 → keine unnoetige Multiplikation
- Ergebnis: billingInvalid → 7 Fixtures, datesInvalid → 4 Fixtures, etc.
- Kartesisches Produkt bleibt klein: 1 × 1 × 9 = 9 (nicht 2 × 4 × 9 = 72)

**Naming-Konvention Sub-Tabellen:**
```
invalid_1  ← Erster Fehlerfall (error-first!)
invalid_2  ← Zweiter Fehlerfall
...
invalid_N  ← Letzter Fehlerfall
valid_1    ← Standard-Happy-Path (alle Felder gueltig)
valid_2    ← Variante (z.B. minimale Pflichtfelder)
```

### Multi-Sheet Architektur
```
<name>-tests.xlsx
├── Sheet "MainTable"        ← Haupt-Tabelle (execute=T), CASCADE, 100%
│   subTableAScenario         ← valid (single-ref) + invalid (range-ref)
│   subTableBScenario         ← valid (single-ref) + invalid (range-ref)
│   directField1, field2      ← Direkte Felder (valid/empty)
├── Sheet "SubTableA"        ← Sub-Tabelle (execute=F), CASCADE, 100%
├── Sheet "SubTableB"        ← Sub-Tabelle (execute=F), CASCADE, 100%
└── ...
```

### Wichtige Referenz-Regeln
- **ExecuteSection='F'** bei Sub-Tabellen: TCs werden nur per Referenz ausgefuehrt, keine eigenen Fixtures
- **Filter** in referenzierten TCs werden NICHT ausgefuehrt (nur im Master-TC)
- **Tags** aus referenzierten TCs werden gesammelt
- **NeverExecuteSection**: Verhindert Referenzierung von anderen TCs (Gegenteil von ExecuteSection=F!)
- **Tabellennamen** muessen ueber alle geladenen Spreadsheets eindeutig sein
- Jede Referenz-Aufloesung erzeugt eine neue Instanz des referenzierten TCs

### Tabellen aufteilen (Multi-Sheet Strategie)

#### Wann aufteilen?
- Tabelle hat mehr als 6-8 Felder → Kombinationen explodieren (z.B. 18 Felder = 25M Kombinationen)
- Feldgruppen gehoeren logisch zusammen (Adresse, Datum, Positionen)
- Verschiedene Hauptszenarien brauchen unterschiedliche Sub-Tabellen
- Coverage unter ~80% trotz korrekter Marker → Tabelle ist zu gross

#### Aufteilung orientiert sich am Testobjekt
Die Tabellenstruktur spiegelt das Testobjekt wider — nicht umgekehrt:
- **UI-Formular**: Jede logische Form-Sektion (Tab, Accordion, Wizard-Step) kann ein Sheet werden
- **API-Endpunkt**: Request-Body-Struktur bestimmt die Aufteilung (verschachtelte Objekte → Sub-Sheets)
- **Fachliche Domaene**: Bounded Contexts / Aggregate-Grenzen als natuerliche Schnittlinien
- **Wiederverwendung**: Gleiche Sub-Tabelle (z.B. Adresse) kann von verschiedenen Haupt-Tabellen referenziert werden

#### Vorgehensweise

**1. Feldgruppen identifizieren:**
Felder die fachlich zusammengehoeren in Gruppen einteilen.

**2. Jede Gruppe wird ein eigenstaendiges Sheet:**
- Eigener `<DECISION_TABLE>` Header
- Eigene Testfaelle (Happy-Path + Fehlerfaelle fuer diese Gruppe)
- Eigene Coverage-Berechnung → Ziel 100% pro Sub-Tabelle
- Kleine Kombinationszahl → einfach 100% erreichbar

**3. Haupt-Tabelle referenziert Sub-Sheets:**
- Fuer jede Feldgruppe ein FieldSubSection mit Referenz-EqClasses
- Jede EqClass verweist auf einen TC der Sub-Tabelle

**4. Beispiel Haupt-Tabelle (valid/invalid mit Ranges):**
```
<DECISION_TABLE>              | billingInvalid | datesInvalid | validAll
FieldSection "Billing"
  billingScenario (FSS)       | COUNTA
    valid                     | ref::SubA::valid_1           |   | x  | x
    invalid                   | ref::SubA::[invalid_1-7]     | x | e  |
FieldSection "Dates"
  dateScenario (FSS)          | COUNTA
    valid                     | ref::SubB::valid_1            | a | x  | x
    invalid                   | ref::SubB::[invalid_1-4]      | e |    |
```

## CASCADE-Muster fuer 100% Coverage

### Konzept
Bei der CASCADE-Technik werden `a`/`e`-Marker nur auf Felder gesetzt, die **nach** dem Zielfeld in der Feldreihenfolge kommen. Felder **vor** dem Zielfeld bekommen nur `x` auf den bevorzugten Wert (wie beim Happy-Path).

### Warum funktioniert CASCADE?
Jeder TC deckt weniger ab als der vorherige. Die Produkte bilden eine abnehmende Reihe:
```
TC1 (Feld 1):   1 × 2 × 2 × 2 × 2 = 16  (a/e auf Felder 2-5)
TC2 (Feld 2):   1 × 1 × 2 × 2 × 2 =  8  (a/e auf Felder 3-5)
TC3 (Feld 3):   1 × 1 × 1 × 2 × 2 =  4  (a/e auf Felder 4-5)
TC4 (Feld 4):   1 × 1 × 1 × 1 × 2 =  2  (a/e auf Feld 5)
TC5 (Feld 5):   1 × 1 × 1 × 1 × 1 =  1  (kein Feld danach)
TC6 (Happy):    1 × 1 × 1 × 1 × 1 =  1
                                      ──
Summe:                                32 = 2^5 = total
```

### Voraussetzung fuer exakt 100%
**Jede nicht-bevorzugte EqClass braucht einen eigenen Error-TC.**
Dann ergibt die Summe der Produkte exakt das Total.

**Spezialfall: Alle Felder haben 2 EqClasses:**
```
total = 2^n   (n = Anzahl Felder)
summe = 2^(n-1) + 2^(n-2) + ... + 2^0 + 1 = 2^n
```

**Allgemein: Felder mit unterschiedlichen EqClass-Zahlen (z.B. 3, 2, 2, 2, 3, 3):**
Funktioniert auch! Jede nicht-bevorzugte EqClass ergibt einen TC mit Produkt:
```
produkt(TC) = 1^(Felder davor) × Produkt(EqClass-Anzahlen der Felder danach)
```
Alle Produkte + Happy-Path(1) = Total.

**Beispiel BillingAddress (3x2x2x2x3x3 = 216):**
```
billingName:   empty(72) + whitespace(72)          = 144
street:        empty(36)                           =  36
postalCode:    empty(18)                           =  18
city:          empty(9)                            =   9
country:       invalid_3chars(3) + empty(3)        =   6
customerEmail: invalid(1) + empty(1)               =   2
happy:                                             =   1
                                             Summe: 216 = 100%
```

### Implementierung
Jeder Nicht-Happy TC braucht ein **Zielfeld** (das Feld das er testet). Die Felder muessen eine feste Reihenfolge haben.

**Marker-Logik pro TC:**
1. **Happy-Path TC**: Alle Felder `x` auf preferred → Produkt = 1
2. **Error/Target TC**:
   - Zielfeld: `x` auf Ziel-EqClass → COUNTA = 1
   - Felder VOR Zielfeld: `x` auf preferred → COUNTA = 1
   - Felder NACH Zielfeld: `a` auf preferred, `e` auf rest → COUNTA = n

### Wann CASCADE verwenden?
- Haupt-Tabellen mit Referenz-Feldern (valid/invalid pro Ref → 2 EqClasses)
- Sub-Tabellen mit beliebigen EqClass-Anzahlen pro Feld
- Wenn die Coverage-Summe exakt das Total treffen soll (100%)

### Wann NICHT CASCADE?
- Wenn Felder logisch zusammengehoeren und immer gemeinsam markiert werden muessen
- Wenn bewusst >100% Coverage gewuenscht ist (maximale Abdeckung)

### TC-Reihenfolge: Error-First
Fuer Menschen lesbarer: **Error-TCs zuerst, Valid-TCs zuletzt.**
Das CASCADE-Treppenmuster (a/e-Marker von links nach rechts) wird sofort sichtbar.
```
                    | inv_1 | inv_2 | inv_3 | inv_4 | valid_1
field1 valid        |       |   x   |   x   |   x   |   x
       empty        |   x   |       |       |       |
field2 valid        |   a   |       |   x   |   x   |   x
       empty        |   e   |   x   |       |       |
field3 valid        |   a   |   a   |       |   x   |   x
       empty        |   e   |   e   |   x   |       |
field4 valid        |   a   |   a   |   a   |       |   x
       empty        |   e   |   e   |   e   |   x   |
```
Die a/e-Marker bilden ein Dreieck — sofort erkennbar ob das Muster stimmt.

## Wichtige Hinweise

- `exceljs` ist 1-basiert (Spalte 1 = A, Zeile 1 = erste Zeile)
- Formeln mit `{ formula: '...' }` schreiben, NICHT als String
- Prozent-Zelle braucht `numFmt: '0.00%'`
- `row.commit()` nach Aenderungen aufrufen
- Styling wird NACH dem Schreiben der Daten angewendet (sonst ueberschreibt commit() den Style)
- Nanook's ImporterXlsx liest die Excel-Datei — die Formeln muessen nicht berechnet sein, aber die Struktur muss stimmen
- Referenz-Beispiel Script: `saas-coding-kernel/repo/tools/playwright-test-definition/scripts/create-invoice-table.ts`
