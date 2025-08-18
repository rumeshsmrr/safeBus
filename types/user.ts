// types/user.ts
export type UserRole = "parent" | "bus" | "student";

export interface GeoAddress {
  address: string;
  latitude: number;
  longitude: number;
}

export interface UserDoc {
  uid: string;
  role: UserRole;
  email?: string | null;
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;

  parentCode?: string | null;
  parentUid?: string | null;
  currentBusId?: string | null;

  createdAt?: any;
  updatedAt?: any;

  // NEW — phones
  contactNumber?: string | null; // parent’s phone (E.164)
  trustedContactNumber?: string | null; // trusted person’s phone (E.164)

  // Optional if you plan to store a child’s own phone
  studentPhone?: string | null; // student/child phone (if you use it)

  homeLocation?: GeoAddress | null;
  schoolLocation?: GeoAddress | null;
}

/** Prefer fullName; fallback… */
export const displayNameOf = (u: Partial<UserDoc>): string =>
  (u.fullName && u.fullName.trim()) ||
  [u.firstName, u.lastName].filter(Boolean).join(" ").trim() ||
  (u.email ?? "") ||
  "User";
