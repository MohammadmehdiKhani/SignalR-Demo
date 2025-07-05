import React, { useState, useEffect } from 'react';
import { signalRService } from '../services/signalRService';
import authService from '../services/authService';
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
    const [isRaceEnded, setIsRaceEnded] = useState(false);
    const [currentRoomId, setCurrentRoomId] = useState(null);
    const [roomId, setRoomId] = useState('');
    const [activeRooms, setActiveRooms] = useState([]);
    const [showRoomSelection, setShowRoomSelection] = useState(true);
    const [showLobby, setShowLobby] = useState(false);

    useEffect(() => {
        // Set username from auth service
        const currentUsername = authService.getUsername();
        if (currentUsername) {
            setUsername(currentUsername);
        }

        const setupConnection = async () => {
            try {
                await signalRService.startConnection("raceHub");
                setConnectionStatus('connected');
                setError(null);

                // Add event handlers
                signalRService.addHandler("raceHub", 'ReceiveProgress', (playerId, progress) => {
                    console.log('Progress received:', playerId, progress);
                    setPlayerProgress(prev => ({
                        ...prev,
                        [playerId]: progress
                    }));
                });

                signalRService.addHandler("raceHub", 'PlayerJoined', (player) => {
                    console.log('Player joined:', player);
                    setPlayers(prev => [...prev, player]);
                    if ((player.name && player.name === username) || (player.username && player.username === username)) {
                        setConnectionId(player.id);
                    }
                });

                signalRService.addHandler("raceHub", 'PlayerLeft', (playerId) => {
                    console.log('Player left:', playerId);
                    setPlayers(prev => prev.filter(p => p.id !== playerId));
                    setPlayerProgress(prev => {
                        const newProgress = { ...prev };
                        delete newProgress[playerId];
                        return newProgress;
                    });
                });

                signalRService.addHandler("raceHub", 'RaceStarted', (raceText) => {
                    console.log('Race started with text:', raceText);
                    setText(raceText);
                    setIsRacing(true);
                    setIsRaceEnded(false);
                    setCountdown(null);
                });

                signalRService.addHandler("raceHub", 'RaceEnded', (results) => {
                    console.log('Race ended with results:', results);
                    setIsRacing(false);
                    setIsRaceEnded(true);
                    setText('');
                    setInput('');
                    setPlayerProgress({});
                    setPlayers([]);
                    setCountdown(null);
                    setConnectionId(null);
                    setRanking(results);
                });

                signalRService.addHandler("raceHub", 'Countdown', (number) => {
                    console.log('Countdown:', number);
                    setCountdown(number);
                });

                signalRService.addHandler("raceHub", 'AllPlayersReady', () => {
                    console.log('All players are ready');
                });

                signalRService.addHandler("raceHub", 'UpdatePlayers', (players) => {
                    console.log('UpdatePlayers:', players);
                    setPlayers(players);
                });

                signalRService.addHandler("raceHub", 'RankingUpdated', (rankingList) => {
                    setRanking(rankingList);
                });

                signalRService.addHandler("raceHub", 'RoomInfo', (roomInfo) => {
                    console.log('Room info received:', roomInfo);
                    setPlayers(roomInfo.players || []);
                    setText(roomInfo.currentText || '');
                    setIsRacing(roomInfo.isRaceStarted || false);
                });

                signalRService.addHandler("raceHub", 'RoomNotFound', (roomId) => {
                    console.log('Room not found:', roomId);
                    setError(`Room ${roomId} not found`);
                });

                signalRService.addHandler("raceHub", 'ActiveRooms', (rooms) => {
                    console.log('Active rooms:', rooms);
                    setActiveRooms(rooms);
                });

            } catch (err) {
                console.error('Failed to start connection:', err);
                setConnectionStatus('disconnected');
                setError('Failed to connect to the server');
            }
        };

        setupConnection();

        return () => {
            signalRService.stopConnection("raceHub");
        };
    }, [username]);

    useEffect(() => {
        if (text) {
            console.log('Race text received:', text);
        }
    }, [text]);

    const handleCreateRoom = async () => {
        if (!roomId.trim()) {
            setError('Please enter a room ID');
            return;
        }

        try {
            await signalRService.createRoom(roomId);
            setCurrentRoomId(roomId);
            setShowRoomSelection(false);
            setConnectionStatus('joined');
            setError(null);
        } catch (err) {
            console.error('Failed to create room:', err);
            setError('Failed to create room');
        }
    };

    const handleJoinRoom = async () => {
        if (!roomId.trim()) {
            setError('Please enter a room ID');
            return;
        }

        try {
            await signalRService.joinRoom(roomId);
            setCurrentRoomId(roomId);
            setShowRoomSelection(false);
            setConnectionStatus('joined');
            setError(null);
        } catch (err) {
            console.error('Failed to join room:', err);
            setError('Failed to join room');
        }
    };

    const handleLeaveRoom = async () => {
        if (currentRoomId) {
            try {
                await signalRService.leaveRoom(currentRoomId);
                setCurrentRoomId(null);
                setShowRoomSelection(true);
                setShowLobby(false);
                setConnectionStatus('connected');
                setPlayers([]);
                setText('');
                setInput('');
                setPlayerProgress({});
                setRanking([]);
                setIsRacing(false);
                setIsRaceEnded(false);
                setCountdown(null);
                setConnectionId(null);
                setError(null);
            } catch (err) {
                console.error('Failed to leave room:', err);
                setError('Failed to leave room');
            }
        }
    };

    const handleQuitRacing = async () => {
        await handleLeaveRoom();
    };

    const handleShowLobby = async () => {
        setShowLobby(true);
        setIsRaceEnded(false);
        setRanking([]);
        if (currentRoomId) {
            try {
                await signalRService.getRoomInfo(currentRoomId);
            } catch (err) {
                setError('خطا در دریافت اطلاعات اتاق');
            }
        }
    };

    const handleGetActiveRooms = async () => {
        try {
            await signalRService.getActiveRooms();
        } catch (err) {
            console.error('Failed to get active rooms:', err);
            setError('Failed to get active rooms');
        }
    };

    const handleSetReady = async () => {
        if (!currentRoomId) return;
        
        try {
            await signalRService.setReady(currentRoomId);
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
                signalRService.sendProgress(currentRoomId, percent);
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
            signalRService.sendProgress(currentRoomId, percent);
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
                return `Joined room: ${currentRoomId}`;
            default:
                return 'Unknown status';
        }
    };

    const getRandomColor = (id) => {
        const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#1abc9c'];
        if (!id) return colors[0];
        return colors[id.charCodeAt(0) % colors.length];
    };

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
        }
        return playerProgress[playerId] || 0;
    };

    return (
        <div className="race-container">
            <div className="status-bar">
                <div className={`status ${connectionStatus}`}>
                    {getStatusMessage()}
                </div>
                {error && <div className="error">{error}</div>}
            </div>

            {showRoomSelection && connectionStatus === 'connected' && (
                <div className="room-selection">
                    <div className="room-boxes">
                        <div className="room-box create-room">
                            <h3>🏠 Create Room</h3>
                            <p>Create a new room and invite others to join</p>
                            <input
                                type="text"
                                className="room-input"
                                placeholder="Enter room ID (e.g., room-123)"
                                value={roomId}
                                onChange={(e) => setRoomId(e.target.value)}
                            />
                            <button
                                className="create-button"
                                onClick={handleCreateRoom}
                                disabled={!roomId.trim()}
                            >
                                Create Room
                            </button>
                        </div>

                        <div className="room-box join-room">
                            <h3>🚪 Join Room</h3>
                            <p>Join an existing room with room ID</p>
                            <input
                                type="text"
                                className="room-input"
                                placeholder="Enter room ID to join"
                                value={roomId}
                                onChange={(e) => setRoomId(e.target.value)}
                            />
                            <button
                                className="join-button"
                                onClick={handleJoinRoom}
                                disabled={!roomId.trim()}
                            >
                                Join Room
                            </button>
                        </div>
                    </div>

                    <div className="active-rooms-section">
                        <h4>Active Rooms</h4>
                        <button className="refresh-button" onClick={handleGetActiveRooms}>
                            🔄 Refresh
                        </button>
                        <div className="active-rooms-list">
                            {activeRooms.length > 0 ? (
                                activeRooms.map(roomId => (
                                    <div key={roomId} className="active-room-item">
                                        <span>{roomId}</span>
                                        <button 
                                            className="quick-join-button"
                                            onClick={() => {
                                                setRoomId(roomId);
                                                handleJoinRoom();
                                            }}
                                        >
                                            Join
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p>No active rooms</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {connectionStatus === 'joined' && !isRacing && !isRaceEnded && !showLobby && (
                <div className="room-info">
                    <div className="room-header">
                        <h3>Room: {currentRoomId}</h3>
                        <button className="leave-button" onClick={handleLeaveRoom}>
                            Leave Room
                        </button>
                    </div>
                    
                    <div className="players-list">
                        <h4>Players ({players.length})</h4>
                        <div className="players-table">
                            <div className="players-table-header">
                                <span>Username</span>
                                <span>Status</span>
                            </div>
                            {players.map(player => (
                                <div key={player.connectionId || player.id} className="player-item">
                                    <span>{player.username || player.name}</span>
                                    <span className={player.isReady ? 'ready' : 'not-ready'}>
                                        {player.isReady ? 'Ready' : 'Waiting...'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {connectionStatus === 'joined' && !isRacing && !isRaceEnded && showLobby && (
                <div className="room-info">
                    <div className="room-header">
                        <h3>Room: {currentRoomId} - Lobby</h3>
                        <button className="leave-button" onClick={handleLeaveRoom}>
                            Leave Room
                        </button>
                    </div>
                    
                    <div className="players-list">
                        <h4>Players ({players.length})</h4>
                        <div className="players-table">
                            <div className="players-table-header">
                                <span>Username</span>
                                <span>Status</span>
                            </div>
                            {players.map(player => (
                                <div key={player.connectionId || player.id} className="player-item">
                                    <span>{player.username || player.name}</span>
                                    <span className={player.isReady ? 'ready' : 'not-ready'}>
                                        {player.isReady ? 'Ready' : 'Waiting...'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {connectionStatus === 'joined' && !isRacing && !isRaceEnded && !showLobby && (
                (() => {
                    const me = players.find(p => (p.connectionId || p.id) === connectionId);
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

            {connectionStatus === 'joined' && !isRacing && !isRaceEnded && showLobby && (
                (() => {
                    const me = players.find(p => (p.connectionId || p.id) === connectionId);
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

            {isRacing && text && (
                <div className="race-text" style={{ textAlign: 'center', marginBottom: '10px', fontWeight: 'bold', fontSize: '18px' }}>
                    {text}
                </div>
            )}

            {isRacing && !isRaceEnded && (
                <div className="race-content">
                    <div className="race-main">
                        <div className="race-track">
                            <div className="finish-line"></div>
                            {players.map(player => {
                                const playerId = player.connectionId || player.id;
                                const percent = getProgressPercent(playerId);
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

                    <div className="ranking-table">
                        <h3>🏆 Ranking</h3>
                        <div className="ranking-list">
                            {ranking.map((player, idx) => (
                                <div key={player.connectionId} className="ranking-item">
                                    <div className="rank-number">{idx + 1}</div>
                                    <div className="player-name">{player.username}</div>
                                    <div className="medal">
                                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : ''}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {isRaceEnded && (
                <div className="final-ranking">
                    <h2>🏆 Race Results 🏆</h2>
                    <div className="ranking-list">
                        {ranking.map((player, idx) => (
                            <div key={player.connectionId} className="ranking-item final">
                                <div className="rank-number">{idx + 1}</div>
                                <div className="player-name">{player.username}</div>
                                <div className="medal">
                                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : ''}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="post-race-buttons">
                        <button className="quit-racing-button" onClick={handleQuitRacing}>
                            Quit Racing
                        </button>
                        <button className="lobby-button" onClick={handleShowLobby}>
                            Lobby
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Race; 