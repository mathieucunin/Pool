import { averageColor, loadPixels, rgbToCss, rgbToHsv, Rgb } from './imagePixels';

export type WaterStatus = 'claire' | 'trouble' | 'laiteuse' | 'verte' | 'brune';

export interface WaterResult {
  status: WaterStatus;
  title: string;
  description: string;
  actions: string[];
  /** Couleur moyenne mesurée, pour affichage */
  swatch: string;
  severity: 'ok' | 'warning' | 'danger';
}

const DIAGNOSES: Record<WaterStatus, Omit<WaterResult, 'swatch'>> = {
  claire: {
    status: 'claire',
    title: 'Eau claire et bleue',
    description:
      "L'eau semble saine. Continuez l'entretien de routine pour la garder ainsi.",
    actions: [
      'Vérifiez le pH et le chlore avec une bandelette (2x/semaine)',
      'Faites tourner la filtration aux heures chaudes',
      "Nettoyez le panier du skimmer et la ligne d'eau",
    ],
    severity: 'ok',
  },
  trouble: {
    status: 'trouble',
    title: 'Eau trouble',
    description:
      "L'eau manque de limpidité : filtration insuffisante, fines particules en suspension ou désinfectant trop bas.",
    actions: [
      'Vérifiez et nettoyez le filtre (contre-lavage si filtre à sable)',
      'Prolongez la filtration à 12h/jour pendant 48h',
      'Contrôlez chlore et pH avec une bandelette',
      'Utilisez un floculant ou clarifiant adapté à votre filtre',
    ],
    severity: 'warning',
  },
  laiteuse: {
    status: 'laiteuse',
    title: 'Eau laiteuse / blanchâtre',
    description:
      "Aspect blanchâtre typique d'un déséquilibre calcaire, d'un pH trop haut ou d'un excès de produits.",
    actions: [
      'Mesurez le pH : visez 7,2 – 7,6 (corrigez avec pH-)',
      "Vérifiez la dureté (TH) de l'eau",
      'Filtration en continu pendant 24 – 48h',
      'Ajoutez un clarifiant si le trouble persiste',
    ],
    severity: 'warning',
  },
  verte: {
    status: 'verte',
    title: 'Eau verte — présence d’algues',
    description:
      'La couleur verte indique une prolifération d’algues, souvent après un manque de désinfectant ou une forte chaleur.',
    actions: [
      'Brossez les parois et le fond du bassin',
      'Ajustez le pH à 7,2 puis faites un traitement chlore choc',
      'Ajoutez un anti-algues',
      'Filtration en continu 24 – 72h, puis contre-lavage du filtre',
      'Passez le robot ou le balai aspirateur une fois l’eau éclaircie',
    ],
    severity: 'danger',
  },
  brune: {
    status: 'brune',
    title: 'Eau brune / rouille',
    description:
      'Teinte brune ou rouille : métaux oxydés (fer, manganèse) dans l’eau de remplissage, ou sédiments en suspension.',
    actions: [
      'Évitez le chlore choc tant que les métaux ne sont pas traités (il accentue l’oxydation)',
      'Utilisez un séquestrant métaux',
      'Filtration en continu puis floculant pour capter les particules',
      'Passez l’aspirateur en position égout pour évacuer les dépôts',
    ],
    severity: 'danger',
  },
};

function classify(rgb: Rgb): WaterStatus {
  const { h, s, v } = rgbToHsv(rgb);
  if (s < 0.13) return v > 0.65 ? 'laiteuse' : 'trouble';
  if (h >= 60 && h < 180) return 'verte';
  if (h >= 15 && h < 60) return v < 0.45 ? 'brune' : s > 0.35 ? 'brune' : 'laiteuse';
  if (h >= 180 && h <= 260) return s < 0.18 && v < 0.55 ? 'trouble' : 'claire';
  // Teintes rouges/violettes : métaux ou reflets — on signale comme eau brune
  return 'brune';
}

/**
 * Analyse la couleur de l'eau à partir d'une photo.
 * Cadrer uniquement la surface de l'eau (sans margelle ni reflets directs du soleil).
 */
export async function analyzeWater(uri: string): Promise<WaterResult> {
  const img = await loadPixels(uri, 120);
  // Zone centrale : on évite les bords où margelle/reflets parasitent la mesure
  const avg = averageColor(img, 0.25, 0.25, 0.75, 0.75);
  const status = classify(avg);
  return { ...DIAGNOSES[status], swatch: rgbToCss(avg) };
}
