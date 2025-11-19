// firebase.js
// Firebase helper (Vite + Firestore)
import { initializeApp } from 'firebase/app';
import {
    getFirestore,
    collection,
    onSnapshot,
    addDoc,
    deleteDoc,
    updateDoc,
    doc,
    getDocs,
    getDoc,
    query,
    orderBy,
} from 'firebase/firestore';

// --- Firebase Config ---
const firebaseConfig = {
    apiKey: "AIzaSyAp445JADdXfbhGBPIcClLEtbIUWLezxf0",
    authDomain: "calendar-c8858.firebaseapp.com",
    projectId: "calendar-c8858",
    storageBucket: "calendar-c8858.firebasestorage.app",
    messagingSenderId: "926181659250",
    appId: "1:926181659250:web:14ac3740f5efbb0b5128eb",
    measurementId: "G-84YFY1X1B7"
};

// --- Initialize ---
let app, db;
try {
    if (!firebaseConfig.projectId) {
        console.warn('Firebase not initialized — missing projectId.');
    } else {
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
    }
} catch (err) {
    console.error('Error initializing Firebase:', err);
}

// ✅ CREATE
export async function addScheduleDoc(schedule) {
    if (!db) throw new Error('Firestore not initialized');
    const docRef = await addDoc(collection(db, 'schedules'), {
        ...schedule,
        createdDate: new Date().toISOString(),
    });
    return docRef.id;
}

// ✅ READ (ทั้งหมด)
export async function getAllSchedules() {
    if (!db) throw new Error('Firestore not initialized');
    const q = query(collection(db, 'schedules'), orderBy('createdDate', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ✅ READ (ตาม id)
export async function getScheduleById(id) {
    if (!db) throw new Error('Firestore not initialized');
    const docRef = doc(db, 'schedules', id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() };
}

// ✅ UPDATE
export async function updateScheduleById(id, data) {
    if (!db) throw new Error('Firestore not initialized');
    const docRef = doc(db, 'schedules', id);
    await updateDoc(docRef, data);
    return true;
}

// ✅ DELETE
export async function deleteScheduleById(id) {
    if (!db) throw new Error('Firestore not initialized');
    const docRef = doc(db, 'schedules', id);
    await deleteDoc(docRef);
    return true;
}

// ✅ SUBSCRIBE (auto update เมื่อ Firestore เปลี่ยน)
export function subscribeSchedules(onUpdate) {
    if (!db) return () => { };
    const q = query(collection(db, 'schedules'), orderBy('createdDate', 'desc'));
    const unsub = onSnapshot(
        q,
        (snapshot) => {
            const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
            onUpdate(items);
        },
        (err) => console.error('onSnapshot error:', err)
    );
    return unsub;
}

export default {
    addScheduleDoc,
    getAllSchedules,
    getScheduleById,
    updateScheduleById,
    deleteScheduleById,
    subscribeSchedules,
};
