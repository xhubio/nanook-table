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
Expected Result      ← MultiRowSection (Error-Codes als Zeilen, siehe unten)
Category             ← TagSection mit "negative"/"valid" Zeilen
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

### Warum bei Fehler-TCs `a` auf der GUELTIGEN Klasse steht

Die naheliegende Lesart ist „egal, oben geht ja schon etwas schief". Sie ist
falsch herum. Der Grund ist schaerfer:

> **Die uebrigen Felder bekommen `a` auf der gueltigen Klasse, damit die
> ERWARTETE Fehlermeldung sichtbar wird und nicht von einer anderen ueberdeckt.**

Stuenden dort beliebige Werte, kaeme womoeglich der Fehler eines anderen Feldes
zuerst — der Test waere rot und pruefte trotzdem nicht, was er behauptet.

🔵 Genau das real gemessen (2026-08-15): ein Testfall erwartete eine Ablehnung
**am Feld** wegen zu langen Passworts; gekommen ist `Password too long` **vom
Server**. Beide Meldungen sind wahr, nur die zweite gehoert einer anderen
Grenze — und sie haette jede Feldmeldung verdeckt.

### `e` im Gutfall heisst „mir egal, was drinsteht" — und das ist erlaubt

(Festlegung Torsten, 2026-08-15.) Haengen an einer Seite Eigenschaften, die fuer
den Pruefgegenstand **unwichtig** sind, gehoeren im Gutfall alle ihre **gueltigen**
Klassen auf `e`. Die Deckung ist damit erfuellt, und die Tabelle sagt zugleich
etwas Wahres aus:

> **Nicht „ich habe alle Kombinationen geprueft", sondern „hier ist es mir
> erklaertermassen gleichgueltig."**

🔵 Das ist der eigentliche Gewinn: die Gleichgueltigkeit steht **geschrieben**.
Bekommt die Eigenschaft spaeter Bedeutung — ein Feld wandert in ein PDF, in einen
Export, in eine Rechnung —, sieht man an der Zeile sofort, wo man darauf
verzichtet hat, und gibt ihr eine eigene Spalte. Eine Tabelle ohne diese Marken
verschweigt die Entscheidung; man weiss spaeter nicht, ob jemand geprueft oder
vergessen hat.

🔴 **Niemals auf einer Fehlerklasse.** „Mir egal" gilt fuer zulaessige Werte. Ein
`e` auf einer Fehlerklasse behauptet, ein ungueltiger Wert fuehre trotzdem zum
guten Ergebnis.

**Zwei gemessene Randbedingungen** (2026-08-15), damit es nicht schiefgeht:

| | |
|---|---|
| **Die bevorzugte Klasse braucht ihr `x` woanders** | Oeffnet man den Happy Path selbst, verliert sie es — bei einem Feld, das ganz hinten steht, bleibt dann gar kein Testfall uebrig. Real: vier Klassen auf einen Schlag, `check-klassen` hat es gemeldet |
| **`e` erzeugt KEINE Streuung** | `e` heisst „nur, wenn kein `a` da ist" — mit einem `a` im Feld gewinnt es jedes Mal. Zwei Laeufe lieferten identische Werte. Wer wirklich variieren will, braucht ein Feld **ohne** `a`; ob die Bibliothek dann je Lauf wechselt, ist ungeprueft |

⚪ Und falls doch: ein Test, der bei jedem Lauf andere Daten nimmt, reproduziert
einen Fehlschlag nicht mehr. Streuung ist ein eigener Handel, keine Nebenwirkung
der Deckung.

### 🔴 100 % sind IMMER erreichbar — die Kaskade ist nur nicht immer der Weg dahin

Die Teleskop-Identitaet `Σ_i (n_i − 1)·Π_{j>i} n_j = C − 1` setzt voraus, dass
**jede** Klasse ausser der bevorzugten ein Fehler-Ziel ist. Nur eine Fehlerspalte
darf ihre Nachfolger auf **allen** Klassen oeffnen — sie darf das, weil oben
ohnehin schon etwas schiefgeht.

