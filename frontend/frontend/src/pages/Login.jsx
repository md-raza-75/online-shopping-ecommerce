import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaSignInAlt, FaGoogle, FaFacebook,
  FaEnvelope, FaLock, FaShieldAlt, FaRocket,
  FaHandshake, FaCreditCard, FaStar, FaCheckCircle,
  FaUserCircle, FaBolt, FaLeaf, FaGlobe, FaHeart,
  FaEye, FaEyeSlash
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { login } from '../services/api';

// ─── Auth Slider Data ────────────────────────────────────────────────────────
const AUTH_SLIDES = [
  {
    id: 0,
    bg: 'linear-gradient(145deg, #0a2540 0%, #0e4d70 50%, #0a2540 100%)',
    accentColor: '#38bdf8',
    accentGlow: 'rgba(56,189,248,0.25)',
    orbGradient: 'linear-gradient(135deg, #0284c7, #0ea5e9)',
    icon: FaShieldAlt,
    badge: '🔐  Bank-Grade Security',
    title: 'Your Account,',
    titleHi: 'Fully Protected',
    subtitle: 'End-to-end encryption, two-factor authentication, and real-time fraud detection keep your account safe 24/7.',
    stats: [
      { val: '256-bit', label: 'SSL Encryption' },
      { val: '99.9%',  label: 'Uptime SLA' },
      { val: '0',      label: 'Breaches Ever' },
    ],
    chips: [
      { icon: FaShieldAlt, color: '#38bdf8', label: 'Zero Breach', pos: { top: '12%', left: '8%' } },
      { icon: FaCheckCircle, color: '#34d399', label: 'SSL Verified', pos: { top: '16%', right: '6%' } },
      { icon: FaGlobe,    color: '#a78bfa', label: 'Global CDN',   pos: { bottom: '18%', left: '6%' } },
      { icon: FaBolt,     color: '#fbbf24', label: '2FA Active',   pos: { bottom: '14%', right: '5%' } },
    ],
  },
  {
    id: 1,
    bg: 'linear-gradient(145deg, #1a0a00 0%, #7c2d00 50%, #1a0a00 100%)',
    accentColor: '#fb923c',
    accentGlow: 'rgba(251,146,60,0.28)',
    orbGradient: 'linear-gradient(135deg, #c2410c, #ea580c)',
    icon: FaRocket,
    badge: '⚡  Lightning Fast',
    title: 'Sign In',
    titleHi: 'In Seconds',
    subtitle: 'Smart one-tap sign-in, saved preferences, and instant cart sync — get back to shopping without any friction.',
    stats: [
      { val: '< 1s',   label: 'Login Time' },
      { val: 'Instant', label: 'Cart Sync' },
      { val: '100%',   label: 'Seamless UX' },
    ],
    chips: [
      { icon: FaRocket,   color: '#fb923c', label: 'Instant Auth', pos: { top: '12%', left: '8%' } },
      { icon: FaBolt,     color: '#fbbf24', label: 'Auto-Fill',    pos: { top: '18%', right: '5%' } },
      { icon: FaLeaf,     color: '#34d399', label: 'Remember Me',  pos: { bottom: '20%', left: '7%' } },
      { icon: FaHeart,    color: '#f472b6', label: 'Saved Prefs',  pos: { bottom: '14%', right: '6%' } },
    ],
  },
  {
    id: 2,
    bg: 'linear-gradient(145deg, #001a0f 0%, #065f46 50%, #001a0f 100%)',
    accentColor: '#10b981',
    accentGlow: 'rgba(16,185,129,0.28)',
    orbGradient: 'linear-gradient(135deg, #047857, #059669)',
    icon: FaHandshake,
    badge: '🤝  Trusted by Millions',
    title: 'Shop with',
    titleHi: 'Confidence',
    subtitle: 'Verified sellers, authentic products, and buyer protection on every order. 30-day easy returns, no questions asked.',
    stats: [
      { val: '2M+',  label: 'Happy Buyers' },
      { val: '50K+', label: 'Sellers' },
      { val: '4.9★', label: 'Avg Rating' },
    ],
    chips: [
      { icon: FaHandshake,  color: '#10b981', label: 'Verified', pos: { top: '12%', left: '8%' } },
      { icon: FaStar,       color: '#fbbf24', label: '4.9 Stars', pos: { top: '18%', right: '6%' } },
      { icon: FaCheckCircle,color: '#38bdf8', label: '30-Day Return', pos: { bottom: '20%', left: '6%' } },
      { icon: FaShieldAlt,  color: '#a78bfa', label: 'Buyer Protect', pos: { bottom: '14%', right: '5%' } },
    ],
  },
  {
    id: 3,
    bg: 'linear-gradient(145deg, #0d0030 0%, #3b0764 50%, #0d0030 100%)',
    accentColor: '#a78bfa',
    accentGlow: 'rgba(167,139,250,0.28)',
    orbGradient: 'linear-gradient(135deg, #6d28d9, #7c3aed)',
    icon: FaCreditCard,
    badge: '💳  Safe Payments',
    title: 'Pay Smart,',
    titleHi: 'Pay Safe',
    subtitle: 'UPI, cards, wallets and EMI — all secured with PCI-DSS compliance. Your payment details are never stored unencrypted.',
    stats: [
      { val: 'PCI', label: 'DSS Compliant' },
      { val: '10+', label: 'Pay Methods' },
      { val: '0%',  label: 'Hidden Fees' },
    ],
    chips: [
      { icon: FaCreditCard,  color: '#a78bfa', label: 'PCI-DSS',   pos: { top: '12%', left: '8%' } },
      { icon: FaShieldAlt,   color: '#34d399', label: 'Encrypted',  pos: { top: '18%', right: '5%' } },
      { icon: FaCheckCircle, color: '#fb923c', label: 'No Fees',    pos: { bottom: '20%', left: '7%' } },
      { icon: FaStar,        color: '#fbbf24', label: '10+ Methods',pos: { bottom: '14%', right: '6%' } },
    ],
  },
];

