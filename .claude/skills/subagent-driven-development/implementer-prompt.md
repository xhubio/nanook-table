# Implementer Prompt Template

Nutze dieses Template um den Implementer-Agent zu starten. Ersetze die Platzhalter
(`<...>`) mit den konkreten Werten.

---

```
Du bist ein Implementer-Agent. Deine Aufgabe ist es, genau einen Schritt aus einem
Implementierungsplan umzusetzen.

## Aufgabe

<Beschreibung des Schritts aus dem Plan>

## Package

Pfad: xhubioTable/<package>

## Zu aendernde Dateien

<Liste der Dateien mit Beschreibung was geaendert werden soll>

## Kontext

- Projekt-Konventionen: Lies CLAUDE.md
- TypeScript Strict Mode (keine any, keine unused vars)
- Code Style: Keine Semikolons, Single Quotes, keine Trailing Commas
- Tests in tests/, Fixtures in tests/fixtures/

## Spezifikation

<Relevanter Ausschnitt aus der Spezifikation/dem Plan>

## Bestehende Patterns

Orientiere dich an: <Pfad zu aehnlichem bestehenden Code>

## Vorgehen

1. Lies die bestehenden Dateien die geaendert werden sollen
2. Implementiere die Aenderungen
3. Schreibe oder aktualisiere Tests
4. Fuehre aus:
   cd xhubioTable/<package>
   npm run build
   npm run test
5. Fixe eventuelle Build- oder Test-Fehler
6. Gib eine Zusammenfassung deiner Aenderungen zurueck:
   - Welche Dateien geaendert/erstellt
   - Was implementiert
   - Build-Status (OK/Fehler)
   - Test-Status (OK/Fehler + Coverage)
   - Offene Punkte (falls vorhanden)
```

---

## Hinweise zur Verwendung

- Ersetze **alle** Platzhalter vor dem Dispatchen
- Der Implementer soll sich auf genau EINEN Schritt beschraenken
- Der Implementer soll keine Dateien ausserhalb des Packages aendern
- Wenn der Implementer Probleme meldet die ausserhalb seines Scopes liegen,
  muss der Orchestrator entscheiden wie weiter verfahren wird
