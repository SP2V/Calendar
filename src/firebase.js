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

// ================= SCHEDULES =================

// ✅ CREATE
export async function addScheduleDoc(schedule) {
    if (!db) throw new Error('Firestore not initialized');
    const docRef = await addDoc(collection(db, 'schedules'), {
        ...schedule,
        createdDate: new Date().toISOString(),
    });
    return docRef.id;
}

// ✅ READ ALL
export async function getAllSchedules() {
    if (!db) throw new Error('Firestore not initialized');
    const q = query(collection(db, 'schedules'), orderBy('createdDate', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ✅ READ BY ID
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

// ✅ SUBSCRIBE SCHEDULES (Realtime)
export function subscribeSchedules(onUpdate) {
    if (!db) return () => { };
    const q = query(collection(db, 'schedules'), orderBy('createdDate', 'desc'));
    const unsub = onSnapshot(
        q,
        snapshot => {
            const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            onUpdate(items);
        },
        err => console.error('onSnapshot error:', err)
    );
    return unsub;
}

// ================= ACTIVITY TYPES =================

// ✅ SUBSCRIBE ACTIVITY TYPES (Realtime)
export const subscribeActivityTypes = (callback) => {
    if (!db) return () => { };
    const typesRef = collection(db, 'activityTypes');
    const q = query(typesRef, orderBy('name'));
    const unsub = onSnapshot(
        q,
        snapshot => {
            // แก้ไข: ดึงข้อมูลทั้งหมดรวมถึง color ด้วย (...doc.data())
            const types = snapshot.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data() 
            }));
            callback(types);
        },
        err => console.error('subscribeActivityTypes error:', err)
    );
    return unsub;
};

// ✅ ADD ACTIVITY TYPE
// แก้ไข: รับ parameter color เพิ่มเข้ามา
export const addActivityType = async (name, color) => {
    if (!db) throw new Error('Firestore not initialized');
    if (!name || !name.trim()) return;
    
    const typesRef = collection(db, 'activityTypes');
    await addDoc(typesRef, { 
        name: name.trim(),
        // บันทึกสีลงไป ถ้าไม่มีให้ใช้สี Default เป็นสีฟ้า
        color: color || '#3B82F6' 
    });
};

// ✅ UPDATE ACTIVITY TYPE
export const updateActivityType = async (id, name) => {
    if (!db) throw new Error('Firestore not initialized');
    if (!name || !name.trim()) return;
    const docRef = doc(db, 'activityTypes', id);
    await updateDoc(docRef, { name: name.trim() });
};

// ✅ DELETE ACTIVITY TYPE (Optional)
export const deleteActivityType = async (id) => {
    if (!db) throw new Error('Firestore not initialized');
    const docRef = doc(db, 'activityTypes', id);
    await deleteDoc(docRef);
};

export default {
    addScheduleDoc,
    getAllSchedules,
    getScheduleById,
    updateScheduleById,
    deleteScheduleById,
    subscribeSchedules,
    subscribeActivityTypes,
    addActivityType,
    updateActivityType,
    deleteActivityType,
};