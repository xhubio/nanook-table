# /execute-plan

Fuehrt einen bestehenden Implementierungsplan Schritt fuer Schritt aus.

## Verwendung

```
/execute-plan <Pfad-zum-Plan>
```

## Was passiert

1. Liest den `executing-plans` Skill (`.claude/skills/executing-plans/SKILL.md`)
2. Laedt den referenzierten Plan
3. Fuehrt die Schritte einzeln aus mit Build/Test-Verifikation nach jedem Schritt

## Hinweise

- Der Plan sollte vorher mit `/write-plan` erstellt worden sein
- Jeder Schritt wird einzeln ausgefuehrt und verifiziert
- Bei Fehlern wird der aktuelle Schritt gefixt bevor zum naechsten gewechselt wird
- Commands (`npm run build`, `npm run test`) laufen im jeweiligen Package-Verzeichnis unter `xhubioTable/`

---

**Skill-Referenz**: Fuehre den Skill `executing-plans` aus mit dem angegebenen Plan als Kontext.
