// /lib/firebase-admin.ts
// Server-side Firebase Admin SDK initialization for Firestore and token verification

import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

let adminApp: App;

const getAdminApp = () => {
  if (!getApps().length) {
    // Initialize Firebase Admin if not already initialized
    // Firebase service account JSON contains: project_id, client_email, private_key
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (serviceAccount) {
      // If you have the entire JSON as a string in env var
      try {
        const key = JSON.parse(serviceAccount);
        adminApp = initializeApp({
          credential: cert(key),
        });
      } catch (error) {
        throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT_KEY JSON format");
      }
    } else {
      // Fallback: individual env vars for flexibility
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(
        /\\n/g,
        "\n"
      );

      if (!projectId || !clientEmail || !privateKey) {
        throw new Error(
          "Missing Firebase Admin credentials. Please set FIREBASE_SERVICE_ACCOUNT_KEY (recommended) or FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env.local"
        );
      }

      adminApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    }
  } else {
    adminApp = getApps()[0];
  }
  return adminApp;
};

// True lazy initialization - only initialize when accessed
let _dbInstance: ReturnType<typeof getFirestore> | null = null;
let _adminAuthInstance: ReturnType<typeof getAuth> | null = null;

export const db = new Proxy({} as ReturnType<typeof getFirestore>, {
  get(target, prop) {
    if (!_dbInstance) {
      _dbInstance = getFirestore(getAdminApp());
    }
    const value = (_dbInstance as any)[prop];
    return typeof value === "function" ? value.bind(_dbInstance) : value;
  },
});

export const adminAuth = new Proxy({} as ReturnType<typeof getAuth>, {
  get(target, prop) {
    if (!_adminAuthInstance) {
      _adminAuthInstance = getAuth(getAdminApp());
    }
    const value = (_adminAuthInstance as any)[prop];
    return typeof value === "function" ? value.bind(_adminAuthInstance) : value;
  },
});

export { adminApp };
