// frontend/src/firebase.js — Real Google OAuth & Firebase Authentication Client
import { initializeApp, getApps, getApp, deleteApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile
} from 'firebase/auth';

const FALLBACK_CONFIG = {
  apiKey: "AIzaSyA2sp9VwaFr3Kx4e8Uivq1kN4TLCqhiw9o",
  authDomain: "jandrishti-15147.firebaseapp.com",
  projectId: "jandrishti-15147",
  storageBucket: "jandrishti-15147.firebasestorage.app",
  messagingSenderId: "590612149482",
  appId: "1:590612149482:web:ccb4a8dd7f01d926639393"
};

export function isValidFirebaseKey(key, domain, projectId) {
  if (!key || typeof key !== 'string') return false;
  const trimmed = key.trim();
  if (!trimmed.startsWith('AIzaSy')) return false;
  if (trimmed.includes('Dummy') || trimmed.includes('...') || trimmed.length < 25) return false;
  if (domain && (domain.includes('your-project') || domain.includes('...'))) return false;
  if (projectId && (projectId.includes('your-project') || projectId.includes('...'))) return false;
  return true;
}

export function getFirebaseConfig() {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('gov_firebase_config') : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (isValidFirebaseKey(parsed.apiKey, parsed.authDomain, parsed.projectId)) {
        return parsed;
      }
    }
  } catch (e) {}

  const envKey = import.meta.env.VITE_FIREBASE_API_KEY;
  if (envKey && isValidFirebaseKey(envKey, import.meta.env.VITE_FIREBASE_AUTH_DOMAIN, import.meta.env.VITE_FIREBASE_PROJECT_ID)) {
    return {
      apiKey: envKey.trim(),
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "jandrishti-15147.firebaseapp.com",
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "jandrishti-15147",
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "jandrishti-15147.firebasestorage.app",
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "590612149482",
      appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:590612149482:web:ccb4a8dd7f01d926639393"
    };
  }

  return FALLBACK_CONFIG;
}

export function isFirebaseConfigured() {
  const cfg = getFirebaseConfig();
  return isValidFirebaseKey(cfg.apiKey, cfg.authDomain, cfg.projectId);
}

export async function resetFirebaseConfig() {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('gov_firebase_config');
    }
    const currentApps = getApps();
    for (const a of currentApps) {
      await deleteApp(a);
    }
    app = initializeApp(FALLBACK_CONFIG);
    auth = getAuth(app);
    return { success: true };
  } catch (err) {
    console.error('Error resetting Firebase:', err);
    return { success: false, error: err.message };
  }
}

// Safely initialize Firebase app & auth without ever crashing top-level import
let app;
try {
  app = getApps().length > 0 ? getApp() : initializeApp(getFirebaseConfig());
} catch (e) {
  console.warn('Firebase app init notice:', e);
}

export let auth = null;
try {
  auth = app ? getAuth(app) : null;
} catch (e) {
  console.warn('Firebase auth init notice:', e);
}

export const googleProvider = new GoogleAuthProvider();
try {
  googleProvider.setCustomParameters({ prompt: 'select_account' });
} catch (e) {}

/**
 * Dynamically reinitialize Firebase with real credentials provided by citizen / developer
 */
