import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, FileText, Upload, MessageSquare, Scale, Share2, Edit3, 
  Globe, Landmark, Folder, Sun, Moon, LogOut, CheckCircle, AlertTriangle, 
  XCircle, Send, Volume2, Download, Search, ChevronRight, User, Building,
  Calendar, DollarSign, Layers, ArrowRight, Sparkles, Cpu, Lock, PhoneCall,
  ExternalLink, Award, CheckCircle2, ChevronDown, BookOpen, Activity, AlertCircle,
  FileCheck, HelpCircle
} from 'lucide-react';

const API_BASE = '/api';

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

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('gov_theme') || 'bright');
  const [aiMode, setAiMode] = useState(() => localStorage.getItem('gov_aimode') || 'fast');
  const [siteLang, setSiteLang] = useState(() => localStorage.getItem('gov_site_lang') || 'en');
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('gov_user');
    return saved ? JSON.parse(saved) : null;
  });

  const changeSiteLanguage = (langCode) => {
    setSiteLang(langCode);
    localStorage.setItem('gov_site_lang', langCode);

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
    localStorage.setItem('gov_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('gov_aimode', aiMode);
  }, [aiMode]);

  const fetchUserDocuments = (userId) => {
    if (!userId) {
      setDocuments([]);
      return;
    }
    fetch(`${API_BASE}/documents?user_id=${userId}`)
      .then(r => r.json())
      .then(d => setDocuments(d.documents || []))
      .catch(() => setDocuments([]));
  };

  useEffect(() => {
    fetch(`${API_BASE}/schemes`)
      .then(r => r.json())
      .then(d => setSchemes(d.schemes || []))
      .catch(() => {});

    if (user?.id) {
      fetchUserDocuments(user.id);
    } else {
      setDocuments([]);
      setCurrentDoc(null);
    }
  }, [user]);

  // Auth Submit
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    const endpoint = authMode === 'login' ? '/auth/login' : '/auth/register';
    const payload = authMode === 'login' 
      ? { email: authEmail, password: authPassword }
      : { name: authName, email: authEmail, password: authPassword };
    
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Authentication failed');
      
      if (authMode === 'login') {
        setUser(data.user);
        localStorage.setItem('gov_user', JSON.stringify(data.user));
        setShowAuthModal(false);
        fetchUserDocuments(data.user.id);
      } else {
        setAuthMode('login');
        setAuthError('Account registered successfully! Please log in.');
      }
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('gov_user');
    setCurrentDoc(null);
    setDocuments([]);
    setMessages([]);
    setDebateResult(null);
    setTranslatedText('');
    setRecommendationsData(null);
  };

  // Upload handler
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;
    if (!user?.id) {
      alert('Authentication required. Please log in before uploading documents.');
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

      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Analysis failed');

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
      const res = await fetch(`${API_BASE}/chat`, {
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
      const data = await res.json();
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
      const res = await fetch(`${API_BASE}/multi-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contract_text: currentDoc.full_text, ai_mode: aiMode })
      });
      const data = await res.json();
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
      const res = await fetch(`${API_BASE}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: currentDoc.full_text.slice(0, 1500),
          target_language: targetLang
        })
      });
      const data = await res.json();
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
      const res = await fetch(`${API_BASE}/schemes/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheme_text: selectedScheme.full_text,
          profile: eligProfile,
          ai_mode: aiMode
        })
      });
      const data = await res.json();
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
      const res = await fetch(`${API_BASE}/schemes/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: citizenProfile,
          ai_mode: aiMode
        })
      });
      const data = await res.json();
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

  // ─── AUTHENTICATION GATEWAY (Access blocked before login) ───
  if (!user) {
    return (
      <div className={`min-h-screen font-sans flex flex-col transition-colors duration-200 ${isDark ? 'bg-[#0b1329] text-[#f8fafc]' : 'bg-[#f8fafc] text-[#0f2b48]'}`}>
        {/* National Identity Tricolor Bar */}
        <div className="h-1.5 w-full flex">
          <div className="h-full w-1/3 bg-[#FF9933]"></div>
          <div className="h-full w-1/3 bg-white"></div>
          <div className="h-full w-1/3 bg-[#138808]"></div>
        </div>

        {/* Top Utility Header */}
        <header className={`border-b py-3 px-4 sm:px-8 flex items-center justify-between transition-colors ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-[#e2e8f0]'}`}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded bg-[#0f3d68] text-white flex items-center justify-center font-bold shadow-md">
              <Scale className="w-5 h-5 text-[#ea580c]" />
            </div>
            <div>
              <div className="text-[10px] font-bold tracking-widest uppercase text-[#ea580c]">
                भारत सरकार · GOVERNMENT OF INDIA
              </div>
              <div className="text-lg font-black font-serif-gov text-[#0f3d68] dark:text-[#38bdf8]">
                NyayaMitra AI
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2.5">
            {/* Indian Language Selector */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-semibold ${
              isDark ? 'bg-[#1e293b] border-[#334155] text-slate-200' : 'bg-white border-[#cbd5e1] text-gray-700 shadow-xs'
            }`}>
              <Globe className="w-3.5 h-3.5 text-[#ea580c] shrink-0" />
              <select
                value={siteLang}
                onChange={(e) => changeSiteLanguage(e.target.value)}
                aria-label="Select Indian Language"
                className="bg-transparent border-none text-xs font-semibold focus:outline-none cursor-pointer pr-1 text-inherit"
              >
                {INDIAN_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code} className={isDark ? 'bg-[#1e293b] text-white' : 'bg-white text-gray-900'}>
                    {l.native} ({l.name})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setTheme(isDark ? 'bright' : 'dark')}
              className={`p-1.5 rounded border transition-all cursor-pointer ${isDark ? 'bg-[#1e293b] border-[#334155] text-amber-400' : 'bg-white border-[#cbd5e1] text-gray-700'}`}
              title="Toggle Bright/Dark mode"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Authentication Gateway Main Container */}
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="max-w-md w-full">
            {/* National Seal Badge */}
            <div className="text-center mb-6">
              <div className="inline-block px-3.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest bg-amber-50 text-[#c2410c] border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900 mb-3 shadow-xs">
                OFFICIAL GOVERNMENT GATEWAY · SECURE AUTHENTICATION
              </div>
              <h1 className="text-2xl sm:text-3xl font-black font-serif-gov text-[#0f3d68] dark:text-[#38bdf8]">
                NyayaMitra AI
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                Sign in to access your private legal contract audit workspace, automated visual PDF redlines, and citizen welfare scheme recommendations.
              </p>
            </div>

            {/* Auth Card */}
            <div className={`p-6 sm:p-8 rounded-2xl shadow-xl border-t-4 border-t-[#0f3d68] border transition-colors ${isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-[#e2e8f0]'}`}>
              {/* Tab Selector */}
              <div className={`p-1 rounded-lg border flex items-center mb-6 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-gray-100 border-gray-200'}`}>
                <button
                  type="button"
                  onClick={() => { setAuthMode('login'); setAuthError(''); }}
                  className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all cursor-pointer ${
                    authMode === 'login'
                      ? 'bg-[#0f3d68] text-white shadow-xs'
                      : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('register'); setAuthError(''); }}
                  className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all cursor-pointer ${
                    authMode === 'register'
                      ? 'bg-[#0f3d68] text-white shadow-xs'
                      : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {authError && (
                <div className={`mb-5 p-3 rounded text-xs font-semibold border ${
                  authError.includes('successfully')
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800'
                }`}>
                  {authError}
                </div>
              )}

              <form onSubmit={handleAuth} className="space-y-4">
                {authMode === 'register' && (
                  <div>
                    <label className="block text-xs font-bold uppercase mb-1.5 text-gray-700 dark:text-gray-200">
                      Full Legal Name
                    </label>
                    <input
                      type="text"
                      required
                      value={authName}
                      onChange={e => setAuthName(e.target.value)}
                      placeholder="e.g. Aarav Sharma"
                      className="w-full px-3.5 py-2.5 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-[#0f3d68]"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase mb-1.5 text-gray-700 dark:text-gray-200">
                    Official Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={e => setAuthEmail(e.target.value)}
                    placeholder="e.g. officer@gov.in or user@gmail.com"
                    className="w-full px-3.5 py-2.5 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-[#0f3d68]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase mb-1.5 text-gray-700 dark:text-gray-200">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={e => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-[#0f3d68]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold text-xs uppercase tracking-wider rounded shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  <Shield className="w-4 h-4" />
                  {authMode === 'login' ? 'SIGN IN TO WORKSPACE' : 'CREATE OFFICIAL ACCOUNT'}
                </button>
              </form>

              {/* Quick Demo Switcher / Login Shortcut for testing */}
              {authMode === 'login' && (
                <div className="mt-6 pt-5 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Quick Test Sign-In (Select User Account):
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { name: 'meet', email: 'meet@gmail.com' },
                      { name: 'bbb', email: 'bbb@gmail.com' },
                      { name: 'aaa', email: 'aaa@gmail.com' }
                    ].map(u => (
                      <button
                        key={u.email}
                        type="button"
                        onClick={() => {
                          setAuthEmail(u.email);
                          setAuthPassword('123');
                        }}
                        className={`p-2 rounded border text-center transition-all cursor-pointer text-[11px] font-semibold ${
                          authEmail === u.email
                            ? 'bg-[#0f3d68] text-white border-[#0f3d68]'
                            : 'bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-gray-400'
                        }`}
                      >
                        <User className="w-3.5 h-3.5 mx-auto mb-0.5 opacity-70" />
                        {u.name}
                      </button>
                    ))}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-2 text-center">
                    Each user account has its own isolated audit history.
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Security Highlights */}
            <div className="mt-6 text-center space-y-1">
              <div className="flex items-center justify-center gap-2 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                <Lock className="w-3.5 h-3.5 text-[#138808]" /> 100% In-Country Sovereign Data Security & DPDP Compliance
              </div>
              <p className="text-[10px] text-gray-400">
                Documents and audit history are strictly segregated and only accessible by the authenticated user.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans transition-colors duration-200 ${isDark ? 'bg-[#0b1329] text-[#f8fafc]' : 'bg-[#f8fafc] text-[#0f2b48]'}`}>
      
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
              <span className="text-[10px] uppercase font-bold text-gray-500 hidden sm:inline">Processing:</span>
              <div className={`flex items-center rounded p-0.5 border text-[11px] font-semibold ${isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-[#cbd5e1]'}`}>
                <button
                  type="button"
                  onClick={() => setAiMode('fast')}
                  className={`flex items-center gap-1 px-2.5 py-0.5 rounded transition-all ${aiMode === 'fast' ? 'bg-[#ea580c] text-white shadow-xs' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                  title="Faster processing mode (cloud)"
                >
                  <Sparkles className="w-3 h-3" /> Faster (not that much secure)
                </button>
                <button
                  type="button"
                  onClick={() => setAiMode('secure')}
                  className={`flex items-center gap-1 px-2.5 py-0.5 rounded transition-all ${aiMode === 'secure' ? 'bg-[#0f3d68] text-white shadow-xs' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                  title="Slower processing mode (local, private)"
                >
                  <Lock className="w-3 h-3" /> Slower (secure)
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
            <div className="w-11 h-11 rounded bg-[#0f3d68] text-white flex items-center justify-center font-bold shadow-md">
              <Scale className="w-6 h-6 text-[#ea580c]" />
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

          {/* Auth Button */}
          <div>
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-[#0f3d68] dark:text-[#38bdf8]">{user.name}</div>
                  <div className="text-[10px] text-gray-500">{user.email}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
                  className="px-4 py-2 bg-[#0f3d68] hover:bg-[#0a2540] text-white text-xs font-bold uppercase tracking-wider rounded shadow-sm transition-all"
                >
                  Login
                </button>
                <button
                  onClick={() => { setAuthMode('register'); setShowAuthModal(true); }}
                  className="px-4 py-2 border border-[#0f3d68] text-[#0f3d68] dark:border-gray-500 dark:text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
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
              <div className="flex flex-wrap gap-4 pt-2">
                <button 
                  onClick={() => scrollTo(uploadRef)}
                  className="px-8 py-4 bg-[#0f3d68] hover:bg-[#0a2540] text-white font-bold text-sm tracking-wider uppercase rounded shadow-lg transition-all flex items-center gap-2 border-2 border-[#0f3d68] cursor-pointer"
                >
                  UPLOAD & ANALYZE <ArrowRight className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => scrollTo(schemesRef)}
                  className="px-8 py-4 bg-white hover:bg-gray-50 text-[#0f3d68] font-bold text-sm tracking-wider uppercase rounded border-2 border-[#0f3d68] shadow-sm transition-all dark:bg-transparent dark:text-white dark:border-gray-500 cursor-pointer"
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
      <section ref={uploadRef} className="py-16 border-b border-gray-200 dark:border-gray-800">
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
                      <option value="fast">⚡ Faster (not that much secure)</option>
                      <option value="secure">🔒 Slower (secure)</option>
                    </select>
                  </div>
                </div>

                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-[#ea580c] transition-all bg-gray-50/50 dark:bg-gray-900/30">
                  <input 
                    type="file" 
                    accept=".pdf" 
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
                <div className="p-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
                    <div>
                      <h4 className="font-bold text-sm text-emerald-950 dark:text-emerald-200">{currentDoc.filename}</h4>
                      <p className="text-xs text-emerald-700 dark:text-emerald-400">{currentDoc.page_count} Pages Indexed · Analysis Complete</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <a
                      href={`http://localhost:8000/api/report/download/${currentDoc.id}`}
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
                    <div className="text-2xl font-black text-red-600">{(currentDoc.risks || []).filter(r => r.risk_level === 'High').length}</div>
                    <div className="text-xs text-gray-500 uppercase font-semibold mt-1">High Risks</div>
                  </div>
                  <div className={`p-4 rounded border text-center ${isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-[#e2e8f0]'}`}>
                    <div className="text-2xl font-black text-amber-500">{(currentDoc.risks || []).filter(r => r.risk_level === 'Medium').length}</div>
                    <div className="text-xs text-gray-500 uppercase font-semibold mt-1">Medium Risks</div>
                  </div>
                  <div className={`p-4 rounded border text-center ${isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-[#e2e8f0]'}`}>
                    <div className="text-2xl font-black text-[#0f3d68] dark:text-[#38bdf8]">{(currentDoc.clauses || []).length}</div>
                    <div className="text-xs text-gray-500 uppercase font-semibold mt-1">Clauses Classified</div>
                  </div>
                  <div className={`p-4 rounded border text-center ${isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-[#e2e8f0]'}`}>
                    <div className="text-2xl font-black text-emerald-600">{Object.keys(currentDoc.entities || {}).length}</div>
                    <div className="text-xs text-gray-500 uppercase font-semibold mt-1">Entity Categories</div>
                  </div>
                </div>

                {/* Summary */}
                <div className={`p-6 rounded-lg border shadow-sm ${isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-[#e2e8f0]'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-bold font-serif-gov text-[#0f3d68] dark:text-[#38bdf8]">Executive Summary</h3>
                    <a
                      href={`http://localhost:8000/api/report/download/${currentDoc.id}`}
                      target="_blank"
                      rel="noreferrer"
                      download
                      className="text-xs font-bold text-[#ea580c] hover:underline flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" /> Download Full PDF Report
                    </a>
                  </div>
                  <p className="text-xs leading-relaxed text-gray-700 dark:text-gray-300">{currentDoc.summary}</p>
                </div>

                {/* Detected Risks & Remediation */}
                <div className={`p-6 rounded-lg border shadow-sm ${isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-[#e2e8f0]'}`}>
                  <h3 className="text-base font-bold font-serif-gov text-[#0f3d68] dark:text-[#38bdf8] mb-4">
                    Detected Risks & Remediation ({(currentDoc.risks || []).length})
                  </h3>
                  <div className="space-y-3">
                    {(currentDoc.risks || []).map((risk, i) => (
                      <div key={i} className={`p-4 rounded border-l-4 text-xs ${
                        risk.risk_level === 'High' 
                          ? 'bg-red-50 border-red-500 text-red-950 dark:bg-red-950/30 dark:text-red-200' 
                          : 'bg-amber-50 border-amber-500 text-amber-950 dark:bg-amber-950/30 dark:text-amber-200'
                      }`}>
                        <div className="font-bold uppercase text-[11px] mb-1">[{risk.risk_level}] {risk.clause_type}</div>
                        <blockquote className="italic mb-2 border-l-2 pl-2 border-gray-400">"{risk.risky_excerpt}"</blockquote>
                        <div className="mb-1"><strong>Why Risky:</strong> {risk.why_risky}</div>
                        <div><strong>Remediation:</strong> <span className="font-semibold text-emerald-700 dark:text-emerald-400">{risk.suggested_replacement}</span></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── SECTION 4: INTERACTIVE Q&A CHAT MODULE ── */}
      <section ref={chatRef} className={`py-16 border-b transition-colors ${isDark ? 'bg-[#0d162e] border-[#1e293b]' : 'bg-[#f1f5f9] border-[#e2e8f0]'}`}>
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
                      {aiMode === 'fast' ? '⚡ Faster (not that much secure)' : '🔒 Slower (secure)'}
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
      <section ref={debateRef} className="py-16 border-b border-gray-200 dark:border-gray-800">
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
                                <div className="p-3.5 rounded border border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/20 space-y-1">
                                  <div className="font-bold text-red-800 dark:text-red-400 flex items-center gap-1">
                                    ⚔️ The Critic (Prosecution):
                                  </div>
                                  <div className="text-gray-700 dark:text-gray-300 leading-relaxed text-[11px]">
                                    {d.critic_argument}
                                  </div>
                                </div>

                                {/* Defender */}
                                <div className="p-3.5 rounded border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-1">
                                  <div className="font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1">
                                    🛡️ The Defender (Defense Counsel):
                                  </div>
                                  <div className="text-gray-700 dark:text-gray-300 leading-relaxed text-[11px]">
                                    {d.defender_argument}
                                  </div>
                                </div>

                                {/* Judge */}
                                <div className="p-3.5 rounded border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 space-y-1">
                                  <div className="font-bold text-blue-800 dark:text-blue-400 flex items-center gap-1">
                                    ⚖️ Judicial Verdict (Magistrate):
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
      <section ref={redlineRef} className={`py-16 border-b transition-colors ${isDark ? 'bg-[#0d162e] border-[#1e293b]' : 'bg-[#f1f5f9] border-[#e2e8f0]'}`}>
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
                        {(() => {
                          const rList = typeof currentDoc.risks === 'string' ? JSON.parse(currentDoc.risks || '[]') : (currentDoc.risks || []);
                          return `${rList.length} Risky Clauses Red-Marked`;
                        })()}
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
                      {(() => {
                        const rList = typeof currentDoc.risks === 'string' ? JSON.parse(currentDoc.risks || '[]') : (currentDoc.risks || []);
                        if (rList.length === 0) {
                          return (
                            <div className="p-6 text-center text-xs text-gray-500">
                              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                              No high or medium risks detected in this document.
                            </div>
                          );
                        }
                        return rList.map((risk, idx) => (
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

                            {/* Why it's risky */}
                            <div>
                              <div className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 mb-0.5">
                                Hazard Assessment:
                              </div>
                              <p className="text-gray-700 dark:text-gray-300 text-[11px] leading-relaxed">
                                {risk.why_risky}
                              </p>
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
                        ));
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── SECTION 7: NATIONAL WELFARE SCHEME DIRECTORY & CITIZEN RECOMMENDER ── */}
      <section ref={schemesRef} className="py-16 border-b border-gray-200 dark:border-gray-800">
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
                      className="px-2.5 py-1 text-[11px] font-semibold rounded bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 cursor-pointer"
                    >
                      👩 Female Farmer (28)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetProfile('student_male')}
                      className="px-2.5 py-1 text-[11px] font-semibold rounded bg-sky-50 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 cursor-pointer"
                    >
                      👨 Male Student (22)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetProfile('senior_male')}
                      className="px-2.5 py-1 text-[11px] font-semibold rounded bg-purple-50 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 cursor-pointer"
                    >
                      👴 Senior Citizen (65)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetProfile('business_msme')}
                      className="px-2.5 py-1 text-[11px] font-semibold rounded bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 cursor-pointer"
                    >
                      💼 MSME Trader (38)
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
                        { id: 'Owns Agricultural Land', label: '🌾 Owns Agricultural Land' },
                        { id: 'BPL / Ration Card Holder', label: '💳 BPL / Ration Card Holder' },
                        { id: 'Pregnant / Lactating Mother', label: '👶 Pregnant / Lactating Mother' },
                        { id: 'Person with Disability (PwD)', label: '♿ Person with Disability (PwD)' },
                        { id: 'Does Not Own a Pucca House', label: '🏠 Does Not Own Pucca House' },
                        { id: 'Seeking Business / MSME Loan', label: '💼 Seeking Business / Startup Loan' },
                        { id: 'Seeking Higher Education / Skill Training', label: '🎓 Seeking Higher Education / Skill Training' }
                      ].map(item => {
                        const isSelected = citizenProfile.special_conditions.includes(item.id);
                        return (
                          <button
                            type="button"
                            key={item.id}
                            onClick={() => toggleSpecialCondition(item.id)}
                            className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#0f3d68] text-white border-[#0f3d68] shadow-xs'
                                : 'bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-gray-400'
                            }`}
                          >
                            {isSelected ? '✓ ' : ''}{item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isRecommending}
                    className="w-full py-3.5 bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold text-xs uppercase tracking-wider rounded shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    {isRecommending ? 'ANALYZING 96 WELFARE SCHEMES FOR YOUR PROFILE...' : 'FIND MY ELIGIBLE WELFARE SCHEMES 🎯'}
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
                                    className="text-[10px] px-2 py-0.5 rounded bg-gray-100 dark:bg-slate-700/80 text-gray-700 dark:text-gray-300 font-medium"
                                  >
                                    📄 {doc}
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
                  <button onClick={() => setSelectedScheme(null)} className="text-gray-400 hover:text-gray-600 font-bold text-lg cursor-pointer">✕</button>
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

      {/* ── SECTION 8: INSPECTION RECORDS & AUDIT HISTORY ── */}
      <section ref={historyRef} className={`py-16 border-b transition-colors ${isDark ? 'bg-[#0d162e] border-[#1e293b]' : 'bg-[#f1f5f9] border-[#e2e8f0]'}`}>
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
              <div className="flex items-center space-x-2 text-white font-bold font-serif-gov text-sm mb-3">
                <Scale className="w-5 h-5 text-[#ea580c]" />
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

      {/* ── SIMPLE LOGIN & REGISTER MODAL ── */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className={`max-w-md w-full rounded-lg p-6 shadow-2xl border-t-4 border-t-[#0f3d68] border relative ${isDark ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-[#e2e8f0]'}`}>
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 font-bold"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-6 h-6 text-[#ea580c]" />
              <h3 className="font-bold text-lg font-serif-gov text-[#0f3d68] dark:text-[#38bdf8]">
                {authMode === 'login' ? 'Sign In' : 'Create Account'}
              </h3>
            </div>

            {authError && (
              <div className="mb-4 p-2.5 rounded bg-amber-50 text-amber-900 border border-amber-200 text-xs">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              {authMode === 'register' && (
                <div>
                  <label className="block text-xs font-bold uppercase mb-1 text-gray-700 dark:text-gray-200">Full Name</label>
                  <input 
                    type="text" 
                    required 
                    value={authName}
                    onChange={e => setAuthName(e.target.value)}
                    placeholder="e.g. Aarav Sharma"
                    className="w-full px-3 py-2 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase mb-1 text-gray-700 dark:text-gray-200">Email Address</label>
                <input 
                  type="email" 
                  required 
                  value={authEmail}
                  onChange={e => setAuthEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full px-3 py-2 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase mb-1 text-gray-700 dark:text-gray-200">Password</label>
                <input 
                  type="password" 
                  required 
                  value={authPassword}
                  onChange={e => setAuthPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#0f3d68] hover:bg-[#0a2540] text-white font-bold text-xs uppercase tracking-wider rounded shadow transition-all"
              >
                {authMode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
              </button>
            </form>

            <div className="mt-4 text-center text-xs text-gray-500">
              {authMode === 'login' ? (
                <span>Don't have an account? <button onClick={() => setAuthMode('register')} className="text-[#ea580c] font-bold">Register here</button></span>
              ) : (
                <span>Already have an account? <button onClick={() => setAuthMode('login')} className="text-[#ea580c] font-bold">Sign in</button></span>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
