import React, { useState, useEffect } from 'react';
import './App.css';
 
// Skill tags shown on a student's profile, based on gig category
const CATEGORY_SKILLS = {
  Design: ['UI/UX Design', 'Figma', 'Canva'],
  Coding: ['React', 'JavaScript', 'Python'],
  Notes: ['Technical Writing', 'Research'],
};
 
const CHAT_AUTO_REPLIES = [
  "Sounds good, let's finalize the deadline.",
  "Sure, I can share more details over chat.",
  "Great! I'll send the requirements shortly.",
  "Thanks for reaching out, let's get started.",
];
 
const currentTime = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
 
function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('default');
  const [showAddGig, setShowAddGig] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authType, setAuthType] = useState('Login');
  const [openFaq, setOpenFaq] = useState(null);
 
  // --- Theme (Dark / Light mode) ---
  const [theme, setTheme] = useState(() => localStorage.getItem('campusgig-theme') || 'dark');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('campusgig-theme', theme);
  }, [theme]);
  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));
 
  // --- Notifications ---
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;
 
  const addNotification = (text) => {
    setNotifications(prev => [{ id: Date.now() + Math.random(), text, time: currentTime(), read: false }, ...prev]);
  };
  const markRead = (id) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  };
  const clearNotifications = () => setNotifications([]);
 
  // --- Applications, Chat, Profile, Payment ---
  const [appliedGigs, setAppliedGigs] = useState([]);
  const [chatThreads, setChatThreads] = useState({});
  const [chatOpenFor, setChatOpenFor] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [profileOpenFor, setProfileOpenFor] = useState(null);
  const [paymentOpenFor, setPaymentOpenFor] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('idle'); // idle | processing | success
 
  // Initial Dynamic Gigs List
  const [gigs, setGigs] = useState([
    {
      id: 1,
      title: 'UI/UX Design for College Fest App',
      category: 'Design',
      price: '₹500',
      isUrgent: true,
      paymentType: 'Paid',
      author: 'saurabh giri (CS)',
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
      author: 'Ritika singh (IT)',
      verified: true,
      rating: '4.8 ⭐',
      contact: 'ritik@campus.edu'
    },
    {
      id: 3,
      title: 'Python Data Science Practical Notes',
      category: 'Notes',
      price: '₹300',
      isUrgent: true,
      paymentType: 'Paid',
      author: 'hasan shaikh (EC)',
      verified: false,
      rating: '4.5 ⭐',
      contact: 'hasan@campus.edu'
    },
    {
      id: 4,
      title: 'Video Editing for Tech Fest Promo',
      category: 'Design',
      price: '₹1000',
      isUrgent: false,
      paymentType: 'Paid',
      author: 'sunny gupta (CE)',
      verified: true,
      rating: '5.0 ⭐',
      contact: 'sunnygupta@campus.edu'
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
 
  // --- Apply Now (fixed: real in-app action instead of mailto) ---
  const handleApply = (gig) => {
    if (appliedGigs.includes(gig.id)) return;
    setAppliedGigs(prev => [...prev, gig.id]);
    addNotification(`You applied to "${gig.title}". ${gig.author.split('(')[0].trim()} has been notified.`);
    setChatThreads(prev => ({
      ...prev,
      [gig.id]: prev[gig.id] || [
        { sender: 'them', text: `Hi! Thanks for applying to "${gig.title}". Let's discuss the details here.`, time: currentTime() }
      ]
    }));
  };
 
  // --- Chat ---
  const openChat = (gig) => setChatOpenFor(gig);
  const closeChat = () => { setChatOpenFor(null); setChatInput(''); };
 
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !chatOpenFor) return;
    const gigId = chatOpenFor.id;
    const myMessage = { sender: 'me', text: chatInput.trim(), time: currentTime() };
    setChatThreads(prev => ({ ...prev, [gigId]: [...(prev[gigId] || []), myMessage] }));
    setChatInput('');
 
    setTimeout(() => {
      const reply = CHAT_AUTO_REPLIES[Math.floor(Math.random() * CHAT_AUTO_REPLIES.length)];
      setChatThreads(prev => ({
        ...prev,
        [gigId]: [...(prev[gigId] || []), { sender: 'them', text: reply, time: currentTime() }]
      }));
    }, 1200);
  };
 
  // --- Profile ---
  const openProfile = (gig) => setProfileOpenFor(gig);
  const closeProfile = () => setProfileOpenFor(null);
 
  const getProfileData = (gig) => {
    const [namePart, branchPart] = gig.author.split('(');
    const name = namePart.trim();
    const branch = branchPart ? `(${branchPart.trim()}` : '';
    const skills = CATEGORY_SKILLS[gig.category] || ['Freelancing'];
    const completedGigs = (gig.id % 12) + 3;
    return {
      name,
      branch,
      skills,
      completedGigs,
      rating: gig.rating,
      bio: `${name} is a verified CampusGig freelancer specializing in ${gig.category}. Known for reliable, on-time delivery and clear communication with peers.`,
    };
  };
 
  // --- Payment (UPI mock) ---
  const openPayment = (gig) => { setPaymentOpenFor(gig); setPaymentStatus('idle'); };
  const closePayment = () => { if (paymentStatus !== 'processing') { setPaymentOpenFor(null); setPaymentStatus('idle'); } };
 
  const simulatePayment = () => {
    setPaymentStatus('processing');
    setTimeout(() => {
      setPaymentStatus('success');
      addNotification(`Payment of ${paymentOpenFor.price} sent for "${paymentOpenFor.title}".`);
    }, 1500);
  };
 
  // --- Filter + Sort Logic ---
  const filteredGigs = gigs.filter(gig => {
    const matchesCategory = selectedCategory === 'All' || gig.category === selectedCategory;
    const matchesSearch = gig.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
 
  const getPriceValue = (gig) => {
    const match = gig.price.match(/\d+/g);
    return match ? parseInt(match.join(''), 10) : null; // null = Skill Swap, no numeric price
  };
 
  const sortedGigs = [...filteredGigs].sort((a, b) => {
    if (sortBy === 'price-low' || sortBy === 'price-high') {
      const pa = getPriceValue(a);
      const pb = getPriceValue(b);
      if (pa === null && pb === null) return 0;
      if (pa === null) return 1;
      if (pb === null) return -1;
      return sortBy === 'price-low' ? pa - pb : pb - pa;
    }
    if (sortBy === 'urgent') {
      return (b.isUrgent === true) - (a.isUrgent === true);
    }
    return 0;
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
        <div className="nav-right">
          <div className="nav-links">
            <a href="#home">Home</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#gigs">Explore Gigs</a>
            <a href="#reviews">Reviews</a>
            <a href="#faqs">FAQs</a>
          </div>
          <div className="nav-actions">
            <button className="icon-btn theme-toggle" onClick={toggleTheme} title="Toggle theme">
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <div className="notif-wrapper">
              <button
                className="icon-btn notif-bell"
                onClick={() => setShowNotifications(s => !s)}
                title="Notifications"
              >
                🔔
                {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
              </button>
              {showNotifications && (
                <div className="notif-dropdown">
                  <div className="notif-header">
                    <h4>Notifications</h4>
                    {notifications.length > 0 && (
                      <button onClick={clearNotifications}>Clear all</button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <p className="notif-empty">No notifications yet</p>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        className={`notif-item ${n.read ? '' : 'unread'}`}
                        onClick={() => markRead(n.id)}
                      >
                        <p>{n.text}</p>
                        <span className="notif-time">{n.time}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            <button className="btn-secondary" onClick={() => openAuth('Login')}>Login</button>
            <button className="btn-primary" onClick={() => openAuth('Sign Up')}>Join CampusGig</button>
          </div>
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
          <h3>1000+</h3>
          <p>Active Students</p>
        </div>
        <div className="stat-card">
          <h3>500+</h3>
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
 
        {/* Sort Bar */}
        <div className="sort-bar">
          <label htmlFor="sort-select">Sort by:</label>
          <select id="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="default">Default</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="urgent">Urgent First</option>
          </select>
        </div>
 
        {/* Gig Cards Grid */}
        <div className="gigs-grid">
          {sortedGigs.length > 0 ? (
            sortedGigs.map(gig => {
              const isApplied = appliedGigs.includes(gig.id);
              return (
                <div key={gig.id} className={`gig-card ${gig.isUrgent ? 'urgent-border' : ''}`}>
                  <div className="card-tags">
                    <span className="badge category">{gig.category}</span>
                    {gig.isUrgent && <span className="badge urgent">🔥 URGENT</span>}
                    {gig.paymentType === 'Skill Swap' && <span className="badge swap">🔄 SKILL SWAP</span>}
                  </div>
 
                  <h4>{gig.title}</h4>
                  <p className="price">{gig.price}</p>
 
                  <div className="author-info">
                    <span className="author-link" onClick={() => openProfile(gig)}>
                      By {gig.author} {gig.verified && <b title="Verified Student">✅</b>}
                    </span>
                    <span className="rating">{gig.rating}</span>
                  </div>
 
                  <div className="card-actions">
                    <button
                      className={`btn-apply ${isApplied ? 'applied' : ''}`}
                      onClick={() => handleApply(gig)}
                      disabled={isApplied}
                    >
                      {isApplied ? '✓ Applied' : 'Apply Now'}
                    </button>
                    <button className="btn-chat" onClick={() => openChat(gig)}>💬 Chat</button>
                  </div>
 
                  {isApplied && gig.paymentType === 'Paid' && (
                    <button className="btn-upi" onClick={() => openPayment(gig)}>📱 Pay via UPI</button>
                  )}
                </div>
              );
            })
          ) : (
            <p className="no-results">No gigs found matching your search.</p>
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
                onChange={(e) => setNewGig({ ...newGig, title: e.target.value })}
              />
 
              <select onChange={(e) => setNewGig({ ...newGig, category: e.target.value })}>
                <option value="Coding">Coding</option>
                <option value="Design">Design</option>
                <option value="Notes">Notes</option>
              </select>
 
              <select onChange={(e) => setNewGig({ ...newGig, paymentType: e.target.value })}>
                <option value="Paid">Paid (₹)</option>
                <option value="Skill Swap">Skill Swap (Barter)</option>
              </select>
 
              {newGig.paymentType === 'Paid' && (
                <input
                  type="number"
                  placeholder="Price in ₹"
                  required
                  value={newGig.price}
                  onChange={(e) => setNewGig({ ...newGig, price: e.target.value })}
                />
              )}
 
              <input
                type="text"
                placeholder="Your Name & Branch (e.g. Saurabh - CS)"
                required
                value={newGig.author}
                onChange={(e) => setNewGig({ ...newGig, author: e.target.value })}
              />
 
              <input
                type="email"
                placeholder="Contact Email"
                required
                value={newGig.contact}
                onChange={(e) => setNewGig({ ...newGig, contact: e.target.value })}
              />
 
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={newGig.isUrgent}
                  onChange={(e) => setNewGig({ ...newGig, isUrgent: e.target.checked })}
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
 
      {/* Chat Modal */}
      {chatOpenFor && (
        <div className="modal-overlay" onClick={closeChat}>
          <div className="modal chat-modal" onClick={(e) => e.stopPropagation()}>
            <div className="chat-header">
              <h3>💬 {chatOpenFor.title}</h3>
              <button className="btn-close-icon" onClick={closeChat}>✕</button>
            </div>
            <div className="chat-messages">
              {(chatThreads[chatOpenFor.id] || []).map((m, i) => (
                <div key={i} className={`chat-bubble ${m.sender === 'me' ? 'me' : 'them'}`}>
                  <p>{m.text}</p>
                  <span className="chat-time">{m.time}</span>
                </div>
              ))}
            </div>
            <form className="chat-input-row" onSubmit={handleSendMessage}>
              <input
                type="text"
                placeholder="Type a message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
              />
              <button type="submit" className="btn-primary">Send</button>
            </form>
          </div>
        </div>
      )}
 
      {/* Profile Modal */}
      {profileOpenFor && (() => {
        const profile = getProfileData(profileOpenFor);
        const initials = profile.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
        return (
          <div className="modal-overlay" onClick={closeProfile}>
            <div className="modal profile-modal" onClick={(e) => e.stopPropagation()}>
              <button className="btn-close-icon" onClick={closeProfile}>✕</button>
              <div className="profile-avatar">{initials}</div>
              <h3>{profile.name}</h3>
              <p className="profile-branch">{profile.branch}</p>
              <p className="profile-rating">⭐ {profile.rating} · {profile.completedGigs} gigs completed</p>
              <div className="profile-skills">
                {profile.skills.map(s => <span key={s} className="badge category">{s}</span>)}
              </div>
              <p className="profile-bio">{profile.bio}</p>
            </div>
          </div>
        );
      })()}
 
      {/* Payment Modal (UPI) */}
      {paymentOpenFor && (() => {
        const amountDigits = paymentOpenFor.price.match(/\d+/g);
        const amount = amountDigits ? amountDigits.join('') : '0';

        // IMPORTANT: Put your REAL and ACTIVE UPI ID here
        const upiId = "giripawan470@okicici";

        const merchantName = "CampusGig";

        const upiLink =
          `upi://pay?pa=${encodeURIComponent(upiId)}` +
          `&pn=${encodeURIComponent(merchantName)}` +
          `&am=${encodeURIComponent(amount)}` +
          `&cu=INR`;

        const qrUrl =
          `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiLink)}`;

        return (
          <div className="modal-overlay" onClick={closePayment}>
            <div
              className="modal payment-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Pay via UPI</h3>

              <p className="pay-amount">
                ₹{amount}
              </p>

              {paymentStatus === 'success' ? (
                <div className="pay-success">
                  <p>✅ Payment Successful!</p>

                  <p className="pay-sub">
                    Payment completed for "{paymentOpenFor.title}"
                  </p>
                </div>
              ) : (
                <>
                  <img
                    className="upi-qr"
                    src={qrUrl}
                    alt="UPI Payment QR Code"
                  />

                  <p className="upi-id">
                    UPI ID: <b>{upiId}</b>
                  </p>

                  <p className="scan-text">
                    Scan this QR code using Google Pay, PhonePe or Paytm
                  </p>

                  <button
                    className="btn-primary"
                    disabled={paymentStatus === 'processing'}
                    onClick={simulatePayment}
                  >
                    {paymentStatus === 'processing'
                      ? 'Processing...'
                      : 'Simulate Payment'}
                  </button>
                </>
              )}

              <button
                className="btn-close"
                onClick={closePayment}
                disabled={paymentStatus === 'processing'}
              >
                Close
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
 
export default App;