/* firebase-messaging-sw.js (compat) */
importScripts('https://www.gstatic.com/firebasejs/12.2.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.2.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBIBq4ZsRADoKRNoJZkNq-dLWirlSotIPc",
  authDomain: "tripfast-d359d.firebaseapp.com",
  projectId: "tripfast-d359d",
  storageBucket: "tripfast-d359d.firebasestorage.app",
  messagingSenderId: "559477235356",
  appId: "1:559477235356:web:a311792f680f5fd5995759",
  measurementId: "G-CSRR8VWYFZ"
});

const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload)=>{
  const title = payload.notification?.title || 'TripFast';
  const body  = payload.notification?.body  || '';
  const data  = payload.data || {};
  const opts = { body, data, icon:'/icons/icon-192.png', badge:'/icons/icon-192.png' };
  self.registration.showNotification(title, opts);
});
self.addEventListener('notificationclick', (event)=>{
  event.notification.close();
  const url = event.notification?.data?.route || '/';
  event.waitUntil(clients.openWindow(url));
});
