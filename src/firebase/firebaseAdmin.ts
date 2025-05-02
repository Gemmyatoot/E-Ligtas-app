// firebaseAdmin.ts
import admin from 'firebase-admin';

// Initialize the Admin SDK
const serviceAccount = require('@/data/servicekey.json'); // Update the path

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://e-ligtas-1e1ec-default-rtdb.asia-southeast1.firebasedatabase.app"
      });
}

const dbAdmin = admin.firestore();
const authAdmin = admin.auth();

export { authAdmin, dbAdmin };
