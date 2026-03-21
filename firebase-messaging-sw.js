// Firebase Messaging Service Worker
// Required for Firebase Cloud Messaging background push notifications.
// This file must be served at the root: /firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyDxgdwU84vFNoCOUTl-HRdGYonLIcDaXFw",
    authDomain: "luban-workshop-restaurant.firebaseapp.com",
    projectId: "luban-workshop-restaurant",
    storageBucket: "luban-workshop-restaurant.firebasestorage.app",
    messagingSenderId: "360623290287",
    appId: "1:360623290287:web:89fae5ebbb342e5e13e15a"
});

const messaging = firebase.messaging();

// Handle background push messages sent by Firebase Cloud Messaging
messaging.onBackgroundMessage(function(payload) {
    const notificationTitle = (payload.notification && payload.notification.title) || 'Luban Restaurant';
    const notificationOptions = {
        body: (payload.notification && payload.notification.body) || '',
        icon: '/favicon.jpeg',
        badge: '/favicon.jpeg'
    };
    return self.registration.showNotification(notificationTitle, notificationOptions);
});
