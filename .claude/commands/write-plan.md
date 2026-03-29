# /write-plan

Erstellt einen detaillierten Implementierungsplan basierend auf einem Design-Dokument oder Feature-Beschreibung.

## Verwendung

```
/write-plan <Pfad-zum-Design-Doc oder Feature-Beschreibung>
```

## Was passiert

1. Liest den `writing-plans` Skill (`.claude/skills/writing-plans/SKILL.md`)
2. Analysiert das Design-Dokument oder die Feature-Beschreibung
3. Erstellt einen ausfuehrbaren Plan mit konkreten Schritten in `REQUIREMENTS/PLAN/`

## Naechste Schritte

Nach dem Plan: `/execute-plan` um den Plan auszufuehren.

---

**Skill-Referenz**: Fuehre den Skill `writing-plans` aus mit dem angegebenen Dokument als Kontext.
