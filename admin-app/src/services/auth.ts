"use client";

import { doc, getDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "@/lib/firebase";

export async function isAdminUser(user: User): Promise<boolean> {
  const token = await user.getIdTokenResult(true).catch(() => null);
  if (token?.claims.admin === true) return true;

  const email = (user.email || "").trim().toLowerCase();
  if (!email) return false;

  const adminDoc = await getDoc(doc(db, "admins", email)).catch(() => null);
  return adminDoc?.exists() === true;
}
