import { WaterStatus } from './waterAnalysis';

export type PoolType = 'enterree' | 'horssol' | 'spa';
export type FilterType = 'sable' | 'verre' | 'cartouche' | 'diatomees';
export type Sanitizer = 'chlore' | 'sel' | 'brome' | 'oxygene';
export type Analyzer = 'bandelette' | 'photometre' | 'gouttes' | 'sonde';

export interface PoolProfile {
  volumeM3: number;
  poolType: PoolType;
  filterType: FilterType;
  sanitizer: Sanitizer;
  analyzer: Analyzer;
}

export const POOL_TYPE_LABELS: Record<PoolType, string> = {
  enterree: 'Enterrée',
  horssol: 'Hors-sol',
  spa: 'Spa',
};

export const FILTER_LABELS: Record<FilterType, string> = {
  sable: 'Filtre à sable',
  verre: 'Filtre à verre',
  cartouche: 'Filtre à cartouche',
  diatomees: 'Filtre à diatomées',
};

export const SANITIZER_LABELS: Record<Sanitizer, string> = {
  chlore: 'Chlore',
  sel: 'Électrolyse au sel',
  brome: 'Brome',
  oxygene: 'Oxygène actif',
};

export const ANALYZER_LABELS: Record<Analyzer, string> = {
  bandelette: 'Bandelettes',
  photometre: 'Photomètre',
  gouttes: 'Trousse à gouttes',
  sonde: 'Sonde connectée',
};

export interface Measurements {
  ph?: number;
  /** Chlore libre en ppm */
  chlorine?: number;
  /** Brome en ppm */
  bromine?: number;
  /** TAC en ppm */
  alkalinity?: number;
  /** TH en ppm */
  hardness?: number;
  /** Stabilisant (acide cyanurique) en ppm */
  cya?: number;
  /** Sel en g/L */
  salt?: number;
}

/** Plages idéales, dépendantes du mode de désinfection. */
export function idealRanges(sanitizer: Sanitizer) {
  return {
    // À l'électrolyse, le pH dérive vers le haut : on vise plus bas
    ph: (sanitizer === 'sel' ? [7.0, 7.4] : sanitizer === 'chlore' ? [7.2, 7.6] : [7.0, 7.6]) as [number, number],
    chlorine: [1, 3] as [number, number],
    bromine: [2, 4] as [number, number],
    alkalinity: [80, 120] as [number, number],
    hardness: [150, 400] as [number, number],
    cya: [30, 50] as [number, number],
    salt: [3.5, 5] as [number, number],
  };
}

export interface PlanStep {
  /** 1 = à faire en premier. Les étapes sont déjà triées dans le plan. */
  priority: number;
  title: string;
  detail: string;
  /** Produit de la boutique correspondant, le cas échéant */
  productId?: string;
  /** Consigne d'attente avant l'étape suivante */
  wait?: string;
}

export interface ActionPlan {
  status: 'ok' | 'warning' | 'danger';
  headline: string;
  steps: PlanStep[];
  notes: string[];
}

function fmtNum(value: number, decimals = 1): string {
  return value.toFixed(decimals).replace('.', ',');
}

function fmtMass(grams: number): string {
  if (grams >= 1000) return `${fmtNum(grams / 1000)} kg`;
  return `${Math.max(10, Math.round(grams / 10) * 10)} g`;
}

function fmtLiters(liters: number): string {
  if (liters < 1) return `${Math.max(50, Math.round((liters * 1000) / 50) * 50)} mL`;
  return `${fmtNum(liters)} L`;
}

const WAIT_RETEST = 'Filtration en marche 4 – 6 h, puis re-testez avant l’étape suivante.';

/**
 * Construit un plan d'action priorisé à partir des mesures, du profil du bassin
 * et éventuellement de l'aspect de l'eau (analyse photo).
 *
 * Ordre chimique appliqué : stabilisant bloquant → TAC → pH → désinfectant →
 * rattrapage (algues / clarification) → confort (TH, sel…).
 */
