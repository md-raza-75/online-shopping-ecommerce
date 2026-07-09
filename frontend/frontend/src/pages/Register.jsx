import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaUserPlus, FaGoogle, FaFacebook,
  FaEnvelope, FaLock, FaUser,
  FaShieldAlt, FaRocket, FaHandshake, FaCreditCard,
  FaStar, FaCheckCircle, FaBolt, FaLeaf,
  FaGlobe, FaHeart, FaEye, FaEyeSlash
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { register } from '../services/api';

// ─── Auth Slider Data (same themes, distinct styling) ────────────────────────
const REG_SLIDES = [
  {
    id: 0,
    bg: 'linear-gradient(145deg, #05051a 0%, #1e1b4b 50%, #05051a 100%)',
    accentColor: '#818cf8',
    accentGlow: 'rgba(129,140,248,0.28)',
    orbGradient: 'linear-gradient(135deg, #4338ca, #6366f1)',
    icon: FaUserPlus,
    badge: '✨  Create Free Account',
    title: 'Join Millions of',
    titleHi: 'Happy Shoppers',
    subtitle: 'Sign up in under 60 seconds. Get instant access to exclusive deals, order tracking, and a personalized experience.',
    stats: [
      { val: '2M+',   label: 'Members' },
      { val: 'Free',  label: 'Forever' },
      { val: '< 60s', label: 'Setup Time' },
    ],
    chips: [
      { icon: FaUserPlus,   color: '#818cf8', label: 'Free Signup', pos: { top: '12%', left: '7%' } },
      { icon: FaStar,       color: '#fbbf24', label: 'Exclusive Deals',pos: { top: '18%', right: '5%' } },
      { icon: FaCheckCircle,color: '#34d399', label: 'No Credit Card', pos: { bottom: '20%', left: '6%' } },
      { icon: FaBolt,       color: '#fb923c', label: 'Instant Access', pos: { bottom: '14%', right: '5%' } },
    ],
  },
  {
    id: 1,
    bg: 'linear-gradient(145deg, #001829 0%, #003d5c 50%, #001829 100%)',
    accentColor: '#22d3ee',
    accentGlow: 'rgba(34,211,238,0.25)',
    orbGradient: 'linear-gradient(135deg, #0369a1, #0284c7)',
    icon: FaShieldAlt,
    badge: '🔒  Privacy First',
    title: 'Your Data,',
    titleHi: 'Your Control',
    subtitle: 'We never sell your data. Full GDPR compliance, transparent privacy settings, and the right to delete anytime.',
    stats: [
      { val: 'GDPR',  label: 'Compliant' },
      { val: '0',     label: 'Data Sold' },
      { val: '100%',  label: 'Transparent' },
    ],
    chips: [
      { icon: FaShieldAlt,  color: '#22d3ee', label: 'GDPR Safe',    pos: { top: '12%', left: '7%' } },
      { icon: FaGlobe,      color: '#a78bfa', label: 'Global Privacy',pos: { top: '18%', right: '5%' } },
      { icon: FaCheckCircle,color: '#34d399', label: 'No Tracking',   pos: { bottom: '20%', left: '6%' } },
      { icon: FaHeart,      color: '#f472b6', label: 'You Own Data',  pos: { bottom: '14%', right: '5%' } },
    ],
  },
  {
    id: 2,
    bg: 'linear-gradient(145deg, #1a0010 0%, #6b1035 50%, #1a0010 100%)',
    accentColor: '#f9a8d4',
    accentGlow: 'rgba(249,168,212,0.25)',
    orbGradient: 'linear-gradient(135deg, #be185d, #db2777)',
    icon: FaHeart,
    badge: '🎁  Member Perks',
    title: 'Exclusive Deals',
    titleHi: 'Just for You',
    subtitle: 'Members get first access to flash sales, special birthday offers, and loyalty points on every purchase.',
    stats: [
      { val: '60%',  label: 'Max Savings' },
      { val: '1st',  label: 'Sale Access' },
      { val: '2×',   label: 'Points on B-Day' },
    ],
    chips: [
      { icon: FaHeart,     color: '#f9a8d4', label: 'Loyalty Rewards', pos: { top: '12%', left: '7%' } },
      { icon: FaStar,      color: '#fbbf24', label: 'VIP Deals',        pos: { top: '18%', right: '5%' } },
      { icon: FaLeaf,      color: '#34d399', label: 'Eco Packaging',     pos: { bottom: '20%', left: '6%' } },
      { icon: FaBolt,      color: '#fb923c', label: 'Flash Access',      pos: { bottom: '14%', right: '5%' } },
    ],
  },
  {
    id: 3,
    bg: 'linear-gradient(145deg, #001a00 0%, #14532d 50%, #001a00 100%)',
    accentColor: '#4ade80',
    accentGlow: 'rgba(74,222,128,0.25)',
    orbGradient: 'linear-gradient(135deg, #15803d, #16a34a)',
    icon: FaRocket,
    badge: '🚀  Fast Onboarding',
    title: 'Start Shopping',
    titleHi: 'Right Now',
    subtitle: 'Your account is ready the moment you sign up. No email confirmation delays — add to cart and checkout instantly.',
    stats: [
      { val: 'Instant', label: 'Activation' },
      { val: '0 Wait',  label: 'No Delays' },
      { val: 'Free',    label: 'Delivery Trial' },
    ],
    chips: [
      { icon: FaRocket,     color: '#4ade80', label: 'Instant Start',  pos: { top: '12%', left: '7%' } },
      { icon: FaCheckCircle,color: '#38bdf8', label: 'Verified Fast',  pos: { top: '18%', right: '5%' } },
      { icon: FaShieldAlt,  color: '#a78bfa', label: 'Secure Account', pos: { bottom: '20%', left: '6%' } },
      { icon: FaStar,       color: '#fbbf24', label: 'Welcome Bonus',  pos: { bottom: '14%', right: '5%' } },
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

const STRENGTH_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e'];
const STRENGTH_LABELS = ['Weak', 'Fair', 'Good', 'Strong'];

// ─── Component ────────────────────────────────────────────────────────────────
const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [showCp, setShowCp]     = useState(false);
  const [pwStrength, setPwStrength] = useState(0);
  const [slideIndex, setSlideIndex] = useState(0);
  const [slideDir, setSlideDir]     = useState(1);
  const timerRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();
  const redirect = location.search ? location.search.split('=')[1] : '/';

  // Auth guard
  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('userInfo') || 'null');
    if (u?.token) navigate(redirect);
  }, [navigate, redirect]);

  // Password strength
  useEffect(() => {
    let s = 0;
    if (formData.password.length >= 8)       s++;
    if (/[A-Z]/.test(formData.password))     s++;
    if (/[0-9]/.test(formData.password))     s++;
    if (/[^A-Za-z0-9]/.test(formData.password)) s++;
    setPwStrength(s);
  }, [formData.password]);

  // Hide global Navbar / Footer
  useEffect(() => {
    const navbar = document.querySelector('.premium-navbar');
    const footer = document.querySelector('footer');
    const mc     = document.querySelector('.container.py-4');
    const orig = { n: navbar?.style.display, f: footer?.style.display };
    if (navbar) navbar.style.display = 'none';
    if (footer) footer.style.display = 'none';
    if (mc) {
      mc.style.setProperty('padding','0','important');
      mc.style.setProperty('margin','0','important');
      mc.style.setProperty('max-width','100%','important');
    }
    return () => {
      if (navbar) navbar.style.display = orig.n;
      if (footer) footer.style.display = orig.f;
    };
  }, []);

  // Auto-advance slider
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSlideDir(1);
      setSlideIndex(p => (p + 1) % REG_SLIDES.length);
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
      setSlideIndex(p => (p + 1) % REG_SLIDES.length);
    }, 4500);
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const submitHandler = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await register(formData.name, formData.email, formData.password);
      localStorage.setItem('userInfo', JSON.stringify(data.data));
      toast.success('🎉 Account created! Welcome to ShopEasy!');
      window.dispatchEvent(new Event('userLogin'));
      navigate(redirect);
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Registration failed. Please try again.');
      toast.error('Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const slide = REG_SLIDES[slideIndex];

  return (
    <>
      <style>{`
        /* ── Auth page shared styles (Register) ── */
        .reg-page-wrap {
          display: flex;
          width: 100vw;
          min-height: 100vh;
          overflow: hidden;
          font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
        }

        /* Right form panel comes first on mobile */
        @media (max-width: 900px) {
          .reg-page-wrap { flex-direction: column; }
          .reg-slider-panel { display: none; }
        }

        /* ── Left slider panel ── */
        .reg-slider-panel {
          flex: 0 0 48%;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .reg-slide {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 3rem 3.5rem;
          will-change: transform, opacity;
        }

        .reg-badge {
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

        .reg-slide-title {
          font-size: clamp(2rem, 3.5vw, 3rem);
          font-weight: 900;
          line-height: 1.1;
          color: #fff;
          letter-spacing: -0.025em;
          margin: 0 0 0.2rem;
        }

        .reg-slide-title-hi {
          display: block;
          -webkit-text-fill-color: transparent;
          -webkit-background-clip: text;
          background-clip: text;
        }

        .reg-slide-sub {
          font-size: 0.95rem;
          line-height: 1.7;
          color: rgba(255,255,255,0.55);
          margin: 1.1rem 0 2rem;
          max-width: 380px;
        }

        .reg-stats { display: flex; gap: 1.5rem; margin-bottom: 2.5rem; }
        .reg-stat { display: flex; flex-direction: column; gap: 0.2rem; }
        .reg-stat-val { font-size: 1.3rem; font-weight: 900; color: #fff; letter-spacing: -0.02em; }
        .reg-stat-label { font-size: 0.72rem; font-weight: 600; color: rgba(255,255,255,0.45); text-transform: uppercase; letter-spacing: 0.06em; }

        .reg-bottom { display: flex; align-items: center; gap: 2.5rem; position: relative; }

        .reg-orb-wrap { position: relative; width: 140px; height: 140px; flex-shrink: 0; }
        .reg-orb { width: 100%; height: 100%; border-radius: 50%; display: flex; align-items: center; justify-content: center; position: relative; }
        .reg-orb-ring  { position: absolute; border-radius: 50%; border: 1.5px solid rgba(255,255,255,0.12); animation: regOrbSpin 6s linear infinite; }
        .reg-orb-ring2 { position: absolute; border-radius: 50%; border: 1px solid rgba(255,255,255,0.07); animation: regOrbSpin 10s linear infinite reverse; }
        @keyframes regOrbSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .reg-orb-icon { font-size: 3.8rem; color: #fff; filter: drop-shadow(0 0 20px rgba(255,255,255,0.4)); }

        .reg-chip {
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

        .reg-dots {
          position: absolute;
          bottom: 1.8rem;
          left: 3.5rem;
          display: flex;
          gap: 0.45rem;
          z-index: 20;
        }
        .reg-dot {
          height: 6px;
          border-radius: 999px;
          background: rgba(255,255,255,0.3);
          border: none;
          cursor: pointer;
          padding: 0;
          transition: all 0.3s ease;
          width: 6px;
        }
        .reg-dot.active { width: 22px; background: rgba(255,255,255,0.9); }

        .reg-progress {
          position: absolute;
          bottom: 0; left: 0;
          height: 2px;
          background: rgba(255,255,255,0.7);
          transform-origin: left center;
          z-index: 20;
        }

        .reg-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(70px);
          pointer-events: none;
          opacity: 0.18;
        }

        /* ── Right form panel ── */
        .reg-form-panel {
          flex: 1;
          background: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 2rem;
          overflow-y: auto;
        }

        .reg-form-card { width: 100%; max-width: 420px; }

        .reg-brand { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 1.6rem; }
        .reg-brand-logo { width: 38px; height: 38px; border-radius: 10px; background: linear-gradient(135deg, #6366f1, #8b5cf6); display: flex; align-items: center; justify-content: center; font-size: 1.1rem; color: #fff; }
        .reg-brand-name { font-size: 1.25rem; font-weight: 900; color: #1e293b; letter-spacing: -0.02em; }
        .reg-brand-name span { background: linear-gradient(90deg, #6366f1, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }

        .reg-heading { font-size: 1.6rem; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; margin-bottom: 0.25rem; }
        .reg-sub { font-size: 0.88rem; color: #64748b; margin-bottom: 1.5rem; }

        .reg-input-group { position: relative; margin-bottom: 0.8rem; }
        .reg-input-icon { position: absolute; left: 0.95rem; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 0.9rem; pointer-events: none; z-index: 2; }
        .reg-input { width: 100%; padding: 0.75rem 2.8rem 0.75rem 2.6rem; border: 1.5px solid #e2e8f0; border-radius: 12px; font-size: 0.9rem; color: #1e293b; background: #fff; outline: none; transition: border-color 0.2s, box-shadow 0.2s; box-sizing: border-box; }
        .reg-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
        .reg-input::placeholder { color: #cbd5e1; }

        .reg-pw-toggle { position: absolute; right: 0.9rem; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #94a3b8; font-size: 0.9rem; z-index: 2; padding: 0.2rem; transition: color 0.15s; }
        .reg-pw-toggle:hover { color: #6366f1; }

        /* Password strength */
        .pw-strength-wrap { margin: -0.2rem 0 0.7rem; }
        .pw-strength-bars { display: flex; gap: 4px; margin-bottom: 0.3rem; }
        .pw-strength-bar { flex: 1; height: 4px; border-radius: 999px; background: #e2e8f0; transition: background 0.3s; }
        .pw-strength-label { font-size: 0.75rem; font-weight: 700; }

        .reg-error { background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 0.7rem 1rem; font-size: 0.84rem; color: #dc2626; font-weight: 600; margin-bottom: 0.8rem; }

        .reg-submit-btn { width: 100%; padding: 0.85rem; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; border: none; border-radius: 12px; font-size: 0.95rem; font-weight: 700; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s; display: flex; align-items: center; justify-content: center; gap: 0.5rem; letter-spacing: 0.01em; margin-top: 0.3rem; }
        .reg-submit-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(99,102,241,0.35); }
        .reg-submit-btn:disabled { opacity: 0.65; cursor: not-allowed; }

        .reg-divider { display: flex; align-items: center; gap: 0.8rem; margin: 1rem 0; color: #cbd5e1; font-size: 0.8rem; font-weight: 600; }
        .reg-divider::before, .reg-divider::after { content: ''; flex: 1; height: 1px; background: #e2e8f0; }

        .reg-social-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.7rem; margin-bottom: 0.5rem; }
        .reg-social-btn { display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.65rem; border: 1.5px solid #e2e8f0; border-radius: 10px; background: #fff; font-size: 0.84rem; font-weight: 700; color: #1e293b; cursor: pointer; transition: border-color 0.2s, background 0.2s; text-decoration: none; }
        .reg-social-btn:hover { border-color: #c7d2fe; background: #f5f3ff; color: #1e293b; text-decoration: none; }

        .reg-terms { font-size: 0.76rem; color: #94a3b8; text-align: center; margin-top: 0.8rem; line-height: 1.5; }
        .reg-terms a { color: #6366f1; font-weight: 600; text-decoration: none; }
        .reg-terms a:hover { text-decoration: underline; }

        .reg-form-footer { text-align: center; margin-top: 1rem; font-size: 0.86rem; color: #64748b; }
        .reg-form-footer a { color: #6366f1; font-weight: 700; text-decoration: none; }
        .reg-form-footer a:hover { text-decoration: underline; }
      `}</style>

      <div className="reg-page-wrap">
        {/* ── LEFT: Auth Slider Panel ── */}
        <div className="reg-slider-panel">
          <AnimatePresence initial={false} custom={slideDir} mode="popLayout">
            {REG_SLIDES.map((s, i) =>
              i !== slideIndex ? null : (
                <motion.div
                  key={s.id}
                  className="reg-slide"
                  custom={slideDir}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  style={{ background: s.bg }}
                >
                  {/* Ambient blobs */}
                  <div className="reg-blob" style={{ width: 400, height: 400, background: s.accentGlow, top: '-10%', left: '-5%' }} />
                  <div className="reg-blob" style={{ width: 300, height: 300, background: s.accentGlow, bottom: '-8%', right: '2%' }} />

                  {/* Floating chips */}
                  {s.chips.map((ch, ci) => (
                    <motion.div
                      key={ci}
                      className="reg-chip"
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
                    className="reg-badge"
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.07, duration: 0.4 }}
                  >
                    {s.badge}
                  </motion.div>

                  {/* Title */}
                  <motion.h2
                    className="reg-slide-title"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.14, duration: 0.45 }}
                  >
                    {s.title}{' '}
                    <span
                      className="reg-slide-title-hi"
                      style={{ backgroundImage: `linear-gradient(90deg, ${s.accentColor}, rgba(255,255,255,0.8))` }}
                    >
                      {s.titleHi}
                    </span>
                  </motion.h2>

                  {/* Subtitle */}
                  <motion.p
                    className="reg-slide-sub"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.22, duration: 0.42 }}
                  >
                    {s.subtitle}
                  </motion.p>

                  {/* Stats + Orb */}
                  <div className="reg-bottom">
                    <motion.div
                      className="reg-stats"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.4 }}
                    >
                      {s.stats.map((st, si) => (
                        <div key={si} className="reg-stat">
                          <span className="reg-stat-val" style={{ color: s.accentColor }}>{st.val}</span>
                          <span className="reg-stat-label">{st.label}</span>
                        </div>
                      ))}
                    </motion.div>

                    <motion.div
                      className="reg-orb-wrap"
                      style={{ marginLeft: 'auto' }}
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.18, duration: 0.6, ease: 'backOut' }}
                    >
                      <div
                        className="reg-orb"
                        style={{
                          background: s.orbGradient,
                          boxShadow: `0 0 0 2px rgba(255,255,255,0.08), 0 0 60px ${s.accentGlow}`,
                        }}
                      >
                        <motion.div
                          animate={{ rotate: [0, 6, -6, 0] }}
                          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
                        >
                          <s.icon className="reg-orb-icon" />
                        </motion.div>
                        <div className="reg-orb-ring"  style={{ inset: -18 }} />
                        <div className="reg-orb-ring2" style={{ inset: -36 }} />
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              )
            )}
          </AnimatePresence>

          {/* Dot nav */}
          <div className="reg-dots">
            {REG_SLIDES.map((_, i) => (
              <button
                key={i}
                className={`reg-dot${i === slideIndex ? ' active' : ''}`}
                onClick={() => goToSlide(i)}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>

          {/* Progress bar */}
          <motion.div
            key={`reg-progress-${slideIndex}`}
            className="reg-progress"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 4.5, ease: 'linear' }}
            style={{ width: '100%' }}
          />
        </div>

        {/* ── RIGHT: Form Panel ── */}
        <div className="reg-form-panel">
          <motion.div
            className="reg-form-card"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            {/* Brand */}
            <div className="reg-brand">
              <div className="reg-brand-logo">🛍</div>
              <div className="reg-brand-name">Shop<span>Easy</span></div>
            </div>

            <h1 className="reg-heading">Create your account</h1>
            <p className="reg-sub">Join millions of happy shoppers today</p>

            {/* Social */}
            <div className="reg-social-row">
              <button className="reg-social-btn" type="button">
                <FaGoogle style={{ color: '#ea4335' }} /> Google
              </button>
              <button className="reg-social-btn" type="button">
                <FaFacebook style={{ color: '#1877f2' }} /> Facebook
              </button>
            </div>

            <div className="reg-divider">or register with email</div>

            {/* Error */}
            {error && (
              <motion.div
                className="reg-error"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                ⚠️ {error}
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={submitHandler}>
              {/* Name */}
              <div className="reg-input-group">
                <FaUser className="reg-input-icon" />
                <input
                  type="text"
                  name="name"
                  className="reg-input"
                  placeholder="Full name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  autoComplete="name"
                />
              </div>

              {/* Email */}
              <div className="reg-input-group">
                <FaEnvelope className="reg-input-icon" />
                <input
                  type="email"
                  name="email"
                  className="reg-input"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                />
              </div>

              {/* Password */}
              <div className="reg-input-group">
                <FaLock className="reg-input-icon" />
                <input
                  type={showPw ? 'text' : 'password'}
                  name="password"
                  className="reg-input"
                  placeholder="Create password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="reg-pw-toggle"
                  onClick={() => setShowPw(p => !p)}
                  tabIndex={-1}
                >
                  {showPw ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>

              {/* Password strength indicator */}
              {formData.password && (
                <motion.div
                  className="pw-strength-wrap"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="pw-strength-bars">
                    {[0, 1, 2, 3].map(n => (
                      <div
                        key={n}
                        className="pw-strength-bar"
                        style={{ background: n < pwStrength ? STRENGTH_COLORS[pwStrength - 1] : '#e2e8f0' }}
                      />
                    ))}
                  </div>
                  <span
                    className="pw-strength-label"
                    style={{ color: pwStrength > 0 ? STRENGTH_COLORS[pwStrength - 1] : '#94a3b8' }}
                  >
                    {pwStrength > 0 ? STRENGTH_LABELS[pwStrength - 1] : ''} password
                  </span>
                </motion.div>
              )}

              {/* Confirm Password */}
              <div className="reg-input-group">
                <FaLock className="reg-input-icon" />
                <input
                  type={showCp ? 'text' : 'password'}
                  name="confirmPassword"
                  className="reg-input"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="reg-pw-toggle"
                  onClick={() => setShowCp(p => !p)}
                  tabIndex={-1}
                >
                  {showCp ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>

              <motion.button
                type="submit"
                className="reg-submit-btn"
                disabled={loading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  <><span className="spinner-border spinner-border-sm" /> Creating account…</>
                ) : (
                  <><FaUserPlus /> Create Account</>
                )}
              </motion.button>
            </form>

            <p className="reg-terms">
              By creating an account, you agree to our{' '}
              <a href="#">Terms of Service</a> and{' '}
              <a href="#">Privacy Policy</a>.
            </p>

            <div className="reg-form-footer">
              Already have an account?{' '}
              <Link to="/login">Sign in →</Link>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Register;