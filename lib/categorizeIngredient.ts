const CATEGORIES: { category: string; keywords: string[] }[] = [
  {
    category: 'Fruits & légumes',
    keywords: [
      'lait de coco', 'pomme de terre', 'tomate', 'oignon', 'ail', 'carotte', 'poivron',
      'courgette', 'pomme', 'citron', 'orange', 'banane', 'salade', 'épinard', 'champignon',
      'poireau', 'céleri', 'persil', 'coriandre', 'menthe', 'basilic', 'avocat', 'concombre',
      'betterave', 'navet', 'brocoli', 'chou', 'fruit', 'légume',
    ],
  },
  {
    category: 'Viandes & poissons',
    keywords: [
      'poulet', 'bœuf', 'boeuf', 'porc', 'agneau', 'dinde', 'saumon', 'thon', 'poisson',
      'viande', 'jambon', 'lardons', 'merguez', 'crevette', 'veau', 'steak',
    ],
  },
  {
    category: 'Produits laitiers & œufs',
    keywords: [
      'lait', 'beurre', 'crème', 'fromage', 'yaourt', 'œuf', 'oeuf', 'mascarpone',
      'parmesan', 'mozzarella', 'gruyère', 'emmental',
    ],
  },
  {
    category: 'Épicerie & féculents',
    keywords: [
      'farine', 'riz', 'pâtes', 'pate', 'sucre', 'levure', 'sel', 'poivre', 'huile',
      'vinaigre', 'semoule', 'pain', 'chapelure', 'miel', 'chocolat', 'cacao', 'amande',
      'noisette', 'noix', 'raisin sec',
    ],
  },
  {
    category: 'Boissons',
    keywords: ['eau', 'jus', 'vin', 'café', 'thé', 'sirop', 'soda'],
  },
  {
    category: 'Épices & condiments',
    keywords: [
      'cumin', 'paprika', 'curry', 'cannelle', 'vanille', 'muscade', 'gingembre',
      'moutarde', 'ketchup', 'mayonnaise', 'sauce soja', 'bouillon', 'épice',
    ],
  },
]

// Caractères considérés comme "lettre" en français, pour définir des frontières de mots fiables
// (le \b natif de JS ne gère pas correctement les accents).
const LETTER = 'a-zàâäéèêëïîôöùûüçA-ZÀÂÄÉÈÊËÏÎÔÖÙÛÜÇ'

function buildBoundaryPattern(keyword: string): RegExp {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+')
  return new RegExp(`(^|[^${LETTER}])${escaped}([^${LETTER}]|$)`, 'i')
}

// Trie les mots-clés du plus long/spécifique au plus court, pour matcher
// "lait de coco" avant "lait" tout court, par exemple.
const FLAT_KEYWORDS = CATEGORIES.flatMap((c) => c.keywords.map((k) => ({ keyword: k, category: c.category }))).sort(
  (a, b) => b.keyword.length - a.keyword.length
)

export function categorizeIngredient(ingredient: string): string {
  const text = ingredient.toLowerCase()
  for (const { keyword, category } of FLAT_KEYWORDS) {
    if (buildBoundaryPattern(keyword).test(text)) return category
  }
  return 'Autres'
}