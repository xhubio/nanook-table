import fs from 'node:fs'
import path from 'node:path'
import { test, expect } from 'vitest'

// Each skill is installed on its own (npx skills add --skill …), so each folder carries its
// own copy of the scripts it uses. The copies must not drift apart.
const SKILLS_DIR = path.join(import.meta.dirname, '..', '..', 'skills')
const SHARED_SCRIPTS = ['generate-fixtures.mts']
const SKILLS = ['create-equivalence-class-table', 'generate-test-data']

test.each(SHARED_SCRIPTS)('%s is the same in every skill', (script) => {
  const [first, ...others] = SKILLS.map((skill) =>
    fs.readFileSync(path.join(SKILLS_DIR, skill, 'scripts', script), 'utf8')
  )
  for (const other of others) {
    expect(other).toBe(first)
  }
})

test.each(SKILLS)('plugin.json lists the skill %s', (skill) => {
  const plugin = JSON.parse(
    fs.readFileSync(
      path.join(SKILLS_DIR, '..', '.claude-plugin', 'plugin.json'),
      'utf8'
    )
  )
  expect(plugin.skills).toContain(`./skills/${skill}`)
})

test.each(SKILLS)('%s has the version of plugin.json', (skill) => {
  const plugin = JSON.parse(
    fs.readFileSync(
      path.join(SKILLS_DIR, '..', '.claude-plugin', 'plugin.json'),
      'utf8'
    )
  )
  const skillMd = fs.readFileSync(
    path.join(SKILLS_DIR, skill, 'SKILL.md'),
    'utf8'
  )
  expect(skillMd).toContain(`version: "${plugin.version}"`)
})