Sobald ein Feld eine **gueltige Alternative** hat (`logo: keins|png|svg`,
`measurementSystem: metric|imperial`), bricht die Rechnung: eine Gutfall-Spalte
darf nur die gueltigen Klassen oeffnen, nie die fehlerhaften — sonst behauptete
sie, ein ungueltiger Wert fuehre zum guten Ergebnis. Ihr Beitrag ist damit
kleiner als das volle Produkt, und die Summe bleibt unter 100 %.

🔴 **Daraus folgt NICHT, dass 100 % unerreichbar waeren** (Klarstellung Torsten,
2026-08-15 — ich hatte hier zuerst das Gegenteil geschrieben). Was versagt, ist
die **Abkuerzung**, nicht das Ziel. Die Deckung bleibt erreichbar, man bezahlt sie
nur mit **Spalten** statt mit einer Identitaet:

| Weg | Kosten |
|---|---|
| Kaskade | (n−1) Spalten je Feld — billig, aber nur wenn jede Alternative ein Fehler-Ziel ist |
| Feldreihenfolge | Felder mit gueltigen Alternativen nach HINTEN; steht so ein Feld zuletzt, ist Π der Nachfolger = 1 und die Gutfall-Spalte traegt wieder voll |
| Aufzaehlen | die fehlenden Kombinationen als eigene Spalten — im Grenzfall eine je Kombination. Immer moeglich, manchmal viel Arbeit |

⚪ Gemessen: `CompanyDE` steht bei 66,85 %. Das ist eine **Entscheidung ueber den
Aufwand**, keine Grenze der Methode — und sie gehoert bewusst getroffen, nicht
aus Versehen.

> 💡 **Solange nicht aufgezaehlt wird, ist die bessere Frage nicht „wie viel
> Prozent", sondern „hat jede Klasse einen eigenen Testfall".** Dafuer gibt es
> `check-klassen` — es zaehlt nur `x`, weil `a`/`e` eine Auswahl sind und keine
> Zusicherung.

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

Ungueltige EqClasses sollten immer `errorCode` und `errorMessage` haben. Diese werden im
Expected-Result-Bereich als eigene Zeilen dargestellt (siehe "Expected Result — Error-Code-Zeilen").
Gueltige Varianten (z.B. `credit_note` als alternativer Typ) haben kein `errorCode`.

### Pflicht-Textfeld (z.B. Name, Strasse)
| EqClass | Generator | Kommentar | errorCode | errorMessage |
|---------|-----------|-----------|-----------|-------------|
| valid | `gen:N:faker:person.fullName` | Gueltiger Wert | — | — |
| empty | `` | Pflichtfeld leer | `NAME_EMPTY` | Name ist Pflichtfeld |
| whitespace | `   ` | Nur Leerzeichen | `NAME_WHITESPACE` | Name darf nicht nur Leerzeichen sein |
| tooLong | `gen:N:faker:string.alpha(300)` | Ueber max. Laenge | `NAME_TOO_LONG` | Name ueberschreitet max. Laenge |

### Optionales Textfeld (z.B. Notizen, Kommentar)
| EqClass | Generator | Kommentar | errorCode |
|---------|-----------|-----------|-----------|
| valid | `gen:N:faker:lorem.paragraph` | Gueltiger Wert | — |
| empty | `` | Optional leer (valid!) | — (kein Fehler!) |

### Email-Feld
| EqClass | Generator | Kommentar | errorCode | errorMessage |
|---------|-----------|-----------|-----------|-------------|
| valid | `gen:N:faker:internet.email` | Gueltige Email | — | — |
| invalid | `not-an-email` | Falsches Format | `EMAIL_FORMAT` | Email hat falsches Format |
| empty | `` | Leer (Pflicht=Error, Optional=Valid) | `EMAIL_EMPTY` | Email ist Pflichtfeld |

