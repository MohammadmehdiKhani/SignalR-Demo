import React, { useState, useEffect } from 'react';
import { HubConnectionBuilder, HttpTransportType } from '@microsoft/signalr';
import './Vote.css';

// Import fighter images
import islamImage from '../assets/islam.jpg';
import khabibImage from '../assets/khabib.jpg';
import fergusonImage from '../assets/ferguson.jpg';

const fighterImages = {
    Islam: islamImage,
    Khabib: khabibImage,
    Ferguson: fergusonImage
};

const Vote = () => {
    const [connection, setConnection] = useState(null);
    const [votes, setVotes] = useState({
        Islam: 0,
        Khabib: 0,
        Ferguson: 0
    });
    const [selectedFighter, setSelectedFighter] = useState('');
    const [totalVotes, setTotalVotes] = useState(0);
    const [connectionStatus, setConnectionStatus] = useState("Disconnected");

    useEffect(() => {
        const newConnection = new HubConnectionBuilder()
            .withUrl('http://localhost:5050/votingHub', {
                skipNegotiation: true,
                transport: HttpTransportType.WebSockets
            })
            .withAutomaticReconnect()
            .build();

        setConnection(newConnection);
    }, []);

    useEffect(() => {
        if (connection) {
            setConnectionStatus("Connecting");
            connection.start()
                .then(() => {
                    console.log('Connected to VotingHub!');
                    setConnectionStatus("Connected");
                })
                .catch(err => {
                    console.error('Error connecting to VotingHub:', err);
                    setConnectionStatus("Disconnected");
                });

            connection.on('ReceiveVoteResults', (results) => {
                setVotes(results);
                const total = Object.values(results).reduce((a, b) => a + b, 0);
                setTotalVotes(total);
            });
        }

        return () => {
            if (connection) {
                connection.stop();
            }
        };
    }, [connection]);

    const handleVote = async (fighter) => {
        if (connection) {
            try {
                await connection.invoke('SubmitVote', fighter);
                setSelectedFighter(fighter);
            } catch (err) {
                console.error('Error submitting vote:', err);
            }
        }
    };

    const calculatePercentage = (votes) => {
        if (totalVotes === 0) return 0;
        return ((votes / totalVotes) * 100).toFixed(1);
    };

    const getStatusDotClass = () => {
        switch (connectionStatus.toLowerCase()) {
            case 'connected':
                return 'status-dot connected';
            case 'disconnected':
                return 'status-dot disconnected';
            default:
                return 'status-dot connecting';
        }
    };

    return (
        <div className="vote-container">
            <h2>Who is the MMA Lightweight GOAT?</h2>
            <div className="vote-options">
                {Object.keys(votes).map((fighter) => (
                    <div key={fighter} className="vote-option">
                        <div className="fighter-info">
                            <img 
                                src={fighterImages[fighter]} 
                                alt={fighter} 
                                className="fighter-image"
                            />
                            <button
                                className={`vote-button ${selectedFighter === fighter ? 'selected' : ''}`}
                                onClick={() => handleVote(fighter)}
                            >
                                {fighter}
                            </button>
                        </div>
                        <div className="vote-result">
                            <div className="vote-bar">
                                <div 
                                    className="vote-fill"
                                    style={{ width: `${calculatePercentage(votes[fighter])}%` }}
                                />
                            </div>
                            <span className="vote-percentage">
                                {calculatePercentage(votes[fighter])}%
                            </span>
                        </div>
                    </div>
                ))}
            </div>
            <div className="total-votes">
                Total Votes: {totalVotes}
            </div>
            <div className="connection-status">
                <span className={getStatusDotClass()}></span>
                {connectionStatus}
            </div>
        </div>
    );
};

export default Vote; 