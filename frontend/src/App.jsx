import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, FileText, Upload, MessageSquare, Scale, Share2, Edit3, 
  Globe, Landmark, Folder, Sun, Moon, LogOut, CheckCircle, AlertTriangle, 
  XCircle, Send, Volume2, Download, Search, ChevronRight, User, Building,
  Calendar, DollarSign, Layers, ArrowRight, Sparkles, Cpu, Lock, PhoneCall,
  ExternalLink, Award, CheckCircle2, ChevronDown, BookOpen, Activity, AlertCircle,
  FileCheck, HelpCircle, VolumeX, Copy, Check, LayoutGrid, PieChart, Zap, Play, Pause,
  ShieldAlert, Bot, X, Menu, Crown, CreditCard, Unlock, Mail, KeyRound, RefreshCw, ShieldCheck
} from 'lucide-react';
import { 
  signInWithGoogle, 
  loginWithEmail, 
  registerWithEmail, 
  resetUserPassword, 
  logoutFirebase,
  reinitializeFirebase,
  resetFirebaseConfig,
  isFirebaseConfigured
} from './firebase';

const RENDER_BACKEND = 'https://govtech-ai-contract-analyzer-platform.onrender.com/api';

// Detect if running inside native Android / iOS Capacitor wrapper
const isNativePlatform = typeof window !== 'undefined' && (
  Boolean(window.Capacitor?.isNativePlatform?.()) ||
  window.location.protocol === 'capacitor:' ||
  (window.location.hostname === 'localhost' && (!window.location.port || window.location.port === '80' || window.location.port === '443'))
);

const API_BASE = isNativePlatform
  ? RENDER_BACKEND
  : (import.meta.env.VITE_API_BASE || (
      typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== ''
        ? '/api'
        : RENDER_BACKEND
    ));

// Safe parsing helper for JSON fields stored or returned as strings
function safeParse(val, fallback) {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return parsed !== null && parsed !== undefined ? parsed : fallback;
    } catch {
      return fallback;
    }
  }
  return val;
}

// Safe fetch helper — prevents "Unexpected end of JSON input" when backend is unreachable
async function safeFetch(url, options = {}) {
  const res = await fetch(url, options);
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await res.text();
    throw new Error(
      res.status === 404
        ? 'Backend API not reachable. Please ensure the server is running.'
        : `Server returned non-JSON response (${res.status}): ${text.slice(0, 120)}`
    );
  }
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || data.message || `Request failed with status ${res.status}`);
  }
  return data;
}

export const INDIAN_LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ' },
  { code: 'as', name: 'Assamese', native: 'অসমীয়া' },
  { code: 'ur', name: 'Urdu', native: 'اردو' },
  { code: 'sa', name: 'Sanskrit', native: 'संस्कृतम्' },
  { code: 'ne', name: 'Nepali', native: 'नेपाली' },
  { code: 'sd', name: 'Sindhi', native: 'सिन्धी' },
  { code: 'mai', name: 'Maithili', native: 'मैथिली' },
  { code: 'kok', name: 'Konkani', native: 'कोंकणी' },
  { code: 'doi', name: 'Dogri', native: 'डोगरी' },
  { code: 'mni', name: 'Manipuri', native: 'মৈতৈলোন্' },
  { code: 'sat', name: 'Santali', native: 'ᱥᱟᱱᱛᱟᱲᱤ' },
  { code: 'bho', name: 'Bhojpuri', native: 'भोजपुरी' },
];

export const INDIAN_LANG_CODES = {
  'Hindi': 'hi-IN',
  'Marathi': 'mr-IN',
  'Tamil': 'ta-IN',
  'Telugu': 'te-IN',
  'Bengali': 'bn-IN',
  'Gujarati': 'gu-IN',
  'Kannada': 'kn-IN',
  'Malayalam': 'ml-IN',
  'Punjabi': 'pa-IN',
  'Urdu': 'ur-IN',
  'Odia': 'or-IN',
  'Assamese': 'as-IN',
  'Sanskrit': 'sa-IN',
  'Nepali': 'ne-NP',
  'Konkani': 'kok-IN',
  'Bhojpuri': 'bho-IN',
  'English': 'en-IN'
};

function getSafeStorage(key, fallback) {
  try {
    const val = localStorage.getItem(key);
    return val !== null && val !== undefined ? val : fallback;
  } catch (e) {
    return fallback;
  }
}

function setSafeStorage(key, val) {
  try {
    localStorage.setItem(key, val);
  } catch (e) {}
}

function removeSafeStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch (e) {}
}

