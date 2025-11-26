
import { Skin } from './types';

export const BLOCK_SIZE = 50;

// Cube Physics
export const GRAVITY = 1.6; // Slightly heavier gravity for snappier jumps
export const JUMP_FORCE = 24.0; // Increased jump force to clear 2-3 blocks comfortably

// Ship Physics
// Retuned for "floatier" feel (Less gravity, less thrust required to hover)
export const SHIP_GRAVITY = 0.35; 
export const SHIP_THRUST = 0.65; // Balanced against gravity for smooth control
export const SHIP_MAX_Y_VELOCITY = 8; // Lower cap to prevent uncontrollable speed

export const FLOOR_Y = 400; // Canvas Y coordinate for the floor
export const CEILING_Y = -200; // Virtual ceiling for ship mode
export const PLAYER_X_OFFSET = 200; // Fixed X position of player on screen
export const CAM_LOOKAHEAD = 1000; 

// Colors
export const COLORS = {
  player: '#00f0ff',
  playerTrail: 'rgba(0, 240, 255, 0.4)',
  spike: '#ff0055',
  block: '#ffffff',
  bg_grid: 'rgba(255, 255, 255, 0.05)',
  floor: '#1e293b',
  portal: '#8b5cf6' // Violet
};

export const PARTICLES = {
  count: 20,
  speed: 6,
  lifeDecay: 0.04
};

export const SKINS: Skin[] = [
    { 
        id: 'cube_default', 
        name: 'Standard', 
        type: 'CUBE', 
        description: 'The reliable default.', 
        color: '#00f0ff' 
    },
    { 
        id: 'cube_stereo', 
        name: 'Stereo', 
        type: 'CUBE', 
        unlockLevelId: 1, 
        description: 'Reward for beating Stereo Start.', 
        color: '#4ade80' 
    },
    { 
        id: 'cube_neon', 
        name: 'Neon', 
        type: 'CUBE', 
        unlockLevelId: 2, 
        description: 'Glowing with achievement.', 
        color: '#f472b6' 
    },
    { 
        id: 'cube_midnight', 
        name: 'Midnight', 
        type: 'CUBE', 
        unlockLevelId: 3, 
        description: 'Stealthy and fast.', 
        color: '#818cf8' 
    },
    {
        id: 'cube_shadow',
        name: 'Abyss',
        type: 'CUBE',
        description: 'Conquered the Nightmare.',
        color: '#2e1065' // Very dark purple
    },
    { 
        id: 'ship_default', 
        name: 'Pilot', 
        type: 'SHIP', 
        description: 'Basic flight module.', 
        color: '#fbbf24' 
    },
    { 
        id: 'ship_voyager', 
        name: 'Voyager', 
        type: 'SHIP', 
        unlockLevelId: 4, 
        description: 'Master of gravity.', 
        color: '#f59e0b' 
    },
];
