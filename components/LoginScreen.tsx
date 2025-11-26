

import React, { useState } from 'react';
import { audioService } from '../services/audioService';

interface LoginScreenProps {
  onLogin: (username: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim().length > 0) {
      audioService.init(); // Initialize audio context on first interaction
      audioService.playClick();
      onLogin(username.trim());
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
         <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-600 rounded-full blur-[150px] animate-pulse"></div>
         <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-700 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="z-10 bg-slate-800/80 p-10 rounded-2xl border border-slate-600 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-md max-w-md w-full text-center">
        <h1 className="text-5xl font-black italic mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
          NEON DASH
        </h1>
        <p className="text-slate-400 mb-8 tracking-widest text-sm">ENTER YOUR IDENTITY</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="w-full bg-slate-900 border-2 border-slate-700 rounded-lg px-4 py-3 text-xl text-center focus:outline-none focus:border-cyan-400 transition-colors text-white placeholder-slate-600 font-mono"
            maxLength={12}
            autoFocus
          />
          <button
            type="submit"
            disabled={!username.trim()}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-3 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 shadow-lg shadow-cyan-500/20"
          >
            START ENGINE
          </button>
        </form>
      </div>
      
      <div className="absolute bottom-4 text-slate-600 text-xs font-mono">
        DATA SAVED LOCALLY TO BROWSER
      </div>
    </div>
  );
};

export default LoginScreen;