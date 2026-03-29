---
name: verification-before-completion
description: >
  Systematische Abschluss-Pruefung bevor eine Aufgabe als erledigt markiert wird.
  Stellt sicher dass Build, Tests und Code-Qualitaet in Ordnung sind.
  Trigger: "verify before done", "abschluss pruefen", "verification",
  "ist alles fertig", "final check", "before completion"
version: 0.1.0
---

# Verification Before Completion — Abschluss-Pruefung

Systematische Pruefung bevor eine Aufgabe als erledigt markiert wird. Verhindert
dass unfertige oder fehlerhafte Aenderungen als abgeschlossen gelten.

## 1. Wann ausfuehren

- Nach Abschluss aller Schritte eines Plans
- Bevor ein Feature als "fertig" kommuniziert wird
- Vor einem Commit (als letzte Pruefung)
- Wenn ein Sub-Agent meldet dass er fertig ist

## 2. Pruefungs-Checkliste

### 2.1 Build-Verifikation

Fuer jedes betroffene Package:

```bash
cd xhubioTable/<package>
npm run build
```

**Erwartung**: Exit Code 0, keine Fehler, keine Warnungen.

Wenn Build fehlschlaegt:
- TypeScript-Fehler beheben
- Lint-Fehler beheben
- Format-Fehler beheben (`npm run format`)
- Erneut bauen

### 2.2 Test-Verifikation

Fuer jedes betroffene Package:

```bash
cd xhubioTable/<package>
npm run test
```

**Erwartung**: Alle Tests gruen, Coverage nicht verschlechtert.

Wenn Tests fehlschlagen:
- Test-Output analysieren
- Bug fixen oder Test anpassen
- Erneut testen

### 2.3 Dependency-Verifikation

```bash
cd xhubioTable/<package>
npm install
```

**Erwartung**: Keine neuen Warnungen.

### 2.4 Aenderungs-Verifikation

```bash
git diff --stat
git diff
```

Pruefe:
- [ ] Nur die erwarteten Dateien wurden geaendert
- [ ] Keine unbeabsichtigten Aenderungen (z.B. in anderen Packages)
- [ ] Keine Debug-Code-Reste (console.log, TODO-Kommentare die nicht beabsichtigt sind)
- [ ] Keine Secrets oder Credentials in den Aenderungen
- [ ] Keine generierten Dateien die nicht committet werden sollen

### 2.5 Abhaengige Packages

Wenn ein Package geaendert wurde das andere Packages als Dependency nutzen:

```bash
# Abhaengige Packages pruefen
cd xhubioTable/<abhaengiges-package>
npm run build
```

### 2.6 Spec-Konformitaet

Wenn ein Plan oder eine Spezifikation existiert:
- [ ] Alle Anforderungen umgesetzt
- [ ] Keine Anforderungen vergessen
- [ ] Keine ueber die Anforderungen hinausgehenden Aenderungen

## 3. Ergebnis

### Alles OK

```
Verifikation abgeschlossen:
- Build: OK (N Packages)
- Tests: OK (N Tests, X% Coverage)
- Dependencies: OK
- Aenderungen: Nur erwartete Dateien
- Spec: Alle Anforderungen abgedeckt

Bereit fuer Commit/Abschluss.
```

### Probleme gefunden

```
Verifikation fehlgeschlagen:
- Build: FEHLER in <package> — <Fehlerbeschreibung>
- Tests: 2 FEHLGESCHLAGEN in <package>
- Aenderungen: Unerwartete Aenderung in <datei>

Bitte beheben bevor als abgeschlossen markiert wird.
```

## 4. Regeln

- **Immer vollstaendig durchlaufen**: Keine Pruefung ueberspringen
- **Build vor Tests**: Tests setzen erfolgreichen Build voraus
- **Monorepo-Kontext**: Jedes Package einzeln pruefen
- **Bei Problemen fixen, nicht ignorieren**: Lieber Zeit investieren als Fehler durchlassen
- **Ehrlich berichten**: Wenn etwas nicht stimmt, klar kommunizieren
