---
name: dispatching-parallel-agents
description: >
  Koordiniert die parallele Ausfuehrung von Sub-Agents fuer unabhaengige Aufgaben.
  Stellt sicher dass maximal 6 Agents gleichzeitig laufen und Ergebnisse korrekt
  zusammengefuehrt werden.
  Trigger: "parallel agents", "sub-agents dispatchen", "parallel ausfuehren",
  "agents parallel starten", "parallelize tasks"
version: 0.1.0
---

# Dispatching Parallel Agents — Parallele Sub-Agent-Koordination

Koordiniert die parallele Ausfuehrung von Sub-Agents (Task Tool) fuer unabhaengige
Aufgaben. Stellt sicher dass Ressourcen-Limits eingehalten und Ergebnisse korrekt
zusammengefuehrt werden.

## 1. Wann parallel ausfuehren

Parallele Ausfuehrung ist sinnvoll wenn:
- Mehrere unabhaengige Packages geaendert werden muessen
- Mehrere unabhaengige Tests ausgefuehrt werden muessen
- Recherche in mehreren Bereichen gleichzeitig noetig ist
- Build/Test von unabhaengigen Packages

Parallele Ausfuehrung ist NICHT sinnvoll wenn:
- Schritte voneinander abhaengen (Package B braucht Output von Package A)
- Alle Schritte dasselbe Package betreffen
- Die Aufgabe zu klein ist (Overhead der Parallelisierung > Zeitersparnis)

## 2. Regeln

### 2.1 Maximum 6 Sub-Agents gleichzeitig

**WICHTIG**: Niemals mehr als 6 Sub-Agents gleichzeitig starten!

Bei mehr als 6 Aufgaben: In Batches aufteilen.

```
Aufgaben: A, B, C, D, E, F, G, H, I

Batch 1: A, B, C, D, E, F  (6 parallel)
Warten auf Abschluss...
Batch 2: G, H, I            (3 parallel)
```

### 2.2 Klare Aufgaben-Beschreibung

Jeder Sub-Agent braucht eine vollstaendige Aufgabenbeschreibung:

```
Task: Implementiere <was> in <package>

Kontext:
- Package-Pfad: xhubioTable/<package>
- Zu aendernde Dateien: <liste>
- Erwartetes Ergebnis: <beschreibung>

Verifikation:
cd xhubioTable/<package>
npm run build
npm run test

Wichtig:
- Folge den Patterns in <referenz-datei>
- Keine Aenderungen ausserhalb des Packages
```

### 2.3 Ergebnis-Zusammenfuehrung

Nach Abschluss aller parallelen Agents:

1. **Ergebnisse pruefen**: Hat jeder Agent erfolgreich abgeschlossen?
2. **Konflikte erkennen**: Haben zwei Agents dieselbe Datei geaendert?
3. **Integration testen**: Funktionieren die Aenderungen zusammen?

```bash
# Nach paralleler Ausfuehrung: Gesamt-Build
cd xhubioTable/<package-1> && npm run build
cd xhubioTable/<package-2> && npm run build
```

### 2.4 Fehlerbehandlung

| Situation | Vorgehen |
|-----------|----------|
| Ein Agent schlaegt fehl | Ergebnis analysieren, manuell fixen, andere Agents laufen lassen |
| Mehrere Agents schlagen fehl | Stoppen, analysieren ob gemeinsame Ursache |
| Konflikt bei Zusammenfuehrung | Manuell aufloesen, dann Gesamt-Build |
| Agent haengt | TaskStop verwenden, Aufgabe manuell ausfuehren |

## 3. Patterns fuer haeufige Szenarien

### 3.1 Mehrere Packages updaten (z.B. nach Interface-Aenderung)

```
Schritt 1 (seriell): Interface-Package aendern + bauen (z.B. model)
Schritt 2 (parallel): Alle abhaengigen Packages anpassen
  - Agent 1: model-decision anpassen + bauen + testen
  - Agent 2: model-matrix anpassen + bauen + testen
  - Agent 3: data-generator anpassen + bauen + testen
Schritt 3 (seriell): Gesamt-Verifikation
```

### 3.2 Tests in mehreren Packages ausfuehren

```
Parallel:
  - Agent 1: cd xhubioTable/model && npm run test
  - Agent 2: cd xhubioTable/model-decision && npm run test
  - Agent 3: cd xhubioTable/processor && npm run test
```

### 3.3 Recherche in mehreren Bereichen

```
Parallel:
  - Agent 1 (Explore): Wie funktioniert das Model-System?
  - Agent 2 (Explore): Wie funktioniert der Processor?
  - Agent 3 (Explore): Wie funktioniert der File-Processor?
Zusammenfuehrung: Erkenntnisse zusammenfassen
```

## 4. Sub-Agent-Typen

| Typ | Verwendung |
|-----|------------|
| `Bash` | Build, Test, Git-Operationen |
| `Explore` | Code-Recherche, Codebase-Analyse |
| `general-purpose` | Komplexe Implementierungen, Multi-File-Aenderungen |
| `Plan` | Architektur-Analyse, Plan-Erstellung |

## 5. Anti-Patterns

- **Zu viele Agents**: Mehr als 6 gleichzeitig → Context-Overflow
- **Zu kleine Aufgaben**: Overhead der Agent-Erstellung > Zeitersparnis
- **Abhaengige Aufgaben parallel**: Fuehrt zu Race Conditions und Konflikten
- **Unklare Aufgabenbeschreibung**: Agent macht etwas anderes als erwartet
- **Keine Verifikation nach Zusammenfuehrung**: Parallele Aenderungen koennen zusammen fehlschlagen
- **Gleiche Datei von mehreren Agents**: Fuehrt zu Konflikten
