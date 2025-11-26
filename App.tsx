
import React, { useState, useEffect, useRef } from 'react';
import GameCanvas from './components/GameCanvas';
import MainMenu from './components/MainMenu';
import LoginScreen from './components/LoginScreen';
import { GameState, LevelData, UserProfile } from './types';
import { LEVELS } from './data/levels';
import { storageService } from './services/storageService';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.LOGIN);
  const [currentLevel, setCurrentLevel] = useState<LevelData | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [lastProgress, setLastProgress] = useState(0);
  const [newlyUnlockedSkins, setNewlyUnlockedSkins] = useState<string[]>([]);
  const [countdown, setCountdown] = useState(0); // Countdown for auto-restart
  const autoRestartTimerRef = useRef<number | null>(null);

  const handleLogin = (username: string) => {
    const user = storageService.getUser(username);
    setCurrentUser(user);
    setGameState(GameState.MENU);
  };

  const handleLogout = () => {
      setCurrentUser(null);
      setGameState(GameState.LOGIN);
  };

  const handleLevelSelect = (level: LevelData) => {
    setCurrentLevel(level);
    setGameState(GameState.PLAYING);
    setLastProgress(0);
    setNewlyUnlockedSkins([]); // Reset unlock tracker
  };

  const clearAutoRestart = () => {
      if (autoRestartTimerRef.current) {
          clearTimeout(autoRestartTimerRef.current);
          autoRestartTimerRef.current = null;
      }
      setCountdown(0);
  };

  const handleRetry = () => {
    clearAutoRestart();
    // Force re-mount by briefly toggling state, or relying on key prop in GameCanvas
    setGameState(GameState.MENU); 
    setTimeout(() => {
        setNewlyUnlockedSkins([]);
        setGameState(GameState.PLAYING);
    }, 0);
  };

  const handleGameOver = (percent: number) => {
    if (currentUser && currentLevel) {
        // Save progress on death
        const updatedUser = storageService.updateProgress(currentUser, currentLevel.id, percent, false, false);
        setCurrentUser(updatedUser);

        // Auto Restart Logic
        if (updatedUser.settings.autoRestart) {
            setCountdown(1);
            let count = 1;
            const interval = setInterval(() => {
                count--;
                setCountdown(count);
                if (count <= 0) clearInterval(interval);
            }, 1000);

            autoRestartTimerRef.current = window.setTimeout(() => {
                clearInterval(interval);
                handleRetry();
            }, 1000);
        }
    }
    setLastProgress(percent);
    setGameState(GameState.GAMEOVER);
  };

  const handleWin = (isNightmare: boolean) => {
    if (currentUser && currentLevel) {
        const previousSkins = currentUser.unlockedSkins;
        // Save complete, pass isNightmare flag
        const updatedUser = storageService.updateProgress(currentUser, currentLevel.id, 100, true, isNightmare);
        
        // Determine what was just unlocked
        const justUnlocked = updatedUser.unlockedSkins.filter(skin => !previousSkins.includes(skin));
        setNewlyUnlockedSkins(justUnlocked);

        setCurrentUser(updatedUser);
    }
    setLastProgress(100);
    setGameState(GameState.WON);
  };

  const handleExit = () => {
    clearAutoRestart();
    setGameState(GameState.MENU);
    setCurrentLevel(null);
  };

  const handleUpdateUser = (updatedUser: UserProfile) => {
      setCurrentUser(updatedUser);
  };

  const handleResetData = () => {
      if (currentUser) {
          storageService.resetData(currentUser.username);
          handleLogout();
      }
  };

  // Clean up timer if component unmounts
  useEffect(() => {
      return () => clearAutoRestart();
  }, []);

  return (
    <div className="w-screen h-screen overflow-hidden bg-black font-sans select-none">
      
      {gameState === GameState.LOGIN && (
        <LoginScreen onLogin={handleLogin} />
      )}

      {gameState === GameState.MENU && currentUser && (
        <MainMenu 
            levels={LEVELS} 
            user={currentUser}
            onSelectLevel={handleLevelSelect} 
            onLogout={handleLogout}
            onUpdateUser={handleUpdateUser}
            onResetData={handleResetData}
        />
      )}

      {gameState === GameState.PLAYING && currentLevel && currentUser && (
        <GameCanvas 
            key={currentLevel.id} 
            level={currentLevel}
            user={currentUser} 
            onGameOver={handleGameOver} 
            onWin={handleWin}
            onExit={handleExit}
        />
      )}

      {/* Overlays for Win/Loss */}
      {(gameState === GameState.GAMEOVER || gameState === GameState.WON) && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
           <div className="bg-slate-800 p-8 rounded-2xl border border-slate-600 shadow-2xl text-center max-w-md w-full animate-bounce-in relative overflow-hidden">
              {/* Auto Restart Progress Bar */}
              {gameState === GameState.GAMEOVER && currentUser?.settings.autoRestart && (
                   <div className="absolute top-0 left-0 h-1 bg-cyan-500 transition-all duration-1000 ease-linear" style={{ width: `${(countdown/1)*100}%` }}></div>
              )}

              <h2 className={`text-5xl font-black mb-4 ${gameState === GameState.WON ? 'text-green-400' : 'text-red-500'}`}>
                  {gameState === GameState.WON ? 'COMPLETE!' : 'CRASHED'}
              </h2>
              <div className="mb-8">
                  <div className="text-6xl font-bold text-white mb-2">{lastProgress}%</div>
                  <p className="text-slate-400">
                    {gameState === GameState.WON 
                        ? `You conquered ${currentLevel?.name}!` 
                        : `Don't give up! ${currentLevel?.name} is tough.`}
                  </p>
                  
                  {/* Unlock Notifications */}
                  {gameState === GameState.WON && newlyUnlockedSkins.includes('ship_voyager') && (
                      <div className="mt-4 text-yellow-400 font-bold animate-pulse">
                          SKIN UNLOCKED: VOYAGER
                      </div>
                  )}
                  {/* Normal Skin Unlocked */}
                  {gameState === GameState.WON && newlyUnlockedSkins.some(s => s.startsWith('cube_') && s !== 'cube_shadow') && (
                       <div className="mt-4 text-cyan-400 font-bold animate-pulse">
                          NEW SKIN UNLOCKED!
                      </div>
                  )}
                  {/* Abyss Skin Unlock Notification */}
                  {gameState === GameState.WON && newlyUnlockedSkins.includes('cube_shadow') && (
                       <div className="mt-4 text-purple-500 font-black animate-pulse uppercase">
                          Nightmare Conquered. 'ABYSS' Skin Unlocked.
                      </div>
                  )}
              </div>
              
              <div className="flex gap-4 justify-center">
                  <button 
                    onClick={handleRetry}
                    className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg transition-transform hover:scale-105"
                  >
                      {gameState === GameState.GAMEOVER && currentUser?.settings.autoRestart 
                        ? `RETRYING...` 
                        : 'RETRY'}
                  </button>
                  <button 
                    onClick={handleExit}
                    className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-transform hover:scale-105"
                  >
                      MENU
                  </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
