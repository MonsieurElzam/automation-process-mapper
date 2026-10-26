import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, mkdtempSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { parseCsv, toDate } from '../lib/csv.mjs'

const sample = (n) => readFileSync(new URL(`../samples/${n}`, import.meta.url), 'utf8')
const mod = (n) => import(`../src/${n}.mjs`)

test('07 processus : chemin critique, efficacité, passations, Mermaid', async () => {
  const { analyse, mermaid } = await mod('process-mapper')
  const a = analyse(parseCsv(sample('processus.csv')).records)
  assert.equal(a.travail, 365)
  assert.equal(a.attente, 5160)
  assert.equal(a.critical.path[0], 'Réception de la demande')
  assert.equal(a.critical.path.at(-1), 'Livraison')
  assert.equal(a.goulots[0].nom, 'Signature client')
  assert.ok(a.passations >= 5)
  assert.match(mermaid(a.steps), /flowchart TD/)
  assert.throws(() => analyse([{ etape: 'A', suite: 'B' }]), /inconnue/)
  assert.throws(() => analyse([{ etape: 'A', suite: 'B' }, { etape: 'B', suite: 'A' }]), /départ/)
})
