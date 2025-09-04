
/* firebase-messaging-sw.js */
importScripts('https://www.gstatic.com/firebasejs/12.2.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.2.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyBIBq4ZsRADoKRNoJZkNq-dLWirlSotIPc',
  authDomain: 'tripfast-d359d.firebaseapp.com',
  projectId: 'tripfast-d359d',
  messagingSenderId: '559477235356',
  appId: '1:559477235356:web:a311792f680f5fd5995759'
});

const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'TripFast';
  const options = { body: payload.notification?.body || '', data: payload.data || {} };
  self.registration.showNotification(title, options);
});
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const jobId = event.notification.data?.jobId;
  const url = jobId ? `./#driver?job=${jobId}` : './#driver';
  event.waitUntil(clients.openWindow(url));
});

