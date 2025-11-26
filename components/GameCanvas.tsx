
import React, { useRef, useEffect } from 'react';
import { LevelData, EntityType, Particle, UserProfile } from '../types';
import { BLOCK_SIZE, GRAVITY, JUMP_FORCE, FLOOR_Y, PLAYER_X_OFFSET, COLORS, PARTICLES, SHIP_GRAVITY, SHIP_THRUST, SHIP_MAX_Y_VELOCITY, SKINS } from '../constants';
import { audioService } from '../services/audioService';

interface GameCanvasProps {
  level: LevelData;
  user: UserProfile;
  onGameOver: (percent: number) => void;
  onWin: (isNightmare: boolean) => void;
  onExit: () => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ level, user, onGameOver, onWin, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  
  // Direct DOM refs for high-performance UI updates without re-renders
  const progressBarRef = useRef<HTMLDivElement>(null);
  const progressTextRef = useRef<HTMLDivElement>(null);

  // Game State Refs
  const playerRef = useRef({
    x: 0,
    y: 0, 
    dy: 0,
    rotation: 0,
    isGrounded: true,
    isDead: false,
    trail: [] as {x: number, y: number, alpha: number, rotation: number}[]
  });
  
  const cameraRef = useRef({ x: 0, shake: 0 });
  const particlesRef = useRef<Particle[]>([]);
  const frameCountRef = useRef(0);
  const jumpBufferRef = useRef(0); 
  const isHoldingJumpRef = useRef(false);
  const jumpPressedRef = useRef(false);

  // Performance/FPS
  const fpsRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const framesSinceLastRef = useRef(0);

  // Nightmare State
  const nightmarePossibleRef = useRef(false);
  const isNightmareModeRef = useRef(false);
  const nightmareTeaseRef = useRef(false);
  const isNightmareLoopRef = useRef(false); // Track if we are in the 2nd lap
  const isFakeWinSequenceRef = useRef(false); // Track the black screen phase
  const fakeWinTimerRef = useRef(0); // Timer for the fake win animation
  
  // Dynamic Probability & Visuals
  const levelProgress = user.progress[level.id] || { winCount: 0 };
  const winCount = levelProgress.winCount || 0;
  
  // Calculate Base Chance: Changed to 5% base + 1% per win, max 15%
  let calculatedChance = Math.min(0.05 + (winCount * 0.01), 0.15);

  // Bonus: +1% if all cube levels (1, 2, 3) are completed
  const allCubeLevelsCompleted = [1, 2, 3].every(id => user.progress[id]?.completed);
  if (allCubeLevelsCompleted) {
      calculatedChance += 0.01;
  }

  // Bonus: +10% if Abyss skin is equipped
  if (user.equippedCubeSkinId === 'cube_shadow') {
      calculatedChance += 0.10;
  }

  const currentNightmareChance = Math.min(calculatedChance, 0.25);

  // Get current skin info
  const cubeSkin = SKINS.find(s => s.id === user.equippedCubeSkinId);
  const shipSkin = SKINS.find(s => s.id === user.equippedShipSkinId);
  const playerColor = level.mode === 'SHIP' ? (shipSkin?.color || COLORS.player) : (cubeSkin?.color || COLORS.player);

  const isLowQuality = user.settings.lowQuality;

