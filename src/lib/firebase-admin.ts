import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin SDK
function initFirebaseAdmin() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  let serviceAccount: any = null;

  // Option 1: Try to parse service account JSON from env var
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      // Handle both escaped and unescaped JSON strings
      const jsonString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.replace(/\\n/g, "\n");
      serviceAccount = JSON.parse(jsonString);
    } catch (error) {
      console.error("Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:", error);
      throw new Error(
        "Invalid FIREBASE_SERVICE_ACCOUNT_KEY JSON. Please check your .env.local file."
      );
    }
  }
  // Option 2: Use individual environment variables
  else if (
    process.env.NEXT_PUBLIC_FIREBASE_PROJECTID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    serviceAccount = {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECTID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    };
  }
  // Option 3: Try to load from service account file path
  else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    try {
      const fs = require("fs");
      const path = require("path");
      // Resolve path relative to project root (where .env.local is)
      const serviceAccountPath = path.resolve(
        process.cwd(),
        process.env.FIREBASE_SERVICE_ACCOUNT_PATH.replace(/^\.\//, "")
      );
      
      if (!fs.existsSync(serviceAccountPath)) {
        throw new Error(`Service account file not found at: ${serviceAccountPath}`);
      }
      
      const serviceAccountFile = fs.readFileSync(serviceAccountPath, "utf8");
      const parsedAccount = JSON.parse(serviceAccountFile);
      
      // Normalize field names (Firebase service account JSON uses snake_case, but cert() expects camelCase)
      serviceAccount = {
        type: parsedAccount.type,
        projectId: parsedAccount.project_id || parsedAccount.projectId,
        privateKeyId: parsedAccount.private_key_id || parsedAccount.privateKeyId,
        privateKey: parsedAccount.private_key || parsedAccount.privateKey,
        clientEmail: parsedAccount.client_email || parsedAccount.clientEmail,
        clientId: parsedAccount.client_id || parsedAccount.clientId,
        authUri: parsedAccount.auth_uri || parsedAccount.authUri,
        tokenUri: parsedAccount.token_uri || parsedAccount.tokenUri,
        authProviderX509CertUrl: parsedAccount.auth_provider_x509_cert_url || parsedAccount.authProviderX509CertUrl,
        clientX509CertUrl: parsedAccount.client_x509_cert_url || parsedAccount.clientX509CertUrl,
        universeDomain: parsedAccount.universe_domain || parsedAccount.universeDomain,
      };
    } catch (error: any) {
      console.error("Error loading service account file:", error);
      throw new Error(
        `Could not load service account file from ${process.env.FIREBASE_SERVICE_ACCOUNT_PATH}: ${error.message}`
      );
    }
  }

  if (!serviceAccount) {
    throw new Error(
      "Firebase Admin credentials not found. Please set one of:\n" +
      "  - FIREBASE_SERVICE_ACCOUNT_KEY (JSON string)\n" +
      "  - FIREBASE_SERVICE_ACCOUNT_PATH (file path)\n" +
      "  - FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY + NEXT_PUBLIC_FIREBASE_PROJECTID"
    );
  }

  if (!serviceAccount.projectId || !serviceAccount.privateKey) {
    throw new Error(
      "Firebase Admin service account is missing required fields (projectId or privateKey)"
    );
  }

  return initializeApp({
    credential: cert(serviceAccount as any),
    projectId: serviceAccount.projectId,
  });
}

const app = initFirebaseAdmin();
export const adminDb = getFirestore(app);
export default app;

