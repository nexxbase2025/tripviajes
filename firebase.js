// === firebase.js (versión sin CLI, roles desde Firestore) ===
// Usa la MISMA versión que ya venías usando (12.2.1)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, addDoc, updateDoc,
  collection, serverTimestamp, query, where, orderBy, onSnapshot
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
// (Opcional push, lo dejamos preparado pero NO es obligatorio ahora)
// import { getMessaging, getToken } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-messaging.js";

// --- Tu config (la misma que pegaste) ---
const firebaseConfig = {
  apiKey: "AIzaSyBIBq4ZsRADoKRNoJZkNq-dLWirlSotIPc",
  authDomain: "tripfast-d359d.firebaseapp.com",
  projectId: "tripfast-d359d",
  storageBucket: "tripfast-d359d.firebasestorage.app",
  messagingSenderId: "559477235356",
  appId: "1:559477235356:web:a311792f680f5fd5995759",
  measurementId: "G-CSRR8VWYFZ"
};

// --- Init base ---
export const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);
// export const msg  = getMessaging(app); // (opcional, más adelante)

// ========= AUTH (login/logout) =========
export function login(email, pass){
  return signInWithEmailAndPassword(auth, email, pass);
}
export function logout(){
  return signOut(auth);
}

// ========= ROLES: leer desde Firestore y simular "claims" =========
// Lee /userRoles/{uid} y expone role/driver_id como si fueran custom claims
export function onAuth(callback){
  onAuthStateChanged(auth, async (user)=>{
    if(!user){ callback(null); return; }

    let role = 'dispatcher';
    let driver_id = null;

    try{
      const snap = await getDoc(doc(db, 'userRoles', user.uid));
      if (snap.exists()){
        const data = snap.data();
        role = data.role || 'dispatcher';
        driver_id = data.driver_id || null;
      }
    }catch(_){ /* sin rol => dispatcher */ }

    // Parchea getIdTokenResult para que tu index lea user.getIdTokenResult().claims.role
    const orig = user.getIdTokenResult?.bind(user);
    user.getIdTokenResult = async (forceRefresh)=>{
      const base = orig ? await orig(forceRefresh).catch(()=>({claims:{}})) : {claims:{}};
      return { ...base, claims: { ...(base.claims||{}), role, driver_id } };
    };

    callback(user);
  });
}

// ========= JOBS (crear / escuchar / actualizar) =========
export async function createJob(job){
  // job debe traer: client, client_phone, from, to, pickup_at, passenger, age, companions,
  // acc, floor, no_elev, steps, price, notes, map_url, driver_id (d1..d5)
  if(!auth.currentUser) throw new Error('No auth');

  const payload = {
    ...job,
    status: 'sent',            // estado inicial
    created_at: serverTimestamp(),
    created_by: auth.currentUser.uid
  };
  const ref = await addDoc(collection(db, 'jobs'), payload);
  return ref.id;
}

// Escucha los jobs asignados a un driver_id (d1..d5)
export function listenDriverJobs(driverId, cb){
  const q = query(
    collection(db, 'jobs'),
    where('driver_id', '==', driverId),
    orderBy('created_at', 'desc')
  );
  return onSnapshot(q, (snap)=>{
    const items = snap.docs.map(d=>({ id:d.id, ...d.data() }));
    cb(items);
  });
}

// Actualiza estado del job (driver o dispatcher)
export async function updateJobStatus(jobId, status, who='driver'){
  if(!auth.currentUser) throw new Error('No auth');
  await updateDoc(doc(db, 'jobs', jobId), {
    status,
    updated_at: serverTimestamp(),
    updated_by: who
  });
}

// ========= Push (OPCIONAL, lo dejamos listo) =========
export async function setupMessagingForDriver(driverId){
  // Si no quieres push todavía, puedes dejar esto como NO-OP
  // Descomenta y pon tu VAPID pública cuando quieras activar:
  // const vapidPublicKey = "TU_CLAVE_VAPID_PUBLICA";
  // if (!vapidPublicKey) { alert('Push no configurado'); return; }
  // const perm = await Notification.requestPermission();
  // if (perm !== 'granted') { alert('Permiso de notificaciones denegado'); return; }
  // const token = await getToken(msg, { vapidKey: vapidPublicKey });
  // await setDoc(doc(db, 'driverTokens', auth.currentUser.uid), { token, driver_id: driverId }, { merge:true });
  alert((navigator.language||'es').startsWith('es')
    ? 'Push aún no activado. Lo dejamos listo para después.'
    : 'Push not enabled yet. We left it ready for later.');
}