### Numerisches Feld (z.B. Menge, Preis)
| EqClass | Generator | Kommentar | errorCode | errorMessage |
|---------|-----------|-----------|-----------|-------------|
| valid | `100` | Gueltiger Wert | — | — |
| zero | `0` | Nullwert (je nach Kontext) | `QTY_ZERO` | Menge darf nicht Null sein |
| negative | `-1` | Negativer Wert | `QTY_NEGATIVE` | Menge darf nicht negativ sein |
| tooHigh | `999999` | Ueber Maximum | `QTY_TOO_HIGH` | Menge ueberschreitet Maximum |

### Datumsfeld
| EqClass | Generator | Kommentar | errorCode | errorMessage |
|---------|-----------|-----------|-----------|-------------|
| valid | `2026-03-01` | Gueltiges Datum | — | — |
| empty | `` | Kein Datum | `DATE_EMPTY` | Datum ist Pflichtfeld |
| invalid | `not-a-date` | Kein gueltiges Datum | `DATE_FORMAT` | Datum hat falsches Format |
| past | `2020-01-01` | Datum in der Vergangenheit | — (oft gueltig) | — |
| future | `2030-12-31` | Datum in der Zukunft | — (oft gueltig) | — |

### Select/Dropdown (z.B. Land, Typ)
| EqClass | Generator | Kommentar | errorCode | errorMessage |
|---------|-----------|-----------|-----------|-------------|
| valid | `DE` | Gueltiger Wert | — | — |
| invalid | `UNGUELTIG` | Nicht in der Liste | `COUNTRY_INVALID` | Ungueltiger Laendercode |
| empty | `` | Keine Auswahl | `COUNTRY_EMPTY` | Laendercode ist Pflichtfeld |

### Boolean/Checkbox
| EqClass | Generator | Kommentar | errorCode |
|---------|-----------|-----------|-----------|
| true | `true` | Aktiviert | — |
| false | `false` | Deaktiviert | — |

### Hinweise zu EqClasses
- Nicht jedes Feld braucht alle Varianten — nur die **fachlich relevanten**
- Weniger EqClasses = kleinerer Kombinationsraum = leichter 100% erreichbar
- `i` (impossible) fuer logisch unmoegliche Kombinationen (z.B. UI blendet Feld aus)
- Bei Abhaengigkeiten zwischen Feldern: Pruefen ob Referenzen/Self-Refs noetig sind
- **errorCode** nur bei EqClasses die einen Fehler ausloesen, NICHT bei gueltigen Varianten
- **errorCode** sollte dem tatsaechlichen Error-Code des Systems entsprechen (z.B. API-Fehlercodes)

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

🔴 **Mindestens Version 2.1.3.** Steht die Selbstreferenz in einer Tabelle, die ihrerseits
von aussen referenziert wird (also im Normalfall jeder Datentabelle), blieb das Feld davor
**still leer** — keine Fehlermeldung, nur ein fehlender Wert. Ursache waren zwei Defekte:
eine ungepruefte Instanz beim Aufloesen und ein Ziel-Knoten, der beim Einsammeln der
Direktiven auf die aufsammelnde Tabelle umgebogen wurde. Symptom, an dem man es erkennt:
eine Testfall-Tabelle erzeugt **weniger Faelle als Spalten** (real: 3 von 7).

## Testfall-Definition

Jeder Testfall braucht:
1. **Name** (im Header) — sequentiell (`invalid_1`, `valid_1`) in Sub-Tabellen, beschreibend in Haupt-Tabellen
2. **Typ**: Happy-Path oder Fehler-TC (bestimmt Marker-Logik)
3. **Zielfeld(er)**: Welche(s) Feld(er) testet dieser TC
4. **Ziel-EqClass**: Welche EqClass wird im Zielfeld ausgewaehlt
5. **Expected Result**: Error-Code-Zeile mit `x` Marker (oder `valid`-Zeile)
6. **Category**: `negative` oder `valid` Zeile mit `x` Marker