export function buildActionPlan(
  m: Measurements,
  profile: PoolProfile | null,
  appearance?: WaterStatus
): ActionPlan {
  const sanitizer = profile?.sanitizer ?? 'chlore';
  const vol = profile?.volumeM3 ?? 0;
  const ranges = idealRanges(sanitizer);
  const steps: PlanStep[] = [];
  const notes: string[] = [];
  let danger = false;

  const dose = (computed: string, generic: string) => (vol > 0 ? computed : generic);

  // ── 1. Stabilisant trop haut : bloque le chlore, tout le reste est inutile avant
  if ((sanitizer === 'chlore' || sanitizer === 'sel') && m.cya !== undefined && m.cya > 70) {
    danger = true;
    steps.push({
      priority: 1,
      title: 'Renouveler une partie de l’eau (stabilisant trop élevé)',
      detail: `À ${m.cya} ppm de stabilisant, le chlore est « bloqué » et inefficace. Videz puis remplacez environ un tiers du bassin${vol > 0 ? ` (~${fmtNum(vol / 3, 0)} m³)` : ''}, seul moyen de faire baisser le stabilisant.`,
      wait: 'Re-testez le stabilisant après renouvellement.',
    });
  }

  // ── 2. TAC : socle de la stabilité du pH
  if (m.alkalinity !== undefined) {
    const [tacMin, tacMax] = ranges.alkalinity;
    if (m.alkalinity < tacMin) {
      const grams = ((100 - m.alkalinity) / 10) * 18 * vol;
      steps.push({
        priority: 2,
        title: 'Remonter l’alcalinité (TAC) en premier',
        detail: dose(
          `TAC à ${m.alkalinity} ppm : le pH est instable. Ajoutez ≈ ${fmtMass(grams)} de TAC+ (objectif 100 ppm), dilué devant les refoulements.`,
          `TAC à ${m.alkalinity} ppm : le pH est instable. Ajoutez du TAC+ pour viser 100 ppm (≈ 18 g/m³ pour +10 ppm).`
        ),
        productId: 'tac-plus',
        wait: WAIT_RETEST,
      });
    } else if (m.alkalinity > 150) {
      steps.push({
        priority: 2,
        title: 'Abaisser l’alcalinité (TAC)',
        detail: `TAC à ${m.alkalinity} ppm : le pH devient difficile à corriger. Ajoutez du pH- par petites doses réparties sur plusieurs jours, filtration en marche.`,
        productId: 'ph-moins',
        wait: WAIT_RETEST,
      });
    }
  }

  // ── 3. pH : conditionne l'efficacité du désinfectant
  if (m.ph !== undefined) {
    const [phMin, phMax] = ranges.ph;
    const target = (phMin + phMax) / 2;
    if (m.ph < phMin) {
      const grams = (target - m.ph) * 100 * vol;
      steps.push({
        priority: 3,
        title: `Remonter le pH à ${fmtNum(target)}`,
        detail: dose(
          `pH à ${fmtNum(m.ph)} (eau corrosive, désinfectant surconsommé). Ajoutez ≈ ${fmtMass(grams)} de pH+.`,
          `pH à ${fmtNum(m.ph)} : ajoutez du pH+ (≈ 10 g/m³ pour +0,1).`
        ),
        productId: 'ph-plus',
        wait: WAIT_RETEST,
      });
    } else if (m.ph > phMax) {
      const grams = (m.ph - target) * 100 * vol;
      steps.push({
        priority: 3,
        title: `Abaisser le pH à ${fmtNum(target)}`,
        detail: dose(
          `pH à ${fmtNum(m.ph)} : au-dessus de ${fmtNum(phMax)}, le désinfectant perd fortement en efficacité${sanitizer === 'sel' ? ' (dérive classique avec un électrolyseur)' : ''}. Ajoutez ≈ ${fmtMass(grams)} de pH-.`,
          `pH à ${fmtNum(m.ph)} : ajoutez du pH- (≈ 10 g/m³ pour -0,1).`
        ),
        productId: 'ph-moins',
        wait: WAIT_RETEST,
      });
    }
  }

  // ── 4. Désinfectant
  const greenWater = appearance === 'verte';
  if (sanitizer === 'chlore' || sanitizer === 'sel') {
    if (greenWater || (m.chlorine !== undefined && m.chlorine < 0.5)) {
      danger = danger || greenWater || m.chlorine === 0;
      steps.push({
        priority: 4,
        title: greenWater ? 'Traitement chlore choc (eau verte)' : 'Traitement chlore choc',
        detail: dose(
          `${greenWater ? 'Algues installées' : `Chlore libre à ${m.chlorine ?? 0} ppm`} : faites un choc avec ≈ ${fmtMass(15 * vol)} de chlore choc (pH préalablement à 7,2), le soir, filtration en continu 24 h minimum.`,
          'Faites un traitement chlore choc (≈ 15 g/m³), pH préalablement à 7,2, filtration en continu 24 h.'
        ),
        productId: 'chlore-choc',
        wait: 'Baignade interdite jusqu’à retour du chlore sous 3 ppm.',
      });
      if (sanitizer === 'sel') {
        notes.push(
          'Après le choc, vérifiez la consigne de votre électrolyseur (mode boost si disponible) et la propreté de la cellule.'
        );
      }
    } else if (m.chlorine !== undefined && m.chlorine < ranges.chlorine[0]) {
      steps.push({
        priority: 4,
        title: 'Renforcer la désinfection',
        detail:
          sanitizer === 'sel'
            ? `Chlore libre à ${fmtNum(m.chlorine)} ppm : augmentez le pourcentage de production de l’électrolyseur ou la durée de filtration.`
            : `Chlore libre à ${fmtNum(m.chlorine)} ppm : ajoutez un galet de chlore lent par skimmer et vérifiez le précédent.`,
        productId: sanitizer === 'chlore' ? 'chlore-galets' : undefined,
      });
    } else if (m.chlorine !== undefined && m.chlorine > ranges.chlorine[1]) {
      steps.push({
        priority: 4,
        title: 'Laisser redescendre le chlore',
        detail:
          sanitizer === 'sel'
            ? `Chlore à ${fmtNum(m.chlorine)} ppm : réduisez la production de l’électrolyseur. Pas de baignade au-dessus de 3 ppm.`
            : `Chlore à ${fmtNum(m.chlorine)} ppm : retirez les galets du skimmer, stoppez les ajouts, laissez le soleil et la filtration faire. Pas de baignade au-dessus de 3 ppm.`,
      });
    }
  } else if (sanitizer === 'brome') {
    if (m.bromine !== undefined && m.bromine < ranges.bromine[0]) {
      steps.push({
        priority: 4,
        title: 'Renforcer le brome',
        detail: `Brome à ${fmtNum(m.bromine)} ppm : rechargez le brominateur (objectif 2 – 4 ppm). En rattrapage, un choc sans chlore (oxygène actif) réactive le brome.`,
      });
    } else if (m.bromine !== undefined && m.bromine > ranges.bromine[1]) {
      steps.push({
        priority: 4,
        title: 'Laisser redescendre le brome',
        detail: `Brome à ${fmtNum(m.bromine)} ppm : réduisez le brominateur et suspendez les ajouts.`,
      });
    }
    if (greenWater) {
      danger = true;
      steps.push({
        priority: 4,
        title: 'Choc (eau verte, bassin au brome)',
        detail: 'Faites un choc à l’oxygène actif ou au chlore choc (compatible brome), filtration en continu 24 h.',
        productId: 'chlore-choc',
      });
    }
    notes.push('Bassin au brome : n’ajoutez pas de stabilisant (CYA), il est inutile avec le brome.');
  } else {
    // Oxygène actif
    if (greenWater) {
      danger = true;
      steps.push({
        priority: 4,
        title: 'Rattrapage eau verte',
        detail:
          'L’oxygène actif est peu adapté au rattrapage : faites un chlore choc ponctuel, puis reprenez le traitement oxygène une fois l’eau claire.',
        productId: 'chlore-choc',
      });
    }
    notes.push(
      'Oxygène actif : dosage régulier selon la notice de votre produit, et surveillez d’autant plus le pH (efficace surtout entre 7,0 et 7,6).'
    );
  }

  // ── 5. Stabilisant trop bas (après désinfection : ne stabiliser que ce qui existe)
  if (sanitizer === 'chlore' && m.cya !== undefined && m.cya < ranges.cya[0]) {
    const grams = (40 - m.cya) * vol;
    steps.push({
      priority: 5,
      title: 'Protéger le chlore du soleil',
      detail: dose(
        `Stabilisant à ${m.cya} ppm : le chlore se dégrade en quelques heures au soleil. Ajoutez ≈ ${fmtMass(grams)} de stabilisant (objectif 40 ppm) ou utilisez du chlore stabilisé.`,
        `Stabilisant à ${m.cya} ppm : ajoutez du stabilisant (1 g/m³ = +1 ppm, objectif 40 ppm) ou utilisez du chlore stabilisé.`
      ),
    });
  }

  // ── 6. Aspect de l'eau : rattrapages spécifiques
  if (greenWater) {
    steps.push(
      {
        priority: 1,
        title: 'Brosser parois et fond',
        detail: 'Décollez les algues avant le choc : brossez parois, fond, ligne d’eau et recoins.',
      },
      {
        priority: 5,
        title: 'Anti-algues en complément',
        detail: dose(
          `Ajoutez ≈ ${fmtLiters(0.025 * vol)} d’anti-algues 12 h après le choc.`,
          'Ajoutez un anti-algues (≈ 0,25 L / 10 m³) 12 h après le choc.'
        ),
        productId: 'anti-algues',
      },
      clarifyStep(profile, 6),
      {
        priority: 6,
        title: 'Aspirer les dépôts',
        detail: 'Une fois l’eau éclaircie, aspirez les algues mortes au balai (position égout si possible) puis nettoyez le filtre.',
      }
    );
  } else if (appearance === 'trouble' || appearance === 'laiteuse') {
    steps.push(clarifyStep(profile, 5), {
      priority: 5,
      title: 'Prolonger la filtration',
      detail: 'Filtration 12 h/jour minimum pendant 48 h (en continu si possible), puis nettoyage du filtre.',
    });
  } else if (appearance === 'brune') {
    danger = true;
    steps.push({
      priority: 1,
      title: 'Traiter les métaux AVANT toute chloration',
      detail: dose(
        `Eau brune : métaux probables (fer, manganèse). Un choc maintenant fixerait les taches. Ajoutez ≈ ${fmtLiters(0.01 * vol)} de séquestrant métaux, filtration en continu 24 h.`,
        'Eau brune : métaux probables. Pas de chlore choc avant traitement — ajoutez un séquestrant métaux, filtration en continu 24 h.'
      ),
      productId: 'sequestrant',
      wait: 'Attendez l’éclaircissement avant de reprendre la désinfection normale.',
    });
  }

  // ── 7. Confort / long terme
  if (m.hardness !== undefined && m.hardness > ranges.hardness[1]) {
    steps.push({
      priority: 7,
      title: 'Limiter le calcaire (TH élevé)',
      detail: `TH à ${m.hardness} ppm : ajoutez un séquestrant calcaire pour éviter dépôts et eau laiteuse, et surveillez le pH de près.`,
      productId: 'sequestrant',
    });
  }
  if (sanitizer === 'sel' && m.salt !== undefined && m.salt < ranges.salt[0]) {
    const kg = (4 - m.salt) * vol;
    steps.push({
      priority: 7,
      title: 'Recharger en sel',
      detail: dose(
        `Sel à ${fmtNum(m.salt)} g/L : l’électrolyseur produit mal. Ajoutez ≈ ${fmtNum(kg, 0)} kg de sel (objectif 4 g/L), électrolyseur éteint pendant la dissolution (24 h).`,
        `Sel à ${fmtNum(m.salt)} g/L : ajoutez du sel pour atteindre la consigne de votre électrolyseur (souvent 4 – 5 g/L).`
      ),
    });
  }

  // ── Assemblage
  const ordered = [...steps].sort((a, b) => a.priority - b.priority);

  if (!profile) {
    notes.push('💡 Configurez votre piscine (volume, désinfection…) pour obtenir des dosages précis.');
  }
  if (ordered.length > 1) {
    notes.unshift(
      'Respectez l’ordre des étapes : un TAC ou un pH incorrect rend le désinfectant inefficace et gaspille les produits.'
    );
  }
  if (profile?.poolType === 'spa') {
    notes.push('Spa : volumes faibles et eau chaude — dosez précisément et re-testez plus souvent.');
  }

  const headline =
    ordered.length === 0
      ? 'Eau équilibrée — continuez l’entretien de routine 👌'
      : `${ordered.length} action${ordered.length > 1 ? 's' : ''} recommandée${ordered.length > 1 ? 's' : ''}, dans l’ordre ci-dessous`;

  return {
    status: ordered.length === 0 ? 'ok' : danger ? 'danger' : 'warning',
    headline,
    steps: ordered,
    notes,
  };
}

/** Étape de clarification adaptée au type de filtre (floculant interdit sur cartouche/diatomées). */
function clarifyStep(profile: PoolProfile | null, priority: number): PlanStep {
  const filter = profile?.filterType;
  if (filter === 'cartouche' || filter === 'diatomees') {
    return {
      priority,
      title: 'Clarifier l’eau (clarifiant liquide)',
      detail: `Votre ${FILTER_LABELS[filter].toLowerCase()} ne tolère PAS le floculant : utilisez un clarifiant liquide compatible, puis nettoyez la cartouche.`,
    };
  }
  return {
    priority,
    title: 'Clarifier l’eau (floculant)',
    detail: 'Placez une chaussette de floculant dans le skimmer pour capter les particules fines, puis contre-lavage du filtre.',
    productId: 'floculant',
  };
}
