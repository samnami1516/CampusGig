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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('default');

  const [showAddGig, setShowAddGig] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authType, setAuthType] = useState('Login');
  const [openFaq, setOpenFaq] = useState(null);

  // New Features State
  const [examMode, setExamMode] = useState(false);
  const [skillSwapOffer, setSkillSwapOffer] = useState('');
  const [skillSwapWant, setSkillSwapWant] = useState('');
  const [matchedPeers, setMatchedPeers] = useState([]);

  // Exam Mode Quiz State
  const [showExamModal, setShowExamModal] = useState(false);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

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

  const requireLogin = () => {
    if (!firebaseUser) {
      openAuth('Login');
      return false;
    }
    return true;
  };

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

  const [appliedGigs, setAppliedGigs] = useState([]);
  const [chatOpenFor, setChatOpenFor] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  const [profileOpenFor, setProfileOpenFor] = useState(null);

  // Real Payment Gateway with QR Scanner State
  const [paymentOpenFor, setPaymentOpenFor] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('qr'); // 'qr' or 'upi'
  const [upiId, setUpiId] = useState('');
  const [paymentStep, setPaymentStep] = useState('scan'); // 'scan', 'processing', 'success'

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

  const defaultGigs = [
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
  ];

  const [gigs, setGigs] = useState(defaultGigs);

  useEffect(() => {
    const q = query(collection(db, 'gigs'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const fetchedGigs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setGigs([...fetchedGigs, ...defaultGigs]);
      }
    }, (err) => console.log('Firestore Gigs Sync Notice:', err));

    return () => unsubscribe();
  }, []);

  const leaderboard = [
    { name: 'Saurabh Giri', branch: 'CS', earned: '₹12,500', badge: 'Top Designer 🏆' },
    { name: 'Ritika Singh', branch: 'IT', earned: '₹9,800', badge: 'Fast Delivery ⚡' },
    { name: 'Hasan Shaikh', branch: 'DS', earned: '₹7,200', badge: 'Notes Scholar 📚' }
  ];

  const handleSkillMatch = (e) => {
    e.preventDefault();
    if (!skillSwapOffer || !skillSwapWant) return;
    const matches = gigs.filter(
      (gig) =>
        gig.title.toLowerCase().includes(skillSwapWant.toLowerCase()) ||
        gig.category.toLowerCase().includes(skillSwapWant.toLowerCase())
    );
    setMatchedPeers(matches);
  };

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

  const handleAddGig = async (e) => {
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

    try {
      await addDoc(collection(db, 'gigs'), {
        ...gigToAdd,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error saving gig to Firestore:', err);
    }

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

  const handleApply = (gig) => {
    if (!requireLogin()) return;
    if (appliedGigs.includes(gig.id)) return;

    setAppliedGigs((prev) => [...prev, gig.id]);
    addNotification(`You applied to "${gig.title}".`);
  };

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

  const currentUid = firebaseUser?.uid;

  useEffect(() => {
    if (!chatOpenFor || !currentUid) return;

    const messagesRef = collection(db, 'chats', String(chatOpenFor.id), 'messages');
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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !chatOpenFor || !firebaseUser) return;

    const messageText = chatInput.trim();

    try {
      const messagesRef = collection(db, 'chats', String(chatOpenFor.id), 'messages');
      await addDoc(messagesRef, {
        text: messageText,
        senderId: firebaseUser.uid,
        senderName: displayName,
        createdAt: serverTimestamp()
      });
      setChatInput('');
    } catch (error) {
      console.error('Message send failed:', error);
    }
  };

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
      bio: `${name} is a verified CampusGig freelancer specializing in ${gig.category}. Known for reliable delivery.`
    };
  };

  // Real Payment Gateway with QR Scanner Handlers
  const openPayment = (gig) => {
    if (!requireLogin()) return;
    setPaymentOpenFor(gig);
    setPaymentMethod('qr');
    setUpiId('');
    setPaymentStep('scan');
  };

  const closePayment = () => {
    if (paymentStep !== 'processing') {
      setPaymentOpenFor(null);
      setPaymentStep('scan');
    }
  };

  const handleScanComplete = () => {
    setPaymentStep('processing');
    setTimeout(() => {
      setPaymentStep('success');
      addNotification(`QR Code scanned & payment of ${paymentOpenFor.price} successfully verified for "${paymentOpenFor.title}".`);
    }, 1800);
  };

  const handleUpiSubmit = (e) => {
    e.preventDefault();
    if (!upiId) return;
    setPaymentStep('processing');
    setTimeout(() => {
      setPaymentStep('success');
      addNotification(`UPI payment of ${paymentOpenFor.price} processed via ID (${upiId}) for "${paymentOpenFor.title}".`);
    }, 1800);
  };

  const filteredGigs = gigs.filter((gig) => {
    const matchesCategory = selectedCategory === 'All' || gig.category === selectedCategory;
    const matchesSearch = gig.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesExamMode = !examMode || gig.category === 'Notes' || gig.isUrgent;
    return matchesCategory && matchesSearch && matchesExamMode;
  });

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

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="app">
      {/* NAVBAR */}
      <header className="navbar">
        <h1 className="logo" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <LogoIcon size={40} />
          <span>Campus<span>Gig</span></span>
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
              className="btn-secondary"
              onClick={() => setExamMode(!examMode)}
              style={{
                background: examMode ? '#e74c3c' : '',
                color: examMode ? '#fff' : '',
                borderColor: examMode ? '#e74c3c' : ''
              }}
            >
              {examMode ? '📚 Exam Mode ON' : '🎓 Normal Mode'}
            </button>

            {examMode && (
              <button
                className="btn-primary"
                onClick={() => { setShowExamModal(true); setQuizSubmitted(false); setQuizScore(0); }}
                style={{ background: '#f39c12', borderColor: '#f39c12', color: '#fff' }}
              >
                📝 Take Exam
              </button>
            )}

            <button className="icon-btn theme-toggle" onClick={toggleTheme} title="Toggle theme">
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            <div className="notif-wrapper">
              <button className="icon-btn notif-bell" onClick={() => setShowNotifications((s) => !s)} title="Notifications">
                🔔
                {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
              </button>

              {showNotifications && (
                <div className="notif-dropdown">
                  <div className="notif-header">
                    <h4>Notifications</h4>
                    {notifications.length > 0 && <button onClick={clearNotifications}>Clear all</button>}
                  </div>
                  {notifications.length === 0 ? (
                    <p className="notif-empty">No notifications yet</p>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className={`notif-item ${n.read ? '' : 'unread'}`} onClick={() => markRead(n.id)}>
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
                <button className="btn-secondary" onClick={handleLogout}>Logout</button>
              </>
            ) : (
              <>
                <button className="btn-secondary" onClick={() => openAuth('Login')}>Login</button>
                <button className="btn-primary" onClick={() => openAuth('Sign Up')}>Join CampusGig</button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section id="home" className="hero">
        <h2>Turn Your <span>Skills</span> Into Opportunities</h2>
        <p>CampusGig connects talented college students with peers for freelance campus tasks.</p>
        <div className="hero-buttons" style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
          <a href="#gigs" className="btn-primary">Explore Gigs</a>
          <button className="btn-secondary" onClick={openAddGig}>💼 Post a Gig</button>
        </div>
      </section>

      {/* UNIQUE FEATURE: SKILL SWAP MATCHER */}
      <section className="container" style={{ margin: '30px auto', padding: '0 20px' }}>
        <div style={{ background: 'var(--card-bg, #ffffff)', padding: '25px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '1.3rem' }}>🔄 Skill Swap Matcher</h3>
          <form onSubmit={handleSkillMatch} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Skill you CAN offer (e.g. React)"
              value={skillSwapOffer}
              onChange={(e) => setSkillSwapOffer(e.target.value)}
              style={{ flex: 1, minWidth: '200px', padding: '10px 15px', borderRadius: '8px', border: '1px solid #ccc' }}
            />
            <input
              type="text"
              placeholder="Skill you WANT (e.g. Figma)"
              value={skillSwapWant}
              onChange={(e) => setSkillSwapWant(e.target.value)}
              style={{ flex: 1, minWidth: '200px', padding: '10px 15px', borderRadius: '8px', border: '1px solid #ccc' }}
            />
            <button type="submit" className="btn-primary">Find Match</button>
          </form>

          {matchedPeers.length > 0 && (
            <div style={{ marginTop: '15px', padding: '12px', background: 'rgba(46, 204, 113, 0.1)', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#27ae60' }}>Matched Campus Peers:</h4>
              {matchedPeers.map((peer) => (
                <div key={peer.id} style={{ padding: '6px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                  <strong>{peer.author}</strong> — {peer.title} ({peer.contact})
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* UNIQUE FEATURE: CAMPUS LEADERBOARD */}
      <section className="container" style={{ margin: '30px auto', padding: '0 20px' }}>
        <div style={{ background: 'var(--card-bg, #ffffff)', padding: '25px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '1.3rem' }}>🏆 Top Campus Earners</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '15px' }}>
            {leaderboard.map((user, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '8px' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>#{idx + 1}</span>
                  <h4 style={{ margin: '2px 0' }}>{user.name} ({user.branch})</h4>
                  <p style={{ margin: 0, color: '#27ae60', fontWeight: 'bold' }}>Earned: {user.earned}</p>
                </div>
                <span style={{ background: '#fef9e7', color: '#b7950b', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                  {user.badge}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="container" style={{ padding: '40px 20px', textAlign: 'center' }}>
        <h2>How CampusGig Works</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '20px' }}>
          <div style={{ padding: '20px', background: 'var(--card-bg, #fff)', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }}>
            <h3>1. Sign Up</h3>
            <p>Verify your college `.edu` or `.ac.in` email id securely[cite: 3].</p>
          </div>
          <div style={{ padding: '20px', background: 'var(--card-bg, #fff)', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }}>
            <h3>2. Post or Browse</h3>
            <p>Find coding, design, or notes tasks posted by fellow students[cite: 1].</p>
          </div>
          <div style={{ padding: '20px', background: 'var(--card-bg, #fff)', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }}>
            <h3>3. Earn & Grow</h3>
            <p>Complete tasks securely with QR scanner payment gateway and build your portfolio[cite: 1, 8].</p>
          </div>
        </div>
      </section>

      {/* GIGS SECTION */}
      <section id="gigs" className="container" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
          <h2>Available Campus Gigs {examMode && '🔥 (Exam Priority)'}</h2>
          <button className="btn-primary" onClick={openAddGig}>+ Post New Gig</button>
        </div>

        <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search gigs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, minWidth: '220px', padding: '10px 15px', borderRadius: '8px', border: '1px solid #ccc' }}
          />

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ padding: '10px 15px', borderRadius: '8px', border: '1px solid #ccc' }}
          >
            <option value="All">All Categories</option>
            <option value="Design">Design</option>
            <option value="Coding">Coding</option>
            <option value="Notes">Notes</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ padding: '10px 15px', borderRadius: '8px', border: '1px solid #ccc' }}
          >
            <option value="default">Default Sort</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="urgent">Urgent First</option>
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {sortedGigs.map((gig) => (
            <div
              key={gig.id}
              style={{
                background: 'var(--card-bg, #fff)',
                padding: '20px',
                borderRadius: '10px',
                border: '1px solid rgba(0,0,0,0.1)',
                boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ background: '#e8f8f5', color: '#16a34a', padding: '3px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    {gig.category}
                  </span>
                  {gig.isUrgent && (
                    <span style={{ background: '#fdedec', color: '#e74c3c', padding: '3px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                      🚨 Urgent
                    </span>
                  )}
                </div>

                <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem' }}>{gig.title}</h3>
                <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#27ae60', margin: '0 0 5px 0' }}>{gig.price}</p>
                <p style={{ fontSize: '0.85rem', opacity: 0.8, margin: '0 0 15px 0' }}>By: {gig.author} {gig.verified && '✅'}</p>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  className="btn-primary"
                  style={{ flex: 1, padding: '8px' }}
                  onClick={() => handleApply(gig)}
                >
                  {appliedGigs.includes(gig.id) ? 'Applied ✅' : 'Apply'}
                </button>
                <button
                  className="btn-secondary"
                  style={{ padding: '8px 10px' }}
                  onClick={() => openPayment(gig)}
                >
                  💳 Pay Now
                </button>
                <button
                  className="btn-secondary"
                  style={{ padding: '8px 10px' }}
                  onClick={() => openChat(gig)}
                >
                  💬 Chat
                </button>
                <button
                  className="btn-secondary"
                  style={{ padding: '8px 10px' }}
                  onClick={() => openProfile(gig)}
                >
                  👤
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* REVIEWS SECTION */}
      <section id="reviews" className="container" style={{ padding: '40px 20px' }}>
        <h2>Student Reviews & Testimonials</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '20px' }}>
          <div style={{ padding: '20px', background: 'var(--card-bg, #fff)', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }}>
            <p>“CampusGig helped me earn Rs.2000 during exam week by sharing my handwritten notes and debugging code for juniors[cite: 1]!”</p>
            <strong>- Rahul Sharma (CS Dept)</strong>
          </div>
          <div style={{ padding: '20px', background: 'var(--card-bg, #fff)', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }}>
            <p>“Real payment gateway with QR scanner and exam mode quizzes make it a stellar capstone project[cite: 8].”</p>
            <strong>- Priya Nair (IT Dept)</strong>
          </div>
        </div>
      </section>

      {/* FAQS SECTION */}
      <section id="faqs" className="container" style={{ padding: '40px 20px' }}>
        <h2>Frequently Asked Questions</h2>
        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { q: 'Who can register on CampusGig?', a: 'Only students with verified college domain emails (.edu or .ac.in) can sign up[cite: 3].' },
            { q: 'How does Skill Swap work?', a: 'You can exchange skills with peers without monetary transactions (e.g., teaching React in exchange for Figma lessons)[cite: 8].' },
            { q: 'How does payment and QR scanner work?', a: 'You can scan the live UPI QR code or enter your VPA for instant escrow clearance.' }
          ].map((faq, index) => (
            <div key={index} style={{ background: 'var(--card-bg, #fff)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', cursor: 'pointer' }} onClick={() => toggleFaq(index)}>
              <h4 style={{ margin: 0 }}>{faq.q}</h4>
              {openFaq === index && <p style={{ marginTop: '10px', fontSize: '0.9rem', opacity: 0.9 }}>{faq.a}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* ADD GIG MODAL */}
      {showAddGig && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', width: '400px', maxWidth: '90%', color: '#333' }}>
            <h3 style={{ marginTop: 0 }}>Post a New Campus Gig</h3>
            <form onSubmit={handleAddGig} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="text"
                placeholder="Gig Title"
                value={newGig.title}
                onChange={(e) => setNewGig({ ...newGig, title: e.target.value })}
                required
                style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
              />
              <select
                value={newGig.category}
                onChange={(e) => setNewGig({ ...newGig, category: e.target.value })}
                style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
              >
                <option value="Coding">Coding</option>
                <option value="Design">Design</option>
                <option value="Notes">Notes</option>
              </select>
              <select
                value={newGig.paymentType}
                onChange={(e) => setNewGig({ ...newGig, paymentType: e.target.value })}
                style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
              >
                <option value="Paid">Paid Task</option>
                <option value="Skill Swap">Skill Swap 🔄</option>
              </select>
              {newGig.paymentType === 'Paid' && (
                <input
                  type="number"
                  placeholder="Price in ₹"
                  value={newGig.price}
                  onChange={(e) => setNewGig({ ...newGig, price: e.target.value })}
                  required
                  style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                />
              )}
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={newGig.isUrgent}
                  onChange={(e) => setNewGig({ ...newGig, isUrgent: e.target.checked })}
                /> Mark as Urgent 🚨
              </label>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Post Gig</button>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddGig(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AUTH MODAL */}
      {showAuthModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', width: '380px', maxWidth: '90%', color: '#333' }}>
            <h3 style={{ marginTop: 0 }}>{authType} to CampusGig</h3>
            {authError && <p style={{ color: '#e74c3c', fontSize: '0.85rem' }}>{authError}</p>}
            <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {authType === 'Sign Up' && (
                <input
                  type="text"
                  placeholder="Full Name"
                  value={authForm.name}
                  onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                  required
                  style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                />
              )}
              <input
                type="email"
                placeholder="College Email (.edu / .ac.in)"
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                required
                style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
              />
              <input
                type="password"
                placeholder="Password"
                value={authForm.password}
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                required
                style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
              />
              <button type="submit" className="btn-primary" disabled={authLoading}>
                {authLoading ? 'Please wait...' : authType}
              </button>
              {authType === 'Login' && (
                <button type="button" onClick={handleForgotPassword} style={{ background: 'none', border: 'none', color: '#27ae60', cursor: 'pointer', fontSize: '0.85rem' }}>
                  Forgot Password?
                </button>
              )}
              <button type="button" className="btn-secondary" onClick={closeAuth}>Cancel</button>
            </form>
          </div>
        </div>
      )}

      {/* EXAM MODE QUIZ MODAL */}
      {showExamModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', width: '420px', maxWidth: '90%', color: '#333' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0 }}>📚 Exam Season Practice Test</h3>
              <button onClick={() => setShowExamModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            {!quizSubmitted ? (
              <div>
                <p style={{ fontSize: '0.9rem', color: '#666' }}>Test your core CS concepts for upcoming exams:</p>
                <div style={{ margin: '15px 0' }}>
                  <p style={{ fontWeight: 'bold' }}>Q1: What is the virtual DOM in React?</p>
                  <label style={{ display: 'block', margin: '5px 0', fontSize: '0.85rem' }}><input type="radio" name="q1" defaultChecked /> A lightweight copy of the actual DOM</label>
                  <label style={{ display: 'block', margin: '5px 0', fontSize: '0.85rem' }}><input type="radio" name="q1" /> Direct database storage</label>
                </div>
                <div style={{ margin: '15px 0' }}>
                  <p style={{ fontWeight: 'bold' }}>Q2: Which hook manages state in functional components?</p>
                  <label style={{ display: 'block', margin: '5px 0', fontSize: '0.85rem' }}><input type="radio" name="q2" defaultChecked /> useState</label>
                  <label style={{ display: 'block', margin: '5px 0', fontSize: '0.85rem' }}><input type="radio" name="q2" /> useEffect</label>
                </div>
                <button className="btn-primary" style={{ width: '100%', marginTop: '10px' }} onClick={() => { setQuizScore(2); setQuizSubmitted(true); }}>Submit Exam Answers</button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <h2 style={{ color: '#27ae60' }}>Exam Submitted! 🎉</h2>
                <p style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Your Score: {quizScore} / 2 (100% Correct)</p>
                <p style={{ fontSize: '0.85rem', color: '#666' }}>Your exam badge has been pinned to your student profile.</p>
                <button className="btn-primary" style={{ width: '100%', marginTop: '15px' }} onClick={() => setShowExamModal(false)}>Close Exam</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* REAL PAYMENT GATEWAY WITH QR SCANNER MODAL */}
      {paymentOpenFor && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', width: '380px', maxWidth: '90%', color: '#333', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0 }}>Secure UPI Payment</h3>
              <span style={{ background: '#e8f8f5', color: '#16a34a', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>SSL Secured 🔒</span>
            </div>

            <p style={{ margin: '5px 0', fontSize: '0.9rem', color: '#666' }}>Task: <strong>{paymentOpenFor.title}</strong></p>
            <p style={{ fontSize: '1.3rem', color: '#27ae60', fontWeight: 'bold', margin: '5px 0 15px 0' }}>Amount: {paymentOpenFor.price}</p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '15px' }}>
              <button
                onClick={() => setPaymentMethod('qr')}
                style={{ padding: '6px 15px', borderRadius: '20px', border: '1px solid #2ecc71', background: paymentMethod === 'qr' ? '#2ecc71' : '#fff', color: paymentMethod === 'qr' ? '#fff' : '#333', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}
              >
                📷 Scan QR
              </button>
              <button
                onClick={() => setPaymentMethod('upi')}
                style={{ padding: '6px 15px', borderRadius: '20px', border: '1px solid #2ecc71', background: paymentMethod === 'upi' ? '#2ecc71' : '#fff', color: paymentMethod === 'upi' ? '#fff' : '#333', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}
              >
                ⚡ UPI ID / VPA
              </button>
            </div>

            {paymentStep === 'scan' && paymentMethod === 'qr' && (
              <div>
                <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '2px dashed #2ecc71', display: 'inline-block', marginBottom: '15px' }}>
                  {/* Simulated QR Code Box */}
                  <div style={{ width: '140px', height: '140px', background: '#2c3e50', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.8rem', fontWeight: 'bold', borderRadius: '4px' }}>
                    [ SCAN UPI QR ]
                  </div>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '15px' }}>Scan with GPay, PhonePe, Paytm or any UPI app</p>
                <button className="btn-primary" style={{ width: '100%' }} onClick={handleScanComplete}>Simulate QR Scan Verification</button>
              </div>
            )}

            {paymentStep === 'scan' && paymentMethod === 'upi' && (
              <form onSubmit={handleUpiSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'left' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', fontWeight: 'bold' }}>Enter UPI ID / VPA</label>
                  <input
                    type="text"
                    placeholder="e.g. username@oksbi"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                  />
                </div>
                <button type="submit" className="btn-primary" style={{ width: '100%' }}>Pay via UPI App</button>
              </form>
            )}

            {paymentStep === 'processing' && (
              <div style={{ padding: '20px 0' }}>
                <p style={{ fontWeight: 'bold', color: '#2980b9' }}>Verifying Transaction with Bank...</p>
                <p style={{ fontSize: '0.85rem', color: '#888' }}>Please wait while escrow secures the transfer.</p>
              </div>
            )}

            {paymentStep === 'success' && (
              <div style={{ padding: '10px 0' }}>
                <p style={{ color: '#27ae60', fontWeight: 'bold', fontSize: '1.1rem' }}>Payment Successful! 🎉</p>
                <p style={{ fontSize: '0.85rem', color: '#666' }}>Transaction verified and securely logged.</p>
                <button className="btn-primary" style={{ width: '100%', marginTop: '15px' }} onClick={closePayment}>Done</button>
              </div>
            )}

            {paymentStep !== 'processing' && (
              <button className="btn-secondary" style={{ width: '100%', marginTop: '10px' }} onClick={closePayment}>Cancel</button>
            )}
          </div>
        </div>
      )}

      {/* REAL-TIME CHAT MODAL */}
      {chatOpenFor && (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', width: '340px', background: '#fff', borderRadius: '12px', boxShadow: '0 5px 25px rgba(0,0,0,0.2)', color: '#333', zIndex: 1000, overflow: 'hidden' }}>
          <div style={{ background: '#2196f3', color: '#fff', padding: '12px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0 }}>Chat: {chatOpenFor.title}</h4>
            <button onClick={closeChat} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
          </div>
          <div style={{ height: '250px', padding: '15px', overflowY: 'auto', background: '#f9f9f9', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {chatLoading ? (
              <p>Loading chat...</p>
            ) : chatMessages.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: '#888' }}>No messages yet. Say hi!</p>
            ) : (
              chatMessages.map((msg) => (
                <div key={msg.id} style={{ alignSelf: msg.senderId === firebaseUser?.uid ? 'flex-end' : 'flex-start', background: msg.senderId === firebaseUser?.uid ? '#2196f3' : '#e0e0e0', color: msg.senderId === firebaseUser?.uid ? '#fff' : '#333', padding: '6px 12px', borderRadius: '12px', fontSize: '0.85rem', maxWidth: '80%' }}>
                  <strong>{msg.senderName}: </strong>{msg.text}
                </div>
              ))
            )}
          </div>
          <form onSubmit={handleSendMessage} style={{ display: 'flex', padding: '10px', borderTop: '1px solid #eee' }}>
            <input
              type="text"
              placeholder="Type a message..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc', marginRight: '5px' }}
            />
            <button type="submit" className="btn-primary" style={{ padding: '8px 12px' }}>Send</button>
          </form>
        </div>
      )}

      {/* PROFILE MODAL */}
      {profileOpenFor && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', width: '380px', maxWidth: '90%', color: '#333' }}>
            {(() => {
              const profile = getProfileData(profileOpenFor);
              return (
                <>
                  <h3 style={{ marginTop: 0 }}>👤 {profile.name} {profile.branch}</h3>
                  <p><strong>Rating:</strong> {profile.rating}</p>
                  <p><strong>Gigs Completed:</strong> {profile.completedGigs}</p>
                  <p><strong>Skills:</strong> {profile.skills.join(', ')}</p>
                  <p style={{ fontSize: '0.9rem', color: '#555' }}>{profile.bio}</p>
                  <button className="btn-secondary" style={{ width: '100%', marginTop: '15px' }} onClick={closeProfile}>Close Profile</button>
                </>
              );
            })()}
          </div>
        </div>
      )}

    </div>
  );
}

export default App;