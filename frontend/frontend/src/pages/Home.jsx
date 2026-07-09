import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaFire, FaTag, FaShippingFast, FaShieldAlt, FaArrowRight,
  FaSearch, FaShoppingBag, FaBox, FaHeadset, FaGift,
  FaShoppingCart, FaTruck, FaCreditCard, FaChartLine,
  FaStar, FaPercent, FaBolt, FaRocket, FaHeart, FaLock, FaGlobe
} from 'react-icons/fa';
import Loader from '../components/Loader';
import ProductCard from '../components/ProductCard';
import { getProducts } from '../services/api';

// ─── Hero Slide definitions ─────────────────────────────────────────────────
const HERO_SLIDES = [
  {
    id: 0,
    bg: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
    accentColor: '#a78bfa',
    accentGlow: 'rgba(167,139,250,0.35)',
    badge: '🛍️  New Season Drop',
    badgeColor: 'rgba(167,139,250,0.2)',
    title: 'Discover Your',
    titleHighlight: 'Perfect Style',
    subtitle: 'Shop the latest trends with unbeatable prices. Premium quality, curated collections — delivered to your door.',
    cta1: { label: 'Shop Collection', to: '/products' },
    cta2: { label: 'Explore Deals', to: '/products' },
    floats: [
      { icon: FaStar,        color: '#fbbf24', label: '4.9 Rating',    pos: { top: '12%',   left: '8%'   }, yAnim: [0,-8,0] },
      { icon: FaShoppingBag, color: '#a78bfa', label: '2K+ Products',  pos: { top: '18%',   right: '6%'  }, yAnim: [0,-6,0] },
      { icon: FaTruck,       color: '#34d399', label: 'Free Delivery', pos: { bottom: '20%', left: '6%'  }, yAnim: [0,-7,0] },
      { icon: FaCreditCard,  color: '#60a5fa', label: 'Secure Pay',    pos: { bottom: '18%', right: '5%' }, yAnim: [0,-9,0] },
    ],
    centerIcon: FaShoppingBag,
    centerGradient: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
  },
  {
    id: 1,
    bg: 'linear-gradient(135deg, #0d1117 0%, #1a0533 40%, #0d1117 100%)',
    accentColor: '#f472b6',
    accentGlow: 'rgba(244,114,182,0.3)',
    badge: '⚡  Flash Sale Live',
    badgeColor: 'rgba(244,114,182,0.18)',
    title: 'Up to 60% Off',
    titleHighlight: 'Today Only!',
    subtitle: "Limited-time flash sale across electronics, fashion, home & more. Grab the best deals before they're gone.",
    cta1: { label: 'See All Deals', to: '/products' },
    cta2: { label: 'View Categories', to: '/products' },
    floats: [
      { icon: FaBolt,    color: '#fbbf24', label: 'Flash Deals',  pos: { top: '10%',   left: '10%'  }, yAnim: [0,-7,0] },
      { icon: FaPercent, color: '#f472b6', label: '60% OFF',      pos: { top: '20%',   right: '8%'  }, yAnim: [0,-8,0] },
      { icon: FaHeart,   color: '#f87171', label: '50K Wishlist', pos: { bottom: '22%', left: '8%'  }, yAnim: [0,-6,0] },
      { icon: FaGift,    color: '#34d399', label: 'Free Gifts',   pos: { bottom: '15%', right: '6%' }, yAnim: [0,-9,0] },
    ],
    centerIcon: FaBolt,
    centerGradient: 'linear-gradient(135deg, #db2777, #9333ea)',
  },
  {
    id: 2,
    bg: 'linear-gradient(135deg, #001a12 0%, #003d1f 50%, #001a12 100%)',
    accentColor: '#34d399',
    accentGlow: 'rgba(52,211,153,0.3)',
    badge: '🚚  Express Delivery',
    badgeColor: 'rgba(52,211,153,0.18)',
    title: 'Fastest Delivery',
    titleHighlight: 'In The City',
    subtitle: 'Same-day and next-day delivery available. Order by noon, get it by evening — 100% tracked, zero surprises.',
    cta1: { label: 'Order Now', to: '/products' },
    cta2: { label: 'Track Order', to: '/profile' },
    floats: [
      { icon: FaTruck,   color: '#34d399', label: 'Same-Day',     pos: { top: '12%',   left: '6%'   }, yAnim: [0,-8,0] },
      { icon: FaGlobe,   color: '#60a5fa', label: 'Pan India',    pos: { top: '20%',   right: '7%'  }, yAnim: [0,-7,0] },
      { icon: FaLock,    color: '#fbbf24', label: 'Safe & Sealed',pos: { bottom: '20%', left: '7%'  }, yAnim: [0,-6,0] },
      { icon: FaRocket,  color: '#f472b6', label: 'Express',      pos: { bottom: '16%', right: '5%' }, yAnim: [0,-9,0] },
    ],
    centerIcon: FaTruck,
    centerGradient: 'linear-gradient(135deg, #059669, #047857)',
  },
  {
    id: 3,
    bg: 'linear-gradient(135deg, #0c0a1e 0%, #1e1133 50%, #0c0a1e 100%)',
    accentColor: '#fbbf24',
    accentGlow: 'rgba(251,191,36,0.28)',
    badge: '🏆  Rewards Program',
    badgeColor: 'rgba(251,191,36,0.16)',
    title: 'Earn Points,',
    titleHighlight: 'Shop Smarter',
    subtitle: 'Every purchase earns you premium reward points. Redeem for discounts, free products, and exclusive perks.',
    cta1: { label: 'Join Rewards', to: '/register' },
    cta2: { label: 'Browse Deals', to: '/products' },
    floats: [
      { icon: FaStar,      color: '#fbbf24', label: '10× Points',    pos: { top: '12%',   left: '8%'   }, yAnim: [0,-8,0] },
      { icon: FaChartLine, color: '#a78bfa', label: 'Track Rewards', pos: { top: '18%',   right: '6%'  }, yAnim: [0,-6,0] },
      { icon: FaGift,      color: '#f472b6', label: 'Free Gifts',    pos: { bottom: '22%', left: '6%'  }, yAnim: [0,-7,0] },
      { icon: FaShieldAlt, color: '#34d399', label: '100% Genuine',  pos: { bottom: '16%', right: '5%' }, yAnim: [0,-9,0] },
    ],
    centerIcon: FaStar,
    centerGradient: 'linear-gradient(135deg, #d97706, #b45309)',
  },
];

