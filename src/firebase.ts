import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, doc } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

let db: any = null;
let auth: any = null;
let isRealFirebase = false;

try {
  // Check if we have valid Firebase API credentials and didn't fall back to placeholders
  const isPlaceholder = !firebaseConfig.apiKey || 
                       firebaseConfig.apiKey.includes("FakeKeyPlaceholder") || 
                       firebaseConfig.projectId.includes("smart-invoice-assistant");
                       
  if (!isPlaceholder) {
    const app = initializeApp(firebaseConfig);
    const databaseId = "firestoreDatabaseId" in firebaseConfig ? (firebaseConfig as any).firestoreDatabaseId : undefined;
    db = initializeFirestore(app, { 
      experimentalForceLongPolling: true,
      experimentalAutoDetectLongPolling: false
    }, databaseId);
    auth = getAuth(app);
    isRealFirebase = true;
    console.log("🔥 Successfully initialized real Firebase service connecting to:", firebaseConfig.projectId);
  } else {
    // Initialize mock fallback instance so imports do not break during compile
    const app = initializeApp(firebaseConfig);
    const databaseId = "firestoreDatabaseId" in firebaseConfig ? (firebaseConfig as any).firestoreDatabaseId : undefined;
    db = initializeFirestore(app, { 
      experimentalForceLongPolling: true,
      experimentalAutoDetectLongPolling: false
    }, databaseId);
    auth = getAuth(app);
    isRealFirebase = false;
    console.log("ℹ️ Initialized local container mode for Firebase.");
  }
} catch (error) {
  console.warn("⚠️ Firebase integration initialized in local fallback mode:", error);
  isRealFirebase = false;
}

export { db, auth, isRealFirebase };

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write"
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

/**
 * Custom Error Handler mandated by Firebase Security Rules specifications.
 * Serializes permission and rule blocks to JSON structure for debugging.
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || false,
      isAnonymous: auth?.currentUser?.isAnonymous || false
    },
    operationType,
    path
  };
  console.error("🔒 Firestore Security Violation/Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
