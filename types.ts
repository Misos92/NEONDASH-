
export enum EntityType {
  BLOCK = 'BLOCK',
  SPIKE = 'SPIKE',
  PAD = 'PAD', // Jump pad
  ORB = 'ORB',  // Jump orb
  PORTAL = 'PORTAL' // End level portal
}

export type GameMode = 'CUBE' | 'SHIP';

export interface Entity {
  id: number;
  type: EntityType;
  x: number; // Grid coordinates (1 unit = BLOCK_SIZE)
  y: number; // Grid coordinates (0 is floor)
  w?: number; // Width in grid units (default 1)
  h?: number; // Height in grid units (default 1)
}

export interface LevelData {
  id: number;
  name: string;
  difficulty: string;
  speed: number;
  color: string;
  mode: GameMode;
  entities: Entity[];
  length: number; // In grid units
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

export enum GameState {
  LOGIN = 'LOGIN',
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAMEOVER = 'GAMEOVER',
  WON = 'WON'
}

export interface LevelProgress {
  bestPercent: number;
  completed: boolean;
  completedNightmare?: boolean;
  winCount?: number; // Used for dynamic probability calculation
}

export interface Skin {
  id: string;
  name: string;
  type: 'CUBE' | 'SHIP';
  unlockLevelId?: number; // ID of level required to unlock
  description: string;
  color?: string;
}

export interface UserSettings {
  nightmareEnabled: boolean;
  showFPS: boolean;
  lowQuality: boolean;
  autoRestart: boolean;
}

export interface UserProfile {
  username: string;
  progress: Record<number, LevelProgress>;
  unlockedSkins: string[];
  equippedCubeSkinId: string;
  equippedShipSkinId: string;
  settings: UserSettings;
}
