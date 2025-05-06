import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function createZScoreColormap() {
  const R: number[] = [];
  const G: number[] = [];
  const B: number[] = [];
  const A: number[] = [];
  const I: number[] = [];

  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let r, g, b;

    if (t < 0.5) {
      const blend = t * 2;
      r = g = Math.round(255 * blend);
      b = 255;
    } else {
      const blend = (t - 0.5) * 2;
      r = 255;
      g = b = Math.round(255 * (1 - blend));
    }

    R.push(r);
    G.push(g);
    B.push(b);
    A[i] = (Math.abs(t * 10 - 5) < 1.5) ? 0 : 255; //Transparent in the middle ranges
    I.push(i);   // Index
  }

  return { R, G, B, A, I };
}