import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import ClientCounter from './components/ClientCounter';
import Vote from './components/Vote';
import Race from './components/Race';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<ClientCounter />} />
            <Route path="/vote" element={<Vote />} />
            <Route path="/race" element={<Race />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
