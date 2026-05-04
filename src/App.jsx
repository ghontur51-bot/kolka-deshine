import React, { useState, useEffect, useMemo, useRef } from 'react';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, signInWithPopup } from 'firebase/auth';
import { db, auth, googleProvider } from './firebase';
import './App.css';
import confetti from 'canvas-confetti';
import {
  ShoppingBag, Menu as MenuIcon, X, Plus, Minus, Clock, MapPin, Phone, Calendar,
  CalendarCheck,
  Users, Coffee, CheckCircle, ArrowRight, Sparkles, Search, Loader2, PartyPopper,
  Utensils, Music, Map as MapIcon, Heart, Check, User, LogOut, Mail, Lock, FileText, CheckCircle2
} from 'lucide-react';

const COLORS = {
  coffee: '#1A4065', deepBrown: '#08090C', cream: '#08090C',
  mutedGreen: '#D7E4F2', softGold: '#D4A42F', white: '#FFFFFF',
};

const Section = ({ id, children, className = "" }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setIsVisible(true);
    }, { threshold: 0.1 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref} id={id}
      className={`py-16 md:py-24 px-4 md:px-12 lg:px-24 transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'} ${className}`}
    >
      {children}
    </section>
  );
};

const Button = ({ children, variant = 'primary', className = "", onClick, type = "button", disabled = false }) => {
  const base = "px-6 py-3 md:px-8 md:py-3 rounded-full font-medium transition-all duration-500 transform active:scale-95 flex items-center justify-center gap-2 group overflow-hidden relative disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base";
  const styles = {
    primary: `bg-[#D4A42F] text-[#08090C] hover:shadow-[0_12px_36px_-12px_rgba(212,164,47,0.55)]`,
    secondary: `bg-[#08090C] border-2 border-[#1F4E79] text-[#1F4E79] hover:bg-[#1F4E79] hover:text-white`,
    ghost: `text-white hover:bg-black/5`,
    magic: `bg-gradient-to-r from-[#1F4E79] to-[#08090C] text-white hover:shadow-[0_12px_36px_-12px_rgba(31,78,121,0.5)]`
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${styles[variant]} ${className}`}>
      <span className="relative z-10 flex items-center gap-2">{children}</span>
      <div className="absolute inset-0 bg-[#08090C]/20 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
    </button>
  );
};

const Loader = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(onFinish, 4000);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 z-[1000] bg-[#08090C] flex flex-col items-center justify-center overflow-hidden animate-pure-fade-in-out pointer-events-none">
      <div className="text-center">
        <h1 className="text-4xl md:text-6xl font-serif font-bold text-white tracking-[0.2em] mb-4 drop-shadow-lg">
          <span className="text-[#D4A42F]">K O L K A A</span> D E S I G N S
        </h1>
        <p className="text-[10px] md:text-xs text-[#1F4E79] uppercase tracking-[0.3em] font-medium opacity-90">
          Where every Kolka curve tells a story
        </p>
      </div>
    </div>
  );
};

const playSuccessChime = () => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const ctx = new AudioContext();
  const playNote = (freq, startTime, duration) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
    gain.gain.setValueAtTime(0, ctx.currentTime + startTime);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + startTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + startTime);
    osc.stop(ctx.currentTime + startTime + duration);
  };
  playNote(329.63, 0, 1.5);
  playNote(415.30, 0.1, 1.5);
  playNote(493.88, 0.2, 1.5);
  playNote(659.25, 0.35, 3.0);
};

const PHONE_BRANDS = [
  "Samsung", "Apple", "Vivo", "Oppo", "Xiaomi", "Redmi", "Poco", "Realme", 
  "OnePlus", "Motorola", "iQOO", "Nothing", "Google Pixel", "Infinix", "Tecno"
];

export default function App() {
  const [isAppBooting, setIsAppBooting] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState('All');
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [, setFeedback] = useState(null);
  const [bookingType, setBookingType] = useState('table');
  const [aiSuggestions] = useState([]);

  // Auth & Dashboard States
  const [user, setUser] = useState(undefined);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authError, setAuthError] = useState('');
  const [zoomedImage, setZoomedImage] = useState(null);

  const [userBookings, setUserBookings] = useState([]);
  const [userOrders, setUserOrders] = useState([]);
  const [bookingView, setBookingView] = useState('dashboard'); // 'dashboard' or 'form'
  const [successModal, setSuccessModal] = useState({ isOpen: false, title: '', message: '' });

  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedQty, setSelectedQty] = useState(1);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [quickAddProduct, setQuickAddProduct] = useState(null);
  const [rememberDevice, setRememberDevice] = useState(false);

  const loadSavedDevice = () => {
    if (user?.uid) {
      const saved = localStorage.getItem(`device_${user.uid}`);
      if (saved) {
        try {
          const { brand, model } = JSON.parse(saved);
          if (brand && model) {
            setSelectedBrand(brand);
            setSelectedModel(model);
            setRememberDevice(true);
            return;
          }
        } catch(e) {}
      }
    }
    setSelectedBrand('');
    setSelectedModel('');
    setRememberDevice(false);
  };

  const dynamicCategories = useMemo(() => {
    const cats = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
    return ['All', ...cats];
  }, [products]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const data = [];
      snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
      setProducts(data);
    });

    return () => { unsubscribe(); unsubProducts(); };
  }, []);



  // Auto-login modal popup after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!auth.currentUser) {
        setIsAuthModalOpen(true);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, []);
  // Sync Bookings & Orders when User Logs in
  useEffect(() => {
    if (user) {
      const qBookings = query(collection(db, 'bookings'), where('userId', '==', user.uid));
      const qOrders = query(collection(db, 'orders'), where('userId', '==', user.uid));

      const unsubBookings = onSnapshot(qBookings, (snapshot) => {
        const data = [];
        snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
        data.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
        setUserBookings(data);
        if (data.length > 0) setBookingView('dashboard');
      });

      const unsubOrders = onSnapshot(qOrders, (snapshot) => {
        const data = [];
        snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
        data.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
        setUserOrders(data);
        if (data.length > 0) setBookingView('dashboard'); // Ensure dashboard view
      });

      return () => { unsubBookings(); unsubOrders(); };
    } else {
      setUserBookings([]);
      setUserOrders([]);
      setBookingView('form');
    }
  }, [user]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const triggerSuccessExperience = (title, message) => {
    setSuccessModal({ isOpen: true, title, message });
    setTimeout(() => { playSuccessChime(); }, 100);
    setTimeout(() => {
      confetti({
        particleCount: 150,
        spread: 120,
        origin: { y: 0.5 },
        colors: ['#1F4E79', '#D4A42F', '#D7E4F2', '#F5F1E6', '#08090C'],
        zIndex: 2000,
        disableForReducedMotion: true
      });
    }, 800);
  };

  const addToCart = (item, qty = 1) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, qty: Math.min(i.qty + qty, item.stock) } : i);
      return [...prev, { ...item, qty: Math.min(qty, item.stock) }];
    });
    setFeedback(`Added ${qty} ${item.name}!`);
    setTimeout(() => setFeedback(null), 2000);
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.min(item.stock, Math.max(0, item.qty + delta));
        return newQty === 0 ? null : { ...item, qty: newQty };
      }
      return item;
    }).filter(Boolean));
  };

  const cartTotal = useMemo(() => cart.reduce((acc, item) => acc + (item.price * item.qty), 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((acc, item) => acc + item.qty, 0), [cart]);
  const filteredItems = useMemo(() => {
    return activeTab === 'All' ? products : products.filter(i => i.category === activeTab);
  }, [activeTab, products]);

  // Authentication Submission
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setIsLoading(true);
    const form = new FormData(e.target);
    const email = form.get('email');
    const password = form.get('password');

    try {
      if (authMode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
        setFeedback('Welcome back to Kolkaa Designs.');
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        setFeedback('Account beautifully created.');
      }
      setIsAuthModalOpen(false);
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      setAuthError(err.message.replace('Firebase:', ''));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setAuthError('');
    setIsLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      setFeedback('Welcome to Kolkaa Designs with Google.');
      setIsAuthModalOpen(false);
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      setAuthError(err.message.replace('Firebase:', ''));
    } finally {
      setIsLoading(false);
    }
  };

  const requireAuth = () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return false;
    }
    return true;
  };

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const submitOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0 || isLoading) return;
    if (!requireAuth()) return;

    setIsLoading(true);
    try {
      const form = new FormData(e.target);
      const customerData = {
        name: form.get('name'),
        phone: form.get('phone'),
        address: form.get('address'),
        city: form.get('city'),
        state: form.get('state'),
        pincode: form.get('pincode')
      };

      const data = {
        userId: user.uid,
        userEmail: user.email,
        customer: customerData,
        items: cart,
        total: cartTotal,
        status: 'pending',
        shiprocket_ready: true,
        package_details: {
          weight: 0.2, // 200 grams standard phone cover
          length: 15,
          width: 8,
          height: 2
        }
      };

      const res = await fetch('/api/createOrder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: cartTotal })
      });
      const orderData = await res.json();
      
      if (!orderData.order) throw new Error("Could not create Razorpay order. Check API.");

      const isLoaded = await loadRazorpay();
      if (!isLoaded) throw new Error("Razorpay SDK failed to load. Are you offline?");

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_SlLNPssVEb5UN1',
        amount: orderData.order.amount,
        currency: "INR",
        name: "Kolkaa Designs",
        description: "Premium Purchase",
        order_id: orderData.order.id,
        handler: async function (response) {
          data.payment_id = response.razorpay_payment_id;
          data.razorpay_order_id = response.razorpay_order_id;
          data.razorpay_signature = response.razorpay_signature;
          data.status = 'paid';
          data.createdAt = serverTimestamp();

          setCart([]);
          setIsCheckoutModalOpen(false);
          triggerSuccessExperience("Payment Successful!", "Your Kolkaa piece has been secured.");
          setBookingView('dashboard');

          // Async Background Firestore Push and Shiprocket Sync
          addDoc(collection(db, 'orders'), data)
            .then(async (docRef) => {
              // Push to Shiprocket silently
              try {
                const shiprocketRes = await fetch('/api/createShiprocketOrder', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ orderDetails: { ...data, orderId: docRef.id } })
                });
                const shipData = await shiprocketRes.json();
                if (shipData.success) {
                  console.log("Shiprocket Order Created Successfully!");
                }
              } catch(e) {
                console.error("Failed to call Shiprocket API route:", e);
              }
            })
            .catch(err => {
              console.error("Firebase Sync Error", err);
            });
        },
        prefill: {
          name: customerData.name,
          email: user.email,
          contact: customerData.phone
        },
        theme: {
          color: "#D4A42F"
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response){
        alert("Payment Failed: " + response.error.description);
      });
      rzp.open();

    } catch (err) {
      console.error(err);
      alert("Checkout Logic Error: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!requireAuth()) return;

    setIsLoading(true);
    try {
      const form = new FormData(e.target);
      const data = Object.fromEntries(form.entries());
      data.userId = user.uid;
      data.userEmail = user.email;
      data.type = bookingType;
      data.createdAt = serverTimestamp();

      await addDoc(collection(db, 'bookings'), data);
      e.target.reset();
      triggerSuccessExperience(bookingType === 'table' ? 'Table Secured' : 'Venue Request Sent', 'We look forward to hosting you in our sanctuary.');
      setBookingView('dashboard');
    } catch (err) {
      console.error(err);
      alert("Firebase Error (Booking): " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Status Styling Logic for Realtime Sync
  const getStatusStyle = (status) => {
    switch (status) {
      case 'pending': return 'bg-[#f7ebbe] text-[#8f6510]';
      case 'preparing': return 'bg-[#d7e4f2] text-[#1F4E79]';
      case 'out_for_delivery': return 'bg-[#c7d9ec] text-[#163754]';
      case 'delivered': return 'bg-[#e7efd6] text-[#33511f]';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-[#1a1f26] text-gray-300';
    }
  };

  const getStatusLabel = (status) => status?.replace(/_/g, ' ') || 'pending';

  return (
    <div className="kolka-shell min-h-screen font-sans selection:bg-transparent selection:text-white relative w-full overflow-x-hidden" style={{ backgroundColor: COLORS.cream }}>
      {isAppBooting && <Loader onFinish={() => setIsAppBooting(false)} />}

      {/* NAVBAR */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-700 ${isScrolled ? 'kolka-nav bg-[#08090C]/90 backdrop-blur-xl shadow-lg py-3' : 'bg-transparent py-4'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-9 h-9 md:w-10 md:h-10 bg-[#1F4E79] rounded-xl flex items-center justify-center text-white rotate-3 group-hover:rotate-0 transition-all">
              <Coffee size={20} />
            </div>
            <span className="text-xl md:text-2xl font-serif font-bold text-white">Kolkaa Designs</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {[
              { label: 'Home', action: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
              { label: 'Collection', action: () => document.getElementById('menu').scrollIntoView({ behavior: 'smooth' }) },
              { label: 'Dashboard', action: () => document.getElementById('hub').scrollIntoView({ behavior: 'smooth' }) }
            ].map(link => (
              <button key={link.label} onClick={link.action} className="text-white font-medium hover:text-[#1F4E79] transition-all text-sm uppercase tracking-widest">{link.label}</button>
            ))}
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <button onClick={() => setIsCartOpen(true)} className="relative p-2 text-white hover:bg-black/5 rounded-full transition-all">
              <ShoppingBag size={22} />
              {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-[#D4A42F] text-[#08090C] text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{cartCount}</span>}
            </button>
            <button
              onClick={() => user ? signOut(auth) : setIsAuthModalOpen(true)}
              className="px-4 py-2 bg-[#D4A42F] text-[#08090C] rounded-full shadow-md hover:shadow-[0_12px_36px_-12px_rgba(212,164,47,0.55)] transition-all font-bold text-sm flex items-center gap-2"
            >
              {user ? <><LogOut size={16} /> Logout</> : <><User size={16} /> Login</>}
            </button>
            <button className="md:hidden p-2 text-white" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              <MenuIcon size={24} />
            </button>
            <Button variant="primary" className="hidden md:flex" onClick={() => document.getElementById('menu').scrollIntoView({ behavior: 'smooth' })}>Order Now</Button>
          </div>
        </div>
      </nav>

      <section id="home" className="kolka-hero relative min-h-[100vh] md:h-screen flex items-center pt-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#08090C]/80 via-[#08090C]/30 to-[#08090C]/80 md:bg-gradient-to-r md:from-[#08090C]/80 md:via-[#08090C]/40 md:to-transparent z-10" />
          <picture>
            <source media="(min-width: 768px)" srcSet="/hero_pc." />
            <img src="/hero_phone.jpg" alt="Kolkaa Designs handcrafted artwork" className="w-full h-full object-cover animate-subtle-zoom" />
          </picture>
        </div>
        <div className="relative z-10 px-6 md:px-12 lg:px-24 max-w-4xl text-white pt-10 md:pt-0">
          <div className="inline-flex items-center gap-2 bg-[#08090C]/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full text-[10px] md:text-sm font-medium mb-6 animate-in slide-in-from-bottom-4 shadow-lg shadow-black/20">
            <Sparkles size={14} className="text-[#D4A42F]" /> Hand-painted heritage, carried everywhere
          </div>
          <h1 className="text-5xl md:text-8xl font-serif font-bold mb-4 md:mb-6 leading-tight max-w-[15ch] drop-shadow-xl">
            Kolka <span className="text-[#D4A42F] italic">Art</span><br />for Everyday.
          </h1>
          <p className="text-sm md:text-xl text-white/90 mb-8 md:mb-12 max-w-md md:max-w-xl font-medium drop-shadow-md">
            Hand-painted Kolka designs, rich handcrafted details, and statement pieces made to carry a piece of home every day.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="primary" className="w-full sm:w-auto text-base py-5 px-8 shadow-[#D4A42F]/30 shadow-2xl" onClick={() => document.getElementById('menu').scrollIntoView({ behavior: 'smooth' })}>Explore Collection</Button>
            <Button variant="secondary" className="w-full sm:w-auto text-base py-5 px-8 hidden md:flex backdrop-blur-md bg-[#08090C]/10 border-white/30 text-white hover:bg-[#08090C] hover:text-white" onClick={() => document.getElementById('hub').scrollIntoView({ behavior: 'smooth' })}>My Orders</Button>
          </div>
        </div>
      </section>

      {/* MENU */}
      <Section id="menu" className="kolka-menu-section">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-3xl md:text-6xl font-serif font-bold text-white mb-4">Our Kolka Collection</h2>
          <div className="w-16 md:w-24 h-1 bg-[#1F4E79] mx-auto rounded-full" />
        </div>
        <div className="flex overflow-x-auto gap-2 pb-6 no-scrollbar -mx-4 px-4 md:justify-center md:flex-wrap md:mx-0">
          {dynamicCategories.map(cat => (
            <button key={cat} onClick={() => setActiveTab(cat)} className={`whitespace-nowrap px-6 py-2.5 rounded-full transition-all text-xs md:text-sm font-bold border-2 ${activeTab === cat ? 'bg-[#08090C] text-white border-[#08090C] shadow-lg' : 'bg-[#08090C] text-white border-transparent'}`}>{cat}</button>
          ))}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-8">
          {filteredItems.map(item => (
            <div key={item.id} onClick={() => { setSelectedProduct(item); setSelectedQty(1); setSelectedImageIdx(0); loadSavedDevice(); }} className="kolka-product-card group bg-[#08090C] rounded-2xl md:rounded-3xl p-3 md:p-4 shadow-sm flex flex-col relative animate-in slide-in-from-bottom-4 cursor-pointer hover:shadow-xl transition-all">
              <div className="w-full aspect-square bg-[#11131a] rounded-xl md:rounded-2xl mb-3 md:mb-4 overflow-hidden relative">
                <img src={(Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : (item.img || "https://images.unsplash.com/photo-1584820927498-cafe2c17ab7b?auto=format&fit=crop&w=400"))} onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1584820927498-cafe2c17ab7b?auto=format&fit=crop&w=400"; }} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 bg-transparent" />
                <div className="absolute top-1 left-1 md:top-2 md:left-2 bg-[#08090C]/90 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] md:text-[10px] font-bold text-[#1F4E79]">{item.tag}</div>
              </div>
              <div className="flex-1">
                <h3 className="text-xs md:text-lg font-serif font-bold text-white mb-1 line-clamp-1 md:line-clamp-none">{item.name}</h3>
                <p className="text-[9px] md:text-[11px] text-gray-400 mb-2 md:mb-4 line-clamp-2">{item.desc}</p>
              </div>
              <div className="flex items-center justify-between pt-2 md:pt-3 border-t border-[#222]">
                <span className="text-sm md:text-xl font-serif font-bold text-[#1F4E79]">₹{item.price.toFixed(2)}</span>
                <button onClick={(e) => { e.stopPropagation(); setQuickAddProduct(item); setSelectedQty(1); loadSavedDevice(); }} className="bg-[#D4A42F] text-[#08090C] p-1.5 md:p-2.5 rounded-lg md:rounded-xl flex items-center justify-center transform transition-all active:scale-95 group-hover:rotate-6">
                  <ShoppingBag className="w-3 h-3 md:w-[18px] md:h-[18px]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* HUB / DASHBOARD */}
      <Section id="hub" className="kolka-hub-section bg-transparent">
        <div className="max-w-6xl mx-auto space-y-10 lg:space-y-0 lg:grid lg:grid-cols-5 lg:gap-16 lg:items-center">
          <div className="lg:col-span-2 space-y-6 text-center lg:text-left">
            <h2 className="text-4xl md:text-6xl font-serif font-bold text-white">My Kolkaa <br className="hidden lg:block" /> Hub</h2>
            <p className="text-[#1F4E79] text-sm md:text-lg max-w-sm mx-auto lg:mx-0">
              Track your handcrafted Kolkaa pieces, from order to doorstep, in one calm little dashboard.
            </p>
          </div>

          <div className="lg:col-span-3">
            {userOrders.length > 0 ? (

              /* USER HUB DASHBOARD (Orders) */
              <div className="space-y-6 animate-in fade-in slide-in-from-right-10 duration-500">

                {/* Orders Tracker Section */}
                <div className="bg-[#08090C] p-6 md:p-8 rounded-[2.5rem] shadow-2xl border border-[#333] relative overflow-hidden flex flex-col">
                  <h3 className="text-xl font-serif font-bold text-white mb-4 flex items-center gap-2"><ShoppingBag size={20} /> Live Order Tracker</h3>
                  <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left text-sm text-gray-300">
                      <tbody className="divide-y divide-gray-50">
                        {userOrders.map(order => (
                          <tr key={order.id} className="hover:bg-[#11131a] transition-colors">
                            <td className="p-3">
                              <span className="font-bold text-white block">Order #{order.id.slice(-5).toUpperCase()}</span>
                              <span className="text-xs text-gray-400">{new Date(order.createdAt?.toDate()).toLocaleDateString() || 'Just now'}</span>
                            </td>
                            <td className="p-3 font-medium flex items-center gap-1">
                              <span className="text-xs text-gray-400">{order.items?.length} items</span>
                            </td>
                            <td className="p-3 font-serif font-bold text-[#1F4E79]">₹{order.total?.toFixed(2)}</td>
                            <td className="p-3 text-right">
                              <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(order.status)}`}>
                                {getStatusLabel(order.status)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

            ) : (

              /* PREMIUM EMPTY STATE FOR KOLKAA */
              <div className="bg-[#08090C] p-6 md:p-10 rounded-[2.5rem] shadow-2xl border border-[#333] relative overflow-hidden min-h-[500px] flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-left-10 duration-500">
                <div className="w-24 h-24 mb-6 rounded-full bg-[#11131a] border border-[#333] flex items-center justify-center shadow-inner">
                  <ShoppingBag size={40} className="text-[#1F4E79]" />
                </div>
                <h3 className="text-4xl font-serif font-bold text-[#D4A42F] mb-2 tracking-wide">Your Collection Awaits</h3>
                <p className="text-lg text-gray-400 font-medium mt-2 leading-relaxed max-w-sm mx-auto">
                  Select your favorite handcrafted Kolkaa pieces <br /> to unlock live order tracking.
                </p>
                <div className="mt-10">
                  <Button variant="primary" className="shadow-[#D4A42F]/30 shadow-xl px-10 py-4 text-lg font-bold" onClick={() => document.getElementById('menu').scrollIntoView({ behavior: 'smooth' })}>
                    Explore Kolkaa
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Section>

      <footer className="kolka-footer bg-transparent text-white py-16 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex justify-center items-center">
          <p className="text-[10px] text-white/30 uppercase font-bold tracking-[0.2em]">&copy; {new Date().getFullYear()} Kolkaa Designs. All Rights Reserved.</p>
        </div>
      </footer>

      {/* MAC-STYLE PRODUCT MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center px-4 overflow-hidden">
          <div className="absolute inset-0 bg-[#08090C]/40 backdrop-blur-md transition-opacity duration-300" onClick={() => setSelectedProduct(null)} />
          <div className="relative bg-[#08090C] rounded-[2rem] w-full max-w-3xl max-h-[85vh] shadow-[0_30px_60px_-15px_rgba(42,36,49,0.3)] flex flex-col md:flex-row overflow-hidden transform transition-all animate-in zoom-in-95 duration-300 border-2 border-white/50 backdrop-blur-xl">

            {/* Mac OS Window Header */}
            <div className="absolute top-4 left-4 flex gap-1.5 z-20">
              <div className="w-3.5 h-3.5 rounded-full bg-red-400 cursor-pointer shadow-sm hover:bg-red-500" onClick={() => setSelectedProduct(null)} />
              <div className="w-3.5 h-3.5 rounded-full bg-yellow-400 shadow-sm" />
              <div className="w-3.5 h-3.5 rounded-full bg-green-400 shadow-sm" />
            </div>

            {/* Image Preview */}
            <div className="w-full md:w-1/2 shrink-0 bg-gradient-to-br from-white to-[#F5F1E6]/50 relative p-8 flex flex-col justify-center items-center overflow-hidden">
              <div className="w-full h-56 md:h-72 flex items-center justify-center p-2 mb-4">
                <img
                  onClick={() => setZoomedImage(Array.isArray(selectedProduct.images) && selectedProduct.images.length > 0 ? (selectedProduct.images[selectedImageIdx] || selectedProduct.images[0]) : (selectedProduct.img || 'https://images.unsplash.com/photo-1584820927498-cafe2c17ab7b?auto=format&fit=crop&w=400'))}
                  src={Array.isArray(selectedProduct.images) && selectedProduct.images.length > 0 ? (selectedProduct.images[selectedImageIdx] || selectedProduct.images[0]) : (selectedProduct.img || 'https://images.unsplash.com/photo-1584820927498-cafe2c17ab7b?auto=format&fit=crop&w=400')}
                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1584820927498-cafe2c17ab7b?auto=format&fit=crop&w=400'; }}
                  alt={selectedProduct.name}
                  className="max-w-full max-h-full object-contain rounded-2xl animate-in zoom-in duration-300 shadow-xl bg-[#08090C] p-2 border border-[#D4A42F]/10 cursor-zoom-in hover:scale-105 transition-transform"
                />
              </div>

              {Array.isArray(selectedProduct.images) && selectedProduct.images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto p-2 w-full max-w-[95%] snap-x no-scrollbar justify-start md:justify-center">
                  {selectedProduct.images.map((imgUrl, idx) => (
                    <button key={idx} onClick={() => setSelectedImageIdx(idx)} className={`w-14 h-14 shrink-0 rounded-xl overflow-hidden snap-center border-2 transition-all shadow-sm ${selectedImageIdx === idx ? 'border-[#D4A42F] shadow-md scale-110' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'}`}>
                      <img src={imgUrl} className="w-full h-full object-cover" onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1584820927498-cafe2c17ab7b?auto=format&fit=crop&w=100'; }} />
                    </button>
                  ))}
                </div>
              )}

              <div className="absolute bottom-6 left-0 w-full flex justify-center pointer-events-none">
                <span className="bg-[#08090C] text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-lg">
                  Handcrafted {selectedProduct.category}
                </span>
              </div>
            </div>

            {/* Details */}
            <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col justify-between overflow-y-auto">
              <div>
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-2">{selectedProduct.name}</h2>
                <div className="text-2xl font-serif font-bold text-[#D4A42F] mb-6">₹{Number(selectedProduct.price).toFixed(2)}</div>

                <div className="bg-[#08090C] p-5 rounded-2xl shadow-sm border border-[#D4A42F]/10 mb-8 relative overflow-hidden">
                  <div className="w-1.5 h-full bg-[#D4A42F] absolute left-0 top-0"></div>
                  <p className="text-sm text-[#1F4E79] font-medium leading-relaxed whitespace-pre-wrap">{selectedProduct.desc}</p>
                </div>

                <div className="mb-6 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-2">Device Brand</p>
                    <div className="relative">
                      <select value={selectedBrand} onChange={e => { setSelectedBrand(e.target.value); setSelectedModel(''); }} className="w-full bg-[#11131a] text-white border border-[#333] focus:border-[#D4A42F] rounded-xl p-3 text-sm outline-none appearance-none cursor-pointer transition-all">
                        <option value="" disabled>Select Brand</option>
                        {PHONE_BRANDS.map(brand => (
                          <option key={brand} value={brand}>{brand}</option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-2">Device Model</p>
                    <input 
                      type="text" 
                      value={selectedModel} 
                      onChange={e => setSelectedModel(e.target.value)} 
                      disabled={!selectedBrand} 
                      placeholder={selectedBrand ? `e.g. S24 Ultra` : `Select brand first`}
                      className="w-full bg-[#11131a] text-white border border-[#333] focus:border-[#D4A42F] rounded-xl p-3 text-sm outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    />
                  </div>
                </div>

                {user && (
                  <div className="mb-6 -mt-2">
                    <label className="flex items-center gap-2 cursor-pointer group w-max">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${rememberDevice ? 'bg-[#D4A42F] border-[#D4A42F]' : 'border-[#333] bg-[#11131a] group-hover:border-[#D4A42F]'}`}>
                        {rememberDevice && <Check size={12} className="text-[#08090C]" />}
                      </div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider select-none">Remember my device choice</span>
                      <input type="checkbox" checked={rememberDevice} onChange={(e) => setRememberDevice(e.target.checked)} className="hidden" />
                    </label>
                  </div>
                )}

                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-2">Quantity</p>
                <div className="flex items-center gap-4 bg-[#08090C] p-2 rounded-xl shadow-sm w-max border border-[#333] mb-6">
                  <button onClick={() => setSelectedQty(Math.max(1, selectedQty - 1))} className="w-10 h-10 rounded-lg bg-[#11131a] flex items-center justify-center text-white hover:bg-[#1a1f26] transition-colors"><Minus size={16} /></button>
                  <span className="text-lg font-bold w-8 text-center">{selectedQty}</span>
                  <button onClick={() => setSelectedQty(prev => Math.min(prev + 1, selectedProduct.stock))} className="w-10 h-10 rounded-lg bg-[#11131a] flex items-center justify-center text-white hover:bg-[#1a1f26] transition-colors"><Plus size={16} /></button>
                </div>
              </div>

              <Button variant="primary" disabled={!selectedBrand || !selectedModel} className="w-full py-5 text-lg font-bold shadow-[#D4A42F]/30 shadow-xl" onClick={() => {
                if (user?.uid && rememberDevice && selectedBrand && selectedModel) {
                  localStorage.setItem(`device_${user.uid}`, JSON.stringify({ brand: selectedBrand, model: selectedModel }));
                } else if (user?.uid && !rememberDevice) {
                  localStorage.removeItem(`device_${user.uid}`);
                }
                addToCart({
                  ...selectedProduct,
                  id: `${selectedProduct.id}-${selectedBrand}-${selectedModel}`,
                  name: `${selectedProduct.name} (${selectedBrand} ${selectedModel})`
                }, selectedQty);
                setSelectedProduct(null);
              }}>
                {!selectedBrand || !selectedModel ? 'Select Device Model' : 'Add to Bag'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK ADD DEVICE SELECTION MODAL */}
      {quickAddProduct && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center px-4 overflow-hidden">
          <div className="absolute inset-0 bg-[#08090C]/40 backdrop-blur-sm transition-opacity duration-500" onClick={() => setQuickAddProduct(null)} />

          <div className="relative bg-[#08090C] border border-[#D4A42F]/20 rounded-[2.5rem] p-8 md:p-10 max-w-md w-full shadow-[0_20px_60px_-15px_rgba(212,164,47,0.15)] animate-in zoom-in-95 fade-in duration-300">
            <button onClick={() => setQuickAddProduct(null)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-all"><X size={20} /></button>
            
            <div className="mb-6 flex items-center gap-4 border-b border-[#D4A42F]/10 pb-6">
              <img src={(Array.isArray(quickAddProduct.images) && quickAddProduct.images.length > 0 ? quickAddProduct.images[0] : (quickAddProduct.img || 'https://images.unsplash.com/photo-1584820927498-cafe2c17ab7b?auto=format&fit=crop&q=80&w=400'))} className="w-16 h-16 rounded-xl object-cover bg-[#11131a]" />
              <div className="text-left">
                <h3 className="text-xl font-serif font-bold text-white leading-tight mb-1">{quickAddProduct.name}</h3>
                <p className="text-[#D4A42F] font-bold">₹{Number(quickAddProduct.price).toFixed(2)}</p>
              </div>
            </div>

            <div className="space-y-4 mb-8 text-left">
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-2">Device Brand</p>
                <div className="relative">
                  <select value={selectedBrand} onChange={e => { setSelectedBrand(e.target.value); setSelectedModel(''); }} className="w-full bg-[#11131a] text-white border border-[#333] focus:border-[#D4A42F] rounded-xl p-3 text-sm outline-none appearance-none cursor-pointer transition-all">
                    <option value="" disabled>Select Brand</option>
                    {PHONE_BRANDS.map(brand => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-2">Device Model</p>
                <input 
                  type="text" 
                  value={selectedModel} 
                  onChange={e => setSelectedModel(e.target.value)} 
                  disabled={!selectedBrand} 
                  placeholder={selectedBrand ? `e.g. S24 Ultra` : `Select brand first`}
                  className="w-full bg-[#11131a] text-white border border-[#333] focus:border-[#D4A42F] rounded-xl p-3 text-sm outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                />
              </div>

              {user && (
                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer group w-max">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${rememberDevice ? 'bg-[#D4A42F] border-[#D4A42F]' : 'border-[#333] bg-[#11131a] group-hover:border-[#D4A42F]'}`}>
                      {rememberDevice && <Check size={12} className="text-[#08090C]" />}
                    </div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider select-none">Remember my device choice</span>
                    <input type="checkbox" checked={rememberDevice} onChange={(e) => setRememberDevice(e.target.checked)} className="hidden" />
                  </label>
                </div>
              )}
            </div>

            <Button variant="primary" disabled={!selectedBrand || !selectedModel} className="w-full py-4 text-lg font-bold shadow-lg shadow-[#D4A42F]/20" onClick={() => {
              if (user?.uid && rememberDevice && selectedBrand && selectedModel) {
                localStorage.setItem(`device_${user.uid}`, JSON.stringify({ brand: selectedBrand, model: selectedModel }));
              } else if (user?.uid && !rememberDevice) {
                localStorage.removeItem(`device_${user.uid}`);
              }
              addToCart({
                ...quickAddProduct,
                id: `${quickAddProduct.id}-${selectedBrand}-${selectedModel}`,
                name: `${quickAddProduct.name} (${selectedBrand} ${selectedModel})`
              }, 1);
              setQuickAddProduct(null);
            }}>
              {!selectedBrand || !selectedModel ? 'Select Device' : 'Add to Bag'}
            </Button>
          </div>
        </div>
      )}

      {/* REFINED CART PANEL (NO DELIVERY FORM IN SIDEBAR) */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
          <div className="relative w-full md:max-w-md bg-[#08090C] h-full flex flex-col animate-in slide-in-from-right">
            <div className="p-6 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag size={20} className="text-[#1F4E79]" />
                <h3 className="text-xl font-serif font-bold">Your Order</h3>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-black/5 rounded-full"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-20 h-20 bg-[#11131a] rounded-full flex items-center justify-center text-gray-200"><ShoppingBag size={40} /></div>
                  <p className="text-gray-400 italic font-serif">Your coffee bag is feeling light...</p>
                  <Button variant="secondary" onClick={() => setIsCartOpen(false)}>Start Shopping</Button>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex gap-4 items-center bg-[#08090C]/30 p-3 rounded-2xl animate-in fade-in">
                    <img src={(Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : (item.img || 'https://images.unsplash.com/photo-1584820927498-cafe2c17ab7b?auto=format&fit=crop&q=80&w=400'))} className="w-20 h-20 bg-[#1a1f26] rounded-xl object-cover" />
                    <div className="flex-1">
                      <h4 className="font-bold text-sm text-white">{item.name}</h4>
                      <p className="text-xs text-[#1F4E79] font-bold mb-2">₹{item.price.toFixed(2)}</p>
                      <div className="flex items-center gap-3">
                        <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded-md bg-[#08090C] flex items-center justify-center text-white"><Minus size={12} /></button>
                        <span className="text-sm font-bold w-4 text-center">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 rounded-md bg-[#08090C] flex items-center justify-center text-white"><Plus size={12} /></button>
                      </div>
                    </div>
                    <div className="text-right font-serif font-bold text-white">
                      ₹{(item.price * item.qty).toFixed(2)}
                    </div>
                  </div>
                ))
              )}
            </div>
            {cart.length > 0 && (
              <div className="p-6 bg-[#08090C] border-t border-[#333] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                <div className="flex justify-between items-center text-2xl font-serif font-bold mb-6">
                  <span>Total Amount</span>
                  <span className="text-[#1F4E79]">₹{cartTotal.toFixed(2)}</span>
                </div>
                <Button
                  onClick={() => {
                    if (!requireAuth()) return;
                    setIsCartOpen(false);
                    setIsCheckoutModalOpen(true);
                  }}
                  variant="primary"
                  className="w-full py-5 text-lg font-bold"
                >
                  Proceed to Checkout <ArrowRight size={20} />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* NEW STANDALONE CHECKOUT MODAL */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-[1500] flex items-center justify-center px-4 overflow-hidden">
          <div className="absolute inset-0 bg-[#08090C]/40 backdrop-blur-sm transition-opacity duration-500" onClick={() => setIsCheckoutModalOpen(false)} />

          <div className="relative bg-[#08090C] border border-[#D4A42F]/20 rounded-[2.5rem] p-10 md:p-14 max-w-md w-full shadow-2xl animate-in slide-in-from-bottom-12 fade-in duration-500">
            <button onClick={() => setIsCheckoutModalOpen(false)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-[#1a1f26] text-gray-400 transition-all">
              <X size={20} />
            </button>

            <div className="w-14 h-14 bg-[#08090C] rounded-full flex items-center justify-center mb-6 shadow-sm border border-[#D4A42F]/50">
              <MapPin size={24} className="text-white" />
            </div>



            <h2 className="text-3xl font-serif font-bold text-white mb-1">Delivery Details</h2>
            <p className="text-sm text-[#1F4E79] mb-8">Where should we deliver your Kolkaa piece?</p>

            <form onSubmit={submitOrder} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-2">Name</label>
                <input name="name" required placeholder="John Doe" defaultValue={user?.displayName || ''} className="w-full bg-[#11131a] border-2 border-transparent focus:border-[#D4A42F] focus:bg-[#08090C] rounded-xl p-4 text-sm outline-none transition-all" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-2">Phone</label>
                <input name="phone" required placeholder="+1 234 567 890" className="w-full bg-[#11131a] border-2 border-transparent focus:border-[#D4A42F] focus:bg-[#08090C] rounded-xl p-4 text-sm outline-none transition-all" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-2">Address</label>
                <textarea name="address" required rows="2" placeholder="Apt 123, Coffee Street..." className="w-full bg-[#11131a] border-2 border-transparent focus:border-[#D4A42F] focus:bg-[#08090C] rounded-xl p-4 text-sm outline-none transition-all resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-2">City</label>
                  <input name="city" required placeholder="Mumbai" className="w-full bg-[#11131a] border-2 border-transparent focus:border-[#D4A42F] focus:bg-[#08090C] rounded-xl p-4 text-sm outline-none transition-all" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-2">Pincode</label>
                  <input name="pincode" required placeholder="400001" className="w-full bg-[#11131a] border-2 border-transparent focus:border-[#D4A42F] focus:bg-[#08090C] rounded-xl p-4 text-sm outline-none transition-all" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-2">State</label>
                <input name="state" required placeholder="Maharashtra" className="w-full bg-[#11131a] border-2 border-transparent focus:border-[#D4A42F] focus:bg-[#08090C] rounded-xl p-4 text-sm outline-none transition-all" />
              </div>

              <Button type="submit" disabled={isLoading} variant="primary" className={`w-full py-4 text-lg font-bold shadow-lg mt-4 ${isLoading ? 'opacity-50 cursor-not-allowed shadow-none' : 'shadow-[#D4A42F]/20'}`}>
                {isLoading ? 'Confirming...' : `Confirm Purchase · ₹${cartTotal.toFixed(2)}`}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* AUTHENTICATION MODAL */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center px-4 overflow-hidden">
          <div className="absolute inset-0 bg-[#08090C]/40 backdrop-blur-sm transition-opacity duration-500" onClick={() => setIsAuthModalOpen(false)} />

          <div className="relative bg-[#08090C] border-2 border-white rounded-[2.5rem] p-10 md:p-14 max-w-sm w-full text-center shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] animate-in slide-in-from-bottom-12 fade-in duration-500">
            <button onClick={() => setIsAuthModalOpen(false)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-[#08090C]/50 text-white transition-all"><X size={20} /></button>
            <div className="w-14 h-14 bg-[#08090C] rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-[#D4A42F]/20">
              {authMode === 'login' ? <Lock size={24} className="text-[#D4A42F]" /> : <User size={24} className="text-[#D4A42F]" />}
            </div>
            <h2 className="text-3xl font-serif font-bold text-white mb-2">{authMode === 'login' ? 'Welcome Back' : 'Join Kolkaa Designs'}</h2>
            <p className="text-xs text-[#1F4E79] mb-8 uppercase tracking-wider font-bold">Secure your Kolkaa corner</p>
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input name="email" type="email" required placeholder="Email address" className="w-full bg-[#08090C] pl-12 pr-4 py-4 rounded-xl text-sm outline-none focus:border-[#D4A42F] border-2 border-transparent transition-all shadow-sm" />
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input name="password" type="password" required placeholder="Password" minLength="6" className="w-full bg-[#08090C] pl-12 pr-4 py-4 rounded-xl text-sm outline-none focus:border-[#D4A42F] border-2 border-transparent transition-all shadow-sm" />
              </div>
              {authError && <p className="text-[10px] text-red-500 font-bold bg-[#08090C]/50 p-2 rounded-lg">{authError}</p>}
              <Button type="submit" variant="primary" className="w-full py-4 shadow-xl mt-4">{authMode === 'login' ? 'Sign In' : 'Create Account'}</Button>
            </form>
            <div className="mt-4 pt-4 border-t border-[#333]">
              <button type="button" onClick={handleGoogleAuth} className="w-full flex items-center justify-center gap-3 bg-[#08090C] border-2 border-[#333] hover:border-[#D4A42F] hover:bg-[#11131a] text-gray-400 rounded-xl py-3 text-sm font-bold shadow-sm transition-all focus:outline-none">
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5 object-contain" />
                Continue with Google
              </button>
            </div>
            <div className="mt-6 pt-6 border-t border-[#08090C]/10">
              <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="text-xs font-bold text-[#1F4E79] hover:text-white transition-all underline decoration-1 underline-offset-4">
                {authMode === 'login' ? 'First time here? Create an account' : 'Already brewing with us? Sign in'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AESTHETIC SUCCESS MODAL */}
      {successModal.isOpen && (
        <div className="fixed inset-0 z-[2500] flex items-center justify-center px-4 overflow-hidden">
          <div className="absolute inset-0 bg-black/10 transition-opacity duration-1000" onClick={() => setSuccessModal({ isOpen: false })} />

          <div className="relative bg-[#08090C] border border-[#08090C]/10 rounded-3xl p-10 md:p-14 max-w-md w-full text-center shadow-[0_20px_60px_-15px_rgba(126,106,147,0.15)] animate-in slide-in-from-bottom-12 fade-in duration-1000">
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-[#08090C] p-3 rounded-full border border-[#08090C]/5 shadow-sm">
              <Sparkles size={24} className="text-[#D4A42F]" />
            </div>
            <div className="relative z-10 pt-2 flex flex-col items-center">
              <img src="/thank_you_mascots.png" alt="Yay! Thank you" className="w-48 h-48 object-contain mb-4" style={{ filter: "drop-shadow(0 15px 25px rgba(31, 78, 121, 0.25)) drop-shadow(0 5px 15px rgba(212, 164, 47, 0.25))" }} />
              <p className="text-[10px] font-bold text-[#D4A42F] uppercase tracking-[0.3em] mb-2">Kolkaa Designs</p>
              <h2 className="text-3xl md:text-4xl font-serif font-extrabold text-white leading-snug mb-3">{successModal.title}</h2>
              <p className="text-sm text-[#1F4E79] max-w-xs mx-auto mb-6">{successModal.message}</p>
              <div className="w-16 h-[2px] bg-[#D4A42F]/40 mx-auto mb-8" />
              <button onClick={() => setSuccessModal({ isOpen: false })} className="group flex items-center justify-center gap-2 mx-auto w-10 h-10 bg-[#11131a] hover:bg-[#08090C] rounded-full transition-all duration-300">
                <X size={16} className="text-gray-400 group-hover:text-white transition-colors" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN IMAGE ZOOM MODAL */}
      {zoomedImage && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center px-4" onClick={() => setZoomedImage(null)}>
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm transition-opacity duration-300" />
          <button onClick={() => setZoomedImage(null)} className="absolute top-6 right-6 p-3 rounded-full bg-[#08090C]/10 hover:bg-[#08090C]/20 text-white transition-all z-10"><X size={24} /></button>
          <img src={zoomedImage} alt="Fullscreen product preview" className="relative max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300" />
        </div>
      )}
    </div>
  );
}


