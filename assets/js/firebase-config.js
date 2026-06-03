(function () {
  const firebaseConfig = {
    apiKey: 'AIzaSyDxgdwU84vFNoCOUTl-HRdGYonLIcDaXFw',
    authDomain: 'luban-workshop-restaurant.firebaseapp.com',
    projectId: 'luban-workshop-restaurant',
    storageBucket: 'luban-workshop-restaurant.firebasestorage.app',
    messagingSenderId: '360623290287',
    appId: '1:360623290287:web:89fae5ebbb342e5e13e15a'
  };

  window.LUBAN_FIREBASE_CONFIG = Object.freeze(Object.assign({}, firebaseConfig, window.LUBAN_FIREBASE_CONFIG || {}));

  window.initLubanFirebase = function initLubanFirebase(firebaseSdk) {
    const sdk = firebaseSdk || window.firebase;
    if (!sdk || typeof sdk.initializeApp !== 'function') {
      throw new Error('Firebase SDK is not available.');
    }
    if (!sdk.apps || !sdk.apps.length) {
      sdk.initializeApp(window.LUBAN_FIREBASE_CONFIG);
    }
    return sdk.apps && sdk.apps[0] ? sdk.apps[0] : null;
  };
}());
