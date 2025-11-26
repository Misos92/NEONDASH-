
import React, { useState } from 'react';
import { LevelData, UserProfile } from '../types';
import { audioService } from '../services/audioService';
import { SKINS } from '../constants';
import { storageService } from '../services/storageService';

interface MainMenuProps {
  levels: LevelData[];
  user: UserProfile;
  onSelectLevel: (level: LevelData) => void;
  onLogout: () => void;
  onUpdateUser: (user: UserProfile) => void;
  onResetData: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ levels, user, onSelectLevel, onLogout, onUpdateUser, onResetData }) => {
  const [showGarage, setShowGarage] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleEquip = (skinId: string, type: 'CUBE' | 'SHIP') => {
      audioService.playClick();
      const updatedUser = storageService.equipSkin(user, skinId, type);
      onUpdateUser(updatedUser);
  };

  const handleLogoutClick = () => {
    audioService.playClick();
    onLogout();
  };

  const handleGarageClick = () => {
    audioService.playClick();
    setShowGarage(true);
  };

  const handleCloseGarage = () => {
    audioService.playClick();
    setShowGarage(false);
  };

  const handleSettingsClick = () => {
      audioService.playClick();
      setShowSettings(true);
      setConfirmReset(false);
  };

  const handleCloseSettings = () => {
      audioService.playClick();
      setShowSettings(false);
  };

  const toggleNightmare = () => {
      audioService.playClick();
      const updatedUser = storageService.updateSettings(user, { nightmareEnabled: !user.settings.nightmareEnabled });
      onUpdateUser(updatedUser);
  };

  const toggleFPS = () => {
      audioService.playClick();
      const updatedUser = storageService.updateSettings(user, { showFPS: !user.settings.showFPS });
      onUpdateUser(updatedUser);
  };

  const toggleLowQuality = () => {
      audioService.playClick();
      const updatedUser = storageService.updateSettings(user, { lowQuality: !user.settings.lowQuality });
      onUpdateUser(updatedUser);
  };

  const toggleAutoRestart = () => {
      audioService.playClick();
      const updatedUser = storageService.updateSettings(user, { autoRestart: !user.settings.autoRestart });
      onUpdateUser(updatedUser);
  };

  const handleResetClick = () => {
      audioService.playClick();
      if (confirmReset) {
          onResetData();
      } else {
          setConfirmReset(true);
      }
  };

  const cubeSkins = SKINS.filter(s => s.type === 'CUBE');
  const shipSkins = SKINS.filter(s => s.type === 'SHIP');

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-white relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 bg-cyan-500 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-600 rounded-full blur-[120px]"></div>
      </div>

      {/* Top Bar */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-4">
        <div className="text-right">
            <div className="text-xs text-slate-400 uppercase tracking-wider">Player</div>
            <div className="font-bold text-cyan-400 text-lg">{user.username}</div>
        </div>
        <button 
            onClick={handleLogoutClick}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded border border-slate-600 text-sm transition-colors"
        >
            Logout
        </button>
      </div>

      <div className="absolute top-6 left-6 z-20">
          <button 
            onClick={handleSettingsClick}
            className="bg-slate-800 hover:bg-slate-700 p-2 rounded-full border border-slate-600 transition-colors shadow-lg group"
          >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-400 group-hover:text-cyan-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
          </button>
      </div>

      {/* Main Content */}
      <div className="z-10 text-center mb-6">
        <h1 className="text-7xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">
          NEON DASH
        </h1>
        <p className="text-slate-400 mt-2 text-lg tracking-widest">SELECT TRACK</p>
      </div>

      <div className="z-10 flex flex-col gap-6 w-full items-center">
          
          {/* Level Selector */}
          <div className="flex gap-6 overflow-x-auto p-8 w-full max-w-6xl justify-center items-stretch snap-x">
            {levels.map((level) => {
            const progress = user.progress[level.id] || { bestPercent: 0, completed: false, completedNightmare: false };
            
            return (
                <div 
                    key={level.id}
                    onClick={() => {
                        audioService.init(); // Init context
                        audioService.playClick();
                        onSelectLevel(level);
                    }}
                    className="group relative w-64 h-80 bg-slate-800 rounded-xl border-2 border-slate-700 hover:border-cyan-400 transition-all duration-300 cursor-pointer hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(34,211,238,0.3)] flex flex-col items-center p-6 snap-center shrink-0"
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-50 rounded-xl"></div>
                    
                    {/* Nightmare Badge */}
                    {progress.completedNightmare && (
                         <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white font-black text-[10px] px-2 py-0.5 rounded shadow-lg z-30 border border-purple-400 whitespace-nowrap">
                            NIGHTMARE CONQUERED
                        </div>
                    )}

                    {/* Progress Badge */}
                    {progress.completed ? (
                        <div className="absolute -top-3 -right-3 bg-yellow-400 text-black font-black text-xs px-3 py-1 rounded-full shadow-lg z-20 transform rotate-12 border-2 border-white">
                            COMPLETED!
                        </div>
                    ) : progress.bestPercent > 0 && (
                        <div className="absolute -top-3 -right-3 bg-slate-700 text-cyan-400 font-bold text-xs px-2 py-1 rounded-full shadow-lg z-20 border border-cyan-500/50">
                            BEST: {progress.bestPercent}%
                        </div>
                    )}

                    <div 
                        className="w-24 h-24 mb-6 rounded-lg shadow-lg flex items-center justify-center text-3xl font-bold border-2 relative overflow-hidden"
                        style={{ backgroundColor: level.color, borderColor: 'white', color: 'rgba(0,0,0,0.6)' }}
                    >
                        <div className="z-10">{level.id}</div>
                        {/* Inner progress fill for the icon */}
                        <div 
                            className="absolute bottom-0 left-0 right-0 bg-black/20 transition-all duration-1000"
                            style={{ height: `${progress.bestPercent}%` }}
                        ></div>
                    </div>
                    
                    <h3 className="text-xl font-bold z-10">{level.name}</h3>
                    <div className="mt-2 px-3 py-1 rounded-full bg-slate-700 text-xs font-bold uppercase tracking-wider z-10" style={{ color: level.color }}>
                        {level.difficulty}
                    </div>
                    
                    <div className="mt-auto w-full z-10 space-y-2">
                        {/* Speed Bar */}
                        <div>
                            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                                <span>SPEED</span>
                                <span>{Math.round(level.speed)}x</span>
                            </div>
                            <div className="w-full bg-slate-700 h-1 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-white" 
                                    style={{ width: `${(level.speed / 15) * 100}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Personal Best Bar */}
                        <div>
                            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                                <span>PROGRESS</span>
                                <span className={progress.completed ? 'text-yellow-400' : 'text-slate-400'}>
                                    {progress.completed ? '100%' : `${progress.bestPercent}%`}
                                </span>
                            </div>
                            <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden border border-slate-600">
                                <div 
                                    className={`h-full transition-all duration-1000 ${progress.completed ? 'bg-yellow-400' : 'bg-cyan-500'}`} 
                                    style={{ width: `${progress.bestPercent}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            );
            })}
          </div>

          <button 
            onClick={handleGarageClick}
            className="flex items-center gap-2 px-8 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition-colors font-bold text-cyan-400 shadow-lg hover:shadow-[0_0_20px_rgba(34,211,238,0.2)]"
          >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
              </svg>
              GARAGE & CUSTOMIZATION
          </button>
      </div>

      {/* Settings Modal */}
      {showSettings && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
            <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl p-6">
                <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
                    <h2 className="text-2xl font-bold text-white">SETTINGS</h2>
                    <button onClick={handleCloseSettings} className="text-slate-400 hover:text-white">✕</button>
                </div>
                
                <div className="space-y-6">
                    {/* Nightmare Setting */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-purple-400">Nightmare</h3>
                            <p className="text-xs text-slate-400 max-w-[250px]">
                                A 1% chance for levels to plunge into darkness and chaos halfway through.
                            </p>
                        </div>
                        <button 
                            onClick={toggleNightmare}
                            className={`w-14 h-8 rounded-full transition-colors flex items-center px-1 ${
                                user.settings.nightmareEnabled ? 'bg-purple-600' : 'bg-slate-700'
                            }`}
                        >
                            <div className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform ${
                                user.settings.nightmareEnabled ? 'translate-x-6' : 'translate-x-0'
                            }`}></div>
                        </button>
                    </div>

                    {/* Auto Restart Setting */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-slate-300">Auto Restart</h3>
                            <p className="text-xs text-slate-400">
                                Automatically retry 3 seconds after crashing.
                            </p>
                        </div>
                        <button 
                            onClick={toggleAutoRestart}
                            className={`w-14 h-8 rounded-full transition-colors flex items-center px-1 ${
                                user.settings.autoRestart ? 'bg-cyan-600' : 'bg-slate-700'
                            }`}
                        >
                            <div className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform ${
                                user.settings.autoRestart ? 'translate-x-6' : 'translate-x-0'
                            }`}></div>
                        </button>
                    </div>

                    {/* FPS Setting */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-slate-300">Show FPS</h3>
                            <p className="text-xs text-slate-400">
                                Display performance counters.
                            </p>
                        </div>
                        <button 
                            onClick={toggleFPS}
                            className={`w-14 h-8 rounded-full transition-colors flex items-center px-1 ${
                                user.settings.showFPS ? 'bg-cyan-600' : 'bg-slate-700'
                            }`}
                        >
                            <div className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform ${
                                user.settings.showFPS ? 'translate-x-6' : 'translate-x-0'
                            }`}></div>
                        </button>
                    </div>

                    {/* Low Quality Mode */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-slate-300">Low Quality Mode</h3>
                            <p className="text-xs text-slate-400">
                                Disable particles and bloom for better performance.
                            </p>
                        </div>
                        <button 
                            onClick={toggleLowQuality}
                            className={`w-14 h-8 rounded-full transition-colors flex items-center px-1 ${
                                user.settings.lowQuality ? 'bg-cyan-600' : 'bg-slate-700'
                            }`}
                        >
                            <div className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform ${
                                user.settings.lowQuality ? 'translate-x-6' : 'translate-x-0'
                            }`}></div>
                        </button>
                    </div>

                    {/* Danger Zone */}
                    <div className="pt-4 mt-4 border-t border-slate-700">
                        <h3 className="text-xs font-bold text-red-500 uppercase mb-2">Danger Zone</h3>
                        <button 
                            onClick={handleResetClick}
                            className={`w-full py-2 rounded font-bold text-sm transition-colors ${
                                confirmReset ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-slate-800 hover:bg-red-900/30 text-red-400 border border-red-900/50'
                            }`}
                        >
                            {confirmReset ? 'CONFIRM DELETE? (CANNOT UNDO)' : 'RESET SAVE DATA'}
                        </button>
                    </div>
                </div>

                <div className="mt-8 text-center text-xs text-slate-500">
                    Game Version 1.5
                </div>
            </div>
          </div>
      )}

      {/* Garage Modal */}
      {showGarage && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
            <div className="w-full max-w-4xl h-3/4 bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                    <h2 className="text-3xl font-bold text-white italic">GARAGE</h2>
                    <button onClick={handleCloseGarage} className="text-slate-400 hover:text-white">CLOSE [X]</button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="mb-8">
                        <h3 className="text-xl font-bold text-cyan-400 mb-4 border-b border-slate-700 pb-2">CUBE SKINS</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {cubeSkins.map(skin => {
                                const isUnlocked = user.unlockedSkins.includes(skin.id);
                                const isEquipped = user.equippedCubeSkinId === skin.id;
                                return (
                                    <div 
                                        key={skin.id}
                                        onClick={() => {
                                            if (isUnlocked) handleEquip(skin.id, 'CUBE');
                                            else if (!isUnlocked) audioService.playClick(); // Feedback for locked
                                        }}
                                        className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer ${
                                            isEquipped ? 'border-cyan-400 bg-cyan-900/20' : 
                                            isUnlocked ? 'border-slate-600 hover:border-slate-400 bg-slate-800' : 
                                            'border-slate-800 bg-slate-900 opacity-60 cursor-not-allowed'
                                        }`}
                                    >
                                        <div className="h-20 mb-3 flex items-center justify-center bg-black/40 rounded-lg">
                                            <div className="w-10 h-10" style={{ backgroundColor: skin.color }}></div>
                                        </div>
                                        <div className="font-bold">{skin.name}</div>
                                        <div className="text-xs text-slate-400 mt-1">{isUnlocked ? skin.description : `Complete Level ${skin.unlockLevelId} to Unlock`}</div>
                                        
                                        {isEquipped && (
                                            <div className="absolute top-2 right-2 w-3 h-3 bg-cyan-400 rounded-full shadow-[0_0_10px_#22d3ee]"></div>
                                        )}
                                        {!isUnlocked && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xl font-bold text-yellow-400 mb-4 border-b border-slate-700 pb-2">SHIP SKINS (ORBITAL MODE)</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                             {shipSkins.map(skin => {
                                const isUnlocked = user.unlockedSkins.includes(skin.id);
                                const isEquipped = user.equippedShipSkinId === skin.id;
                                return (
                                    <div 
                                        key={skin.id}
                                        onClick={() => {
                                            if(isUnlocked) handleEquip(skin.id, 'SHIP');
                                            else if (!isUnlocked) audioService.playClick();
                                        }}
                                        className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer ${
                                            isEquipped ? 'border-yellow-400 bg-yellow-900/20' : 
                                            isUnlocked ? 'border-slate-600 hover:border-slate-400 bg-slate-800' : 
                                            'border-slate-800 bg-slate-900 opacity-60 cursor-not-allowed'
                                        }`}
                                    >
                                        <div className="h-20 mb-3 flex items-center justify-center bg-black/40 rounded-lg">
                                            {/* Simple Ship Icon Representation */}
                                            <svg width="40" height="20" viewBox="0 0 40 20">
                                                 <path d="M0,20 L40,10 L0,0 L10,10 Z" fill={skin.color || '#fff'} />
                                            </svg>
                                        </div>
                                        <div className="font-bold">{skin.name}</div>
                                        <div className="text-xs text-slate-400 mt-1">{isUnlocked ? skin.description : `Complete Level ${skin.unlockLevelId} to Unlock`}</div>
                                        
                                        {isEquipped && (
                                            <div className="absolute top-2 right-2 w-3 h-3 bg-yellow-400 rounded-full shadow-[0_0_10px_#facc15]"></div>
                                        )}
                                        {!isUnlocked && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default MainMenu;
