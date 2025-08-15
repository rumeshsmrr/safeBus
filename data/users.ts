// data/users.ts
import { auth, db } from "@/app/lib/firebase";
import { GeoAddress, UserDoc, displayNameOf } from "@/types/user";
import { Unsubscribe } from "firebase/auth";
import {
  DocumentSnapshot,
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

const USERS = "users";

// data/users.ts
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

    // ✅ include these so the subscription returns them
    homeLocation: data.homeLocation ?? null,
    schoolLocation: data.schoolLocation ?? null,
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
  const qParent = query(
    collection(db, USERS),
    where("parentCode", "==", code),
    limit(1)
  );
  const snaps = await getDocs(qParent);
  if (snaps.empty) return null;
  return toUserDoc(snaps.docs[0]);
}

/** Convenience: resolve a display name for any uid */
export async function getDisplayName(uid: string): Promise<string> {
  const u = await getUserById(uid);
  return displayNameOf(u ?? {});
}

/* ===========================
   NEW: Children <-> Parent APIs
   =========================== */

/** One-time: all children for a parent (by parent UID) */
export async function getChildrenByParentUid(
  parentUid: string
): Promise<UserDoc[]> {
  const qKids = query(
    collection(db, USERS),
    where("role", "==", "student"),
    where("parentUid", "==", parentUid)
  );
  const snaps = await getDocs(qKids);
  return snaps.docs.map(toUserDoc).filter(Boolean) as UserDoc[];
}

/** Realtime: children for a parent (by parent UID) */
export function subscribeChildrenByParentUid(
  parentUid: string,
  cb: (children: UserDoc[]) => void
): Unsubscribe {
  const qKids = query(
    collection(db, USERS),
    where("role", "==", "student"),
    where("parentUid", "==", parentUid)
  );
  return onSnapshot(qKids, (qs) => {
    const kids = qs.docs.map(toUserDoc).filter(Boolean) as UserDoc[];
    cb(kids);
  });
}

/** One-time: children via parentCode (if you use codes to link) */
export async function getChildrenByParentCode(
  code: string
): Promise<UserDoc[]> {
  const qKids = query(
    collection(db, USERS),
    where("role", "==", "student"),
    where("parentCode", "==", code)
  );
  const snaps = await getDocs(qKids);
  return snaps.docs.map(toUserDoc).filter(Boolean) as UserDoc[];
}

/** Realtime: children via parentCode */
export function subscribeChildrenByParentCode(
  code: string,
  cb: (children: UserDoc[]) => void
): Unsubscribe {
  const qKids = query(
    collection(db, USERS),
    where("role", "==", "student"),
    where("parentCode", "==", code)
  );
  return onSnapshot(qKids, (qs) => {
    const kids = qs.docs.map(toUserDoc).filter(Boolean) as UserDoc[];
    cb(kids);
  });
}

/** Helper: current logged-in parent’s children (one-time) */
export async function getMyChildren(): Promise<UserDoc[]> {
  const me = await getCurrentUserProfile();
  if (!me?.uid) return [];
  return getChildrenByParentUid(me.uid);
}

/** Helper: subscribe to current logged-in parent’s children */
export function subscribeMyChildren(
  cb: (children: UserDoc[]) => void
): Unsubscribe | null {
  const uid = auth.currentUser?.uid;
  if (!uid) return null;
  return subscribeChildrenByParentUid(uid, cb);
}

/** Update either/both locations (atomic partial update) */
export async function updateChildLocations(
  childUid: string,
  payload: {
    home?: GeoAddress | null; // pass null to remove the field
    school?: GeoAddress | null; // pass null to remove the field
  }
) {
  const ref = doc(db, "users", childUid);
  const data: any = { updatedAt: serverTimestamp() };
  if (payload.home !== undefined) {
    data.homeLocation = payload.home ?? deleteField();
  }
  if (payload.school !== undefined) {
    data.schoolLocation = payload.school ?? deleteField();
  }
  await updateDoc(ref, data);
}

/** Convenience helpers */
export async function updateChildHomeLocation(
  childUid: string,
  home: GeoAddress | null
) {
  return updateChildLocations(childUid, { home });
}
export async function updateChildSchoolLocation(
  childUid: string,
  school: GeoAddress | null
) {
  return updateChildLocations(childUid, { school });
}
