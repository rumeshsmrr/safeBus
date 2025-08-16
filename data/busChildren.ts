// data/busChildren.ts
import { auth, db } from "@/app/lib/firebase";
import {
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  where,
  type Unsubscribe,
} from "firebase/firestore";

export type BusChildStatus = "pending" | "approved" | "rejected" | "removed";

export interface BusChild {
  id: string; // `${busId}_${childUid}`
  busId: string;
  childUid: string;
  parentUid: string;
  status: BusChildStatus;

  // Optional metadata for moderation
  reason?: string | null; // rejection note
  decidedByUid?: string | null; // bus owner who took action

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
      reason: deleteField(),
      decidedByUid: deleteField(),
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
  const qReq = query(
    collection(db, COL),
    where("busId", "==", busId),
    where("parentUid", "==", parentUid)
  );
  const snaps = await getDocs(qReq);
  return snaps.docs.map((d) => ({ id: d.id, ...d.data() }) as BusChild);
}

/* -------------------- Realtime feeds -------------------- */

/** Realtime: all PENDING requests for a bus */
export function subscribePendingBusChildRequests(
  busId: string,
  cb: (list: BusChild[]) => void
): Unsubscribe {
  const qPending = query(
    collection(db, COL),
    where("busId", "==", busId),
    where("status", "==", "pending")
  );
  return onSnapshot(qPending, (qs) => {
    const list = qs.docs.map((d) => ({ id: d.id, ...d.data() }) as BusChild);
    cb(list);
  });
}

/** Realtime: current parent's requests for a bus */
export function subscribeMyRequestsForBus(
  busId: string,
  cb: (list: BusChild[]) => void
): Unsubscribe | null {
  const parentUid = auth.currentUser?.uid;
  if (!parentUid) return null;
  const qMine = query(
    collection(db, COL),
    where("busId", "==", busId),
    where("parentUid", "==", parentUid)
  );
  return onSnapshot(qMine, (qs) => {
    const list = qs.docs.map((d) => ({ id: d.id, ...d.data() }) as BusChild);
    cb(list);
  });
}

/* -------------------- Moderator actions -------------------- */

export async function approveBusChildRequest(params: {
  busId: string;
  childUid: string;
}) {
  const { busId, childUid } = params;
  const decidedByUid = auth.currentUser?.uid ?? null;
  const reqRef = doc(db, COL, `${busId}_${childUid}`);
  const userRef = doc(db, "users", childUid);

  await runTransaction(db, async (tx) => {
    const reqSnap = await tx.get(reqRef);
    if (!reqSnap.exists()) throw new Error("Request not found.");
    const req = reqSnap.data() as BusChild;
    if (req.status !== "pending") throw new Error("Request is not pending.");

    const userSnap = await tx.get(userRef);
    if (!userSnap.exists()) throw new Error("Child user not found.");
    const user = userSnap.data() as any;
    const currentBusId = user?.currentBusId ?? null;
    if (currentBusId && currentBusId !== busId) {
      throw new Error("Child is already linked to a different bus.");
    }

    tx.update(reqRef, {
      status: "approved",
      reason: deleteField(),
      decidedByUid,
      updatedAt: serverTimestamp(),
    });
    tx.update(userRef, {
      currentBusId: busId,
      updatedAt: serverTimestamp(),
    });
  });
}

export async function rejectBusChildRequest(params: {
  busId: string;
  childUid: string;
  reason?: string;
}) {
  const { busId, childUid, reason } = params;
  const decidedByUid = auth.currentUser?.uid ?? null;
  const reqRef = doc(db, COL, `${busId}_${childUid}`);

  await runTransaction(db, async (tx) => {
    const reqSnap = await tx.get(reqRef);
    if (!reqSnap.exists()) throw new Error("Request not found.");
    const req = reqSnap.data() as BusChild;
    if (req.status !== "pending") throw new Error("Request is not pending.");

    tx.update(reqRef, {
      status: "rejected",
      reason: reason ?? null,
      decidedByUid,
      updatedAt: serverTimestamp(),
    });
  });
}

export async function removeChildFromBus(params: {
  busId: string;
  childUid: string;
}) {
  const { busId, childUid } = params;
  const decidedByUid = auth.currentUser?.uid ?? null;
  const reqRef = doc(db, COL, `${busId}_${childUid}`);
  const userRef = doc(db, "users", childUid);

  await runTransaction(db, async (tx) => {
    const reqSnap = await tx.get(reqRef);
    if (!reqSnap.exists()) throw new Error("Link document not found.");
    const req = reqSnap.data() as BusChild;
    if (req.status !== "approved")
      throw new Error("Child is not approved on this bus.");

    const userSnap = await tx.get(userRef);
    if (!userSnap.exists()) throw new Error("Child user not found.");
    const user = userSnap.data() as any;

    tx.update(reqRef, {
      status: "removed",
      decidedByUid,
      updatedAt: serverTimestamp(),
    });

    // Only clear if still linked to THIS bus
    if (user?.currentBusId === busId) {
      tx.update(userRef, {
        currentBusId: deleteField(),
        updatedAt: serverTimestamp(),
      });
    }
  });
}

/* =========================
   ADD: Approved bus lookup
   ========================= */
export async function getApprovedBusForChild(
  childUid: string
): Promise<string | null> {
  if (!childUid) return null;
  const qApproved = query(
    collection(db, COL),
    where("childUid", "==", childUid),
    where("status", "==", "approved"),
    limit(1)
  );
  const snaps = await getDocs(qApproved);
  if (snaps.empty) return null;
  const data = snaps.docs[0].data() as BusChild;
  return data.busId ?? null;
}
