import React, { useState, useEffect } from 'react';
import './App.css';

import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';

import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';

import { db, auth } from './firebase';

const CATEGORY_SKILLS = {
  Design: ['UI/UX Design', 'Figma', 'Canva'],
  Coding: ['React', 'JavaScript', 'Python'],
  Notes: ['Technical Writing', 'Research']
};

const currentTime = () =>
  new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

// CampusGig logo icon (inline SVG, koi extra file nahi chahiye)
const LogoIcon = ({ size = 40 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 512 512"
    width={size}
    height={size}
    style={{ flexShrink: 0 }}
    aria-label="CampusGig logo"
  >
    <defs>
      <linearGradient id="cgBg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#34d399" />
        <stop offset="0.55" stopColor="#16a34a" />
        <stop offset="1" stopColor="#166534" />
      </linearGradient>
      <linearGradient id="cgGold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fde047" />
        <stop offset="1" stopColor="#f59e0b" />
      </linearGradient>
      <filter id="cgShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow
          dx="0"
          dy="8"
          stdDeviation="8"
          floodColor="#052e16"
          floodOpacity="0.35"
        />
      </filter>
    </defs>

    <rect width="512" height="512" rx="115" fill="url(#cgBg)" />
    <path
      d="M0 115 Q0 0 115 0 H397 Q512 0 512 115 V200 Q256 120 0 220 Z"
      fill="#ffffff"
      opacity="0.10"
    />

    <g filter="url(#cgShadow)">
      <path
        d="M160 238 V305 Q256 362 352 305 V238 L256 290 Z"
        fill="#e2f5e9"
      />
      <path d="M256 120 L428 202 L256 284 L84 202 Z" fill="#ffffff" />
      <path
        d="M410 211 V292"
        stroke="#fbbf24"
        strokeWidth="9"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="410" cy="304" r="14" fill="url(#cgGold)" />
    </g>

    <g filter="url(#cgShadow)">
      <circle
        cx="372"
        cy="374"
        r="62"
        fill="url(#cgGold)"
        stroke="#ffffff"
        strokeWidth="10"
      />
      <path d="M388 330 L346 382 H372 L360 420 L402 366 H376 Z" fill="#14532d" />
    </g>
  </svg>
);

function App() {
  // ==============================
  // UI STATE
  // ==============================
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('default');

  const [showAddGig, setShowAddGig] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authType, setAuthType] = useState('Login');
  const [openFaq, setOpenFaq] = useState(null);

  // ==============================
  // THEME
  // ==============================
  const [theme, setTheme] = useState(
    () => localStorage.getItem('campusgig-theme') || 'dark'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('campusgig-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  };

  // ==============================
  // FIREBASE AUTH (REAL LOGIN)
  // ==============================
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [nameOverride, setNameOverride] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setFirebaseReady(true);
    });
    return () => unsubscribe();
  }, []);

  const displayName =
    firebaseUser?.displayName ||
    nameOverride ||
    firebaseUser?.email?.split('@')[0] ||
    'Student';

  const [authForm, setAuthForm] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const getAuthErrorMessage = (code) => {
    switch (code) {
      case 'auth/email-already-in-use':
        return 'Ye email already registered hai. Login karo.';
      case 'auth/invalid-email':
        return 'Email sahi nahi hai.';
      case 'auth/weak-password':
        return 'Password kam se kam 6 characters ka rakho.';
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Email ya password galat hai.';
      case 'auth/too-many-requests':
        return 'Bahut attempts ho gaye, thodi der baad try karo.';
      case 'auth/operation-not-allowed':
        return 'Firebase Console me Email/Password sign-in enable karo.';
      default:
        return 'Kuch gadbad ho gayi. Dobara try karo.';
    }
  };

  const isCollegeEmail = (email) => {
    const e = email.trim().toLowerCase();
    return e.endsWith('.edu') || e.endsWith('.ac.in');
  };

  const openAuth = (type) => {
    setAuthType(type);
    setAuthError('');
    setShowAuthModal(true);
  };

  const closeAuth = () => {
    setShowAuthModal(false);
    setAuthError('');
  };

  // Login ke bina action rokne ke liye
  const requireLogin = () => {
    if (!firebaseUser) {
      openAuth('Login');
      return false;
    }
    return true;
  };

  // ==============================
  // NOTIFICATIONS
  // ==============================
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = (text) => {
    setNotifications((prev) => [
      {
        id: Date.now() + Math.random(),
        text,
        time: currentTime(),
        read: false
      },
      ...prev
    ]);
  };

  const markRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // ==============================
  // APPLY / CHAT / PROFILE / PAYMENT STATE
  // ==============================
  const [appliedGigs, setAppliedGigs] = useState([]);

  const [chatOpenFor, setChatOpenFor] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  const [profileOpenFor, setProfileOpenFor] = useState(null);

  const [paymentOpenFor, setPaymentOpenFor] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('idle');

  // ==============================
  // AUTH HANDLERS
  // ==============================
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');

    const { name, email, password } = authForm;

    if (authType === 'Sign Up' && !isCollegeEmail(email)) {
      setAuthError('Sirf college email (.edu / .ac.in) allowed hai.');
      return;
    }

    setAuthLoading(true);

    try {
      if (authType === 'Sign Up') {
        const cred = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
        await updateProfile(cred.user, { displayName: name.trim() });
        setNameOverride(name.trim());
        addNotification(`Welcome to CampusGig, ${name.trim()}! 🎉`);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        addNotification('Login successful!');
      }

      setShowAuthModal(false);
      setAuthForm({ name: '', email: '', password: '' });
    } catch (error) {
      console.error('Auth error:', error);
      setAuthError(getAuthErrorMessage(error.code));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!authForm.email) {
      setAuthError('Pehle email likho, phir "Forgot password" dabao.');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, authForm.email.trim());
      setAuthError('');
      alert('Password reset link email pe bhej diya gaya hai.');
    } catch (error) {
      setAuthError(getAuthErrorMessage(error.code));
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setNameOverride('');
    setAppliedGigs([]);
    setChatOpenFor(null);
    setChatMessages([]);
    setPaymentOpenFor(null);
    setProfileOpenFor(null);
  };

  // ==============================
  // INITIAL GIGS
  // ==============================
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

  // ==============================
  // NEW GIG FORM
  // ==============================
  const [newGig, setNewGig] = useState({
    title: '',
    category: 'Coding',
    price: '',
    paymentType: 'Paid',
    isUrgent: false,
    author: '',
    contact: ''
  });

  const openAddGig = () => {
    if (!requireLogin()) return;
    setNewGig((g) => ({
      ...g,
      author: g.author || displayName,
      contact: g.contact || firebaseUser?.email || ''
    }));
    setShowAddGig(true);
  };

  // ==============================
  // ADD GIG
  // ==============================
  const handleAddGig = (e) => {
    e.preventDefault();

    if (!requireLogin()) return;
    if (!newGig.title) return;

    const gigToAdd = {
      ...newGig,
      id: Date.now(),
      verified: true,
      rating: '5.0 ⭐',
      price:
        newGig.paymentType === 'Skill Swap'
          ? 'Skill Swap 🔄'
          : `₹${newGig.price}`
    };

    setGigs([gigToAdd, ...gigs]);
    setShowAddGig(false);

    setNewGig({
      title: '',
      category: 'Coding',
      price: '',
      paymentType: 'Paid',
      isUrgent: false,
      author: '',
      contact: ''
    });
  };

  // ==============================
  // APPLY
  // ==============================
  const handleApply = (gig) => {
    if (!requireLogin()) return;

    if (appliedGigs.includes(gig.id)) {
      return;
    }

    setAppliedGigs((prev) => [...prev, gig.id]);

    addNotification(
      `You applied to "${gig.title}". ${gig.author
        .split('(')[0]
        .trim()} has been notified.`
    );
  };

  // ==============================
  // CHAT OPEN / CLOSE
  // ==============================
  const openChat = (gig) => {
    if (!requireLogin()) return;

    setChatOpenFor(gig);
    setChatInput('');
    setChatMessages([]);
  };

  const closeChat = () => {
    setChatOpenFor(null);
    setChatInput('');
    setChatMessages([]);
  };

  // ==============================
  // FIREBASE REAL-TIME CHAT
  // ==============================
  const currentUid = firebaseUser?.uid;

  useEffect(() => {
    if (!chatOpenFor || !currentUid) {
      return;
    }

    const messagesRef = collection(
      db,
      'chats',
      String(chatOpenFor.id),
      'messages'
    );

    const messagesQuery = query(messagesRef, orderBy('createdAt', 'asc'));

    setChatLoading(true);

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const messages = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data()
        }));

        setChatMessages(messages);
        setChatLoading(false);
      },
      (error) => {
        console.error('Firebase chat error:', error);
        setChatLoading(false);
      }
    );

    return () => unsubscribe();
  }, [chatOpenFor, currentUid]);

  // ==============================
  // SEND REAL MESSAGE
  // ==============================
  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!chatInput.trim() || !chatOpenFor || !firebaseUser) {
      return;
    }

    const messageText = chatInput.trim();

    try {
      const messagesRef = collection(
        db,
        'chats',
        String(chatOpenFor.id),
        'messages'
      );

      await addDoc(messagesRef, {
        text: messageText,
        senderId: firebaseUser.uid,
        senderName: displayName,
        createdAt: serverTimestamp()
      });

      setChatInput('');
    } catch (error) {
      console.error('Message send failed:', error);

      alert(
        'Message send nahi hua. Firebase Rules aur Authentication check karo.'
      );
    }
  };

  // ==============================
  // PROFILE
  // ==============================
  const openProfile = (gig) => {
    setProfileOpenFor(gig);
  };

  const closeProfile = () => {
    setProfileOpenFor(null);
  };

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
      bio: `${name} is a verified CampusGig freelancer specializing in ${gig.category}. Known for reliable, on-time delivery and clear communication with peers.`
    };
  };

  // ==============================
  // PAYMENT
  // ==============================
  const openPayment = (gig) => {
    if (!requireLogin()) return;

    setPaymentOpenFor(gig);
    setPaymentStatus('idle');
  };

  const closePayment = () => {
    if (paymentStatus !== 'processing') {
      setPaymentOpenFor(null);
      setPaymentStatus('idle');
    }
  };

  const simulatePayment = () => {
    setPaymentStatus('processing');

    setTimeout(() => {
      setPaymentStatus('success');

      addNotification(
        `Payment of ${paymentOpenFor.price} sent for "${paymentOpenFor.title}".`
      );
    }, 1500);
  };

  // ==============================
  // FILTER
  // ==============================
  const filteredGigs = gigs.filter((gig) => {
    const matchesCategory =
      selectedCategory === 'All' || gig.category === selectedCategory;

    const matchesSearch = gig.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  // ==============================
  // PRICE SORT
  // ==============================
  const getPriceValue = (gig) => {
    const match = gig.price.match(/\d+/g);
    return match ? parseInt(match.join(''), 10) : null;
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

  // ==============================
  // FAQ
  // ==============================
  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // ==============================
  // RETURN
  // ==============================
  return (
    <div className="app">
      {/* ==========================
          NAVBAR
      =========================== */}
      <header className="navbar">
        <h1
          className="logo"
          style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
        >
          <LogoIcon size={40} />
          <span style={{ color: 'inherit' }}>
            Campus<span>Gig</span>
          </span>
        </h1>

        <div className="nav-right">
          <div className="nav-links">
            <a href="#home">Home</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#gigs">Explore Gigs</a>
            <a href="#reviews">Reviews</a>
            <a href="#faqs">FAQs</a>
          </div>

          <div className="nav-actions">
            <button
              className="icon-btn theme-toggle"
              onClick={toggleTheme}
              title="Toggle theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            <div className="notif-wrapper">
              <button
                className="icon-btn notif-bell"
                onClick={() => setShowNotifications((s) => !s)}
                title="Notifications"
              >
                🔔
                {unreadCount > 0 && (
                  <span className="notif-badge">{unreadCount}</span>
                )}
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
                    notifications.map((n) => (
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

            {firebaseUser ? (
              <>
                <span className="user-name">👤 {displayName}</span>
                <button className="btn-secondary" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  className="btn-secondary"
                  onClick={() => openAuth('Login')}
                >
                  Login
                </button>

                <button
                  className="btn-primary"
                  onClick={() => openAuth('Sign Up')}
                >
                  Join CampusGig
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ==========================
          HERO
      =========================== */}
      <section id="home" className="hero">
        <h2>
          Turn Your <span>Skills</span> Into Opportunities
        </h2>

        <p>
          CampusGig connects talented college students with peers for freelance
          campus tasks.
        </p>

        <div className="hero-buttons">
          <a href="#gigs" className="btn-primary">
            🔍 Explore Gigs
          </a>

          <button className="btn-outline" onClick={openAddGig}>
            💼 Post a Gig
          </button>
        </div>
      </section>

      {/* ==========================
          STATS
      =========================== */}
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

      {/* ==========================
          HOW IT WORKS
      =========================== */}
      <section id="how-it-works" className="how-it-works">
        <h3>How CampusGig Works</h3>

        <div className="steps-grid">
          <div className="step-card">
            <span className="step-num">1</span>
            <h4>Post or Search</h4>
            <p>
              List your freelance service or browse tasks posted by fellow
              students.
            </p>
          </div>

          <div className="step-card">
            <span className="step-num">2</span>
            <h4>Connect Directly</h4>
            <p>
              Chat with peers, discuss requirements, and finalize deadline
              details.
            </p>
          </div>

          <div className="step-card">
            <span className="step-num">3</span>
            <h4>Deliver & Earn / Swap</h4>
            <p>
              Complete the task, build your campus portfolio, and get paid
              directly.
            </p>
          </div>
        </div>
      </section>

      {/* ==========================
          GIGS
      =========================== */}
      <section id="gigs" className="gigs-container">
        <h3>Available Campus Gigs</h3>

        <div className="search-box">
          <input
            type="text"
            placeholder="Search by skill, topic, or gig title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-buttons">
          {['All', 'Coding', 'Design', 'Notes'].map((cat) => (
            <button
              key={cat}
              className={selectedCategory === cat ? 'active' : ''}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}

          <button className="btn-add-inline" onClick={openAddGig}>
            + Post New Gig
          </button>
        </div>

        <div className="sort-bar">
          <label htmlFor="sort-select">Sort by:</label>

          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="default">Default</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="urgent">Urgent First</option>
          </select>
        </div>

        {/* GIG CARDS */}
        <div className="gigs-grid">
          {sortedGigs.length > 0 ? (
            sortedGigs.map((gig) => {
              const isApplied = appliedGigs.includes(gig.id);

              return (
                <div
                  key={gig.id}
                  className={`gig-card ${gig.isUrgent ? 'urgent-border' : ''}`}
                >
                  <div className="card-tags">
                    <span className="badge category">{gig.category}</span>

                    {gig.isUrgent && (
                      <span className="badge urgent">🔥 URGENT</span>
                    )}

                    {gig.paymentType === 'Skill Swap' && (
                      <span className="badge swap">🔄 SKILL SWAP</span>
                    )}
                  </div>

                  <h4>{gig.title}</h4>

                  <p className="price">{gig.price}</p>

                  <div className="author-info">
                    <span
                      className="author-link"
                      onClick={() => openProfile(gig)}
                    >
                      By {gig.author}
                      {gig.verified && <b title="Verified Student">✅</b>}
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

                    <button className="btn-chat" onClick={() => openChat(gig)}>
                      💬 Chat
                    </button>
                  </div>

                  {isApplied && gig.paymentType === 'Paid' && (
                    <button
                      className="btn-upi"
                      onClick={() => openPayment(gig)}
                    >
                      📱 Pay via UPI
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <p className="no-results">No gigs found matching your search.</p>
          )}
        </div>
      </section>

      {/* ==========================
          REVIEWS
      =========================== */}
      <section id="reviews" className="reviews-section">
        <h3>What Students Say</h3>

        <div className="reviews-grid">
          <div className="review-card">
            <p>
              "Found a designer for our college fest poster in under 2 hours.
              Super helpful platform!"
            </p>
            <h5>- Rishabh Mehta (CS, 3rd Year)</h5>
          </div>

          <div className="review-card">
            <p>
              "Earned ₹2,000 in my free time helping juniors with React
              assignments."
            </p>
            <h5>- Sneha Rao (IT, 4th Year)</h5>
          </div>
        </div>
      </section>

      {/* ==========================
          FAQ
      =========================== */}
      <section id="faqs" className="faqs-section">
        <h3>Frequently Asked Questions</h3>

        <div className="faq-list">
          <div
            className={`faq-item ${openFaq === 0 ? 'open' : ''}`}
            onClick={() => toggleFaq(0)}
          >
            <h4>
              Is CampusGig free for students?
              <span>{openFaq === 0 ? '▲' : '▼'}</span>
            </h4>

            {openFaq === 0 && (
              <p>
                Yes! CampusGig is completely free to browse, post, and apply for
                gigs within your campus community.
              </p>
            )}
          </div>

          <div
            className={`faq-item ${openFaq === 1 ? 'open' : ''}`}
            onClick={() => toggleFaq(1)}
          >
            <h4>
              How do I get paid for a Gig?
              <span>{openFaq === 1 ? '▲' : '▼'}</span>
            </h4>

            {openFaq === 1 && (
              <p>
                You connect directly with the gig poster and can receive payment
                via UPI, cash, or opt for a Skill Swap.
              </p>
            )}
          </div>

          <div
            className={`faq-item ${openFaq === 2 ? 'open' : ''}`}
            onClick={() => toggleFaq(2)}
          >
            <h4>
              Who can post a task on the platform?
              <span>{openFaq === 2 ? '▲' : '▼'}</span>
            </h4>

            {openFaq === 2 && (
              <p>
                Any verified college student can post a task or list their
                skills to offer services to peers.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ==========================
          FOOTER
      =========================== */}
      <footer className="footer">
        <p>
          © 2026 CampusGig | Peer-to-Peer Marketplace | Built for College
          Capstone Evaluation
        </p>
      </footer>

      {/* ==========================
          ADD GIG MODAL
      =========================== */}
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
                onChange={(e) =>
                  setNewGig({ ...newGig, title: e.target.value })
                }
              />

              <select
                value={newGig.category}
                onChange={(e) =>
                  setNewGig({ ...newGig, category: e.target.value })
                }
              >
                <option value="Coding">Coding</option>
                <option value="Design">Design</option>
                <option value="Notes">Notes</option>
              </select>

              <select
                value={newGig.paymentType}
                onChange={(e) =>
                  setNewGig({ ...newGig, paymentType: e.target.value })
                }
              >
                <option value="Paid">Paid (₹)</option>
                <option value="Skill Swap">Skill Swap (Barter)</option>
              </select>

              {newGig.paymentType === 'Paid' && (
                <input
                  type="number"
                  placeholder="Price in ₹"
                  required
                  value={newGig.price}
                  onChange={(e) =>
                    setNewGig({ ...newGig, price: e.target.value })
                  }
                />
              )}

              <input
                type="text"
                placeholder="Your Name & Branch (e.g. Saurabh (CS))"
                required
                value={newGig.author}
                onChange={(e) =>
                  setNewGig({ ...newGig, author: e.target.value })
                }
              />

              <input
                type="email"
                placeholder="Contact Email"
                required
                value={newGig.contact}
                onChange={(e) =>
                  setNewGig({ ...newGig, contact: e.target.value })
                }
              />

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={newGig.isUrgent}
                  onChange={(e) =>
                    setNewGig({ ...newGig, isUrgent: e.target.checked })
                  }
                />
                Mark as 🔥 Urgent (24h Deadline)
              </label>

              <div className="modal-actions">
                <button type="submit" className="btn-primary">
                  Post Gig
                </button>

                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAddGig(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================
          AUTH MODAL (REAL LOGIN)
      =========================== */}
      {showAuthModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{authType} to CampusGig</h3>

            <form onSubmit={handleAuthSubmit}>
              {authType === 'Sign Up' && (
                <input
                  type="text"
                  placeholder="Full Name"
                  required
                  value={authForm.name}
                  onChange={(e) =>
                    setAuthForm({ ...authForm, name: e.target.value })
                  }
                />
              )}

              <input
                type="email"
                placeholder="College Email (.edu / .ac.in)"
                required
                value={authForm.email}
                onChange={(e) =>
                  setAuthForm({ ...authForm, email: e.target.value })
                }
              />

              <input
                type="password"
                placeholder="Password (min 6 characters)"
                required
                minLength={6}
                value={authForm.password}
                onChange={(e) =>
                  setAuthForm({ ...authForm, password: e.target.value })
                }
              />

              {authError && (
                <p style={{ color: '#ff6b6b', fontSize: '14px' }}>
                  {authError}
                </p>
              )}

              {authType === 'Login' && (
                <p
                  style={{ cursor: 'pointer', fontSize: '13px' }}
                  onClick={handleForgotPassword}
                >
                  Forgot password?
                </p>
              )}

              <div className="modal-actions">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={authLoading}
                >
                  {authLoading ? 'Please wait...' : authType}
                </button>

                <button
                  type="button"
                  className="btn-close"
                  onClick={closeAuth}
                >
                  Close
                </button>
              </div>

              <p
                style={{
                  cursor: 'pointer',
                  fontSize: '13px',
                  textAlign: 'center'
                }}
                onClick={() => {
                  setAuthType(authType === 'Login' ? 'Sign Up' : 'Login');
                  setAuthError('');
                }}
              >
                {authType === 'Login'
                  ? 'Account nahi hai? Sign Up karo'
                  : 'Already account hai? Login karo'}
              </p>
            </form>
          </div>
        </div>
      )}

      {/* ==========================
          REAL FIREBASE CHAT MODAL
      =========================== */}
      {chatOpenFor && (
        <div className="modal-overlay" onClick={closeChat}>
          <div
            className="modal chat-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="chat-header">
              <div>
                <h3>💬 Chat</h3>
                <p className="chat-gig-title">{chatOpenFor.title}</p>
              </div>

              <button className="btn-close-icon" onClick={closeChat}>
                ✕
              </button>
            </div>

            <div className="chat-messages">
              {chatLoading && (
                <p className="chat-loading">Loading messages...</p>
              )}

              {!chatLoading && chatMessages.length === 0 && (
                <div className="chat-empty">
                  <div>💬</div>
                  <p>No messages yet.</p>
                  <span>Start the conversation!</span>
                </div>
              )}

              {chatMessages.map((message) => {
                const isMine = message.senderId === firebaseUser?.uid;

                const messageTime = message.createdAt?.toDate
                  ? message.createdAt.toDate().toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                  : '...';

                return (
                  <div
                    key={message.id}
                    className={`chat-bubble ${isMine ? 'me' : 'them'}`}
                  >
                    {!isMine && (
                      <small className="chat-sender">
                        {message.senderName || 'Student'}
                      </small>
                    )}

                    <p>{message.text}</p>

                    <span className="chat-time">{messageTime}</span>
                  </div>
                );
              })}
            </div>

            <form className="chat-input-row" onSubmit={handleSendMessage}>
              <input
                type="text"
                placeholder={
                  firebaseReady ? 'Type a message...' : 'Connecting...'
                }
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={!firebaseReady}
              />

              <button
                type="submit"
                className="btn-primary"
                disabled={
                  !firebaseReady || !firebaseUser || !chatInput.trim()
                }
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==========================
          PROFILE MODAL
      =========================== */}
      {profileOpenFor &&
        (() => {
          const profile = getProfileData(profileOpenFor);

          const initials = profile.name
            .split(' ')
            .map((w) => w[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();

          return (
            <div className="modal-overlay" onClick={closeProfile}>
              <div
                className="modal profile-modal"
                onClick={(e) => e.stopPropagation()}
              >
                <button className="btn-close-icon" onClick={closeProfile}>
                  ✕
                </button>

                <div className="profile-avatar">{initials}</div>

                <h3>{profile.name}</h3>

                <p className="profile-branch">{profile.branch}</p>

                <p className="profile-rating">
                  ⭐ {profile.rating} · {profile.completedGigs} gigs completed
                </p>

                <div className="profile-skills">
                  {profile.skills.map((s) => (
                    <span key={s} className="badge category">
                      {s}
                    </span>
                  ))}
                </div>

                <p className="profile-bio">{profile.bio}</p>
              </div>
            </div>
          );
        })()}

      {/* ==========================
          PAYMENT MODAL
      =========================== */}
      {paymentOpenFor &&
        (() => {
          const amountDigits = paymentOpenFor.price.match(/\d+/g);
          const amount = amountDigits ? amountDigits.join('') : '0';

          const upiId = 'giripawan470@okicici';
          const merchantName = 'CampusGig';

          const upiLink =
            `upi://pay?pa=${encodeURIComponent(upiId)}` +
            `&pn=${encodeURIComponent(merchantName)}` +
            `&am=${encodeURIComponent(amount)}` +
            `&cu=INR`;

          const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
            upiLink
          )}`;

          return (
            <div className="modal-overlay" onClick={closePayment}>
              <div
                className="modal payment-modal"
                onClick={(e) => e.stopPropagation()}
              >
                <h3>Pay via UPI</h3>

                <p className="pay-amount">₹{amount}</p>

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
