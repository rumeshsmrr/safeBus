// data/tours.ts
import { auth, db } from "@/app/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from "firebase/firestore";

/* ======================= Types ======================= */

export type TourSession = "morning" | "evening";

export type TourStatus =
  | "PICK_IN" // waiting to be picked
  | "ON_BUS" // picked and on bus
  | "DROPPED" // dropped at destination
  | "ABSENT" // marked absent by driver
  | "NOT_GOING"; // marked not going (usually by parent)

export interface SessionState {
  going: boolean; // whether included in today’s session
  status: TourStatus; // current status for this session
}

export interface LocationLike {
  latitude?: number;
  longitude?: number;
  address?: string | null;
}

export interface TourParticipant {
  id: string; // childUid (doc id in participants subcollection)
  childUid: string;
  childName?: string | null;

  // snapshot of current profile fields (refreshed by ensureTourDay)
  address?: string | null;
  homeLocation?: LocationLike | null;
  schoolLocation?: LocationLike | null;

  morning: SessionState;
  evening: SessionState;

  updatedAt?: any;
}

/* ======================= Utils ======================= */

const toursCol = collection(db, "tours");

export function dateKeyFor(d: Date = new Date()): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function normalizeParticipant(
  snap: QueryDocumentSnapshot<DocumentData>
): TourParticipant {
  const data = snap.data() as any;
  const defState: SessionState = { going: true, status: "PICK_IN" };

  return {
    id: snap.id,
    childUid: data.childUid ?? snap.id,
    childName: data.childName ?? null,
    address: data.address ?? null,
    homeLocation: data.homeLocation ?? null,
    schoolLocation: data.schoolLocation ?? null,
    morning: data.morning ?? defState,
    evening: data.evening ?? defState,
    updatedAt: data.updatedAt,
  };
}

/* =================== Bus helpers ===================== */

/** Driver convenience: first bus where current user is owner. */
export async function getMyFirstBusId(): Promise<string | null> {
  const uid = auth.currentUser?.uid;
  if (!uid) return null;

  const q = query(
    collection(db, "busProfiles"),
    where("ownerUid", "==", uid),
    limit(1)
  );
  const snaps = await getDocs(q);
  if (snaps.empty) return null;
  return snaps.docs[0].id;
}

/* ===================== Day prep ====================== */

/**
 * Ensure a tour day exists for (busId, dateKey) and upsert *all approved*
 * children as participants. Their name/address/locations are **refreshed**
 * from the latest user profile on each call so a driver can tap Refresh and
 * see updated data immediately.
 */
export async function ensureTourDay(busId: string, dateKey: string) {
  const dayId = `${busId}_${dateKey}`;
  const dayRef = doc(toursCol, dayId);
  const partsCol = collection(dayRef, "participants");

  // 1) Ensure the day document exists (merge keeps counters you may add later)
  await setDoc(
    dayRef,
    {
      busId,
      dateKey,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  // 2) List approved children for this bus
  const approved = await getDocs(
    query(
      collection(db, "busChildren"),
      where("busId", "==", busId),
      where("status", "==", "approved")
    )
  );

  // 3) Upsert one participant per approved child (refresh latest user fields)
  for (const d of approved.docs) {
    const { childUid } = d.data() as any;
    if (!childUid) continue;

    const userSnap = await getDoc(doc(db, "users", childUid));
    if (!userSnap.exists()) continue;

    const u = userSnap.data() as any;
    const childName =
      u.fullName ||
      [u.firstName, u.lastName].filter(Boolean).join(" ") ||
      "Unnamed";

    const latestAddress = u?.homeLocation?.address ?? u?.address ?? null;

    const pRef = doc(partsCol, childUid);
    const pSnap = await getDoc(pRef);
    const existing = pSnap.exists() ? (pSnap.data() as any) : null;

    // keep previously chosen statuses if any; otherwise default to PICK_IN+going:true
    const defState: SessionState = { going: true, status: "PICK_IN" };
    const morning: SessionState = existing?.morning ?? defState;
    const evening: SessionState = existing?.evening ?? defState;

    await setDoc(
      pRef,
      {
        id: childUid,
        childUid,
        childName,
        address: latestAddress,
        homeLocation: u.homeLocation ?? null,
        schoolLocation: u.schoolLocation ?? null,
        morning,
        evening,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }
}

/** A semantic alias if you like calling “refresh” from the UI. */
export async function refreshTourDay(busId: string, dateKey: string) {
  return ensureTourDay(busId, dateKey);
}

/* ==================== Realtime feeds ==================== */

/** Live list of participants for a given day. */
export function subscribeTourParticipants(
  busId: string,
  dateKey: string,
  cb: (list: TourParticipant[]) => void
): Unsubscribe {
  const dayId = `${busId}_${dateKey}`;
  const partsCol = collection(doc(toursCol, dayId), "participants");

  // You can add orderBy here (e.g., by childName) if you want:
  // const q = query(partsCol, orderBy("childName", "asc"));
  return onSnapshot(partsCol, (qs) => {
    cb(qs.docs.map(normalizeParticipant));
  });
}

/* =================== Mutations =================== */

export async function updateParticipantStatus(params: {
  busId: string;
  childUid: string;
  session: TourSession;
  status: TourStatus;
  dateKey: string;
  going?: boolean; // optional explicit going toggle
}) {
  const { busId, childUid, session, status, dateKey, going } = params;

  const dayId = `${busId}_${dateKey}`;
  const pRef = doc(collection(doc(toursCol, dayId), "participants"), childUid);

  // by default, selecting NOT_GOING implies going:false; others -> going:true
  const desiredGoing =
    typeof going === "boolean" ? going : status === "NOT_GOING" ? false : true;

  await setDoc(
    pRef,
    {
      [session]: { status, going: desiredGoing },
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/* ============== (Optional) Parent-side helper ============== */
/**
 * When a parent marks “not going” for the whole day, you may want to set both
 * sessions to NOT_GOING quickly.
 */
export async function setBothSessionsNotGoing(
  busId: string,
  childUid: string,
  dateKey: string
) {
  const dayId = `${busId}_${dateKey}`;
  const pRef = doc(collection(doc(toursCol, dayId), "participants"), childUid);

  await setDoc(
    pRef,
    {
      morning: { status: "NOT_GOING", going: false },
      evening: { status: "NOT_GOING", going: false },
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
