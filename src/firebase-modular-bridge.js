import { initializeApp, getApp, getApps } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  signOut,
  GoogleAuthProvider
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  query,
  where,
  orderBy,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';

function ensureApp() {
  if (!getApps().length) {
    throw new Error('Firebase app has not been initialized.');
  }
  return getApp();
}

function wrapDocSnapshot(snapshot) {
  return {
    id: snapshot.id,
    exists: snapshot.exists(),
    data: () => snapshot.data(),
    ref: snapshot.ref
  };
}

function wrapQuerySnapshot(snapshot) {
  return {
    empty: snapshot.empty,
    size: snapshot.size,
    docs: snapshot.docs.map(wrapDocSnapshot),
    forEach: (callback) => snapshot.forEach((docSnap) => callback(wrapDocSnapshot(docSnap)))
  };
}

function createQueryApi(queryRef) {
  return {
    where(fieldPath, opStr, value) {
      return createQueryApi(query(queryRef, where(fieldPath, opStr, value)));
    },
    orderBy(fieldPath, directionStr) {
      return createQueryApi(query(queryRef, orderBy(fieldPath, directionStr)));
    },
    async get() {
      const snapshot = await getDocs(queryRef);
      return wrapQuerySnapshot(snapshot);
    },
    onSnapshot(next, error) {
      return onSnapshot(
        queryRef,
        (snapshot) => next(wrapQuerySnapshot(snapshot)),
        error
      );
    }
  };
}

function createDocApi(docRef) {
  return {
    id: docRef.id,
    async set(data) {
      await setDoc(docRef, data);
    },
    async update(data) {
      await updateDoc(docRef, data);
    },
    async delete() {
      await deleteDoc(docRef);
    },
    async get() {
      const snapshot = await getDoc(docRef);
      return wrapDocSnapshot(snapshot);
    }
  };
}

function createCollectionApi(collectionRef) {
  return {
    ...createQueryApi(collectionRef),
    doc(id) {
      return createDocApi(doc(collectionRef, id));
    },
    async add(data) {
      return addDoc(collectionRef, data);
    }
  };
}

function getAuthApi() {
  const auth = getAuth(ensureApp());
  return {
    onAuthStateChanged: (callback) => onAuthStateChanged(auth, callback),
    signInWithEmailAndPassword: (email, password) => signInWithEmailAndPassword(auth, email, password),
    createUserWithEmailAndPassword: (email, password) => createUserWithEmailAndPassword(auth, email, password),
    updateProfile: (user, profile) => updateProfile(user, profile),
    signInWithPopup: (provider) => signInWithPopup(auth, provider),
    signOut: () => signOut(auth),
    get currentUser() {
      return auth.currentUser;
    }
  };
}

function getFirestoreApi() {
  const db = getFirestore(ensureApp());
  return {
    collection(path) {
      return createCollectionApi(collection(db, path));
    }
  };
}

const firebase = {
  apps: getApps(),
  initializeApp(config) {
    if (!getApps().length) {
      initializeApp(config);
    }
    firebase.apps = getApps();
    return getApp();
  },
  auth: Object.assign(() => getAuthApi(), { GoogleAuthProvider }),
  firestore: Object.assign(() => getFirestoreApi(), {
    FieldValue: {
      serverTimestamp
    }
  })
};

window.firebase = firebase;
