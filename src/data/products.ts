export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  category: 'desinfection' | 'equilibre' | 'traitement' | 'accessoire';
  emoji: string;
}

export const PRODUCTS: Product[] = [
  {
    id: 'chlore-galets',
    name: 'Chlore lent — galets 250g',
    description: 'Seau 5 kg. Désinfection régulière, 1 galet/skimmer par semaine.',
    price: 39.9,
    unit: 'seau 5 kg',
    category: 'desinfection',
    emoji: '🧼',
  },
  {
    id: 'chlore-choc',
    name: 'Chlore choc — granulés',
    description: 'Seau 5 kg. Rattrapage eau verte ou désinfection rapide.',
    price: 34.9,
    unit: 'seau 5 kg',
    category: 'desinfection',
    emoji: '⚡',
  },
  {
    id: 'ph-moins',
    name: 'pH Moins — poudre',
    description: 'Sachet 5 kg. Corrige un pH trop élevé (> 7,6).',
    price: 19.9,
    unit: 'sachet 5 kg',
    category: 'equilibre',
    emoji: '📉',
  },
  {
    id: 'ph-plus',
    name: 'pH Plus — poudre',
    description: 'Sachet 5 kg. Corrige un pH trop bas (< 7,2).',
    price: 19.9,
    unit: 'sachet 5 kg',
    category: 'equilibre',
    emoji: '📈',
  },
  {
    id: 'tac-plus',
    name: 'TAC Plus — rehausseur d’alcalinité',
    description: 'Sachet 5 kg. Stabilise le pH quand le TAC est trop bas.',
    price: 22.9,
    unit: 'sachet 5 kg',
    category: 'equilibre',
    emoji: '⚖️',
  },
  {
    id: 'anti-algues',
    name: 'Anti-algues concentré',
    description: 'Bidon 5 L. Préventif et curatif contre les algues.',
    price: 24.9,
    unit: 'bidon 5 L',
    category: 'traitement',
    emoji: '🦠',
  },
  {
    id: 'floculant',
    name: 'Floculant — chaussettes',
    description: 'Boîte de 8. Clarifie une eau trouble (filtre à sable uniquement).',
    price: 16.9,
    unit: 'boîte de 8',
    category: 'traitement',
    emoji: '💧',
  },
  {
    id: 'sequestrant',
    name: 'Séquestrant métaux & calcaire',
    description: 'Bidon 1 L. Contre l’eau brune (fer) et les dépôts calcaires.',
    price: 18.9,
    unit: 'bidon 1 L',
    category: 'traitement',
    emoji: '🧲',
  },
  {
    id: 'bandelettes',
    name: 'Bandelettes de test 5-en-1',
    description: 'Flacon de 50. Chlore, pH, TAC, TH, stabilisant.',
    price: 12.9,
    unit: 'flacon de 50',
    category: 'accessoire',
    emoji: '🧪',
  },
  {
    id: 'nettoyant-ligne-eau',
    name: 'Nettoyant ligne d’eau',
    description: 'Bidon 1 L. Élimine les dépôts gras sur la ligne d’eau.',
    price: 14.9,
    unit: 'bidon 1 L',
    category: 'accessoire',
    emoji: '🧽',
  },
];

export function getProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}
