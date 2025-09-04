# TripFast — web patch
Incluye:
- index.html (origen + paradas + destino, i18n ES/EN, gating por rol)
- firebase.js (Auth, Firestore, FCM, helpers)
- firebase-messaging-sw.js (colócalo en la **raíz** del dominio)
- admin.html (para asignar claims de driver)

Sube estos archivos a la raíz de tu PWA en Vercel.
Asegura que https://TU_DOMINIO/firebase-messaging-sw.js responda 200.
