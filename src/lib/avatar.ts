
'use client';

const defaultAvatarColors = [
  '#22c55e', // green
  '#3b82f6', // blue
  '#ec4899', // pink
  '#a855f7', // purple
  '#06b6d4', // cyan
  '#ef4444', // red
  '#78716c', // stone
  '#f97316', // orange
];

/**
 * A simple hash function to generate a number from a string.
 * This is used to consistently pick a color for a user's avatar based on their name.
 * @param str The input string (user's name).
 * @returns A number hash.
 */
const stringToHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
};


/**
 * Creates an SVG avatar as a Base64 data URI.
 * The avatar is a colored circle with the first letter of the user's name.
 * The color is chosen consistently based on the name.
 * @param name The user's name.
 * @returns A data URI string representing the SVG avatar.
 */
export const createAvatarSvg = (name: string): string => {
  if (!name) {
    // Fallback for empty name, using a neutral color
    const fallbackSvg = `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="50" fill="#a8a29e" /></svg>`; // stone-400
    // Use btoa for client-side base64 encoding
    const fallbackBase64 = typeof window !== 'undefined' ? window.btoa(unescape(encodeURIComponent(fallbackSvg))) : '';
    return `data:image/svg+xml;base64,${fallbackBase64}`;
  }

  const hash = stringToHash(name);
  const color = defaultAvatarColors[hash % defaultAvatarColors.length];
  const firstLetter = name.charAt(0).toUpperCase();

  const svg = `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="50" fill="${color}" /><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-family="sans-serif" font-size="50" fill="white">${firstLetter}</text></svg>`;
  
  // Use btoa for client-side base64 encoding. The unescape/encodeURIComponent handles Unicode.
  const base64 = typeof window !== 'undefined' ? window.btoa(unescape(encodeURIComponent(svg))) : '';

  return `data:image/svg+xml;base64,${base64}`;
};
