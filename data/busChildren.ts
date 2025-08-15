// data/busChildren.ts
import { auth, db } from "@/app/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from "firebase/firestore";

export type BusChildStatus = "pending" | "approved" | "rejected" | "removed";

export interface BusChild {
  id: string; // `${busId}_${childUid}`
  busId: string;
  childUid: string;
  parentUid: string;
  status: BusChildStatus;
  createdAt?: any;
  updatedAt?: any;
}

const COL = "busChildren";

/** Create (or re-open) a pending request for (busId, childUid). */
export async function requestAddChildToBus(busId: string, childUid: string) {
  const parentUid = auth.currentUser?.uid;
  if (!parentUid) throw new Error("You must be signed in as a parent.");

  const id = `${busId}_${childUid}`;
  const ref = doc(db, COL, id);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) {
      tx.set(ref, {
        busId,
        childUid,
        parentUid,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      } as Omit<BusChild, "id">);
      return;
    }
    const existing = snap.data() as BusChild;
    if (existing.status === "approved") {
      throw new Error("Child already linked to this bus.");
    }
    if (existing.status === "pending") {
      throw new Error("A request is already pending.");
    }
    tx.set(ref, {
      ...existing,
      status: "pending",
      updatedAt: serverTimestamp(),
    });
  });

  return id;
}

export async function getBusChild(busId: string, childUid: string) {
  const ref = doc(db, COL, `${busId}_${childUid}`);
  const snap = await getDoc(ref);
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as BusChild) : null;
}

export async function getMyRequestsForBus(busId: string): Promise<BusChild[]> {
  const parentUid = auth.currentUser?.uid;
  if (!parentUid) return [];
  const q = query(
    collection(db, COL),
    where("busId", "==", busId),
    where("parentUid", "==", parentUid)
  );
  const snaps = await getDocs(q);
  return snaps.docs.map((d) => ({ id: d.id, ...d.data() }) as BusChild);
}