export async function reinitializeFirebase(newConfig) {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem('gov_firebase_config', JSON.stringify(newConfig));
    }
    const currentApps = getApps();
    for (const a of currentApps) {
      await deleteApp(a);
    }
    app = initializeApp(newConfig);
    auth = getAuth(app);
    return { success: true };
  } catch (err) {
    console.error('Error reinitializing Firebase:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Sign in using official Google OAuth Popup (verifies actual Google account)
 */
export async function signInWithGoogle() {
  if (!isFirebaseConfigured() || !auth) {
    return {
      success: false,
      needsSetup: true,
      error: 'Google Sign-In requires your Firebase project credentials to verify real Google accounts.'
    };
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    return {
      success: true,
      user: {
        uid: result.user.uid,
        email: result.user.email,
        name: result.user.displayName || result.user.email.split('@')[0],
        photoURL: result.user.photoURL,
      }
    };
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    let msg = error.message;
    if (error.code === 'auth/popup-closed-by-user') {
      msg = 'Sign-in cancelled. Popup was closed before completing.';
    } else if (error.code === 'auth/popup-blocked') {
      msg = 'Sign-in popup was blocked by your browser. Please allow popups for this site.';
    } else if (error.code === 'auth/unauthorized-domain') {
      const currentHost = typeof window !== 'undefined' && window.location ? window.location.hostname : 'current domain';
      msg = `This domain (${currentHost}) is not authorized in Firebase. Go to Firebase Console > Authentication > Settings > Authorized domains > Add domain, and add "${currentHost}".`;
    } else if (error.code === 'auth/operation-not-allowed') {
      msg = 'Google provider is not enabled. Go to Firebase Console > Authentication > Sign-in method > Enable Google.';
    } else if (error.code === 'auth/invalid-api-key' || error.code === 'auth/api-key-not-valid') {
      msg = 'Firebase API key is invalid. Please verify your Web App configuration.';
    }
    return { success: false, error: msg, code: error.code };
  }
}

/**
 * Sign in with Email and Password
 */
export async function loginWithEmail(email, password) {
  if (!isFirebaseConfigured() || !auth) {
    return { success: false, isFallback: true, code: 'auth/api-key-not-valid' };
  }
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return {
      success: true,
      user: {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        name: userCredential.user.displayName || userCredential.user.email.split('@')[0],
        photoURL: userCredential.user.photoURL,
      }
    };
  } catch (error) {
    if (error.code?.includes('api-key') || error.message?.includes('api-key')) {
      return { success: false, isFallback: true, code: 'auth/api-key-not-valid' };
    }
    let msg = error.message;
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      msg = 'Invalid email or password.';
    } else if (error.code === 'auth/invalid-email') {
      msg = 'Please enter a valid email address.';
    } else if (error.code === 'auth/too-many-requests') {
      msg = 'Access temporarily disabled due to many failed login attempts. Please try again later.';
    }
    return { success: false, error: msg, code: error.code };
  }
}

/**
 * Register a new user with strong password
 */
export async function registerWithEmail(name, email, password) {
  if (!isFirebaseConfigured() || !auth) {
    return { success: false, isFallback: true, code: 'auth/api-key-not-valid' };
  }
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (name && auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName: name });
    }
    return {
      success: true,
      user: {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        name: name || userCredential.user.email.split('@')[0],
        photoURL: userCredential.user.photoURL,
      }
    };
  } catch (error) {
    if (error.code?.includes('api-key') || error.message?.includes('api-key')) {
      return { success: false, isFallback: true, code: 'auth/api-key-not-valid' };
    }
    let msg = error.message;
    if (error.code === 'auth/email-already-in-use') {
      msg = 'An account with this email address already exists.';
    } else if (error.code === 'auth/weak-password') {
      msg = 'Password should be at least 6 characters.';
    }
    return { success: false, error: msg, code: error.code };
  }
}

/**
 * Send password reset email
 */
export async function resetUserPassword(email) {
  if (!auth) {
    return { success: false, error: 'Authentication service is not initialized.' };
  }
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true, message: 'Password reset link sent to your email.' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Send email verification link to current authenticated Firebase user
 */
export async function sendFirebaseEmailVerification() {
  if (!auth || !auth.currentUser) {
    return { success: false, error: 'No active user found.' };
  }
  try {
    await sendEmailVerification(auth.currentUser);
    return { success: true, message: 'Verification email sent. Please check your inbox and spam folder.' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Sign out
 */
export async function logoutFirebase() {
  if (!auth) {
    return { success: true };
  }
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
