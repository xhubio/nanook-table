---
name: subagent-driven-development
description: >
  Orchestriert die Entwicklung durch spezialisierte Sub-Agents mit Review-Loops.
  Implementer, Spec-Reviewer und Code-Quality-Reviewer arbeiten zusammen.
  Trigger: "subagent development", "sub-agent driven", "agent-basierte entwicklung",
  "mit sub-agents implementieren", "orchestrated development"
version: 0.1.0
---

# Subagent-Driven Development — Orchestrierte Entwicklung

Orchestriert die Entwicklung eines Features durch spezialisierte Sub-Agents mit
eingebauten Review-Loops. Drei Rollen arbeiten zusammen: Implementer, Spec-Reviewer
und Code-Quality-Reviewer.

## 1. Uebersicht

```
                    ┌─────────────┐
                    │ Orchestrator│ (Du)
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
      ┌──────────┐ ┌────────────┐ ┌──────────────┐
      │Implementer│ │Spec-Reviewer│ │Code-Quality- │
      │           │ │            │ │   Reviewer   │
      └──────────┘ └────────────┘ └──────────────┘
```

**Ablauf**:
1. Implementer setzt einen Schritt um
2. Spec-Reviewer prueft gegen die Spezifikation
3. Code-Quality-Reviewer prueft Code-Qualitaet
4. Bei Problemen: Zurueck zum Implementer
5. Bei Erfolg: Naechster Schritt

## 2. Wann verwenden

- Komplexe Features mit mehreren Dateien
- Features die strikt gegen eine Spezifikation implementiert werden muessen
- Wenn Code-Qualitaet besonders wichtig ist
- Bei neuen Packages oder grossen Refactorings

## 3. Rollen und Prompts

### 3.1 Implementer

**Sub-Agent-Typ**: `general-purpose`

Nutze das Prompt-Template aus `implementer-prompt.md` im selben Verzeichnis.

Der Implementer:
- Implementiert genau einen Schritt aus dem Plan
- Schreibt Tests zusammen mit der Implementierung
- Fuehrt `npm run build` und `npm run test` aus
- Gibt eine Zusammenfassung der Aenderungen zurueck

### 3.2 Spec-Reviewer

**Sub-Agent-Typ**: `general-purpose`

Nutze das Prompt-Template aus `spec-reviewer-prompt.md` im selben Verzeichnis.

Der Spec-Reviewer:
- Vergleicht die Implementierung mit der Spezifikation
- Prueft ob alle Anforderungen abgedeckt sind
- Identifiziert fehlende Edge Cases
- Gibt APPROVE oder REQUEST_CHANGES zurueck

### 3.3 Code-Quality-Reviewer

**Sub-Agent-Typ**: `general-purpose`

Nutze das Prompt-Template aus `code-quality-reviewer-prompt.md` im selben Verzeichnis.

Der Code-Quality-Reviewer:
- Prueft Code-Qualitaet (TypeScript strict, Patterns, Security)
- Nutzt die Regeln aus `.claude/agents/code-reviewer.md`
- Gibt APPROVE oder REQUEST_CHANGES zurueck

## 4. Workflow

### 4.1 Fuer jeden Schritt im Plan

```
1. Implementer-Agent starten
   ↓
2. Implementer meldet Ergebnis
   ↓
3. Spec-Reviewer-Agent starten (parallel mit Code-Quality-Reviewer)
   Code-Quality-Reviewer-Agent starten
   ↓
4. Beide Reviews auswerten
   ↓
5a. Beide APPROVE → Naechster Schritt
5b. REQUEST_CHANGES → Feedback an Implementer → Zurueck zu 1
```

### 4.2 Review-Loop

Maximal 3 Review-Iterations pro Schritt. Wenn nach 3 Runden noch REQUEST_CHANGES:
- Stoppen und mit dem User besprechen
- Moeglicherweise ist der Plan-Schritt zu gross oder unklar

### 4.3 Parallel vs. Seriell

- Implementer laeuft immer seriell (ein Schritt nach dem anderen)
- Spec-Reviewer und Code-Quality-Reviewer laufen parallel
- Mehrere Implementer koennen parallel laufen wenn die Schritte unabhaengig sind
  (siehe `dispatching-parallel-agents` Skill)

## 5. Orchestrator-Verantwortung

Als Orchestrator bist du verantwortlich fuer:

1. **Plan laden und verstehen**
2. **TaskList erstellen** mit allen Schritten
3. **Agents dispatchen** in der richtigen Reihenfolge
4. **Reviews auswerten** und entscheiden ob nochmal implementiert wird
5. **Fortschritt tracken** via TaskList
6. **Eskalieren** wenn ein Schritt nach 3 Iterations nicht klappt
7. **Gesamt-Verifikation** nach Abschluss aller Schritte

## 6. Regeln

- **Maximal 6 Sub-Agents gleichzeitig** (gilt fuer alle Rollen zusammen)
- **Jeder Agent bekommt vollstaendigen Kontext**: Package-Pfad, Plan-Schritt, Dateien
- **Build/Test nach jeder Implementierung**: Nicht erst am Ende
- **Monorepo-Kontext**: Commands im jeweiligen Package-Verzeichnis
- **Keine Aenderungen ausserhalb des Scopes**: Nur was im Plan steht
