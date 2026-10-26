# automation-process-mapper

**Cartographie de processus** — À partir de la liste des étapes : diagramme Mermaid, chemin critique, goulots d'attente, efficacité et passations entre responsables.

> **EN** — *Process mapper.* From a list of steps: Mermaid diagram, critical path, waiting bottlenecks, efficiency and hand-offs between owners.

Node.js 18+, **aucune dépendance**, licence **MIT**. Aucune donnée n'est envoyée nulle part. Les messages affichés sont en français.

## Utilisation

```bash
node src/process-mapper.mjs processus.csv --out analyse.md
```

Des fichiers d'exemple sont fournis dans `samples/`.

Aide intégrée (`--help`) :

```text
Usage : node src/process-mapper.mjs processus.csv [--out rapport.md]
Colonnes : etape, responsable, duree_min, attente_min, suite (séparées par « ; »).
```

## Tests

```bash
npm test
```

## Limites

- Les exemples de `samples/` sont fictifs ; adaptez les en-têtes de colonnes à vos propres exports.
- Essayez d'abord sur une copie de vos données.
- Fourni tel quel, sans garantie (voir `LICENSE`).

## La série

Ce script fait partie d'une série de **scripts d'automatisation libres** (public : gestion et processus, entre autres) : [présentation, guides et archive complète](https://monsieurelzam.com/scripts) · [tous les dépôts](https://github.com/MonsieurElzam?tab=repositories&q=automation-).

---

Par [Elzam MAMAH](https://monsieurelzam.com) — business analyst, optimisation de processus. Licence MIT.