### TC-Benennung: Sequentiell vs. Beschreibend

| Tabellen-Typ | Naming | Beispiel | Grund |
|---|---|---|---|
| **Sub-Tabelle** (Execute=F) | Sequentiell | `invalid_1`, `invalid_2`, ..., `valid_1` | Range-Referenzen `[invalid_1-N]` benoetigen fortlaufende Nummern |
| **Haupt-Tabelle** (Execute=T) | Beschreibend | `format_xrechnung`, `sellerData_invalid` | Wird nicht per Range referenziert, Lesbarkeit wichtiger |

## Datenstruktur fuer Feld-Definitionen

```typescript
interface EqClass {
  name: string          // EqClass-Name (z.B. "valid", "empty")
  generator: string     // Generator/Wert (z.B. "gen:1:faker:person.fullName")
  comment: string       // Beschreibung
  targetTcs: string[]   // Welche TCs waehlen diese EqClass als Ziel
  preferred: boolean    // Ist dies der gueltige/bevorzugte Wert?
  errorCode?: string    // Erwarteter Error-Code wenn diese EqClass einen Fehler ausloest
  errorMessage?: string // Menschenlesbare Fehlerbeschreibung fuer Expected-Result-Zeile
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

## Expected Result — Error-Code-Zeilen

Statt generischer "valid"/"error" Werte werden Error-Codes als **eigene Zeilen** dargestellt.
Das ist lesbarer, weil Error-Codes und Fehlerbeschreibungen mehr Platz haben.

### Struktur

```
Expected Result  | MultiRowSection |                        |                                        | TC1 | TC2 | ... | valid_1
                 |                 | valid                  | Daten sind gueltig, kein Fehler        |     |     |     |   x
                 |                 | NAME_EMPTY             | Name ist Pflichtfeld                    |  x  |     |     |
                 |                 | NAME_WHITESPACE        | Name darf nicht nur Leerzeichen sein    |     |  x  |     |
                 |                 | EMAIL_FORMAT           | Email hat falsches Format               |     |     |  x  |
                 |                 | valid_variant          | Gueltige Variante, kein Fehler          |     |     |     |
```

### Regeln

- **Zeile `valid`**: `x` bei allen TCs die keinen Fehler erwarten (Happy-Path)
- **Error-Code-Zeilen**: Eine Zeile pro uniquem `errorCode` aus den EqClasses
  - Spalte C: Error-Code (z.B. `NAME_EMPTY`)
  - Spalte D: Menschenlesbare Fehlerbeschreibung (`errorMessage`)
  - TC-Spalten: `x` beim TC der diesen Error ausloest
- **Zeile `valid_variant`**: `x` bei TCs deren Ziel-EqClass kein `errorCode` hat
  (z.B. `credit_note` als alternativer Rechnungstyp — gueltig, aber nicht preferred)
- Error-Codes werden aus der `errorCode`-Property der Ziel-EqClass des TCs abgeleitet
- Ein TC hat genau **eine** Error-Code-Zeile mit `x` (oder `valid`/`valid_variant`)

## Category TagSection

Statt einer einzelnen "category" Zeile mit Werten werden `negative` und `valid` als
**separate Zeilen** dargestellt, jeweils mit `x` Markern.

### Struktur

```
Category         | TagSection      |                        |                                        | TC1 | TC2 | ... | valid_1
                 |                 | negative               |                                        |  x  |  x  |  x  |
                 |                 | valid                  |                                        |     |     |     |   x
