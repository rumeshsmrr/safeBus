// data/emergency.ts
import { db } from "@/app/lib/firebase";
import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

export type EmergencyAlert = {
  id?: string;
  childUid: string;
  parentUid: string;
  childName?: string | null;
  message?: string | null; // optional, can attach a note later
  loc?: { lat: number; lng: number; accuracy?: number | null } | null;
  createdAt?: any;
  status: "NEW" | "ACK" | "RESOLVED";
};

export async function createEmergencyAlert(params: {
  childUid: string;
  parentUid: string;
  childName?: string | null;
  loc?: { lat: number; lng: number; accuracy?: number | null } | null;
  message?: string | null;
}) {
  const ref = collection(db, "emergencyAlerts");
  await addDoc(ref, {
    childUid: params.childUid,
    parentUid: params.parentUid,
    childName: params.childName ?? null,
    message: params.message ?? null,
    loc: params.loc ?? null,
    status: "NEW",
    createdAt: serverTimestamp(),
  });
}

export function subscribeEmergencyAlertsForParent(
  parentUid: string,
  cb: (alerts: EmergencyAlert[]) => void
) {
  const ref = collection(db, "emergencyAlerts");
  const q = query(
    ref,
    where("parentUid", "==", parentUid),
    orderBy("createdAt", "desc"),
    limit(25)
  );
  return onSnapshot(q, (snap) => {
    const rows: EmergencyAlert[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as any),
    }));
    cb(rows);
  });
}

export async function acknowledgeEmergency(alertId: string) {
  const ref = doc(db, "emergencyAlerts", alertId);
  await updateDoc(ref, { status: "ACK" });
}

export async function resolveEmergency(alertId: string) {
  const ref = doc(db, "emergencyAlerts", alertId);
  await updateDoc(ref, { status: "RESOLVED" });
}
