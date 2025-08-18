// types/buddy.ts
export type BuddyStatus = "pending" | "active" | "rejected" | "canceled";

export interface BuddyLinkDoc {
  id: string;

  // Pairing
  childUids: [string, string]; // sorted pair of child UIDs
  parentUids: [string, string]; // parents in same order as childUids
  requesterParentUid: string; // who sent the request
  requestedParentUid: string; // who needs to confirm/reject

  // State
  status: BuddyStatus; // pending | active | rejected | canceled
  active: boolean; // quick pause/resume

  // Bus context
  busId: string | null;

  // Timestamps (Firestore Timestamp)
  createdAt: any;
  updatedAt: any;

  // ---------- Denormalized display fields ----------
  busNumber?: string | null;
  busNickname?: string | null;

  requesterParentName?: string | null;
  requestedParentName?: string | null;

  requesterChildName?: string | null;
  requestedChildName?: string | null;
}

export interface PeerStudent {
  uid: string; // student's user doc id
  fullName: string | null;
  parentUid: string | null;
  currentBusId: string | null;
  photoUrl?: string | null;
}