```

### Regeln

- **Header**: Spalte A = `Category`, Spalte B = `TagSection`
- **Zeile `negative`**: `x` bei allen TCs deren Ziel-EqClass ein `errorCode` hat
- **Zeile `valid`**: `x` bei Happy-Path TCs und TCs ohne `errorCode` (gueltige Varianten)
- Ein TC bekommt `x` in genau einer der beiden Zeilen

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

**Naming-Konvention Sub-Tabellen (sequentiell!):**
```
invalid_1  ← Erster Fehlerfall (error-first!)
invalid_2  ← Zweiter Fehlerfall
...
invalid_N  ← Letzter Fehlerfall
valid_1    ← Standard-Happy-Path (alle Felder gueltig)
valid_2    ← Variante (z.B. minimale Pflichtfelder)
```

**Warum sequentielle Nummern in Sub-Tabellen:**
- Range-Referenzen `[invalid_1-N]` brauchen fortlaufende Nummern
- Haupt-Tabelle referenziert `ref::SellerData::[invalid_1-17]` → expandiert zu invalid_1, invalid_2, ..., invalid_17
- Beschreibende Namen (z.B. `seller.name_empty`) wuerden Range-Referenzen unmoeglich machen
- Die Zuordnung TC-Name → getestetes Feld/EqClass ist ueber die Tabellenstruktur ersichtlich

**Naming-Konvention Haupt-Tabelle (beschreibend):**
```
format_xrechnung        ← Beschreibender Name (kein Range-Ref auf Haupt-Tabelle)
sellerData_invalid      ← Sub-Tabelle referenziert per Range
buyerData_invalid       ← Sub-Tabelle referenziert per Range
valid_1                 ← Happy-Path
```
Haupt-Tabellen werden nicht per Range referenziert, daher koennen beschreibende Namen verwendet werden.

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

## Orchestrierung: Datentabellen und Testfall-Tabellen

> Die Multi-Sheet-Strategie oben zerlegt **eine grosse Tabelle** in Teile. Daneben gibt es
> ein zweites, davon unabhaengiges Zusammenspiel: **Entitaeten** und **Ablaeufe**. Wer die
> beiden verwechselt, schreibt dieselben Feld-Definitionen in jede Tabelle neu.

### Zwei Arten von Tabelle

| | `Execute` | Was sie beschreibt | Beispiel |
|---|---|---|---|
| **Datentabelle** | `F` | eine **Entitaet**: ihre Felder und deren EqClasses | `User`, `CompanyDE` |
| **Testfall-Tabelle** | `T` | einen **Ablauf**: welche Situationen es gibt | `Registration`, `Login` |

Eine Datentabelle erzeugt von sich aus **nichts**; sie wird ausschliesslich referenziert.
Dieselbe `User`-Tabelle bedient Registrierung, Anmeldung und spaeter Kundenanlage — die
EqClasses fuer `email` stehen **einmal** auf der Welt.

🔴 **Die Tabellen muessen Blaetter EINER Mappe sein.** Referenzen loesen sich nicht ueber
Dateigrenzen auf; eine Referenz auf ein anderes File meldet
`The targetTable 'User' does not exists`. Einzeldateien pro Tabelle sind zum Bearbeiten in
Ordnung, muessen aber vor dem Generieren zusammengefuehrt werden.

### Eine Testfall-Tabelle definiert Faelle, keine Felder

Der haeufigste Anfaengerfehler (und er kostet am meisten): in die Testfall-Tabelle wieder
alle Felder schreiben. Sie enthaelt **fast keine** Feld-Definitionen. Sie benennt die
Situationen des Ablaufs und holt sich die Klassen per Referenz.

Registrierung, vollstaendig — drei Zeilen, vier Testfaelle, 100 %:

```
FieldSection "Sekundaerdaten"
  sitzung (FSS)
    abgemeldet          | <NOTHING>                   | x | x | x | x
  existierenderUser (FSS)
    nein                | <NOTHING>                   | x | x |   | x
    ja                  | ref:1:User::OK_1            |   |   | x |
FieldSection "Primaerdaten"
  benutzer (FSS)
    gueltig             | ref:1:User::OK_1            | x |   | x |
    ungueltig           | ref::User::[E_1-16]         |   | x |   | x
