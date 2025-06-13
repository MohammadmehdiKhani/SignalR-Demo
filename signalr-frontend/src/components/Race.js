import React, { useState, useEffect } from 'react';
import { signalRService } from '../services/signalRService';
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
        const setupConnection = async () => {
            try {
                await signalRService.startConnection();
                setConnectionStatus('connected');
                setError(null);

                // Add event handlers
                signalRService.addHandler('ReceiveProgress', (playerId, progress) => {
                    console.log('Progress received:', playerId, progress);
                    setPlayerProgress(prev => ({
                        ...prev,
                        [playerId]: progress
                    }));
                });

                signalRService.addHandler('PlayerJoined', (player) => {
                    console.log('Player joined:', player);
                    setPlayers(prev => [...prev, player]);
                    if ((player.name && player.name === username) || (player.username && player.username === username)) {
                        setConnectionId(player.id);
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

                signalRService.addHandler('RaceStarted', (raceText) => {
                    console.log('Race started with text:', raceText);
                    setText(raceText);
                    setIsRacing(true);
                    setCountdown(null);
                });

                signalRService.addHandler('RaceEnded', (results) => {
                    console.log('Race ended with results:', results);
                    setIsRacing(false);
                    setText('');
                    setInput('');
                    setPlayerProgress({});
                });

                signalRService.addHandler('Countdown', (number) => {
                    console.log('Countdown:', number);
                    setCountdown(number);
                });

                signalRService.addHandler('AllPlayersReady', () => {
                    console.log('All players are ready');
                });

                signalRService.addHandler('UpdatePlayers', (players) => {
                    console.log('UpdatePlayers:', players);
                    setPlayers(players);
                });

                signalRService.addHandler('RankingUpdated', (rankingList) => {
                    setRanking(rankingList);
                });

            } catch (err) {
                console.error('Failed to start connection:', err);
                setConnectionStatus('disconnected');
                setError('Failed to connect to the server');
            }
        };

        setupConnection();

        return () => {
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
                signalRService.invoke('SendProgress', percent);
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
            signalRService.invoke('SendProgress', percent);
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
        return colors[id.charCodeAt(0) % colors.length];
    };

    // تابع محاسبه درصد پیشرفت بر اساس تعداد کاراکتر صحیح و طول متن مسابقه
    const getProgressPercent = (playerId) => {
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
            if (playerProgress[playerId] !== undefined) {
                return playerProgress[playerId];
            }
            const player = players.find(p => p.id === playerId);
            return player ? player.progress || 0 : 0;
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
                                const percent = getProgressPercent(player.id);
                                console.log('player:', player.username, 'id:', player.id, 'percent:', percent, 'left:', `calc(${percent}% -  ${120 * percent / 100}px)`);
                                return (
                                    <div
                                        key={player.id}
                                        className={`car ${playerProgress[player.id] > 0 ? 'moving' : ''}`}
                                        style={{
                                            left: `calc(${percent}% -  ${120 * percent / 100}px)`,
                                            top: `${players.indexOf(player) * 80 + 60}px`,
                                            color: getRandomColor(player.id)
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