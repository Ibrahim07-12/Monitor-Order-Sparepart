import {
  collection,
  addDoc,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  onSnapshot,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";

// Collection name
const SPAREPARTS_COLLECTION = "spareparts";

// Add new sparepart
export const addSparepart = async (sparepartData) => {
  try {
    const docRef = await addDoc(collection(db, SPAREPARTS_COLLECTION), {
      ...sparepartData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding sparepart: ", error);
    return { success: false, error: error.message };
  }
};

// Get all spareparts (active - not arrived yet)
export const getActiveSpareparts = async () => {
  try {
    const q = query(
      collection(db, SPAREPARTS_COLLECTION),
      where("status", "==", "menunggu"),
      orderBy("orderDate", "desc")
    );
    const querySnapshot = await getDocs(q);
    const spareparts = [];
    querySnapshot.forEach((doc) => {
      spareparts.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: spareparts };
  } catch (error) {
    console.error("Error getting spareparts: ", error);
    return { success: false, error: error.message };
  }
};

// Get all spareparts (including history)
export const getAllSpareparts = async () => {
  try {
    const q = query(
      collection(db, SPAREPARTS_COLLECTION),
      orderBy("orderDate", "desc")
    );
    const querySnapshot = await getDocs(q);
    const spareparts = [];
    querySnapshot.forEach((doc) => {
      spareparts.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: spareparts };
  } catch (error) {
    console.error("Error getting all spareparts: ", error);
    return { success: false, error: error.message };
  }
};

// Update sparepart status to "sudah datang"
export const markAsArrived = async (sparepartId) => {
  try {
    const sparepartRef = doc(db, SPAREPARTS_COLLECTION, sparepartId);
    await updateDoc(sparepartRef, {
      status: "sudah datang",
      arrivedDate: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating sparepart: ", error);
    return { success: false, error: error.message };
  }
};

// Update sparepart data
export const updateSparepart = async (sparepartId, updatedData) => {
  try {
    const sparepartRef = doc(db, SPAREPARTS_COLLECTION, sparepartId);
    await updateDoc(sparepartRef, {
      ...updatedData,
      updatedAt: Timestamp.now(),
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating sparepart: ", error);
    return { success: false, error: error.message };
  }
};

// Delete sparepart
export const deleteSparepart = async (sparepartId) => {
  try {
    await deleteDoc(doc(db, SPAREPARTS_COLLECTION, sparepartId));
    return { success: true };
  } catch (error) {
    console.error("Error deleting sparepart: ", error);
    return { success: false, error: error.message };
  }
};

// Search spareparts by name
export const searchSpareparts = async (searchTerm) => {
  try {
    const querySnapshot = await getDocs(collection(db, SPAREPARTS_COLLECTION));
    const spareparts = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Simple search - case insensitive
      if (
        data.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        data.specification.toLowerCase().includes(searchTerm.toLowerCase()) ||
        data.machine.toLowerCase().includes(searchTerm.toLowerCase()) ||
        data.vendor.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        spareparts.push({ id: doc.id, ...data });
      }
    });
    return { success: true, data: spareparts };
  } catch (error) {
    console.error("Error searching spareparts: ", error);
    return { success: false, error: error.message };
  }
};

// Real-time listener for all spareparts
export const subscribeToSpareparts = (callback) => {
  const q = query(
    collection(db, SPAREPARTS_COLLECTION),
    orderBy("orderDate", "desc")
  );

  const unsubscribe = onSnapshot(
    q,
    (querySnapshot) => {
      const spareparts = [];
      querySnapshot.forEach((doc) => {
        spareparts.push({ id: doc.id, ...doc.data() });
      });
      callback({ success: true, data: spareparts });
    },
    (error) => {
      console.error("Error in real-time listener: ", error);
      callback({ success: false, error: error.message });
    }
  );

  return unsubscribe;
};

// Bulk add spareparts from Excel
export const bulkAddSpareparts = async (sparepartsArray) => {
  try {
    const batch = writeBatch(db);
    const collectionRef = collection(db, SPAREPARTS_COLLECTION);

    sparepartsArray.forEach((sparepartData) => {
      const docRef = doc(collectionRef);
      batch.set(docRef, {
        ...sparepartData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    });

    await batch.commit();
    return { success: true, count: sparepartsArray.length };
  } catch (error) {
    console.error("Error bulk adding spareparts: ", error);
    return { success: false, error: error.message };
  }
};

// Bulk delete spareparts by plant (deletes all documents where plant == provided plant)
export const bulkDeleteByPlant = async (plant) => {
  try {
    const q = query(
      collection(db, SPAREPARTS_COLLECTION),
      where("plant", "==", plant)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return { success: true, deleted: 0 };

    // Firestore batch limit is 500 operations
    const batches = [];
    let batch = writeBatch(db);
    let ops = 0;
    let deleted = 0;

    snapshot.forEach((docSnap) => {
      batch.delete(doc(db, SPAREPARTS_COLLECTION, docSnap.id));
      ops += 1;
      deleted += 1;
      if (ops === 500) {
        batches.push(batch.commit());
        batch = writeBatch(db);
        ops = 0;
      }
    });

    if (ops > 0) batches.push(batch.commit());

    await Promise.all(batches);
    return { success: true, deleted };
  } catch (error) {
    console.error("Error bulk deleting spareparts by plant:", error);
    return { success: false, error: error.message };
  }
};

// --- App settings helpers ---
// A simple single-document store for UI flags (collection: appSettings, doc: ui)
export const subscribeToAppSettings = (callback) => {
  const settingsRef = doc(db, "appSettings", "ui");
  const unsubscribe = onSnapshot(
    settingsRef,
    (snap) => {
      if (snap.exists()) callback({ success: true, data: snap.data() });
      else callback({ success: true, data: {} });
    },
    (error) => {
      console.error("Error subscribing app settings:", error);
      callback({ success: false, error: error.message });
    }
  );
  return unsubscribe;
};

export const setAppSetting = async (key, value) => {
  try {
    const settingsRef = doc(db, "appSettings", "ui");
    await updateDoc(settingsRef, { [key]: value });
    return { success: true };
  } catch (err) {
    // If document doesn't exist yet, create it
    try {
      const settingsRef = doc(db, "appSettings", "ui");
      await setDoc(settingsRef, { [key]: value }, { merge: true });
      return { success: true };
    } catch (inner) {
      console.error("Error setting app setting:", inner);
      return { success: false, error: inner.message };
    }
  }
};
