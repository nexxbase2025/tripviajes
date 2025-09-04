
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

async function notifyDriver(driverId, title, body, data={}){
  const devsSnap = await db.collection('devices').where('driver_id','==',driverId).get();
  const tokens = devsSnap.docs.map(d=>d.id);
  if(!tokens.length) return;
  const message = { notification: { title, body }, data, tokens };
  await admin.messaging().sendEachForMulticast(message);
}

exports.onJobCreated = functions.firestore
  .document('jobs/{jobId}')
  .onCreate(async (snap, ctx)=>{
    const job = snap.data();
    await notifyDriver(job.driver_id, 'Nuevo viaje asignado', `${job.passenger || 'Pasajero'} • ${job.from} → ${job.to}`, {
      jobId: ctx.params.jobId, route: job.map_url || ''
    });
    await snap.ref.update({ status: 'sent' });
    await db.collection('job_events').add({ job_id: ctx.params.jobId, type:'sent', by:'system', at: admin.firestore.FieldValue.serverTimestamp(), data:{} });
  });

exports.setDriverClaims = functions.https.onCall(async (data, context)=>{
  const { uid, driver_id } = data;
  await admin.auth().setCustomUserClaims(uid, { role:'driver', driver_id });
  return { ok:true };
});

