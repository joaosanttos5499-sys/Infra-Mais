
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
 * This function is isomorphic and can be used on both client and server.
 * @param name The user's name.
 * @returns A data URI string representing the SVG avatar.
 */
export const createAvatarSvg = (name: string): string => {
  const getBase64 = (svg: string) => {
    if (typeof window !== 'undefined') {
      // Client-side: use btoa. The unescape/encodeURIComponent handles Unicode.
      return window.btoa(unescape(encodeURIComponent(svg)))
    }
    // Server-side: use Buffer.
    return Buffer.from(svg).toString('base64');
  }

  if (!name) {
    // Fallback for empty name, using a neutral color
    const fallbackSvg = `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="50" fill="#a8a29e" /></svg>`; // stone-400
    return `data:image/svg+xml;base64,${getBase64(fallbackSvg)}`;
  }

  const hash = stringToHash(name);
  const color = defaultAvatarColors[hash % defaultAvatarColors.length];
  const firstLetter = name.charAt(0).toUpperCase();

  const svg = `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="50" fill="${color}" /><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-family="sans-serif" font-size="50" fill="white">${firstLetter}</text></svg>`;
  
  return `data:image/svg+xml;base64,${getBase64(svg)}`;
};
