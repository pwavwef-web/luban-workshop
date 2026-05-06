import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';

const app = initializeApp({
  apiKey: 'AIzaSyDxgdwU84vFNoCOUTl-HRdGYonLIcDaXFw',
  authDomain: 'luban-workshop-restaurant.firebaseapp.com',
  projectId: 'luban-workshop-restaurant',
  storageBucket: 'luban-workshop-restaurant.firebasestorage.app',
  messagingSenderId: '360623290287',
  appId: '1:360623290287:web:89fae5ebbb342e5e13e15a'
});

const messaging = getMessaging(app);

onBackgroundMessage(messaging, (payload) => {
  const notificationTitle = (payload.notification && payload.notification.title) || 'Luban Restaurant';
  const notificationOptions = {
    body: (payload.notification && payload.notification.body) || '',
    icon: '/logo.png',
    badge: '/logo.png'
  };
  return self.registration.showNotification(notificationTitle, notificationOptions);
});
