import type { MaterialDefinition } from './types';

export const MATERIAL_PRESETS: Record<string, MaterialDefinition> = {
  // Metals
  gold: {
    id: 'gold',
    name: 'Gold',
    color: '#FFD700',
    metalness: 1.0,
    roughness: 0.2,
    emissive: '#FFD700',
    emissiveIntensity: 0.3,
  },
  silver: {
    id: 'silver',
    name: 'Silver',
    color: '#E8E8E8',
    metalness: 1.0,
    roughness: 0.1,
  },
  copper: {
    id: 'copper',
    name: 'Copper',
    color: '#B87333',
    metalness: 0.95,
    roughness: 0.3,
    emissive: '#8B4513',
    emissiveIntensity: 0.1,
  },
  bronze: {
    id: 'bronze',
    name: 'Bronze',
    color: '#CD7F32',
    metalness: 0.9,
    roughness: 0.4,
  },
  iron: {
    id: 'iron',
    name: 'Iron',
    color: '#36454F',
    metalness: 0.85,
    roughness: 0.6,
  },
  rust: {
    id: 'rust',
    name: 'Rust',
    color: '#B7410E',
    metalness: 0.3,
    roughness: 0.8,
    emissive: '#8B4513',
    emissiveIntensity: 0.05,
  },

  // Stones & Concrete
  marble: {
    id: 'marble',
    name: 'Marble',
    color: '#F0F0F0',
    metalness: 0.0,
    roughness: 0.2,
  },
  limestone: {
    id: 'limestone',
    name: 'Limestone',
    color: '#D3D3D3',
    metalness: 0.0,
    roughness: 0.8,
  },
  granite: {
    id: 'granite',
    name: 'Granite',
    color: '#696969',
    metalness: 0.0,
    roughness: 0.7,
  },
  basalt: {
    id: 'basalt',
    name: 'Basalt',
    color: '#2F4F4F',
    metalness: 0.0,
    roughness: 0.85,
  },
  concrete: {
    id: 'concrete',
    name: 'Concrete',
    color: '#A9A9A9',
    metalness: 0.0,
    roughness: 0.9,
  },
  slate: {
    id: 'slate',
    name: 'Slate',
    color: '#708090',
    metalness: 0.05,
    roughness: 0.6,
  },

  // Wood
  oak: {
    id: 'oak',
    name: 'Oak',
    color: '#8B6914',
    metalness: 0.0,
    roughness: 0.5,
  },
  walnut: {
    id: 'walnut',
    name: 'Walnut',
    color: '#5D4037',
    metalness: 0.0,
    roughness: 0.4,
  },
  pine: {
    id: 'pine',
    name: 'Pine',
    color: '#D2B48C',
    metalness: 0.0,
    roughness: 0.6,
  },
  ebony: {
    id: 'ebony',
    name: 'Ebony',
    color: '#1A1A1A',
    metalness: 0.1,
    roughness: 0.3,
  },

  // Glass & Transparent-like
  glass: {
    id: 'glass',
    name: 'Glass',
    color: '#E0F7FF',
    metalness: 0.0,
    roughness: 0.1,
    emissive: '#87CEEB',
    emissiveIntensity: 0.2,
  },
  frostedGlass: {
    id: 'frostedGlass',
    name: 'Frosted Glass',
    color: '#FFFACD',
    metalness: 0.0,
    roughness: 0.7,
  },

  // Neon & Glowing
  neonRed: {
    id: 'neonRed',
    name: 'Neon Red',
    color: '#FF0055',
    metalness: 0.2,
    roughness: 0.3,
    emissive: '#FF0055',
    emissiveIntensity: 0.8,
  },
  neonBlue: {
    id: 'neonBlue',
    name: 'Neon Blue',
    color: '#00D9FF',
    metalness: 0.2,
    roughness: 0.3,
    emissive: '#00D9FF',
    emissiveIntensity: 0.8,
  },
  neonGreen: {
    id: 'neonGreen',
    name: 'Neon Green',
    color: '#39FF14',
    metalness: 0.2,
    roughness: 0.3,
    emissive: '#39FF14',
    emissiveIntensity: 0.8,
  },
  neonPurple: {
    id: 'neonPurple',
    name: 'Neon Purple',
    color: '#BC13FE',
    metalness: 0.2,
    roughness: 0.3,
    emissive: '#BC13FE',
    emissiveIntensity: 0.8,
  },
  neonYellow: {
    id: 'neonYellow',
    name: 'Neon Yellow',
    color: '#FFFF00',
    metalness: 0.2,
    roughness: 0.3,
    emissive: '#FFFF00',
    emissiveIntensity: 0.7,
  },

  // Vibrant Colors
  vibrantRed: {
    id: 'vibrantRed',
    name: 'Vibrant Red',
    color: '#FF4444',
    metalness: 0.0,
    roughness: 0.4,
  },
  vibrantBlue: {
    id: 'vibrantBlue',
    name: 'Vibrant Blue',
    color: '#4488FF',
    metalness: 0.0,
    roughness: 0.4,
  },
  vibrantGreen: {
    id: 'vibrantGreen',
    name: 'Vibrant Green',
    color: '#44FF44',
    metalness: 0.0,
    roughness: 0.4,
  },
  vibrantYellow: {
    id: 'vibrantYellow',
    name: 'Vibrant Yellow',
    color: '#FFFF44',
    metalness: 0.0,
    roughness: 0.4,
  },
  vibrantOrange: {
    id: 'vibrantOrange',
    name: 'Vibrant Orange',
    color: '#FF8844',
    metalness: 0.0,
    roughness: 0.4,
  },
  vibrantPurple: {
    id: 'vibrantPurple',
    name: 'Vibrant Purple',
    color: '#FF44FF',
    metalness: 0.0,
    roughness: 0.4,
  },
  vibrantCyan: {
    id: 'vibrantCyan',
    name: 'Vibrant Cyan',
    color: '#44FFFF',
    metalness: 0.0,
    roughness: 0.4,
  },

  // Pastel Colors (soft & cozy)
  pastelPink: {
    id: 'pastelPink',
    name: 'Pastel Pink',
    color: '#FFB6D9',
    metalness: 0.0,
    roughness: 0.6,
  },
  pastelBlue: {
    id: 'pastelBlue',
    name: 'Pastel Blue',
    color: '#ADD8E6',
    metalness: 0.0,
    roughness: 0.6,
  },
  pastelGreen: {
    id: 'pastelGreen',
    name: 'Pastel Green',
    color: '#98FF98',
    metalness: 0.0,
    roughness: 0.6,
  },
  pastelYellow: {
    id: 'pastelYellow',
    name: 'Pastel Yellow',
    color: '#FFFFE0',
    metalness: 0.0,
    roughness: 0.6,
  },
  pastelPurple: {
    id: 'pastelPurple',
    name: 'Pastel Purple',
    color: '#DDA0DD',
    metalness: 0.0,
    roughness: 0.6,
  },
  pastelOrange: {
    id: 'pastelOrange',
    name: 'Pastel Orange',
    color: '#FFCC99',
    metalness: 0.0,
    roughness: 0.6,
  },
  softWarmWhite: {
    id: 'softWarmWhite',
    name: 'Soft Warm White',
    color: '#FFF8F0',
    metalness: 0.0,
    roughness: 0.7,
  },
  softBlush: {
    id: 'softBlush',
    name: 'Soft Blush',
    color: '#FFD4D8',
    metalness: 0.0,
    roughness: 0.65,
  },
  softLavender: {
    id: 'softLavender',
    name: 'Soft Lavender',
    color: '#E6D5F0',
    metalness: 0.0,
    roughness: 0.65,
  },
  softMint: {
    id: 'softMint',
    name: 'Soft Mint',
    color: '#D4F1E8',
    metalness: 0.0,
    roughness: 0.65,
  },
  softPeach: {
    id: 'softPeach',
    name: 'Soft Peach',
    color: '#FFDAB9',
    metalness: 0.0,
    roughness: 0.65,
  },
  warmBeige: {
    id: 'warmBeige',
    name: 'Warm Beige',
    color: '#F5E6D3',
    metalness: 0.0,
    roughness: 0.7,
  },
  softGray: {
    id: 'softGray',
    name: 'Soft Gray',
    color: '#D9D9D9',
    metalness: 0.0,
    roughness: 0.65,
  },

  // Natural Earth Tones
  dirt: {
    id: 'dirt',
    name: 'Dirt',
    color: '#8B4513',
    metalness: 0.0,
    roughness: 0.9,
  },
  sand: {
    id: 'sand',
    name: 'Sand',
    color: '#EDD5B1',
    metalness: 0.0,
    roughness: 0.8,
  },
  clay: {
    id: 'clay',
    name: 'Clay',
    color: '#C2B280',
    metalness: 0.0,
    roughness: 0.7,
  },
  grass: {
    id: 'grass',
    name: 'Grass',
    color: '#7CB342',
    metalness: 0.0,
    roughness: 0.85,
  },
  moss: {
    id: 'moss',
    name: 'Moss',
    color: '#556B2F',
    metalness: 0.0,
    roughness: 0.8,
  },

  // Dark Colors
  black: {
    id: 'black',
    name: 'Black',
    color: '#000000',
    metalness: 0.0,
    roughness: 0.8,
  },
  charcoal: {
    id: 'charcoal',
    name: 'Charcoal',
    color: '#36454F',
    metalness: 0.0,
    roughness: 0.9,
  },
  darkGray: {
    id: 'darkGray',
    name: 'Dark Gray',
    color: '#3D3D3D',
    metalness: 0.0,
    roughness: 0.7,
  },

  // Light Colors
  white: {
    id: 'white',
    name: 'White',
    color: '#FFFFFF',
    metalness: 0.0,
    roughness: 0.5,
  },
  lightGray: {
    id: 'lightGray',
    name: 'Light Gray',
    color: '#D3D3D3',
    metalness: 0.0,
    roughness: 0.6,
  },
  cream: {
    id: 'cream',
    name: 'Cream',
    color: '#FFFDD0',
    metalness: 0.0,
    roughness: 0.4,
  },
};

