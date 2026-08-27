const CATEGORIES: { category: string; keywords: string[] }[] = [
  {
    category: 'Fruits & légumes',
    keywords: [
      'tomate', 'oignon', 'ail', 'carotte', 'poivron', 'courgette', 'pomme', 'citron', 'orange',
      'banane', 'salade', 'épinard', 'champignon', 'poireau', 'céleri', 'persil', 'coriandre',
      'menthe', 'basilic', 'fruit', 'légume', 'avocat', 'concombre', 'betterave', 'navet',
      'patate', 'pomme de terre', 'brocoli', 'chou',
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
    keywords: ['eau', 'jus', 'lait de coco', 'vin', 'café', 'thé', 'sirop', 'soda'],
  },
  {
    category: 'Épices & condiments',
    keywords: [
      'cumin', 'paprika', 'curry', 'cannelle', 'vanille', 'muscade', 'gingembre',
      'moutarde', 'ketchup', 'mayonnaise', 'sauce soja', 'bouillon', 'épice',
    ],
  },
]

export function categorizeIngredient(ingredient: string): string {
  const text = ingredient.toLowerCase()
  for (const cat of CATEGORIES) {
    if (cat.keywords.some((k) => text.includes(k))) return cat.category
  }
  return 'Autres'
}