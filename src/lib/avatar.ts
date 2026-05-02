const defaultAvatarColors = [
  '#f97316', // orange
  '#22c55e', // green
  '#3b82f6', // blue
  '#ec4899', // pink
  '#a855f7', // purple
  '#06b6d4', // cyan
  '#ef4444', // red
  '#78716c', // stone
];

/**
 * A simple hash function to generate a number from a string.
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
 * Prioritizes the first letter of the provided string (usually email or name).
 */
export const createAvatarSvg = (identifier: string): string => {
  const getBase64 = (svg: string) => {
    if (typeof window !== 'undefined') {
      return window.btoa(unescape(encodeURIComponent(svg)))
    }
    return Buffer.from(svg).toString('base64');
  }

  const cleanIdentifier = identifier || 'U';
  const hash = stringToHash(cleanIdentifier);
  const color = defaultAvatarColors[hash % defaultAvatarColors.length];
  const firstLetter = cleanIdentifier.charAt(0).toUpperCase();

  const svg = `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="50" fill="${color}" /><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="50" fill="white">${firstLetter}</text></svg>`;
  
  return `data:image/svg+xml;base64,${getBase64(svg)}`;
};
