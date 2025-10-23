/*
Backup script: export all documents from `spareparts` collection to JSON file.

Usage:
- Set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON path (see README below).
- Run: node scripts/backup_spareparts.js
*/

import admin from "firebase-admin";
import fs from "fs";
import { fileURLToPath } from "url";

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  } catch (err) {
    console.error("Failed to initialize Firebase Admin SDK:", err.message);
    process.exit(1);
  }
}

const db = admin.firestore();
const COLLECTION = "spareparts";

async function backup() {
  console.log("Fetching spareparts...");
  const snapshot = await db.collection(COLLECTION).get();
  const all = [];
  snapshot.forEach((doc) => {
    all.push({ id: doc.id, ...doc.data() });
  });
  const filename = `backup_spareparts_${new Date()
    .toISOString()
    .replace(/[:.]/g, "-")}.json`;
  fs.writeFileSync(filename, JSON.stringify(all, null, 2), "utf8");
  console.log(`Wrote ${all.length} documents to ${filename}`);
}

backup().catch((err) => {
  console.error("Backup failed:", err);
  process.exit(1);
});
