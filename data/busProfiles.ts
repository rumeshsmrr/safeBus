// data/busProfiles.ts
import { db } from "@/app/lib/firebase";
import {
  collection,
  doc,
  DocumentData,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  QuerySnapshot,
  where,
} from "firebase/firestore";

export interface BusProfile {
  busId?: string | null;
  busNickName?: string | null;
  busNumber?: string | null;
  contactNumber?: string | null;
  createdAt?: any;
  updatedAt?: any;
  endAddress?: string | null;
  endCoords?: any;
  startAddress?: string | null;
  startCoords?: any;
  firstName?: string | null;
  lastName?: string | null;
  ownerUid?: string | null;
  role?: string | null;
  isSetupComplete?: boolean | null;

  // NEW aggregate fields
  ratingAvg?: number | null; // 0..5
  ratingCount?: number | null; // integer
  ratingTotal?: number | null; // sum of scores
}

const busProfilesCol = collection(db, "busProfiles");

const normalizeDoc = (d: { id: string; data: () => DocumentData }) => {
  const data = d.data() as BusProfile;
  return {
    id: d.id,
    ...data,
    busId: data.busId ?? d.id,
    ratingAvg: typeof data.ratingAvg === "number" ? data.ratingAvg : 0,
    ratingCount: typeof data.ratingCount === "number" ? data.ratingCount : 0,
    ratingTotal: typeof data.ratingTotal === "number" ? data.ratingTotal : 0,
  };
};

const toStr = (v: unknown) => (typeof v === "string" ? v : v ? String(v) : "");

// --- One-time getters ---
export const getAllBusProfiles = async () => {
  try {
    const snapshot = await getDocs(busProfilesCol);
    return snapshot.docs.map((doc) => normalizeDoc(doc));
  } catch (error) {
    console.error("Error fetching all bus profiles:", error);
    return [];
  }
};

export const getBusProfilesByOwner = async (ownerUid: string) => {
  try {
    const qOwner = query(busProfilesCol, where("ownerUid", "==", ownerUid));
    const snapshot = await getDocs(qOwner);
    return snapshot.docs.map((doc) => normalizeDoc(doc));
  } catch (error) {
    console.error("Error fetching bus profiles by owner:", error);
    return [];
  }
};

export const getBusProfileById = async (busId: string) => {
  try {
    const docRef = doc(busProfilesCol, busId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return normalizeDoc({ id: docSnap.id, data: () => docSnap.data()! });
    } else {
      console.warn("No bus profile found for this ID");
      return null;
    }
  } catch (error) {
    console.error("Error fetching bus profile by ID:", error);
    return null;
  }
};

// --- Real-time subscriptions ---
export const subscribeAllBusProfiles = (
  onChange: (buses: (BusProfile & { id: string })[]) => void,
  onError?: (e: unknown) => void
) => {
  return onSnapshot(
    busProfilesCol,
    (snap: QuerySnapshot<DocumentData>) => {
      onChange(snap.docs.map((d) => normalizeDoc(d)));
    },
    (err) => onError?.(err)
  );
};

export const subscribeBusProfilesByOwner = (
  ownerUid: string,
  onChange: (buses: (BusProfile & { id: string })[]) => void,
  onError?: (e: unknown) => void
) => {
  const qOwner = query(busProfilesCol, where("ownerUid", "==", ownerUid));
  return onSnapshot(
    qOwner,
    (snap: QuerySnapshot<DocumentData>) => {
      onChange(snap.docs.map((d) => normalizeDoc(d)));
    },
    (err) => onError?.(err)
  );
};

export const subscribeBusProfileById = (
  busId: string,
  onChange: (bus: (BusProfile & { id: string }) | null) => void,
  onError?: (e: unknown) => void
) => {
  const ref = doc(busProfilesCol, busId);
  return onSnapshot(
    ref,
    (snap) => {
      onChange(
        snap.exists()
          ? {
              ...normalizeDoc({ id: snap.id, data: () => snap.data()! }),
            }
          : null
      );
    },
    (err) => onError?.(err)
  );
};

// --- Search helper ---
export const filterBuses = (
  buses: (BusProfile & { id: string })[],
  queryText: string
) => {
  const q = queryText.trim().toLowerCase();
  if (!q) return buses;

  return buses.filter((bus) => {
    const nickname = toStr(bus.busNickName).toLowerCase();
    const busNumber = toStr(bus.busNumber).toLowerCase();
    const start = toStr(bus.startAddress).toLowerCase();
    const end = toStr(bus.endAddress).toLowerCase();
    const first = toStr(bus.firstName).toLowerCase();
    const last = toStr(bus.lastName).toLowerCase();

    return (
      nickname.includes(q) ||
      busNumber.includes(q) ||
      start.includes(q) ||
      end.includes(q) ||
      first.includes(q) ||
      last.includes(q)
    );
  });
};

/* =========================
   ADD: Resolve any ID to docId
   ========================= */
export async function resolveBusDocId(anyId: string): Promise<string | null> {
  if (!anyId) return null;

  // (a) direct doc id
  const byDocId = await getDoc(doc(busProfilesCol, anyId));
  if (byDocId.exists()) return byDocId.id;

  // (b) lookup by the "busId" field
  const qBusId = query(busProfilesCol, where("busId", "==", anyId), limit(1));
  const snaps = await getDocs(qBusId);
  if (!snaps.empty) return snaps.docs[0].id;

  return null;
}

/* =========================
   NEW: Minimal bus meta helper
   ========================= */
export async function getBusMeta(
  busIdOrDocId: string
): Promise<{ busNumber: string | null; busNickname: string | null } | null> {
  if (!busIdOrDocId) return null;

  // Try as doc id; if not, resolve via "busId" field.
  const resolvedId = (await resolveBusDocId(busIdOrDocId)) ?? busIdOrDocId;
  const prof = await getBusProfileById(resolvedId);
  if (!prof) return null;

  return {
    busNumber: prof.busNumber ?? null,
    busNickname: prof.busNickName ?? null,
  };
}
