import React, { useState, useEffect } from 'react';
import './App.css';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from './firebase';

const CATEGORY_SKILLS = {
  Design: ['UI/UX Design', 'Figma', 'Canva'],
  Coding: ['React', 'JavaScript', 'Python'],
  Notes: ['Technical Writing', 'Research']
};

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('default');

  const [showAddGig, setShowAddGig] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authType, setAuthType] = useState('login');
  const [openFaq, setOpenFaq] = useState(null);

  // Firestore Gigs State
  const [gigs, setGigs] = useState([]);
  const [loadingGigs, setLoadingGigs] = useState(true);

  // Features State
  const [examMode, setExamMode] = useState(false);
  const [skillSwapOffer, setSkillSwapOffer] = useState('');
  const [skillSwapWant, setSkillSwapWant] = useState('');
  const [matchedPeers, setMatchedPeers] = useState([]);

  // Theme
  const [theme, setTheme] = useState(() => localStorage.getItem('campusgig-theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('campusgig-theme', theme);
  }, [theme]);

  // 1. FIRESTORE REALTIME GIGS FETCHING
  useEffect(() => {
    const q = query(collection(db, 'gigs'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedGigs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGigs(fetchedGigs);
      setLoadingGigs(false);
    }, (error) => {
      console.error("Firestore Fetch Error:", error);
      setLoadingGigs(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. SKILL SWAP MATCHER LOGIC
  const handleSkillMatch = (e) => {
    e.preventDefault();
    if (!skillSwapOffer || !skillSwapWant) return;

    // Filter peers offering what you want
    const matches = gigs.filter(gig =>
      gig.title.toLowerCase().includes(skillSwapWant.toLowerCase()) ||
      gig.category.toLowerCase().includes(skillSwapWant.toLowerCase())
    );
    setMatchedPeers(matches);
  };

  // 3. LEADERBOARD DATA (Dynamic Extraction from Gigs)
  const leaderboard = [
    { name: 'Saurabh Giri', branch: 'CS', earned: '₹12,500', badge: 'Top Designer 🏆' },
    { name: 'Ritika Singh', branch: 'IT', earned: '₹9,800', badge: 'Fast Delivery ⚡' },
    { name: 'Hasan Shaikh', branch: 'DS', earned: '₹7,200', badge: 'Notes Scholar 📚' }
  ];

  return (
    <div className="app">
      {/* NAVBAR */}
      <header className="navbar">
        <div className="nav-left">
          <div className="logo">
            Campus<span>Gig</span>
          </div>
        </div>
        <div className="nav-right">
          <button className="theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>

          <button
            className={`exam-btn ${examMode ? 'active' : ''}`}
            onClick={() => setExamMode(!examMode)}
          >
            {examMode ? '📚 Exam Mode ON' : '🎓 Normal Mode'}
          </button>

          <button className="btn-primary" onClick={() => setShowAuthModal(true)}>
            Login / Join
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="hero">
        <h1>Turn Your <span>Skills</span> Into Opportunities</h1>
        <p>CampusGig connects college students with peers for freelance campus tasks.</p>
      </section>

      {/* FEATURE 1: SKILL SWAP MATCHER */}
      <section className="container skill-swap-card">
        <h2>🔄 Skill Swap Matcher</h2>
        <form onSubmit={handleSkillMatch} className="swap-form">
          <input
            type="text"
            placeholder="Skill you CAN offer (e.g. React)"
            value={skillSwapOffer}
            onChange={(e) => setSkillSwapOffer(e.target.value)}
          />
          <input
            type="text"
            placeholder="Skill you WANT (e.g. Figma)"
            value={skillSwapWant}
            onChange={(e) => setSkillSwapWant(e.target.value)}
          />
          <button type="submit" className="btn-primary">Find Match</button>
        </form>

        {matchedPeers.length > 0 && (
          <div className="matched-results">
            <h3>Matched Peers:</h3>
            {matchedPeers.map(peer => (
              <div key={peer.id} className="peer-chip">
                <span>{peer.author || 'Student'}</span> - {peer.title} ({peer.contact})
              </div>
            ))}
          </div>
        )}
      </section>

      {/* FEATURE 2: CAMPUS LEADERBOARD */}
      <section className="container leaderboard-section">
        <h2>🏆 Top Campus Earners</h2>
        <div className="leaderboard-grid">
          {leaderboard.map((user, idx) => (
            <div key={idx} className="leader-card">
              <span className="rank">#{idx + 1}</span>
              <div>
                <h4>{user.name} ({user.branch})</h4>
                <p>Earned: {user.earned}</p>
              </div>
              <span className="badge">{user.badge}</span>
            </div>
          ))}
        </div>
      </section>

      {/* GIGS MARKETPLACE */}
      <section className="gigs container">
        <div className="gigs-header">
          <h2>Available Campus Gigs {examMode && '🔥 (Exam Priority Filtering)'}</h2>
          <button className="btn-primary" onClick={() => setShowAddGig(true)}>
            + Post New Gig
          </button>
        </div>

        {loadingGigs ? (
          <p>Loading gigs from Firestore...</p>
        ) : (
          <div className="gig-grid">
            {gigs
              .filter(gig => !examMode || gig.category === 'Notes' || gig.isUrgent)
              .map(gig => (
                <div key={gig.id} className="gig-card">
                  <div className="card-tags">
                    <span className="badge category">{gig.category}</span>
                    {gig.isUrgent && <span className="badge urgent">🚨 Urgent</span>}
                  </div>
                  <h3>{gig.title}</h3>
                  <p className="price">₹{gig.price}</p>
                  <p className="author">By: {gig.author || 'Campus Student'}</p>
                  <button className="btn-secondary" onClick={() => alert(`Contact: ${gig.contact}`)}>
                    Apply / Contact
                  </button>
                </div>
              ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default App;