import { auth } from "@/app/lib/firebase";
import { getUserById, subscribeUserById } from "@/data/users";
import type { UserDoc } from "@/types/user";
import { useEffect, useState } from "react";

export function useUserProfile(uid?: string) {
  const [user, setUser] = useState<UserDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    (async () => {
      const targetUid = uid ?? auth.currentUser?.uid ?? null;
      if (!targetUid) {
        setUser(null);
        setLoading(false);
        return;
      }
      // start with a quick snapshot (optional), then subscribe
      const first = await getUserById(targetUid);
      setUser(first);
      setLoading(false);

      unsub = subscribeUserById(targetUid, (u) => setUser(u));
    })();

    return () => unsub?.();
  }, [uid]);

  return { user, loading };
}
