
// firebase.js — TripFast (ES/EN)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, setPersistence, browserLocalPersistence, signOut } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import { getFirestore, doc, setDoc, collection, addDoc, onSnapshot, query, where, serverTimestamp, updateDoc } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
import { getMessaging, getToken, onMessage, isSupported } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-messaging.js';

export const firebaseConfig = {
  apiKey: "AIzaSyBIBq4ZsRADoKRNoJZkNq-dLWirlSotIPc",
  authDomain: "tripfast-d359d.firebaseapp.com",
  projectId: "tripfast-d359d",
  storageBucket: "tripfast-d359d.appspot.com",
  messagingSenderId: "559477235356",
  appId: "1:559477235356:web:a311792f680f5fd5995759"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export async function login(email, pass){
  await setPersistence(auth, browserLocalPersistence);
  return signInWithEmailAndPassword(auth, email, pass);
}
export function onAuth(cb){ return onAuthStateChanged(auth, cb); }
export function logout(){ return signOut(auth); }

// Driver: registra FCM y guarda token en /devices
export async function setupMessagingForDriver(driverId){
  try{
    if(!(await isSupported())) return null;
    const messaging = getMessaging(app);
    const vapidKey = 'BPEKStvR7x8kyTKhCtSBzwOCXEXSE9JHJ6WtEfyte9uoE_8iezv3WnWdeJJVRNjgdD0flJ0LBYjx3HNVjT41too';
    const token = await getToken(messaging, { vapidKey });
    if (token){
      await setDoc(doc(db, 'devices', token), {
        driver_id: driverId,
        fcm_token: token,
        user_agent: navigator.userAgent,
        last_seen: new Date().toISOString()
      });
    }
    onMessage(messaging, (payload)=>{
      const title = payload.notification?.title || 'TripFast';
      const body  = payload.notification?.body || '';
      alert(`${title}\n${body}`);
    });
    return token;
  }catch(e){ console.warn(e); return null; }
}

// Jobs CRUD
export async function createJob(job){
  job.created_at = serverTimestamp();
  job.status = 'created';
  const ref = await addDoc(collection(db, 'jobs'), job);
  await addDoc(collection(db, 'job_events'), { job_id: ref.id, type:'created', by:'dispatcher', at: serverTimestamp(), data:{} });
  return ref.id;
}
export function listenDriverJobs(driverId, cb){
  const q = query(collection(db, 'jobs'), where('driver_id','==', driverId));
  return onSnapshot(q, (snap)=> cb(snap.docs.map(d=>({ id:d.id, ...d.data() }))));
}
export async function updateJobStatus(jobId, status, by){
  await updateDoc(doc(db,'jobs',jobId), { status });
  await addDoc(collection(db,'job_events'), { job_id:jobId, type:status, by, at:serverTimestamp(), data:{} });
}