const slideVariants = {
  enter: (dir) => ({ opacity: 0, x: dir > 0 ? 60 : -60 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit:  (dir) => ({ opacity: 0, x: dir > 0 ? -60 : 60, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } }),
};

const chipVariants = {
  hidden:  { opacity: 0, scale: 0.6, y: 20 },
  visible: (d) => ({ opacity: 1, scale: 1, y: 0, transition: { delay: d, duration: 0.5, ease: 'backOut' } }),
};

// ─── Home Component ──────────────────────────────────────────────────────────
const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [slideDir, setSlideDir]     = useState(1);
  const timerRef = useRef(null);
  const navigate = useNavigate();

  // Auto-advance
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSlideDir(1);
      setSlideIndex(prev => (prev + 1) % HERO_SLIDES.length);
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
      setSlideIndex(prev => (prev + 1) % HERO_SLIDES.length);
    }, 4500);
  };


  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await getProducts();
        let productsData = [];
        if (response && response.data) {
          productsData = response.data;
        } else if (Array.isArray(response)) {
          productsData = response;
        } else if (response && Array.isArray(response.products)) {
          productsData = response.products;
        }
        setProducts(productsData || []);
        setLoading(false);
      } catch (err) {
        setError('Unable to fetch products. Please try again later.');
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleSearch = useCallback((query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    const searchTerm = query.toLowerCase().trim();
    const filteredProducts = products.filter(product => {
      if (!product) return false;
      const productName = (product.name || '').toString().toLowerCase();
      const productDesc = (product.description || '').toString().toLowerCase();
      const productCategory = (product.category || '').toString().toLowerCase();
      return (
        productName.includes(searchTerm) ||
        productDesc.includes(searchTerm) ||
        productCategory.includes(searchTerm)
      );
    });
    setSearchResults(filteredProducts);
    setIsSearching(false);
  }, [products]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    handleSearch(value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  const featuredProducts = products.slice(0, 4);
  const latestProducts = products.length > 4 ? products.slice(-4) : products;
  const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))].slice(0, 4);

  return (
    <div className="home-page" style={{ overflow: 'hidden' }}>

      {/* ── Hero Slider Styles ─────────────────────────────────────────── */}
      <style>{`
        /* Wrapper is position:relative so dots/progress can anchor to it */
        .hero-slider-wrap {
          position: relative;
          width: 100%;
          height: 100vh;
          min-height: 600px;
          max-height: 900px;
          overflow: hidden;
        }

        /* Each slide fills the wrapper absolutely */
        .hero-slide {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          will-change: transform, opacity;
        }

        /* Two-column grid inside each slide */
        .hs-inner {
          width: 100%;
          max-width: 1180px;
          margin: 0 auto;
          padding: 0 2rem;
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          gap: 2.5rem;
        }

        @media (max-width: 900px) {
          .hs-inner { grid-template-columns: 1fr; text-align: center; padding: 0 1.2rem; }
          .hs-right  { display: none; }
        }

        /* Badge */
        .hs-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.38rem 1rem;
          border-radius: 999px;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          border: 1px solid rgba(255,255,255,0.18);
          color: #fff;
          margin-bottom: 1.4rem;
        }

        /* Title */
        .hs-title {
          font-size: clamp(2.4rem, 4.5vw, 3.8rem);
          font-weight: 900;
          line-height: 1.1;
          color: #fff;
          letter-spacing: -0.025em;
          margin: 0 0 0.3rem;
        }

        .hs-title-hi {
          display: block;
          -webkit-text-fill-color: transparent;
          -webkit-background-clip: text;
          background-clip: text;
        }

        /* Subtitle */
        .hs-sub {
          font-size: 1.02rem;
          line-height: 1.75;
          color: rgba(255,255,255,0.58);
          margin: 1.2rem 0 0;
          max-width: 460px;
        }
        @media (max-width: 900px) { .hs-sub { margin: 1rem auto 0; } }

        /* CTA row */
        .hs-actions {
          display: flex;
          gap: 0.9rem;
          flex-wrap: wrap;
          margin-top: 2rem;
        }
        @media (max-width: 900px) { .hs-actions { justify-content: center; } }

        .hs-btn-solid {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.8rem 1.8rem;
          border-radius: 999px;
          font-weight: 800;
          font-size: 0.92rem;
          color: #0f172a !important;
          background: #fff;
          border: none;
          text-decoration: none;
          transition: transform 0.2s, box-shadow 0.2s;
          cursor: pointer;
        }
        .hs-btn-solid:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 36px rgba(0,0,0,0.3);
          text-decoration: none;
          color: #0f172a !important;
        }

        .hs-btn-ghost {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.8rem 1.8rem;
          border-radius: 999px;
          font-weight: 700;
          font-size: 0.92rem;
          color: #fff !important;
          background: rgba(255,255,255,0.09);
          border: 1.5px solid rgba(255,255,255,0.25);
          text-decoration: none;
          backdrop-filter: blur(10px);
          transition: all 0.2s;
          cursor: pointer;
        }
        .hs-btn-ghost:hover {
          background: rgba(255,255,255,0.16);
          border-color: rgba(255,255,255,0.45);
          transform: translateY(-2px);
          text-decoration: none;
          color: #fff !important;
        }

        /* Search bar */
        .hs-search-wrap { position: relative; max-width: 500px; margin-top: 1.8rem; }
        @media (max-width: 900px) { .hs-search-wrap { margin: 1.5rem auto 0; } }

        .hs-search-form {
          display: flex;
          align-items: center;
          background: rgba(255,255,255,0.96);
          border-radius: 999px;
          padding: 0.35rem 0.35rem 0.35rem 1.1rem;
          box-shadow: 0 8px 32px rgba(0,0,0,0.22);
        }

        .hs-search-input {
          flex: 1;
          border: none;
          background: transparent;
          outline: none;
          font-size: 0.92rem;
          color: #1e293b;
          padding: 0.35rem 0.7rem;
        }
        .hs-search-input::placeholder { color: #94a3b8; }

        .hs-search-btn {
          padding: 0.55rem 1.3rem;
          border-radius: 999px;
          border: none;
          font-weight: 700;
          font-size: 0.82rem;
          color: #fff;
          cursor: pointer;
          transition: opacity 0.2s;
          white-space: nowrap;
        }
        .hs-search-btn:hover { opacity: 0.85; }

        .hs-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          left: 0; right: 0;
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 16px 48px rgba(0,0,0,0.18);
          overflow: hidden;
          z-index: 300;
          max-height: 290px;
          overflow-y: auto;
        }

        /* Right orb & chips */
        .hs-right {
          position: relative;
          height: 400px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .hs-orb {
          width: 185px;
          height: 185px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 5;
        }

        .hs-orb-ring1 {
          position: absolute;
          inset: -22px;
          border-radius: 50%;
          border: 1.5px solid rgba(255,255,255,0.12);
          animation: orbSpin 5s linear infinite;
        }
        .hs-orb-ring2 {
          position: absolute;
          inset: -44px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.07);
          animation: orbSpin 9s linear infinite reverse;
        }
        @keyframes orbSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        .hs-orb-icon {
          font-size: 5.5rem;
          color: #fff;
          filter: drop-shadow(0 0 28px rgba(255,255,255,0.35));
        }

        /* Floating feature chips */
        .hs-chip {
          position: absolute;
          display: flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.5rem 0.95rem;
          background: rgba(255,255,255,0.09);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 999px;
          backdrop-filter: blur(14px);
          font-size: 0.78rem;
          font-weight: 700;
          color: #fff;
          white-space: nowrap;
          box-shadow: 0 8px 24px rgba(0,0,0,0.2);
          z-index: 10;
        }

        /* Dot nav */
        .hs-dots {
          position: absolute;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 0.5rem;
          z-index: 50;
        }

        .hs-dot {
          height: 7px;
          border-radius: 999px;
          background: rgba(255,255,255,0.35);
          border: none;
          cursor: pointer;
          padding: 0;
          transition: all 0.35s ease;
          width: 7px;
        }
        .hs-dot.active { width: 26px; background: #fff; }

        /* Progress bar at bottom */
        .hs-progress {
          position: absolute;
          bottom: 0; left: 0;
          height: 3px;
          background: rgba(255,255,255,0.85);
          z-index: 50;
          transform-origin: left center;
        }

        /* Ambient blobs */
        .hs-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          opacity: 0.2;
        }
      `}</style>

      {/* ── Hero Slider ───────────────────────────────────────────────── */}
      <div className="hero-slider-wrap">
        <AnimatePresence initial={false} custom={slideDir} mode="popLayout">
          {HERO_SLIDES.map((slide, i) =>
            i !== slideIndex ? null : (
              <motion.div
                key={slide.id}
                className="hero-slide"
                custom={slideDir}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                style={{ background: slide.bg }}
              >
                {/* Ambient blobs */}
                <div className="hs-blob" style={{ width: 480, height: 480, background: slide.accentGlow, top: '-15%', left: '-8%' }} />
                <div className="hs-blob" style={{ width: 340, height: 340, background: slide.accentGlow, bottom: '-10%', right: '3%' }} />

                <div className="hs-inner">
                  {/* ── Left ── */}
                  <div>
                    <motion.div
                      className="hs-badge"
                      style={{ background: slide.badgeColor }}
                      initial={{ opacity: 0, y: -14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.08, duration: 0.4 }}
                    >
                      {slide.badge}
                    </motion.div>

                    <motion.h1
                      className="hs-title"
                      initial={{ opacity: 0, y: 22 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.16, duration: 0.48 }}
                    >
                      {slide.title}{' '}
                      <span
                        className="hs-title-hi"
                        style={{ backgroundImage: `linear-gradient(90deg, ${slide.accentColor}, rgba(255,255,255,0.75))` }}
                      >
                        {slide.titleHighlight}
                      </span>
                    </motion.h1>

                    <motion.p
                      className="hs-sub"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.26, duration: 0.45 }}
                    >
                      {slide.subtitle}
                    </motion.p>

                    {/* Search */}
                    <motion.div
                      className="hs-search-wrap"
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.34, duration: 0.42 }}
                    >
                      <form onSubmit={handleSearchSubmit} className="hs-search-form">
                        <FaSearch style={{ color: '#94a3b8', flexShrink: 0 }} />
                        <input
                          type="search"
                          placeholder="Search products, brands..."
                          value={searchQuery}
                          onChange={handleSearchChange}
                          className="hs-search-input"
                        />
                        <button
                          type="submit"
                          className="hs-search-btn"
                          style={{ background: slide.centerGradient }}
                          disabled={!searchQuery.trim()}
                        >
                          Search
                        </button>
                      </form>

                      {searchQuery && searchResults.length > 0 && !isSearching && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="hs-dropdown"
                        >
                          <div style={{ padding: '0.6rem 1rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>{searchResults.length} results</span>
                            <button onClick={clearSearch} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: '#94a3b8', lineHeight: 1 }}>×</button>
                          </div>
                          {searchResults.slice(0, 5).map(product => (
                            <div
                              key={product._id}
                              onClick={() => navigate(`/product/${product._id}`)}
                              style={{ padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.7rem', cursor: 'pointer', borderBottom: '1px solid #f8fafc', transition: 'background 0.15s' }}
                              onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
                              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <img src={product.image} alt={product.name} style={{ width: 42, height: 42, objectFit: 'cover', borderRadius: 8 }} />
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#1e293b' }}>{product.name}</div>
                                <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#6366f1' }}>₹{product.price}</div>
                              </div>
                            </div>
                          ))}
                          {searchResults.length > 5 && (
                            <div style={{ textAlign: 'center', padding: '0.55rem' }}>
                              <button onClick={handleSearchSubmit} style={{ background: 'none', border: 'none', color: '#6366f1', fontWeight: 700, cursor: 'pointer', fontSize: '0.83rem' }}>
                                View all {searchResults.length} results →
                              </button>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </motion.div>

                    {/* CTAs */}
                    <motion.div
                      className="hs-actions"
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.42, duration: 0.42 }}
                    >
                      <Link to={slide.cta1.to} className="hs-btn-solid">
                        <FaShoppingBag size={14} /> {slide.cta1.label}
                      </Link>
                      <Link to={slide.cta2.to} className="hs-btn-ghost">
                        {slide.cta2.label} <FaArrowRight size={13} />
                      </Link>
                    </motion.div>
                  </div>

                  {/* ── Right illustration ── */}
                  <div className="hs-right">
                    {/* Floating chips */}
                    {slide.floats.map((f, fi) => (
                      <motion.div
                        key={fi}
                        className="hs-chip"
                        style={f.pos}
                        custom={0.38 + fi * 0.12}
                        variants={chipVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        <motion.div
                          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                          animate={{ y: f.yAnim }}
                          transition={{ duration: 3 + fi * 0.5, repeat: Infinity, ease: 'easeInOut' }}
                        >
                          <f.icon style={{ color: f.color, fontSize: '1rem', flexShrink: 0 }} />
                          <span>{f.label}</span>
                        </motion.div>
                      </motion.div>
                    ))}

                    {/* Center orb */}
                    <motion.div
                      className="hs-orb"
                      style={{
                        background: slide.centerGradient,
                        boxShadow: `0 0 0 2px rgba(255,255,255,0.1), 0 0 80px ${slide.accentGlow}`,
                      }}
                      initial={{ scale: 0.65, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.65, ease: 'backOut' }}
                    >
                      <motion.div
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <slide.centerIcon className="hs-orb-icon" />
                      </motion.div>
                      <div className="hs-orb-ring1" />
                      <div className="hs-orb-ring2" />
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )
          )}
        </AnimatePresence>

        {/* Dot navigation */}
        <div className="hs-dots">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              className={`hs-dot${i === slideIndex ? ' active' : ''}`}
              onClick={() => goToSlide(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Progress bar */}
        <motion.div
          key={`progress-${slideIndex}`}
          className="hs-progress"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 4.5, ease: 'linear' }}
          style={{ width: '100%' }}
        />
      </div>


      {/* Features Section */}
      <section className="py-5 bg-white">
        <div className="container">
          <div className="row g-4">
            {[
              { icon: FaShippingFast, title: 'Free Shipping', desc: 'On orders above ₹999', color: '#3b82f6' },
              { icon: FaShieldAlt, title: 'Secure Payment', desc: '100% secure SSL', color: '#10b981' },
              { icon: FaTag, title: 'Best Price', desc: 'Guaranteed best prices', color: '#ef4444' },
              { icon: FaHeadset, title: '24/7 Support', desc: 'Round-the-clock support', color: '#f59e0b' }
            ].map((feature, idx) => (
              <div key={idx} className="col-md-3 col-sm-6">
                <motion.div 
                  whileHover={{ y: -10 }}
                  className="glass-card text-center p-4 h-100"
                >
                  <div className="d-inline-flex p-3 rounded-circle mb-3" style={{ background: `${feature.color}20`, color: feature.color }}>
                    <feature.icon size={24} />
                  </div>
                  <h6 className="fw-bold">{feature.title}</h6>
                  <p className="text-muted small mb-0">{feature.desc}</p>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {!searchQuery && (
        <section className="py-5">
          <div className="container">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="fw-bold"><FaFire className="text-danger me-2" /> Featured Products</h3>
              <Link to="/products" className="text-primary fw-bold text-decoration-none">View All <FaArrowRight /></Link>
            </div>
            
            {loading ? <Loader /> : error ? <div className="alert alert-danger">{error}</div> : (
              <div className="row g-4">
                {featuredProducts.map((product) => (
                  <div key={product._id} className="col-sm-6 col-md-4 col-lg-3">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Categories */}
      {!searchQuery && uniqueCategories.length > 0 && (
        <section className="py-5 bg-light">
          <div className="container">
            <h3 className="fw-bold mb-4 text-center">Popular Categories</h3>
            <div className="row g-4">
              {uniqueCategories.map((category, idx) => (
                <div key={idx} className="col-6 col-md-3">
                  <motion.div whileHover={{ scale: 1.05 }}>
                    <Link to={`/products?category=${category}`} className="glass-card d-block text-center p-4 text-decoration-none h-100">
                      <h5 className="fw-bold text-dark text-capitalize mb-0">{category}</h5>
                    </Link>
                  </motion.div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-5" style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', color: 'white' }}>
        <div className="container text-center">
          <h2 className="fw-bold mb-3">Ready to Shop?</h2>
          <p className="lead mb-4 text-white-50">Join thousands of satisfied customers who shop with us.</p>
          <div className="d-flex gap-3 justify-content-center">
            <Link to="/register" className="btn-premium">
              <FaGift /> Create Free Account
            </Link>
            <Link to="/products" className="btn-premium-outline" style={{ borderColor: 'white', color: 'white' }}>
              <FaShoppingBag /> Browse All
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;