export const getDefaultMaterial = (): MaterialDefinition => MATERIAL_PRESETS.white;

export const getMaterialById = (id: string): MaterialDefinition | undefined => {
  return MATERIAL_PRESETS[id];
};

export const getAllMaterials = (): MaterialDefinition[] => {
  return Object.values(MATERIAL_PRESETS);
};

// Organize materials by category for UI
export const MATERIAL_CATEGORIES = {
  softCozy: ['softWarmWhite', 'softBlush', 'softLavender', 'softMint', 'softPeach', 'warmBeige', 'softGray'],
  pastel: ['pastelPink', 'pastelBlue', 'pastelGreen', 'pastelYellow', 'pastelPurple', 'pastelOrange'],
  vibrant: ['vibrantRed', 'vibrantBlue', 'vibrantGreen', 'vibrantYellow', 'vibrantOrange', 'vibrantPurple', 'vibrantCyan'],
  metals: ['gold', 'silver', 'copper', 'bronze', 'iron', 'rust'],
  wood: ['oak', 'walnut', 'pine', 'ebony'],
  stones: ['marble', 'limestone', 'granite', 'basalt', 'concrete', 'slate'],
  glass: ['glass', 'frostedGlass'],
  neon: ['neonRed', 'neonBlue', 'neonGreen', 'neonPurple', 'neonYellow'],
  natural: ['dirt', 'sand', 'clay', 'grass', 'moss'],
  basic: ['black', 'charcoal', 'darkGray', 'white', 'lightGray', 'cream'],
};
