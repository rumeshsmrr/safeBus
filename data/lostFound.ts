// data/lostFound.ts
import { auth, db, storage } from "@/app/lib/firebase";
import type { LostFoundDoc } from "@/types/lostFound";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

const COL = "lostFound";
const colRef = collection(db, COL);

// Upload a local file:// image and return a download URL
async function uploadPhotoIfAny(
  localUri?: string | null
): Promise<string | null> {
  if (!localUri) return null;
  const uid = auth.currentUser?.uid ?? "anon";
  const path = `lostFound/${uid}/${Date.now()}.jpg`;
  const r = ref(storage, path);
  const res = await fetch(localUri);
  const blob = await res.blob();
  await uploadBytes(r, blob);
  return await getDownloadURL(r);
}

/** Parent reports a LOST item */
export async function createLostItem(params: {
  title: string;
  description: string;
  photoUri?: string | null;
  parentUid?: string | null;
  studentUid?: string | null;
}) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not signed in");

  const photoUrl = await uploadPhotoIfAny(params.photoUri);
  const payload = {
    type: "LOST",
    status: "OPEN",
    title: params.title.trim(),
    description: params.description.trim(),
    photoUrl: photoUrl ?? null,
    busId: null,
    busNumber: null,
    createdByUid: uid,
    createdByRole: "parent" as const,
    parentUid: params.parentUid ?? uid,
    studentUid: params.studentUid ?? null,
    claimantUid: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    resolvedAt: null,
    ttlAt: null,
  };
  const refDoc = await addDoc(colRef, payload as any);
  await updateDoc(refDoc, { id: refDoc.id, updatedAt: serverTimestamp() });
  return refDoc.id;
}

/** Driver reports a FOUND item for their bus */
export async function createFoundItem(params: {
  title: string;
  description: string;
  busId: string;
  busNumber?: string | null;
  photoUri?: string | null;
}) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not signed in");

  const photoUrl = await uploadPhotoIfAny(params.photoUri);
  const payload = {
    type: "FOUND",
    status: "OPEN",
    title: params.title.trim(),
    description: params.description.trim(),
    photoUrl: photoUrl ?? null,
    busId: params.busId,
    busNumber: params.busNumber ?? null,
    createdByUid: uid,
    createdByRole: "driver" as const,
    parentUid: null,
    studentUid: null,
    claimantUid: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    resolvedAt: null,
    ttlAt: null,
  };
  const refDoc = await addDoc(colRef, payload as any);
  await updateDoc(refDoc, { id: refDoc.id, updatedAt: serverTimestamp() });
  return refDoc.id;
}

/** Realtime: FOUND items by bus (OPEN only) */
export function subscribeFoundItemsByBus(
  busId: string,
  cb: (rows: LostFoundDoc[]) => void
) {
  const qy = query(
    colRef,
    where("type", "==", "FOUND"),
    where("busId", "==", busId),
    where("status", "==", "OPEN"),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(qy, (qs) => {
    cb(qs.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
  });
}

/** Realtime: my LOST items */
export function subscribeMyLostItems(cb: (rows: LostFoundDoc[]) => void) {
  const uid = auth.currentUser?.uid;
  if (!uid) return () => {};
  const qy = query(
    colRef,
    where("type", "==", "LOST"),
    where("createdByUid", "==", uid),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(qy, (qs) =>
    cb(qs.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
  );
}

/** Edit my LOST item (title/description) */
export async function editLostItem(
  id: string,
  fields: Partial<Pick<LostFoundDoc, "title" | "description">>
) {
  const refDoc = doc(db, COL, id);
  await updateDoc(refDoc, { ...fields, updatedAt: serverTimestamp() });
}

/** Mark my LOST as Found -> RESOLVED + ttlAt (24h) */
export async function markLostAsFound(id: string) {
  const refDoc = doc(db, COL, id);
  const ttl = new Date(Date.now() + 24 * 60 * 60 * 1000); // +24h
  await updateDoc(refDoc, {
    status: "RESOLVED",
    resolvedAt: serverTimestamp(),
    ttlAt: ttl, // enable Firestore TTL on this field
    updatedAt: serverTimestamp(),
  });
}

/** Remove immediately */
export async function deleteMyLostItem(id: string) {
  await deleteDoc(doc(db, COL, id));
}

/** LOST reports from parents (OPEN). Optionally filter by busId if your LOST docs store it. */
export function subscribeOpenLostReports(
  cb: (rows: LostFoundDoc[]) => void,
  opts?: { busId?: string }
) {
  const parts: any[] = [
    where("type", "==", "LOST"),
    where("status", "==", "OPEN"),
  ];
  if (opts?.busId) parts.splice(1, 0, where("busId", "==", opts.busId));
  parts.push(orderBy("createdAt", "desc"));
  const qy = query(colRef, ...parts);
  return onSnapshot(qy, (qs) =>
    cb(qs.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
  );
}

/** Driver's own FOUND posts */
export function subscribeMyFoundItemsForDriver(
  cb: (rows: LostFoundDoc[]) => void
) {
  const uid = auth.currentUser?.uid;
  if (!uid) return () => {};
  const qy = query(
    colRef,
    where("type", "==", "FOUND"),
    where("createdByUid", "==", uid),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(qy, (qs) =>
    cb(qs.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
  );
}

/** Driver claims a LOST report (lets parents see it's being handled) */
export async function claimLostReport(id: string) {
  const uid = auth.currentUser?.uid ?? null;
  const ref = doc(db, COL, id);
  await updateDoc(ref, {
    status: "CLAIMED",
    claimantUid: uid,
    updatedAt: serverTimestamp(),
  });
}

/** Driver marks a LOST report as resolved (found/returned). Auto-hides after 24h (TTL if enabled). */
export async function resolveLostReport(id: string) {
  const ref = doc(db, COL, id);
  const ttl = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await updateDoc(ref, {
    status: "RESOLVED",
    resolvedAt: serverTimestamp(),
    ttlAt: ttl,
    updatedAt: serverTimestamp(),
  });
}

/** Driver marks a FOUND they posted as returned (auto-hides after 24h) */
export async function markFoundAsReturned(id: string) {
  const ref = doc(db, COL, id);
  const ttl = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await updateDoc(ref, {
    status: "RESOLVED",
    resolvedAt: serverTimestamp(),
    ttlAt: ttl,
    updatedAt: serverTimestamp(),
  });
}

/** Remove any item I own (driver) */
export async function deleteItem(id: string) {
  await deleteDoc(doc(db, COL, id));
}
