import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

// ✅ Use your alias/path to the initialized Firebase SDK
import { auth, db } from "../lib/firebase";

// Keep your existing types
type UserRole = "parent" | "bus" | "student";

interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Build an app-level User object from Firebase user + Firestore profile
  const buildUserFromProfile = async (
    uid: string,
    email: string
  ): Promise<User> => {
    const snap = await getDoc(doc(db, "users", uid));
    const data = snap.data() || {};
    const role = (data.role as UserRole) ?? "parent"; // fallback if missing
    const name =
      (data.fullName as string) ??
      [data.firstName, data.lastName].filter(Boolean).join(" ") ??
      email;
    return { id: uid, name: name || email, role, email };
  };

  // Restore session
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      try {
        if (fbUser) {
          const profile = await buildUserFromProfile(
            fbUser.uid,
            fbUser.email || ""
          );
          setUser(profile);
        } else {
          setUser(null);
        }
      } catch (e) {
        console.warn("Auth state error:", e);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const login = async (
    email: string,
    password: string
  ): Promise<User | null> => {
    setIsLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      const profile = await buildUserFromProfile(
        cred.user.uid,
        cred.user.email || email.trim()
      );
      setUser(profile);
      return profile;
    } catch (e) {
      console.warn("Login failed:", e);
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};

// Default export to keep Expo Router quiet
export default AuthProvider;
