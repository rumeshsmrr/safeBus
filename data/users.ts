import { auth, db } from "@/app/lib/firebase";
import { UserDoc, displayNameOf } from "@/types/user";
import { Unsubscribe } from "firebase/auth";
import {
  DocumentSnapshot,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

const USERS = "users";

function toUserDoc(snap: DocumentSnapshot): UserDoc | null {
  if (!snap.exists()) return null;
  const data = snap.data() as any;
  const user: UserDoc = {
    uid: snap.id,
    role: data.role,
    email: data.email ?? null,
    fullName: data.fullName ?? null,
    firstName: data.firstName ?? null,
    lastName: data.lastName ?? null,
    parentCode: data.parentCode ?? null,
    parentUid: data.parentUid ?? null,
    currentBusId: data.currentBusId ?? null,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
  return user;
}

/** One-time fetch by uid */
export async function getUserById(uid: string): Promise<UserDoc | null> {
  const snap = await getDoc(doc(db, USERS, uid));
  return toUserDoc(snap);
}

/** Realtime subscription by uid */
export function subscribeUserById(
  uid: string,
  cb: (user: UserDoc | null) => void
): Unsubscribe {
  return onSnapshot(doc(db, USERS, uid), (snap) => cb(toUserDoc(snap)));
}

/** Current auth user’s profile (one-time) */
export async function getCurrentUserProfile(): Promise<UserDoc | null> {
  const uid = auth.currentUser?.uid;
  if (!uid) return null;
  return getUserById(uid);
}

/** Optional: lookup by parentCode (one-time) */
export async function getUserByParentCode(
  code: string
): Promise<UserDoc | null> {
  const q = query(
    collection(db, USERS),
    where("parentCode", "==", code),
    limit(1)
  );
  const snaps = await getDocs(q);
  if (snaps.empty) return null;
  return toUserDoc(snaps.docs[0]);
}

/** Convenience: resolve a display name for any uid */
export async function getDisplayName(uid: string): Promise<string> {
  const u = await getUserById(uid);
  return displayNameOf(u ?? {});
}