```

Die 16 ungueltigen Faelle stehen in **einer Zelle**. Kaeme ein 17. Fehlerfall in `User`
dazu, aendert sich hier nichts.

### Die Sekundaerdaten-Sektion *ist* der Basiszustand

Die Verallgemeinerung, die den Suite-Writer erst moeglich macht:

- **Primaerdaten** = was der Test eintippt.
- **Sekundaerdaten** = was vorher wahr sein muss — und das ist genau ein Basiszustand.

Der Writer muss ihn also nicht erraten, er liest ihn ab:

| Sekundaerdaten-Feld | Wert | Basiszustand |
|---|---|---|
| `sitzung` | `abgemeldet` | niemand angemeldet |
| `existierenderUser` | *(leer)* | nichts vorzubereiten |
| `existierenderUser` | `ref:1:User::OK_1` | Entitaet `User` per API anlegen |

🔵 Die Referenz sagt **beides**: welche Entitaet und welche Daten. Was sie **nicht** sagt,
ist das *Wie* — welcher API-Weg einen Benutzer anlegt. Das steht einmal je Entitaet im
Laeufer, nicht in der Tabelle. Eine neue Entitaet heisst eine Zeile mehr, keine Aenderung
am Generator.

### Dieselbe Instanz-Id zweimal = derselbe Datensatz

`ref:1:User::OK_1` in **zwei** Zellen desselben Testfalls liefert **einen** Benutzer, nicht
zwei — die `1` ist die Instanz-Id. Genau damit baut man „der Benutzer existiert schon":
einmal als Basiszustand anlegen, einmal als Eingabe eintippen.

Ohne Instanz-Id (`ref::User::OK_1`) entstehen zwei unabhaengige Datensaetze.

### Eine eigene Spalte fuer eine dedizierte Erwartung

Manchmal ist die Fehlermeldung der eigentliche Testgegenstand — „diese E-Mail gibt es
schon" ist etwas anderes als „ungueltige Eingabe". Dafuer lohnt eine **zusaetzliche
Spalte** statt einer Verzweigung in einer bestehenden.

Damit die Summenrechnung stimmt, bekommen die nachfolgenden Felder in dieser Spalte `x`
auf dem bevorzugten Wert und `i` auf dem Rest: `i` zaehlt fuer COUNTA, erzeugt aber nichts.
Die Spalte kostet so keine Doppelabdeckung.

⚪ Zusatzspalten, die **nicht** zur Kombinatorik gehoeren, gehoeren ans **Ende** und aus der
Summe heraus — und ihr Name sollte das zeigen.

### Zusammengesetzte Generatoren

Felder duerfen aus anderen Feldern entstehen, per Selbstreferenz im Generator-Ausdruck:

```
firstName | gen::faker:person.firstName
lastName  | gen::faker:person.lastName
name      | gen::vorlage:{firstName} {lastName}
email     | gen::mail:example.com          ← baut vorname.nachname@…, garantiert eindeutig
```

🔴 **Eine Zusicherung, die nie eingreift, ist von einer kaputten nicht zu unterscheiden.**
Im echten Lauf zog faker 19 verschiedene Namen — die Eindeutigkeits-Logik lief kein
einziges Mal. Der Test dafuer muss die Kollision **erzwingen** (feste Namen, drei Aufrufe,
drei verschiedene Ergebnisse).

### Reihenfolge beim Aufbau

1. **Datentabellen zuerst** (`Execute = F`) — die Entitaeten, die der Ablauf braucht.
2. **Registrierung vor Anmeldung.** Anmelden setzt einen Benutzer voraus; ohne
   Registrierung gibt es ihn nur ueber einen fremden Anbieter (Google/Apple), und dann
   haengt der Test am Mock statt an der Anwendung.
3. **Dann der Ablauf** als Testfall-Tabelle, die nur noch Faelle benennt.
4. Einzeldateien **zusammenfuehren**, dann generieren.

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
