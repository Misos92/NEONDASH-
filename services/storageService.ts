
import { UserProfile, LevelProgress } from '../types';
import { SKINS } from '../constants';

const STORAGE_KEY_PREFIX = 'neondash_user_';

export const storageService = {
  getUser: (username: string): UserProfile => {
    const key = `${STORAGE_KEY_PREFIX}${username.toLowerCase()}`;
    const stored = localStorage.getItem(key);
    
    const defaultUser: UserProfile = {
      username,
      progress: {},
      unlockedSkins: ['cube_default', 'ship_default'],
      equippedCubeSkinId: 'cube_default',
      equippedShipSkinId: 'ship_default',
      settings: {
        nightmareEnabled: true,
        showFPS: false,
        lowQuality: false,
        autoRestart: false
      }
    };

    if (stored) {
      const parsed = JSON.parse(stored);
      // Migration: Ensure new fields exist if loading old data
      return {
        ...defaultUser,
        ...parsed,
        unlockedSkins: parsed.unlockedSkins || defaultUser.unlockedSkins,
        equippedCubeSkinId: parsed.equippedCubeSkinId || defaultUser.equippedCubeSkinId,
        equippedShipSkinId: parsed.equippedShipSkinId || defaultUser.equippedShipSkinId,
        settings: { ...defaultUser.settings, ...(parsed.settings || {}) }
      };
    }
    return defaultUser;
  },

  saveUser: (user: UserProfile) => {
    const key = `${STORAGE_KEY_PREFIX}${user.username.toLowerCase()}`;
    localStorage.setItem(key, JSON.stringify(user));
  },

  resetData: (username: string) => {
      const key = `${STORAGE_KEY_PREFIX}${username.toLowerCase()}`;
      localStorage.removeItem(key);
  },

  updateProgress: (user: UserProfile, levelId: number, percent: number, completed: boolean, isNightmareRun: boolean = false): UserProfile => {
    const currentProgress = user.progress[levelId] || { bestPercent: 0, completed: false, completedNightmare: false, winCount: 0 };
    
    // Increment win count if completed
    const newWinCount = (currentProgress.winCount || 0) + (completed ? 1 : 0);
    const newCompletedNightmare = currentProgress.completedNightmare || (completed && isNightmareRun);

    // Check if a new skin is unlocked
    let newSkins = [...user.unlockedSkins];
    
    // Normal level rewards
    if (completed && !currentProgress.completed) {
        const rewardSkin = SKINS.find(s => s.unlockLevelId === levelId);
        if (rewardSkin && !newSkins.includes(rewardSkin.id)) {
            newSkins.push(rewardSkin.id);
        }
    }

    // Nightmare reward (Abyss skin)
    if (completed && isNightmareRun) {
        if (!newSkins.includes('cube_shadow')) {
            newSkins.push('cube_shadow');
        }
    }

    // Only update if better or unlocked something or win count increased
    if (completed || percent > currentProgress.bestPercent || newSkins.length !== user.unlockedSkins.length || newCompletedNightmare !== currentProgress.completedNightmare) {
      const updatedUser = {
        ...user,
        unlockedSkins: newSkins,
        progress: {
          ...user.progress,
          [levelId]: {
            bestPercent: completed ? 100 : Math.max(percent, currentProgress.bestPercent),
            completed: completed || currentProgress.completed,
            completedNightmare: newCompletedNightmare,
            winCount: newWinCount
          }
        }
      };
      storageService.saveUser(updatedUser);
      return updatedUser;
    }
    
    return user;
  },

  equipSkin: (user: UserProfile, skinId: string, type: 'CUBE' | 'SHIP'): UserProfile => {
      const updatedUser = {
          ...user,
          equippedCubeSkinId: type === 'CUBE' ? skinId : user.equippedCubeSkinId,
          equippedShipSkinId: type === 'SHIP' ? skinId : user.equippedShipSkinId
      };
      storageService.saveUser(updatedUser);
      return updatedUser;
  },

  updateSettings: (user: UserProfile, settings: Partial<UserProfile['settings']>): UserProfile => {
      const updatedUser = {
          ...user,
          settings: { ...user.settings, ...settings }
      };
      storageService.saveUser(updatedUser);
      return updatedUser;
  }
};
