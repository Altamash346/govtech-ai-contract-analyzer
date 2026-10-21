import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, FileText, Upload, MessageSquare, Scale, Share2, Edit3, 
  Globe, Landmark, Folder, Sun, Moon, LogOut, CheckCircle, AlertTriangle, 
  XCircle, Send, Volume2, Download, Search, ChevronRight, User, Building,
  Calendar, DollarSign, Layers, ArrowRight, Sparkles, Cpu, Lock, PhoneCall,
  ExternalLink, Award, CheckCircle2, ChevronDown, BookOpen, Activity, AlertCircle,
  FileCheck, HelpCircle, VolumeX, Copy, Check, LayoutGrid, PieChart, Zap, Play, Pause,
  ShieldAlert, Bot, X, Menu
} from 'lucide-react';
import { 
  signInWithGoogle, 
  loginWithEmail, 
  registerWithEmail, 
  resetUserPassword, 
  logoutFirebase 
} from './firebase';

const RENDER_BACKEND = 'https://govtech-ai-contract-analyzer-platform.onrender.com/api';

// Detect if running inside native Android / iOS Capacitor wrapper
const isNativePlatform = typeof window !== 'undefined' && (
  Boolean(window.Capacitor?.isNativePlatform?.()) ||
  window.location.protocol === 'capacitor:' ||
  (window.location.hostname === 'localhost' && (!window.location.port || window.location.port === '80' || window.location.port === '443'))
);

