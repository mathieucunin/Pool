import * as ImageManipulator from 'expo-image-manipulator';
import jpeg from 'jpeg-js';

export interface PixelImage {
  width: number;
  height: number;
  /** RGBA, 4 octets par pixel */
  data: Uint8Array;
}

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const B64_LOOKUP: Record<string, number> = {};
for (let i = 0; i < B64_CHARS.length; i++) B64_LOOKUP[B64_CHARS[i]] = i;

function base64ToBytes(b64: string): Uint8Array {
  const clean = b64.replace(/[^A-Za-z0-9+/]/g, '');
  const len = Math.floor((clean.length * 3) / 4);
  const bytes = new Uint8Array(len);
  let p = 0;
  for (let i = 0; i + 1 < clean.length; i += 4) {
    const a = B64_LOOKUP[clean[i]];
    const b = B64_LOOKUP[clean[i + 1]];
    const c = clean[i + 2] !== undefined ? B64_LOOKUP[clean[i + 2]] : 0;
    const d = clean[i + 3] !== undefined ? B64_LOOKUP[clean[i + 3]] : 0;
    if (p < len) bytes[p++] = (a << 2) | (b >> 4);
    if (p < len && clean[i + 2] !== undefined) bytes[p++] = ((b & 15) << 4) | (c >> 2);
    if (p < len && clean[i + 3] !== undefined) bytes[p++] = ((c & 3) << 6) | d;
  }
  return bytes;
}

/**
 * Charge une photo, la réduit à `maxWidth` de large et renvoie ses pixels RGBA.
 * Le redimensionnement lisse le bruit du capteur et accélère l'analyse.
 */
export async function loadPixels(uri: string, maxWidth = 160): Promise<PixelImage> {
  const result = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: maxWidth } }], {
    compress: 0.9,
    format: ImageManipulator.SaveFormat.JPEG,
    base64: true,
  });
  if (!result.base64) throw new Error("Impossible de lire l'image");
  const decoded = jpeg.decode(base64ToBytes(result.base64), { useTArray: true });
  return { width: decoded.width, height: decoded.height, data: decoded.data };
}

/** Couleur moyenne d'un rectangle exprimé en fractions [0..1] de l'image. */
export function averageColor(img: PixelImage, x0: number, y0: number, x1: number, y1: number): Rgb {
  const px0 = Math.max(0, Math.floor(x0 * img.width));
  const py0 = Math.max(0, Math.floor(y0 * img.height));
  const px1 = Math.min(img.width, Math.ceil(x1 * img.width));
  const py1 = Math.min(img.height, Math.ceil(y1 * img.height));
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (let y = py0; y < py1; y++) {
    for (let x = px0; x < px1; x++) {
      const i = (y * img.width + x) * 4;
      r += img.data[i];
      g += img.data[i + 1];
      b += img.data[i + 2];
      n++;
    }
  }
  if (n === 0) return { r: 0, g: 0, b: 0 };
  return { r: r / n, g: g / n, b: b / n };
}

export interface Hsv {
  /** Teinte en degrés [0..360) */
  h: number;
  /** Saturation [0..1] */
  s: number;
  /** Valeur (luminosité) [0..1] */
  v: number;
}

export function rgbToHsv({ r, g, b }: Rgb): Hsv {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  if (d > 0) {
    if (max === rn) h = 60 * (((gn - bn) / d) % 6);
    else if (max === gn) h = 60 * ((bn - rn) / d + 2);
    else h = 60 * ((rn - gn) / d + 4);
  }
  if (h < 0) h += 360;
  return { h, s: max === 0 ? 0 : d / max, v: max };
}

export function rgbToCss({ r, g, b }: Rgb): string {
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

/** Distance perceptuelle approchée entre deux couleurs RGB (pondération "redmean"). */
export function colorDistance(a: Rgb, b: Rgb): number {
  const rMean = (a.r + b.r) / 2;
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return Math.sqrt(
    (2 + rMean / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rMean) / 256) * db * db
  );
}
