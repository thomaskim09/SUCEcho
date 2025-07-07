// sucecho/src/lib/codename.ts

// Expanded lists for more unique combinations
const ADJECTIVES = [
    'Brave',
    'Calm',
    'Eager',
    'Fancy',
    'Gentle',
    'Happy',
    'Jolly',
    'Kind',
    'Lively',
    'Merry',
    'Noble',
    'Proud',
    'Quick',
    'Silly',
    'Witty',
    'Zany',
    'Clever',
    'Daring',
    'Fierce',
    'Gleeful',
    'Humble',
    'Jovial',
    'Keen',
    'Lucky',
    'Mighty',
    'Nimble',
    'Plucky',
    'Quirky',
    'Rugged',
    'Sincere',
    'Tidy',
    'Upbeat',
    'Valiant',
    'Wise',
    'Youthful',
    'Zealous',
    'Bold',
    'Charming',
    'Diligent',
    'Energetic',
    'Fearless',
    'Gracious',
    'Honest',
    'Inventive',
    'Joyful',
    'Kindly',
    'Loyal',
    'Modest',
    'Nifty',
    'Optimistic',
];
const COLORS = [
    'Red',
    'Green',
    'Blue',
    'Yellow',
    'Purple',
    'Orange',
    'Black',
    'White',
    'Pink',
    'Brown',
    'Cyan',
    'Magenta',
    'Lime',
    'Teal',
    'Indigo',
    'Violet',
    'Gold',
    'Silver',
    'Bronze',
    'Amber',
    'Beige',
    'Coral',
    'Crimson',
    'Emerald',
    'Ivory',
    'Jade',
    'Lavender',
    'Maroon',
    'Navy',
    'Olive',
    'Peach',
    'Plum',
    'Rose',
    'Ruby',
    'Sapphire',
    'Scarlet',
    'Tan',
    'Turquoise',
    'Azure',
    'Mint',
    'Charcoal',
    'Copper',
    'Denim',
    'Fuchsia',
    'Lilac',
    'Mauve',
    'Ochre',
    'Pearl',
    'Quartz',
    'Topaz',
];
const NOUNS = [
    'Tiger',
    'Lion',
    'Bear',
    'Wolf',
    'Eagle',
    'Shark',
    'Fox',
    'Deer',
    'Hawk',
    'Puma',
    'Otter',
    'Panther',
    'Rabbit',
    'Swan',
    'Turtle',
    'Viper',
    'Whale',
    'Yak',
    'Zebra',
    'Antelope',
    'Bison',
    'Cheetah',
    'Dolphin',
    'Falcon',
    'Giraffe',
    'Heron',
    'Iguana',
    'Jaguar',
    'Koala',
    'Lemur',
    'Moose',
    'Narwhal',
    'Ocelot',
    'Penguin',
    'Quokka',
    'Raccoon',
    'Salmon',
    'Tapir',
    'Urchin',
    'Vulture',
    'Walrus',
    'Xerus',
    'Yak',
    'Zebu',
    'Albatross',
    'Buffalo',
    'Crane',
    'Dingo',
    'Emu',
    'Ferret',
];

/**
 * Generates a consistent, highly unique codename from a fingerprint hash.
 * Uses different hash segments for each word and adds a numeric suffix.
 * @param hash The fingerprint hash string.
 * @returns A string in the format "Adjective-Color-Noun-1234".
 */
export function generateCodename(hash: string): string {
    if (!hash) return 'Anonymous-User';

    // Helper to get a number from a hash substring
    function hashSegmentToNum(segment: string) {
        let num = 0;
        for (let i = 0; i < segment.length; i++) {
            num = (num * 31 + segment.charCodeAt(i)) >>> 0; // unsigned int
        }
        return num;
    }

    // Use different segments of the hash for each word
    const adjIndex = hashSegmentToNum(hash.slice(0, 8)) % ADJECTIVES.length;
    const colorIndex = hashSegmentToNum(hash.slice(8, 16)) % COLORS.length;
    const nounIndex = hashSegmentToNum(hash.slice(16, 24)) % NOUNS.length;
    // Numeric suffix from the last 8 chars
    const numSuffix = (hashSegmentToNum(hash.slice(-8)) % 10000)
        .toString()
        .padStart(4, '0');

    return `${ADJECTIVES[adjIndex]}-${COLORS[colorIndex]}-${NOUNS[nounIndex]}-${numSuffix}`;
}