const API_BASE = import.meta.env.VITE_API_BASE || (
  isNativePlatform
    ? RENDER_BACKEND
    : (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== ''
        ? '/api'
        : RENDER_BACKEND)
);

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
  
  // Auth Modal
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState('');

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
    } else {
      setDocuments([]);
      setCurrentDoc(null);
    }
  }, [user]);

  // Google Firebase Authentication Handlers
  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await signInWithGoogle();
      if (!res.success) {
        setAuthError(res.error || 'Google Sign-In was unsuccessful.');
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
        firebase_uid: res.user.uid
      };
      setUser(appUser);
      setSafeStorage('gov_user', JSON.stringify(appUser));
      setShowAuthModal(false);
      fetchUserDocuments(appUser.id);
    } catch (err) {
      setAuthError(err.message || 'Google authentication failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Auth Submit (Firebase Email/Password & Reset)
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      if (authMode === 'register') {
        if (authPassword.length < 6) {
          setAuthError('Strong password required: minimum 6 characters.');
          setAuthLoading(false);
          return;
        }
        const res = await registerWithEmail(authName, authEmail, authPassword);
        if (!res.success) {
          setAuthError(res.error || 'Registration failed.');
          setAuthLoading(false);
          return;
        }

        // Sync with backend
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
          const appUser = syncRes?.user || {
            id: Math.abs(res.user.uid.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)),
            name: authName,
            email: res.user.email,
            role: 'user'
          };
          setUser(appUser);
          setSafeStorage('gov_user', JSON.stringify(appUser));
          setShowAuthModal(false);
          fetchUserDocuments(appUser.id);
        } catch {
          setShowAuthModal(false);
        }
      } else if (authMode === 'login') {
        const res = await loginWithEmail(authEmail, authPassword);
        if (!res.success) {
          setAuthError(res.error || 'Invalid email or password.');
          setAuthLoading(false);
          return;
        }

        // Sync with backend
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
          const appUser = syncRes?.user || {
            id: Math.abs(res.user.uid.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)),
            name: res.user.name,
            email: res.user.email,
            role: 'user'
          };
          setUser(appUser);
          setSafeStorage('gov_user', JSON.stringify(appUser));
          setShowAuthModal(false);
          fetchUserDocuments(appUser.id);
        } catch {
          setShowAuthModal(false);
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

      fetchUserDocuments(user.id);
    } catch (err) {
      alert(`Analysis error: ${err.message}`);
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
          user_id: user ? user.id : null,
          ai_mode: aiMode
        })
      });
      setMessages(prev => [...prev, {
        sender: 'ai',
        text: data.answer,
        citations: data.citations || []
      }]);
    } catch (err) {
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

  return (
    <div className={`min-h-screen font-sans pb-20 md:pb-0 transition-colors duration-200 ${isDark ? 'bg-[#0b1329] text-[#f8fafc]' : 'bg-[#f8fafc] text-[#0f2b48]'}`}>
      
      {/* ── National Identity Tricolor Bar ── */}
      <div className="h-1.5 w-full flex">
        <div className="h-full w-1/3 bg-[#FF9933]"></div>
        <div className="h-full w-1/3 bg-white"></div>
        <div className="h-full w-1/3 bg-[#138808]"></div>
      </div>

      {/* ── Header Top Utility Bar ── */}
      <div className={`border-b text-xs py-1.5 px-4 sm:px-8 transition-colors ${isDark ? 'bg-[#090d1a] border-[#1e293b] text-gray-400' : 'bg-[#f1f5f9] border-[#e2e8f0] text-gray-600'}`}>
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-3">
            <span className="font-semibold uppercase tracking-wider text-[#ea580c]">भारत सरकार · Government of India</span>
            <span className="hidden md:inline text-gray-400">|</span>
            <span className="hidden md:inline font-medium">AI Contract & Policy Analysis Platform</span>
          </div>
          <div className="flex items-center space-x-2.5 sm:space-x-3.5">
            {/* Indian Language Selector */}
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[11px] font-semibold ${
              isDark ? 'bg-[#1e293b] border-[#334155] text-slate-200' : 'bg-white border-[#cbd5e1] text-gray-700 shadow-xs'
            }`}>
              <Globe className="w-3.5 h-3.5 text-[#ea580c] shrink-0" />
              <select
                value={siteLang}
                onChange={(e) => changeSiteLanguage(e.target.value)}
                aria-label="Select Indian Language"
                className="bg-transparent border-none text-[11px] font-semibold focus:outline-none cursor-pointer pr-1 text-inherit"
              >
                {INDIAN_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code} className={isDark ? 'bg-[#1e293b] text-white' : 'bg-white text-gray-900'}>
                    {l.native} ({l.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Processing Mode Switcher */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-gray-500 hidden sm:inline">AI Engine:</span>
              <div className={`flex items-center rounded-lg p-0.5 border text-[11px] font-semibold ${isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-[#cbd5e1]'}`}>
                <button
                  type="button"
                  onClick={() => setAiMode('fast')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${aiMode === 'fast' ? 'bg-[#ea580c] text-white shadow-xs' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                  title="Fast processing mode"
                >
                  <Zap className="w-3 h-3" /> Fast
                </button>
                <button
                  type="button"
                  onClick={() => setAiMode('secure')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${aiMode === 'secure' ? 'bg-[#0f3d68] text-white shadow-xs' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                  title="High security mode (local private inference)"
                >
                  <Lock className="w-3 h-3" /> Secure
                </button>
              </div>
            </div>

            {/* Bright / Dark Mode */}
            <button
              onClick={() => setTheme(isDark ? 'bright' : 'dark')}
              className={`p-1 rounded border transition-all ${isDark ? 'bg-[#1e293b] border-[#334155] text-amber-400' : 'bg-white border-[#cbd5e1] text-gray-700'}`}
              title="Toggle Bright/Dark mode"
            >
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Navigation Header ── */}
      <header className={`border-b sticky top-0 z-40 backdrop-blur-md transition-colors ${isDark ? 'bg-[#0f172a]/95 border-[#334155]' : 'bg-white/95 border-[#e2e8f0]'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="relative">
              <img
                src="/logo.jpg"
                alt="NyayaMitra AI Logo"
                className="w-11 h-11 rounded-lg object-cover shadow-md border border-amber-500/50 ring-1 ring-amber-400/30"
              />
            </div>
            <div>
              <div className="text-[11px] font-bold tracking-widest uppercase text-[#ea580c]">
                LEGAL & WELFARE INTELLIGENCE
              </div>
              <div className="text-xl font-black font-serif-gov tracking-tight text-[#0f3d68] dark:text-[#38bdf8]">
                NyayaMitra AI
              </div>
            </div>
          </div>

          {/* Quick Jump Links */}
          <nav className="hidden lg:flex items-center space-x-5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-[#ea580c] dark:hover:text-[#ea580c] transition-colors">
              Home
            </button>
            <button onClick={() => scrollTo(uploadRef)} className="hover:text-[#ea580c] dark:hover:text-[#ea580c] transition-colors">
              Upload & Audit
            </button>
            <button onClick={() => scrollTo(chatRef)} className="hover:text-[#ea580c] dark:hover:text-[#ea580c] transition-colors">
              Q&A Chat
            </button>
            <button onClick={() => scrollTo(debateRef)} className="hover:text-[#ea580c] dark:hover:text-[#ea580c] transition-colors">
              AI Debate
            </button>
            <button onClick={() => scrollTo(redlineRef)} className="hover:text-[#ea580c] dark:hover:text-[#ea580c] transition-colors">
              Redline
            </button>
            <button onClick={() => scrollTo(schemesRef)} className="hover:text-[#ea580c] dark:hover:text-[#ea580c] transition-colors">
              Schemes
            </button>
            <button onClick={() => scrollTo(historyRef)} className="hover:text-[#ea580c] dark:hover:text-[#ea580c] transition-colors">
              History
            </button>
          </nav>

          {/* Auth Button & Hamburger Menu (=) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <div className="flex items-center space-x-2">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-[#0f3d68] dark:text-[#38bdf8] truncate max-w-[130px]">{user.name}</div>
                  <div className="text-[10px] text-gray-500 truncate max-w-[130px]">{user.email}</div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
                className="px-3.5 py-2 bg-[#0f3d68] hover:bg-[#0a2540] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition-all cursor-pointer"
              >
                Sign In
              </button>
            )}

            {/* Hamburger (=) Workspace Modules Menu Button */}
            <button
              type="button"
              onClick={() => setIsMenuOpen(prev => !prev)}
              className="p-2 sm:p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-[#0f3d68] dark:text-sky-300 transition-all cursor-pointer flex items-center justify-center shadow-xs"
              title="Workspace Modules Menu (=)"
              aria-label="Toggle navigation menu"
            >
              {isMenuOpen ? <X className="w-5 h-5 text-red-500" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* ── Slide-Down Workspace Modules Menu (=) ── */}
        {isMenuOpen && (
          <div className="border-t border-gray-200 dark:border-gray-800 bg-white/98 dark:bg-[#0b1222]/98 backdrop-blur-xl shadow-2xl transition-all">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    NyayaMitra AI · Workspace Modules
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(false)}
                  className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { id: 'audit', label: 'Audit & Health', ref: uploadRef, icon: Shield, desc: 'Clause risk assessment & compliance health score', count: currentDoc ? highRisksCount + medRisksCount : null, countColor: 'bg-red-500' },
                  { id: 'chat', label: 'Ask AI (Q&A)', ref: chatRef, icon: MessageSquare, desc: 'Interactive legal assistant & RAG intelligence' },
                  { id: 'courtroom', label: 'AI Courtroom', ref: debateRef, icon: Scale, desc: '3-Agent legal debate (Critic, Defender, Judge)' },
                  { id: 'redline', label: 'PDF Redline', ref: redlineRef, icon: Edit3, desc: 'Track changes, clause revisions & Word export', count: docRisks.length > 0 ? docRisks.length : null, countColor: 'bg-amber-500' },
                  { id: 'schemes', label: 'Welfare Schemes', ref: schemesRef, icon: Landmark, desc: 'Social security & citizen entitlement discovery', count: schemes.length || '12', countColor: 'bg-emerald-500' },
                  { id: 'translate', label: 'Indian Translator', ref: multilingualRef, icon: Globe, desc: '17 Indian languages with native voice readout' },
                  { id: 'history', label: 'Documents & Records', ref: historyRef, icon: Folder, desc: 'Inspection history & verified compliance records', count: documents.length || null, countColor: 'bg-blue-500' },
                  { id: 'all', label: 'Full Dashboard View', ref: uploadRef, icon: LayoutGrid, desc: 'Display all modules unified on a single screen' },
                ].map(module => {
                  const Icon = module.icon;
                  const isActive = activeTab === module.id;
                  return (
                    <button
                      key={module.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(module.id);
                        setIsMenuOpen(false);
                        setTimeout(() => {
                          if (module.ref?.current) {
                            module.ref.current.scrollIntoView({ behavior: 'smooth' });
                          }
                        }, 50);
                      }}
                      className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group ${
                        isActive
                          ? 'border-[#0f3d68] bg-sky-50/80 dark:bg-sky-950/30 dark:border-sky-500 ring-1 ring-sky-500/20'
                          : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900/60 hover:border-amber-500/60 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className={`p-2 rounded-lg ${isActive ? 'bg-[#0f3d68] text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 group-hover:bg-amber-500/10 group-hover:text-amber-600'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        {module.count !== null && module.count !== undefined && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-black text-white ${module.countColor || 'bg-gray-500'}`}>
                            {module.count}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-gray-900 dark:text-gray-100 group-hover:text-[#ea580c] transition-colors">
                          {module.label}
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug line-clamp-2">
                          {module.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Quick Actions Footer inside (=) Menu */}
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    handleLoadDemoContract();
                    setIsMenuOpen(false);
                  }}
                  className="px-4 py-2 rounded-lg bg-[#ea580c] hover:bg-[#c2410c] text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-200" />
                  <span>Try Demo Tender Contract</span>
                </button>

                <div className="text-xs text-gray-500">
                  {user ? (
                    <span>Logged in as <strong>{user.name}</strong></span>
                  ) : (
                    <span>Guest Mode · Sign in with Google to save audit records</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ── SECTION 1: HERO SECTION ── */}
      <section className="relative overflow-hidden py-16 sm:py-24 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Headlines & Actions */}
            <div className="lg:col-span-7">
              {/* Pill Badge */}
              <div className="inline-block px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase bg-[#fff7ed] text-[#c2410c] border border-[#fed7aa] mb-6 shadow-xs">
                OFFICIAL GOVERNMENT PORTAL
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-serif-gov leading-[1.15] tracking-tight mb-6">
                <span className="text-[#0f3d68] dark:text-[#38bdf8] block">NyayaMitra AI</span>
                <span className="text-[#ea580c] block text-2xl sm:text-3xl lg:text-4xl">Legal Intelligence & Citizen Welfare</span>
              </h1>

              {/* Description */}
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-8 max-w-xl font-normal">
                NyayaMitra AI is an advanced sovereign platform for automated verification of legal agreements, contracts, and citizen welfare schemes across India. Ensuring fair terms, statutory compliance, and social entitlement discovery through modern AI.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <button 
                  onClick={() => { setActiveTab('audit'); scrollTo(uploadRef); }}
                  className="px-6 sm:px-8 py-3.5 sm:py-4 bg-[#0f3d68] hover:bg-[#0a2540] text-white font-bold text-xs sm:text-sm tracking-wider uppercase rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 border-2 border-[#0f3d68] cursor-pointer"
                >
                  UPLOAD & ANALYZE <ArrowRight className="w-4 h-4" />
                </button>
                <button 
                  onClick={handleLoadDemoContract}
                  className="px-5 sm:px-7 py-3.5 sm:py-4 bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold text-xs sm:text-sm tracking-wider uppercase rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer border-2 border-[#ea580c]"
                  title="Test the entire dashboard immediately with a sample tender contract"
                >
                  <Zap className="w-4 h-4 text-amber-200" />
                  <span>TRY DEMO CONTRACT</span>
                </button>
                <button 
                  onClick={() => { setActiveTab('schemes'); scrollTo(schemesRef); }}
                  className="px-5 sm:px-7 py-3.5 sm:py-4 bg-white hover:bg-gray-50 text-[#0f3d68] font-bold text-xs sm:text-sm tracking-wider uppercase rounded-xl border-2 border-[#0f3d68] shadow-sm transition-all dark:bg-transparent dark:text-white dark:border-gray-500 cursor-pointer flex items-center justify-center gap-2"
                >
                  EXPLORE SCHEMES
                </button>
              </div>
            </div>

            {/* Right Column: 3D Citizen Welfare & Policy Illustration */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="relative group max-w-[420px] w-full">
                {/* Subtle ambient accent glow */}
                <div className="absolute -inset-2 bg-gradient-to-r from-[#0f3d68]/20 via-[#ea580c]/20 to-[#138808]/20 rounded-3xl blur-xl opacity-70 group-hover:opacity-100 transition duration-500"></div>
                <div className="relative rounded-2xl overflow-hidden border border-gray-200/80 dark:border-gray-700 shadow-2xl bg-white dark:bg-slate-900">
                  <img
                    src={isDark ? "/hero_scheme_dark.jpg" : "/hero_scheme.jpg"}
                    alt="Citizen Welfare Schemes and Legal Policy Platform"
                    className="w-full h-auto object-cover transform transition duration-500 hover:scale-[1.02]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: UPLOAD & AUDIT WORKSPACE (Always Visible & Accessible!) ── */}
      <section ref={uploadRef} className={`py-16 border-b border-gray-200 dark:border-gray-800 ${activeTab !== 'audit' && activeTab !== 'all' ? 'hidden' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest bg-blue-50 text-[#0f3d68] dark:bg-blue-950 dark:text-blue-300 mb-2">
              WORKSPACE · MODULE 1
            </div>
            <h2 className="text-3xl font-black font-serif-gov text-[#0f3d68] dark:text-[#38bdf8]">
              Upload Document for AI Analysis
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Select a PDF contract or government scheme for automated summary, clause extraction, and risk detection.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className={`p-8 rounded-lg shadow-lg border-t-4 border-t-[#0f3d68] border ${isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-[#e2e8f0]'}`}>
              <form onSubmit={handleUpload} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase mb-1.5 text-gray-700 dark:text-gray-200">Document Type</label>
                    <select 
                      value={uploadDocType} 
                      onChange={e => setUploadDocType(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 font-semibold cursor-pointer shadow-xs"
                    >
                      <option value="contract">Commercial Contract / Legal Agreement</option>
                      <option value="scheme">Government Scheme / Policy Directive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase mb-1.5 text-gray-700 dark:text-gray-200">Processing Mode</label>
                    <select
                      value={aiMode}
                      onChange={e => setAiMode(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 font-semibold cursor-pointer shadow-xs"
                    >
                      <option value="fast">Fast (Direct Cloud AI Engine)</option>
                      <option value="secure">High Security (PII Redacted Local AI)</option>
                    </select>
                  </div>
                </div>

                {/* 1-Click Demo Contract Quick-Load Banner */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-blue-500/10 to-emerald-500/10 border border-amber-300/60 dark:border-amber-700/40 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-gray-900 dark:text-gray-100">Don't have a contract PDF handy?</h5>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">Test the entire AI engine instantly with our realistic Municipal Tender Contract.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleLoadDemoContract}
                    className="w-full sm:w-auto px-4 py-2 bg-[#ea580c] hover:bg-[#c2410c] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-200" /> TRY DEMO CONTRACT
                  </button>
                </div>

                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-[#ea580c] transition-all bg-gray-50/50 dark:bg-gray-900/30">
                  <input 
                    type="file" 
                    accept=".pdf,application/pdf" 
                    id="docUploader"
                    onChange={e => setUploadFile(e.target.files[0])}
                    className="hidden" 
                  />
                  <label htmlFor="docUploader" className="cursor-pointer flex flex-col items-center">
                    <Upload className="w-10 h-10 text-[#0f3d68] dark:text-[#38bdf8] mb-2" />
                    <span className="text-sm font-bold text-[#0f3d68] dark:text-[#38bdf8]">
                      {uploadFile ? uploadFile.name : 'Choose a Contract or Policy PDF (max 50MB)'}
                    </span>
                    <span className="text-xs text-gray-400 mt-1">Supports standard and scanned PDF files</span>
                  </label>
                </div>

                {isUploading && (
                  <div className="p-4 rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs">
                    <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200 mb-1.5">
                      <Cpu className="w-4 h-4 animate-spin text-[#ea580c]" /> {uploadStage}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700 overflow-hidden">
                      <div className="bg-[#ea580c] h-1.5 rounded-full animate-pulse w-3/4"></div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!uploadFile || isUploading}
                  className="w-full py-4 bg-[#0f3d68] hover:bg-[#0a2540] disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded shadow transition-all"
                >
                  {isUploading ? 'ANALYZING DOCUMENT...' : 'PROCESS & ANALYZE DOCUMENT'}
                </button>
              </form>
            </div>

            {/* Document Analysis Result Breakdown */}
            {currentDoc && (
              <div className="mt-8 space-y-6">
                {/* Contract Health Score & Safety Meter */}
                <div className={`p-6 rounded-2xl border shadow-sm flex flex-col md:flex-row items-center justify-between gap-5 transition-all ${healthGrade.bg} ${healthGrade.borderColor}`}>
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    {/* Visual Radial Dial / Health Badge */}
                    <div className="relative w-20 h-20 flex flex-col items-center justify-center rounded-2xl bg-white dark:bg-slate-900 shadow-md border border-gray-200 dark:border-gray-700 shrink-0">
                      <span className={`text-3xl font-black ${healthGrade.color}`}>
                        {healthScore}
                      </span>
                      <span className="text-[9px] font-bold text-gray-400 uppercase -mt-1">/ 100</span>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full text-white shadow-2xs ${
                          healthScore >= 80 ? 'bg-emerald-600' : healthScore >= 50 ? 'bg-amber-500' : 'bg-red-600'
                        }`}>
                          {healthGrade.badge}
                        </span>
                        <span className="text-[11px] text-gray-500 font-semibold">
                          Legal Parity Score (Indian Contract Act 1872)
                        </span>
                      </div>
                      <h4 className="text-base font-bold font-serif-gov text-[#0f3d68] dark:text-[#38bdf8]">
                        {healthGrade.title}
                      </h4>
                      <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-1.5 mt-2.5 overflow-hidden max-w-md">
                        <div className={`h-1.5 rounded-full transition-all duration-700 ${healthGrade.progressColor}`} style={{ width: `${healthScore}%` }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Listen Audio TTS + Download PDF */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => handleSpeak(`${currentDoc.summary || ''}. Identified ${highRisksCount} high risk clauses and ${medRisksCount} medium risk clauses.`)}
                      className="px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 hover:border-amber-500 text-gray-800 dark:text-gray-200 cursor-pointer shadow-xs"
                      title="Listen to Executive Summary Aloud"
                    >
                      {isSpeaking ? (
                        <>
                          <VolumeX className="w-4 h-4 text-amber-500 animate-pulse" />
                          <span className="text-amber-600 dark:text-amber-400 font-black">STOP VOICE</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-4 h-4 text-[#ea580c]" />
                          <span>LISTEN SUMMARY</span>
                        </>
                      )}
                    </button>
                    <a
                      href={`${API_BASE}/report/download/${currentDoc.id}`}
                      target="_blank"
                      rel="noreferrer"
                      download
                      className="px-4 py-2.5 bg-[#0f3d68] hover:bg-[#0a2540] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow flex items-center justify-center gap-1.5 border border-[#0f3d68] transition-all"
                    >
                      <Download className="w-3.5 h-3.5 text-amber-400" />
                      <span>DOWNLOAD REPORT</span>
                    </a>
                  </div>
                </div>
                <div className="p-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                      className={`px-3.5 py-2 rounded text-xs font-bold uppercase tracking-wider border transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                        isDark ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                      title={`Re-audit this contract with ${aiMode === 'fast' ? 'Faster Cloud AI' : 'Local Secure AI'}`}
                    >
                      <Activity className={`w-3.5 h-3.5 text-[#ea580c] ${isReanalyzing ? 'animate-spin' : ''}`} />
                      {isReanalyzing ? 'Re-Auditing...' : `Re-Audit (${aiMode === 'fast' ? 'Fast' : 'Secure'})`}
                    </button>
                    <a
                      href={`${API_BASE}/report/download/${currentDoc.id}`}
                      target="_blank"
                      rel="noreferrer"
                      download
                      className="px-4 py-2 bg-[#0f3d68] hover:bg-[#0a2540] text-white text-xs font-bold uppercase tracking-wider rounded shadow flex items-center gap-2 border border-[#0f3d68] transition-all"
                    >
                      <Download className="w-4 h-4 text-[#ea580c]" /> DOWNLOAD AUDIT REPORT (PDF)
                    </a>
                    <span className="text-xs uppercase font-black px-3 py-2 rounded bg-emerald-200 text-emerald-900 font-serif-gov">
                      ACTIVE
                    </span>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className={`p-4 rounded border text-center ${isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-[#e2e8f0]'}`}>
                    <div className="text-2xl font-black text-red-600">{highRisksCount}</div>
                    <div className="text-xs text-gray-500 uppercase font-semibold mt-1">High Risks</div>
                  </div>
                  <div className={`p-4 rounded border text-center ${isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-[#e2e8f0]'}`}>
                    <div className="text-2xl font-black text-amber-500">{medRisksCount}</div>
                    <div className="text-xs text-gray-500 uppercase font-semibold mt-1">Medium Risks</div>
                  </div>
                  <div className={`p-4 rounded border text-center ${isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-[#e2e8f0]'}`}>
                    <div className="text-2xl font-black text-[#0f3d68] dark:text-[#38bdf8]">{docClauses.length}</div>
                    <div className="text-xs text-gray-500 uppercase font-semibold mt-1">Clauses Classified</div>
                  </div>
                  <div className={`p-4 rounded border text-center ${isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-[#e2e8f0]'}`}>
                    <div className="text-2xl font-black text-emerald-600">{entitiesCount}</div>
                    <div className="text-xs text-gray-500 uppercase font-semibold mt-1">Extracted Entities</div>
                  </div>
                </div>

                {/* Summary */}
                <div className={`p-6 rounded-lg border shadow-sm ${isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-[#e2e8f0]'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-bold font-serif-gov text-[#0f3d68] dark:text-[#38bdf8]">Executive Summary</h3>
                    <a
                      href={`${API_BASE}/report/download/${currentDoc.id}`}
                      target="_blank"
                      rel="noreferrer"
                      download
                      className="text-xs font-bold text-[#ea580c] hover:underline flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" /> Download Full PDF Report
                    </a>
                  </div>

                  {/* Layer 1 Sovereign PII Shield Badge */}
                  <div className="mb-3.5 p-2.5 rounded-lg border border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/80 dark:bg-emerald-950/40 flex items-center justify-between flex-wrap gap-2 text-xs">
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

                  <p className="text-xs leading-relaxed text-gray-700 dark:text-gray-300">{currentDoc.summary}</p>
                </div>

                {/* Detected Risks & Remediation */}
                <div className={`p-6 rounded-lg border shadow-sm ${isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-[#e2e8f0]'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold font-serif-gov text-[#0f3d68] dark:text-[#38bdf8] flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                      Detected Risks, Severity Rationale & Remediation ({docRisks.length})
                    </h3>
                    <span className="text-xs text-gray-500">
                      Evaluated against Indian legal standards & commercial parity
                    </span>
                  </div>
                  <div className="space-y-4">
                    {docRisks.length === 0 ? (
                      <p className="text-xs text-gray-500 italic">No significant legal liabilities or one-sided terms detected.</p>
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
                            className={`p-5 rounded-xl border transition-all shadow-xs ${
                              isHigh 
                                ? 'bg-red-50/70 border-red-300 dark:bg-red-950/30 dark:border-red-900/60' 
                                : (isMed 
                                  ? 'bg-amber-50/70 border-amber-300 dark:bg-amber-950/30 dark:border-amber-900/60'
                                  : 'bg-blue-50/70 border-blue-300 dark:bg-blue-950/30 dark:border-blue-900/60')
                            }`}
                          >
                            {/* Card Header with Badges */}
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-black px-2.5 py-1 rounded uppercase tracking-wider text-white shadow-xs ${
                                  isHigh ? 'bg-red-600' : (isMed ? 'bg-amber-500' : 'bg-blue-600')
                                }`}>
                                  {risk.risk_level || 'RISK'} SEVERITY
                                </span>
                                <span className="font-bold text-sm text-[#0f3d68] dark:text-[#38bdf8]">
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
                                        ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200 border border-red-200 dark:border-red-800' 
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
                              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                                <FileText className="w-3 h-3 text-red-500" /> Problematic Verbatim Excerpt:
                              </div>
                              <blockquote className="p-3 rounded-lg bg-white/90 dark:bg-[#0f172a]/80 border-l-3 border-red-500 text-red-950 dark:text-red-200 font-mono text-xs leading-relaxed italic shadow-2xs">
                                "{risk.risky_excerpt}"
                              </blockquote>
                            </div>

                            {/* Why It's Risky: Hazard Assessment */}
                            <div className="mb-3">
                              <div className="text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                Why This Clause Is Risky (Hazard Assessment):
                              </div>
                              <p className="text-xs text-gray-800 dark:text-gray-200 leading-relaxed bg-white/60 dark:bg-slate-900/50 p-2.5 rounded-lg border border-gray-200/60 dark:border-gray-800/60">
                                {risk.why_risky}
                              </p>
                            </div>

                            {/* Why It's Stated As High / Medium Risk (Severity Rationale) */}
                            <div className="mb-3 p-3 rounded-lg bg-white/90 dark:bg-slate-900/80 border border-red-200 dark:border-red-900/40">
                              <div className="text-[11px] font-black uppercase tracking-wider text-[#0f3d68] dark:text-[#38bdf8] mb-1.5 flex items-center gap-1.5">
                                <Activity className="w-3.5 h-3.5 text-[#ea580c]" />
                                Why Stated As [{risk.risk_level}] Risk (Classification Rationale):
                              </div>
                              <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                                {rationale}
                              </p>
                              {impact && (
                                <div className="mt-2 pt-2 border-t border-gray-200/60 dark:border-gray-700/60 text-[11px] text-gray-600 dark:text-gray-400">
                                  <strong className="text-red-700 dark:text-red-400">Potential Legal & Financial Exposure: </strong>
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
                                      onClick={() => handleSpeak(risk.suggested_replacement)}
                                      className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:border-amber-500 shadow-2xs"
                                      title="Read clause aloud"
                                    >
                                      <Volume2 className="w-3 h-3 text-[#ea580c]" />
                                      <span>LISTEN</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyClause(risk.suggested_replacement, i)}
                                      className="px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
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
                                <div className="p-3 rounded-lg bg-emerald-50/90 dark:bg-emerald-950/40 border-l-4 border-emerald-500 text-emerald-950 dark:text-emerald-100 text-xs leading-relaxed font-medium shadow-2xs">
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
                  <div className={`p-6 rounded-lg border shadow-sm ${isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-[#e2e8f0]'}`}>
                    <h3 className="text-base font-bold font-serif-gov text-[#0f3d68] dark:text-[#38bdf8] mb-4 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#ea580c]" />
                      Classified Legal Clauses ({docClauses.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {docClauses.map((clause, idx) => (
                        <div key={idx} className={`p-4 rounded border text-xs space-y-1.5 ${isDark ? 'bg-slate-800/70 border-slate-700' : 'bg-gray-50/80 border-gray-200'}`}>
                          <div className="font-bold text-[#0f3d68] dark:text-[#38bdf8] uppercase text-[11px] flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#ea580c]"></span>
                            {clause.clause_type}
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 text-xs font-medium">{clause.summary}</p>
                          {clause.verbatim_excerpt && (
                            <div className="p-2 rounded bg-white dark:bg-slate-900/60 border border-gray-200 dark:border-gray-800 italic text-[11px] text-gray-500 dark:text-gray-400">
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
                  <div className={`p-6 rounded-lg border shadow-sm ${isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-[#e2e8f0]'}`}>
                    <h3 className="text-base font-bold font-serif-gov text-[#0f3d68] dark:text-[#38bdf8] mb-4 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#ea580c]" />
                      Extracted Entities & Metadata
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                      {Object.entries(docEntities).map(([category, items]) => {
                        const list = Array.isArray(items) ? items : [String(items)];
                        if (list.length === 0) return null;
                        return (
                          <div key={category} className={`p-3.5 rounded border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50/70 border-gray-200'}`}>
                            <div className="font-bold uppercase tracking-wider text-[10px] text-[#ea580c] mb-2">
                              {category.replace('_', ' ')}
                            </div>
                            <ul className="space-y-1">
                              {list.map((item, i) => (
                                <li key={i} className="text-gray-800 dark:text-gray-200 font-medium flex items-start gap-1.5">
                                  <span className="text-gray-400">•</span>
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
      <section ref={chatRef} className={`py-16 border-b transition-colors ${isDark ? 'bg-[#0d162e] border-[#1e293b]' : 'bg-[#f1f5f9] border-[#e2e8f0]'} ${activeTab !== 'chat' && activeTab !== 'all' ? 'hidden' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest bg-amber-50 text-[#ea580c] border border-amber-200 mb-2">
              WORKSPACE · MODULE 2
            </div>
            <h2 className="text-3xl font-black font-serif-gov text-[#0f3d68] dark:text-[#38bdf8]">
              Verified Q&A Chat Assistant
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Ask questions about penalties, deadlines, clauses, and obligations with exact page-level citations.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            {!currentDoc ? (
              <div className="p-8 rounded-lg border text-center text-gray-500 text-xs bg-white dark:bg-[#1e293b]">
                <FileCheck className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                Upload a document in Module 1 above to enable the Q&A assistant.
              </div>
            ) : (
              <div className={`rounded-lg border shadow-md flex flex-col h-[500px] overflow-hidden ${isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-[#e2e8f0]'}`}>
                <div className="px-6 py-3.5 bg-[#0f3d68] text-white flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold uppercase font-serif-gov">Chatting about:</span> {currentDoc.filename}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded font-semibold text-blue-100">
                      {aiMode === 'fast' ? 'Fast AI Engine' : 'High Security Engine'}
                    </span>
                    <span className="text-[10px] bg-[#ea580c] px-2 py-0.5 rounded font-bold uppercase">Citation Verified</span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-3.5 text-xs">
                  {messages.length === 0 && (
                    <div className="text-center py-20 text-gray-400">
                      Ask anything! e.g. "What is risky in this paper?" or "What are the payment terms?"
                    </div>
                  )}
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-lg p-3.5 ${m.sender === 'user' ? 'bg-[#0f3d68] text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'}`}>
                        <div className="font-bold text-[10px] uppercase opacity-70 mb-1">{m.sender === 'user' ? 'You' : 'AI Analyzer'}</div>
                        <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>
                        {m.citations?.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-700 flex gap-1 items-center text-[10px] font-bold">
                            <span>CITATIONS:</span>
                            {m.citations.map(p => <span key={p} className="bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-200 px-1.5 py-0.5 rounded">Page {p}</span>)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="text-xs text-gray-400 flex items-center gap-2">
                      <Cpu className="w-3.5 h-3.5 animate-spin" /> Retrieving verified excerpts and citing clauses...
                    </div>
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                  <input 
                    type="text" 
                    value={chatInput} 
                    onChange={e => setChatInput(e.target.value)}
                    placeholder="e.g. Can you tell me what is risky in this paper?"
                    className="flex-1 px-3.5 py-2.5 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-hidden"
                  />
                  <button type="submit" disabled={isChatLoading || !chatInput.trim()} className="px-5 py-2 bg-[#ea580c] hover:bg-[#c2410c] text-white text-xs font-bold uppercase rounded">
                    Send
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── SECTION 5: MULTI-AGENT COURTROOM DEBATE ── */}
      <section ref={debateRef} className={`py-16 border-b border-gray-200 dark:border-gray-800 ${activeTab !== 'courtroom' && activeTab !== 'all' ? 'hidden' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 mb-2">
              WORKSPACE · MODULE 3
            </div>
            <h2 className="text-3xl font-black font-serif-gov text-[#0f3d68] dark:text-[#38bdf8]">
              Multi-Agent Legal Courtroom
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              3 AI agents debate your contract clauses: The Critic, The Defender, and Judicial Verdict.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            {!currentDoc ? (
              <div className="p-8 rounded-lg border text-center text-gray-500 text-xs bg-white dark:bg-[#1e293b]">
                <Scale className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                Upload a document in Module 1 to run the multi-agent legal debate.
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-6 rounded-lg bg-[#0f3d68] text-white flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm font-serif-gov">Simulate Autonomous Courtroom</h4>
                    <p className="text-xs text-blue-200 mt-0.5">Prosecution, Defense, and Judicial Verdict on detected loopholes.</p>
                  </div>
                  <button 
                    onClick={handleStartDebate} 
                    disabled={isDebating}
                    className="px-5 py-2.5 bg-[#ea580c] hover:bg-[#c2410c] text-white text-xs font-bold uppercase rounded shadow"
                  >
                    {isDebating ? 'AGENTS DEBATING...' : 'START COURTROOM DEBATE'}
                  </button>
                </div>

                {debateResult && (
                  <div className="space-y-4">
                    {debateResult.error ? (
                      <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-center justify-between">
                        <div>
                          <strong>Courtroom Adjourned:</strong> {debateResult.error}
                        </div>
                        <button
                          onClick={handleStartDebate}
                          className="px-3 py-1 bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold rounded cursor-pointer"
                        >
                          Retry Debate
                        </button>
                      </div>
                    ) : (
                      <div className={`p-6 rounded-lg border shadow-md space-y-6 ${isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-[#e2e8f0]'}`}>
                        {/* Overall Judicial Ruling Banner */}
                        <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Scale className="w-4 h-4 text-[#ea580c]" />
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#ea580c]">
                              Judicial Summary Ruling & Contract Verdict
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-[#0f3d68] dark:text-[#38bdf8] leading-relaxed">
                            {debateResult.overall_verdict || "The judicial magistrate reviewed the submitted contract terms across all disputed clauses."}
                          </p>
                        </div>

                        {/* Debated Issues */}
                        <div className="space-y-4">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                            Courtroom Arguments on Contested Issues ({debateResult.debate?.length || 0})
                          </h4>

                          {(debateResult.debate || []).map((d, i) => (
                            <div key={i} className={`p-5 rounded-lg border space-y-3.5 ${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-gray-50/70 border-gray-200'}`}>
                              {/* Issue Title & Risk Pill */}
                              <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-gray-200/80 dark:border-gray-700/80">
                                <span className="font-bold text-sm text-[#0f3d68] dark:text-[#38bdf8]">
                                  {i + 1}. {d.issue}
                                </span>
                                <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                                  d.final_risk_level?.toLowerCase() === 'high'
                                    ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                                    : d.final_risk_level?.toLowerCase() === 'medium'
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                }`}>
                                  {d.final_risk_level || 'Evaluated'} Risk
                                </span>
                              </div>

                              {/* 3 Agents Dialogue */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                                {/* Critic */}
                                <div className="p-3.5 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/20 space-y-1">
                                  <div className="font-bold text-red-800 dark:text-red-400 flex items-center gap-1.5">
                                    <Scale className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" />
                                    <span>The Critic (Prosecution):</span>
                                  </div>
                                  <div className="text-gray-700 dark:text-gray-300 leading-relaxed text-[11px]">
                                    {d.critic_argument}
                                  </div>
                                </div>

                                {/* Defender */}
                                <div className="p-3.5 rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-1">
                                  <div className="font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                                    <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                    <span>The Defender (Defense Counsel):</span>
                                  </div>
                                  <div className="text-gray-700 dark:text-gray-300 leading-relaxed text-[11px]">
                                    {d.defender_argument}
                                  </div>
                                </div>

                                {/* Judge */}
                                <div className="p-3.5 rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 space-y-1">
                                  <div className="font-bold text-blue-800 dark:text-blue-400 flex items-center gap-1.5">
                                    <Award className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                                    <span>Judicial Verdict (Magistrate):</span>
                                  </div>
                                  <div className="text-gray-800 dark:text-gray-200 leading-relaxed text-[11px] font-medium">
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
        </div>
      </section>

      {/* ── SECTION 6: AUTO-REDLINE MODULE ── */}
      <section ref={redlineRef} className={`py-16 border-b transition-colors ${isDark ? 'bg-[#0d162e] border-[#1e293b]' : 'bg-[#f1f5f9] border-[#e2e8f0]'} ${activeTab !== 'redline' && activeTab !== 'all' ? 'hidden' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 mb-2 border border-red-200 dark:border-red-900">
              WORKSPACE · MODULE 4 · VISUAL AUDIT
            </div>
            <h2 className="text-3xl font-black font-serif-gov text-[#0f3d68] dark:text-[#38bdf8]">
              Automated Contract Redlining
            </h2>
            <p className="text-xs text-gray-500 mt-1 max-w-xl mx-auto">
              Visual strikethrough red lines and highlight annotations applied directly to the uploaded PDF for all detected risky text and clauses.
            </p>
          </div>

          {!currentDoc ? (
            <div className="max-w-2xl mx-auto p-12 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 text-center bg-white dark:bg-[#1e293b]">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-50 dark:bg-red-950/40 flex items-center justify-center text-red-600 dark:text-red-400">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1">
                No Contract Uploaded Yet
              </h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto mb-6">
                Upload your contract or legal document in Module 1. The AI engine will automatically scan all clauses and apply high-contrast red lines directly onto risky sections in the original PDF.
              </p>
              <button
                type="button"
                onClick={() => scrollTo(uploadRef)}
                className="px-5 py-2.5 bg-[#0f3d68] hover:bg-[#0a2540] text-white text-xs font-bold uppercase tracking-wider rounded shadow transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <Upload className="w-4 h-4" /> Go to Document Upload
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Action & Info Bar */}
              <div className={`p-5 rounded-xl border shadow-sm flex flex-wrap items-center justify-between gap-4 ${isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-[#e2e8f0]'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0 font-bold">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-gray-900 dark:text-gray-100">
                        {currentDoc.filename}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300">
                        {`${docRisks.length} Risky Clauses Red-Marked`}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                      Vector-rendered strikethrough red lines & caution tags drawn directly onto the PDF file pages.
                    </p>
                  </div>
                </div>

                {/* Download and Fullscreen buttons */}
                <div className="flex items-center gap-2.5">
                  <a
                    href={`${API_BASE}/redline/pdf/${currentDoc.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className={`px-4 py-2 text-xs font-bold rounded border transition-all flex items-center gap-1.5 cursor-pointer ${
                      isDark ? 'border-gray-700 text-gray-200 hover:bg-slate-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Fullscreen PDF
                  </a>
                  <button
                    onClick={handleDownloadRedlinePdf}
                    className="px-5 py-2.5 bg-[#ea580c] hover:bg-[#c2410c] text-white text-xs font-bold uppercase tracking-wider rounded shadow-md transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Download Redlined PDF
                  </button>
                </div>
              </div>

              {/* Main Display Grid: Left = PDF Viewer, Right = Risky Clauses Legend */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Embedded PDF Viewer */}
                <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
                  <div className={`p-2 rounded-xl border shadow-md flex-1 flex flex-col ${isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-[#e2e8f0]'}`}>
                    <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500 font-semibold">
                      <span className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                        <FileText className="w-4 h-4 text-red-500" /> Live Redlined PDF Preview (Direct Strikethroughs)
                      </span>
                      <span className="text-[11px] text-gray-400">
                        Interactive View · Zoom / Scroll
                      </span>
                    </div>
                    <div className="relative w-full h-[640px] sm:h-[720px] rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-900 mt-2">
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
                  <div className={`p-5 rounded-xl border shadow-md flex-1 flex flex-col ${isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-[#e2e8f0]'}`}>
                    <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700 mb-4">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200">
                          Red-Marked Clauses
                        </h4>
                        <span className="text-[10px] text-gray-500">
                          Clauses struck through in red in the PDF
                        </span>
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
                        Visual Redline
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto max-h-[640px] pr-1 space-y-4">
                      {docRisks.length === 0 ? (
                        <div className="p-6 text-center text-xs text-gray-500">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                          No high or medium risks detected in this document.
                        </div>
                      ) : (
                        docRisks.map((risk, idx) => (
                          <div
                            key={idx}
                            className={`p-4 rounded-lg border text-xs space-y-2.5 transition-all ${
                              isDark ? 'bg-slate-800/80 border-gray-700 hover:border-red-500/50' : 'bg-gray-50/80 border-gray-200 hover:border-red-400'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                (risk.risk_level || '').toLowerCase().includes('high')
                                  ? 'bg-red-600 text-white'
                                  : 'bg-amber-500 text-white'
                              }`}>
                                {risk.risk_level || 'RISK'} RISK
                              </span>
                              <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                                {risk.clause_type || 'Contract Clause'}
                              </span>
                            </div>

                            {/* Marked Redline Excerpt with Visual Line */}
                            <div>
                              <div className="text-[10px] font-bold uppercase text-red-600 dark:text-red-400 mb-1 flex items-center gap-1">
                                <span className="w-2 h-0.5 bg-red-500 inline-block"></span>
                                Struck Through with Red Line in PDF:
                              </div>
                              <div className="p-2.5 rounded bg-red-50 dark:bg-red-950/40 border-l-3 border-red-500 text-red-900 dark:text-red-200 text-xs font-mono leading-relaxed relative">
                                <span className="line-through decoration-red-600 decoration-2 font-medium">
                                  {risk.risky_excerpt}
                                </span>
                              </div>
                            </div>

                            {/* Why it's risky & Severity Rationale */}
                            <div className="space-y-2">
                              <div>
                                <div className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 mb-0.5">
                                  Hazard Assessment:
                                </div>
                                <p className="text-gray-700 dark:text-gray-300 text-[11px] leading-relaxed">
                                  {risk.why_risky}
                                </p>
                              </div>
                              <div className="p-2.5 rounded bg-gray-100/80 dark:bg-slate-900/60 border border-gray-200 dark:border-gray-700/50">
                                <div className="text-[10px] font-bold uppercase text-[#0f3d68] dark:text-[#38bdf8] mb-1 flex items-center gap-1">
                                  <Activity className="w-3 h-3 text-[#ea580c]" />
                                  Why Stated As {risk.risk_level || 'Medium'} Risk:
                                </div>
                                <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">
                                  {risk.severity_reasoning || (
                                    (risk.risk_level || '').toLowerCase().includes('high')
                                      ? 'Designated as High Risk because this clause imposes asymmetric exposure, uncapped financial liability, or forfeiture of essential statutory rights without reciprocal remedies.'
                                      : 'Designated as Medium Risk due to procedural ambiguity, aggressive timelines, or lack of standard notice and cure periods that could trigger disputes.'
                                  )}
                                </p>
                                {risk.potential_impact && (
                                  <div className="mt-1.5 pt-1.5 border-t border-gray-200 dark:border-gray-800 text-[10px] text-red-700 dark:text-red-400">
                                    <strong>Impact: </strong>{risk.potential_impact}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Suggested replacement */}
                            {risk.suggested_replacement && (
                              <div className="pt-2 border-t border-gray-200 dark:border-gray-700/60">
                                <div className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Recommended Legal Amendment:
                                </div>
                                <div className="p-2.5 rounded bg-emerald-50 dark:bg-emerald-950/30 border-l-3 border-emerald-500 text-emerald-900 dark:text-emerald-200 text-xs leading-relaxed">
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
      <section ref={schemesRef} className={`py-16 border-b border-gray-200 dark:border-gray-800 ${activeTab !== 'schemes' && activeTab !== 'all' ? 'hidden' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-wrap items-end justify-between mb-8 gap-4">
            <div>
              <div className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 mb-2">
                WORKSPACE · MODULE 5
              </div>
              <h2 className="text-3xl font-black font-serif-gov text-[#0f3d68] dark:text-[#38bdf8]">
                Citizen Welfare Scheme Recommender & Directory
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Enter your demographic profile (Gender, Age, Occupation, Income) to discover applicable government welfare schemes, or browse the 96+ program directory.
              </p>
            </div>

            {/* Mode Switcher: Recommender vs Browse */}
            <div className={`p-1 rounded-lg border flex items-center gap-1 ${isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-[#cbd5e1]'}`}>
              <button
                type="button"
                onClick={() => setSchemeTab('recommend')}
                className={`px-3.5 py-1.5 rounded text-xs font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                  schemeTab === 'recommend'
                    ? 'bg-[#ea580c] text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" /> AI Citizen Finder
              </button>
              <button
                type="button"
                onClick={() => setSchemeTab('browse')}
                className={`px-3.5 py-1.5 rounded text-xs font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                  schemeTab === 'browse'
                    ? 'bg-[#0f3d68] text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
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
              <div className={`p-6 sm:p-8 rounded-lg shadow-lg border-t-4 border-t-[#0f3d68] border ${isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-[#e2e8f0]'}`}>
                <div className="flex flex-wrap items-center justify-between pb-4 mb-6 border-b border-gray-200 dark:border-gray-700 gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#ea580c]">Targeted Social Entitlement Assessment</span>
                    <h3 className="text-lg font-bold font-serif-gov text-[#0f3d68] dark:text-[#38bdf8]">
                      Enter Your Demographic & Qualification Details
                    </h3>
                  </div>
                  {/* Quick Presets */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-bold text-gray-400 uppercase mr-1">Quick Presets:</span>
                    <button
                      type="button"
                      onClick={() => setPresetProfile('farmer_female')}
                      className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 cursor-pointer inline-flex items-center gap-1"
                    >
                      <User className="w-3 h-3 text-emerald-600 shrink-0" /> Female Farmer (28)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetProfile('student_male')}
                      className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-sky-50 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 cursor-pointer inline-flex items-center gap-1"
                    >
                      <User className="w-3 h-3 text-sky-600 shrink-0" /> Male Student (22)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetProfile('senior_male')}
                      className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-purple-50 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 cursor-pointer inline-flex items-center gap-1"
                    >
                      <User className="w-3 h-3 text-purple-600 shrink-0" /> Senior Citizen (65)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetProfile('business_msme')}
                      className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 cursor-pointer inline-flex items-center gap-1"
                    >
                      <Building className="w-3 h-3 text-amber-600 shrink-0" /> MSME Trader (38)
                    </button>
                  </div>
                </div>

                <form onSubmit={handleRecommendSchemes} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                    {/* Full Name */}
                    <div>
                      <label className="font-bold block mb-1 text-gray-700 dark:text-gray-200">Full Name</label>
                      <input
                        type="text"
                        value={citizenProfile.name}
                        onChange={e => setCitizenProfile({...citizenProfile, name: e.target.value})}
                        placeholder="e.g. Sunita Devi"
                        className="w-full p-2.5 border rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 font-semibold"
                      />
                    </div>

                    {/* Gender */}
                    <div>
                      <label className="font-bold block mb-1 text-gray-700 dark:text-gray-200">Gender</label>
                      <select
                        value={citizenProfile.gender}
                        onChange={e => setCitizenProfile({...citizenProfile, gender: e.target.value})}
                        className="w-full p-2.5 border rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 font-semibold cursor-pointer"
                      >
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                        <option value="Transgender">Transgender / Other</option>
                      </select>
                    </div>

                    {/* Age */}
                    <div>
                      <label className="font-bold block mb-1 text-gray-700 dark:text-gray-200">Age (Years)</label>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={citizenProfile.age}
                        onChange={e => setCitizenProfile({...citizenProfile, age: e.target.value})}
                        className="w-full p-2.5 border rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 font-semibold"
                      />
                    </div>

                    {/* Occupation */}
                    <div>
                      <label className="font-bold block mb-1 text-gray-700 dark:text-gray-200">Occupation / Employment</label>
                      <select
                        value={citizenProfile.occupation}
                        onChange={e => setCitizenProfile({...citizenProfile, occupation: e.target.value})}
                        className="w-full p-2.5 border rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 font-semibold cursor-pointer"
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
                      <label className="font-bold block mb-1 text-gray-700 dark:text-gray-200">Annual Household Income (INR)</label>
                      <input
                        type="number"
                        value={citizenProfile.annual_income_inr}
                        onChange={e => setCitizenProfile({...citizenProfile, annual_income_inr: e.target.value})}
                        placeholder="e.g. 80000"
                        className="w-full p-2.5 border rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 font-semibold"
                      />
                    </div>

                    {/* State / UT */}
                    <div>
                      <label className="font-bold block mb-1 text-gray-700 dark:text-gray-200">State / Union Territory</label>
                      <select
                        value={citizenProfile.state}
                        onChange={e => setCitizenProfile({...citizenProfile, state: e.target.value})}
                        className="w-full p-2.5 border rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 font-semibold cursor-pointer"
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
                      <label className="font-bold block mb-1 text-gray-700 dark:text-gray-200">Social Category / Caste</label>
                      <select
                        value={citizenProfile.category}
                        onChange={e => setCitizenProfile({...citizenProfile, category: e.target.value})}
                        className="w-full p-2.5 border rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 font-semibold cursor-pointer"
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
                    <label className="font-bold block text-xs uppercase mb-2 text-gray-700 dark:text-gray-200">
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
                            className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-[#0f3d68] text-white border-[#0f3d68] shadow-xs'
                                : 'bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-gray-400'
                            }`}
                          >
                            <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                              isSelected ? 'bg-amber-400 text-slate-900 font-black' : 'border border-gray-400 dark:border-gray-500'
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
                    className="w-full py-3.5 bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
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
                  <div className={`p-6 rounded-lg border-l-4 border-l-[#ea580c] border shadow-md flex flex-wrap items-center justify-between gap-4 ${isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-[#e2e8f0]'}`}>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#ea580c] bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded">
                          Official Entitlement Assessment
                        </span>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          {recommendationsData.total_matched} Schemes Matched
                        </span>
                      </div>
                      <h3 className="text-xl font-black font-serif-gov text-[#0f3d68] dark:text-[#38bdf8]">
                        Recommended Welfare Programs for {citizenProfile.name || 'Citizen'}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                        {recommendationsData.profile_summary}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setRecommendationsData(null)}
                      className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer"
                    >
                      Reset Evaluation
                    </button>
                  </div>

                  {/* Schemes Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {recommendationsData.recommendations?.map((rec, idx) => (
                      <div
                        key={idx}
                        className={`p-6 rounded-lg border-t-4 border-t-[#0f3d68] border shadow-sm flex flex-col justify-between transition-all hover:shadow-md ${
                          isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-[#e2e8f0]'
                        }`}
                      >
                        <div>
                          {/* Score and Status */}
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-xs font-black px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              {rec.match_score}% MATCH
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                              {rec.eligibility_status || 'Highly Eligible'}
                            </span>
                          </div>

                          <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">
                            {rec.ministry} · {rec.category}
                          </div>
                          <h4 className="font-bold text-base font-serif-gov text-[#0f3d68] dark:text-[#38bdf8] mb-3">
                            {rec.scheme_name}
                          </h4>

                          {/* Why You Are Eligible */}
                          <div className="p-3 rounded text-xs bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/40 mb-3 space-y-1">
                            <div className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              Why You Are Applicable:
                            </div>
                            <div className="text-gray-700 dark:text-gray-200 text-[11px] leading-relaxed">
                              {rec.why_eligible}
                            </div>
                          </div>

                          {/* Key Benefit */}
                          <div className="p-3 rounded text-xs bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 mb-3">
                            <span className="font-bold text-[#ea580c] block mb-0.5">Key Entitlement / Benefit:</span>
                            <span className="text-gray-800 dark:text-gray-200 text-[11px]">
                              {rec.key_benefit}
                            </span>
                          </div>

                          {/* Required Documents */}
                          {rec.required_documents && rec.required_documents.length > 0 && (
                            <div className="mb-4">
                              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                                Required Documents for Verification:
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {rec.required_documents.map((doc, docIdx) => (
                                  <span
                                    key={docIdx}
                                    className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-gray-100 dark:bg-slate-700/80 text-gray-700 dark:text-gray-300 font-medium"
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
                        <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-2">
                          <span className="text-[10px] text-gray-500 line-clamp-1">
                            {rec.how_to_apply || 'Apply online or at nearest CSC'}
                          </span>
                          <a
                            href={rec.official_portal && rec.official_portal.startsWith('http') ? rec.official_portal : 'https://india.gov.in'}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 bg-[#0f3d68] hover:bg-[#0a2540] text-white text-[11px] font-bold uppercase rounded flex items-center gap-1 transition-all whitespace-nowrap cursor-pointer"
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
              <div className="flex flex-wrap gap-1.5 mb-8 justify-end">
                {['All', 'Agriculture', 'Finance', 'Housing', 'Energy', 'Women'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSchemeCategory(cat)}
                    className={`text-xs px-3.5 py-1.5 rounded font-bold uppercase transition-all cursor-pointer ${
                      schemeCategory === cat 
                        ? 'bg-[#ea580c] text-white shadow-xs' 
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200'
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
                      className={`p-6 rounded-lg border-t-4 border-t-[#ea580c] border shadow-xs flex flex-col justify-between ${
                        isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-[#e2e8f0]'
                      }`}
                    >
                      <div>
                        <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">{scheme.ministry || 'Government of India'}</div>
                        <h3 className="font-bold text-base font-serif-gov text-[#0f3d68] dark:text-[#38bdf8] mb-2">{scheme.name}</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-3 mb-4">{scheme.description}</p>
                      </div>
                      <button
                        onClick={() => { setSelectedScheme(scheme); setEligResult(null); }}
                        className="w-full py-2.5 bg-[#0f3d68] hover:bg-[#0a2540] text-white text-xs font-bold uppercase tracking-wider rounded transition-all cursor-pointer"
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
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
              <div className={`max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-lg p-6 shadow-2xl border ${isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-[#cbd5e1]'}`}>
                <div className="flex items-center justify-between pb-3 border-b mb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#ea580c]">Eligibility Evaluation</span>
                    <h3 className="text-lg font-bold font-serif-gov text-[#0f3d68] dark:text-[#38bdf8]">{selectedScheme.name}</h3>
                  </div>
                  <button 
                    onClick={() => setSelectedScheme(null)} 
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                    aria-label="Close modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                  <div>
                    <label className="font-bold block mb-1 text-gray-700 dark:text-gray-200">Full Name</label>
                    <input type="text" value={eligProfile.name} onChange={e => setEligProfile({...eligProfile, name: e.target.value})} className="w-full p-2 border rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100" />
                  </div>
                  <div>
                    <label className="font-bold block mb-1 text-gray-700 dark:text-gray-200">Annual Income (INR)</label>
                    <input type="number" value={eligProfile.annual_income_inr} onChange={e => setEligProfile({...eligProfile, annual_income_inr: e.target.value})} className="w-full p-2 border rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100" />
                  </div>
                  <div>
                    <label className="font-bold block mb-1 text-gray-700 dark:text-gray-200">State / UT</label>
                    <input type="text" value={eligProfile.state} onChange={e => setEligProfile({...eligProfile, state: e.target.value})} className="w-full p-2 border rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100" />
                  </div>
                  <div>
                    <label className="font-bold block mb-1 text-gray-700 dark:text-gray-200">Category</label>
                    <select value={eligProfile.category} onChange={e => setEligProfile({...eligProfile, category: e.target.value})} className="w-full p-2 border rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100">
                      <option>General</option><option>OBC</option><option>SC</option><option>ST</option><option>EWS</option>
                    </select>
                  </div>
                </div>

                <button 
                  onClick={handleMatchScheme} 
                  disabled={isMatching}
                  className="w-full py-3 bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold text-xs uppercase rounded shadow cursor-pointer"
                >
                  {isMatching ? 'EVALUATING ELIGIBILITY...' : 'RUN ELIGIBILITY CHECK'}
                </button>

                {eligResult && (
                  <div className="mt-6 pt-4 border-t space-y-3">
                    <div className="flex items-center justify-between p-4 rounded bg-gray-50 dark:bg-gray-800">
                      <div>
                        <div className="text-2xl font-black text-[#0f3d68] dark:text-[#38bdf8]">{eligResult.match_score}%</div>
                        <div className="text-xs uppercase font-bold text-gray-500">Eligibility Match Score</div>
                      </div>
                      <span className={`px-3 py-1 rounded text-xs font-bold uppercase ${eligResult.eligible ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                        {eligResult.eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 italic">{eligResult.recommendation}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── SECTION 8: MULTILINGUAL LEGAL EXPLAINER ── */}
      <section ref={multilingualRef} className={`py-16 border-b border-gray-200 dark:border-gray-800 ${activeTab !== 'translate' && activeTab !== 'all' ? 'hidden' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest bg-sky-50 text-sky-800 dark:bg-sky-950 dark:text-sky-300 mb-2 border border-sky-200 dark:border-sky-900">
              WORKSPACE · MODULE 6 · MULTILINGUAL ACCESS
            </div>
            <h2 className="text-3xl font-black font-serif-gov text-[#0f3d68] dark:text-[#38bdf8]">
              Indian Language Legal Translator
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Translate dense contractual clauses and government scheme mandates into 22 scheduled Indian languages with legal precision.
            </p>
          </div>

          <div className="max-w-3xl mx-auto p-6 sm:p-8 rounded-2xl border shadow-md bg-white dark:bg-[#1e293b] border-gray-200 dark:border-gray-700">
            {!currentDoc ? (
              <div className="text-center p-8 text-xs text-gray-500">
                <Globe className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p>Please load or upload a contract document in Module 1 to enable multi-lingual legal translation.</p>
                <button
                  type="button"
                  onClick={handleLoadDemoContract}
                  className="mt-4 px-4 py-2 bg-[#ea580c] hover:bg-[#c2410c] text-white text-xs font-bold uppercase rounded-lg shadow-sm transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-200" /> Load Demo Contract
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400">Source Document</span>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">{currentDoc.filename}</h4>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <select
                      value={targetLang}
                      onChange={e => setTargetLang(e.target.value)}
                      className="px-3 py-2 text-xs font-bold rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-200 cursor-pointer"
                    >
                      {INDIAN_LANGUAGES.map(l => (
                        <option key={l.code} value={l.name}>{l.name} ({l.native})</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={isTranslating}
                      onClick={handleTranslate}
                      className="px-4 py-2 bg-[#0f3d68] hover:bg-[#0a2540] disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${isTranslating ? 'animate-spin' : ''}`} />
                      <span>{isTranslating ? 'Translating...' : 'Translate'}</span>
                    </button>
                  </div>
                </div>

                {translatedText ? (
                  <div className="p-5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Translated into {targetLang}:
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSpeak(translatedText, targetLang)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer ${
                          isSpeaking && speakingText === translatedText
                            ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                            : 'bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 hover:border-amber-500 text-gray-700 dark:text-gray-200'
                        }`}
                        title={isSpeaking && speakingText === translatedText ? "Stop Audio Playback" : `Listen to ${targetLang} Translation Aloud`}
                      >
                        {isSpeaking && speakingText === translatedText ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5" />
                            <span>Stop Audio</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-[#ea580c]" />
                            <span>Listen in {targetLang}</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 leading-relaxed font-medium whitespace-pre-line">
                      {translatedText}
                    </p>
                  </div>
                ) : (
                  <div className="p-6 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-center text-xs text-gray-500">
                    Select an Indian language above and click <strong>Translate</strong> to generate an accurate legal translation.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── SECTION 9: INSPECTION RECORDS & AUDIT HISTORY ── */}
      <section ref={historyRef} className={`py-16 border-b transition-colors ${isDark ? 'bg-[#0d162e] border-[#1e293b]' : 'bg-[#f1f5f9] border-[#e2e8f0]'} ${activeTab !== 'history' && activeTab !== 'all' ? 'hidden' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-200 mb-2">
              WORKSPACE · MODULE 6
            </div>
            <h2 className="text-3xl font-black font-serif-gov text-[#0f3d68] dark:text-[#38bdf8]">
              Inspection & Audit Records
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Private audit history for <strong>{user?.name}</strong> ({user?.email}). Only contracts uploaded by your account are displayed here.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            {documents.length === 0 ? (
              <div className="p-8 rounded-lg border text-center text-gray-400 text-xs bg-white dark:bg-[#1e293b]">
                No historical inspection documents for your account yet. Upload a document in Module 1 to begin.
              </div>
            ) : (
              documents.map(doc => (
                <div key={doc.id} className={`p-4 rounded border flex items-center justify-between ${isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-[#e2e8f0]'}`}>
                  <div>
                    <div className="font-bold text-sm text-[#0f3d68] dark:text-[#38bdf8]">{doc.filename}</div>
                    <div className="text-xs text-gray-500">{doc.uploaded_at} · {doc.page_count} Pages · {doc.doc_type?.toUpperCase()}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`${API_BASE}/report/download/${doc.id}`}
                      target="_blank"
                      rel="noreferrer"
                      download
                      className="p-2 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      title="Download PDF Audit Report"
                    >
                      <Download className="w-4 h-4 text-[#ea580c]" />
                    </a>
                    <button
                      onClick={() => { setCurrentDoc(doc); scrollTo(uploadRef); }}
                      className="px-4 py-2 bg-[#0f3d68] hover:bg-[#0a2540] text-white text-xs font-bold uppercase rounded shadow-xs"
                    >
                      LOAD AUDIT
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className={`border-t py-12 transition-colors ${isDark ? 'bg-[#090d1a] border-[#1e293b] text-gray-400' : 'bg-[#0a2540] border-[#061726] text-gray-300'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10 text-xs">
            <div>
              <div className="flex items-center space-x-2.5 text-white font-bold font-serif-gov text-sm mb-3">
                <img src="/logo.jpg" alt="NyayaMitra AI Logo" className="w-7 h-7 rounded object-cover border border-amber-500/50" />
                <span>NyayaMitra AI</span>
              </div>
              <p className="text-gray-400 leading-relaxed">
                Empowering citizens, legal professionals, and regulatory authorities with artificial intelligence compliance verification.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold uppercase tracking-wider mb-3">National Initiatives</h4>
              <ul className="space-y-2">
                <li><a href="https://www.india.gov.in" target="_blank" rel="noreferrer" className="hover:text-white">National Portal of India</a></li>
                <li><a href="https://www.digitalindia.gov.in" target="_blank" rel="noreferrer" className="hover:text-white">Digital India Programme</a></li>
                <li><a href="https://www.mygov.in" target="_blank" rel="noreferrer" className="hover:text-white">MyGov Citizen Portal</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold uppercase tracking-wider mb-3">Support & Helpline</h4>
              <ul className="space-y-2">
                <li>Toll-Free Helpline: <strong>1915</strong></li>
                <li>Direct Citizen Assistance Desk</li>
                <li>DPDP Act Compliance Verified</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold uppercase tracking-wider mb-3">Data Sovereignty</h4>
              <p className="text-gray-400 leading-relaxed mb-2">
                Strict adherence to the Digital Personal Data Protection Act.
              </p>
              <div className="text-[11px] text-[#ea580c] font-bold">100% In-Country Data Processing</div>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-700/60 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 gap-4">
            <div>
              © 2026 NyayaMitra AI · Sovereign Legal & Welfare Intelligence Platform
            </div>
            <div className="flex space-x-4">
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ── STRONG AUTHENTICATION MODAL (GOOGLE FIREBASE + EMAIL/PASSWORD) ── */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className={`max-w-md w-full rounded-2xl p-6 sm:p-7 shadow-2xl border relative transition-all ${isDark ? 'bg-[#0f172a] border-[#334155]' : 'bg-white border-[#e2e8f0]'}`}>
            <button 
              type="button"
              onClick={() => { setShowAuthModal(false); setAuthError(''); }}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <img src="/logo.jpg" alt="NyayaMitra AI Logo" className="w-9 h-9 rounded-xl object-cover border border-amber-500/50 shadow-xs" />
              <div>
                <h3 className="font-bold text-lg font-serif-gov text-[#0f3d68] dark:text-[#38bdf8] leading-tight">
                  {authMode === 'login' ? 'Sign In to NyayaMitra' : authMode === 'register' ? 'Create GovTech Account' : 'Reset Password'}
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  {authMode === 'login' 
                    ? 'Access your private legal audits & inspection history' 
                    : authMode === 'register' 
                      ? 'Secure, encrypted citizen authentication' 
                      : 'Enter your email to receive a password reset link'}
                </p>
              </div>
            </div>

            {authError && (
              <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {/* Google OAuth Firebase Sign-In Button */}
            {authMode !== 'reset' && (
              <>
                <button
                  type="button"
                  disabled={authLoading}
                  onClick={handleGoogleSignIn}
                  className="w-full py-2.5 px-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-800 dark:text-gray-100 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>{authLoading ? 'Signing in with Google...' : 'Continue with Google'}</span>
                </button>

                <div className="relative flex items-center justify-center my-4">
                  <div className="border-t border-gray-200 dark:border-gray-700 w-full"></div>
                  <span className="bg-white dark:bg-[#0f172a] px-3 text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                    OR EMAIL
                  </span>
                </div>
              </>
            )}

            <form onSubmit={handleAuth} className="space-y-3.5">
              {authMode === 'register' && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-gray-700 dark:text-gray-300">
                    Full Name
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={authName}
                    onChange={e => setAuthName(e.target.value)}
                    placeholder="e.g. Aarav Sharma"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0f3d68]"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-gray-700 dark:text-gray-300">
                  Email Address
                </label>
                <input 
                  type="email" 
                  required 
                  value={authEmail}
                  onChange={e => setAuthEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0f3d68]"
                />
              </div>

              {authMode !== 'reset' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                      Password
                    </label>
                    {authMode === 'login' && (
                      <button
                        type="button"
                        onClick={() => { setAuthMode('reset'); setAuthError(''); }}
                        className="text-[11px] font-semibold text-[#ea580c] hover:underline cursor-pointer"
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
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0f3d68]"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 bg-[#0f3d68] hover:bg-[#0a2540] disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                {authLoading ? (
                  <span>Processing...</span>
                ) : authMode === 'login' ? (
                  'Sign In'
                ) : authMode === 'register' ? (
                  'Create Account'
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>

            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 text-center text-xs text-gray-500">
              {authMode === 'login' ? (
                <span>
                  Don't have an account?{' '}
                  <button type="button" onClick={() => { setAuthMode('register'); setAuthError(''); }} className="text-[#ea580c] font-bold hover:underline cursor-pointer">
                    Register here
                  </button>
                </span>
              ) : authMode === 'register' ? (
                <span>
                  Already have an account?{' '}
                  <button type="button" onClick={() => { setAuthMode('login'); setAuthError(''); }} className="text-[#ea580c] font-bold hover:underline cursor-pointer">
                    Sign in
                  </button>
                </span>
              ) : (
                <button type="button" onClick={() => { setAuthMode('login'); setAuthError(''); }} className="text-[#0f3d68] dark:text-sky-400 font-bold hover:underline cursor-pointer">
                  ← Back to Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MOBILE BOTTOM NAVIGATION BAR (Thumb-friendly on Android / iOS) ── */}
      <nav aria-label="Mobile Navigation" className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#060b18]/95 backdrop-blur-xl border-t border-gray-200/80 dark:border-gray-800/80 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-2 py-1.5 flex items-center justify-around">
        <button
          onClick={() => { setActiveTab('audit'); window.scrollTo({ top: 380, behavior: 'smooth' }); }}
          className={`flex flex-col items-center justify-center py-1.5 px-3 min-w-[58px] rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
            activeTab === 'audit'
              ? 'text-[#ea580c] dark:text-[#f97316] bg-orange-500/10 dark:bg-orange-500/20 shadow-2xs'
              : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
          }`}
        >
          <ShieldAlert className="w-5 h-5 mb-0.5" />
          <span>Audit</span>
        </button>

        <button
          onClick={() => { setActiveTab('chat'); window.scrollTo({ top: 400, behavior: 'smooth' }); }}
          className={`flex flex-col items-center justify-center py-1.5 px-3 min-w-[58px] rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
            activeTab === 'chat'
              ? 'text-[#ea580c] dark:text-[#f97316] bg-orange-500/10 dark:bg-orange-500/20 shadow-2xs'
              : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
          }`}
        >
          <Bot className="w-5 h-5 mb-0.5" />
          <span>Ask AI</span>
        </button>

        <button
          onClick={() => { setActiveTab('courtroom'); window.scrollTo({ top: 400, behavior: 'smooth' }); }}
          className={`flex flex-col items-center justify-center py-1.5 px-3 min-w-[58px] rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
            activeTab === 'courtroom'
              ? 'text-[#ea580c] dark:text-[#f97316] bg-orange-500/10 dark:bg-orange-500/20 shadow-2xs'
              : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
          }`}
        >
          <Scale className="w-5 h-5 mb-0.5" />
          <span>Courtroom</span>
        </button>

        <button
          onClick={() => { setActiveTab('redline'); window.scrollTo({ top: 400, behavior: 'smooth' }); }}
          className={`flex flex-col items-center justify-center py-1.5 px-3 min-w-[58px] rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
            activeTab === 'redline'
              ? 'text-[#ea580c] dark:text-[#f97316] bg-orange-500/10 dark:bg-orange-500/20 shadow-2xs'
              : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
          }`}
        >
          <FileCheck className="w-5 h-5 mb-0.5" />
          <span>Redline</span>
        </button>

        <button
          onClick={() => { setActiveTab('schemes'); window.scrollTo({ top: 400, behavior: 'smooth' }); }}
          className={`flex flex-col items-center justify-center py-1.5 px-3 min-w-[58px] rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
            activeTab === 'schemes'
              ? 'text-[#ea580c] dark:text-[#f97316] bg-orange-500/10 dark:bg-orange-500/20 shadow-2xs'
              : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
          }`}
        >
          <Sparkles className="w-5 h-5 mb-0.5" />
          <span>Schemes</span>
        </button>
      </nav>

    </div>
  );
}