const slideVariants = {
  enter: (d) => ({ opacity: 0, x: d > 0 ? 50 : -50 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
  exit:   (d) => ({ opacity: 0, x: d > 0 ? -50 : 50, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } }),
};

const chipVariants = {
  hidden:  { opacity: 0, scale: 0.55, y: 18 },
  visible: (d) => ({ opacity: 1, scale: 1, y: 0, transition: { delay: d, duration: 0.5, ease: 'backOut' } }),
};

// ─── Component ────────────────────────────────────────────────────────────────
const Login = () => {
  const [formData, setFormData]   = useState({ email: '', password: '' });
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [slideDir,   setSlideDir]   = useState(1);
  const timerRef = useRef(null);

  const navigate  = useNavigate();
  const location  = useLocation();
  const redirect  = location.search ? location.search.split('=')[1] : '/';

  // Auth guard
  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('userInfo') || 'null');
    if (u?.token) navigate(redirect);
  }, [navigate, redirect]);

  // Hide global Navbar / Footer
  useEffect(() => {
    const navbar = document.querySelector('.premium-navbar');
    const footer = document.querySelector('footer');
    const mc     = document.querySelector('.container.py-4');
    const orig = { n: navbar?.style.display, f: footer?.style.display };
    if (navbar) navbar.style.display = 'none';
    if (footer) footer.style.display = 'none';
    if (mc) { mc.style.setProperty('padding','0','important'); mc.style.setProperty('margin','0','important'); mc.style.setProperty('max-width','100%','important'); }
    return () => {
      if (navbar) navbar.style.display = orig.n;
      if (footer) footer.style.display = orig.f;
    };
  }, []);

  // Auto-advance slider
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSlideDir(1);
      setSlideIndex(p => (p + 1) % AUTH_SLIDES.length);
    }, 4500);
    return () => clearInterval(timerRef.current);
  }, []);

  const goToSlide = (idx) => {
    if (idx === slideIndex) return;
    setSlideDir(idx > slideIndex ? 1 : -1);
    setSlideIndex(idx);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSlideDir(1);
      setSlideIndex(p => (p + 1) % AUTH_SLIDES.length);
    }, 4500);
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await login(formData.email, formData.password);
      localStorage.setItem('userInfo', JSON.stringify(data.data));
      toast.success('🎉 Login successful!');
      window.dispatchEvent(new Event('userLogin'));
      window.dispatchEvent(new Event('cartUpdated'));
      navigate(redirect);
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Invalid email or password');
      toast.error('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const slide = AUTH_SLIDES[slideIndex];

  const demoLogin = (role) => {
    const demoAccounts = {
      admin: { email: 'rohan@example.com', password: '123456' },
      user: { email: 'customer@example.com', password: '123456' }
    };
    setFormData(demoAccounts[role]);
  };

  return (
    <>
      <style>{`
        /* ── Auth page reset ── */
        .auth-page-wrap {
          display: flex;
          width: 100vw;
          min-height: 100vh;
          overflow: hidden;
          font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
        }

        /* ── Left slider panel ── */
        .auth-slider-panel {
          flex: 0 0 48%;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        @media (max-width: 900px) { .auth-slider-panel { display: none; } }

        .auth-slide {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 3rem 3.5rem;
          will-change: transform, opacity;
        }

        /* Auth-specific badge */
        .auth-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.38rem 1rem;
          border-radius: 999px;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          border: 1px solid rgba(255,255,255,0.2);
          color: rgba(255,255,255,0.9);
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(8px);
          width: fit-content;
          margin-bottom: 1.5rem;
        }

        /* Auth slide title */
        .auth-slide-title {
          font-size: clamp(2rem, 3.5vw, 3rem);
          font-weight: 900;
          line-height: 1.1;
          color: #fff;
          letter-spacing: -0.025em;
          margin: 0 0 0.2rem;
        }

        .auth-slide-title-hi {
          display: block;
          -webkit-text-fill-color: transparent;
          -webkit-background-clip: text;
          background-clip: text;
        }

        .auth-slide-sub {
          font-size: 0.95rem;
          line-height: 1.7;
          color: rgba(255,255,255,0.55);
          margin: 1.1rem 0 2rem;
          max-width: 380px;
        }

        /* Stats row */
        .auth-stats {
          display: flex;
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }

        .auth-stat {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }

        .auth-stat-val {
          font-size: 1.3rem;
          font-weight: 900;
          color: #fff;
          letter-spacing: -0.02em;
        }

        .auth-stat-label {
          font-size: 0.72rem;
          font-weight: 600;
          color: rgba(255,255,255,0.45);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        /* Orb illustration */
        .auth-orb-wrap {
          position: relative;
          width: 140px;
          height: 140px;
          flex-shrink: 0;
        }

        .auth-orb {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .auth-orb-ring {
          position: absolute;
          border-radius: 50%;
          border: 1.5px solid rgba(255,255,255,0.12);
          animation: authOrbSpin 6s linear infinite;
        }

        .auth-orb-ring2 {
          position: absolute;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.07);
          animation: authOrbSpin 10s linear infinite reverse;
        }

        @keyframes authOrbSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        .auth-orb-icon {
          font-size: 3.8rem;
          color: #fff;
          filter: drop-shadow(0 0 20px rgba(255,255,255,0.4));
        }

        /* Floating chips */
        .auth-chip {
          position: absolute;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.48rem 0.9rem;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.18);
          border-radius: 999px;
          backdrop-filter: blur(12px);
          font-size: 0.75rem;
          font-weight: 700;
          color: #fff;
          white-space: nowrap;
          box-shadow: 0 6px 20px rgba(0,0,0,0.22);
          z-index: 10;
        }

        /* Bottom orb section */
        .auth-bottom-section {
          display: flex;
          align-items: center;
          gap: 2.5rem;
          position: relative;
        }

        /* Dot navigation */
        .auth-dots {
          position: absolute;
          bottom: 1.8rem;
          left: 3.5rem;
          display: flex;
          gap: 0.45rem;
          z-index: 20;
        }

        .auth-dot {
          height: 6px;
          border-radius: 999px;
          background: rgba(255,255,255,0.3);
          border: none;
          cursor: pointer;
          padding: 0;
          transition: all 0.3s ease;
          width: 6px;
        }
        .auth-dot.active { width: 22px; background: rgba(255,255,255,0.9); }

        /* Progress bar */
        .auth-progress {
          position: absolute;
          bottom: 0; left: 0;
          height: 2px;
          background: rgba(255,255,255,0.7);
          transform-origin: left center;
          z-index: 20;
        }

        /* Ambient glows */
        .auth-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(70px);
          pointer-events: none;
          opacity: 0.18;
        }

        /* ── Right form panel ── */
        .auth-form-panel {
          flex: 1;
          background: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2.5rem 2rem;
          overflow-y: auto;
        }

        .auth-form-card {
          width: 100%;
          max-width: 420px;
        }

        .auth-brand {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          margin-bottom: 2rem;
        }

        .auth-brand-logo {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          color: #fff;
        }

        .auth-brand-name {
          font-size: 1.25rem;
          font-weight: 900;
          color: #1e293b;
          letter-spacing: -0.02em;
        }

        .auth-brand-name span {
          background: linear-gradient(90deg, #6366f1, #8b5cf6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .auth-form-heading {
          font-size: 1.7rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.02em;
          margin-bottom: 0.3rem;
        }

        .auth-form-sub {
          font-size: 0.9rem;
          color: #64748b;
          margin-bottom: 1.8rem;
        }

        /* Input groups */
        .auth-input-group {
          position: relative;
          margin-bottom: 1rem;
        }

        .auth-input-icon {
          position: absolute;
          left: 0.95rem;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          font-size: 0.9rem;
          pointer-events: none;
          z-index: 2;
        }

        .auth-input {
          width: 100%;
          padding: 0.8rem 2.8rem 0.8rem 2.6rem;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          font-size: 0.92rem;
          color: #1e293b;
          background: #fff;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }

        .auth-input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
        }

        .auth-input::placeholder { color: #cbd5e1; }

        .auth-pw-toggle {
          position: absolute;
          right: 0.9rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #94a3b8;
          font-size: 0.9rem;
          z-index: 2;
          padding: 0.2rem;
          transition: color 0.15s;
        }
        .auth-pw-toggle:hover { color: #6366f1; }

        /* Error message */
        .auth-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 10px;
          padding: 0.7rem 1rem;
          font-size: 0.84rem;
          color: #dc2626;
          font-weight: 600;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        /* Submit button */
        .auth-submit-btn {
          width: 100%;
          padding: 0.85rem;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #fff;
          border: none;
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          margin-top: 0.5rem;
          transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          letter-spacing: 0.01em;
        }
        .auth-submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(99,102,241,0.35);
        }
        .auth-submit-btn:disabled { opacity: 0.65; cursor: not-allowed; }

        /* Divider */
        .auth-divider {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          margin: 1.2rem 0;
          color: #cbd5e1;
          font-size: 0.8rem;
          font-weight: 600;
        }
        .auth-divider::before, .auth-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #e2e8f0;
        }

        /* Social buttons */
        .auth-social-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.7rem;
          margin-bottom: 1.2rem;
        }

        .auth-social-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.7rem;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          background: #fff;
          font-size: 0.84rem;
          font-weight: 700;
          color: #1e293b;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
          text-decoration: none;
        }
        .auth-social-btn:hover { border-color: #c7d2fe; background: #f5f3ff; color: #1e293b; text-decoration: none; }

        /* Demo credentials */
        .auth-demo-box {
          background: linear-gradient(135deg, #f0fdf4, #dcfce7);
          border: 1.5px solid #86efac;
          border-radius: 12px;
          padding: 0.9rem 1rem;
          margin-top: 1rem;
        }

        .auth-demo-title {
          font-size: 0.75rem;
          font-weight: 800;
          color: #166534;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 0.6rem;
        }

        .auth-demo-btn {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.55rem 0.8rem;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          border: none;
          width: 100%;
          transition: background 0.15s;
          margin-bottom: 0.35rem;
        }
        .auth-demo-btn:last-child { margin-bottom: 0; }

        .auth-demo-btn.user-btn {
          background: rgba(255,255,255,0.7);
          color: #15803d;
        }
        .auth-demo-btn.user-btn:hover { background: rgba(255,255,255,0.95); }

        .auth-demo-btn.admin-btn {
          background: rgba(79,70,229,0.1);
          color: #4f46e5;
        }
        .auth-demo-btn.admin-btn:hover { background: rgba(79,70,229,0.18); }

        /* Footer link */
        .auth-form-footer {
          text-align: center;
          margin-top: 1.2rem;
          font-size: 0.86rem;
          color: #64748b;
        }

        .auth-form-footer a {
          color: #6366f1;
          font-weight: 700;
          text-decoration: none;
        }
        .auth-form-footer a:hover { text-decoration: underline; }
      `}</style>

      <div className="auth-page-wrap">
        {/* ── LEFT: Auth Slider Panel ── */}
        <div className="auth-slider-panel">
          <AnimatePresence initial={false} custom={slideDir} mode="popLayout">
            {AUTH_SLIDES.map((s, i) =>
              i !== slideIndex ? null : (
                <motion.div
                  key={s.id}
                  className="auth-slide"
                  custom={slideDir}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  style={{ background: s.bg }}
                >
                  {/* Ambient blobs */}
                  <div className="auth-blob" style={{ width: 400, height: 400, background: s.accentGlow, top: '-10%', left: '-5%' }} />
                  <div className="auth-blob" style={{ width: 300, height: 300, background: s.accentGlow, bottom: '-8%', right: '2%' }} />

                  {/* Floating chips */}
                  {s.chips.map((ch, ci) => (
                    <motion.div
                      key={ci}
                      className="auth-chip"
                      style={ch.pos}
                      custom={0.3 + ci * 0.1}
                      variants={chipVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      <motion.div
                        style={{ display: 'flex', alignItems: 'center', gap: '0.38rem' }}
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 3 + ci * 0.4, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <ch.icon style={{ color: ch.color, fontSize: '0.9rem' }} />
                        <span>{ch.label}</span>
                      </motion.div>
                    </motion.div>
                  ))}

                  {/* Badge */}
                  <motion.div
                    className="auth-badge"
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.07, duration: 0.4 }}
                  >
                    {s.badge}
                  </motion.div>

                  {/* Title */}
                  <motion.h2
                    className="auth-slide-title"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.14, duration: 0.45 }}
                  >
                    {s.title}{' '}
                    <span
                      className="auth-slide-title-hi"
                      style={{ backgroundImage: `linear-gradient(90deg, ${s.accentColor}, rgba(255,255,255,0.8))` }}
                    >
                      {s.titleHi}
                    </span>
                  </motion.h2>

                  {/* Subtitle */}
                  <motion.p
                    className="auth-slide-sub"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.22, duration: 0.42 }}
                  >
                    {s.subtitle}
                  </motion.p>

                  {/* Bottom: stats + orb */}
                  <div className="auth-bottom-section">
                    {/* Stats */}
                    <motion.div
                      className="auth-stats"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.4 }}
                    >
                      {s.stats.map((st, si) => (
                        <div key={si} className="auth-stat">
                          <span className="auth-stat-val" style={{ color: s.accentColor }}>{st.val}</span>
                          <span className="auth-stat-label">{st.label}</span>
                        </div>
                      ))}
                    </motion.div>

                    {/* Orb */}
                    <motion.div
                      className="auth-orb-wrap"
                      style={{ marginLeft: 'auto' }}
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.18, duration: 0.6, ease: 'backOut' }}
                    >
                      <div
                        className="auth-orb"
                        style={{
                          background: s.orbGradient,
                          boxShadow: `0 0 0 2px rgba(255,255,255,0.08), 0 0 60px ${s.accentGlow}`,
                        }}
                      >
                        <motion.div
                          animate={{ rotate: [0, 6, -6, 0] }}
                          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
                        >
                          <s.icon className="auth-orb-icon" />
                        </motion.div>
                        <div className="auth-orb-ring"  style={{ inset: -18 }} />
                        <div className="auth-orb-ring2" style={{ inset: -36 }} />
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              )
            )}
          </AnimatePresence>

          {/* Dot nav */}
          <div className="auth-dots">
            {AUTH_SLIDES.map((_, i) => (
              <button
                key={i}
                className={`auth-dot${i === slideIndex ? ' active' : ''}`}
                onClick={() => goToSlide(i)}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>

          {/* Progress bar */}
          <motion.div
            key={`auth-progress-${slideIndex}`}
            className="auth-progress"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 4.5, ease: 'linear' }}
            style={{ width: '100%' }}
          />
        </div>

        {/* ── RIGHT: Form Panel ── */}
        <div className="auth-form-panel">
          <motion.div
            className="auth-form-card"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            {/* Brand */}
            <div className="auth-brand">
              <div className="auth-brand-logo">🛍</div>
              <div className="auth-brand-name">Shop<span>Easy</span></div>
            </div>

            <h1 className="auth-form-heading">Welcome back</h1>
            <p className="auth-form-sub">Sign in to continue shopping</p>

            {/* Social */}
            <div className="auth-social-row">
              <button className="auth-social-btn" type="button">
                <FaGoogle style={{ color: '#ea4335' }} /> Google
              </button>
              <button className="auth-social-btn" type="button">
                <FaFacebook style={{ color: '#1877f2' }} /> Facebook
              </button>
            </div>

            <div className="auth-divider">or sign in with email</div>

            {/* Error */}
            {error && (
              <motion.div
                className="auth-error"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                ⚠️ {error}
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={submitHandler}>
              {/* Email */}
              <div className="auth-input-group">
                <FaEnvelope className="auth-input-icon" />
                <input
                  type="email"
                  name="email"
                  className="auth-input"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                />
              </div>

              {/* Password */}
              <div className="auth-input-group">
                <FaLock className="auth-input-icon" />
                <input
                  type={showPw ? 'text' : 'password'}
                  name="password"
                  className="auth-input"
                  placeholder="Your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="auth-pw-toggle"
                  onClick={() => setShowPw(p => !p)}
                  tabIndex={-1}
                >
                  {showPw ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>

              {/* Forgot */}
              <div style={{ textAlign: 'right', marginBottom: '1rem', marginTop: '-0.4rem' }}>
                <Link to="/forgot-password" style={{ fontSize: '0.82rem', color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}>
                  Forgot password?
                </Link>
              </div>

              <motion.button
                type="submit"
                className="auth-submit-btn"
                disabled={loading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  <><span className="spinner-border spinner-border-sm" /> Signing in…</>
                ) : (
                  <><FaSignInAlt /> Sign In</>
                )}
              </motion.button>
            </form>

            {/* Demo credentials */}
            <div className="auth-demo-box">
              <div className="auth-demo-title">⚡ Quick Demo Access</div>
              <button
                type="button"
                className="auth-demo-btn admin-btn"
                onClick={() => demoLogin('admin')}
                disabled={loading}
              >
                <span>🛡️ Admin Login</span>
                <span style={{ fontSize: '0.72rem', opacity: 0.7 }}>rohan@example.com</span>
              </button>
              <button
                type="button"
                className="auth-demo-btn user-btn"
                onClick={() => demoLogin('user')}
                disabled={loading}
              >
                <span>👤 Customer Login</span>
                <span style={{ fontSize: '0.72rem', opacity: 0.7 }}>customer@example.com</span>
              </button>
            </div>

            <div className="auth-form-footer">
              New to ShopEasy?{' '}
              <Link to="/register">Create an account →</Link>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Login;