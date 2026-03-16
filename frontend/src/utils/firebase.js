// Firebase initialization and App Check helper
// Uses provided Firebase config and (optionally) App Check with reCAPTCHA v3

import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth"; // Export auth for Google Sign-In

// Prefer environment variables if provided (Vite), fallback to the given constants
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBThNEq2wzP1ybF0A1DtLxB-Fn44XDg0Yc",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "cardo-6cd15.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "cardo-6cd15",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "cardo-6cd15.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "730278224394",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:730278224394:web:bced3ccd89785923fd35f3",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-KTQY1206SC",
};

// Initialize (avoid duplicate init during HMR)
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// Export Firebase Auth instance for use in Google Sign-In
export const auth = getAuth(app);

let appCheckInitialized = false;
let appCheckInstance = null;

// Lazily import app-check to avoid loading it if not configured
export async function getAppCheckToken() {
  try {
    const siteKey = import.meta.env.VITE_FIREBASE_APPCHECK_SITE_KEY || null; // Provide this to enable App Check
    if (!siteKey) return null;

    if (!appCheckInitialized) {
      const { initializeAppCheck, ReCaptchaV3Provider } = await import("firebase/app-check");
      appCheckInstance = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(siteKey),
        isTokenAutoRefreshEnabled: true,
      });
      appCheckInitialized = true;
    }

    const { getToken } = await import("firebase/app-check");
    const { token } = await getToken(appCheckInstance, /* forceRefresh */ false);
    return token || null;
  } catch (err) {
    // Non-fatal: proceed without App Check token
    if (import.meta.env.DEV) console.warn("[AppCheck] Token fetch failed:", err?.message || err);
    return null;
  }
}

export { app, firebaseConfig };