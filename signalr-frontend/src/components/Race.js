import React, { useState, useEffect } from 'react';
import signalRService from '../services/signalRService';
import './Race.css';

const Race = () => {
    const [username, setUsername] = useState('');
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const [error, setError] = useState(null);
    const [isRacing, setIsRacing] = useState(false);
    const [players, setPlayers] = useState([]);
    const [text, setText] = useState('');
    const [input, setInput] = useState('');
    const [countdown, setCountdown] = useState(null);
    const [playerProgress, setPlayerProgress] = useState({});
    const [connectionId, setConnectionId] = useState(null);
    const [ranking, setRanking] = useState([]);

    useEffect(() => {
        let mounted = true;
        let retryTimeout;

        const setupConnection = async () => {
            try {
                await signalRService.startConnection();
                if (!mounted) return;

                setConnectionStatus('connected');
                setError(null);

                // Add event handlers
                signalRService.addHandler('ReceiveProgress', (playerId, progress) => {
                    if (!mounted) return;
                    console.log('Progress received:', playerId, progress);
                    setPlayerProgress(prev => ({
                        ...prev,
                        [playerId]: progress
                    }));
                });

                signalRService.addHandler('PlayerJoined', (player) => {
                    if (!mounted) return;
                    console.log('Player joined:', player);
                    setPlayers(prev => {
                        const existingPlayer = prev.find(p => p.id === player.id);
                        if (existingPlayer) {
                            return prev.map(p => p.id === player.id ? { ...p, ...player } : p);
                        }
                        return [...prev, { ...player, id: player.id || player.connectionId }];
                    });
                    if (player.username === username) {
                        setConnectionId(player.id || player.connectionId);
                        console.log('Connection ID set:', player.id || player.connectionId);
                    }
                });

                signalRService.addHandler('PlayerLeft', (playerId) => {
                    console.log('Player left:', playerId);
                    setPlayers(prev => prev.filter(p => p.id !== playerId));
                    setPlayerProgress(prev => {
                        const newProgress = { ...prev };
                        delete newProgress[playerId];
                        return newProgress;
                    });
                });

                signalRService.addHandler('RaceStarted', (text) => {
                    console.log('Race started with text:', text);
                    setText(text);
                    setIsRacing(true);
                    setInput('');
                    setPlayerProgress({});
                });

                signalRService.addHandler('RaceEnded', () => {
                    console.log('Race ended');
                    setIsRacing(false);
                    setInput('');
                    setText('');
                    setPlayerProgress({});
                });

                signalRService.addHandler('Countdown', (count) => {
                    console.log('Countdown:', count);
                    if (count === 0) {
                        setCountdown(null);
                    } else {
                        setCountdown(count);
                    }
                });

                signalRService.addHandler('AllPlayersReady', () => {
                    console.log('All players are ready');
                    setCountdown(3);
                });

                signalRService.addHandler('UpdatePlayers', (playersList) => {
                    console.log('UpdatePlayers:', playersList);
                    setPlayers(playersList.map(player => ({
                        ...player,
                        id: player.id || player.connectionId
                    })));
                });

                signalRService.addHandler('RankingUpdated', (rankingPlayers) => {
                    console.log('Ranking updated:', rankingPlayers);
                    const usernames = rankingPlayers.map(player => player.username || 'Unknown Player');
                    setRanking(usernames);
                });

            } catch (err) {
                if (!mounted) return;
                console.error('Failed to start connection:', err);
                setConnectionStatus('disconnected');
                setError('Failed to connect to the server');

                // Retry connection after delay
                retryTimeout = setTimeout(setupConnection, 2000);
            }
        };

        setupConnection();

        return () => {
            mounted = false;
            if (retryTimeout) {
                clearTimeout(retryTimeout);
            }
            signalRService.stopConnection();
        };
    }, []);

    useEffect(() => {
        if (text) {
            console.log('Race text received:', text);
        }
    }, [text]);

    const handleJoinRace = async () => {
        if (!username.trim()) {
            setError('Please enter your username');
            return;
        }

        try {
            await signalRService.invoke('JoinRace', username);
            setConnectionStatus('joined');
            setError(null);
        } catch (err) {
            console.error('Failed to join race:', err);
            setError('Failed to join the race');
        }
    };

    const handleSetReady = async () => {
        try {
            await signalRService.invoke('SetReady');
        } catch (err) {
            console.error('Failed to set ready:', err);
            setError('Failed to set ready status');
        }
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        if (value.length > input.length) {
            const nextChar = value[value.length - 1];
            const expectedChar = text[input.length];
            if (nextChar === expectedChar) {
                const newInput = input + nextChar;
                setInput(newInput);
                let correct = 0;
                for (let i = 0; i < newInput.length && i < text.length; i++) {
                    if (newInput[i] === text[i]) {
                        correct++;
                    } else {
                        break;
                    }
                }
                const percent = text.length > 0 ? (correct / text.length) * 100 : 0;
                signalRService.sendProgress(percent);
            }
        } else if (value.length < input.length) {
            const newInput = input.slice(0, value.length);
            setInput(newInput);
            let correct = 0;
            for (let i = 0; i < newInput.length && i < text.length; i++) {
                if (newInput[i] === text[i]) {
                    correct++;
                } else {
                    break;
                }
            }
            const percent = text.length > 0 ? (correct / text.length) * 100 : 0;
            signalRService.sendProgress(percent);
        }
    };

    const getStatusMessage = () => {
        switch (connectionStatus) {
            case 'connecting':
                return 'Connecting to server...';
            case 'connected':
                return 'Connected to server';
            case 'disconnected':
                return 'Disconnected from server';
            case 'joined':
                return 'Joined the race';
            default:
                return 'Unknown status';
        }
    };

    const getRandomColor = (id) => {
        const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#1abc9c'];
        const safeId = id || '0';
        return colors[safeId.charCodeAt(0) % colors.length];
    };

    // تابع محاسبه درصد پیشرفت بر اساس تعداد کاراکتر صحیح و طول متن مسابقه
    const getProgressPercent = (playerId) => {
        if (!playerId) return 0;
        
        if (playerId === connectionId) {
            let correct = 0;
            for (let i = 0; i < input.length && i < text.length; i++) {
                if (input[i] === text[i]) {
                    correct++;
                } else {
                    break;
                }
            }
            return text.length > 0 ? (correct / text.length) * 100 : 0;
        } else {
            return playerProgress[playerId] || 0;
        }
    };

    return (
        <div className="race-container">
            <div className="status-bar">
                <div className={`status ${connectionStatus}`}>
                    {getStatusMessage()}
                </div>
                {error && <div className="error">{error}</div>}
            </div>

            {!isRacing && connectionStatus === 'connected' && (
                <div className="join-section">
                    <input
                        type="text"
                        className="username-input"
                        placeholder="Enter your username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <button
                        className="join-button"
                        onClick={handleJoinRace}
                        disabled={!username.trim()}
                    >
                        Join Race
                    </button>
                </div>
            )}

            {/* جدول کاربران قبل از شروع مسابقه */}
            {connectionStatus === 'joined' && !isRacing && (
                <div className="players-list">
                    <h3>Players</h3>
                    <div className="players-table">
                        <div className="players-table-header">
                            <span>Username</span>
                            <span>Status</span>
                        </div>
                        {players.map(player => (
                            <div key={player.id} className="player-item">
                                <span>{player.username || player.name}</span>
                                <span className={player.isReady ? 'ready' : 'not-ready'}>
                                    {player.isReady ? 'Ready' : 'Waiting...'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* دکمه آماده‌ام فقط اگر کاربر آماده نیست */}
            {connectionStatus === 'joined' && !isRacing && (
                (() => {
                    const me = players.find(p => p.id === connectionId);
                    if (!me || !me.isReady) {
                        return (
                            <button className="ready-button" onClick={handleSetReady}>
                                I'm Ready
                            </button>
                        );
                    }
                    return null;
                })()
            )}

            {countdown !== null && (
                <div className="countdown">{countdown}</div>
            )}

            {text && (
                <div className="race-text" style={{ textAlign: 'center', marginBottom: '10px', fontWeight: 'bold', fontSize: '18px' }}>
                    {text}
                </div>
            )}

            {isRacing && (
                <div className="race-content">
                    <div className="race-main">
                        <div className="race-track">
                            <div className="finish-line"></div>
                            {players.map(player => {
                                const playerId = player.id || player.connectionId;
                                const percent = getProgressPercent(playerId);
                                console.log('Player progress:', {
                                    username: player.username,
                                    id: playerId,
                                    percent: percent,
                                    connectionId: connectionId
                                });
                                return (
                                    <div
                                        key={playerId}
                                        className={`car ${playerProgress[playerId] > 0 ? 'moving' : ''}`}
                                        style={{
                                            left: `calc(${percent}% - ${120 * percent / 100}px)`,
                                            top: `${players.indexOf(player) * 80 + 60}px`,
                                            color: getRandomColor(playerId)
                                        }}
                                        data-name={player.username}
                                    />
                                );
                            })}
                        </div>
                        <input
                            type="text"
                            className="text-input"
                            value={input}
                            onChange={handleInputChange}
                            placeholder="Start typing..."
                            autoFocus
                        />
                    </div>

                    {/* جدول رتبه‌بندی */}
                    <div className="ranking-table">
                        <h3>🏆 Ranking</h3>
                        <div className="ranking-list">
                            {ranking.map((username, idx) => (
                                <div key={username} className="ranking-item">
                                    <div className="rank-number">{idx + 1}</div>
                                    <div className="player-name">{username}</div>
                                    <div className="medal">
                                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : ''}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Race; 