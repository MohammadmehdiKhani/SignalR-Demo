import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ onLogout, username }) => {
    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <Link to="/">SignalR Demo</Link>
            </div>
            <div className="navbar-links">
                <Link to="/" className="nav-link">Client Counter</Link>
                <Link to="/vote" className="nav-link">Voting</Link>
                <Link to="/race" className="nav-link">Typing Race</Link>
            </div>
            <div className="navbar-user">
                <span className="username">Welcome, {username}</span>
                <button onClick={onLogout} className="logout-button">
                    Logout
                </button>
            </div>
        </nav>
    );
};

export default Navbar; 