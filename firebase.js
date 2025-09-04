// firebase.js (módulo ESM)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp, onSnapshot, query, where, orderBy, updateDoc, doc } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import { getMessaging, getToken, onMessage, isSupported } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-messaging.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-functions.js";

const firebaseConfig = {
  apiKey: "AIzaSyBIBq4ZsRADoKRNoJZkNq-dLWirlSotIPc",
  authDomain: "tripfast-d359d.firebaseapp.com",
  projectId: "tripfast-d359d",
  storageBucket: "tripfast-d359d.firebasestorage.app",
  messagingSenderId: "559477235356",
  appId: "1:559477235356:web:a311792f680f5fd5995759",
  measurementId: "G-CSRR8VWYFZ"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export function onAuth(cb){ return onAuthStateChanged(auth, cb); }
export async function login(email, password){ return signInWithEmailAndPassword(auth, email, password); }
export async function logout(){ return signOut(auth); }

export async function createJob(job){
  const user = auth.currentUser;
  if (!user) throw new Error("auth-required");
  const payload = { ...job, status: "created", created_by: user.uid, created_at: serverTimestamp() };
  const ref = await addDoc(collection(db, "jobs"), payload);
  return ref.id;
}

export async function updateJobStatus(jobId, status, by){
  const user = auth.currentUser;
  if (!user) throw new Error("auth-required");
  await updateDoc(doc(db, "jobs", jobId), { status, updated_by: by || "driver", updated_at: serverTimestamp() });
}

export function listenDriverJobs(driverId, cb){
  const q = query(collection(db, "jobs"), where("driver_id", "==", driverId), orderBy("created_at", "desc"));
  return onSnapshot(q, (snap)=>{
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    cb(items);
  });
}

const VAPID_KEY = "BPEKStvR7x8kyTKhCtSBzwOCXEXSE9JHJ6WtEfyte9uoE_8iezv3WnWdeJJVRNjgdD0flJ0LBYjx3HNVjT41too";

export async function setupMessagingForDriver(driverId){
  if (!(await isSupported())){ alert("Notificaciones no soportadas en este navegador."); return; }
  const messaging = getMessaging(app);

  let reg = null;
  if ('serviceWorker' in navigator){
    reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  }
  const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: reg || undefined });
  if (!token){ alert("No se pudo obtener token de notificaciones."); return; }

  const device = {
    fcm_token: token,
    driver_id: driverId,
    uid: auth.currentUser ? auth.currentUser.uid : null,
    ua: navigator.userAgent,
    platform: navigator.platform,
    last_seen: serverTimestamp()
  };
  try{
    await updateDoc(doc(db, "devices", token), device);
  }catch(e){
    await addDoc(collection(db, "devices_fallback"), device);
  }

  onMessage(messaging, (payload)=>{ console.log("[TripFast] Push en primer plano", payload); });
  alert("Notificaciones activadas ✔️");
}

export async function setDriverClaims(uid, driver_id){
  const functions = getFunctions(app);
  const fn = httpsCallable(functions, "setDriverClaims");
  const res = await fn({ uid, driver_id });
  return res.data;
}
