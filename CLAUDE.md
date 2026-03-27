# CLAUDE.md

For full project documentation, architecture, and conventions see [AGENTS.md](./AGENTS.md).

## Quick Reference

```bash
npm run build          # tsc -p tsconfig.build.json
npm test               # format + lint + build + vitest with coverage
npm run lint           # eslint only
npm run format         # prettier only
npm run typecheck      # tsc --noEmit
npx vitest run tests/path/to/file.test.ts  # single test
```

## Critical Rules

- **No semicolons** — Prettier removes them
- **ESM**: Use `.js` extension in relative imports
- **xlsx**: `import XLSX from 'xlsx'` (default import, NOT namespace)
- **`createDefaultGeneratorRegistry()`** returns an EMPTY registry — register generators manually
- **No namespace imports** — import only what you need
- **Max 3 function parameters** (ESLint enforced)
- Versions managed by semantic-release — never edit version in package.json
