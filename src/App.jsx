import React, { useState } from 'react';
import './App.css';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAddGig, setShowAddGig] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authType, setAuthType] = useState('Login');
  const [openFaq, setOpenFaq] = useState(null);

  // Initial Dynamic Gigs List
  const [gigs, setGigs] = useState([
    {
      id: 1,
      title: 'UI/UX Design for College Fest App',
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
      title: 'React JS Bug Fixing & Lab Assignment',
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
      title: 'Python Data Science Practical Notes',
      category: 'Notes',
      price: '₹300',
      isUrgent: true,
      paymentType: 'Paid',
      author: 'Aman Verma (EC)',
      verified: false,
      rating: '4.5 ⭐',
      contact: 'aman@campus.edu'
    },
    {
      id: 4,
      title: 'Video Editing for Tech Fest Promo',
      category: 'Design',
      price: '₹1000',
      isUrgent: false,
      paymentType: 'Paid',
      author: 'Neha Gupta (CE)',
      verified: true,
      rating: '5.0 ⭐',
      contact: 'neha@campus.edu'
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
    if (!newGig.title) return;
    
    const gigToAdd = {
      ...newGig,
      id: Date.now(),
      verified: true,
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

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const openAuth = (type) => {
    setAuthType(type);
    setShowAuthModal(true);
  };

  return (
    <div className="app">
      {/* Navbar */}
      <header className="navbar">
        <h1 className="logo">Campus<span>Gig</span></h1>
        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#gigs">Explore Gigs</a>
          <a href="#reviews">Reviews</a>
          <a href="#faqs">FAQs</a>
          <button className="btn-secondary" onClick={() => openAuth('Login')}>Login</button>
          <button className="btn-primary" onClick={() => openAuth('Sign Up')}>Join CampusGig</button>
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="hero">
        <h2>Turn Your <span>Skills</span> Into Opportunities</h2>
        <p>CampusGig connects talented college students with peers for freelance campus tasks.</p>
        
        <div className="hero-buttons">
          <a href="#gigs" className="btn-primary">🔍 Explore Gigs</a>
          <button className="btn-outline" onClick={() => setShowAddGig(true)}>💼 Post a Gig</button>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stat-card">
          <h3>500+</h3>
          <p>Active Students</p>
        </div>
        <div className="stat-card">
          <h3>120+</h3>
          <p>Gigs Completed</p>
        </div>
        <div className="stat-card">
          <h3>₹45,000+</h3>
          <p>Earned by Peers</p>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="how-it-works">
        <h3>How CampusGig Works</h3>
        <div className="steps-grid">
          <div className="step-card">
            <span className="step-num">1</span>
            <h4>Post or Search</h4>
            <p>List your freelance service or browse tasks posted by fellow students.</p>
          </div>
          <div className="step-card">
            <span className="step-num">2</span>
            <h4>Connect Directly</h4>
            <p>Chat with peers, discuss requirements, and finalize deadline details.</p>
          </div>
          <div className="step-card">
            <span className="step-num">3</span>
            <h4>Deliver & Earn / Swap</h4>
            <p>Complete the task, build your campus portfolio, and get paid directly.</p>
          </div>
        </div>
      </section>

      {/* Main Gigs Section */}
      <section id="gigs" className="gigs-container">
        <h3>Available Campus Gigs</h3>
        
        {/* Search Bar */}
        <div className="search-box">
          <input 
            type="text" 
            placeholder="Search by skill, topic, or gig title..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

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
          <button className="btn-add-inline" onClick={() => setShowAddGig(true)}>+ Post New Gig</button>
        </div>

        {/* Gig Cards Grid */}
        <div className="gigs-grid">
          {filteredGigs.length > 0 ? (
            filteredGigs.map(gig => (
              <div key={gig.id} className={`gig-card ${gig.isUrgent ? 'urgent-border' : ''}`}>
                <div className="card-tags">
                  <span className="badge category">{gig.category}</span>
                  {gig.isUrgent && <span className="badge urgent">🔥 URGENT</span>}
                  {gig.paymentType === 'Skill Swap' && <span className="badge swap">🔄 SKILL SWAP</span>}
                </div>

                <h4>{gig.title}</h4>
                <p className="price">{gig.price}</p>
                
                <div className="author-info">
                  <span>By {gig.author} {gig.verified && <b title="Verified Student">✅</b>}</span>
                  <span className="rating">{gig.rating}</span>
                </div>

                <a href={`mailto:${gig.contact}?subject=Applying for: ${gig.title}`} className="btn-apply">Apply Now</a>
              </div>
            ))
          ) : (
            <p style={{textAlign: 'center', gridColumn: '1/-1', color: '#94a3b8'}}>No gigs found matching your search.</p>
          )}
        </div>
      </section>

      {/* Testimonials / Reviews */}
      <section id="reviews" className="reviews-section">
        <h3>What Students Say</h3>
        <div className="reviews-grid">
          <div className="review-card">
            <p>"Found a designer for our college fest poster in under 2 hours. Super helpful platform!"</p>
            <h5>- Rishabh Mehta (CS, 3rd Year)</h5>
          </div>
          <div className="review-card">
            <p>"Earned ₹2,000 in my free time helping juniors with React assignments."</p>
            <h5>- Sneha Rao (IT, 4th Year)</h5>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section id="faqs" className="faqs-section">
        <h3>Frequently Asked Questions</h3>
        <div className="faq-list">
          <div className={`faq-item ${openFaq === 0 ? 'open' : ''}`} onClick={() => toggleFaq(0)}>
            <h4>Is CampusGig free for students? <span>{openFaq === 0 ? '▲' : '▼'}</span></h4>
            {openFaq === 0 && <p>Yes! CampusGig is completely free to browse, post, and apply for gigs within your campus community.</p>}
          </div>
          <div className={`faq-item ${openFaq === 1 ? 'open' : ''}`} onClick={() => toggleFaq(1)}>
            <h4>How do I get paid for a Gig? <span>{openFaq === 1 ? '▲' : '▼'}</span></h4>
            {openFaq === 1 && <p>You connect directly with the gig poster and can receive payment via UPI, cash, or opt for a Skill Swap.</p>}
          </div>
          <div className={`faq-item ${openFaq === 2 ? 'open' : ''}`} onClick={() => toggleFaq(2)}>
            <h4>Who can post a task on the platform? <span>{openFaq === 2 ? '▲' : '▼'}</span></h4>
            {openFaq === 2 && <p>Any verified college student can post a task or list their skills to offer services to peers.</p>}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>© 2026 CampusGig | Peer-to-Peer Marketplace | Built for College Capstone Evaluation</p>
      </footer>

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

      {/* Auth Modal (Login / Sign Up) */}
      {showAuthModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{authType} to CampusGig</h3>
            <form onSubmit={(e) => { e.preventDefault(); alert(`${authType} Successful!`); setShowAuthModal(false); }}>
              <input type="email" placeholder="College Email (.edu / .ac.in)" required />
              <input type="password" placeholder="Password" required />
              <div className="modal-actions">
                <button type="submit" className="btn-primary">{authType}</button>
                <button type="button" className="btn-close" onClick={() => setShowAuthModal(false)}>Close</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;