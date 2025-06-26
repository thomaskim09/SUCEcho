// sucecho/src/lib/codename.ts

// Simple lists for generating codenames. In a real-world scenario, these would be much larger.
const ADJECTIVES = ['Brave', 'Calm', 'Eager', 'Fancy', 'Gentle', 'Happy', 'Jolly', 'Kind', 'Lively', 'Merry'];
const COLORS = ['Red', 'Green', 'Blue', 'Yellow', 'Purple', 'Orange', 'Black', 'White', 'Pink', 'Brown'];
const NOUNS = ['Tiger', 'Lion', 'Bear', 'Wolf', 'Eagle', 'Shark', 'Fox', 'Deer', 'Hawk', 'Puma'];

/**
 * Generates a consistent three-word codename from a fingerprint hash.
 * This is a simple, deterministic way to create a memorable alias.
 * @param hash The fingerprint hash string.
 * @returns A string in the format "Adjective-Color-Noun".
 */
export function generateCodename(hash: string): string {
    if (!hash) return 'Anonymous-User';

    // Create a simple numeric value from the hash to use as an index seed.
    // This is not a secure hash, just a way to get a deterministic number.
    let num = 0;
    for (let i = 0; i < hash.length; i++) {
        num += hash.charCodeAt(i);
    }

    const adjIndex = num % ADJECTIVES.length;
    const colorIndex = (num + 1) % COLORS.length; // Offset to get different words
    const nounIndex = (num + 2) % NOUNS.length;

    return `${ADJECTIVES[adjIndex]}-${COLORS[colorIndex]}-${NOUNS[nounIndex]}`;
}
