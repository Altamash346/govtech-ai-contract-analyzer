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

export function getFirebaseConfig() {
  try {
    const raw = localStorage.getItem('gov_firebase_config');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.apiKey && parsed.apiKey.startsWith('AIzaSy')) {
        return parsed;
      }
    }
  } catch (e) {}

  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "govtech-ai-contract-analyzer.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "govtech-ai-contract-analyzer",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "govtech-ai-contract-analyzer.appspot.com",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "102938475610",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:102938475610:web:987654321abcdef"
  };
}

export function isFirebaseConfigured() {
  const cfg = getFirebaseConfig();
  const key = cfg.apiKey || '';
  return Boolean(key && !key.includes('Dummy') && key.startsWith('AIzaSy'));
}

// Initialize Firebase app safely
let app = getApps().length > 0 ? getApp() : initializeApp(getFirebaseConfig());
export let auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Dynamically reinitialize Firebase with real credentials provided by citizen / developer
 */
export async function reinitializeFirebase(newConfig) {
  try {
    localStorage.setItem('gov_firebase_config', JSON.stringify(newConfig));
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
  if (!isFirebaseConfigured()) {
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
      msg = 'This domain (localhost) is not yet in Authorized Domains in Firebase Console > Authentication > Settings > Authorized domains.';
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
  if (!isFirebaseConfigured()) {
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
  if (!isFirebaseConfigured()) {
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
  if (!auth.currentUser) {
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
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
