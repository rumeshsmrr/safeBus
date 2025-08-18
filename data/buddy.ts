// data/buddy.ts
import { auth, db } from "@/app/lib/firebase";
import { getBusMeta } from "@/data/busProfiles";
import { getDisplayName } from "@/data/users";
import type { BuddyLinkDoc, PeerStudent } from "@/types/buddy";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";

const USERS = "users";
const BUDDIES = "buddyLinks";

function sortPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

/* ======================
   Student/child helpers
   ====================== */

export function subscribeMyChildren(
  cb: (kids: PeerStudent[]) => void
): Unsubscribe | null {
  const uid = auth.currentUser?.uid;
  if (!uid) return null;
  const q = query(
    collection(db, USERS),
    where("role", "==", "student"),
    where("parentUid", "==", uid)
  );
  return onSnapshot(q, (qs) => {
    const rows: PeerStudent[] = qs.docs.map((d) => {
      const x: any = d.data();
      return {
        uid: d.id,
        fullName: x.fullName ?? null,
        parentUid: x.parentUid ?? null,
        currentBusId: x.currentBusId ?? null,
        photoUrl: x.photoUrl ?? null,
      };
    });
    cb(rows);
  });
}

export function subscribePeersOnBus(
  busId: string,
  excludeChildUid: string,
  cb: (peers: PeerStudent[]) => void
): Unsubscribe {
  const q = query(
    collection(db, USERS),
    where("role", "==", "student"),
    where("currentBusId", "==", busId)
  );
  return onSnapshot(q, (qs) => {
    const rows: PeerStudent[] = qs.docs
      .map((d) => {
        const x: any = d.data();
        return {
          uid: d.id,
          fullName: x.fullName ?? null,
          parentUid: x.parentUid ?? null,
          currentBusId: x.currentBusId ?? null,
          photoUrl: x.photoUrl ?? null,
        };
      })
      .filter((p) => p.uid !== excludeChildUid);
    cb(rows);
  });
}

export async function getStudent(uid: string): Promise<PeerStudent | null> {
  const snap = await getDoc(doc(db, USERS, uid));
  if (!snap.exists()) return null;
  const x: any = snap.data();
  return {
    uid: snap.id,
    fullName: x.fullName ?? null,
    parentUid: x.parentUid ?? null,
    currentBusId: x.currentBusId ?? null,
    photoUrl: x.photoUrl ?? null,
  };
}

/* ======================
   Buddy link streams
   ====================== */

export function subscribeMyBuddyLinks(
  cb: (links: BuddyLinkDoc[]) => void
): Unsubscribe | null {
  const me = auth.currentUser?.uid;
  if (!me) return null;
  const qy = query(
    collection(db, BUDDIES),
    where("parentUids", "array-contains", me),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(qy, (qs) =>
    cb(qs.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
  );
}

export function subscribeIncomingRequests(
  cb: (links: BuddyLinkDoc[]) => void
): Unsubscribe | null {
  const me = auth.currentUser?.uid;
  if (!me) return null;
  const qy = query(
    collection(db, BUDDIES),
    where("requestedParentUid", "==", me),
    where("status", "==", "pending"),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(qy, (qs) =>
    cb(qs.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
  );
}

/* ======================
   Buddy link actions
   ====================== */

// Create request with denormalized human-friendly fields
export async function sendBuddyRequest(
  myChildUid: string,
  peerChildUid: string
) {
  const me = auth.currentUser?.uid;
  if (!me) throw new Error("Not signed in");

  const meStudent = await getStudent(myChildUid);
  if (!meStudent || meStudent.parentUid !== me) {
    throw new Error("You can only request using your own child");
  }
  const peer = await getStudent(peerChildUid);
  if (!peer || !peer.parentUid) {
    throw new Error("Peer student has no parent linked");
  }

  const [a, b] = sortPair(myChildUid, peerChildUid);
  const [pa, pb] =
    a === myChildUid ? [me, peer.parentUid] : [peer.parentUid, me];

  // Display names
  const requesterParentName = await getDisplayName(me);
  const requestedParentName = await getDisplayName(peer.parentUid);
  const requesterChildName = meStudent.fullName ?? myChildUid;
  const requestedChildName = peer.fullName ?? peerChildUid;

  // Bus meta (from busProfiles preferred, fallback to users/role:bus)
  const busId = meStudent.currentBusId ?? null;
  const busMeta = busId ? await getBusMeta(busId) : null;

  const payload: Omit<BuddyLinkDoc, "id"> = {
    childUids: [a, b],
    parentUids: [pa, pb],
    requesterParentUid: me,
    requestedParentUid: peer.parentUid,
    status: "pending",
    active: true,
    busId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),

    // Denormalized fields for the UI
    busNumber: busMeta?.busNumber ?? null,
    busNickname: busMeta?.busNickname ?? null,
    requesterParentName,
    requestedParentName,
    requesterChildName,
    requestedChildName,
  };

  const ref = await addDoc(collection(db, BUDDIES), payload as any);
  await updateDoc(ref, { id: ref.id, updatedAt: serverTimestamp() });
}

export async function respondToBuddyRequest(linkId: string, accept: boolean) {
  const ref = doc(db, BUDDIES, linkId);
  await updateDoc(ref, {
    status: accept ? "active" : "rejected",
    updatedAt: serverTimestamp(),
  });
}

export async function setBuddyActive(linkId: string, active: boolean) {
  const ref = doc(db, BUDDIES, linkId);
  await updateDoc(ref, { active, updatedAt: serverTimestamp() });
}
