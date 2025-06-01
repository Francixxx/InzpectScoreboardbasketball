import React, { useState, useEffect, useRef } from 'react';
import './BasketballScoreboard.css';

const Scoreboard = () => {
  // Game state
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [homeTeamName, setHomeTeamName] = useState('HOME');
  const [awayTeamName, setAwayTeamName] = useState('AWAY');
  const [homeFouls, setHomeFouls] = useState(0);
  const [awayFouls, setAwayFouls] = useState(0);
  const [possession, setPossession] = useState('home'); // 'home' or 'away'
  const [isOvertime, setIsOvertime] = useState(false);
  const [gameTimeInput, setGameTimeInput] = useState('12:00:00');
  const [shotTimeInput, setShotTimeInput] = useState('24');
  const [isEditingGameTime, setIsEditingGameTime] = useState(false);
  const [isEditingShotTime, setIsEditingShotTime] = useState(false);
  const [homeTimeouts, setHomeTimeouts] = useState(0);
  const [awayTimeouts, setAwayTimeouts] = useState(0);

  
  // Game clock
  const [gameTime, setGameTime] = useState(12 * 60 * 100); // 12 minutes in hundredths of seconds
  const [isGameRunning, setIsGameRunning] = useState(false);
  
  // Shot clock
  const [shotTime, setShotTime] = useState(24);
  const [isShotRunning, setIsShotRunning] = useState(false);
  
  // Period
  const [period, setPeriod] = useState(1);
  
  const gameTimerRef = useRef(null);
  const shotTimerRef = useRef(null);
  const buzzerRef = useRef(null);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  // Audio elements for external sounds
  const buzzerAudioRef = useRef(null);
  const scoreAudioRef = useRef(null);
  const audioContextRef = useRef(null);
  // Initialize audio elements
  useEffect(() => {
  // Initialize Audio Context for generating sounds
  const initAudio = () => {
    try {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    } catch (error) {
      console.log('Audio context not supported:', error);
    }
  };
  const handleFirstInteraction = () => {
    initAudio();
    document.removeEventListener('click', handleFirstInteraction);
    document.removeEventListener('keydown', handleFirstInteraction);
  };

  document.addEventListener('click', handleFirstInteraction);
  document.addEventListener('keydown', handleFirstInteraction);

  return () => {
    document.removeEventListener('click', handleFirstInteraction);
    document.removeEventListener('keydown', handleFirstInteraction);
  };
}, []);

  // Format time display
  const formatTime = (hundredths) => {
    const totalSeconds = Math.floor(hundredths / 100);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    const centisecs = hundredths % 100;
    return `${mins}:${secs.toString().padStart(2, '0')}:${centisecs.toString().padStart(2, '0')}`;
  };

  const parseTimeInput = (timeString) => {
    const parts = timeString.split(':').map(num => parseInt(num) || 0);
    
    if (parts.length === 3) {
      // MM:SS:CC format
      const [mins, secs, centisecs] = parts;
      return Math.max(0, mins * 60 * 100 + Math.min(59, secs) * 100 + Math.min(99, centisecs));
    } else if (parts.length === 2) {
      // MM:SS format (assume 00 centiseconds)
      const [mins, secs] = parts;
      return Math.max(0, mins * 60 * 100 + Math.min(59, secs) * 100);
    } else {
      // Single number (assume seconds)
      return Math.max(0, parseInt(timeString) * 100 || 0);
    }
  };
  
  const handleGameTimeEdit = () => {
    if (isEditingGameTime) {
      const newTime = parseTimeInput(gameTimeInput);
      setGameTime(newTime);
      setIsEditingGameTime(false);
    } else {
      setGameTimeInput(formatTime(gameTime));
      setIsEditingGameTime(true);
    }
  };
  
  const handleShotTimeEdit = () => {
    if (isEditingShotTime) {
      const newTime = Math.max(0, Math.min(24, parseInt(shotTimeInput) || 0));
      setShotTime(newTime);
      setIsEditingShotTime(false);
    } else {
      setShotTimeInput(shotTime.toString());
      setIsEditingShotTime(true);
    }
  };

  // Game timer effect
  useEffect(() => {
    if (isGameRunning && gameTime > 0) {
      gameTimerRef.current = setInterval(() => {
        setGameTime(prev => {
          if (prev <= 1) {
            setIsGameRunning(false);
            playBuzzer();
            return 0;
          }
          return prev - 1;
        });
      }, 10); // 10ms for hundredths precision
    } else {
      clearInterval(gameTimerRef.current);
    }
    
    return () => clearInterval(gameTimerRef.current);
  }, [isGameRunning, gameTime]);

  // Shot clock timer effect
  useEffect(() => {
    if (isShotRunning && shotTime > 0) {
      shotTimerRef.current = setInterval(() => {
        setShotTime(prev => {
          if (prev <= 1) {
            setIsShotRunning(false);
            playBuzzer();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(shotTimerRef.current);
    }
    
    return () => clearInterval(shotTimerRef.current);
  }, [isShotRunning, shotTime]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (event) => {
      const key = event.key.toLowerCase();
      
      // Don't trigger if user is typing in an input field
      if (event.target.tagName === 'INPUT') return;
      
      switch (key) {
        // Game Clock Controls
        case ' ':
        case 'spacebar':
          event.preventDefault();
          startStopGame();
          break;
        case 'r':
          resetGameClock();
          break;
        case 'b':
          playBuzzer();
          break;
          
        // Shot Clock Controls
        case 's':
          startStopShotClock();
          break;
        case '2':
          resetShotClock();
          break;
        case '1':
          shotClock14();
          break;
          
        // Away Team Scoring (Q, W, E, T)
        case 'q':
          addScore('away', 1);
          break;
        case 'w':
          addScore('away', 2);
          break;
        case 'e':
          addScore('away', 3);
          break;
        case 't':
          subtractScore('away', 1);
          break;
          
        // Home Team Scoring (U, I, O, Y)
        case 'u':
          addScore('home', 1);
          break;
        case 'i':
          addScore('home', 2);
          break;
        case 'o':
          addScore('home', 3);
          break;
        case 'y':
          subtractScore('home', 1);
          break;
          
        // Foul Controls (A, Z for away, K, M for home)
        case 'a':
          addFoul('away');
          break;
        case 'z':
          subtractFoul('away');
          break;
        case 'k':
          addFoul('home');
          break;
        case 'm':
          subtractFoul('home');
          break;
          
        // Game Controls
        case 'p':
          setPossession(possession === 'home' ? 'away' : 'home');
          break;
        case 'n':
          nextPeriod();
          break;
        case 'x':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            resetGame();
          }
          break;
          
        // Help Toggle
        case 'h':
        case '?':
          setShowKeyboardHelp(!showKeyboardHelp);
          break;
        case 'escape':
          if (showKeyboardHelp) {
            setShowKeyboardHelp(false);
          }
          break;
          
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [isGameRunning, isShotRunning, possession, showKeyboardHelp]);

  // Play buzzer sound (visual indication + your custom sound)
// Replace the playBuzzer function with this NBA arena-style buzzer:
const playBuzzer = () => {
  // Visual buzzer effect
  if (buzzerRef.current) {
    buzzerRef.current.classList.add('buzzer-active');
    setTimeout(() => {
      buzzerRef.current?.classList.remove('buzzer-active');
    }, 1500);
  }

  // Generate NBA-style arena buzzer sound
  if (audioContextRef.current) {
    try {
      const ctx = audioContextRef.current;
      const currentTime = ctx.currentTime;
      
      // Create the main buzzer tone - sharp and penetrating like NBA arenas
      const createMainBuzzer = () => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        const distortion = ctx.createWaveShaper();
        const filter = ctx.createBiquadFilter();
        
        // Audio chain: oscillator -> distortion -> filter -> gain -> output
        oscillator.connect(distortion);
        distortion.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        // Square wave for that sharp, cutting buzzer sound
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(440, currentTime); // A4 - sharp and clear
        
        // Add slight distortion for arena speaker effect
        const makeDistortionCurve = (amount) => {
          const samples = 44100;
          const curve = new Float32Array(samples);
          const deg = Math.PI / 180;
          for (let i = 0; i < samples; i++) {
            const x = (i * 2) / samples - 1;
            curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
          }
          return curve;
        };
        distortion.curve = makeDistortionCurve(4);
        distortion.oversample = '4x';
        
        // High-pass filter to make it sharp and cutting
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(200, currentTime);
        filter.Q.setValueAtTime(1, currentTime);
        
        // Sharp attack, sustain, quick release
        gainNode.gain.setValueAtTime(0, currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.6, currentTime + 0.01);
        gainNode.gain.setValueAtTime(0.5, currentTime + 1.2);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 1.3);
        
        oscillator.start(currentTime);
        oscillator.stop(currentTime + 1.3);
      };
      
      // Add harmonic at octave for fullness
      const createHarmonic = () => {
        const harmonic = ctx.createOscillator();
        const harmonicGain = ctx.createGain();
        const harmonicFilter = ctx.createBiquadFilter();
        
        harmonic.connect(harmonicFilter);
        harmonicFilter.connect(harmonicGain);
        harmonicGain.connect(ctx.destination);
        
        harmonic.type = 'square';
        harmonic.frequency.setValueAtTime(880, currentTime); // Octave higher
        
        harmonicFilter.type = 'lowpass';
        harmonicFilter.frequency.setValueAtTime(2000, currentTime);
        
        harmonicGain.gain.setValueAtTime(0, currentTime);
        harmonicGain.gain.exponentialRampToValueAtTime(0.2, currentTime + 0.01);
        harmonicGain.gain.setValueAtTime(0.15, currentTime + 1.2);
        harmonicGain.gain.exponentialRampToValueAtTime(0.01, currentTime + 1.3);
        
        harmonic.start(currentTime);
        harmonic.stop(currentTime + 1.3);
      };
      
      // Add sub-harmonic for that deep arena rumble
      const createSubHarmonic = () => {
        const sub = ctx.createOscillator();
        const subGain = ctx.createGain();
        
        sub.connect(subGain);
        subGain.connect(ctx.destination);
        
        sub.type = 'sawtooth';
        sub.frequency.setValueAtTime(220, currentTime); // Octave lower
        
        subGain.gain.setValueAtTime(0, currentTime);
        subGain.gain.exponentialRampToValueAtTime(0.3, currentTime + 0.02);
        subGain.gain.setValueAtTime(0.25, currentTime + 1.2);
        subGain.gain.exponentialRampToValueAtTime(0.01, currentTime + 1.3);
        
        sub.start(currentTime);
        sub.stop(currentTime + 1.3);
      };
      
      // Create slight reverb effect for arena ambience
      const createReverb = () => {
        const convolver = ctx.createConvolver();
        const reverbGain = ctx.createGain();
        
        // Create impulse response for reverb
        const length = ctx.sampleRate * 0.3; // 300ms reverb
        const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
        
        for (let channel = 0; channel < 2; channel++) {
          const channelData = impulse.getChannelData(channel);
          for (let i = 0; i < length; i++) {
            channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
          }
        }
        
        convolver.buffer = impulse;
        
        // Connect a separate oscillator through reverb
        const reverbOsc = ctx.createOscillator();
        reverbOsc.connect(convolver);
        convolver.connect(reverbGain);
        reverbGain.connect(ctx.destination);
        
        reverbOsc.type = 'square';
        reverbOsc.frequency.setValueAtTime(440, currentTime);
        
        reverbGain.gain.setValueAtTime(0.1, currentTime);
        reverbGain.gain.exponentialRampToValueAtTime(0.01, currentTime + 1.5);
        
        reverbOsc.start(currentTime);
        reverbOsc.stop(currentTime + 1.3);
      };
      
      // Create the full NBA arena buzzer sound
      createMainBuzzer();
      createHarmonic();
      createSubHarmonic();
      createReverb();
      
    } catch (error) {
      console.log('Error playing buzzer sound:', error);
    }
  }
};

  // Play score sound effect
  const playScoreSound = (points) => {
    if (scoreAudioRef.current) {
      scoreAudioRef.current.currentTime = 0; // Reset to beginning
      scoreAudioRef.current.play().catch(error => {
        console.log('Error playing score sound:', error);
      });
    }
  };

  // Game controls
  const startStopGame = () => {
    setIsGameRunning(!isGameRunning);
    if (!isGameRunning && shotTime === 0) {
      setShotTime(24);
    }
  };

  const resetGameClock = () => {
    setIsGameRunning(false);
    const resetTime = isOvertime ? 5 * 60 * 100 : 12 * 60 * 100;
    setGameTime(resetTime);
    setGameTimeInput(formatTime(resetTime));
  };

  // Shot clock controls
  const startStopShotClock = () => {
    setIsShotRunning(!isShotRunning);
  };

  const resetShotClock = () => {
    setIsShotRunning(false);
    setShotTime(24);
    setShotTimeInput('24');
  };
  
  const shotClock14 = () => {
    setShotTime(14);
    setIsShotRunning(false);
  };

  // Score controls
  const addScore = (team, points) => {
    if (team === 'home') {
      setHomeScore(prev => prev + points);
    } else {
      setAwayScore(prev => prev + points);
    }
    // Reset shot clock when score is made
    setShotTime(24);
    setIsShotRunning(false);
    // Play score sound
    playScoreSound(points);
  };

  const subtractScore = (team, points) => {
    if (team === 'home') {
      setHomeScore(prev => Math.max(0, prev - points));
    } else {
      setAwayScore(prev => Math.max(0, prev - points));
    }
    // Play different sound for subtraction
    playScoreSound(-1);
  };

  // Foul controls
  const addFoul = (team) => {
    if (team === 'home') {
      setHomeFouls(prev => Math.min(10, prev + 1));
    } else {
      setAwayFouls(prev => Math.min(10, prev + 1));
    }
  };

  const subtractFoul = (team) => {
    if (team === 'home') {
      setHomeFouls(prev => Math.max(0, prev - 1));
    } else {
      setAwayFouls(prev => Math.max(0, prev - 1));
    }
  };
// Timeout controls
const addTimeout = (team) => {
  if (team === 'home') {
    setHomeTimeouts(prev => Math.min(7, prev + 1));
  } else {
    setAwayTimeouts(prev => Math.min(7, prev + 1));
  }
};

const subtractTimeout = (team) => {
  if (team === 'home') {
    setHomeTimeouts(prev => Math.max(0, prev - 1));
  } else {
    setAwayTimeouts(prev => Math.max(0, prev - 1));
  }
};

  // Game state controls
  const nextPeriod = () => {
    if (period < 4) {
      setPeriod(prev => prev + 1);
      setGameTime(12 * 60 * 100);
      setIsOvertime(false);
    } else if (!isOvertime) {
      setIsOvertime(true);
      setPeriod(5);
      setGameTime(5 * 60 * 100);
    }
    setIsGameRunning(false);
    setShotTime(24);
    setIsShotRunning(false);
  };

  const resetGame = () => {
    setHomeScore(0);
    setAwayScore(0);
    setHomeFouls(0);
    setAwayFouls(0);
    setPeriod(1);
    setGameTime(12 * 60 * 100);
    setShotTime(24);
    setIsGameRunning(false);
    setIsShotRunning(false);
    setIsOvertime(false);
    setPossession('home');
    setGameTimeInput('12:00:00');
    setShotTimeInput('24');
  };

  return (
    <div className="scoreboard-container">
      <div className="scoreboard-header">
        
      </div>

      {/* Main Scoreboard Display */}
      <div className="main-display">
        {/* Away Team */}
        <div className="team-section">
          <input
            type="text"
            value={awayTeamName}
            onChange={(e) => setAwayTeamName(e.target.value)}
            className="team-name-input"
            maxLength="12"
          />
          <div className="score-display">{awayScore}</div>
          <div className="foul-display">
            <span>FOULS</span>
            <div className="foul-count">{awayFouls}</div>
          </div>
          {possession === 'away' && <div className="possession-indicator">●</div>}
          <div className="timeout-display">
        <span>TIMEOUTS</span>
        <div className="timeout-count">{awayTimeouts}</div>
      </div>

        </div>

        {/* Center Info */}
        <div className="center-section">
          <div className="game-clock">
            <div className="period-display">
              {isOvertime ? 'OT' : `QUARTER ${period}`}
            </div>
            {isEditingGameTime ? (
              <input
                type="text"
                value={gameTimeInput}
                onChange={(e) => setGameTimeInput(e.target.value)}
                onBlur={handleGameTimeEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleGameTimeEdit();
                  if (e.key === 'Escape') {
                    setIsEditingGameTime(false);
                    setGameTimeInput(formatTime(gameTime));
                  }
                }}
                className="time-input"
                placeholder="MM:SS:CC"
                autoFocus
              />
            ) : (
              <div 
                className="time-display" 
                onClick={handleGameTimeEdit}
                title="Click to edit time"
              >
                {formatTime(gameTime)}
              </div>
            )}
          </div>
          
          <div className="shot-clock">
            {isEditingShotTime ? (
              <input
                type="number"
                value={shotTimeInput}
                onChange={(e) => setShotTimeInput(e.target.value)}
                onBlur={handleShotTimeEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleShotTimeEdit();
                  if (e.key === 'Escape') {
                    setIsEditingShotTime(false);
                    setShotTimeInput(shotTime.toString());
                  }
                }}
                className="shot-input"
                min="0"
                max="24"
                autoFocus
              />
            ) : (
              <div 
                className="shot-time-display" 
                onClick={handleShotTimeEdit}
                title="Click to edit shot clock"
              >
                {shotTime}
              </div>
            )}
            <div className="shot-label">SHOT CLOCK</div>
          </div>
        </div>

        {/* Home Team */}
        <div className="team-section">
          <input
            type="text"
            value={homeTeamName}
            onChange={(e) => setHomeTeamName(e.target.value)}
            className="team-name-input"
            maxLength="12"
          />
          <div className="score-display">{homeScore}</div>
          <div className="foul-display">
            <span>FOULS</span>
            <div className="foul-count">{homeFouls}</div>
          </div>
          <div className="timeout-display">
  <span>TIMEOUTS</span>
  <div className="timeout-count">{homeTimeouts}</div>
</div>
          {possession === 'home' && <div className="possession-indicator">●</div>}
        </div>

      </div>

      {/* Control Panels */}
      <div className="controls-container">
        {/* Game Clock Controls */}
        <div className="control-panel">
          <h3>GAME CLOCK</h3>
          <div className="control-buttons">
            <button onClick={startStopGame} className={isGameRunning ? 'stop-btn' : 'start-btn'}>
              {isGameRunning ? 'STOP' : 'START'}
            </button>
            <button onClick={resetGameClock}>RESET</button>
            <button onClick={() => playBuzzer()}>BUZZER</button>
          </div>
        </div>

        {/* Shot Clock Controls */}
        <div className="control-panel">
          <h3>SHOT CLOCK</h3>
          <div className="control-buttons">
            <button onClick={startStopShotClock} className={isShotRunning ? 'stop-btn' : 'start-btn'}>
              {isShotRunning ? 'STOP' : 'START'}
            </button>
            <button onClick={resetShotClock}>24</button>
            <button onClick={shotClock14}>14</button>
          </div>
        </div>

        {/* Score Controls */}
        <div className="control-panel">
          <h3>SCORING</h3>
          <div className="score-controls">
            <div className="team-controls">
              <span>{awayTeamName}</span>
              <div className="control-buttons">
                <button onClick={() => addScore('away', 1)}>+1</button>
                <button onClick={() => addScore('away', 2)}>+2</button>
                <button onClick={() => addScore('away', 3)}>+3</button>
                <button onClick={() => subtractScore('away', 1)}>-1</button>
              </div>
            </div>
            <div className="team-controls">
              <span>{homeTeamName}</span>
              <div className="control-buttons">
                <button onClick={() => addScore('home', 1)}>+1</button>
                <button onClick={() => addScore('home', 2)}>+2</button>
                <button onClick={() => addScore('home', 3)}>+3</button>
                <button onClick={() => subtractScore('home', 1)}>-1</button>
              </div>
            </div>
          </div>
        </div>

        {/* Foul Controls */}
        <div className="control-panel">
          <h3>FOULS</h3>
          <div className="foul-controls">
            <div className="team-controls">
              <span>{awayTeamName}</span>
              <div className="control-buttons">
                <button onClick={() => addFoul('away')}>+</button>
                <button onClick={() => subtractFoul('away')}>-</button>
              </div>
            </div>
            <div className="team-controls">
              <span>{homeTeamName}</span>
              <div className="control-buttons">
                <button onClick={() => addFoul('home')}>+</button>
                <button onClick={() => subtractFoul('home')}>-</button>
              </div>
            </div>
          </div>
        </div>
        {/* Timeout Controls */}
<div className="control-panel">
  <h3>TIMEOUTS</h3>
  <div className="timeout-controls">
    <div className="team-controls">
      <span>{awayTeamName}</span>
      <div className="control-buttons">
        <button onClick={() => addTimeout('away')}>+</button>
        <button onClick={() => subtractTimeout('away')}>-</button>
      </div>
    </div>
    <div className="team-controls">
      <span>{homeTeamName}</span>
      <div className="control-buttons">
        <button onClick={() => addTimeout('home')}>+</button>
        <button onClick={() => subtractTimeout('home')}>-</button>
      </div>
    </div>
  </div>
</div>



        {/* Possession & Game Controls */}
        <div className="control-panel">
          <h3>GAME CONTROLS</h3>
          <div className="control-buttons">
            <button onClick={() => setPossession(possession === 'home' ? 'away' : 'home')}>
              POSSESSION
            </button>
            <button onClick={nextPeriod}>NEXT QUARTER</button>
            <button onClick={resetGame} className="reset-btn">RESET GAME</button>
          </div>
        </div>
      </div>

      {/* Buzzer Indicator */}
      <div ref={buzzerRef} className="buzzer-indicator">
        BUZZER!
      </div>

      {/* Keyboard Help Toggle */}
      <div className="keyboard-help-toggle">
        <button 
          onClick={() => setShowKeyboardHelp(!showKeyboardHelp)}
          className="help-btn"
          title="Keyboard Shortcuts (H)"
        >
          {showKeyboardHelp ? 'Hide' : 'Show'} Keyboard Shortcuts
        </button>
      </div>

      {/* Keyboard Help Panel */}
      {showKeyboardHelp && (
        <div className="keyboard-help-panel" onClick={() => setShowKeyboardHelp(false)}>
          <div className="help-content" onClick={(e) => e.stopPropagation()}>
            <div className="help-header">
              <h3>⌨️ KEYBOARD SHORTCUTS</h3>
              <button 
                className="close-help-btn"
                onClick={() => setShowKeyboardHelp(false)}
                title="Close (ESC)"
              >
                ✕
              </button>
            </div>
            <div className="help-sections">
              <div className="help-section">
                <h4>Game Clock</h4>
                <p><kbd>SPACE</kbd> Start/Stop</p>
                <p><kbd>R</kbd> Reset</p>
                <p><kbd>B</kbd> Buzzer</p>
              </div>
              
              <div className="help-section">
                <h4>Shot Clock</h4>
                <p><kbd>S</kbd> Start/Stop</p>
                <p><kbd>2</kbd> Reset (24s)</p>
                <p><kbd>1</kbd> Set 14s</p>
              </div>
              
              <div className="help-section">
                <h4>{awayTeamName} Scoring</h4>
                <p><kbd>Q</kbd> +1 Point</p>
                <p><kbd>W</kbd> +2 Points</p>
                <p><kbd>E</kbd> +3 Points</p>
                <p><kbd>T</kbd> -1 Point</p>
              </div>
              
              <div className="help-section">
                <h4>{homeTeamName} Scoring</h4>
                <p><kbd>U</kbd> +1 Point</p>
                <p><kbd>I</kbd> +2 Points</p>
                <p><kbd>O</kbd> +3 Points</p>
                <p><kbd>Y</kbd> -1 Point</p>
              </div>
              
              <div className="help-section">
                <h4>Fouls</h4>
                <p><kbd>A</kbd> {awayTeamName} +Foul</p>
                <p><kbd>Z</kbd> {awayTeamName} -Foul</p>
                <p><kbd>K</kbd> {homeTeamName} +Foul</p>
                <p><kbd>M</kbd> {homeTeamName} -Foul</p>
              </div>
              
              <div className="help-section">
                <h4>Game Control</h4>
                <p><kbd>P</kbd> Toggle Possession</p>
                <p><kbd>N</kbd> Next Period</p>
                <p><kbd>Ctrl+X</kbd> Reset Game</p>
                <p><kbd>H</kbd> Toggle Help</p>
                <p><kbd>ESC</kbd> Close Help</p>
              </div>
            </div>
            <div className="help-note">
              <p>💡 Tip: Keyboard shortcuts don't work when typing in team name fields</p>
              <p>🚪 Click outside this panel or press <kbd>ESC</kbd> to close</p>
              <p>🔊 Custom buzzer sounds will play automatically</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Scoreboard;