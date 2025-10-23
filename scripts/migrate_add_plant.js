/*
Migration script: set `plant` field on existing spareparts documents that lack it.

Usage:
- Create a Firebase service account JSON and set GOOGLE_APPLICATION_CREDENTIALS to its path,
  or pass the path in the script.
- Run: node scripts/migrate_add_plant.js

This script will set `plant` to a default value (Foundry) for documents that do not have `plant`.
Make a backup before running in production.
*/

import admin from "firebase-admin";
import path from "path";
import { fileURLToPath } from "url";

// Optional: set default plant here
const DEFAULT_PLANT = "Foundry";

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

async function migrate() {
  console.log("Starting migration: adding 'plant' field where missing...");
  const snapshot = await db.collection(COLLECTION).get();
  console.log(`Found ${snapshot.size} documents`);
  let updated = 0;
  const batch = db.batch();

  snapshot.forEach((doc) => {
    const data = doc.data();
    if (!Object.prototype.hasOwnProperty.call(data, "plant") || !data.plant) {
      const ref = db.collection(COLLECTION).doc(doc.id);
      batch.update(ref, { plant: DEFAULT_PLANT });
      updated += 1;
    }
  });

  if (updated === 0) {
    console.log("No documents needed update.");
    return;
  }

  console.log(`Updating ${updated} documents...`);
  await batch.commit();
  console.log("Migration completed.");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
