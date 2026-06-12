import { averageColor, colorDistance, loadPixels, rgbToCss, Rgb } from './imagePixels';

export interface ScaleEntry {
  value: number;
  label: string;
  rgb: [number, number, number];
}

export interface StripParameter {
  key: string;
  name: string;
  unit: string;
  /** Plage idéale [min, max] */
  ideal: [number, number];
  scale: ScaleEntry[];
  adviceLow: string;
  adviceHigh: string;
}

/**
 * Référentiel approximatif d'une bandelette 5-en-1 classique (type AquaChek),
 * pads de HAUT en BAS. Les couleurs varient selon les marques : ce référentiel
 * donne une estimation, à confirmer avec l'échelle imprimée sur le flacon.
 */
export const STRIP_PARAMETERS: StripParameter[] = [
  {
    key: 'hardness',
    name: 'Dureté (TH)',
    unit: 'ppm',
    ideal: [200, 400],
    scale: [
      { value: 0, label: '0', rgb: [95, 115, 175] },
      { value: 100, label: '100', rgb: [125, 105, 165] },
      { value: 250, label: '250', rgb: [150, 90, 150] },
      { value: 500, label: '500', rgb: [170, 70, 130] },
      { value: 1000, label: '1000', rgb: [180, 50, 110] },
    ],
    adviceLow: "Eau douce : surveillez la corrosion, un produit 'calcium plus' peut être utile.",
    adviceHigh: 'Eau dure : risque de calcaire. Utilisez un séquestrant calcaire et surveillez le pH.',
  },
  {
    key: 'chlorine',
    name: 'Chlore libre',
    unit: 'ppm',
    ideal: [1, 3],
    scale: [
      { value: 0, label: '0', rgb: [250, 245, 220] },
      { value: 0.5, label: '0,5', rgb: [240, 228, 222] },
      { value: 1, label: '1', rgb: [225, 200, 218] },
      { value: 3, label: '3', rgb: [190, 140, 190] },
      { value: 5, label: '5', rgb: [150, 80, 160] },
      { value: 10, label: '10', rgb: [110, 40, 120] },
    ],
    adviceLow: 'Désinfection insuffisante : ajoutez du chlore (galets ou choc selon le niveau).',
    adviceHigh: "Trop de chlore : stoppez l'ajout, laissez filtrer, attendez avant la baignade.",
  },
  {
    key: 'ph',
    name: 'pH',
    unit: '',
    ideal: [7.2, 7.6],
    scale: [
      { value: 6.2, label: '6,2', rgb: [245, 170, 90] },
      { value: 6.8, label: '6,8', rgb: [240, 140, 80] },
      { value: 7.2, label: '7,2', rgb: [235, 110, 80] },
      { value: 7.6, label: '7,6', rgb: [220, 85, 90] },
      { value: 8.0, label: '8,0', rgb: [200, 70, 100] },
      { value: 8.4, label: '8,4', rgb: [180, 60, 110] },
    ],
    adviceLow: 'pH trop bas (eau corrosive, chlore surconsommé) : ajoutez du pH+.',
    adviceHigh: 'pH trop haut (chlore inefficace, eau trouble) : ajoutez du pH-.',
  },
  {
    key: 'alkalinity',
    name: 'Alcalinité (TAC)',
    unit: 'ppm',
    ideal: [80, 120],
    scale: [
      { value: 0, label: '0', rgb: [240, 230, 140] },
      { value: 40, label: '40', rgb: [190, 210, 130] },
      { value: 80, label: '80', rgb: [130, 190, 130] },
      { value: 120, label: '120', rgb: [90, 160, 140] },
      { value: 180, label: '180', rgb: [60, 130, 140] },
      { value: 240, label: '240', rgb: [40, 100, 140] },
    ],
    adviceLow: 'TAC bas : le pH devient instable. Ajoutez un rehausseur d’alcalinité (TAC+).',
    adviceHigh: 'TAC haut : pH difficile à baisser. Ajoutez du pH- progressivement.',
  },
  {
    key: 'cya',
    name: 'Stabilisant (CYA)',
    unit: 'ppm',
    ideal: [30, 50],
    scale: [
      { value: 0, label: '0', rgb: [235, 180, 100] },
      { value: 40, label: '30–50', rgb: [220, 140, 90] },
      { value: 100, label: '100', rgb: [200, 110, 90] },
      { value: 150, label: '150', rgb: [180, 90, 100] },
      { value: 300, label: '300', rgb: [150, 70, 110] },
    ],
    adviceLow: 'Peu de stabilisant : le chlore se dégrade vite au soleil. Ajoutez du stabilisant ou utilisez du chlore stabilisé.',
    adviceHigh: 'Trop de stabilisant : le chlore est bloqué. Renouvelez partiellement l’eau du bassin.',
  },
];

export type PadStatus = 'bas' | 'ok' | 'haut';

export interface PadResult {
  parameter: StripParameter;
  value: number;
  valueLabel: string;
  status: PadStatus;
  advice?: string;
  /** Couleur mesurée sur la photo, pour affichage */
  swatch: string;
}

export interface StripResult {
  pads: PadResult[];
  /** Nombre de paramètres hors plage idéale */
  issues: number;
}

function matchScale(measured: Rgb, parameter: StripParameter): ScaleEntry {
  let best = parameter.scale[0];
  let bestDist = Infinity;
  for (const entry of parameter.scale) {
    const dist = colorDistance(measured, { r: entry.rgb[0], g: entry.rgb[1], b: entry.rgb[2] });
    if (dist < bestDist) {
      bestDist = dist;
      best = entry;
    }
  }
  return best;
}

/** Positions verticales (fractions de la hauteur) du centre de chaque pad, de haut en bas. */
export const PAD_CENTERS = [0.14, 0.32, 0.5, 0.68, 0.86];

/**
 * Analyse une photo de bandelette tenue VERTICALEMENT, pads alignés sur le
 * guide affiché à l'écran (dureté en haut, stabilisant en bas).
 */
export async function analyzeStrip(uri: string): Promise<StripResult> {
  const img = await loadPixels(uri, 240);
  const pads: PadResult[] = STRIP_PARAMETERS.map((parameter, i) => {
    const cy = PAD_CENTERS[i];
    const measured = averageColor(img, 0.44, cy - 0.045, 0.56, cy + 0.045);
    const entry = matchScale(measured, parameter);
    const [min, max] = parameter.ideal;
    const status: PadStatus = entry.value < min ? 'bas' : entry.value > max ? 'haut' : 'ok';
    return {
      parameter,
      value: entry.value,
      valueLabel: entry.label,
      status,
      advice: status === 'bas' ? parameter.adviceLow : status === 'haut' ? parameter.adviceHigh : undefined,
      swatch: rgbToCss(measured),
    };
  });
  return { pads, issues: pads.filter((p) => p.status !== 'ok').length };
}
