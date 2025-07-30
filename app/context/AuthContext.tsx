import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

// Define the UserRole type, including 'student' for completeness as per project scope
type UserRole = "parent" | "bus" | "student";

// Define the User interface
interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
}

// Define the AuthContextType interface, now including isLoading
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<User | null>; // CHANGED: Now returns Promise<User | null>
  logout: () => void;
  isLoading: boolean;
}

// Create the AuthContext
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hardcoded credentials (for demonstration purposes)
const credentials = [
  {
    id: "1",
    name: "Parent User",
    role: "parent" as UserRole,
    email: "p@e.com",
    password: "123456",
  },
  {
    id: "2",
    name: "Bus User", // This is the driver role
    role: "bus" as UserRole,
    email: "b@e.com",
    password: "123456",
  },
  {
    id: "3",
    name: "Student User", // Added student for completeness
    role: "student" as UserRole,
    email: "st@e.com",
    password: "123456",
  },
];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkInitialAuth = async () => {
      // Simulate async check for existing session
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsLoading(false);
    };
    checkInitialAuth();
  }, []);

  const login = async (
    email: string,
    password: string
  ): Promise<User | null> => {
    // CHANGED: Now returns User | null
    setIsLoading(true);
    const found = credentials.find(
      (u) => u.email === email && u.password === password
    );

    // Simulate async operation for login
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (found) {
      const userData = {
        id: found.id,
        name: found.name,
        role: found.role,
        email: found.email,
      };
      setUser(userData);
      setIsLoading(false);
      return userData; // CHANGED: Return the user data
    } else {
      setIsLoading(false);
      return null; // CHANGED: Return null if login failed
    }
  };

  const logout = () => {
    setIsLoading(true);
    setTimeout(() => {
      setUser(null);
      setIsLoading(false);
    }, 300);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Add default export to fix Expo Router warning
export default AuthProvider;