  // Initialize
  useEffect(() => {
    // Reset state
    resetPlayerState();
    
    cameraRef.current = { x: 0, shake: 0 };
    particlesRef.current = [];
    frameCountRef.current = 0;
    jumpBufferRef.current = 0;
    isHoldingJumpRef.current = false;
    jumpPressedRef.current = false;
    lastTimeRef.current = performance.now();
    framesSinceLastRef.current = 0;

    // Determine Nightmare Fate
    isNightmareModeRef.current = false;
    nightmareTeaseRef.current = false;
    isNightmareLoopRef.current = false;
    isFakeWinSequenceRef.current = false;
    
    // Roll the dice based on dynamic probability
    const roll = Math.random();
    const isNightmare = (user.settings?.nightmareEnabled) && (roll < currentNightmareChance);
    nightmarePossibleRef.current = isNightmare;

    // Log for verification
    if (user.settings?.nightmareEnabled) {
        console.log(`Nightmare Roll: ${roll.toFixed(3)} vs Threshold: ${currentNightmareChance.toFixed(3)} -> ${isNightmare ? 'ACTIVE' : 'INACTIVE'}`);
    } else {
        console.log('Nightmare Mode Disabled in Settings');
    }
    
    // Reset UI via DOM
    if (progressBarRef.current) progressBarRef.current.style.width = '0%';
    if (progressTextRef.current) progressTextRef.current.textContent = '0%';

    audioService.startBGM(level.id); 

    const animate = () => {
      // FPS Calc
      const now = performance.now();
      framesSinceLastRef.current++;
      if (now - lastTimeRef.current >= 1000) {
          fpsRef.current = framesSinceLastRef.current;
          framesSinceLastRef.current = 0;
          lastTimeRef.current = now;
      }

      update();
      draw();
      
      // Stop loop if dead or won (handled inside update/draw implicitly, but ensuring clean exit)
      // requestRef.current is managed here
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      audioService.stopBGM();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  const resetPlayerState = () => {
      const startY = level.mode === 'SHIP' ? 200 : 0;
      playerRef.current = {
        x: 0,
        y: startY,
        dy: 0,
        rotation: 0,
        isGrounded: level.mode !== 'SHIP',
        isDead: false,
        trail: []
      };
      jumpBufferRef.current = 0;
  };

  // Actual Jump Logic (Executed in Physics Loop)
  const performJump = () => {
      const player = playerRef.current;
      player.dy = JUMP_FORCE;
      player.isGrounded = false;
      audioService.playJump();
      jumpBufferRef.current = 0; 
      
      // Spawn jump dust (only if high quality)
      if (!isLowQuality) {
        for(let i=0; i<5; i++) {
            particlesRef.current.push({
                id: Math.random(),
                x: player.x - 10 + Math.random()*20,
                y: player.y, // relative to floor
                vx: (Math.random() - 0.5) * 2,
                vy: Math.random() * 2,
                life: 1.0,
                color: '#fff',
                size: 2 + Math.random() * 3
            });
        }
      }
  };

  // Controls
  useEffect(() => {
    const handleInputStart = () => {
        isHoldingJumpRef.current = true;
        jumpPressedRef.current = true; // Signal a jump intent
    };

    const handleInputEnd = () => {
        isHoldingJumpRef.current = false;
        jumpPressedRef.current = false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        // Prevent key repeat triggering multiple jumps if held
        if (!e.repeat) handleInputStart();
        else isHoldingJumpRef.current = true;
      }
      if (e.code === 'Escape') onExit();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
        if (e.code === 'Space' || e.code === 'ArrowUp') {
            e.preventDefault();
            handleInputEnd();
        }
    };

    const handleTouchStart = (e: TouchEvent) => {
        e.preventDefault(); 
        handleInputStart();
    };
    const handleTouchEnd = (e: TouchEvent) => {
        e.preventDefault();
        handleInputEnd();
    };
    
    const handleMouseDown = () => handleInputStart();
    const handleMouseUp = () => handleInputEnd();

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: false });
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [level, onExit]);


  const createExplosion = (x: number, y: number) => {
    if (isLowQuality) return;
    for (let i = 0; i < PARTICLES.count * 2; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * PARTICLES.speed * 1.5;
      particlesRef.current.push({
        id: Math.random(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        color: i % 2 === 0 ? playerColor : level.color,
        size: Math.random() * 6 + 3
      });
    }
  };

  const update = () => {
    // If we are in the "Fake Win" blackout, update its timer only
    if (isFakeWinSequenceRef.current) {
        fakeWinTimerRef.current++;
        return;
    }

    if (playerRef.current.isDead) {
        // Just update particles and shake decay if dead
        if (!isLowQuality) {
            particlesRef.current.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.life -= PARTICLES.lifeDecay * 0.5;
            });
            particlesRef.current = particlesRef.current.filter(p => p.life > 0);
        }
        cameraRef.current.shake *= 0.9;
        if (cameraRef.current.shake < 0.5) cameraRef.current.shake = 0;
        return;
    }

    const player = playerRef.current;
    
    // Calculate progress
    const rawProgress = (player.x / (level.length * BLOCK_SIZE)) * 100;
    const currentProgress = Math.min(100, Math.max(0, rawProgress));
    
    // NIGHTMARE TEASE (Start at ~1s, last 0.5s)
    // Only happens on the first loop
    if (!isNightmareLoopRef.current) {
        if (nightmarePossibleRef.current && frameCountRef.current === 60) {
            nightmareTeaseRef.current = true;
            audioService.playNightmareTease();
        }
        if (nightmareTeaseRef.current && frameCountRef.current > 90) {
            nightmareTeaseRef.current = false;
        }

        // NIGHTMARE ACTIVATION
        if (nightmarePossibleRef.current && !isNightmareModeRef.current && currentProgress > 50) {
            isNightmareModeRef.current = true;
            audioService.setNightmareMode(true); // Switch music
            audioService.playNightmareActive();
        }
    }
    
    // Direct DOM update for performance
    if (progressBarRef.current) {
        progressBarRef.current.style.width = `${currentProgress}%`;
        // Change color if Nightmare
        progressBarRef.current.style.backgroundColor = (isNightmareModeRef.current || nightmareTeaseRef.current) ? '#9333ea' : playerColor;
        if (!isLowQuality) {
            progressBarRef.current.style.boxShadow = `0 0 15px ${(isNightmareModeRef.current || nightmareTeaseRef.current) ? '#9333ea' : playerColor}`;
        }
    }
    if (progressTextRef.current) {
        // If in loop, maybe show "ESCAPE" or similar, otherwise %
        progressTextRef.current.textContent = isNightmareLoopRef.current ? '??%' : `${Math.floor(currentProgress)}%`;
        if (isNightmareLoopRef.current) progressTextRef.current.style.color = '#ef4444';
    }

    // --- PHYSICS ENGINE ---

    if (level.mode === 'CUBE') {
        // CUBE LOGIC
        let shouldJump = false;

        if (jumpPressedRef.current) {
            if (player.isGrounded) {
                shouldJump = true;
            } else {
                jumpBufferRef.current = 6; 
            }
            jumpPressedRef.current = false;
        } else if (jumpBufferRef.current > 0) {
            if (player.isGrounded) {
                shouldJump = true;
            }
            jumpBufferRef.current--;
        }

        if (shouldJump) {
            performJump();
        }

        player.dy -= GRAVITY;
        
        const nextY = player.y + player.dy;
        
        if (nextY <= 0) {
            player.y = 0;
            player.dy = 0;
            player.isGrounded = true;
        } else {
            player.y = nextY;
            player.isGrounded = false;
        }

        if (!player.isGrounded) {
            player.rotation += 6; 
        } else {
            const snap = Math.round(player.rotation / 90) * 90;
            if (Math.abs(player.rotation - snap) < 1) player.rotation = snap;
            else player.rotation += (snap - player.rotation) * 0.3;
        }

    } else if (level.mode === 'SHIP') {
        // SHIP LOGIC
        
        player.dy -= SHIP_GRAVITY;
        
        if (isHoldingJumpRef.current) {
            player.dy += SHIP_THRUST;
        }

        if (player.dy > SHIP_MAX_Y_VELOCITY) player.dy = SHIP_MAX_Y_VELOCITY;
        if (player.dy < -SHIP_MAX_Y_VELOCITY) player.dy = -SHIP_MAX_Y_VELOCITY;

        player.y += player.dy;

        if (player.y <= 0) {
            die(currentProgress);
            return;
        } else {
            player.isGrounded = false;
        }

        if (player.y > 600) { 
             player.y = 600;
             if (player.dy > 0) player.dy = 0;
        }

        const targetRot = Math.min(Math.max(player.dy * 3, -45), 45); 
        player.rotation += (targetRot - player.rotation) * 0.15;
    }

    player.x += level.speed;
    
    // --- COLLISION DETECTION ---

    const px = player.x;
    const py = player.y; 
    const size = BLOCK_SIZE;

    const playerGridX = Math.floor(px / BLOCK_SIZE);
    const relevantEntities = level.entities.filter(e => 
      e.x >= playerGridX - 2 && e.x <= playerGridX + 4
    );

    const pHitbox = {
          l: px + size * 0.25,
          r: px + size * 0.75,
          t: py + size * 0.8,
          b: py + size * 0.1 
    };

    for (const ent of relevantEntities) {
      const ex = ent.x * BLOCK_SIZE;
      const ey = ent.y * BLOCK_SIZE;
      
      let eHitbox;

      if (ent.type === EntityType.PORTAL) {
          // Portal Hitbox (Larger than blocks)
          eHitbox = {
              l: ex + size * 0.2,
              r: ex + size * 0.8,
              t: ey + size * 2.5, // Tall portal
              b: ey - size * 0.5
          };
      } else if (ent.type === EntityType.SPIKE) {
          eHitbox = {
              l: ex + size * 0.4,
              r: ex + size * 0.6,
              t: ey + size * 0.5,
              b: ey
          };
      } else {
          eHitbox = {
              l: ex,
              r: ex + size,
              t: ey + size,
              b: ey
          };
      }
      
      const overlapX = (pHitbox.r > eHitbox.l) && (pHitbox.l < eHitbox.r);
      const overlapY = (pHitbox.t > eHitbox.b) && (pHitbox.b < eHitbox.t);
      
      if (overlapX && overlapY) {
        if (ent.type === EntityType.PORTAL) {
            win();
            return;
        }
        if (ent.type === EntityType.SPIKE) {
          die(currentProgress);
          return;
        }
        if (ent.type === EntityType.BLOCK) {
            if (level.mode === 'CUBE') {
                 const overlapTop = eHitbox.t - pHitbox.b;
                 if (overlapTop < 30 && player.dy <= 0) {
                    player.y = ey + size;
                    player.dy = 0;
                    player.isGrounded = true;
                    player.rotation = Math.round(player.rotation / 90) * 90;
                 } else {
                    die(currentProgress);
                    return;
                 }
            } else {
                die(currentProgress);
                return;
            }
        }
      }
    }

    cameraRef.current.x = player.x - PLAYER_X_OFFSET;


    if (player.x > level.length * BLOCK_SIZE + 200) {
        // Fallback win if missed portal but went past end
        win();
    }

    if (!isLowQuality) {
        particlesRef.current.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= PARTICLES.lifeDecay;
        });
        particlesRef.current = particlesRef.current.filter(p => p.life > 0);
    }

    frameCountRef.current++;
    
    if (level.mode === 'SHIP' && isHoldingJumpRef.current && frameCountRef.current % 3 === 0) {
         if (!isLowQuality) {
            particlesRef.current.push({
                id: Math.random(),
                x: player.x - 10,
                y: player.y + 10, 
                vx: -8 - Math.random() * 3,
                vy: (Math.random() - 0.5) * 4,
                life: 0.8,
                color: shipSkin?.color || '#fbbf24', 
                size: 5 + Math.random() * 5
            });
         }
    }

    if (frameCountRef.current % 3 === 0) {
        playerRef.current.trail.push({ x: player.x, y: player.y, alpha: 0.6, rotation: player.rotation });
        if (playerRef.current.trail.length > 6) playerRef.current.trail.shift();
    }
  };

  const die = (currentProgress: number) => {
    if (playerRef.current.isDead) return;
    playerRef.current.isDead = true;
    cameraRef.current.shake = 25; 
    audioService.playDeath();
    createExplosion(PLAYER_X_OFFSET, FLOOR_Y - playerRef.current.y - BLOCK_SIZE/2);
    setTimeout(() => onGameOver(Math.floor(currentProgress)), 800);
  };

  const win = () => {
      if (playerRef.current.isDead) return;
      if (isFakeWinSequenceRef.current) return;

      // NIGHTMARE LOOP MECHANIC
      if (isNightmareModeRef.current && !isNightmareLoopRef.current) {
          // First time hitting portal in Nightmare -> FAKE OUT
          isFakeWinSequenceRef.current = true;
          fakeWinTimerRef.current = 0;
          
          // Audio glitch
          audioService.playNightmareTease(); 
          audioService.stopBGM();

          setTimeout(() => {
              // Reset for loop 2
              isFakeWinSequenceRef.current = false;
              isNightmareLoopRef.current = true;
              resetPlayerState();
              // Restart audio with nightmare mode ON
              audioService.startBGM(level.id);
              audioService.setNightmareMode(true);
          }, 3000);
          return;
      }

      // Real Win
      playerRef.current.isDead = true; 
      audioService.playWin();
      // Pass the nightmare status to the parent
      setTimeout(() => onWin(isNightmareModeRef.current), 500);
  };

  const drawPlayerSkin = (ctx: CanvasRenderingContext2D, size: number) => {
      if (level.mode === 'CUBE') {
          const skinId = user.equippedCubeSkinId;
          
          ctx.fillStyle = playerColor;
          ctx.fillRect(-size/2, -size/2, size, size);

          if (skinId === 'cube_stereo') {
              // Stereo: Gradient
              const grad = ctx.createLinearGradient(-size/2, -size/2, size/2, size/2);
              grad.addColorStop(0, '#4ade80');
              grad.addColorStop(1, '#facc15');
              ctx.fillStyle = grad;
              ctx.fillRect(-size/2 + 4, -size/2 + 4, size - 8, size - 8);
          } else if (skinId === 'cube_neon') {
              // Neon: Thick glowing borders, dark center
              ctx.strokeStyle = '#fff';
              ctx.lineWidth = 3;
              ctx.strokeRect(-size/2 + 4, -size/2 + 4, size - 8, size - 8);
              ctx.fillStyle = '#f472b6';
              ctx.fillRect(-size/4, -size/4, size/2, size/2);
          } else if (skinId === 'cube_midnight') {
              // Midnight: Darker, evil eyes
              ctx.fillStyle = '#312e81';
              ctx.fillRect(-size/2 + 2, -size/2 + 2, size - 4, size - 4);
              
              // Red Eyes
              ctx.fillStyle = '#f87171';
              ctx.beginPath();
              ctx.moveTo(0, 0);
              ctx.lineTo(8, -4);
              ctx.lineTo(8, 4);
              ctx.fill();
              ctx.beginPath();
              ctx.moveTo(12, -8);
              ctx.lineTo(20, -12);
              ctx.lineTo(20, -4);
              ctx.fill();
          } else if (skinId === 'cube_shadow') {
              // Abyss Skin: Black with purple core
              ctx.fillStyle = '#0f0717'; // Almost black
              ctx.fillRect(-size/2 + 1, -size/2 + 1, size - 2, size - 2);
              
              if (!isLowQuality) {
                  ctx.shadowColor = '#d8b4fe';
                  ctx.shadowBlur = 10;
              }
              ctx.strokeStyle = '#d8b4fe'; // Purple glow border
              ctx.lineWidth = 2;
              ctx.strokeRect(-size/2 + 4, -size/2 + 4, size - 8, size - 8);
              
              // Void center
              ctx.fillStyle = '#581c87';
              ctx.fillRect(-size/4, -size/4, size/2, size/2);
              ctx.shadowBlur = 0;

          } else {
             // Default
             ctx.fillStyle = level.color; 
             ctx.fillRect(-size/4, -size/4, size/2, size/2);
          }

          // Universal Face (unless overridden)
          if (skinId !== 'cube_midnight' && skinId !== 'cube_shadow') {
            ctx.fillStyle = '#000';
            ctx.fillRect(8, -8, 6, 6); 
            ctx.fillRect(8, 2, 6, 6);
          }

      } else {
          // SHIP MODE
          const skinId = user.equippedShipSkinId;
          
          if (skinId === 'ship_voyager') {
              // Voyager: Sleek, futuristic
              ctx.fillStyle = '#f59e0b'; // Gold
              ctx.beginPath();
              ctx.moveTo(25, 0);
              ctx.lineTo(-20, 15);
              ctx.lineTo(-10, 0);
              ctx.lineTo(-20, -15);
              ctx.closePath();
              ctx.fill();

              // Engine glow
              ctx.fillStyle = '#0ea5e9';
              ctx.beginPath();
              ctx.arc(-10, 0, 6, 0, Math.PI * 2);
              ctx.fill();

              // Cockpit
              ctx.fillStyle = '#fff';
              ctx.beginPath();
              ctx.ellipse(5, -5, 8, 4, Math.PI / 4, 0, Math.PI * 2);
              ctx.fill();

          } else {
              // Default Ship
              ctx.fillStyle = playerColor;
              ctx.beginPath();
              ctx.moveTo(20, 0); 
              ctx.lineTo(-15, 15); 
              ctx.lineTo(-10, 0); 
              ctx.lineTo(-15, -15); 
              ctx.closePath();
              ctx.fill();
              
              ctx.fillStyle = level.color;
              ctx.beginPath();
              ctx.arc(0, 0, 8, 0, Math.PI * 2);
              ctx.fill();

              ctx.fillStyle = 'white';
              ctx.beginPath();
              ctx.arc(4, -2, 3, 0, Math.PI * 2);
              ctx.fill();
          }
      }
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // FAKE WIN BLACKOUT
    if (isFakeWinSequenceRef.current) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Pulse effect for text
        const opacity = 0.5 + Math.sin(fakeWinTimerRef.current * 0.1) * 0.5;
        
        ctx.fillStyle = `rgba(220, 38, 38, ${opacity})`; // Red tint
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SYSTEM FAILURE...', canvas.width/2, canvas.height/2);
        
        ctx.fillStyle = '#666';
        ctx.font = '14px monospace';
        ctx.fillText('REBOOTING LOOP PROTOCOL', canvas.width/2, canvas.height/2 + 30);
        return;
    }

    const nightmareVisualsActive = isNightmareModeRef.current || nightmareTeaseRef.current;
    const isTeaseOnly = nightmareTeaseRef.current;

    // --- MAIN DRAW LOOP ---
    // Always start with a fresh state stack
    ctx.save();

    // 1. BACKGROUND
    if (isTeaseOnly) {
        // --- SIMPLIFIED TEASE ---
        // Solid black background (User Request)
        ctx.fillStyle = '#000000'; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } 
    else if (isNightmareModeRef.current) {
        // --- FULL NIGHTMARE ---
        const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0, '#020005'); 
        grad.addColorStop(1, '#1e002e');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Skull & Mist (High Quality only)
        if (!isLowQuality) {
            const time = Date.now() / 1500;
            const skullX = canvas.width / 2;
            const skullY = canvas.height / 2 - 50;
            
            ctx.save();
            ctx.globalAlpha = 0.15 + Math.sin(time) * 0.05;
            ctx.fillStyle = '#a855f7'; 
            
            ctx.beginPath();
            ctx.arc(skullX, skullY, 150, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.rect(skullX - 100, skullY + 50, 200, 150);
            ctx.fill();

            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath();
            ctx.ellipse(skullX - 50, skullY + 20, 40, 50, -0.2, 0, Math.PI * 2);
            ctx.ellipse(skullX + 50, skullY + 20, 40, 50, 0.2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();

            const mistTime = Date.now() / 3000;
            ctx.fillStyle = '#581c87';
            ctx.globalAlpha = 0.1;
            ctx.beginPath();
            ctx.arc(canvas.width/2 + Math.sin(mistTime)*100, canvas.height, 300, 0, Math.PI*2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
        
        // Camera Sway
        const swayTime = Date.now() / 2000;
        const swayAngle = Math.sin(swayTime) * 0.03;
        ctx.translate(canvas.width/2, canvas.height/2);
        ctx.rotate(swayAngle);
        ctx.translate(-canvas.width/2, -canvas.height/2);

    } else {
        // --- NORMAL ---
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Apply Camera Shake
        const shakeX = (Math.random() - 0.5) * cameraRef.current.shake;
        const shakeY = (Math.random() - 0.5) * cameraRef.current.shake;
        ctx.translate(shakeX, shakeY);
        
        if (!isLowQuality) {
            drawThemedBackground(ctx, cameraRef.current.x, level.id);
        } else {
             // Low quality grid
             ctx.strokeStyle = 'rgba(255,255,255,0.05)';
             ctx.lineWidth = 2;
             const gx = -(cameraRef.current.x % 100);
             ctx.beginPath();
             for(let i=gx; i<canvas.width; i+=100) { ctx.moveTo(i,0); ctx.lineTo(i,canvas.height); }
             ctx.stroke();
        }
    }

    // 2. FLOOR
    ctx.fillStyle = nightmareVisualsActive ? '#000' : COLORS.floor;
    ctx.fillRect(0, FLOOR_Y, canvas.width, canvas.height - FLOOR_Y);
    
    ctx.strokeStyle = nightmareVisualsActive ? '#4c1d95' : '#334155';
    ctx.lineWidth = 2;
    const floorOffset = -(cameraRef.current.x % 100);
    ctx.beginPath();
    for (let i = floorOffset; i < canvas.width; i += 100) {
        ctx.moveTo(i, FLOOR_Y);
        ctx.lineTo(i - 200, canvas.height); 
    }
    ctx.stroke();

    const floorLineColor = nightmareVisualsActive ? '#a855f7' : level.color; // Brighter purple for tease
    if (!isLowQuality) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = floorLineColor;
    }
    ctx.strokeStyle = floorLineColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, FLOOR_Y);
    ctx.lineTo(canvas.width, FLOOR_Y);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 3. ENTITIES
    const camX = cameraRef.current.x;
    const startGrid = Math.floor(camX / BLOCK_SIZE);
    const endGrid = startGrid + Math.ceil(canvas.width / BLOCK_SIZE) + 1;

    level.entities.forEach(ent => {
       if (ent.x >= startGrid && ent.x <= endGrid) {
           const drawX = ent.x * BLOCK_SIZE - camX;
           const drawY = FLOOR_Y - (ent.y * BLOCK_SIZE) - BLOCK_SIZE;
           
           if (ent.type === EntityType.BLOCK) {
               ctx.fillStyle = isTeaseOnly ? '#1e002e' : COLORS.block; // Dark purple block during tease
               ctx.fillRect(drawX, drawY, BLOCK_SIZE, BLOCK_SIZE);
               
               ctx.strokeStyle = nightmareVisualsActive ? '#d8b4fe' : level.color;
               ctx.lineWidth = 2;
               ctx.strokeRect(drawX + 4, drawY + 4, BLOCK_SIZE - 8, BLOCK_SIZE - 8);
               
               if (!isLowQuality) {
                    ctx.fillStyle = nightmareVisualsActive ? '#581c87' : level.color;
                    ctx.globalAlpha = 0.2;
                    ctx.fillRect(drawX + 8, drawY + 8, BLOCK_SIZE - 16, BLOCK_SIZE - 16);
                    ctx.globalAlpha = 1;
               }

           } else if (ent.type === EntityType.SPIKE) {
               ctx.fillStyle = '#000';
               ctx.beginPath();
               ctx.moveTo(drawX + 5, drawY + BLOCK_SIZE);
               ctx.lineTo(drawX + BLOCK_SIZE / 2, drawY + 5);
               ctx.lineTo(drawX + BLOCK_SIZE - 5, drawY + BLOCK_SIZE);
               ctx.fill();
               
               ctx.lineWidth = 2;
               ctx.strokeStyle = nightmareVisualsActive ? '#a855f7' : COLORS.spike;
               ctx.stroke();
               
               ctx.fillStyle = nightmareVisualsActive ? '#581c87' : COLORS.spike;
               ctx.beginPath();
               ctx.moveTo(drawX + 15, drawY + BLOCK_SIZE - 5);
               ctx.lineTo(drawX + BLOCK_SIZE / 2, drawY + 20);
               ctx.lineTo(drawX + BLOCK_SIZE - 15, drawY + BLOCK_SIZE - 5);
               ctx.fill();
           } else if (ent.type === EntityType.PORTAL) {
               const portalColor = level.color;
               const time = Date.now() / 200;
               const centerX = drawX + BLOCK_SIZE / 2;
               const centerY = drawY + BLOCK_SIZE; 
               
               const gradient = ctx.createRadialGradient(centerX, centerY - BLOCK_SIZE, 10, centerX, centerY - BLOCK_SIZE, 80);
               gradient.addColorStop(0, '#fff');
               gradient.addColorStop(0.3, portalColor);
               gradient.addColorStop(1, 'transparent');
               
               ctx.fillStyle = gradient;
               ctx.globalAlpha = 0.8;
               ctx.beginPath();
               ctx.ellipse(centerX, centerY - BLOCK_SIZE, 30 + Math.sin(time)*5, 80, 0, 0, Math.PI * 2);
               ctx.fill();
               ctx.globalAlpha = 1;

               ctx.strokeStyle = '#fff';
               ctx.lineWidth = 3;
               for(let i=0; i<3; i++) {
                   ctx.beginPath();
                   const radiusX = 20 + i * 5;
                   const radiusY = 60 + i * 5;
                   ctx.ellipse(centerX, centerY - BLOCK_SIZE, radiusX, radiusY, Math.sin(time * 0.5) * 0.2, 0, Math.PI * 2);
                   ctx.stroke();
               }

               const darknessAlpha = Math.min((winCount * 0.2), 0.8);
               if (darknessAlpha > 0) {
                   ctx.fillStyle = `rgba(0, 0, 0, ${darknessAlpha})`;
                   ctx.beginPath();
                   ctx.ellipse(centerX, centerY - BLOCK_SIZE, 30, 80, 0, 0, Math.PI * 2);
                   ctx.fill();
               }
           }
       }
    });

    // 4. PLAYER
    const player = playerRef.current;
    if (!player.isDead) {
        // Draw Trail
        player.trail.forEach(t => {
            const tx = t.x - camX;
            const ty = FLOOR_Y - t.y - BLOCK_SIZE;
            
            ctx.save();
            ctx.translate(tx + BLOCK_SIZE/2, ty + BLOCK_SIZE/2);
            ctx.rotate(t.rotation * Math.PI / 180);
            
            ctx.fillStyle = playerColor;
            ctx.globalAlpha = t.alpha * 0.4;
            
            if (level.mode === 'CUBE') {
                 ctx.fillRect(-BLOCK_SIZE/2 + 4, -BLOCK_SIZE/2 + 4, BLOCK_SIZE - 8, BLOCK_SIZE - 8);
            } else {
                 ctx.beginPath();
                 ctx.moveTo(10, 0);
                 ctx.lineTo(-10, 10);
                 ctx.lineTo(-10, -10);
                 ctx.fill();
            }
            
            ctx.restore();
        });
        ctx.globalAlpha = 1;

        const drawPx = player.x - camX;
        const drawPy = FLOOR_Y - player.y - BLOCK_SIZE;

        ctx.save(); // Local save for player transform
        ctx.translate(drawPx + BLOCK_SIZE/2, drawPy + BLOCK_SIZE/2);
        ctx.rotate(player.rotation * Math.PI / 180);
        
        if (!isLowQuality) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = playerColor;
        }
        drawPlayerSkin(ctx, BLOCK_SIZE);
        ctx.restore();
    }

    // 5. PARTICLES
    if (!isLowQuality) {
        drawParticles(ctx);
    }
    
    // 6. NIGHTMARE VIGNETTE
    if (isNightmareModeRef.current) {
        // Reset transform implicitly handled by drawing overlay on top of screen space
        // But we need to untransform the camera shake/sway first to draw screen-space overlay?
        // Actually, we are currently inside the global ctx.save() stack which has the sway/shake.
        // We need to pop that to draw the HUD-like vignette, OR just invert/reset transform.
        // Easiest is to restore now, then draw vignette.
        ctx.restore(); 
        
        // Now we are in clean screen space
        const playerScreenX = player.x - camX + BLOCK_SIZE/2;
        const playerScreenY = FLOOR_Y - player.y - BLOCK_SIZE/2;
        
        const radG = ctx.createRadialGradient(playerScreenX, playerScreenY, 80, playerScreenX, playerScreenY, 400);
        radG.addColorStop(0, 'rgba(0,0,0,0)');
        radG.addColorStop(0.3, 'rgba(0,0,0,0.8)');
        radG.addColorStop(1, 'rgba(0,0,0,1)');
        
        ctx.fillStyle = radG;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
        // Just restore the global stack
        ctx.restore();
    }

    // 7. FPS (HUD)
    if (user.settings.showFPS) {
        ctx.fillStyle = 'lime';
        ctx.font = 'bold 16px monospace';
        ctx.fillText(`FPS: ${fpsRef.current}`, 10, 20);
    }
  };

  const drawThemedBackground = (ctx: CanvasRenderingContext2D, camX: number, themeId: number) => {
      const time = Date.now() / 1000;
      
      if (themeId === 1) {
          ctx.strokeStyle = 'rgba(74, 222, 128, 0.1)';
          ctx.lineWidth = 1;
          const gridSize = 60;
          const offX = -(camX * 0.5) % gridSize;
          
          ctx.beginPath();
          for (let x = offX; x < ctx.canvas.width; x += gridSize) {
              ctx.moveTo(x, 0);
              ctx.lineTo(x, ctx.canvas.height);
          }
          for (let y = 0; y < ctx.canvas.height; y += gridSize) {
              ctx.moveTo(0, y);
              ctx.lineTo(ctx.canvas.width, y);
          }
          ctx.stroke();
      } else if (themeId === 2) {
          ctx.strokeStyle = 'rgba(244, 114, 182, 0.2)';
          ctx.lineWidth = 2;
          const spacing = 300;
          const offX = -(camX * 0.3) % spacing;
          
          for (let i = 0; i < 5; i++) {
              const x = offX + i * spacing;
              const y = 150 + Math.sin(time + i) * 50;
              ctx.beginPath();
              ctx.moveTo(x, y);
              ctx.lineTo(x + 50, y - 80);
              ctx.lineTo(x + 100, y);
              ctx.closePath();
              ctx.stroke();
          }
          
          const sunX = ctx.canvas.width - 150 - (camX * 0.05);
          const sunGradient = ctx.createLinearGradient(0, 0, 0, 400);
          sunGradient.addColorStop(0, '#fbbf24');
          sunGradient.addColorStop(1, '#f472b6');
          ctx.fillStyle = sunGradient;
          ctx.globalAlpha = 0.3;
          ctx.beginPath();
          ctx.arc(sunX, 200, 80, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;

      } else if (themeId === 3) {
          ctx.fillStyle = '#fff';
          for (let i = 0; i < 50; i++) {
              const starX = ((i * 137.5 + camX * 0.1) % ctx.canvas.width + ctx.canvas.width) % ctx.canvas.width;
              const starY = (i * 293.1) % (FLOOR_Y - 50);
              const size = (i % 3) + 1;
              ctx.globalAlpha = 0.5 + Math.sin(time * 5 + i) * 0.5;
              ctx.fillRect(starX, starY, size, size);
          }
          ctx.globalAlpha = 1;
      } else if (themeId === 4) {
          ctx.fillStyle = '#b45309'; 
          const spacing = 400;
          const offX = -(camX * 0.2) % spacing;
          
          for (let i = 0; i < 4; i++) {
              const x = offX + i * spacing;
              const h = 200 + Math.sin(i * 132) * 100;
              ctx.globalAlpha = 0.1;
              ctx.fillRect(x, FLOOR_Y - h, 60, h);
              ctx.fillRect(x + 100, 0, 40, h * 0.8);
          }
          ctx.globalAlpha = 1;

          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 1;
          for (let i = 0; i < 10; i++) {
               const x = ((i * 200 + camX * 0.8) % ctx.canvas.width + ctx.canvas.width) % ctx.canvas.width;
               const y = (i * 73) % FLOOR_Y;
               ctx.beginPath();
               ctx.moveTo(x, y);
               ctx.lineTo(x - 50, y);
               ctx.stroke();
          }
      }
  };

  const drawParticles = (ctx: CanvasRenderingContext2D) => {
     particlesRef.current.forEach(p => {
         ctx.globalAlpha = p.life;
         ctx.fillStyle = p.color;
         ctx.beginPath();
         ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
     });
     ctx.globalAlpha = 1;
  };

  return (
    <div className="relative w-full h-full bg-slate-900 flex flex-col items-center justify-center">
      <div className="absolute top-4 w-full px-10 flex items-center justify-between z-10 pointer-events-none">
          <div className="w-full h-6 bg-slate-800/80 rounded-full overflow-hidden border-2 border-slate-600 backdrop-blur-sm">
              <div 
                ref={progressBarRef}
                className="h-full bg-cyan-400"
                style={{ 
                    width: `0%`,
                    backgroundColor: playerColor,
                    boxShadow: `0 0 15px ${playerColor}`
                }}
              ></div>
          </div>
          <div ref={progressTextRef} className="ml-4 font-mono text-xl font-bold text-white drop-shadow-md w-16 text-right">
            0%
          </div>
      </div>
      
      <div className="absolute top-4 right-10 z-20 pointer-events-auto">
        <button onClick={onExit} className="bg-slate-800/80 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded border border-slate-600">
            ||
        </button>
      </div>

      <canvas 
        ref={canvasRef}
        width={1000}
        height={600}
        className="w-full max-w-[1000px] aspect-video bg-black rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.5)] border-2 border-slate-700"
      />
    </div>
  );
};

export default GameCanvas;
