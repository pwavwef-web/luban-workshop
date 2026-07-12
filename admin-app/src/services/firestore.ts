"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
  type FirestoreError,
  type QueryConstraint,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export function subscribeCollection<T extends { id: string }>(
  collectionName: string,
  onData: (items: T[]) => void,
  onError: (error: FirestoreError) => void,
  constraints: QueryConstraint[] = [],
): Unsubscribe {
  const ref = collection(db, collectionName);
  const q = constraints.length ? query(ref, ...constraints) : query(ref);
  return onSnapshot(
    q,
    (snapshot) => {
      onData(snapshot.docs.map((entry) => ({ id: entry.id, ...(entry.data() as DocumentData) }) as T));
    },
    onError,
  );
}

export const byCreatedDesc = () => orderBy("createdAt", "desc");
export const byAddedDesc = () => orderBy("addedAt", "desc");

export async function getDocument(collectionName: string, id: string) {
  return getDoc(doc(db, collectionName, id));
}

export async function setDocument(collectionName: string, id: string, payload: DocumentData, merge = true) {
  return setDoc(doc(db, collectionName, id), payload, { merge });
}

export async function addDocument(collectionName: string, payload: DocumentData) {
  return addDoc(collection(db, collectionName), payload);
}

export async function updateDocument(collectionName: string, id: string, payload: DocumentData) {
  return updateDoc(doc(db, collectionName, id), payload);
}

export async function deleteDocument(collectionName: string, id: string) {
  return deleteDoc(doc(db, collectionName, id));
}

export { doc, runTransaction, serverTimestamp };
