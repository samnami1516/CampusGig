import React, { useState } from 'react';
import './App.css';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAddGig, setShowAddGig] = useState(false);

  // Gigs State with Unique Features (Skill Swap & Urgent Tags)
  const [gigs, setGigs] = useState([
    {
      id: 1,
      title: 'UI/UX Design for College App',
      category: 'Design',
      price: '₹500',
      isUrgent: true,
      paymentType: 'Paid',
      author: 'Rahul Sharma (CS)',
      verified: true,
      rating: '4.9 ⭐',
      contact: 'rahul@campus.edu'
    },
    {
      id: 2,
      title: 'React JS Bug Fixing',
      category: 'Coding',
      price: 'Skill Swap 🔄',
      isUrgent: false,
      paymentType: 'Skill Swap',
      author: 'Priya Singh (IT)',
      verified: true,
      rating: '4.8 ⭐',
      contact: 'priya@campus.edu'
    },
    {
      id: 3,
      title: 'Python Data Analysis Notes',
      category: 'Notes',
      price: '₹300',
      isUrgent: true,
      paymentType: 'Paid',
      author: 'Aman Verma (EC)',
      verified: false,
      rating: '4.5 ⭐',
      contact: 'aman@campus.edu'
    }
  ]);

  // Form State
  const [newGig, setNewGig] = useState({
    title: '',
    category: 'Coding',
    price: '',
    paymentType: 'Paid',
    isUrgent: false,
    author: '',
    contact: ''
  });

  const handleAddGig = (e) => {
    e.preventDefault();
    if (!newGig.title || !newGig.price) return;
    
    const gigToAdd = {
      ...newGig,
      id: Date.now(),
      verified: true, // Auto-verified for logged in student
      rating: '5.0 ⭐',
      price: newGig.paymentType === 'Skill Swap' ? 'Skill Swap 🔄' : `₹${newGig.price}`
    };

    setGigs([gigToAdd, ...gigs]);
    setShowAddGig(false);
    setNewGig({ title: '', category: 'Coding', price: '', paymentType: 'Paid', isUrgent: false, author: '', contact: '' });
  };

  // Filter Logic
  const filteredGigs = gigs.filter(gig => {
    const matchesCategory = selectedCategory === 'All' || gig.category === selectedCategory;
    const matchesSearch = gig.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="app">
      {/* Navbar */}
      <header className="navbar">
        <h1 className="logo">Campus<span>Gig</span></h1>
        <div className="nav-links">
          <a href="#gigs">Explore Gigs</a>
          <button className="btn-primary" onClick={() => setShowAddGig(true)}>+ Post a Gig</button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <h2>Turn Your <span>Skills</span> Into Opportunities</h2>
        <p>College-exclusive peer-to-peer freelance & skill-swap platform.</p>
        
        {/* Search Bar */}
        <div className="search-box">
          <input 
            type="text" 
            placeholder="Search by skill, topic, or gig title..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </section>

      {/* Main Gigs Section */}
      <section id="gigs" className="gigs-container">
        <h3>Available Campus Gigs</h3>
        
        {/* Filters */}
        <div className="filter-buttons">
          {['All', 'Coding', 'Design', 'Notes'].map(cat => (
            <button 
              key={cat} 
              className={selectedCategory === cat ? 'active' : ''}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Gig Cards Grid */}
        <div className="gigs-grid">
          {filteredGigs.map(gig => (
            <div key={gig.id} className={`gig-card ${gig.isUrgent ? 'urgent-border' : ''}`}>
              <div className="card-tags">
                <span className="badge category">{gig.category}</span>
                {gig.isUrgent && <span className="badge urgent">🔥 URGENT</span>}
                {gig.paymentType === 'Skill Swap' && <span className="badge swap">🔄 SKILL SWAP</span>}
              </div>

              <h4>{gig.title}</h4>
              <p className="price">{gig.price}</p>
              
              <div className="author-info">
                <span>{gig.author} {gig.verified && <b title="Verified Student">✅</b>}</span>
                <span className="rating">{gig.rating}</span>
              </div>

              <a href={`mailto:${gig.contact}`} className="btn-apply">Apply Now</a>
            </div>
          ))}
        </div>
      </section>

      {/* Add New Gig Modal */}
      {showAddGig && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Post a New Campus Gig</h3>
            <form onSubmit={handleAddGig}>
              <input 
                type="text" 
                placeholder="Gig Title (e.g. Need help with React)" 
                required 
                value={newGig.title}
                onChange={(e) => setNewGig({...newGig, title: e.target.value})}
              />
              
              <select onChange={(e) => setNewGig({...newGig, category: e.target.value})}>
                <option value="Coding">Coding</option>
                <option value="Design">Design</option>
                <option value="Notes">Notes</option>
              </select>

              <select onChange={(e) => setNewGig({...newGig, paymentType: e.target.value})}>
                <option value="Paid">Paid (₹)</option>
                <option value="Skill Swap">Skill Swap (Barter)</option>
              </select>

              {newGig.paymentType === 'Paid' && (
                <input 
                  type="number" 
                  placeholder="Price in ₹" 
                  required 
                  value={newGig.price}
                  onChange={(e) => setNewGig({...newGig, price: e.target.value})}
                />
              )}

              <input 
                type="text" 
                placeholder="Your Name & Branch (e.g. Saurabh - CS)" 
                required 
                value={newGig.author}
                onChange={(e) => setNewGig({...newGig, author: e.target.value})}
              />

              <input 
                type="email" 
                placeholder="Contact Email" 
                required 
                value={newGig.contact}
                onChange={(e) => setNewGig({...newGig, contact: e.target.value})}
              />

              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={newGig.isUrgent}
                  onChange={(e) => setNewGig({...newGig, isUrgent: e.target.checked})}
                />
                Mark as 🔥 Urgent (24h Deadline)
              </label>

              <div className="modal-actions">
                <button type="submit" className="btn-primary">Post Gig</button>
                <button type="button" className="btn-close" onClick={() => setShowAddGig(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;