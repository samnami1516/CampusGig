import React, { useState, useEffect } from 'react';
import './App.css';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from './firebase';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddGig, setShowAddGig] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [examMode, setExamMode] = useState(false);
  const [skillSwapOffer, setSkillSwapOffer] = useState('');
  const [skillSwapWant, setSkillSwapWant] = useState('');
  const [matchedPeers, setMatchedPeers] = useState([]);
  const [theme, setTheme] = useState('light');

  // New Gig Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Design');
  const [price, setPrice] = useState('');
  const [contact, setContact] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);

  const [gigs, setGigs] = useState([]);
  const [loadingGigs, setLoadingGigs] = useState(true);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Firestore Gigs Fetching
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
      console.error("Firestore Error:", error);
      setLoadingGigs(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddGig = async (e) => {
    e.preventDefault();
    if (!title || !price || !contact) return;

    try {
      await addDoc(collection(db, 'gigs'), {
        title,
        category,
        price,
        contact,
        isUrgent,
        author: 'Saurabh Giri',
        createdAt: new Date()
      });
      setTitle('');
      setPrice('');
      setContact('');
      setShowAddGig(false);
    } catch (err) {
      console.error("Error adding gig: ", err);
    }
  };

  const handleSkillMatch = (e) => {
    e.preventDefault();
    if (!skillSwapOffer || !skillSwapWant) return;
    const matches = gigs.filter(gig =>
      gig.title.toLowerCase().includes(skillSwapWant.toLowerCase()) ||
      gig.category.toLowerCase().includes(skillSwapWant.toLowerCase())
    );
    setMatchedPeers(matches);
  };

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

      {/* SKILL SWAP MATCHER */}
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

      {/* CAMPUS LEADERBOARD */}
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
          <h2>Available Campus Gigs {examMode && '🔥 (Exam Priority)'}</h2>
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

      {/* ADD GIG MODAL */}
      {showAddGig && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Post a New Gig</h3>
            <form onSubmit={handleAddGig}>
              <input
                type="text"
                placeholder="Gig Title (e.g. React Web Assignment)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="Design">Design</option>
                <option value="Coding">Coding</option>
                <option value="Notes">Notes</option>
              </select>
              <input
                type="number"
                placeholder="Price in ₹"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Contact / Email"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                required
              />
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={isUrgent}
                  onChange={(e) => setIsUrgent(e.target.checked)}
                /> Mark as Urgent
              </label>
              <div className="modal-actions">
                <button type="submit" className="btn-primary">Post Gig</button>
                <button type="button" className="btn-secondary" onClick={() => setShowAddGig(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;