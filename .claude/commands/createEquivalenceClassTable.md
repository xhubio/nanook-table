# /createEquivalenceClassTable

Erstellt eine Nanook Decision Table (Equivalenzklassentabelle) als formatierte Excel-Datei fuer ein gegebenes Testobjekt.

## Verwendung

```
/createEquivalenceClassTable <Page-Name, API-Endpunkt oder Formular-Beschreibung>
```

## Was passiert

1. Liest den `create-equivalence-class-table` Skill (`.claude/skills/create-equivalence-class-table/SKILL.md`)
2. Analysiert das Testobjekt (Felder, Validierungen, Feldgruppen)
3. Definiert EqClasses pro Feld nach gaengigen Mustern
4. Plant Testfaelle mit CASCADE fuer 100% Coverage
5. Erzeugt ein TypeScript-Script das die Excel-Datei generiert
6. Verifiziert: Excel erzeugen, Coverage pruefen, Fixtures generieren

## Beispiele

```
/createEquivalenceClassTable Invoice Create Page
/createEquivalenceClassTable Customer Registration Form
/createEquivalenceClassTable POST /api/v1/orders
```

## Ergebnis

- TypeScript-Script in `scripts/create-<name>-table.ts`
- Excel-Datei in `resources/<name>-tests.xlsx`
- Formatiert mit Farben, Formeln, CASCADE-Markern
- 100% Coverage pro Sheet

## Naechste Schritte

Nach der Erstellung:
1. Excel in Spreadsheet-App oeffnen und Marker/Coverage pruefen
2. Generate-Script anpassen/erstellen falls noetig
3. `npx tsx scripts/generate-<name>-fixtures.ts` um Fixtures zu erzeugen

---

**Skill-Referenz**: Fuehre den Skill `create-equivalence-class-table` aus mit dem angegebenen Testobjekt als Kontext.