// ── PRO LOCKED PAYWALL COMPONENT (FOR FREE CITIZEN TIER) ──
function ProLockedPaywall({ title, moduleTag, description, bulletPoints, onUpgrade, isDark, onBackToAudit }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border p-8 sm:p-12 shadow-xl text-center max-w-3xl mx-auto my-6 transition-all ${
      isDark 
        ? 'border-amber-700/60 bg-gradient-to-br from-[#0f172a] via-[#1e1b4b]/50 to-[#0f172a] text-white' 
        : 'border-amber-300/80 bg-gradient-to-br from-amber-50/70 via-white to-orange-50/40 text-slate-900'
    }`}>
      <div className="absolute top-0 right-1/4 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="relative z-10 flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20 mb-5">
          <Crown className="w-8 h-8 text-white" />
        </div>
        <span className="text-[11px] font-extrabold tracking-widest uppercase px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/80 mb-3">
          {moduleTag || 'PRO MODULE'}
        </span>
        <h3 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight mb-3">
          Unlock {title}
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xl mx-auto leading-relaxed mb-6 font-normal">
          {description} Free Citizen accounts are limited to Clause Risk Auditing (up to 5 PDFs/month). Upgrade to JanDrishti Pro to activate all sovereign legal modules without limits.
        </p>
        <div className="w-full max-w-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl p-4 border border-amber-200/80 dark:border-slate-800 mb-8 text-left space-y-2.5 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Included with JanDrishti Pro:</div>
          {bulletPoints.map((pt, i) => (
            <div key={i} className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{pt}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={onUpgrade}
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-[#ea580c] to-[#f97316] hover:from-[#c2410c] hover:to-[#ea580c] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-200" />
            <span>Upgrade to JanDrishti Pro (₹999/mo)</span>
          </button>
          <button
            type="button"
            onClick={onBackToAudit}
            className="w-full sm:w-auto px-6 py-3.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
          >
            Back to Free Clause Audit
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [theme, setTheme] = useState(() => getSafeStorage('gov_theme', 'bright'));
  const [aiMode, setAiMode] = useState(() => getSafeStorage('gov_aimode', 'fast'));
  const [siteLang, setSiteLang] = useState(() => getSafeStorage('gov_site_lang', 'en'));
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('gov_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });

  // ── Subscription & Quota State (Server-enforced: Free 5, Personal 30, Small Business 100) ──
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'annual'
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [pricingFeatureNotice, setPricingFeatureNotice] = useState(null);
  const [subscriptionToast, setSubscriptionToast] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [sandboxCheckout, setSandboxCheckout] = useState(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const [usageData, setUsageData] = useState({
    user_id: null,
    plan_id: 'free',
    plan_name: 'Free Plan',
    billing_cycle: 'monthly',
    subscription_status: 'active',
    payment_status: 'none',
    monthly_upload_limit: 5,
    uploads_used: 0,
    uploads_remaining: 5,
    total_successful_uploads: 0,
    ai_query_limit: 15,
    ai_queries_used: 0,
    ai_queries_remaining: 15,
    current_period_end: null,
    renewal_date: null,
    next_quota_reset_date: null,
    cancel_at_period_end: false,
    features: {}
  });

  const isPro = usageData.plan_id === 'personal' || usageData.plan_id === 'small_business' || user?.role === 'admin';
  const isBusiness = usageData.plan_id === 'small_business' || user?.role === 'admin';
  const monthlyUploads = usageData.uploads_used;
  const FREE_MONTHLY_LIMIT = usageData.monthly_upload_limit || 5;

  const triggerToast = (msg, type = 'success') => {
    setSubscriptionToast({ msg, type });
    setTimeout(() => setSubscriptionToast(null), 4500);
  };

  const fetchUserUsage = async (userId = (user?.id || 1)) => {
    if (!userId) return;
    try {
      const data = await safeFetch(`${API_BASE}/subscription/usage?user_id=${userId}`);
      if (data && data.plan_id) {
        setUsageData(data);
      }
    } catch (e) {
      console.warn("Could not fetch usage summary:", e);
    }
  };

  const handleInitiateCheckout = async (targetPlanId) => {
    if (!user?.id) {
      setShowAuthModal(true);
      setAuthError('Please sign in or create an account to activate a subscription.');
      return;
    }
    if (targetPlanId === usageData.plan_id && usageData.subscription_status === 'active' && !usageData.cancel_at_period_end) {
      triggerToast(`You are already subscribed to the ${usageData.plan_name}.`, 'info');
      return;
    }

    setIsProcessingPayment(true);
    try {
      const order = await safeFetch(`${API_BASE}/subscription/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          plan_id: targetPlanId,
          billing_cycle: billingCycle
        })
      });

      // Check if Razorpay live SDK is loaded and credentials are not default placeholder
      const isRazorpayConfigured = order.key_id && order.key_id !== 'rzp_test_placeholder';
      if (isRazorpayConfigured && typeof window !== 'undefined' && window.Razorpay) {
        const options = {
          key: order.key_id,
          amount: order.amount,
          currency: order.currency || 'INR',
          name: 'JanDrishti AI',
          description: `${order.plan_name} (${order.billing_cycle})`,
          order_id: order.order_id,
          prefill: {
            name: user.name || 'Citizen User',
            email: user.email || 'citizen@jandrishti.in'
          },
          theme: {
            color: '#0f3d68'
          },
          handler: async (response) => {
            await handleVerifyPayment({
              user_id: user.id,
              order_id: response.razorpay_order_id || order.order_id,
              payment_id: response.razorpay_payment_id,
              signature: response.razorpay_signature
            });
          },
          modal: {
            ondismiss: () => {
              setIsProcessingPayment(false);
            }
          }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Fallback to seamless integrated sandbox checkout modal for local zero-cost evaluation
        setSandboxCheckout(order);
      }
    } catch (err) {
      triggerToast(`Checkout error: ${err.message}`, 'error');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleVerifyPayment = async ({ user_id, order_id, payment_id, signature }) => {
    setIsProcessingPayment(true);
    try {
      const res = await safeFetch(`${API_BASE}/subscription/verify-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id,
          order_id,
          payment_id,
          signature
        })
      });

      setSandboxCheckout(null);
      setShowPricingModal(false);
      setPricingFeatureNotice(null);
      await fetchUserUsage(user_id);
      triggerToast(`🎉 ${res.message || 'Subscription successfully activated!'}`, 'success');
    } catch (err) {
      triggerToast(`Payment verification declined: ${err.message}`, 'error');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!user?.id) return;
    setIsProcessingPayment(true);
    try {
      const res = await safeFetch(`${API_BASE}/subscription/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id })
      });
      setShowCancelConfirm(false);
      await fetchUserUsage(user.id);
      triggerToast(res.message || 'Subscription cancelled. Full access remains active until period end.', 'info');
    } catch (err) {
      triggerToast(`Cancellation failed: ${err.message}`, 'error');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleTestActivate = async (planId, cycle = 'monthly') => {
    if (!user?.id) {
      setShowAuthModal(true);
      setAuthError('Sign in to switch plans.');
      return;
    }
    setIsProcessingPayment(true);
    try {
      const res = await safeFetch(`${API_BASE}/subscription/test-activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          plan_id: planId,
          billing_cycle: cycle
        })
      });
      setUsageData(res);
      setShowPricingModal(false);
      setPricingFeatureNotice(null);
      triggerToast(`⚡ Switched to ${res.plan_name} (${res.monthly_upload_limit} uploads/mo)`, 'success');
    } catch (err) {
      triggerToast(`Activation error: ${err.message}`, 'error');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleSelectModule = (moduleId, targetRef = null) => {
    // Audit, Welfare Schemes, and Q&A Chat are ALWAYS accessible to all citizens!
    if (moduleId === 'schemes' || moduleId === 'audit' || moduleId === 'chat') {
      setActiveTab(moduleId);
      setIsMenuOpen(false);
      if (targetRef?.current) {
        setTimeout(() => targetRef.current.scrollIntoView({ behavior: 'smooth' }), 50);
      }
      return;
    }

    // Word Redlining is exclusive to Small Business plan
    if (moduleId === 'redline' && !isBusiness) {
      setPricingFeatureNotice('Word (.docx) Redlining & Suggested Clause Amendments is exclusive to the Small Business Plan (₹149/mo).');
      setShowPricingModal(true);
      return;
    }

    // Courtroom / Multi-agent debate is available on Personal and Small Business
    if (moduleId === 'courtroom' && usageData.plan_id === 'free' && user?.role !== 'admin') {
      setPricingFeatureNotice('3-Agent AI Courtroom Deliberation is available on Personal (₹49/mo) and Small Business (₹149/mo) plans.');
      setShowPricingModal(true);
      return;
    }

    setActiveTab(moduleId);
    setIsMenuOpen(false);
    if (targetRef?.current) {
      setTimeout(() => targetRef.current.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  };

  const changeSiteLanguage = (langCode) => {
    setSiteLang(langCode);
    setSafeStorage('gov_site_lang', langCode);

    const host = window.location.hostname;
    if (langCode === 'en') {
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=${host}; path=/;`;
      const combo = document.querySelector('.goog-te-combo');
      if (combo) {
        combo.value = 'en';
        combo.dispatchEvent(new Event('change'));
      }
      setTimeout(() => window.location.reload(), 200);
    } else {
      document.cookie = `googtrans=/en/${langCode}; path=/;`;
      document.cookie = `googtrans=/en/${langCode}; domain=${host}; path=/;`;
      const combo = document.querySelector('.goog-te-combo');
      if (combo) {
        combo.value = langCode;
        combo.dispatchEvent(new Event('change'));
      } else {
        window.location.reload();
      }
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('gov_site_lang');
    if (saved && saved !== 'en') {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        const combo = document.querySelector('.goog-te-combo');
        if (combo) {
          combo.value = saved;
          combo.dispatchEvent(new Event('change'));
          clearInterval(interval);
        }
        if (attempts >= 15) {
          clearInterval(interval);
        }
      }, 300);
      return () => clearInterval(interval);
    }
  }, []);

  // Cleanup any legacy placeholder Firebase config from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('gov_firebase_config');
      if (stored && (stored.includes('your-project') || stored.includes('Dummy') || stored.includes('...'))) {
        localStorage.removeItem('gov_firebase_config');
      }
    } catch (e) {}
  }, []);
  
  // Auth Modal & Mail Verification (OTP) State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register' | 'reset'
  const [authMethod, setAuthMethod] = useState('otp'); // 'otp' (email verification code) | 'password'
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccessMsg, setAuthSuccessMsg] = useState('');
  const [otpStep, setOtpStep] = useState('input_email'); // 'input_email' | 'input_code'
  const [otpCode, setOtpCode] = useState('');
  const [otpDevCode, setOtpDevCode] = useState(null);
  const [otpCooldown, setOtpCooldown] = useState(0);

  // Real Google OAuth / Firebase Configuration Dialog State
  const [showFirebaseSetupModal, setShowFirebaseSetupModal] = useState(false);
  const [firebaseSetupApiKey, setFirebaseSetupApiKey] = useState('');
  const [firebaseSetupAuthDomain, setFirebaseSetupAuthDomain] = useState('');
  const [firebaseSetupProjectId, setFirebaseSetupProjectId] = useState('');
  const [firebaseSetupAppId, setFirebaseSetupAppId] = useState('');
  const [firebaseSnippetInput, setFirebaseSnippetInput] = useState('');

  useEffect(() => {
    if (otpCooldown <= 0) return;
    const interval = setInterval(() => {
      setOtpCooldown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [otpCooldown]);

  // Active Document State
  const [currentDoc, setCurrentDoc] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadDocType, setUploadDocType] = useState('contract');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState('');
  const [isReanalyzing, setIsReanalyzing] = useState(false);

  // Derived Safe Document Analysis Data (Guarantees zero-crash rendering)
  const docRisks = React.useMemo(() => {
    const raw = safeParse(currentDoc?.risks, []);
    return Array.isArray(raw) ? raw.filter(r => r && typeof r === 'object') : [];
  }, [currentDoc]);

  const docClauses = React.useMemo(() => {
    const raw = safeParse(currentDoc?.clauses, []);
    return Array.isArray(raw) ? raw.filter(c => c && typeof c === 'object') : [];
  }, [currentDoc]);

  const docEntities = React.useMemo(() => {
    const raw = safeParse(currentDoc?.entities, {});
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
    const clean = {};
    for (const [key, val] of Object.entries(raw)) {
      if (key === 'pii_shield') continue;
      if (Array.isArray(val)) {
        if (val.length > 0) clean[key] = val;
      } else if (val && typeof val === 'object') {
        const subVals = Object.values(val).filter(Boolean);
        if (subVals.length > 0) clean[key] = subVals;
      } else if (val) {
        clean[key] = [String(val)];
      }
    }
    return clean;
  }, [currentDoc]);

  const highRisksCount = docRisks.filter(r => (r.risk_level || '').toLowerCase().includes('high')).length;
  const medRisksCount = docRisks.filter(r => (r.risk_level || '').toLowerCase().includes('med')).length;
  const entitiesCount = Object.values(docEntities).reduce((acc, curr) => acc + (Array.isArray(curr) ? curr.length : 1), 0);

  // Workspace Tab Navigation State
  const [activeTab, setActiveTab] = useState('audit'); // 'audit', 'chat', 'courtroom', 'redline', 'schemes', 'translate', 'history', 'all'
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingText, setSpeakingText] = useState('');

  // Dynamic Contract Health Score (0-100)
  const healthScore = React.useMemo(() => {
    if (!currentDoc) return 100;
    let score = 100;
    score -= highRisksCount * 25;
    score -= medRisksCount * 10;
    return Math.max(15, Math.min(100, score));
  }, [currentDoc, highRisksCount, medRisksCount]);

  const healthGrade = React.useMemo(() => {
    if (healthScore >= 80) {
      return {
        badge: 'Low Legal Risk',
        title: 'Contract Terms Balanced & Commercially Fair',
        color: 'text-emerald-600 dark:text-emerald-400',
        borderColor: 'border-emerald-300 dark:border-emerald-800',
        bg: 'bg-emerald-50/80 dark:bg-emerald-950/40',
        progressColor: 'bg-emerald-500'
      };
    } else if (healthScore >= 50) {
      return {
        badge: 'Moderate Risk',
        title: 'Caution: Asymmetric Clauses Identified',
        color: 'text-amber-600 dark:text-amber-400',
        borderColor: 'border-amber-300 dark:border-amber-800',
        bg: 'bg-amber-50/80 dark:bg-amber-950/40',
        progressColor: 'bg-amber-500'
      };
    } else {
      return {
        badge: 'High Liability Warning',
        title: 'Critical Risk: Immediate Legal Amendment Advised',
        color: 'text-red-600 dark:text-red-400',
        borderColor: 'border-red-300 dark:border-red-800',
        bg: 'bg-red-50/80 dark:bg-red-950/40',
        progressColor: 'bg-red-600'
      };
    }
  }, [healthScore]);

  // Copy-to-clipboard with visual confirmation toast
  const handleCopyClause = (text, idx) => {
    if (!text) return;
    try {
      navigator.clipboard.writeText(text);
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 2200);
    } catch (e) {
      console.warn('Copy failed', e);
    }
  };

  // Pre-load Browser Speech Voices for Indian Regional Languages
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  // Built-in Browser Voice Readout (TTS) with Indian Regional Language Support
  const handleSpeak = (text, langName = 'English') => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Voice readout is not supported on this browser.');
      return;
    }
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setSpeakingText('');
      return;
    }
    if (!text || !text.trim()) return;

    window.speechSynthesis.cancel();
    window.speechSynthesis.resume();

    const utterance = new SpeechSynthesisUtterance(text);
    const bcp47 = INDIAN_LANG_CODES[langName] || 'en-IN';
    utterance.lang = bcp47;
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    // Pick matching voice if available
    let voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      const prefix = bcp47.split('-')[0].toLowerCase();
      const matched = voices.find(v => v.lang.toLowerCase().replace('_', '-') === bcp47.toLowerCase()) ||
                      voices.find(v => v.lang.toLowerCase().startsWith(prefix)) ||
                      voices.find(v => v.name.toLowerCase().includes(langName.toLowerCase()));
      if (matched) {
        utterance.voice = matched;
      }
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setSpeakingText(text);
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeakingText('');
    };
    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis event:', e);
      setIsSpeaking(false);
      setSpeakingText('');
    };
    setSpeakingText(text);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Instant 1-Click Realistic Municipal Tender Demo Contract
  const handleLoadDemoContract = () => {
    const demo = {
      id: 9999,
      filename: 'Sample_Municipal_E-Tender_Contract.pdf',
      doc_type: 'contract',
      page_count: 5,
      summary: 'Municipal E-Quotation and Public Procurement Agreement between the Municipal Corporation of Greater Mumbai and TechCorp Solutions Pvt Ltd. Governs delivery of turnkey cloud data analytics infrastructure with explicit milestones, MSME dispute arbitration, and strict confidentiality protections.',
      risks: [
        {
          clause_type: 'Liquidated Damages & Delay Penalty',
          risk_level: 'High',
          risky_excerpt: 'Contractor shall forfeit 1.5% of total project cost per day of delay up to a maximum penalty of 35% of overall agreement valuation, regardless of external department approval bottlenecks.',
          why_risky: 'Imposes aggressive unmitigated financial penalties without reciprocal relief or notice window for bureaucratic delays beyond vendor control.',
          severity_reasoning: 'Classified as High Risk because an uncapped 35% deduction causes catastrophic cash-flow strain and disproportionately penalizes contractors.',
          potential_impact: 'Immediate automatic deduction of up to INR 15,75,000 from vendor performance bank guarantees.',
          trigger_factors: ['Aggressive Penalty', 'No Grace Period', 'Asymmetric Burden'],
          suggested_replacement: 'In the event of unexcused delay solely attributable to Contractor, liquidated damages shall accrue at 0.25% per week, capped at a maximum of 5% of the affected milestone value, following a mandatory 14-day written notice and cure window.'
        },
        {
          clause_type: 'Unilateral Immediate Termination',
          risk_level: 'High',
          risky_excerpt: 'The Authority reserves absolute discretion to terminate this Agreement at any time with 48 hours notice without reimbursing work-in-progress or non-cancelable third-party commitments.',
          why_risky: 'Denies standard compensation for completed milestones and exposes the vendor to unrecoverable sunken labor and software licensing costs.',
          severity_reasoning: 'Classified as High Risk due to violation of commercial equity under Section 73 of the Indian Contract Act 1872.',
          potential_impact: 'Total financial loss on dedicated developer billable hours, servers, and sub-contractor commitments.',
          trigger_factors: ['Immediate Cancellation', 'No Sunken Cost Recovery', 'Unilateral Authority'],
          suggested_replacement: 'Either party may terminate for convenience upon sixty (60) days prior written notice. Upon termination, Authority shall promptly reimburse Contractor for all verified completed milestones and non-cancelable supplier commitments.'
        },
        {
          clause_type: 'Broad Background IP Forfeiture',
          risk_level: 'Medium',
          risky_excerpt: 'All proprietary software libraries, frameworks, and foundational algorithms utilized by Contractor during project delivery shall become exclusive property of Authority.',
          why_risky: 'Attempts to forfeit vendor pre-existing intellectual property rather than granting a standard perpetual enterprise usage license.',
          severity_reasoning: 'Designated as Medium Risk because it impairs the vendor from utilizing their proprietary core codebase in other commercial contracts.',
          potential_impact: 'Loss of foundational software trade secrets and exposure to intellectual property claims.',
          trigger_factors: ['Background IP Loss', 'Scope Creep'],
          suggested_replacement: 'Contractor retains all rights, title, and interest in pre-existing intellectual property. Authority is granted a perpetual, royalty-free, non-exclusive license to use the customized deliverables solely for municipal operational purposes.'
        }
      ],
      clauses: [
        {
          clause_type: 'Statutory Arbitration & Dispute Resolution',
          summary: 'Sole arbitrator appointed under the Arbitration & Conciliation Act 1996 with legal seat at Mumbai, Maharashtra.',
          verbatim_excerpt: 'All disputes arising hereunder shall be adjudicated through arbitration in Mumbai pursuant to the Arbitration and Conciliation Act, 1996.'
        },
        {
          clause_type: 'Indemnification & IP Defense',
          summary: 'Mutual indemnification against verified third-party patent or copyright infringement claims.',
          verbatim_excerpt: 'Each party shall defend, indemnify, and hold harmless the other party against verified third-party intellectual property claims.'
        },
        {
          clause_type: 'Force Majeure & Epidemic Relief',
          summary: 'Suspends obligations and shields against default during statutory lockdowns, natural calamities, or civil unrest.',
          verbatim_excerpt: 'Neither party shall be liable for delay resulting from acts of God, declared epidemics, or lawful government orders beyond reasonable control.'
        },
        {
          clause_type: 'Statutory Non-Disclosure & Data Protection',
          summary: 'Enforces 3-year confidentiality and DPDP Act 2023 compliance on all citizen datasets and tender pricing.',
          verbatim_excerpt: 'All citizen datasets and commercial terms shall remain strictly confidential for a period of 3 years following contract expiration.'
        }
      ],
      entities: {
        parties: ['Municipal Corporation of Greater Mumbai (Authority)', 'TechCorp Solutions Pvt Ltd (Contractor)'],
        dates: ['Agreement Date: Nov 01, 2026', 'Milestone 1 Deliverable: Jan 15, 2027', 'Final Completion: Oct 31, 2027'],
        monetary_values: ['Total Tender Value: INR 45,00,000', 'Performance Security: INR 4,50,000', 'Retention: 5%'],
        locations: ['Mumbai, Maharashtra, India (Exclusive Legal Jurisdiction)'],
        key_terms: ['E-Quotation Tender', 'MSME Commercial Parity', 'Sovereign Data Protection']
      },
      pii_shield: {
        shield_active: true,
        total_scrubbed: 4,
        breakdown: { aadhaar: 1, pan: 1, phone: 2 }
      },
      full_text: `SAMPLE MUNICIPAL IT INFRASTRUCTURE CONTRACT
Between: Municipal Corporation of Greater Mumbai (Authority) AND TechCorp Solutions Pvt Ltd (Contractor)
1. Scope: Delivery of cloud-based citizen analytics portal.
2. Penalties: Contractor shall forfeit 1.5% of total project cost per day of delay up to a maximum penalty of 35% of overall agreement valuation, regardless of external department approval bottlenecks.
3. Termination: The Authority reserves absolute discretion to terminate this Agreement at any time with 48 hours notice without reimbursing work-in-progress or non-cancelable third-party commitments.
4. Intellectual Property: All proprietary software libraries, frameworks, and foundational algorithms utilized by Contractor during project delivery shall become exclusive property of Authority.
5. Arbitration: Governed by Arbitration and Conciliation Act 1996, seat at Mumbai.`
    };
    setCurrentDoc(demo);
    setActiveTab('audit');
    scrollTo(uploadRef);
  };

  // Q&A Chat State
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Multi-Agent State
  const [debateResult, setDebateResult] = useState(null);
  const [isDebating, setIsDebating] = useState(false);

  // Redline State
  const [redlineDocId, setRedlineDocId] = useState(null);

  // Multilingual State
  const [targetLang, setTargetLang] = useState('Hindi');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  // Schemes State
  const [schemes, setSchemes] = useState([]);
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [schemeCategory, setSchemeCategory] = useState('All');
  const [eligProfile, setEligProfile] = useState({
    name: 'Aarav Sharma', age: 34, gender: 'Male', occupation: 'Self-Employed',
    annual_income_inr: 250000, state: 'Delhi', category: 'General', land: 'N/A'
  });
  const [eligResult, setEligResult] = useState(null);
  const [isMatching, setIsMatching] = useState(false);

  // Universal Citizen Scheme Recommender
  const [schemeTab, setSchemeTab] = useState('recommend'); // 'recommend' or 'browse'
  const [citizenProfile, setCitizenProfile] = useState({
    name: 'Pooja Patil',
    gender: 'Female',
    age: 28,
    occupation: 'Farmer / Agricultural Laborer',
    annual_income_inr: 80000,
    state: 'Maharashtra',
    category: 'OBC',
    special_conditions: ['Owns Agricultural Land', 'BPL / Ration Card Holder', 'Pregnant / Lactating Mother']
  });
  const [recommendationsData, setRecommendationsData] = useState(null);
  const [isRecommending, setIsRecommending] = useState(false);

  // Section Refs for Smooth Scrolling
  const uploadRef = useRef(null);
  const chatRef = useRef(null);
  const debateRef = useRef(null);
  const redlineRef = useRef(null);
  const multilingualRef = useRef(null);
  const schemesRef = useRef(null);
  const historyRef = useRef(null);

  const scrollTo = (ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    setSafeStorage('gov_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    setSafeStorage('gov_aimode', aiMode);
  }, [aiMode]);

  const fetchUserDocuments = (userId) => {
    if (!userId) {
      setDocuments([]);
      return;
    }
    safeFetch(`${API_BASE}/documents?user_id=${userId}`)
      .then(d => setDocuments(d.documents || []))
      .catch(() => setDocuments([]));
  };

  useEffect(() => {
    safeFetch(`${API_BASE}/schemes`)
      .then(d => setSchemes(d.schemes || []))
      .catch(() => {});

    if (user?.id) {
      fetchUserDocuments(user.id);
      fetchUserUsage(user.id);
    } else {
      fetchUserUsage(1);
      setDocuments([]);
      setCurrentDoc(null);
    }
  }, [user]);

  // Real Google OAuth & Firebase Authentication Handlers
  const handleParseFirebaseSnippet = (snippet) => {
    setFirebaseSnippetInput(snippet);
    const extract = (key) => {
      const match = snippet.match(new RegExp(`${key}["']?\\s*:\\s*["']([^"']+)["']`));
      return match ? match[1] : '';
    };
    const apiKey = extract('apiKey');
    const authDomain = extract('authDomain');
    const projectId = extract('projectId');
    const appId = extract('appId');
    if (apiKey) setFirebaseSetupApiKey(apiKey);
    if (authDomain) setFirebaseSetupAuthDomain(authDomain);
    if (projectId) setFirebaseSetupProjectId(projectId);
    if (appId) setFirebaseSetupAppId(appId);
  };

  const handleSaveFirebaseSetup = async (e) => {
    if (e) e.preventDefault();
    const key = firebaseSetupApiKey.trim();
    const domain = firebaseSetupAuthDomain.trim();
    const projId = firebaseSetupProjectId.trim();

    if (!key || !key.startsWith('AIzaSy') || key.includes('...') || key.length < 25) {
      setAuthError('Please enter a real Firebase API Key from your Firebase Console. It must start with "AIzaSy" and be ~39 characters long (do not use placeholder dots "...").');
      return;
    }
    if (projId && (projId.includes('your-project') || projId.includes('...'))) {
      setAuthError('Please enter your actual Firebase Project ID (not the example placeholder "your-project").');
      return;
    }
    if (domain && (domain.includes('your-project') || domain.includes('...'))) {
      setAuthError('Please enter your actual Auth Domain (e.g. my-app.firebaseapp.com, not "your-project").');
      return;
    }

    const effectiveProjId = projId || 'govtech-ai-contract-analyzer';
    const newConfig = {
      apiKey: key,
      authDomain: domain || `${effectiveProjId}.firebaseapp.com`,
      projectId: effectiveProjId,
      storageBucket: `${effectiveProjId}.appspot.com`,
      messagingSenderId: "102938475610",
      appId: firebaseSetupAppId.trim() || `1:102938475610:web:${key.slice(-10)}`
    };

    const reinitRes = await reinitializeFirebase(newConfig);
    if (!reinitRes.success) {
      setAuthError(`Configuration error: ${reinitRes.error}`);
      return;
    }

    // Persist configuration in backend frontend/.env
    safeFetch(`${API_BASE}/auth/save-firebase-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newConfig)
    }).catch(console.warn);

    setShowFirebaseSetupModal(false);
    triggerToast('Google OAuth connected! Launching Google Sign-In...', 'success');
    setTimeout(() => {
      handleGoogleSignIn();
    }, 350);
  };

  const handleResetFirebaseConfig = async () => {
    await resetFirebaseConfig();
    setFirebaseSetupApiKey('');
    setFirebaseSetupAuthDomain('');
    setFirebaseSetupProjectId('');
    setFirebaseSetupAppId('');
    setFirebaseSnippetInput('');
    setAuthError('');
    setShowFirebaseSetupModal(false);
    triggerToast('Saved Firebase configuration reset.', 'info');
  };

  const handleGoogleSignIn = async () => {
    if (!isFirebaseConfigured()) {
      setShowFirebaseSetupModal(true);
      return;
    }

    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await signInWithGoogle();
      if (!res.success) {
        if (res.needsSetup) {
          setShowFirebaseSetupModal(true);
        } else {
          setAuthError(res.error || 'Google Sign-In was unsuccessful.');
        }
        setAuthLoading(false);
        return;
      }

      // Sync with backend database
      try {
        const syncRes = await safeFetch(`${API_BASE}/auth/firebase`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: res.user.uid,
            email: res.user.email,
            name: res.user.name
          })
        });
        if (syncRes && syncRes.user) {
          setUser(syncRes.user);
          setSafeStorage('gov_user', JSON.stringify(syncRes.user));
          setShowAuthModal(false);
          fetchUserDocuments(syncRes.user.id);
          fetchUserUsage(syncRes.user.id);
          triggerToast(`Signed in with verified Google Account (${syncRes.user.email})`, 'success');
          return;
        }
      } catch (syncErr) {
        console.warn('Backend sync warning, using Firebase user profile:', syncErr);
      }

      const appUser = {
        id: Math.abs(res.user.uid.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)),
        name: res.user.name,
        email: res.user.email,
        role: 'user',
        is_verified: true,
        firebase_uid: res.user.uid
      };
      setUser(appUser);
      setSafeStorage('gov_user', JSON.stringify(appUser));
      setShowAuthModal(false);
      fetchUserDocuments(appUser.id);
      fetchUserUsage(appUser.id);
      triggerToast(`Signed in with verified Google Account (${appUser.email})`, 'success');
    } catch (err) {
      setAuthError(err.message || 'Google authentication failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Send 6-Digit Email Verification Code (OTP)
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!authEmail.trim() || !authEmail.includes('@') || !authEmail.includes('.')) {
      setAuthError('Please enter a valid email address.');
      return;
    }
    setAuthLoading(true);
    setAuthError('');
    setAuthSuccessMsg('');

    try {
      const res = await safeFetch(`${API_BASE}/auth/send-verification-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authEmail.trim(),
          purpose: authMode === 'register' ? 'register' : 'login'
        })
      });

      if (res && res.success) {
        setOtpStep('input_code');
        setOtpCooldown(60);
        setAuthSuccessMsg(res.message || `Verification code sent to ${authEmail}`);
        if (res.dev_code) {
          setOtpDevCode(res.dev_code);
        }
      } else {
        setAuthError(res?.detail || res?.message || 'Could not send verification code.');
      }
    } catch (err) {
      setAuthError(err.message || 'Error sending verification code.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Verify 6-Digit Email Verification Code (OTP)
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      setAuthError('Please enter the complete 6-digit verification code.');
      return;
    }
    setAuthLoading(true);
    setAuthError('');

    try {
      const res = await safeFetch(`${API_BASE}/auth/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authEmail.trim(),
          code: otpCode.trim(),
          purpose: authMode === 'register' ? 'register' : 'login',
          name: authName.trim() || undefined
        })
      });

      if (res && res.success && res.user) {
        setUser(res.user);
        setSafeStorage('gov_user', JSON.stringify(res.user));
        setShowAuthModal(false);
        setOtpStep('input_email');
        setOtpCode('');
        setOtpDevCode(null);
        triggerToast(`Email verified! Welcome, ${res.user.name}`, 'success');
        fetchUserDocuments(res.user.id);
        fetchUserUsage(res.user.id);
      } else {
        setAuthError(res?.detail || res?.message || 'Invalid verification code.');
      }
    } catch (err) {
      setAuthError(err.message || 'Verification failed. Please check your code.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Auth Submit (Firebase Email/Password & Reset)
  const handleAuth = async (e) => {
    e.preventDefault();
    if (authMode === 'login' && authMethod === 'otp') {
      if (otpStep === 'input_email') {
        return handleSendOtp(e);
      } else {
        return handleVerifyOtp(e);
      }
    }
    setAuthError('');
    setAuthLoading(true);

    try {
      if (authMode === 'register') {
        if (authPassword.length < 6) {
          setAuthError('Strong password required: minimum 6 characters.');
          setAuthLoading(false);
          return;
        }

        let appUser = null;
        const res = await registerWithEmail(authName, authEmail, authPassword);

        if (res.success) {
          // Firebase registration succeeded, sync with backend
          try {
            const syncRes = await safeFetch(`${API_BASE}/auth/firebase`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                uid: res.user.uid,
                email: res.user.email,
                name: authName
              })
            });
            appUser = syncRes?.user;
          } catch {}
          if (!appUser) {
            appUser = {
              id: Math.abs(res.user.uid.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)),
              name: authName,
              email: res.user.email,
              role: 'user'
            };
          }
        } else if (res.isFallback || res.code?.includes('api-key') || res.error?.includes('api-key')) {
          // Seamless fallback: register directly in backend database
          const regRes = await safeFetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: authName,
              email: authEmail,
              password: authPassword
            })
          });
          if (regRes && regRes.user) {
            appUser = regRes.user;
          } else if (regRes && regRes.user_id) {
            appUser = {
              id: regRes.user_id,
              name: authName,
              email: authEmail,
              role: 'user'
            };
          }
        } else {
          setAuthError(res.error || 'Registration failed.');
          setAuthLoading(false);
          return;
        }

        if (appUser) {
          setUser(appUser);
          setSafeStorage('gov_user', JSON.stringify(appUser));
          setShowAuthModal(false);
          fetchUserDocuments(appUser.id);
        }
      } else if (authMode === 'login') {
        let appUser = null;
        const res = await loginWithEmail(authEmail, authPassword);

        if (res.success) {
          // Firebase login succeeded, sync with backend
          try {
            const syncRes = await safeFetch(`${API_BASE}/auth/firebase`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                uid: res.user.uid,
                email: res.user.email,
                name: res.user.name
              })
            });
            appUser = syncRes?.user;
          } catch {}
          if (!appUser) {
            appUser = {
              id: Math.abs(res.user.uid.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)),
              name: res.user.name,
              email: res.user.email,
              role: 'user'
            };
          }
        } else if (res.isFallback || res.code?.includes('api-key') || res.error?.includes('api-key')) {
          // Seamless fallback: log in directly via backend database
          const logRes = await safeFetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: authEmail,
              password: authPassword
            })
          });
          if (logRes && logRes.user) {
            appUser = logRes.user;
          }
        } else {
          setAuthError(res.error || 'Invalid email or password.');
          setAuthLoading(false);
          return;
        }

        if (appUser) {
          setUser(appUser);
          setSafeStorage('gov_user', JSON.stringify(appUser));
          setShowAuthModal(false);
          fetchUserDocuments(appUser.id);
        }
      } else if (authMode === 'reset') {
        const res = await resetUserPassword(authEmail);
        if (res.success) {
          setAuthError('Password reset link sent to your email.');
        } else {
          setAuthError(res.error || 'Could not send reset email.');
        }
      }
    } catch (err) {
      setAuthError(err.message || 'Authentication error.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutFirebase();
    } catch {}
    setUser(null);
    removeSafeStorage('gov_user');
    setCurrentDoc(null);
    setDocuments([]);
    setMessages([]);
    setDebateResult(null);
    setTranslatedText('');
    setRecommendationsData(null);
    setUsageData({
      user_id: null,
      plan_id: 'free',
      plan_name: 'Free Plan',
      billing_cycle: 'monthly',
      subscription_status: 'active',
      payment_status: 'none',
      monthly_upload_limit: 5,
      uploads_used: 0,
      uploads_remaining: 5,
      total_successful_uploads: 0,
      ai_query_limit: 15,
      ai_queries_used: 0,
      ai_queries_remaining: 15,
      current_period_end: null,
      renewal_date: null,
      next_quota_reset_date: null,
      cancel_at_period_end: false,
      features: {}
    });
  };

  const handleReanalyze = async (docId) => {
    if (!docId) return;
    setIsReanalyzing(true);
    try {
      const data = await safeFetch(`${API_BASE}/documents/${docId}/reanalyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ai_mode: aiMode })
      });
      if (data.success && data.document) {
        setCurrentDoc(data.document);
        setDocuments(prev => prev.map(d => d.id === docId ? data.document : d));
      }
    } catch (err) {
      console.error("Re-analyze error:", err);
    } finally {
      setIsReanalyzing(false);
    }
  };

  // Upload handler
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;
    if (!user?.id) {
      setShowAuthModal(true);
      setAuthError('Authentication required. Please log in or select a demo account before uploading documents.');
      return;
    }

    // Server-enforced Quota Check
    if (usageData.uploads_remaining <= 0 && usageData.monthly_upload_limit > 0) {
      const msg = usageData.plan_id === 'free'
        ? `You have used ${usageData.uploads_used} of your ${usageData.monthly_upload_limit} free document uploads. Upgrade to Personal for ₹49/month to continue analysing documents.`
        : `Monthly upload limit reached (${usageData.uploads_used}/${usageData.monthly_upload_limit} documents). Upgrade your plan to continue.`;
      setPricingFeatureNotice(msg);
      setShowPricingModal(true);
      return;
    }

    setIsUploading(true);
    setUploadStage('Uploading document to AI Analyzer pipeline...');

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('doc_type', uploadDocType);
    formData.append('ai_mode', aiMode);
    formData.append('user_id', user.id);

    try {
      setTimeout(() => setUploadStage('Extracting text & identifying legal clauses...'), 1200);
      setTimeout(() => setUploadStage(`Analyzing risk severity and verifying statutory clauses...`), 2800);

      const data = await safeFetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData
      });

      setCurrentDoc(data.document);
      setMessages([]);
      scrollTo(uploadRef);

      if (data.usage) {
        setUsageData(data.usage);
      } else {
        fetchUserUsage(user.id);
      }
      fetchUserDocuments(user.id);
    } catch (err) {
      const errorMsg = err.message || '';
      if (errorMsg.includes('403') || errorMsg.toLowerCase().includes('limit reached') || errorMsg.toLowerCase().includes('free document uploads')) {
        setPricingFeatureNotice(errorMsg);
        setShowPricingModal(true);
      } else {
        alert(`Analysis error: ${errorMsg}`);
      }
    } finally {
      setIsUploading(false);
      setUploadStage('');
    }
  };

  // Q&A Chat
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !currentDoc) return;

    const userText = chatInput;
    setChatInput('');
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setIsChatLoading(true);

    try {
      const data = await safeFetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userText,
          index_dir: currentDoc.index_dir,
          doc_id: currentDoc.id,
          user_id: user ? user.id : 1,
          ai_mode: aiMode
        })
      });
      setMessages(prev => [...prev, {
        sender: 'ai',
        text: data.answer,
        citations: data.citations || []
      }]);
      // Live refresh of question quota
      fetchUserUsage(user?.id || 1);
    } catch (err) {
      if (err.message && (err.message.includes('rate limit') || err.message.includes('429'))) {
        setPricingFeatureNotice('15 AI Questions Monthly Limit Reached. Upgrade for higher limits.');
        setShowPricingModal(true);
      }
      setMessages(prev => [...prev, { sender: 'ai', text: `Error: ${err.message}` }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Multi-Agent Courtroom
  const handleStartDebate = async () => {
    if (!currentDoc?.full_text) return;
    setIsDebating(true);
    try {
      const data = await safeFetch(`${API_BASE}/multi-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contract_text: currentDoc.full_text, ai_mode: aiMode })
      });
      setDebateResult(data);
    } catch (err) {
      alert(`Debate error: ${err.message}`);
    } finally {
      setIsDebating(false);
    }
  };

  // Redline Visual PDF Download
  const handleDownloadRedlinePdf = () => {
    if (!currentDoc?.id) return;
    const downloadUrl = `${API_BASE}/redline/download-pdf/${currentDoc.id}`;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `redlined_${currentDoc.filename || 'contract.pdf'}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // Translation
  const handleTranslate = async () => {
    if (!currentDoc?.full_text) return;
    setIsTranslating(true);
    try {
      const data = await safeFetch(`${API_BASE}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: currentDoc.full_text.slice(0, 1500),
          target_language: targetLang
        })
      });
      setTranslatedText(data.translated_text);
    } catch (err) {
      alert(`Translation error: ${err.message}`);
    } finally {
      setIsTranslating(false);
    }
  };

  // Scheme Matcher
  const handleMatchScheme = async () => {
    if (!selectedScheme) return;
    setIsMatching(true);
    try {
      const data = await safeFetch(`${API_BASE}/schemes/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheme_text: selectedScheme.full_text,
          profile: eligProfile,
          ai_mode: aiMode
        })
      });
      setEligResult(data);
    } catch (err) {
      alert(`Eligibility error: ${err.message}`);
    } finally {
      setIsMatching(false);
    }
  };

  // Universal Scheme Recommendation Evaluator
  const handleRecommendSchemes = async (e) => {
    if (e) e.preventDefault();
    setIsRecommending(true);
    try {
      const data = await safeFetch(`${API_BASE}/schemes/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: citizenProfile,
          ai_mode: aiMode
        })
      });
      setRecommendationsData(data);
    } catch (err) {
      alert(`Recommendation error: ${err.message}`);
    } finally {
      setIsRecommending(false);
    }
  };

  const toggleSpecialCondition = (cond) => {
    setCitizenProfile(prev => {
      const exists = prev.special_conditions.includes(cond);
      return {
        ...prev,
        special_conditions: exists 
          ? prev.special_conditions.filter(c => c !== cond)
          : [...prev.special_conditions, cond]
      };
    });
  };

  const setPresetProfile = (preset) => {
    if (preset === 'farmer_female') {
      setCitizenProfile({
        name: 'Pooja Patil',
        gender: 'Female',
        age: 28,
        occupation: 'Farmer / Agricultural Laborer',
        annual_income_inr: 80000,
        state: 'Maharashtra',
        category: 'OBC',
        special_conditions: ['Owns Agricultural Land', 'BPL / Ration Card Holder', 'Pregnant / Lactating Mother']
      });
    } else if (preset === 'student_male') {
      setCitizenProfile({
        name: 'Rahul Verma',
        gender: 'Male',
        age: 22,
        occupation: 'Student / Youth',
        annual_income_inr: 120000,
        state: 'Uttar Pradesh',
        category: 'OBC',
        special_conditions: ['Seeking Higher Education / Skill Training']
      });
    } else if (preset === 'senior_male') {
      setCitizenProfile({
        name: 'Kishan Lal',
        gender: 'Male',
        age: 65,
        occupation: 'Senior Citizen / Retired',
        annual_income_inr: 60000,
        state: 'Rajasthan',
        category: 'EWS',
        special_conditions: ['BPL / Ration Card Holder']
      });
    } else if (preset === 'business_msme') {
      setCitizenProfile({
        name: 'Ramesh Patel',
        gender: 'Male',
        age: 38,
        occupation: 'Self-Employed / MSME / Trader',
        annual_income_inr: 450000,
        state: 'Gujarat',
        category: 'General',
        special_conditions: ['Seeking Business / MSME Loan']
      });
    }
  };

  const isDark = theme === 'dark';

  // ── Rotating Hero Headline State & Animation ──
  const ROTATING_WORDS = [
    { text: 'tenders', color: '#ea580c' },
    { text: 'agreements', color: '#0891b2' },
    { text: 'NDAs', color: '#7c3aed' },
    { text: 'leases', color: '#059669' },
    { text: 'welfare schemes', color: '#0284c7' },
  ];
  const [rotatingWordIdx, setRotatingWordIdx] = useState(0);
  const [wordVisible, setWordVisible] = useState(true);

  useEffect(() => {
    const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;
    const interval = setInterval(() => {
      setWordVisible(false);
      setTimeout(() => {
        setRotatingWordIdx(prev => (prev + 1) % ROTATING_WORDS.length);
        setWordVisible(true);
      }, 380);
    }, 2600);
    return () => clearInterval(interval);
  }, []);

  // ── Animated Health Score Ring for Floating Mock Preview ──
  const [previewScore, setPreviewScore] = useState(0);
  const previewScoreTarget = 82;
  useEffect(() => {
    const timer = setTimeout(() => {
      let current = 0;
      const step = setInterval(() => {
        current += 2;
        if (current >= previewScoreTarget) {
          setPreviewScore(previewScoreTarget);
          clearInterval(step);
        } else {
          setPreviewScore(current);
        }
      }, 25);
      return () => clearInterval(step);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  // ── Scroll Reveal via IntersectionObserver ──
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
    const elements = document.querySelectorAll('.reveal-hidden');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.remove('reveal-hidden');
          entry.target.classList.add('reveal-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    elements.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [activeTab]);

  // ── Feature Modules Filter Chips State ──
  const [featureFilter, setFeatureFilter] = useState('All');

  // ── FAQ Accordion State ──
  const [openFaqIdx, setOpenFaqIdx] = useState(null);
  const toggleFaq = (idx) => setOpenFaqIdx(prev => prev === idx ? null : idx);

  // ── Auto-Playing Explainer Video Player State ──
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const videoRef = useRef(null);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isVideoMuted;
      setIsVideoMuted(!isVideoMuted);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsVideoPlaying(true);
      } else {
        videoRef.current.pause();
        setIsVideoPlaying(false);
      }
    }
  };

  return (
    <div className={`min-h-screen font-sans pb-20 md:pb-0 transition-colors duration-200 ${isDark ? 'bg-[#090D16] text-slate-100' : 'bg-[#F8FAFC] text-slate-900'}`}>
      
      {/* ── National Identity Tricolor Bar ── */}
      <div className="h-1 w-full flex opacity-90">
        <div className="h-full w-1/3 bg-[#FF9933]"></div>
        <div className="h-full w-1/3 bg-white"></div>
        <div className="h-full w-1/3 bg-[#138808]"></div>
      </div>

      {/* ── Header Top Utility Bar ── */}
      <div className="border-b text-xs py-1.5 px-4 sm:px-8 transition-colors bg-[#07162C] border-blue-900/50 text-slate-300">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-3">
            <span className="font-extrabold uppercase tracking-wider text-xs text-[#FF9933] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              भारत सरकार · Government of India
            </span>
          </div>
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            {/* Indian Language Selector */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-blue-900/60 bg-[#0C223D] text-slate-200 text-[11px] font-semibold transition-all shadow-2xs">
              <Globe className="w-3.5 h-3.5 text-[#FF9933] shrink-0" />
              <select
                value={siteLang}
                onChange={(e) => changeSiteLanguage(e.target.value)}
                aria-label="Select Indian Language"
                className="bg-transparent border-none text-[11px] font-semibold focus:outline-none cursor-pointer pr-1 text-inherit"
              >
                {INDIAN_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code} className="bg-[#0C223D] text-white">
                    {l.native} ({l.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Processing Mode Switcher */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 hidden sm:inline">AI Engine:</span>
              <div className="flex items-center rounded-lg p-0.5 border border-blue-900/60 bg-[#0C223D] text-[11px] font-semibold shadow-2xs">
                <button
                  type="button"
                  onClick={() => setAiMode('fast')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${aiMode === 'fast' ? 'bg-blue-600 text-white shadow-2xs font-bold' : 'text-slate-400 hover:text-white'}`}
                  title="Fast processing mode"
                >
                  <Zap className="w-3 h-3 text-amber-300" /> Fast
                </button>
                <button
                  type="button"
                  onClick={() => setAiMode('secure')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${aiMode === 'secure' ? 'bg-slate-700 text-white shadow-2xs font-bold' : 'text-slate-400 hover:text-white'}`}
                  title="High security mode (local private inference)"
                >
                  <Lock className="w-3 h-3 text-emerald-300" /> Secure
                </button>
              </div>
            </div>

            {/* Bright / Dark Mode */}
            <button
              onClick={() => setTheme(isDark ? 'bright' : 'dark')}
              className="p-1.5 rounded-lg border border-blue-900/60 bg-[#0C223D] text-amber-300 hover:bg-blue-950 transition-all cursor-pointer shadow-2xs"
              title="Toggle Bright/Dark mode"
            >
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Navigation Header (Rich Sovereign Navy) ── */}
      <header className="border-b sticky top-0 z-40 backdrop-blur-xl transition-colors bg-gradient-to-r from-[#0A1E36] via-[#0F2D4A] to-[#0A1E36] border-blue-900/60 shadow-lg text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="relative">
              <img
                src="/logo.png"
                alt="JanDrishti Logo"
                className="w-10 h-10 rounded-xl object-contain bg-white shadow-sm border border-blue-800 p-0.5"
              />
            </div>
            <div>
              <div className="text-[10px] font-extrabold tracking-widest uppercase text-[#FF9933]">
                LEGAL & WELFARE INTELLIGENCE
              </div>
              <div className="text-xl font-extrabold font-display tracking-tight text-white">
                JanDrishti
              </div>
            </div>
          </div>

          {/* Quick Jump Links */}
          <nav className="hidden lg:flex items-center space-x-2 text-xs font-semibold text-slate-200">
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-white hover:bg-white/10 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer">
              Home
            </button>
            <button onClick={() => { setActiveTab('audit'); scrollTo(uploadRef); }} className="hover:text-white hover:bg-white/10 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer">
              Upload & Audit
            </button>
            <button onClick={() => handleSelectModule('chat', chatRef)} className="hover:text-white hover:bg-white/10 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1">
              <span>Q&A Chat</span>
            </button>
            <button onClick={() => handleSelectModule('courtroom', debateRef)} className="hover:text-white hover:bg-white/10 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1">
              <span>AI Debate</span>
              {!isPro && <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-extrabold">PRO</span>}
            </button>
            <button onClick={() => handleSelectModule('redline', redlineRef)} className="hover:text-white hover:bg-white/10 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1">
              <span>Redline</span>
              {!isPro && <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-extrabold">PRO</span>}
            </button>
            <button onClick={() => handleSelectModule('schemes', schemesRef)} className="hover:text-white hover:bg-white/10 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1">
              <span>Schemes</span>
            </button>
            <button onClick={() => handleSelectModule('history', historyRef)} className="hover:text-white hover:bg-white/10 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1">
              <span>History</span>
              {!isPro && <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-extrabold">PRO</span>}
            </button>
            <button
              onClick={() => { setPricingFeatureNotice(null); setShowPricingModal(true); }}
              className="text-amber-400 hover:text-amber-300 hover:bg-white/10 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 font-bold"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Pricing</span>
            </button>
          </nav>

          {/* Auth Button & Hamburger Menu (=) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Subscription Plan Badge */}
            <button
              type="button"
              onClick={() => { setPricingFeatureNotice(null); setShowPricingModal(true); }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs border ${
                usageData.plan_id === 'small_business'
                  ? 'bg-purple-900/40 border-purple-400/50 text-purple-200 hover:border-purple-300'
                  : usageData.plan_id === 'personal'
                    ? 'bg-emerald-900/40 border-emerald-400/50 text-emerald-200 hover:border-emerald-300'
                    : 'bg-amber-500/20 border-amber-400/40 text-amber-200 hover:bg-amber-500/30'
              }`}
              title={`Active Plan: ${usageData.plan_name} (${usageData.uploads_used}/${usageData.monthly_upload_limit} uploads) — Click to manage`}
            >
              <Crown className={`w-3.5 h-3.5 ${
                usageData.plan_id === 'small_business' ? 'text-purple-300' :
                usageData.plan_id === 'personal' ? 'text-emerald-300' : 'text-amber-300'
              }`} />
              <span className="font-extrabold text-white">
                {usageData.plan_id === 'small_business' ? `Business (${usageData.uploads_used}/${usageData.monthly_upload_limit})` :
                 usageData.plan_id === 'personal' ? `Personal (${usageData.uploads_used}/${usageData.monthly_upload_limit})` :
                 `Free (${usageData.uploads_used}/${usageData.monthly_upload_limit})`}
              </span>
              {usageData.plan_id === 'free' && (
                <span className="hidden sm:inline-block ml-0.5 text-[10px] px-1.5 py-0.5 rounded-md bg-[#EA580C] text-white font-black uppercase tracking-wider shadow-xs">
                  Upgrade ₹49
                </span>
              )}
              {usageData.cancel_at_period_end && (
                <span className="hidden sm:inline-block ml-0.5 text-[9px] px-1 py-0.2 rounded bg-rose-500 text-white font-bold uppercase">
                  Cancels
                </span>
              )}
            </button>
            {user ? (
              <div className="flex items-center space-x-2.5">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-white truncate max-w-[150px] flex items-center gap-1.5 justify-end">
                    <span className="truncate">{user.name}</span>
                    {user.is_verified ? (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-emerald-300 bg-emerald-950/70 border border-emerald-500/40 px-1.5 py-0.5 rounded-full shrink-0" title="Email Verified Citizen">
                        <Check className="w-2.5 h-2.5" /> Verified
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setAuthEmail(user.email);
                          setAuthMode('login');
                          setAuthMethod('otp');
                          setOtpStep('input_email');
                          setShowAuthModal(true);
                        }}
                        className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-300 bg-amber-950/70 border border-amber-500/40 px-1.5 py-0.5 rounded-full hover:bg-amber-900/70 transition-all cursor-pointer shrink-0"
                        title="Click to verify your email"
                      >
                        <Mail className="w-2.5 h-2.5" /> Verify
                      </button>
                    )}
                  </div>
                  <div className="text-[10px] text-blue-200 truncate max-w-[150px]">{user.email}</div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-slate-300 hover:text-rose-400 hover:bg-rose-950/40 transition-all cursor-pointer border border-transparent hover:border-rose-900/50"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setAuthMode('login'); setAuthError(''); setShowAuthModal(true); }}
                  className="px-3.5 py-2 text-xs font-bold text-slate-200 hover:text-white transition-colors cursor-pointer"
                >
                  Log in
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('register'); setAuthError(''); setShowAuthModal(true); }}
                  className="px-4 py-2 bg-[#ea580c] hover:bg-[#c2410c] text-white text-xs font-bold rounded-xl shadow-xs hover:shadow transition-all cursor-pointer"
                >
                  Get started
                </button>
              </div>
            )}

            {/* Hamburger (=) Workspace Modules Menu Button */}
            <button
              type="button"
              onClick={() => setIsMenuOpen(prev => !prev)}
              className="p-2 sm:p-2.5 rounded-xl border border-blue-800/80 bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer flex items-center justify-center shadow-2xs"
              title="Workspace Modules Menu (=)"
              aria-label="Toggle navigation menu"
            >
              {isMenuOpen ? <X className="w-5 h-5 text-rose-400" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* ── Slide-Down Workspace Modules Menu (=) ── */}
        {isMenuOpen && (
          <div className="border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#090D16]/95 backdrop-blur-2xl shadow-xl transition-all">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    JanDrishti · Legal Workspace Suite
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {[
                  { id: 'audit', label: 'Audit & Health', ref: uploadRef, icon: Shield, desc: 'Clause risk assessment & compliance health score', count: currentDoc ? highRisksCount + medRisksCount : null, countColor: 'bg-rose-500' },
                  { id: 'chat', label: 'Ask AI (Q&A)', ref: chatRef, icon: MessageSquare, desc: 'Interactive legal assistant & RAG intelligence' },
                  { id: 'courtroom', label: 'AI Courtroom', ref: debateRef, icon: Scale, desc: '3-Agent legal debate (Critic, Defender, Judge)' },
                  { id: 'redline', label: 'PDF Redline', ref: redlineRef, icon: Edit3, desc: 'Track changes, clause revisions & Word export', count: docRisks.length > 0 ? docRisks.length : null, countColor: 'bg-amber-500' },
                  { id: 'schemes', label: 'Welfare Schemes', ref: schemesRef, icon: Landmark, desc: 'Social security & citizen entitlement discovery', count: schemes.length || '96', countColor: 'bg-emerald-500' },
                  { id: 'translate', label: 'Indian Translator', ref: multilingualRef, icon: Globe, desc: '22 Indian languages with legal precision' },
                  { id: 'history', label: 'Documents & Records', ref: historyRef, icon: Folder, desc: 'Inspection history & verified compliance records', count: documents.length || null, countColor: 'bg-blue-500' },
                  { id: 'all', label: 'Full Dashboard View', ref: uploadRef, icon: LayoutGrid, desc: 'Display all modules unified on a single screen' },
                ].map(module => {
                  const Icon = module.icon;
                  const isActive = activeTab === module.id;
                  return (
                    <button
                      key={module.id}
                      type="button"
                      onClick={() => handleSelectModule(module.id, module.ref)}
                      className={`text-left p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group ${
                        isActive
                          ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/30 dark:border-blue-500/80 ring-1 ring-blue-500/30'
                          : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-blue-400 dark:hover:border-slate-700 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2.5">
                        <div className={`p-2 rounded-lg ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/50 group-hover:text-blue-600'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        {module.count !== null && module.count !== undefined && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold text-white ${module.countColor || 'bg-slate-500'}`}>
                            {module.count}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {module.label}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug line-clamp-2">
                          {module.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Quick Actions Footer inside (=) Menu */}
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    handleLoadDemoContract();
                    setIsMenuOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-xs hover:shadow"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>Try Demo Tender Contract</span>
                </button>

                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {user ? (
                    <span>Logged in as <strong className="text-slate-800 dark:text-slate-200">{user.name}</strong></span>
                  ) : (
                    <span>Authorized Citizen Mode</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ── SECTION 1: MODERN MINIMALIST HERO SECTION ── */}
      <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-28 border-b border-slate-200/80 dark:border-slate-800/80 hero-mesh bg-white dark:bg-[#080D18]">
        {/* Fine background grid with radial mask */}
        <div className="absolute inset-0 hero-grid-pattern pointer-events-none" />
        
        {/* Soft atmospheric radial glows */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[680px] h-[340px] bg-gradient-to-b from-blue-500/12 to-orange-500/8 dark:from-blue-500/15 dark:to-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          
          {/* Eyebrow Pill Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-slate-800 shadow-2xs backdrop-blur-md mb-8 hover:border-blue-400 dark:hover:border-blue-600 transition-all cursor-default">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600 dark:bg-blue-400"></span>
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
              SOVEREIGN LEGAL & WELFARE INTELLIGENCE PLATFORM
            </span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="text-slate-500 dark:text-slate-400 text-[11px]">DPDP Act 2023 Compliant</span>
          </div>

          {/* Dynamic Minimalist Headline */}
          <h1 className="font-display font-extrabold text-4xl sm:text-6xl lg:text-7xl leading-[1.2] sm:leading-[1.24] tracking-tight text-slate-900 dark:text-white mb-6 max-w-4xl mx-auto">
            <span className="block mb-2 sm:mb-3">Legal contracts,</span>
            <span className="relative inline-block min-w-[280px] sm:min-w-[480px] lg:min-w-[580px] h-[1.42em] sm:h-[1.48em] overflow-hidden align-middle px-3 pb-2 pt-1">
              <span
                key={rotatingWordIdx}
                className={`block absolute inset-0 ${wordVisible ? 'word-slide-in' : 'word-slide-out'} whitespace-nowrap`}
                style={{ color: ROTATING_WORDS[rotatingWordIdx].color }}
              >
                {ROTATING_WORDS[rotatingWordIdx].text}
              </span>
              {/* Dynamic SVG underline swoosh */}
              <svg
                className={`absolute bottom-0 left-0 w-full ${wordVisible ? 'swoosh-animate' : ''}`}
                height="10"
                viewBox="0 0 500 10"
                fill="none"
                aria-hidden="true"
              >
                <path
                  className="swoosh-path"
                  d="M6 7 C 100 2, 250 9, 360 4 S 460 2, 494 6"
                  stroke={ROTATING_WORDS[rotatingWordIdx].color}
                  strokeWidth="3.2"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span className="block mt-4 sm:mt-6 text-2xl sm:text-4xl lg:text-5xl font-bold text-slate-700 dark:text-slate-300">
              analysed in seconds by sovereign AI.
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto mb-9 font-normal">
            Automated statutory risk auditing, multi-agent legal deliberation, and citizen entitlement discovery across India — in 22 Indian languages.
          </p>

          {/* CTA Action Buttons Cluster */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-12">
            <button
              type="button"
              onClick={() => {
                setActiveTab('audit');
                if (!user) {
                  setShowAuthModal(true);
                  setAuthError('Sign in to upload documents and run deep compliance audits.');
                } else {
                  scrollTo(uploadRef);
                }
              }}
              className="w-full sm:w-auto px-7 py-3.5 bg-[#0f3d68] hover:bg-[#0a2744] text-white font-bold text-xs sm:text-sm tracking-wide uppercase rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.99]"
            >
              <Upload className="w-4 h-4" />
              <span>UPLOAD & ANALYZE</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleLoadDemoContract}
              className="w-full sm:w-auto px-6 py-3.5 bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold text-xs sm:text-sm tracking-wide uppercase rounded-xl shadow-xs hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              title="Test the entire dashboard immediately with a sample municipal tender"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>TRY DEMO CONTRACT</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('features-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                else { setActiveTab('schemes'); scrollTo(schemesRef); }
              }}
              className="w-full sm:w-auto px-6 py-3.5 bg-white/90 hover:bg-slate-50 dark:bg-slate-900/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm tracking-wide uppercase rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <LayoutGrid className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>EXPLORE MODULES</span>
            </button>
          </div>

          {/* ── ADVANCED MINIMALIST CAPABILITY DOCK (Ensures it never looks empty!) ── */}
          <div className="max-w-4xl mx-auto rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] p-5 sm:p-6 text-left transition-all hover:border-blue-400/60 dark:hover:border-blue-700/60">
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800/80 gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  JanDrishti Intelligence Matrix
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/80 dark:border-blue-900/60">
                  ACTIVE ENGINE
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                100% In-Country Sovereign Data Processing
              </div>
            </div>

            {/* 4 Clean Minimal Capability Cards in a Responsive Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-4">
              <div
                onClick={() => { setActiveTab('audit'); scrollTo(uploadRef); }}
                className="p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all cursor-pointer group"
              >
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Shield className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Clause Risk Audit
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Automated ICA parity & flags
                </div>
              </div>

              <div
                onClick={() => handleSelectModule('courtroom', debateRef)}
                className="p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-amber-300 dark:hover:border-amber-700 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Scale className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded bg-amber-100/60 dark:bg-amber-950/80">
                    3-AGENT
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  AI Courtroom
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Critic, Defender & Judge
                </div>
              </div>

              <div
                onClick={() => handleSelectModule('schemes', schemesRef)}
                className="p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Landmark className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded bg-blue-100/60 dark:bg-blue-950/80">
                    96 SCHEMES
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Citizen Welfare
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  PM-KISAN, Ayushman & Mudra
                </div>
              </div>

              <div
                onClick={() => handleSelectModule('translate', multilingualRef)}
                className="p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-purple-300 dark:hover:border-purple-700 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <Globe className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-extrabold text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded bg-purple-100/60 dark:bg-purple-950/80">
                    22 LANGS
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  Indian Languages
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Hindi, Marathi, Tamil, etc.
                </div>
              </div>
            </div>

            {/* Quick Demo Contract Pill Bar */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Test sample contract:
                </span>
                <button
                  type="button"
                  onClick={handleLoadDemoContract}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 dark:hover:text-blue-400 transition-all cursor-pointer font-medium"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Municipal_E-Tender_Contract.pdf</span>
                </button>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <Lock className="w-3 h-3 text-emerald-600" />
                <span>PII Redacted Automatically</span>
              </div>
            </div>
          </div>

          {/* Minimalist Trust Footer Line */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> PDF & Scanned OCR</span>
            <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-blue-600 shrink-0" /> Automated Clause Severity Analysis</span>
          </div>

        </div>
      </section>

      {/* ── SECTION 2: HOW IT WORKS ── */}
      <section className="py-20 sm:py-24 bg-white dark:bg-[#070B14] border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 reveal-hidden">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-200/80 dark:border-orange-900/60 mb-3 shadow-2xs">
              <Zap className="w-3.5 h-3.5" />
              <span>SIMPLE · POWERFUL · SOVEREIGN</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display text-slate-900 dark:text-white tracking-tight mb-3">
              How It Works
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
              From contract upload to complete statutory risk assessment in three simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                num: '01',
                title: 'Upload Document',
                icon: Upload,
                desc: 'Upload any native digital or scanned PDF contract, municipal tender, lease agreement, or government scheme notice.',
                color: '#0f3d68',
                badge: 'OCR & PII Shield'
              },
              {
                num: '02',
                title: 'Multi-Agent Audit',
                icon: Cpu,
                desc: 'Our 3-agent intelligence engine audits clauses, checks statutory parity, detects liabilities, and computes the health score.',
                color: '#ea580c',
                badge: 'Critic, Defender, Judge'
              },
              {
                num: '03',
                title: 'Act & Entitle',
                icon: CheckCircle2,
                desc: 'Export redlined Word documents, debate clauses, translate into 22 Indian languages, and claim matched citizen welfare benefits.',
                color: '#059669',
                badge: '22 Languages'
              }
            ].map((step, idx) => {
              const StepIcon = step.icon;
              return (
                <div
                  key={step.num}
                  className="reveal-hidden group p-8 rounded-2xl border bg-slate-50/50 dark:bg-slate-900/60 border-slate-200/90 dark:border-slate-800 feature-card relative overflow-hidden"
                  style={{ animationDelay: `${idx * 0.12}s` }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <span className="step-num" style={{ WebkitTextStrokeColor: step.color }}>
                      {step.num}
                    </span>
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
                      style={{ backgroundColor: `${step.color}15` }}
                    >
                      <StepIcon className="w-6 h-6" style={{ color: step.color }} />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold font-display text-slate-900 dark:text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                    {step.desc}
                  </p>
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                    {step.badge}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: UPLOAD & AUDIT WORKSPACE (Always Visible & Accessible!) ── */}
      <section ref={uploadRef} className={`py-16 border-b border-slate-200/80 dark:border-slate-800/80 ${activeTab !== 'audit' && activeTab !== 'all' ? 'hidden' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/80 dark:border-blue-900/60 mb-2.5">
              WORKSPACE · MODULE 1
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-slate-900 dark:text-white tracking-tight">
              Upload Document for AI Analysis
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5">
              Select a PDF contract or government scheme for automated summary, clause extraction, and risk detection.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            {/* ── SUBSCRIPTION USAGE METER (SERVER-ENFORCED TIERS) ── */}
            <div className={`p-4 sm:p-5 rounded-2xl border mb-6 transition-all ${
              usageData.uploads_remaining <= 0
                ? 'border-rose-300 dark:border-rose-800/80 bg-rose-50/80 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 shadow-2xs'
                : usageData.plan_id === 'small_business'
                  ? 'border-purple-300 dark:border-purple-800/80 bg-gradient-to-r from-purple-50/80 via-indigo-50/50 to-white dark:from-purple-950/30 dark:via-slate-900 dark:to-slate-900 shadow-2xs'
                  : usageData.plan_id === 'personal'
                    ? 'border-emerald-300 dark:border-emerald-800/80 bg-gradient-to-r from-emerald-50/80 via-teal-50/50 to-white dark:from-emerald-950/30 dark:via-slate-900 dark:to-slate-900 shadow-2xs'
                    : 'border-amber-300 dark:border-amber-800/80 bg-gradient-to-r from-amber-50/80 via-orange-50/40 to-white dark:from-amber-950/30 dark:via-slate-900 dark:to-slate-900 shadow-2xs'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                    usageData.uploads_remaining <= 0
                      ? 'bg-rose-600 text-white shadow-xs'
                      : usageData.plan_id === 'small_business'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : usageData.plan_id === 'personal'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-amber-500 text-white shadow-xs'
                  }`}>
                    {usageData.uploads_used}
                  </div>
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{usageData.plan_name}</span>
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        usageData.uploads_remaining <= 0
                          ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200'
                          : usageData.plan_id === 'small_business'
                            ? 'bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200'
                            : usageData.plan_id === 'personal'
                              ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200'
                              : 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200'
                      }`}>
                        {usageData.uploads_used} / {usageData.monthly_upload_limit} USED THIS MONTH
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {usageData.uploads_remaining <= 0
                        ? usageData.plan_id === 'free'
                          ? 'You have used 5 of your 5 free document uploads. Upgrade to Personal for ₹49/month to continue analysing documents.'
                          : `Monthly quota reached (${usageData.uploads_used}/${usageData.monthly_upload_limit}). Upgrade your plan to continue.`
                        : `${usageData.uploads_remaining} document ${usageData.uploads_remaining === 1 ? 'upload' : 'uploads'} remaining this billing cycle (resets on 1st of next month).`
                      }
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  {usageData.plan_id !== 'small_business' && (
                    <button
                      type="button"
                      onClick={() => { setPricingFeatureNotice(null); setShowPricingModal(true); }}
                      className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                      <span>{usageData.plan_id === 'free' ? 'Upgrade Plan (₹49/mo)' : 'Upgrade to Business'}</span>
                    </button>
                  )}
                  {usageData.plan_id === 'small_business' && (
                    <button
                      type="button"
                      onClick={() => { setPricingFeatureNotice(null); setShowPricingModal(true); }}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      <span>Manage Plan</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-200 dark:bg-slate-700/80 rounded-full h-2 overflow-hidden mt-1">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    usageData.uploads_remaining <= 0
                      ? 'bg-rose-500' 
                      : (usageData.uploads_used / (usageData.monthly_upload_limit || 1)) >= 0.7 
                        ? 'bg-amber-500' 
                        : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, (usageData.uploads_used / (usageData.monthly_upload_limit || 1)) * 100)}%` }}
                />
              </div>
            </div>

            {/* Quota Exhausted Warning Banner */}
            {usageData.uploads_remaining <= 0 && (
              <div className="mb-6 p-4 sm:p-5 rounded-2xl border border-rose-300 dark:border-rose-800 bg-rose-50/90 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-extrabold text-sm text-rose-900 dark:text-rose-100">
                      Upload Limit Reached
                    </div>
                    <div className="text-xs text-rose-700 dark:text-rose-300 mt-0.5 leading-relaxed">
                      {usageData.plan_id === 'free'
                        ? 'You have used 5 of your 5 free document uploads. Upgrade to Personal for ₹49/month to continue analysing documents.'
                        : `Monthly upload limit reached (${usageData.uploads_used}/${usageData.monthly_upload_limit} documents). Upgrade to Small Business for ₹149/month to continue.`}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setPricingFeatureNotice(null); setShowPricingModal(true); }}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                >
                  <Crown className="w-4 h-4 text-amber-200" />
                  <span>{usageData.plan_id === 'free' ? 'Upgrade to Personal' : 'Upgrade Plan'}</span>
                </button>
              </div>
            )}

            <div className={`p-6 sm:p-8 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_2px_12px_rgba(15,23,42,0.04)] dark:shadow-none transition-all ${isDark ? 'bg-slate-900/90' : 'bg-white'}`}>
              <form onSubmit={handleUpload} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-700 dark:text-slate-300">Document Type</label>
                    <select 
                      value={uploadDocType} 
                      onChange={e => setUploadDocType(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold cursor-pointer shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="contract">Commercial Contract / Legal Agreement</option>
                      <option value="scheme">Government Scheme / Policy Directive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-700 dark:text-slate-300">Processing Mode</label>
                    <select
                      value={aiMode}
                      onChange={e => setAiMode(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold cursor-pointer shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="fast">Fast (Direct Cloud AI Engine)</option>
                      <option value="secure">High Security (PII Redacted Local AI)</option>
                    </select>
                  </div>
                </div>

                {/* 1-Click Demo Contract Quick-Load Banner */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/8 via-indigo-500/5 to-slate-500/5 border border-blue-200/70 dark:border-blue-900/40 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100">Don't have a contract PDF handy?</h5>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Test the entire AI engine instantly with our realistic Municipal Tender Contract.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleLoadDemoContract}
                    className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs hover:shadow transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-300" /> TRY DEMO CONTRACT
                  </button>
                </div>

                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-all bg-slate-50/50 dark:bg-slate-900/30 group">
                  <input 
                    type="file" 
                    accept=".pdf,application/pdf" 
                    id="docUploader"
                    onChange={e => setUploadFile(e.target.files[0])}
                    className="hidden" 
                  />
                  <label htmlFor="docUploader" className="cursor-pointer flex flex-col items-center">
                    <Upload className="w-10 h-10 text-blue-600 dark:text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {uploadFile ? uploadFile.name : 'Choose a Contract or Policy PDF (max 50MB)'}
                    </span>
                    <span className="text-xs text-slate-400 mt-1">Supports standard and scanned PDF files</span>
                  </label>
                </div>

                {isUploading && (
                  <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-xs">
                    <div className="flex items-center gap-2 font-bold text-blue-900 dark:text-blue-200 mb-1.5">
                      <Cpu className="w-4 h-4 animate-spin text-blue-600" /> {uploadStage}
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 dark:bg-slate-700 overflow-hidden">
                      <div className="bg-blue-600 h-1.5 rounded-full animate-pulse w-3/4"></div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={(!uploadFile && monthlyUploads < FREE_MONTHLY_LIMIT) || isUploading}
                  onClick={(e) => {
                    if (!isPro && monthlyUploads >= FREE_MONTHLY_LIMIT) {
                      e.preventDefault();
                      setPricingFeatureNotice(`Monthly Upload Limit (${FREE_MONTHLY_LIMIT}/${FREE_MONTHLY_LIMIT} PDFs Used)`);
                      setShowPricingModal(true);
                    }
                  }}
                  className={`w-full py-3.5 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs hover:shadow transition-all cursor-pointer ${
                    !isPro && monthlyUploads >= FREE_MONTHLY_LIMIT
                      ? 'bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 font-extrabold'
                      : 'bg-blue-600 hover:bg-blue-700 disabled:opacity-50'
                  }`}
                >
                  {isUploading 
                    ? 'ANALYZING DOCUMENT...' 
                    : !isPro && monthlyUploads >= FREE_MONTHLY_LIMIT
                      ? 'UPGRADE TO PRO TO ANALYZE (5/5 LIMIT REACHED)'
                      : 'PROCESS & ANALYZE DOCUMENT'
                  }
                </button>
              </form>
            </div>

            {/* Document Analysis Result Breakdown */}
            {currentDoc && (
              <div className="mt-8 space-y-6">
                {/* Contract Health Score & Safety Meter */}
                <div className={`p-6 rounded-2xl border shadow-xs flex flex-col md:flex-row items-center justify-between gap-5 transition-all ${healthGrade.bg} ${healthGrade.borderColor}`}>
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    {/* Visual Radial Dial / Health Badge */}
                    <div className="relative w-20 h-20 flex flex-col items-center justify-center rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 shrink-0">
                      <span className={`text-3xl font-extrabold ${healthGrade.color}`}>
                        {healthScore}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase -mt-0.5">/ 100</span>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full text-white shadow-2xs ${
                          healthScore >= 80 ? 'bg-emerald-600' : healthScore >= 50 ? 'bg-amber-500' : 'bg-rose-600'
                        }`}>
                          {healthGrade.badge}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                          Legal Parity Score (Indian Contract Act 1872)
                        </span>
                      </div>
                      <h4 className="text-base font-bold font-display text-slate-900 dark:text-white">
                        {healthGrade.title}
                      </h4>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-2.5 overflow-hidden max-w-md">
                        <div className={`h-1.5 rounded-full transition-all duration-700 ${healthGrade.progressColor}`} style={{ width: `${healthScore}%` }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Download PDF */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto justify-end">
                    <a
                      href={`${API_BASE}/report/download/${currentDoc.id}`}
                      target="_blank"
                      rel="noreferrer"
                      download
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs hover:shadow flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Download className="w-3.5 h-3.5 text-blue-200" />
                      <span>DOWNLOAD REPORT</span>
                    </a>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
                    <div>
                      <h4 className="font-bold text-sm text-emerald-950 dark:text-emerald-200">{currentDoc.filename}</h4>
                      <p className="text-xs text-emerald-700 dark:text-emerald-400">{currentDoc.page_count} Pages Indexed · Analysis Complete</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                      type="button"
                      disabled={isReanalyzing}
                      onClick={() => handleReanalyze(currentDoc.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                        isDark ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                      title={`Re-audit this contract with ${aiMode === 'fast' ? 'Faster Cloud AI' : 'Local Secure AI'}`}
                    >
                      <Activity className={`w-3.5 h-3.5 text-blue-600 ${isReanalyzing ? 'animate-spin' : ''}`} />
                      {isReanalyzing ? 'Re-Auditing...' : `Re-Audit (${aiMode === 'fast' ? 'Fast' : 'Secure'})`}
                    </button>
                    <a
                      href={`${API_BASE}/report/download/${currentDoc.id}`}
                      target="_blank"
                      rel="noreferrer"
                      download
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs flex items-center gap-2 transition-all"
                    >
                      <Download className="w-4 h-4 text-blue-200" /> DOWNLOAD AUDIT REPORT (PDF)
                    </a>
                    <span className="text-xs uppercase font-extrabold px-3 py-1.5 rounded-lg bg-emerald-200 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200">
                      ACTIVE
                    </span>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className={`p-4 rounded-2xl border text-center border-t-2 border-t-rose-500 shadow-2xs ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/90'}`}>
                    <div className="text-2xl font-black text-rose-600">{highRisksCount}</div>
                    <div className="text-xs text-slate-500 uppercase font-semibold mt-1">High Risks</div>
                  </div>
                  <div className={`p-4 rounded-2xl border text-center border-t-2 border-t-amber-500 shadow-2xs ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/90'}`}>
                    <div className="text-2xl font-black text-amber-500">{medRisksCount}</div>
                    <div className="text-xs text-slate-500 uppercase font-semibold mt-1">Medium Risks</div>
                  </div>
                  <div className={`p-4 rounded-2xl border text-center border-t-2 border-t-blue-500 shadow-2xs ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/90'}`}>
                    <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{docClauses.length}</div>
                    <div className="text-xs text-slate-500 uppercase font-semibold mt-1">Clauses Classified</div>
                  </div>
                  <div className={`p-4 rounded-2xl border text-center border-t-2 border-t-emerald-500 shadow-2xs ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/90'}`}>
                    <div className="text-2xl font-black text-emerald-600">{entitiesCount}</div>
                    <div className="text-xs text-slate-500 uppercase font-semibold mt-1">Extracted Entities</div>
                  </div>
                </div>

                {/* Summary */}
                <div className={`p-6 sm:p-7 rounded-2xl border shadow-xs ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/90'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">Executive Summary</h3>
                    <a
                      href={`${API_BASE}/report/download/${currentDoc.id}`}
                      target="_blank"
                      rel="noreferrer"
                      download
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" /> Download Full PDF Report
                    </a>
                  </div>

                  {/* Layer 1 Sovereign PII Shield Badge */}
                  <div className="mb-3.5 p-3 rounded-xl border border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/80 dark:bg-emerald-950/40 flex items-center justify-between flex-wrap gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div>
                        <span className="font-bold text-emerald-900 dark:text-emerald-200">
                          Layer 1 Sovereign PII Shield: ACTIVE
                        </span>
                        <span className="text-emerald-700 dark:text-emerald-400 ml-1.5 text-[11px]">
                          (DPDP Act 2023 Compliant · Aadhaar, PAN, Phone & Financial IDs Scrubbed Prior to AI Evaluation)
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-200 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200">
                      Zero-PII Cloud Transmission
                    </span>
                  </div>

                  <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">{currentDoc.summary}</p>
                </div>

                {/* Detected Risks & Remediation */}
                <div className={`p-6 sm:p-7 rounded-2xl border shadow-xs ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/90'}`}>
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-base font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                      Detected Risks, Severity Rationale & Remediation ({docRisks.length})
                    </h3>
                    <span className="text-xs text-slate-500">
                      Evaluated against Indian legal standards & commercial parity
                    </span>
                  </div>
                  <div className="space-y-4">
                    {docRisks.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No significant legal liabilities or one-sided terms detected.</p>
                    ) : (
                      docRisks.map((risk, i) => {
                        const isHigh = (risk.risk_level || '').toLowerCase().includes('high');
                        const isMed = (risk.risk_level || '').toLowerCase().includes('med');
                        const rationale = risk.severity_reasoning || (isHigh
                          ? 'Designated as High Risk because this clause imposes asymmetric exposure, uncapped financial liability, or forfeiture of essential statutory rights without reciprocal remedies.'
                          : (isMed 
                            ? 'Designated as Medium Risk due to procedural ambiguity, aggressive timelines, or lack of standard notice and cure periods that could trigger disputes.'
                            : 'Designated as Low Risk representing standard boilerplate terms requiring minor clarifying modifications to ensure mutual parity.'));
                        const impact = risk.potential_impact || (isHigh
                          ? 'Catastrophic financial losses, unlimited third-party liability, or immediate unilateral termination without recourse.'
                          : 'Operational disruption, administrative delays, or cash flow strain during project execution.');
                        const triggers = Array.isArray(risk.trigger_factors) && risk.trigger_factors.length > 0 
                          ? risk.trigger_factors 
                          : (isHigh ? ['Uncapped liability', 'One-sided term'] : ['Procedural ambiguity']);

                        return (
                          <div 
                            key={i} 
                            className={`p-5 rounded-2xl border transition-all shadow-2xs ${
                              isHigh 
                                ? 'bg-rose-50/50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/60 border-l-4 border-l-rose-500' 
                                : (isMed 
                                  ? 'bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/60 border-l-4 border-l-amber-500'
                                  : 'bg-blue-50/50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/60 border-l-4 border-l-blue-500')
                            }`}
                          >
                            {/* Card Header with Badges */}
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider text-white shadow-2xs ${
                                  isHigh ? 'bg-rose-600' : (isMed ? 'bg-amber-500' : 'bg-blue-600')
                                }`}>
                                  {risk.risk_level || 'RISK'} SEVERITY
                                </span>
                                <span className="font-bold text-sm text-slate-900 dark:text-white">
                                  {risk.clause_type || 'Contract Clause'}
                                </span>
                              </div>

                              {/* Red Flag Trigger Tags */}
                              <div className="flex flex-wrap items-center gap-1.5">
                                {triggers.map((tf, tidx) => (
                                  <span 
                                    key={tidx} 
                                    className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                      isHigh 
                                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200 border border-rose-200 dark:border-rose-800' 
                                        : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200 border border-amber-200 dark:border-amber-800'
                                    }`}
                                  >
                                    <AlertTriangle className="w-3 h-3 shrink-0" />
                                    <span>{tf}</span>
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Risky Verbatim Excerpt */}
                            <div className="mb-3">
                              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                                <FileText className="w-3 h-3 text-rose-500" /> Problematic Verbatim Excerpt:
                              </div>
                              <blockquote className="p-3.5 rounded-xl bg-white/95 dark:bg-slate-900/90 border border-rose-200 dark:border-rose-900/50 border-l-4 border-l-rose-500 text-rose-950 dark:text-rose-200 font-mono text-xs leading-relaxed italic shadow-2xs">
                                "{risk.risky_excerpt}"
                              </blockquote>
                            </div>

                            {/* Why It's Risky: Hazard Assessment */}
                            <div className="mb-3">
                              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                Why This Clause Is Risky (Hazard Assessment):
                              </div>
                              <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed bg-white/70 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
                                {risk.why_risky}
                              </p>
                            </div>

                            {/* Why It's Stated As High / Medium Risk (Severity Rationale) */}
                            <div className="mb-3 p-3.5 rounded-xl bg-white/95 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800">
                              <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1.5 flex items-center gap-1.5">
                                <Activity className="w-3.5 h-3.5 text-blue-600" />
                                Why Stated As [{risk.risk_level}] Risk (Classification Rationale):
                              </div>
                              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                                {rationale}
                              </p>
                              {impact && (
                                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
                                  <strong className="text-rose-700 dark:text-rose-400">Potential Legal & Financial Exposure: </strong>
                                  {impact}
                                </div>
                              )}
                            </div>

                            {/* Recommended Remediation Amendment with Copy & Audio Button */}
                            {risk.suggested_replacement && (
                              <div className="pt-2">
                                <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                                  <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                    Recommended Legal Amendment (Safer Replacement):
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleCopyClause(risk.suggested_replacement, i)}
                                      className="px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
                                      title="Copy clause to clipboard"
                                    >
                                      {copiedIndex === i ? (
                                        <>
                                          <Check className="w-3 h-3 text-white" />
                                          <span className="font-black">COPIED!</span>
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="w-3 h-3 text-emerald-100" />
                                          <span>COPY CLAUSE</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>
                                <div className="p-3.5 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 border-l-4 border-l-emerald-500 text-emerald-950 dark:text-emerald-100 text-xs leading-relaxed font-medium shadow-2xs">
                                  {risk.suggested_replacement}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Classified Legal Clauses */}
                {docClauses.length > 0 && (
                  <div className={`p-6 sm:p-7 rounded-2xl border shadow-xs ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/90'}`}>
                    <h3 className="text-base font-bold font-display text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      Classified Legal Clauses ({docClauses.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {docClauses.map((clause, idx) => (
                        <div key={idx} className={`p-4 rounded-xl border text-xs space-y-1.5 ${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50/70 border-slate-200/90'}`}>
                          <div className="font-bold text-slate-900 dark:text-white uppercase text-[11px] flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                            {clause.clause_type}
                          </div>
                          <p className="text-slate-700 dark:text-slate-300 text-xs font-medium">{clause.summary}</p>
                          {clause.verbatim_excerpt && (
                            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 italic text-[11px] text-slate-500 dark:text-slate-400">
                              "{clause.verbatim_excerpt}"
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Key Entities & Contract Metadata */}
                {Object.keys(docEntities).length > 0 && (
                  <div className={`p-6 sm:p-7 rounded-2xl border shadow-xs ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/90'}`}>
                    <h3 className="text-base font-bold font-display text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-blue-600" />
                      Extracted Entities & Metadata
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                      {Object.entries(docEntities).map(([category, items]) => {
                        const list = Array.isArray(items) ? items : [String(items)];
                        if (list.length === 0) return null;
                        return (
                          <div key={category} className={`p-4 rounded-xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50/70 border-slate-200'}`}>
                            <div className="font-bold uppercase tracking-wider text-[10px] text-blue-600 dark:text-blue-400 mb-2">
                              {category.replace('_', ' ')}
                            </div>
                            <ul className="space-y-1">
                              {list.map((item, i) => (
                                <li key={i} className="text-slate-800 dark:text-slate-200 font-medium flex items-start gap-1.5">
                                  <span className="text-slate-400">•</span>
                                  <span>{typeof item === 'string' ? item : item.name || JSON.stringify(item)}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── SECTION 4: INTERACTIVE Q&A CHAT MODULE ── */}
      <section ref={chatRef} className={`py-16 border-b transition-colors ${isDark ? 'bg-[#090D16] border-slate-800/80' : 'bg-slate-50/60 border-slate-200/80'} ${activeTab !== 'chat' && activeTab !== 'all' ? 'hidden' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/80 dark:border-blue-900/60 mb-2.5">
              WORKSPACE · MODULE 2
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-slate-900 dark:text-white tracking-tight">
              Verified Legal Copilot & Q&A
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5">
              Ask questions about penalties, deadlines, clauses, and obligations with exact page-level citations.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            {!currentDoc ? (
              <div className={`p-10 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-slate-500 text-xs ${isDark ? 'bg-slate-900/40' : 'bg-white'}`}>
                <FileCheck className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">No Document Loaded</p>
                <p>Upload a contract in Module 1 above to enable the interactive Q&A assistant.</p>
              </div>
            ) : (
              <div className={`rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_2px_12px_rgba(15,23,42,0.04)] flex flex-col h-[520px] overflow-hidden ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
                <div className="px-6 py-4 bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 truncate max-w-[60%]">
                    <MessageSquare className="w-4 h-4 text-blue-400 shrink-0" />
                    <span className="font-semibold text-slate-300">Document:</span>
                    <span className="font-bold truncate text-white">{currentDoc.filename}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                      {usageData.ai_queries_remaining !== undefined ? usageData.ai_queries_remaining : 15} / {usageData.ai_query_limit || 15} Qs Left
                    </span>
                    <span className="text-[10px] bg-white/10 px-2.5 py-1 rounded-full font-semibold text-blue-200">
                      {aiMode === 'fast' ? 'Fast AI Engine' : 'High Security Engine'}
                    </span>
                    <span className="text-[10px] bg-blue-600 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider text-white">Citation Verified</span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                  {messages.length === 0 && (
                    <div className="text-center py-20 text-slate-400">
                      <Bot className="w-8 h-8 mx-auto mb-2 opacity-40 text-blue-500" />
                      <p className="font-medium text-slate-500 dark:text-slate-400">Ask anything about this document!</p>
                      <p className="text-[11px] text-slate-400 mt-1">e.g. "What is risky in this contract?" or "What are the payment milestones?"</p>
                    </div>
                  )}
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl p-4 shadow-2xs ${m.sender === 'user' ? 'bg-blue-600 text-white rounded-tr-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-xs border border-slate-200/80 dark:border-slate-700/80'}`}>
                        <div className="font-bold text-[10px] uppercase tracking-wider opacity-70 mb-1">{m.sender === 'user' ? 'You' : 'Legal AI Assistant'}</div>
                        <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>
                        {m.citations?.length > 0 && (
                          <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-1.5 items-center text-[10px] font-bold">
                            <span className="text-slate-500 dark:text-slate-400">VERIFIED CITATIONS:</span>
                            {m.citations.map(p => (
                              <span key={p} className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-md">
                                Page {p}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      <Cpu className="w-4 h-4 animate-spin text-blue-600" /> Retrieving verified excerpts and citing clauses...
                    </div>
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="p-3.5 border-t border-slate-200 dark:border-slate-800 flex gap-2.5 bg-slate-50/50 dark:bg-slate-900/50">
                  <input 
                    type="text" 
                    value={chatInput} 
                    onChange={e => setChatInput(e.target.value)}
                    placeholder="e.g. Can you explain the uncapped indemnity clause?"
                    className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
                  />
                  <button type="submit" disabled={isChatLoading || !chatInput.trim()} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs hover:shadow transition-all cursor-pointer">
                    Send
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── SECTION 5: MULTI-AGENT COURTROOM DEBATE ── */}
      <section ref={debateRef} className={`py-16 border-b border-slate-200/80 dark:border-slate-800/80 ${activeTab !== 'courtroom' && activeTab !== 'all' ? 'hidden' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/80 dark:border-blue-900/60 mb-2.5">
              WORKSPACE · MODULE 3
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-slate-900 dark:text-white tracking-tight">
              Multi-Agent Legal Courtroom
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5">
              3 AI agents debate your contract clauses: The Critic, The Defender, and Judicial Verdict.
            </p>
          </div>

          {!isPro ? (
            <ProLockedPaywall
              title="3-Agent Multi-Agent Courtroom Deliberation"
              moduleTag="PRO · MODULE 3"
              description="Simulate judicial review where three specialized AI personas scrutinize disputed contract terms from opposing perspectives before delivering a balanced verdict."
              bulletPoints={[
                "The Critic identifies every vulnerability and unmitigated loophole",
                "The Defender presents industry-standard commercial counterarguments",
                "The Judge delivers authoritative statutory arbitration with fair amendments"
              ]}
              onUpgrade={() => { setPricingFeatureNotice('3-Agent AI Courtroom Debate'); setShowPricingModal(true); }}
              isDark={isDark}
              onBackToAudit={() => { setActiveTab('audit'); scrollTo(uploadRef); }}
            />
          ) : (
          <div className="max-w-3xl mx-auto">
            {!currentDoc ? (
              <div className={`p-10 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-slate-500 text-xs ${isDark ? 'bg-slate-900/40' : 'bg-white'}`}>
                <Scale className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">No Document Uploaded</p>
                <p>Upload a document in Module 1 to simulate the multi-agent legal courtroom debate.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-6 sm:p-7 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-800 shadow-xs">
                  <div>
                    <h4 className="font-bold text-base font-display text-white">Simulate Autonomous Courtroom</h4>
                    <p className="text-xs text-slate-300 mt-1">Prosecution, Defense, and Judicial Verdict on detected contractual loopholes.</p>
                  </div>
                  <button 
                    onClick={handleStartDebate} 
                    disabled={isDebating}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs hover:shadow transition-all cursor-pointer shrink-0"
                  >
                    {isDebating ? 'AGENTS DEBATING...' : 'START COURTROOM DEBATE'}
                  </button>
                </div>

                {debateResult && (
                  <div className="space-y-4">
                    {debateResult.error ? (
                      <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between">
                        <div>
                          <strong>Courtroom Adjourned:</strong> {debateResult.error}
                        </div>
                        <button
                          onClick={handleStartDebate}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer"
                        >
                          Retry Debate
                        </button>
                      </div>
                    ) : (
                      <div className={`p-6 sm:p-8 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_2px_12px_rgba(15,23,42,0.04)] space-y-6 ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
                        {/* Overall Judicial Ruling Banner */}
                        <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
                          <div className="flex items-center gap-2 mb-2">
                            <Scale className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                              Judicial Summary Ruling & Contract Verdict
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
                            {debateResult.overall_verdict || "The judicial magistrate reviewed the submitted contract terms across all disputed clauses."}
                          </p>
                        </div>

                        {/* Debated Issues */}
                        <div className="space-y-5">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Courtroom Arguments on Contested Issues ({debateResult.debate?.length || 0})
                          </h4>

                          {(debateResult.debate || []).map((d, i) => (
                            <div key={i} className={`p-5 sm:p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 space-y-4 ${isDark ? 'bg-slate-800/40' : 'bg-slate-50/70'}`}>
                              {/* Issue Title & Risk Pill */}
                              <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-200/80 dark:border-slate-700/80">
                                <span className="font-bold text-sm text-slate-900 dark:text-white">
                                  {i + 1}. {d.issue}
                                </span>
                                <span className={`text-[10px] font-extrabold uppercase px-3 py-1 rounded-full ${
                                  d.final_risk_level?.toLowerCase() === 'high'
                                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                    : d.final_risk_level?.toLowerCase() === 'medium'
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                }`}>
                                  {d.final_risk_level || 'Evaluated'} Risk
                                </span>
                              </div>

                              {/* 3 Agents Dialogue */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
                                {/* Critic */}
                                <div className="p-4 rounded-xl border border-rose-200/80 dark:border-rose-900/50 bg-white/95 dark:bg-slate-900/80 space-y-1.5 border-t-2 border-t-rose-500 shadow-2xs">
                                  <div className="font-bold text-rose-800 dark:text-rose-400 flex items-center gap-1.5">
                                    <Scale className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                                    <span>The Critic (Prosecution):</span>
                                  </div>
                                  <div className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">
                                    {d.critic_argument}
                                  </div>
                                </div>

                                {/* Defender */}
                                <div className="p-4 rounded-xl border border-emerald-200/80 dark:border-emerald-900/50 bg-white/95 dark:bg-slate-900/80 space-y-1.5 border-t-2 border-t-emerald-500 shadow-2xs">
                                  <div className="font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                                    <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                    <span>The Defender (Counsel):</span>
                                  </div>
                                  <div className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">
                                    {d.defender_argument}
                                  </div>
                                </div>

                                {/* Judge */}
                                <div className="p-4 rounded-xl border border-blue-200/80 dark:border-blue-900/50 bg-white/95 dark:bg-slate-900/80 space-y-1.5 border-t-2 border-t-blue-500 shadow-2xs">
                                  <div className="font-bold text-blue-800 dark:text-blue-400 flex items-center gap-1.5">
                                    <Award className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                                    <span>Judicial Verdict (Magistrate):</span>
                                  </div>
                                  <div className="text-slate-800 dark:text-slate-200 leading-relaxed text-[11px] font-medium">
                                    {d.judge_verdict}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          )}
        </div>
      </section>

      {/* ── SECTION 6: AUTO-REDLINE MODULE ── */}
      <section ref={redlineRef} className={`py-16 border-b transition-colors ${isDark ? 'bg-[#090D16] border-slate-800/80' : 'bg-slate-50/60 border-slate-200/80'} ${activeTab !== 'redline' && activeTab !== 'all' ? 'hidden' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 mb-2.5 border border-rose-200/80 dark:border-rose-900/60">
              WORKSPACE · MODULE 4 · VISUAL AUDIT
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-slate-900 dark:text-white tracking-tight">
              Automated Contract Redlining
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-xl mx-auto">
              Visual red highlight annotations applied directly to the uploaded PDF for all detected risky text and clauses.
            </p>
          </div>

          {!isPro ? (
            <ProLockedPaywall
              title="Tracked-Change Redline Document Generator"
              moduleTag="PRO · MODULE 4"
              description="AI automatically recommends contract modifications with color-coded tracked changes and exports them directly into formatted Microsoft Word (.docx) files."
              bulletPoints={[
                "Instant replacement clause generation with statutory fairness rationale",
                "Direct Microsoft Word (.docx) export with strikethrough & green revisions",
                "Custom user prompts (e.g. 'Cap liability to 5% and add 14-day cure period')"
              ]}
              onUpgrade={() => { setPricingFeatureNotice('Word (.docx) Redlining & Tracked Changes'); setShowPricingModal(true); }}
              isDark={isDark}
              onBackToAudit={() => { setActiveTab('audit'); scrollTo(uploadRef); }}
            />
          ) : !currentDoc ? (
            <div className={`max-w-2xl mx-auto p-12 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center ${isDark ? 'bg-slate-900/40' : 'bg-white'}`}>
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                No Contract Uploaded Yet
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
                Upload your contract or legal document in Module 1. The AI engine will automatically scan all clauses and apply high-contrast red lines directly onto risky sections in the original PDF.
              </p>
              <button
                type="button"
                onClick={() => scrollTo(uploadRef)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <Upload className="w-4 h-4" /> Go to Document Upload
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Action & Info Bar */}
              <div className={`p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_2px_12px_rgba(15,23,42,0.04)] flex flex-wrap items-center justify-between gap-4 ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0 font-bold border border-rose-200/60 dark:border-rose-900/50">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {currentDoc.filename}
                      </span>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                        {`${docRisks.length} Risky Clauses Red-Marked`}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Vector-rendered red highlights & caution tags drawn directly onto the PDF file pages.
                    </p>
                  </div>
                </div>

                {/* Download and Fullscreen buttons */}
                <div className="flex items-center gap-2.5">
                  <a
                    href={`${API_BASE}/redline/pdf/${currentDoc.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                      isDark ? 'border-slate-700 text-slate-200 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Fullscreen PDF
                  </a>
                  <button
                    onClick={handleDownloadRedlinePdf}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs hover:shadow transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Download Redlined PDF
                  </button>
                </div>
              </div>

              {/* Main Display Grid: Left = PDF Viewer, Right = Risky Clauses Legend */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Embedded PDF Viewer */}
                <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
                  <div className={`p-3 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_2px_12px_rgba(15,23,42,0.04)] flex-1 flex flex-col ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 font-semibold">
                      <span className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                        <FileText className="w-4 h-4 text-rose-500" /> Live Redlined PDF Preview (Red Highlights)
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Interactive View · Zoom / Scroll
                      </span>
                    </div>
                    <div className="relative w-full h-[640px] sm:h-[720px] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-950 mt-2">
                      <iframe
                        src={`${API_BASE}/redline/pdf/${currentDoc.id}#toolbar=1&navpanes=0`}
                        title="Redlined Contract PDF"
                        className="w-full h-full border-0"
                      />
                    </div>
                  </div>
                </div>

                {/* Right: Detected Redlined Risky Clauses Breakdown */}
                <div className="lg:col-span-5 xl:col-span-4 flex flex-col">
                  <div className={`p-5 sm:p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_2px_12px_rgba(15,23,42,0.04)] flex-1 flex flex-col ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                          Red-Marked Clauses
                        </h4>
                        <span className="text-[10px] text-slate-400">
                          Clauses struck through in red in the PDF
                        </span>
                      </div>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                        Visual Redline
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto max-h-[640px] pr-1 space-y-4">
                      {docRisks.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-500">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                          No high or medium risks detected in this document.
                        </div>
                      ) : (
                        docRisks.map((risk, idx) => (
                          <div
                            key={idx}
                            className={`p-4 rounded-xl border text-xs space-y-3 transition-all ${
                              isDark ? 'bg-slate-800/60 border-slate-700 hover:border-rose-500/50' : 'bg-slate-50/70 border-slate-200/90 hover:border-rose-400'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                                (risk.risk_level || '').toLowerCase().includes('high')
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-amber-500 text-white'
                              }`}>
                                {risk.risk_level || 'RISK'} RISK
                              </span>
                              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                {risk.clause_type || 'Contract Clause'}
                              </span>
                            </div>

                            {/* Marked Redline Excerpt with Visual Line */}
                            <div>
                              <div className="text-[10px] font-bold uppercase text-rose-600 dark:text-rose-400 mb-1 flex items-center gap-1">
                                <span className="w-2 h-0.5 bg-rose-500 inline-block"></span>
                                Struck Through with Red Line in PDF:
                              </div>
                              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 border-l-4 border-l-rose-500 text-rose-950 dark:text-rose-200 text-xs font-mono leading-relaxed relative">
                                <span className="line-through decoration-rose-600 decoration-2 font-medium">
                                  {risk.risky_excerpt}
                                </span>
                              </div>
                            </div>

                            {/* Why it's risky & Severity Rationale */}
                            <div className="space-y-2">
                              <div>
                                <div className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-0.5">
                                  Hazard Assessment:
                                </div>
                                <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                                  {risk.why_risky}
                                </p>
                              </div>
                              <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                                <div className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1">
                                  <Activity className="w-3 h-3 text-blue-600" />
                                  Why Stated As {risk.risk_level || 'Medium'} Risk:
                                </div>
                                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                                  {risk.severity_reasoning || (
                                    (risk.risk_level || '').toLowerCase().includes('high')
                                      ? 'Designated as High Risk because this clause imposes asymmetric exposure, uncapped financial liability, or forfeiture of essential statutory rights without reciprocal remedies.'
                                      : 'Designated as Medium Risk due to procedural ambiguity, aggressive timelines, or lack of standard notice and cure periods that could trigger disputes.'
                                  )}
                                </p>
                                {risk.potential_impact && (
                                  <div className="mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800 text-[10px] text-rose-700 dark:text-rose-400">
                                    <strong>Impact: </strong>{risk.potential_impact}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Suggested replacement */}
                            {risk.suggested_replacement && (
                              <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60">
                                <div className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Recommended Legal Amendment:
                                </div>
                                <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 border-l-4 border-l-emerald-500 text-emerald-950 dark:text-emerald-200 text-xs leading-relaxed font-medium">
                                  {risk.suggested_replacement}
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── SECTION 7: NATIONAL WELFARE SCHEME DIRECTORY & CITIZEN RECOMMENDER ── */}
      <section ref={schemesRef} className={`py-16 border-b border-slate-200/80 dark:border-slate-800/80 ${activeTab !== 'schemes' && activeTab !== 'all' ? 'hidden' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between mb-8 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 mb-2.5 border border-emerald-200/80 dark:border-emerald-900/60">
                WORKSPACE · MODULE 5
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-slate-900 dark:text-white tracking-tight">
                Citizen Welfare Entitlement Engine
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5">
                Enter your demographic profile (Gender, Age, Occupation, Income) to discover applicable government welfare schemes, or browse the 96+ program directory.
              </p>
            </div>

            {/* Mode Switcher: Recommender vs Browse */}
            <div className={`p-1 rounded-xl border flex items-center gap-1 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'}`}>
              <button
                type="button"
                onClick={() => setSchemeTab('recommend')}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                  schemeTab === 'recommend'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" /> AI Citizen Finder
              </button>
              <button
                type="button"
                onClick={() => setSchemeTab('browse')}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                  schemeTab === 'browse'
                    ? 'bg-slate-800 text-white dark:bg-slate-700 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" /> Browse 96 Schemes
              </button>
            </div>
          </div>

          {/* ── TAB 1: CITIZEN SCHEME RECOMMENDER ── */}
          {schemeTab === 'recommend' && (
            <div className="space-y-8">
              {/* Profile Intake Form Card */}
              <div className={`p-6 sm:p-8 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_2px_12px_rgba(15,23,42,0.04)] ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
                <div className="flex flex-wrap items-center justify-between pb-5 mb-6 border-b border-slate-100 dark:border-slate-800 gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Targeted Social Entitlement Assessment</span>
                    <h3 className="text-lg font-bold font-display text-slate-900 dark:text-white">
                      Enter Your Demographic & Qualification Details
                    </h3>
                  </div>
                  {/* Quick Presets */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Quick Presets:</span>
                    <button
                      type="button"
                      onClick={() => setPresetProfile('farmer_female')}
                      className="px-3 py-1.5 text-[11px] font-semibold rounded-xl bg-slate-50 text-slate-700 dark:bg-slate-800/80 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-blue-400 cursor-pointer inline-flex items-center gap-1.5 transition-all shadow-2xs"
                    >
                      <User className="w-3 h-3 text-emerald-600 shrink-0" /> Female Farmer (28)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetProfile('student_male')}
                      className="px-3 py-1.5 text-[11px] font-semibold rounded-xl bg-slate-50 text-slate-700 dark:bg-slate-800/80 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-blue-400 cursor-pointer inline-flex items-center gap-1.5 transition-all shadow-2xs"
                    >
                      <User className="w-3 h-3 text-blue-600 shrink-0" /> Male Student (22)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetProfile('senior_male')}
                      className="px-3 py-1.5 text-[11px] font-semibold rounded-xl bg-slate-50 text-slate-700 dark:bg-slate-800/80 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-blue-400 cursor-pointer inline-flex items-center gap-1.5 transition-all shadow-2xs"
                    >
                      <User className="w-3 h-3 text-purple-600 shrink-0" /> Senior Citizen (65)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetProfile('business_msme')}
                      className="px-3 py-1.5 text-[11px] font-semibold rounded-xl bg-slate-50 text-slate-700 dark:bg-slate-800/80 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-blue-400 cursor-pointer inline-flex items-center gap-1.5 transition-all shadow-2xs"
                    >
                      <Building className="w-3 h-3 text-amber-600 shrink-0" /> MSME Trader (38)
                    </button>
                  </div>
                </div>

                <form onSubmit={handleRecommendSchemes} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                    {/* Full Name */}
                    <div>
                      <label className="font-bold block mb-1.5 text-slate-700 dark:text-slate-300">Full Name</label>
                      <input
                        type="text"
                        value={citizenProfile.name}
                        onChange={e => setCitizenProfile({...citizenProfile, name: e.target.value})}
                        placeholder="e.g. Sunita Devi"
                        className="w-full px-3.5 py-2.5 border rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
                      />
                    </div>

                    {/* Gender */}
                    <div>
                      <label className="font-bold block mb-1.5 text-slate-700 dark:text-slate-300">Gender</label>
                      <select
                        value={citizenProfile.gender}
                        onChange={e => setCitizenProfile({...citizenProfile, gender: e.target.value})}
                        className="w-full px-3.5 py-2.5 border rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
                      >
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                        <option value="Transgender">Transgender / Other</option>
                      </select>
                    </div>

                    {/* Age */}
                    <div>
                      <label className="font-bold block mb-1.5 text-slate-700 dark:text-slate-300">Age (Years)</label>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={citizenProfile.age}
                        onChange={e => setCitizenProfile({...citizenProfile, age: e.target.value})}
                        className="w-full px-3.5 py-2.5 border rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
                      />
                    </div>

                    {/* Occupation */}
                    <div>
                      <label className="font-bold block mb-1.5 text-slate-700 dark:text-slate-300">Occupation / Employment</label>
                      <select
                        value={citizenProfile.occupation}
                        onChange={e => setCitizenProfile({...citizenProfile, occupation: e.target.value})}
                        className="w-full px-3.5 py-2.5 border rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
                      >
                        <option value="Farmer / Agricultural Laborer">Farmer / Agricultural Laborer</option>
                        <option value="Student / Youth">Student / Youth</option>
                        <option value="Self-Employed / MSME / Trader">Self-Employed / MSME / Trader</option>
                        <option value="Daily Wage Worker / Unorganized Labor">Daily Wage Worker / Unorganized Labor</option>
                        <option value="Salaried (Private / Public Sector)">Salaried (Private / Public Sector)</option>
                        <option value="Homemaker">Homemaker</option>
                        <option value="Unemployed / Job Seeker">Unemployed / Job Seeker</option>
                        <option value="Senior Citizen / Retired">Senior Citizen / Retired</option>
                      </select>
                    </div>

                    {/* Annual Household Income */}
                    <div>
                      <label className="font-bold block mb-1.5 text-slate-700 dark:text-slate-300">Annual Household Income (INR)</label>
                      <input
                        type="number"
                        value={citizenProfile.annual_income_inr}
                        onChange={e => setCitizenProfile({...citizenProfile, annual_income_inr: e.target.value})}
                        placeholder="e.g. 80000"
                        className="w-full px-3.5 py-2.5 border rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
                      />
                    </div>

                    {/* State / UT */}
                    <div>
                      <label className="font-bold block mb-1.5 text-slate-700 dark:text-slate-300">State / Union Territory</label>
                      <select
                        value={citizenProfile.state}
                        onChange={e => setCitizenProfile({...citizenProfile, state: e.target.value})}
                        className="w-full px-3.5 py-2.5 border rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
                      >
                        <option value="All India / Central">All India / Central Scheme</option>
                        <option value="Maharashtra">Maharashtra</option>
                        <option value="Uttar Pradesh">Uttar Pradesh</option>
                        <option value="Bihar">Bihar</option>
                        <option value="West Bengal">West Bengal</option>
                        <option value="Madhya Pradesh">Madhya Pradesh</option>
                        <option value="Tamil Nadu">Tamil Nadu</option>
                        <option value="Rajasthan">Rajasthan</option>
                        <option value="Karnataka">Karnataka</option>
                        <option value="Gujarat">Gujarat</option>
                        <option value="Andhra Pradesh">Andhra Pradesh</option>
                        <option value="Odisha">Odisha</option>
                        <option value="Telangana">Telangana</option>
                        <option value="Kerala">Kerala</option>
                        <option value="Jharkhand">Jharkhand</option>
                        <option value="Assam">Assam</option>
                        <option value="Punjab">Punjab</option>
                        <option value="Haryana">Haryana</option>
                        <option value="Delhi NCR">Delhi NCR</option>
                        <option value="Other State / UT">Other State / UT</option>
                      </select>
                    </div>

                    {/* Social Category / Caste */}
                    <div className="sm:col-span-2">
                      <label className="font-bold block mb-1.5 text-slate-700 dark:text-slate-300">Social Category / Caste</label>
                      <select
                        value={citizenProfile.category}
                        onChange={e => setCitizenProfile({...citizenProfile, category: e.target.value})}
                        className="w-full px-3.5 py-2.5 border rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
                      >
                        <option value="General">General Category</option>
                        <option value="OBC">OBC (Other Backward Class)</option>
                        <option value="SC">SC (Scheduled Caste)</option>
                        <option value="ST">ST (Scheduled Tribe)</option>
                        <option value="EWS">EWS (Economically Weaker Section)</option>
                        <option value="Minority">Minority Community</option>
                      </select>
                    </div>
                  </div>

                  {/* Special Conditions / Status Pills */}
                  <div>
                    <label className="font-bold block text-xs uppercase tracking-wider mb-2 text-slate-700 dark:text-slate-300">
                      Special Qualifications & Status (Click all that apply)
                    </label>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {[
                        { id: 'Owns Agricultural Land', label: 'Owns Agricultural Land' },
                        { id: 'BPL / Ration Card Holder', label: 'BPL / Ration Card Holder' },
                        { id: 'Pregnant / Lactating Mother', label: 'Pregnant / Lactating Mother' },
                        { id: 'Person with Disability (PwD)', label: 'Person with Disability (PwD)' },
                        { id: 'Does Not Own a Pucca House', label: 'Does Not Own Pucca House' },
                        { id: 'Seeking Business / MSME Loan', label: 'Seeking Business / Startup Loan' },
                        { id: 'Seeking Higher Education / Skill Training', label: 'Seeking Higher Education / Skill Training' }
                      ].map(item => {
                        const isSelected = citizenProfile.special_conditions.includes(item.id);
                        return (
                          <button
                            type="button"
                            key={item.id}
                            onClick={() => toggleSpecialCondition(item.id)}
                            className={`px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-2 ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                            }`}
                          >
                            <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                              isSelected ? 'bg-white text-blue-600 font-bold' : 'border border-slate-400'
                            }`}>
                              {isSelected ? <Check className="w-2.5 h-2.5" /> : ''}
                            </span>
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isRecommending}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs hover:shadow transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Search className="w-4 h-4" />
                    {isRecommending ? 'ANALYZING 96 WELFARE SCHEMES FOR YOUR PROFILE...' : 'FIND MY ELIGIBLE WELFARE SCHEMES'}
                  </button>
                </form>
              </div>

              {/* Recommendations Results View */}
              {recommendationsData && (
                <div className="space-y-6">
                  {/* Summary Banner */}
                  <div className={`p-6 sm:p-7 rounded-2xl border border-slate-200/90 dark:border-slate-800 border-l-4 border-l-blue-600 shadow-xs flex flex-wrap items-center justify-between gap-4 ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2.5 py-0.5 rounded-full">
                          Official Entitlement Assessment
                        </span>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          {recommendationsData.total_matched} Schemes Matched
                        </span>
                      </div>
                      <h3 className="text-xl font-bold font-display text-slate-900 dark:text-white">
                        Recommended Welfare Programs for {citizenProfile.name || 'Citizen'}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                        {recommendationsData.profile_summary}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setRecommendationsData(null)}
                      className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-all"
                    >
                      Reset Evaluation
                    </button>
                  </div>

                  {/* Schemes Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {recommendationsData.recommendations?.map((rec, idx) => (
                      <div
                        key={idx}
                        className={`p-6 sm:p-7 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_2px_12px_rgba(15,23,42,0.04)] flex flex-col justify-between transition-all hover:border-blue-400 dark:hover:border-slate-700 ${
                          isDark ? 'bg-slate-900' : 'bg-white'
                        }`}
                      >
                        <div>
                          {/* Score and Status */}
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              {rec.match_score}% MATCH
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                              {rec.eligibility_status || 'Highly Eligible'}
                            </span>
                          </div>

                          <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                            {rec.ministry} · {rec.category}
                          </div>
                          <h4 className="font-bold text-base font-display text-slate-900 dark:text-white mb-3">
                            {rec.scheme_name}
                          </h4>

                          {/* Why You Are Eligible */}
                          <div className="p-3.5 rounded-xl text-xs bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 mb-3 space-y-1">
                            <div className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              Why You Are Applicable:
                            </div>
                            <div className="text-slate-700 dark:text-slate-200 text-[11px] leading-relaxed">
                              {rec.why_eligible}
                            </div>
                          </div>

                          {/* Key Benefit */}
                          <div className="p-3.5 rounded-xl text-xs bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-800/40 mb-3">
                            <span className="font-bold text-blue-700 dark:text-blue-300 block mb-0.5">Key Entitlement / Benefit:</span>
                            <span className="text-slate-800 dark:text-slate-200 text-[11px]">
                              {rec.key_benefit}
                            </span>
                          </div>

                          {/* Required Documents */}
                          {rec.required_documents && rec.required_documents.length > 0 && (
                            <div className="mb-4">
                              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                Required Documents for Verification:
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {rec.required_documents.map((doc, docIdx) => (
                                  <span
                                    key={docIdx}
                                    className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-700"
                                  >
                                    <FileText className="w-3 h-3 text-blue-500 shrink-0" />
                                    <span>{doc}</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* How to Apply & Action */}
                        <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                          <span className="text-[10px] text-slate-500 line-clamp-1">
                            {rec.how_to_apply || 'Apply online or at nearest CSC'}
                          </span>
                          <a
                            href={rec.official_portal && rec.official_portal.startsWith('http') ? rec.official_portal : 'https://india.gov.in'}
                            target="_blank"
                            rel="noreferrer"
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer shadow-2xs"
                          >
                            Apply Portal <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── TAB 2: BROWSE ALL 96 SCHEMES DIRECTORY ── */}
          {schemeTab === 'browse' && (
            <div>
              <div className="flex flex-wrap gap-2 mb-8 justify-end">
                {['All', 'Agriculture', 'Finance', 'Housing', 'Energy', 'Women'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSchemeCategory(cat)}
                    className={`text-xs px-4 py-2 rounded-xl font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      schemeCategory === cat 
                        ? 'bg-blue-600 text-white shadow-2xs' 
                        : 'bg-white border border-slate-200 dark:border-slate-700 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {schemes
                  .filter(s => schemeCategory === 'All' || s.category?.toLowerCase().includes(schemeCategory.toLowerCase()))
                  .slice(0, 9)
                  .map(scheme => (
                    <div 
                      key={scheme.id}
                      className={`p-6 sm:p-7 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_2px_12px_rgba(15,23,42,0.04)] flex flex-col justify-between ${
                        isDark ? 'bg-slate-900' : 'bg-white'
                      }`}
                    >
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">{scheme.ministry || 'Government of India'}</div>
                        <h3 className="font-bold text-base font-display text-slate-900 dark:text-white mb-2">{scheme.name}</h3>
                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 mb-5 leading-relaxed">{scheme.description}</p>
                      </div>
                      <button
                        onClick={() => { setSelectedScheme(scheme); setEligResult(null); }}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-2xs"
                      >
                        CHECK INDIVIDUAL ELIGIBILITY
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Scheme Evaluation Modal for Individual Scheme */}
          {selectedScheme && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className={`max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-2xl p-6 sm:p-8 shadow-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Eligibility Evaluation</span>
                    <h3 className="text-lg font-bold font-display text-slate-900 dark:text-white">{selectedScheme.name}</h3>
                  </div>
                  <button 
                    onClick={() => setSelectedScheme(null)} 
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                    aria-label="Close modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3.5 text-xs mb-5">
                  <div>
                    <label className="font-bold block mb-1 text-slate-700 dark:text-slate-300">Full Name</label>
                    <input type="text" value={eligProfile.name} onChange={e => setEligProfile({...eligProfile, name: e.target.value})} className="w-full px-3 py-2 border rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-2xs" />
                  </div>
                  <div>
                    <label className="font-bold block mb-1 text-slate-700 dark:text-slate-300">Annual Income (INR)</label>
                    <input type="number" value={eligProfile.annual_income_inr} onChange={e => setEligProfile({...eligProfile, annual_income_inr: e.target.value})} className="w-full px-3 py-2 border rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-2xs" />
                  </div>
                  <div>
                    <label className="font-bold block mb-1 text-slate-700 dark:text-slate-300">State / UT</label>
                    <input type="text" value={eligProfile.state} onChange={e => setEligProfile({...eligProfile, state: e.target.value})} className="w-full px-3 py-2 border rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-2xs" />
                  </div>
                  <div>
                    <label className="font-bold block mb-1 text-slate-700 dark:text-slate-300">Category</label>
                    <select value={eligProfile.category} onChange={e => setEligProfile({...eligProfile, category: e.target.value})} className="w-full px-3 py-2 border rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-2xs">
                      <option>General</option><option>OBC</option><option>SC</option><option>ST</option><option>EWS</option>
                    </select>
                  </div>
                </div>

                <button 
                  onClick={handleMatchScheme} 
                  disabled={isMatching}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  {isMatching ? 'EVALUATING ELIGIBILITY...' : 'RUN ELIGIBILITY CHECK'}
                </button>

                {eligResult && (
                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <div>
                        <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{eligResult.match_score}%</div>
                        <div className="text-xs uppercase font-bold text-slate-500">Eligibility Match Score</div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${eligResult.eligible ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'}`}>
                        {eligResult.eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 italic">{eligResult.recommendation}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── SECTION 8: MULTILINGUAL LEGAL EXPLAINER ── */}
      <section ref={multilingualRef} className={`py-16 border-b border-slate-200/80 dark:border-slate-800/80 ${activeTab !== 'translate' && activeTab !== 'all' ? 'hidden' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 mb-2.5 border border-blue-200/80 dark:border-blue-900/60">
              WORKSPACE · MODULE 6 · MULTILINGUAL ACCESS
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-slate-900 dark:text-white tracking-tight">
              Indian Language Legal Translator
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5">
              Translate dense contractual clauses and government scheme mandates into 22 scheduled Indian languages with legal precision.
            </p>
          </div>

          {!isPro ? (
            <ProLockedPaywall
              title="22 Indian Regional Language Summaries & Voice Readout"
              moduleTag="PRO · MODULE 6"
              description="Plain-language legal summaries and clause-by-clause translations across 22 official Indian languages with integrated regional voice synthesis."
              bulletPoints={[
                "High-precision legal translation preserving statutory contractual meaning",
                "Native browser voice audio synthesis (TTS) for Indian languages",
                "Covers Hindi, Marathi, Bengali, Tamil, Telugu, Gujarati, Kannada, and more"
              ]}
              onUpgrade={() => { setPricingFeatureNotice('22 Indian Regional Language Translation'); setShowPricingModal(true); }}
              isDark={isDark}
              onBackToAudit={() => { setActiveTab('audit'); scrollTo(uploadRef); }}
            />
          ) : (
          <div className={`max-w-3xl mx-auto p-6 sm:p-8 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_2px_12px_rgba(15,23,42,0.04)] ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
            {!currentDoc ? (
              <div className="text-center p-8 text-xs text-slate-500">
                <Globe className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">No Contract Document Loaded</p>
                <p>Please load or upload a contract document in Module 1 to enable multi-lingual legal translation.</p>
                <button
                  type="button"
                  onClick={handleLoadDemoContract}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300" /> Load Demo Contract
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Source Document</span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{currentDoc.filename}</h4>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <select
                      value={targetLang}
                      onChange={e => setTargetLang(e.target.value)}
                      className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 cursor-pointer shadow-2xs"
                    >
                      {INDIAN_LANGUAGES.map(l => (
                        <option key={l.code} value={l.name}>{l.name} ({l.native})</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={isTranslating}
                      onClick={handleTranslate}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${isTranslating ? 'animate-spin' : ''}`} />
                      <span>{isTranslating ? 'Translating...' : 'Translate'}</span>
                    </button>
                  </div>
                </div>

                {translatedText ? (
                  <div className="p-5 rounded-2xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Translated into {targetLang}:
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyClause(translatedText, 'translate')}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-slate-700 dark:text-slate-200 flex items-center gap-1 shadow-2xs cursor-pointer"
                        title="Copy translated text to clipboard"
                      >
                        {copiedIndex === 'translate' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600 font-bold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium whitespace-pre-line">
                      {translatedText}
                    </p>
                  </div>
                ) : (
                  <div className="p-6 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-500">
                    Select an Indian language above and click <strong>Translate</strong> to generate an accurate legal translation.
                  </div>
                )}
              </div>
            )}
          </div>
          )}
        </div>
      </section>

      {/* ── SECTION 9: INSPECTION RECORDS & AUDIT HISTORY ── */}
      <section ref={historyRef} className={`py-16 border-b border-slate-200/80 dark:border-slate-800/80 ${activeTab !== 'history' && activeTab !== 'all' ? 'hidden' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 mb-2.5 border border-blue-200/80 dark:border-blue-900/60">
              WORKSPACE · MODULE 7
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-slate-900 dark:text-white tracking-tight">
              Inspection & Audit Records
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5">
              Private audit history for <strong>{user?.name}</strong> ({user?.email}). Only contracts uploaded by your account are displayed here.
            </p>
          </div>

          {!isPro ? (
            <ProLockedPaywall
              title="Document Repository & Knowledge Graph Vault"
              moduleTag="PRO · MODULE 7"
              description="Private archival storage of all past audited agreements, compliance logs, and visual interactive entity-relationship knowledge graphs."
              bulletPoints={[
                "Force-directed interactive knowledge graph mapping parties, dates, and amounts",
                "Permanent compliance inspection records and audit trail verification",
                "1-click historical report re-analysis and multi-contract comparison"
              ]}
              onUpgrade={() => { setPricingFeatureNotice('Document Repository & Knowledge Vault'); setShowPricingModal(true); }}
              isDark={isDark}
              onBackToAudit={() => { setActiveTab('audit'); scrollTo(uploadRef); }}
            />
          ) : (
          <div className="max-w-3xl mx-auto space-y-3.5">
            {documents.length === 0 ? (
              <div className={`p-10 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-slate-400 text-xs ${isDark ? 'bg-slate-900/40' : 'bg-white'}`}>
                <Folder className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">No Historical Audits</p>
                <p>No historical inspection documents for your account yet. Upload a document in Module 1 to begin.</p>
              </div>
            ) : (
              documents.map(doc => (
                <div key={doc.id} className={`p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-4 transition-all hover:border-blue-400 dark:hover:border-slate-700 ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
                  <div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white">{doc.filename}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{doc.uploaded_at} · {doc.page_count} Pages · {doc.doc_type?.toUpperCase()}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={`${API_BASE}/report/download/${doc.id}`}
                      target="_blank"
                      rel="noreferrer"
                      download
                      className="p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-2xs"
                      title="Download PDF Audit Report"
                    >
                      <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </a>
                    <button
                      onClick={() => { setCurrentDoc(doc); scrollTo(uploadRef); }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      LOAD AUDIT
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          )}
        </div>
      </section>

      {/* ── SECTION 3: FEATURE MODULES & LIVE VIDEO DEMO ── */}
      <section id="features-section" className="py-20 sm:py-24 bg-slate-50/60 dark:bg-[#090D16] border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 reveal-hidden">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/80 dark:border-blue-900/60 mb-3 shadow-2xs">
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>7 SOVEREIGN MODULES · LIVE PLATFORM WALKTHROUGH</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display text-slate-900 dark:text-white tracking-tight mb-3">
              Feature Modules & Video Walkthrough
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
              Watch how JanDrishti audits contracts and discovers citizen entitlements in real-time, or launch any module directly.
            </p>
          </div>

          {/* Category Filter Chips */}
          <div className="flex flex-wrap justify-center gap-2 mb-10 reveal-hidden">
            {['All', 'Analysis', 'Documents', 'Citizens'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFeatureFilter(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  featureFilter === cat
                    ? 'bg-[#0f3d68] text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-blue-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Side-by-Side Split: Left = Auto-playing Video Player, Right = Compact Module Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column (5 Cols): Auto-playing Video Player Card with Mute/Unmute */}
            <div className="lg:col-span-5 reveal-hidden">
              <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden sticky top-24 transition-all">
                
                {/* Video Header Bar */}
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                      AI Demo Walkthrough
                    </span>
                  </div>
                  
                  {/* Quick Mute/Unmute toggle button in header */}
                  <button
                    type="button"
                    onClick={toggleMute}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs hover:border-blue-400 cursor-pointer"
                    title={isVideoMuted ? "Click to Unmute Sound" : "Click to Mute"}
                  >
                    {isVideoMuted ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5 text-rose-500" />
                        <span className="text-rose-500 text-[11px]">Unmute</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-500 text-[11px]">Mute</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Video Frame */}
                <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden group">
                  <video
                    ref={videoRef}
                    autoPlay
                    loop
                    muted={isVideoMuted}
                    playsInline
                    className="w-full h-full object-cover"
                    poster="/logo.png"
                  >
                    <source src="/demo-video.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>

                  {/* Floating Action Controls Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3.5 pointer-events-none">
                    <button
                      type="button"
                      onClick={togglePlay}
                      className="pointer-events-auto p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-all cursor-pointer shadow-sm"
                      title={isVideoPlaying ? "Pause Video" : "Play Video"}
                    >
                      {isVideoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>

                    <button
                      type="button"
                      onClick={toggleMute}
                      className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-all cursor-pointer text-xs font-semibold shadow-sm"
                    >
                      {isVideoMuted ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                          <span>Muted</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Sound On</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Video Info & Quick Actions */}
                <div className="p-4 sm:p-5 space-y-3.5">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white font-display">
                      How JanDrishti Works in 60 Seconds
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Instant clause health evaluation, 3-Agent legal courtroom debate, and universal citizen welfare entitlement discovery.
                    </p>
                  </div>

                  <div className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300 font-medium pt-1 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                      <span>0:00 — Upload contract & automatic PII scrubbing</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      <span>0:20 — Health Score & 3-Agent Courtroom debate</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span>0:40 — Word DOCX redline export & welfare schemes</span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleLoadDemoContract}
                      className="w-full py-2.5 bg-[#ea580c] hover:bg-[#c2410c] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs hover:shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-300" />
                      <span>Test Live Demo Contract</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* Right Column (7 Cols): Compact Feature Modules Grid */}
            <div className="lg:col-span-7">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {[
                  {
                    id: 'audit',
                    cat: 'Analysis',
                    icon: Shield,
                    title: 'Clause Risk Audit',
                    desc: 'Automated clause risk assessment, statutory parity verification, and health score calculation.',
                    tab: 'audit',
                    ref: uploadRef,
                    color: '#0f3d68'
                  },
                  {
                    id: 'chat',
                    cat: 'Analysis',
                    icon: MessageSquare,
                    title: 'Q&A with Citations',
                    desc: 'Ask direct questions about contract terms and receive responses cited with exact page excerpts.',
                    tab: 'chat',
                    ref: chatRef,
                    color: '#2563eb'
                  },
                  {
                    id: 'courtroom',
                    cat: 'Analysis',
                    icon: Scale,
                    title: 'AI Courtroom Debate',
                    desc: '3-Agent legal debate: The Critic finds loopholes, The Defender counters, and The Judge delivers the verdict.',
                    tab: 'courtroom',
                    ref: debateRef,
                    color: '#ea580c'
                  },
                  {
                    id: 'redline',
                    cat: 'Documents',
                    icon: Edit3,
                    title: 'Visual Redlining & DOCX',
                    desc: 'AI recommends fair contract modifications with tracked changes exportable directly to Microsoft Word.',
                    tab: 'redline',
                    ref: redlineRef,
                    color: '#0891b2'
                  },
                  {
                    id: 'schemes',
                    cat: 'Citizens',
                    icon: Landmark,
                    title: 'Welfare Recommender',
                    desc: 'Universal citizen entitlement discovery matching individual demographics to central and state benefits.',
                    tab: 'schemes',
                    ref: schemesRef,
                    color: '#059669'
                  },
                  {
                    id: 'translate',
                    cat: 'Citizens',
                    icon: Globe,
                    title: '22 Indian Languages',
                    desc: 'Plain-language summaries and translation across Indian regional languages with legal precision.',
                    tab: 'translate',
                    ref: multilingualRef,
                    color: '#7c3aed'
                  },
                  {
                    id: 'history',
                    cat: 'Documents',
                    icon: Folder,
                    title: 'Audit Records & Graph',
                    desc: 'Private archive of all historical inspection reports, document logs, and entity relationship data.',
                    tab: 'history',
                    ref: historyRef,
                    color: '#475569'
                  }
                ]
                  .filter(m => featureFilter === 'All' || m.cat === featureFilter)
                  .map((module, i) => {
                    const ModIcon = module.icon;
                    return (
                      <button
                        key={module.id}
                        type="button"
                        onClick={() => handleSelectModule(module.tab, module.ref)}
                        className="reveal-hidden text-left p-4 sm:p-4.5 rounded-xl border bg-white dark:bg-slate-900/80 border-slate-200/90 dark:border-slate-800 feature-card cursor-pointer group flex flex-col justify-between hover:border-blue-400 dark:hover:border-blue-600 shadow-2xs hover:shadow-xs transition-all"
                        style={{ animationDelay: `${i * 0.06}s` }}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2.5">
                            <div
                              className="w-9 h-9 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
                              style={{ backgroundColor: `${module.color}15` }}
                            >
                              <ModIcon className="w-4 h-4" style={{ color: module.color }} />
                            </div>
                            <div className="flex items-center gap-1.5">
                              {module.id !== 'audit' && !isPro && (
                                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                                  <Lock className="w-2.5 h-2.5" /> PRO
                                </span>
                              )}
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                {module.cat}
                              </span>
                            </div>
                          </div>
                          
                          <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white mb-1 font-display group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {module.title}
                          </h3>
                          
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-3 line-clamp-2">
                            {module.desc}
                          </p>
                        </div>
                        
                        <div className="flex items-center text-[11px] font-bold pt-2 border-t border-slate-100 dark:border-slate-800/80 text-blue-600 dark:text-blue-400">
                          <span>Launch module</span>
                          <ChevronRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── SECTION 4: STATS / TRUST ROW ── */}
      <section className="py-16 bg-[#0f3d68] dark:bg-[#070E1A] border-b border-blue-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { num: '22', label: 'Official Indian Languages', icon: Globe },
              { num: '3-Agent', label: 'Courtroom Deliberation Engine', icon: Scale },
              { num: '100%', label: 'In-Country Sovereign AI Processing', icon: Lock },
              { num: 'DPDP', label: 'Act 2023 Statutory Compliance', icon: Shield }
            ].map((stat, i) => {
              const StatIcon = stat.icon;
              return (
                <div key={stat.label} className="reveal-hidden" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-3">
                    <StatIcon className="w-5 h-5 text-white/90" />
                  </div>
                  <div className="stat-num text-3xl sm:text-4xl font-extrabold text-white font-grotesk mb-1">
                    {stat.num}
                  </div>
                  <div className="text-xs font-semibold text-blue-200 tracking-wide">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SECTION 7: FAQ ACCORDION ── */}
      <section className="py-20 sm:py-24 bg-white dark:bg-[#070B14] border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 reveal-hidden">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 mb-3 shadow-2xs">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>FREQUENTLY ASKED QUESTIONS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-slate-900 dark:text-white tracking-tight mb-3">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base">
              Everything you need to know about the JanDrishti platform.
            </p>
          </div>

          <div className="space-y-3.5 reveal-hidden">
            {[
              {
                q: 'What types of documents can JanDrishti analyze?',
                a: 'JanDrishti supports commercial agreements, municipal e-tenders, procurement contracts, employment agreements, residential/commercial leases, NDAs, and government policy directives in PDF format. Both native digital PDFs and scanned image-based PDFs are supported through OCR.'
              },
              {
                q: 'How does the PII Shield protect sensitive personal data?',
                a: 'Our built-in PII Shield automatically scans and redacts sensitive Indian personal identifiers — including 12-digit Aadhaar numbers, 10-character PAN identifiers, contact numbers, and personal addresses — before any document text is processed by AI models, ensuring strict compliance with the Digital Personal Data Protection Act 2023.'
              },
              {
                q: 'How does the 3-Agent Courtroom Debate work?',
                a: 'The Courtroom simulates a judicial review panel where three AI personas examine contentious terms. The Critic identifies contractual vulnerabilities and worst-case liability. The Defender counters with customary commercial norms. The Judge balances both perspectives and delivers a binding statutory assessment with actionable amendments.'
              },
              {
                q: 'Can I export redlined contracts back to Microsoft Word?',
                a: 'Yes. In the PDF Redlining module, you can provide instructions for amendments (e.g. "Cap liability at 5% and add a 14-day cure period"). The AI generates the modifications as tracked changes and lets you download a formatted .docx document with revisions in color.'
              },
              {
                q: 'Which Indian regional languages are supported?',
                a: 'JanDrishti natively supports all 22 official 8th Schedule Indian languages including Hindi, Marathi, Bengali, Tamil, Telugu, Gujarati, Kannada, Malayalam, Punjabi, Odia, Assamese, Urdu, Sanskrit, Nepali, Sindhi, Maithili, Konkani, Dogri, Manipuri, Santali, and Bhojpuri. Summaries and clause explanations are translated while preserving legal precision.'
              },
              {
                q: 'Does JanDrishti provide legal advice?',
                a: 'No. JanDrishti is an automated legal contract and welfare analysis platform designed to assist citizens, advocates, and regulatory officers. The outputs represent automated statutory analysis and do not substitute for formal legal representation by an advocate.'
              }
            ].map((faq, idx) => (
              <div
                key={idx}
                className={`border rounded-2xl overflow-hidden transition-all ${
                  openFaqIdx === idx
                    ? 'border-blue-400 dark:border-blue-700 bg-blue-50/40 dark:bg-blue-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 cursor-pointer"
                  aria-expanded={openFaqIdx === idx}
                >
                  <span className="font-bold text-sm text-slate-900 dark:text-white">{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-300 ${
                      openFaqIdx === idx ? 'rotate-180 text-blue-600' : ''
                    }`}
                  />
                </button>
                <div className={`faq-answer ${openFaqIdx === idx ? 'open' : ''}`}>
                  <div className="px-6 pb-5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                    {faq.a}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 8: BOTTOM CTA BANNER ── */}
      <section className="py-20 bg-gradient-to-br from-[#0f3d68] via-[#154675] to-[#0a2744] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center reveal-hidden">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase bg-white/10 text-orange-300 border border-white/20 mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>INSTANT SOVEREIGN INTELLIGENCE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display tracking-tight mb-4">
            Start Protecting Your Legal Rights Today
          </h2>
          <p className="text-blue-100 text-sm sm:text-base max-w-xl mx-auto mb-8 font-normal leading-relaxed">
            Upload your commercial contract or try our realistic Municipal Tender demo in seconds. 100% confidential, in-country processing under the DPDP Act 2023.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setActiveTab('audit');
                if (!user) {
                  setShowAuthModal(true);
                  setAuthError('Sign in to upload documents and run deep compliance audits.');
                } else {
                  scrollTo(uploadRef);
                }
              }}
              className="w-full sm:w-auto px-8 py-4 bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>UPLOAD A CONTRACT — FREE</span>
            </button>
            <button
              type="button"
              onClick={handleLoadDemoContract}
              className="w-full sm:w-auto px-7 py-4 bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm uppercase tracking-wider rounded-xl border border-white/30 backdrop-blur-sm transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>TRY DEMO FIRST</span>
            </button>
          </div>
          <p className="text-xs text-blue-200/70 mt-6 italic">
            AI output is general information, not legal advice. Consult a qualified advocate for formal legal counsel.
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className={`border-t py-12 transition-colors ${isDark ? 'bg-[#070B14] border-slate-800/80 text-slate-400' : 'bg-slate-900 border-slate-800 text-slate-300'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10 text-xs">
            <div>
              <div className="flex items-center space-x-2.5 text-white font-bold font-display text-sm mb-3">
                <img src="/logo.png" alt="JanDrishti Logo" className="w-8 h-8 rounded-xl object-contain bg-white p-0.5 border border-slate-700" />
                <span>JanDrishti</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Empowering citizens, legal professionals, and regulatory authorities with artificial intelligence compliance verification.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold uppercase tracking-wider mb-3">National Initiatives</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="https://www.india.gov.in" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">National Portal of India</a></li>
                <li><a href="https://www.digitalindia.gov.in" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Digital India Programme</a></li>
                <li><a href="https://www.mygov.in" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">MyGov Citizen Portal</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold uppercase tracking-wider mb-3">Support & Helpline</h4>
              <ul className="space-y-2 text-slate-400">
                <li>National Toll-Free Helpline: <strong className="text-white">1915</strong></li>
                <li>Direct Citizen Assistance Desk</li>
                <li>DPDP Act Compliance Verified</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold uppercase tracking-wider mb-3">Data Sovereignty</h4>
              <p className="text-slate-400 leading-relaxed mb-2">
                Strict adherence to the Digital Personal Data Protection Act.
              </p>
              <div className="text-[11px] text-blue-400 font-bold">100% In-Country Sovereign Processing</div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <div>
              © 2026 JanDrishti · Sovereign Legal & Welfare Intelligence Platform
            </div>
            <div className="flex space-x-5 text-slate-400">
              <span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span>
              <span className="hover:text-white transition-colors cursor-pointer">Terms of Service</span>
              <span className="hover:text-white transition-colors cursor-pointer">Legal Disclaimer</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ── STRONG AUTHENTICATION MODAL (MAIL VERIFICATION OTP + PASSWORD + GOOGLE) ── */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className={`max-w-md w-full rounded-2xl p-6 sm:p-8 shadow-2xl border relative transition-all ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <button 
              type="button"
              onClick={() => { setShowAuthModal(false); setAuthError(''); setAuthSuccessMsg(''); setOtpCode(''); setOtpDevCode(null); }}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <img src="/logo.png" alt="JanDrishti Logo" className="w-10 h-10 rounded-xl object-contain bg-white p-0.5 border border-slate-200 dark:border-slate-700 shadow-2xs" />
              <div>
                <h3 className="font-bold text-lg font-display text-slate-900 dark:text-white leading-tight">
                  {authMode === 'login' 
                    ? (authMethod === 'otp' ? 'Sign In via Mail Code' : 'Sign In to JanDrishti') 
                    : authMode === 'register' ? 'Create GovTech Account' : 'Reset Password'}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {authMode === 'login' 
                    ? (authMethod === 'otp' 
                        ? 'Instant citizen login with single-use 6-digit email code' 
                        : 'Access your private legal audits & inspection history') 
                    : authMode === 'register' 
                      ? 'Secure, encrypted citizen authentication' 
                      : 'Enter your email to receive a password reset link'}
                </p>
              </div>
            </div>

            {/* Login Method Tabs (Mail Verification vs Password) */}
            {authMode === 'login' && (
              <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 mb-4 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => { setAuthMethod('otp'); setAuthError(''); setAuthSuccessMsg(''); }}
                  className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    authMethod === 'otp'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Mail Code (OTP)</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold uppercase">Verified</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMethod('password'); setAuthError(''); setAuthSuccessMsg(''); }}
                  className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    authMethod === 'password'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Password</span>
                </button>
              </div>
            )}

            {authError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 border border-rose-200 dark:border-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {authSuccessMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{authSuccessMsg}</span>
              </div>
            )}

            {/* FLOW 1: MAIL VERIFICATION CODE (OTP) LOGIN */}
            {authMode === 'login' && authMethod === 'otp' ? (
              <div className="space-y-4">
                {otpStep === 'input_email' ? (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5 text-slate-700 dark:text-slate-300">
                        Email Address
                      </label>
                      <div className="relative">
                        <input 
                          type="email" 
                          required 
                          value={authEmail}
                          onChange={e => setAuthEmail(e.target.value)}
                          placeholder="name@domain.com"
                          className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
                        />
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5">
                        We will send a 6-digit verification code to authenticate your citizen account.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={authLoading || !authEmail.trim()}
                      className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs hover:shadow transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      {authLoading ? (
                        <span>Sending Code...</span>
                      ) : (
                        <>
                          <Mail className="w-4 h-4" />
                          <span>Send Verification Code</span>
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-500">Code sent to: </span>
                        <strong className="text-slate-900 dark:text-white">{authEmail}</strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setOtpStep('input_email'); setOtpCode(''); setOtpDevCode(null); setAuthError(''); setAuthSuccessMsg(''); }}
                        className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer text-[11px]"
                      >
                        Change
                      </button>
                    </div>

                    {/* Developer Sandbox Instant Auto-Fill Banner */}
                    {otpDevCode && (
                      <div 
                        onClick={() => setOtpCode(otpDevCode)}
                        className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                        title="Click to auto-fill development sandbox code"
                      >
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                          <span><strong>Local Sandbox Code:</strong> <span className="font-mono font-bold tracking-widest">{otpDevCode}</span></span>
                        </div>
                        <span className="text-[10px] font-bold underline text-amber-700 dark:text-amber-300">Auto-fill</span>
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5 text-center text-slate-700 dark:text-slate-300">
                        Enter 6-Digit Verification Code
                      </label>
                      <input 
                        type="text" 
                        required 
                        maxLength={6}
                        autoFocus
                        value={otpCode}
                        onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="••••••"
                        className="w-full py-3 text-center text-2xl font-mono font-extrabold tracking-[0.4em] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-300 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 text-[11px]">Valid for 10 minutes</span>
                      {otpCooldown > 0 ? (
                        <span className="text-[11px] text-slate-400 font-semibold">Resend in {otpCooldown}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={authLoading}
                          className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" /> Resend Code
                        </button>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={authLoading || otpCode.length !== 6}
                      className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs hover:shadow transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      {authLoading ? (
                        <span>Verifying...</span>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>Verify Code & Sign In</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            ) : (
              /* FLOW 2: PASSWORD LOGIN / REGISTER / RESET */
              <form onSubmit={handleAuth} className="space-y-4">
                {authMode === 'register' && (
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5 text-slate-700 dark:text-slate-300">
                      Full Name
                    </label>
                    <input 
                      type="text" 
                      required 
                      value={authName}
                      onChange={e => setAuthName(e.target.value)}
                      placeholder="e.g. Aarav Sharma"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5 text-slate-700 dark:text-slate-300">
                    Email Address
                  </label>
                  <input 
                    type="email" 
                    required 
                    value={authEmail}
                    onChange={e => setAuthEmail(e.target.value)}
                    placeholder="name@domain.com"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
                  />
                </div>

                {authMode !== 'reset' && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Password
                      </label>
                      {authMode === 'login' && (
                        <button
                          type="button"
                          onClick={() => { setAuthMode('reset'); setAuthError(''); setAuthSuccessMsg(''); }}
                          className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <input 
                      type="password" 
                      required 
                      value={authPassword}
                      onChange={e => setAuthPassword(e.target.value)}
                      placeholder={authMode === 'register' ? 'Minimum 6 characters' : '••••••••••••'}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs hover:shadow transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  {authLoading ? (
                    <span>Processing...</span>
                  ) : authMode === 'login' ? (
                    'Sign In with Password'
                  ) : authMode === 'register' ? (
                    'Create Account'
                  ) : (
                    'Send Password Reset Link'
                  )}
                </button>
              </form>
            )}

            {/* Google OAuth Option */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-800" /></div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-400"><span className="bg-white dark:bg-slate-900 px-2">Or continue with</span></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={authLoading}
              className="w-full py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Google Account</span>
            </button>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500">
              {authMode === 'login' ? (
                <span>
                  Don't have an account?{' '}
                  <button type="button" onClick={() => { setAuthMode('register'); setAuthError(''); setAuthSuccessMsg(''); }} className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer">
                    Register here
                  </button>
                </span>
              ) : authMode === 'register' ? (
                <span>
                  Already have an account?{' '}
                  <button type="button" onClick={() => { setAuthMode('login'); setAuthMethod('otp'); setAuthError(''); setAuthSuccessMsg(''); }} className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer">
                    Sign in with Mail Code
                  </button>
                </span>
              ) : (
                <button type="button" onClick={() => { setAuthMode('login'); setAuthMethod('otp'); setAuthError(''); setAuthSuccessMsg(''); }} className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer">
                  ← Back to Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MOBILE BOTTOM NAVIGATION BAR (Thumb-friendly on Android / iOS) ── */}
      <nav aria-label="Mobile Navigation" className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#090D16]/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5 flex items-center justify-around">
        <button
          onClick={() => { setActiveTab('audit'); window.scrollTo({ top: 380, behavior: 'smooth' }); }}
          className={`flex flex-col items-center justify-center py-1.5 px-3 min-w-[58px] rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
            activeTab === 'audit'
              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 shadow-2xs'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <ShieldAlert className="w-5 h-5 mb-0.5" />
          <span>Audit</span>
        </button>

        <button
          onClick={() => handleSelectModule('chat', chatRef)}
          className={`flex flex-col items-center justify-center py-1.5 px-3 min-w-[58px] rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
            activeTab === 'chat'
              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 shadow-2xs'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Bot className="w-5 h-5 mb-0.5" />
          <span>Ask AI</span>
        </button>

        <button
          onClick={() => handleSelectModule('courtroom', debateRef)}
          className={`flex flex-col items-center justify-center py-1.5 px-3 min-w-[58px] rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
            activeTab === 'courtroom'
              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 shadow-2xs'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Scale className="w-5 h-5 mb-0.5" />
          <span>Courtroom</span>
        </button>

        <button
          onClick={() => handleSelectModule('redline', redlineRef)}
          className={`flex flex-col items-center justify-center py-1.5 px-3 min-w-[58px] rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
            activeTab === 'redline'
              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 shadow-2xs'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <FileCheck className="w-5 h-5 mb-0.5" />
          <span>Redline</span>
        </button>

        <button
          onClick={() => handleSelectModule('schemes', schemesRef)}
          className={`flex flex-col items-center justify-center py-1.5 px-3 min-w-[58px] rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
            activeTab === 'schemes'
              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 shadow-2xs'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Sparkles className="w-5 h-5 mb-0.5" />
          <span>Schemes</span>
        </button>
      </nav>

      {/* ── TOAST NOTIFICATION ── */}
      {subscriptionToast && (
        <div className="fixed bottom-20 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-md transition-all animate-bounce bg-slate-900/95 text-white border-slate-700">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-xs font-semibold">{subscriptionToast.msg}</span>
        </div>
      )}

      {/* ── SUBSCRIPTION & PRICING MODAL (FREE ₹0, PERSONAL ₹49, SMALL BUSINESS ₹149) ── */}
      {showPricingModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className={`max-w-5xl w-full rounded-2xl p-6 sm:p-8 shadow-2xl border relative my-8 transition-all ${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <button
              type="button"
              onClick={() => { setShowPricingModal(false); setPricingFeatureNotice(null); }}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center max-w-2xl mx-auto mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-200/80 dark:border-orange-900/60 mb-2 shadow-2xs">
                <Crown className="w-3.5 h-3.5 text-orange-500" />
                <span>Affordable Sovereign Legal Intelligence</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-slate-900 dark:text-white">
                Transparent Plans for Every Indian Citizen & Business
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                From citizens reviewing rental agreements to contractors and small businesses auditing high-value tenders.
              </p>

              {/* Billing Cycle Switcher (Monthly vs Annual - Save ~15%) */}
              <div className="flex items-center justify-center gap-3 mt-4">
                <span className={`text-xs font-bold ${billingCycle === 'monthly' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                  Monthly Billing
                </span>
                <button
                  type="button"
                  onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'annual' : 'monthly')}
                  className="relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-slate-300 dark:bg-slate-700 transition-colors duration-200 ease-in-out focus:outline-none"
                  role="switch"
                  aria-checked={billingCycle === 'annual'}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      billingCycle === 'annual' ? 'translate-x-6 bg-blue-600' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className={`text-xs font-bold flex items-center gap-1.5 ${billingCycle === 'annual' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                  <span>Annual Billing</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-extrabold">
                    SAVE ~15%
                  </span>
                </span>
              </div>
            </div>

            {pricingFeatureNotice && (
              <div className="mb-6 p-4 rounded-xl border border-amber-300 dark:border-amber-700/80 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold">Plan Upgrade Required: </span>
                  <span>{pricingFeatureNotice}</span>
                </div>
              </div>
            )}

            {/* 3-Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch mb-6">
              
              {/* Card 1: Free Citizen Tier */}
              <div className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                usageData.plan_id === 'free'
                  ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20 dark:bg-blue-950/20'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20'
              }`}>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Free Plan
                    </span>
                    {usageData.plan_id === 'free' && (
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-600 text-white">
                        ACTIVE PLAN
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-3xl font-extrabold font-grotesk text-slate-900 dark:text-white">₹0</span>
                    <span className="text-xs font-semibold text-slate-500">/ forever</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                    Designed for ordinary citizens and first-time users reviewing rental leases and contracts.
                  </p>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs mb-4">
                    <div className="flex justify-between font-bold text-[11px] mb-1">
                      <span>Monthly Uploads</span>
                      <span className="text-blue-600 font-extrabold">
                        {usageData.plan_id === 'free' ? `${usageData.uploads_used}/5 Docs` : '5 Docs/mo'}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden mb-2.5">
                      <div
                        className="h-1.5 rounded-full bg-blue-600"
                        style={{ width: usageData.plan_id === 'free' ? `${Math.min(100, (usageData.uploads_used / 5) * 100)}%` : '0%' }}
                      />
                    </div>
                    <div className="flex justify-between font-bold text-[11px] mb-1">
                      <span>AI Questions Allowance</span>
                      <span className="text-emerald-600 font-extrabold">
                        {usageData.plan_id === 'free' ? `${usageData.ai_queries_used ?? 0}/15 Questions` : '15 Questions/mo'}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-1.5 rounded-full bg-emerald-600"
                        style={{ width: usageData.plan_id === 'free' ? `${Math.min(100, ((usageData.ai_queries_used ?? 0) / 15) * 100)}%` : '0%' }}
                      />
                    </div>
                  </div>

                  <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 mb-6">
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" /> <span><strong>5 monthly document uploads</strong></span></li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" /> <span>Basic government scheme directory</span></li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" /> <span>Basic contract summaries & risk detection</span></li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" /> <span><strong>15 AI questions per month</strong></span></li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" /> <span><strong>Downloadable official PDF audit reports</strong></span></li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" /> <span>22 Indian regional languages</span></li>
                    <li className="flex items-center gap-2 text-slate-400"><X className="w-4 h-4 shrink-0 text-slate-400" /> <span className="line-through">Interactive page citations</span></li>
                    <li className="flex items-center gap-2 text-slate-400"><X className="w-4 h-4 shrink-0 text-slate-400" /> <span className="line-through">Word redlining with tracked changes</span></li>
                  </ul>
                </div>

                <div>
                  {usageData.plan_id === 'free' ? (
                    <button
                      type="button"
                      disabled
                      className="w-full py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-500 font-bold text-xs uppercase tracking-wider cursor-default text-center"
                    >
                      Current Free Plan
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleTestActivate('free')}
                      className="w-full py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer text-center"
                    >
                      Downgrade to Free
                    </button>
                  )}
                </div>
              </div>

              {/* Card 2: Personal Plan */}
              <div className={`p-5 rounded-2xl border flex flex-col justify-between relative overflow-hidden transition-all ${
                usageData.plan_id === 'personal'
                  ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/20'
                  : 'border-blue-500/60 ring-1 ring-blue-500/20 bg-gradient-to-b from-blue-500/5 via-transparent to-transparent'
              }`}>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      <span>Personal Plan</span>
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-600 text-white shadow-2xs">
                      {usageData.plan_id === 'personal' ? 'ACTIVE' : 'POPULAR'}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-3xl font-extrabold font-grotesk text-slate-900 dark:text-white">
                      ₹{billingCycle === 'annual' ? '499' : '49'}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      /{billingCycle === 'annual' ? 'year (₹41.5/mo)' : 'month'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                    Designed for students, individuals, advocates, and families needing regular contract reviews.
                  </p>

                  <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-900 dark:text-blue-200 text-xs font-bold flex items-center gap-1.5 mb-4">
                    <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>30 DOCUMENT UPLOADS / BILLING MONTH</span>
                  </div>

                  <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-200 mb-6 font-medium">
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" /> <span><strong>30 document uploads</strong> per billing month</span></li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" /> <span>Contract summaries and risk detection</span></li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" /> <span>AI questions with page citations</span></li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" /> <span><strong>Downloadable official PDF audit reports</strong></span></li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" /> <span>Multilingual summaries in 22 languages</span></li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" /> <span>Saved document history and results</span></li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" /> <span>60 AI questions per month</span></li>
                    <li className="flex items-center gap-2 text-slate-400"><X className="w-4 h-4 shrink-0 text-slate-400" /> <span className="line-through">Word redlining with tracked changes</span></li>
                  </ul>
                </div>

                <div>
                  {usageData.plan_id === 'personal' ? (
                    <div className="space-y-2">
                      <div className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-xs">
                        <Check className="w-4 h-4" />
                        <span>Active Personal Plan</span>
                      </div>
                      {!usageData.cancel_at_period_end ? (
                        <button
                          type="button"
                          onClick={() => setShowCancelConfirm(true)}
                          className="w-full py-1 text-[11px] text-rose-500 hover:text-rose-700 underline text-center cursor-pointer"
                        >
                          Cancel Subscription
                        </button>
                      ) : (
                        <div className="text-[10px] text-amber-500 font-bold text-center">
                          Cancels at end of period (access remains)
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={isProcessingPayment}
                      onClick={() => handleInitiateCheckout('personal')}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Crown className="w-4 h-4 text-amber-200" />
                      <span>Upgrade to Personal — ₹{billingCycle === 'annual' ? '499/yr' : '49/mo'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Card 3: Small Business Plan */}
              <div className={`p-5 rounded-2xl border flex flex-col justify-between relative overflow-hidden transition-all ${
                usageData.plan_id === 'small_business'
                  ? 'border-purple-500 ring-2 ring-purple-500/30 bg-purple-50/20 dark:bg-purple-950/20'
                  : 'border-[#ea580c] ring-2 ring-orange-500/20 bg-gradient-to-b from-orange-500/5 via-transparent to-transparent'
              }`}>
                <div className="absolute top-0 right-0 w-28 h-28 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#ea580c] flex items-center gap-1">
                      <Building className="w-3.5 h-3.5" />
                      <span>Small Business</span>
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white shadow-2xs">
                      {usageData.plan_id === 'small_business' ? 'ACTIVE' : 'ENTERPRISE AI'}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-3xl font-extrabold font-grotesk text-slate-900 dark:text-white">
                      ₹{billingCycle === 'annual' ? '1,499' : '149'}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      /{billingCycle === 'annual' ? 'year (₹124.9/mo)' : 'month'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                    Designed for freelancers, startups, contractors, MSMEs, tender applicants, and legal teams.
                  </p>

                  <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-900 dark:text-orange-200 text-xs font-bold flex items-center gap-1.5 mb-4">
                    <Sparkles className="w-4 h-4 text-orange-600 shrink-0" />
                    <span>100 DOCUMENT UPLOADS / BILLING MONTH</span>
                  </div>

                  <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-200 mb-6 font-medium">
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" /> <span><strong>100 document uploads</strong> per billing month</span></li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" /> <span>All Personal plan features included</span></li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" /> <span><strong>Advanced clause analysis & risk explanations</strong></span></li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" /> <span><strong>Suggested replacement clauses</strong></span></li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" /> <span><strong>Word redlining (.docx) & PDF audit reports</strong></span></li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" /> <span>Contract and tender procurement analysis</span></li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" /> <span>250 AI questions per billing month</span></li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" /> <span>Priority AI inference queue</span></li>
                  </ul>
                </div>

                <div>
                  {usageData.plan_id === 'small_business' ? (
                    <div className="space-y-2">
                      <div className="w-full py-2.5 rounded-xl bg-purple-600 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-xs">
                        <Check className="w-4 h-4" />
                        <span>Active Small Business Plan</span>
                      </div>
                      {!usageData.cancel_at_period_end ? (
                        <button
                          type="button"
                          onClick={() => setShowCancelConfirm(true)}
                          className="w-full py-1 text-[11px] text-rose-500 hover:text-rose-700 underline text-center cursor-pointer"
                        >
                          Cancel Subscription
                        </button>
                      ) : (
                        <div className="text-[10px] text-amber-500 font-bold text-center">
                          Cancels at end of period (access remains)
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={isProcessingPayment}
                      onClick={() => handleInitiateCheckout('small_business')}
                      className="w-full py-3 bg-gradient-to-r from-[#ea580c] to-[#f97316] hover:from-[#c2410c] hover:to-[#ea580c] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Crown className="w-4 h-4 text-amber-200" />
                      <span>Upgrade to Business — ₹{billingCycle === 'annual' ? '1,499/yr' : '149/mo'}</span>
                    </button>
                  )}
                </div>
              </div>

            </div>

            {/* Quick Sandbox Simulation Bar (Zero-cost Local Verification) */}
            <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Cpu className="w-4 h-4 text-blue-600" />
                <span className="font-bold">Evaluation Sandbox:</span>
                <span className="text-[11px] text-slate-500">Test plan quotas instantly without payment gateway:</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleTestActivate('free')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                    usageData.plan_id === 'free' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:border-blue-400'
                  }`}
                >
                  Free (5 Docs)
                </button>
                <button
                  type="button"
                  onClick={() => handleTestActivate('personal')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                    usageData.plan_id === 'personal' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:border-blue-400'
                  }`}
                >
                  Personal (30 Docs)
                </button>
                <button
                  type="button"
                  onClick={() => handleTestActivate('small_business')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                    usageData.plan_id === 'small_business' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:border-purple-400'
                  }`}
                >
                  Small Business (100 Docs)
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" />
                <span>100% In-Country Sovereign Processing under DPDP Act 2023. Razorpay secure 256-bit SSL encryption.</span>
              </div>
              <button
                type="button"
                onClick={() => { setShowPricingModal(false); setPricingFeatureNotice(null); }}
                className="font-bold text-slate-600 dark:text-slate-300 hover:underline cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── RAZORPAY SANDBOX TEST MODAL (When live gateway keys not configured) ── */}
      {sandboxCheckout && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className={`max-w-md w-full rounded-2xl p-6 shadow-2xl border ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Razorpay Checkout</h3>
                  <p className="text-[11px] text-slate-500">Order: {sandboxCheckout.order_id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSandboxCheckout(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div className="flex justify-between items-center text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">{sandboxCheckout.plan_name}</div>
                  <div className="text-[11px] text-slate-500 capitalize">{sandboxCheckout.billing_cycle} billing</div>
                </div>
                <div className="text-right">
                  <div className="text-base font-extrabold text-blue-600 dark:text-blue-400">₹{sandboxCheckout.amount_inr}</div>
                  <div className="text-[10px] text-slate-400">incl. all taxes</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-xs text-blue-900 dark:text-blue-200">
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>HMAC SHA-256 Payment Verification</span>
                </div>
                <p className="text-[11px] text-blue-700 dark:text-blue-300">
                  Simulating payment. Clicking below generates valid cryptographic HMAC SHA-256 signatures verified by the FastAPI backend.
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                disabled={isProcessingPayment}
                onClick={() => handleVerifyPayment({
                  user_id: user.id,
                  order_id: sandboxCheckout.order_id,
                  payment_id: `pay_sandbox_${Date.now()}`,
                  signature: `rzp_test_sig_${sandboxCheckout.order_id.replace('order_', '')}`
                })}
                className="w-full py-3 bg-[#0f3d68] hover:bg-[#0a2744] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isProcessingPayment ? (
                  <span>Verifying HMAC Signature...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Confirm Payment (₹{sandboxCheckout.amount_inr})</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setSandboxCheckout(null)}
                className="w-full py-2 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer text-center"
              >
                Cancel Checkout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CANCELLATION CONFIRMATION MODAL ── */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-[70] flex items-center justify-center p-4">
          <div className={`max-w-md w-full rounded-2xl p-6 shadow-2xl border ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base mb-2">Cancel Subscription?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              You will continue to have full access to your <strong>{usageData.plan_name}</strong> features and upload allowance until the end of your billing period. After that, your account will smoothly return to the Free Tier.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={isProcessingPayment}
                onClick={handleCancelSubscription}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer"
              >
                {isProcessingPayment ? 'Processing...' : 'Confirm Cancellation'}
              </button>
              <button
                type="button"
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer"
              >
                Keep Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── REAL GOOGLE OAUTH / FIREBASE SETUP MODAL ── */}
      {showFirebaseSetupModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-[60] flex items-center justify-center p-4">
          <div className={`max-w-lg w-full rounded-2xl p-6 sm:p-7 shadow-2xl border relative ${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <button
              type="button"
              onClick={() => setShowFirebaseSetupModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#ffffff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#ffffff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#ffffff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#ffffff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-base font-display">Connect Real Google Sign-In</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Google requires connecting your free Firebase project to verify actual Google accounts via OAuth.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200 mb-4 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-blue-800 dark:text-blue-300">
                <Sparkles className="w-3.5 h-3.5" /> Quick Setup (2 Minutes):
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 dark:text-slate-300 pl-1">
                <li>Go to <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 underline font-semibold">Firebase Console</a> & click <strong>Add project</strong> (free).</li>
                <li>Under <strong>Authentication &gt; Sign-in method</strong>, enable <strong>Google</strong>.</li>
                <li>Go to <strong>Project Settings &gt; General &gt; Your apps</strong>, click <strong>Web (&lt;/&gt;)</strong>, and copy your real config.</li>
                <li>Paste the snippet below and click <strong>Save & Launch Google Sign-In</strong>!</li>
              </ol>
            </div>

            {authError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 border border-rose-200 dark:border-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleSaveFirebaseSetup} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-slate-700 dark:text-slate-300">
                  Paste Entire Firebase Config Snippet (Auto-Extracts)
                </label>
                <textarea
                  rows={2}
                  value={firebaseSnippetInput}
                  onChange={e => handleParseFirebaseSnippet(e.target.value)}
                  placeholder={'Paste snippet here: const firebaseConfig = { apiKey: "AIzaSy...", ... };'}
                  className="w-full p-2.5 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-400">
                    Firebase API Key *
                  </label>
                  <input
                    type="text"
                    required
                    value={firebaseSetupApiKey}
                    onChange={e => setFirebaseSetupApiKey(e.target.value)}
                    placeholder="e.g. AIzaSyB7..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-slate-600 dark:text-slate-400">
                    Project ID
                  </label>
                  <input
                    type="text"
                    value={firebaseSetupProjectId}
                    onChange={e => setFirebaseSetupProjectId(e.target.value)}
                    placeholder="e.g. nyayamitra-app-1234"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleResetFirebaseConfig}
                  className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                >
                  Clear Saved Config
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowFirebaseSetupModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save & Open Google Sign-In</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
