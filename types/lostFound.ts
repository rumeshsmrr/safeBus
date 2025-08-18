// types/lostFound.ts
export type LFType = "LOST" | "FOUND";
export type LFStatus = "OPEN" | "CLAIMED" | "RESOLVED"; // RESOLVED = user found it

export interface LostFoundDoc {
  id: string;
  type: LFType;
  status: LFStatus;
  title: string;
  description: string;
  photoUrl: string | null;
  busId: string | null;
  busNumber: string | null;
  createdByUid: string;
  createdByRole: "parent" | "driver";
  parentUid?: string | null;
  studentUid?: string | null;
  claimantUid?: string | null;
  createdAt: any;
  updatedAt: any;

  // NEW:
  resolvedAt?: any | null; // when user marks found
  ttlAt?: any | null; // when to auto-delete (24h after resolvedAt)
}
