#!/usr/bin/env node
/* Cartographie d'un processus : génère un diagramme Mermaid et repère les goulots d'étranglement.
   Entrée : etape, responsable, duree_min (travail), attente_min (attente avant l'étape), suite (étapes suivantes, séparées par « ; »). */
import { readFileSync, writeFileSync } from 'node:fs'
import { parseCsv, toNumber } from '../lib/csv.mjs'
import { isMain, parseArgs, usage, fail } from '../lib/cli.mjs'

const num = (v) => { const n = toNumber(v); return Number.isNaN(n) ? 0 : n }

export function analyse(records) {
  const steps = records.map((r) => ({
    nom: r.etape.trim(), qui: (r.responsable ?? '').trim(),
    travail: num(r.duree_min), attente: num(r.attente_min),
    suite: String(r.suite ?? '').split(';').map((s) => s.trim()).filter(Boolean),
  }))
  const byName = new Map(steps.map((s) => [s.nom, s]))
  if (byName.size !== steps.length) throw new Error('noms d\'étapes en double.')
  for (const s of steps) for (const n of s.suite) if (!byName.has(n)) throw new Error(`« ${s.nom} » pointe vers une étape inconnue : « ${n} ».`)

  const targets = new Set(steps.flatMap((s) => s.suite))
  const starts = steps.filter((s) => !targets.has(s.nom))
  if (!starts.length) throw new Error('aucune étape de départ (le processus ne contient que des boucles).')

  // Chemin le plus long (durée de bout en bout) ; les boucles sont refusées.
  const memo = new Map()
  const visiting = new Set()
  const longest = (s) => {
    if (memo.has(s.nom)) return memo.get(s.nom)
    if (visiting.has(s.nom)) throw new Error(`boucle détectée autour de « ${s.nom} ».`)
    visiting.add(s.nom)
    const own = s.travail + s.attente
    const best = s.suite.map((n) => longest(byName.get(n))).sort((a, b) => b.total - a.total)[0]
    visiting.delete(s.nom)
    const res = best ? { total: own + best.total, path: [s.nom, ...best.path] } : { total: own, path: [s.nom] }
    memo.set(s.nom, res)
    return res
  }
  const critical = starts.map(longest).sort((a, b) => b.total - a.total)[0]

  const travail = steps.reduce((t, s) => t + s.travail, 0)
  const attente = steps.reduce((t, s) => t + s.attente, 0)
  const passations = steps.flatMap((s) => s.suite.map((n) => [s, byName.get(n)])).filter(([a, b]) => a.qui && b.qui && a.qui !== b.qui).length
  return {
    steps, critical, travail, attente, passations,
    efficacite: travail + attente ? Math.round((travail / (travail + attente)) * 1000) / 10 : 0,
    goulots: [...steps].sort((a, b) => b.attente - a.attente).filter((s) => s.attente > 0).slice(0, 3),
  }
}

export function mermaid(steps) {
  const id = new Map(steps.map((s, i) => [s.nom, `E${i + 1}`]))
  const safe = (t) => t.replace(/"/g, "'")
  const lines = ['flowchart TD']
  for (const s of steps) lines.push(`  ${id.get(s.nom)}["${safe(s.nom)}${s.qui ? `<br/><i>${safe(s.qui)}</i>` : ''}"]`)
  for (const s of steps) for (const n of s.suite) lines.push(`  ${id.get(s.nom)} --> ${id.get(n)}`)
  return lines.join('\n')
}

if (isMain(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2), ['help'])
  usage(`
Usage : node src/process-mapper.mjs processus.csv [--out rapport.md]
Colonnes : etape, responsable, duree_min, attente_min, suite (séparées par « ; »).`, args, 1)
  let report
  try {
    const a = analyse(parseCsv(readFileSync(args._[0], 'utf8')).records)
    report = [
      '# Analyse du processus', '',
      `- Temps de travail cumulé : **${a.travail} min**`, `- Temps d'attente cumulé : **${a.attente} min**`,
      `- Efficacité (travail / total) : **${a.efficacite} %**`, `- Passations entre responsables : **${a.passations}**`,
      `- Chemin critique (${a.critical.total} min) : ${a.critical.path.join(' → ')}`, '',
      '## Principaux goulots (attente)', '',
      ...(a.goulots.length ? a.goulots.map((s) => `- ${s.nom} : ${s.attente} min d'attente`) : ['_Aucune attente déclarée._']), '',
      '## Diagramme', '', '```mermaid', mermaid(a.steps), '```', '',
    ].join('\n')
  } catch (e) { fail(e.message) }
  if (args.out) writeFileSync(args.out, report); else process.stdout.write(report)
}
