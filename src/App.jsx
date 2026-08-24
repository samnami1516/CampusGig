import React, { useState } from 'react';
import './App.css';

function App() {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showAddGig, setShowAddGig] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [openFaq, setOpenFaq] = useState(null);

  const [gigs, setGigs] = useState([
    { id: 1, title: 'UI/UX Design for College App', category: 'Design', price: '₹500', author: 'Rahul Sharma', dept: 'CS', contact: 'rahul@campus.edu' },
    { id: 2, title: 'React JS Bug Fixing & Assignment', category: 'Coding', price: '₹800', author: 'Priya Singh', dept: 'IT', contact: 'priya@campus.edu' },
    { id: 3, title: 'Python Data Analysis Notes', category: 'Notes', price: '₹300', author: 'Aman Verma', dept: 'CS', contact: 'aman@campus.edu' },
    { id: 4, title: 'Video Editing for Event Vlogs', category: 'Design', price: '₹1000', author: 'Neha Gupta', dept: 'ECE', contact: 'neha@campus.edu' }
  ]);

  const [newGig, setNewGig] = useState({ title: '', category: 'Coding', price: '', author: '', contact: '' });

  const handleAddGig = (e) => {
    e.preventDefault();
    if (!newGig.title || !newGig.price) return;
    setGigs([...gigs, { ...newGig, id: Date.now(), dept: 'CS' }]);
    setNewGig({ title: '', category: 'Coding', price: '', author: '', contact: '' });
    setShowAddGig(false);
  };

  const filteredGigs = gigs.filter(gig => {
    const matchesSearch = gig.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          gig.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || gig.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const faqs = [
    { q: "Is CampusGig free for students?", a: "Yes, creating an account and listing gigs is 100% free for all verified college students." },
    { q: "How do I get paid for a Gig?", a: "Payments are settled directly between students via UPI or cash upon successful task delivery." },
    { q: "Who can post a task on the platform?", a: "Any student with a valid campus email address can post or apply for gigs." }
  ];

  return (
    <div className="app">
      {/* Navbar */}
      <nav className="navbar">
        <div className="logo">Campus<span>Gig</span></div>
        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#gigs-section">Explore Gigs</a>
          <a href="#testimonials">Reviews</a>
          <a href="#faqs">FAQs</a>
        </div>
        <div className="nav-buttons">
          <button className="login-btn" onClick={() => setShowLogin(true)}>Login</button>
          <button className="signup-btn" onClick={() => setShowSignup(true)}>Join CampusGig</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero" id="home">
        <h1>Turn Your <span>Skills</span> Into Opportunities</h1>
        <p>CampusGig connects talented college students with peers for freelance campus tasks.</p>
        <div className="hero-buttons">
          <a href="#gigs-section" className="explore-btn-link">
            <button className="explore-btn">🔍 Explore Gigs</button>
          </a>
          <button className="freelancer-btn" onClick={() => setShowAddGig(true)}>💼 Post a Gig</button>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="stats-banner">
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
      <section className="how-it-works" id="how-it-works">
        <h2>How CampusGig Works</h2>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3>Post or Search</h3>
            <p>List your freelance service or browse tasks posted by fellow students.</p>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <h3>Connect Directly</h3>
            <p>Chat with peers, discuss requirements, and finalize deadline details.</p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <h3>Deliver & Earn</h3>
            <p>Complete the task, build your campus portfolio, and get paid directly.</p>
          </div>
        </div>
      </section>

      {/* Gigs Directory Section */}
      <section className="gigs-container" id="gigs-section">
        <div className="section-header">
          <h2>Available Campus Gigs</h2>
          <button className="add-gig-btn" onClick={() => setShowAddGig(true)}>+ Add New Gig</button>
        </div>

        {/* Search Bar & Category Filters */}
        <div className="filter-bar">
          <input 
            type="text" 
            placeholder="Search gigs (e.g., React, Design, Notes)..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <div className="category-buttons">
            {['All', 'Coding', 'Design', 'Notes'].map(cat => (
              <button 
                key={cat} 
                className={`cat-btn ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Gigs Grid */}
        <div className="gigs-grid">
          {filteredGigs.length > 0 ? (
            filteredGigs.map((gig) => (
              <div key={gig.id} className="gig-card">
                <span className="badge">{gig.category}</span>
                <h3>{gig.title}</h3>
                <p className="price">{gig.price}</p>
                <div className="author-info">
                  <small>By: <strong>{gig.author || 'Student'}</strong> ({gig.dept})</small>
                  <small>Contact: {gig.contact || 'Direct Chat'}</small>
                </div>
                <button className="apply-btn" onClick={() => alert(`Contact ${gig.author} at ${gig.contact}`)}>Apply Now</button>
              </div>
            ))
          ) : (
            <p className="no-results">No gigs found matching your search.</p>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials" id="testimonials">
        <h2>What Students Say</h2>
        <div className="reviews-grid">
          <div className="review-card">
            <p>"Found a designer for our college fest poster in under 2 hours. Super helpful platform!"</p>
            <h4>- Rohan Mehta (CS, 3rd Year)</h4>
          </div>
          <div className="review-card">
            <p>"Earned ₹2,000 in my free time helping juniors with React assignments."</p>
            <h4>- Sneha Rao (IT, 4th Year)</h4>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="faq-section" id="faqs">
        <h2>Frequently Asked Questions</h2>
        <div className="faq-list">
          {faqs.map((faq, idx) => (
            <div key={idx} className="faq-item" onClick={() => setOpenFaq(openFaq === idx ? null : idx)}>
              <div className="faq-question">
                <h4>{faq.q}</h4>
                <span>{openFaq === idx ? '▲' : '▼'}</span>
              </div>
              {openFaq === idx && <p className="faq-answer">{faq.a}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* Modals */}
      {showLogin && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Student Login</h3>
            <input type="email" placeholder="College Email" />
            <input type="password" placeholder="Password" />
            <div className="modal-actions">
              <button className="submit-btn" onClick={() => setShowLogin(false)}>Login</button>
              <button className="close-btn" onClick={() => setShowLogin(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {showSignup && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Register on CampusGig</h3>
            <input type="text" placeholder="Full Name" />
            <input type="email" placeholder="College Email" />
            <input type="password" placeholder="Password" />
            <div className="modal-actions">
              <button className="submit-btn" onClick={() => setShowSignup(false)}>Register</button>
              <button className="close-btn" onClick={() => setShowSignup(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {showAddGig && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Post a New Campus Gig</h3>
            <form onSubmit={handleAddGig}>
              <input type="text" placeholder="Gig Title" value={newGig.title} onChange={(e) => setNewGig({...newGig, title: e.target.value})} required />
              <select value={newGig.category} onChange={(e) => setNewGig({...newGig, category: e.target.value})} className="modal-select">
                <option value="Coding">Coding</option>
                <option value="Design">Design</option>
                <option value="Notes">Notes</option>
              </select>
              <input type="text" placeholder="Price (e.g. ₹500)" value={newGig.price} onChange={(e) => setNewGig({...newGig, price: e.target.value})} required />
              <input type="text" placeholder="Your Name" value={newGig.author} onChange={(e) => setNewGig({...newGig, author: e.target.value})} required />
              <input type="text" placeholder="Contact Info" value={newGig.contact} onChange={(e) => setNewGig({...newGig, contact: e.target.value})} required />
              <div className="modal-actions">
                <button type="submit" className="submit-btn">Post Gig</button>
                <button type="button" className="close-btn" onClick={() => setShowAddGig(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="footer">
        <p>© 2026 CampusGig - Peer to Peer Student Marketplace | Built for College Capstone Evaluation</p>
      </footer>
    </div>
  );
}

export default App;