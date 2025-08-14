export type UserRole = "parent" | "bus" | "student";

export interface UserDoc {
  uid: string;
  role: UserRole;
  email?: string | null;
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;

  // optional fields you already use
  parentCode?: string | null;
  parentUid?: string | null;
  currentBusId?: string | null;

  // timestamps (Firestore)
  createdAt?: any;
  updatedAt?: any;
}

/** Prefer fullName; fallback to first + last; then email; then "User" */
export const displayNameOf = (u: Partial<UserDoc>): string =>
  (u.fullName && u.fullName.trim()) ||
  [u.firstName, u.lastName].filter(Boolean).join(" ").trim() ||
  (u.email ?? "") ||
  "User";
