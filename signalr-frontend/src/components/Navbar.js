import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <Link to="/">SignalR Demo</Link>
            </div>
            <div className="navbar-links">
                <Link to="/" className="nav-link">Client Counter</Link>
                <Link to="/vote" className="nav-link">Voting</Link>
            </div>
        </nav>
    );
};

export default Navbar; 