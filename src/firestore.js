import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';

// Collection name
const SPAREPARTS_COLLECTION = 'spareparts';

// Add new sparepart
export const addSparepart = async (sparepartData) => {
  try {
    const docRef = await addDoc(collection(db, SPAREPARTS_COLLECTION), {
      ...sparepartData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
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
      updatedAt: Timestamp.now()
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
      updatedAt: Timestamp.now()
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
      if (data.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          data.specification.toLowerCase().includes(searchTerm.toLowerCase()) ||
          data.machine.toLowerCase().includes(searchTerm.toLowerCase()) ||
          data.vendor.toLowerCase().includes(searchTerm.toLowerCase())) {
        spareparts.push({ id: doc.id, ...data });
      }
    });
    return { success: true, data: spareparts };
  } catch (error) {
    console.error("Error searching spareparts: ", error);
    return { success: false, error: error.message };
  }
};
