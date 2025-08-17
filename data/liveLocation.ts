// data/liveLocation.ts
import { db } from "@/app/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

/**
 * We return:
 * - lat/lng + telemetry
 * - updatedAtMs (most recent of server/client times)
 * - isSharing: whether the child explicitly toggled sharing ON (from liveStatus doc)
 * - source: "live" when both isSharing=true and the last update is fresh; else "stale"
 * - lastAgoMs: ms since last location update (or null)
 */
export type ChildLiveLocation = {
  lat: number | null;
  lng: number | null;
  accuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
  updatedAtMs?: number | null;
  isSharing?: boolean | null;
  source?: "live" | "stale" | "none";
  lastAgoMs?: number | null;
} | null;

// Consider updates within this window "fresh"
export const LIVE_WINDOW_MS = 60 * 1000;

/**
 * Subscribes to:
 *   - liveLocations/{childUid}
 *   - liveStatus/{childUid}
 * and merges them.
 *
 * `cb` will be called on any change with normalized fields.
 */
export function subscribeChildLiveLocation(
  childUid: string,
  cb: (loc: ChildLiveLocation) => void
) {
  const locRef = doc(db, "liveLocations", childUid);
  const statusRef = doc(db, "liveStatus", childUid);

  // Local snapshots we merge for the callback
  let latestLoc: any | null = null;
  let latestStatus: any | null = null;

  function emit() {
    if (!latestLoc && !latestStatus) {
      cb(null);
      return;
    }

    // Normalize location
    let lat: number | null = null;
    let lng: number | null = null;
    let accuracy: number | null = null;
    let heading: number | null = null;
    let speed: number | null = null;
    let updatedAtMs: number | null = null;

    if (latestLoc) {
      lat = typeof latestLoc.lat === "number" ? latestLoc.lat : null;
      lng = typeof latestLoc.lng === "number" ? latestLoc.lng : null;
      accuracy =
        typeof latestLoc.accuracy === "number" ? latestLoc.accuracy : null;
      heading =
        typeof latestLoc.heading === "number" ? latestLoc.heading : null;
      speed = typeof latestLoc.speed === "number" ? latestLoc.speed : null;

      // Server time -> ms (if present)
      let serverMs: number | null = null;
      const ts = latestLoc?.updatedAt;
      if (ts?.toMillis) serverMs = ts.toMillis();
      else if (ts?.toDate) serverMs = ts.toDate().getTime();
      else if (typeof ts?.seconds === "number") serverMs = ts.seconds * 1000;

      // Client time -> ms (if present)
      const clientMs =
        typeof latestLoc?.updatedAtClientMs === "number"
          ? latestLoc.updatedAtClientMs
          : null;

      updatedAtMs =
        serverMs && clientMs
          ? Math.max(serverMs, clientMs)
          : (serverMs ?? clientMs ?? null);
    }

    // Normalize status
    const isSharing =
      typeof latestStatus?.isSharing === "boolean"
        ? latestStatus.isSharing
        : null;

    // Derive freshness + label
    let lastAgoMs: number | null = null;
    let source: "live" | "stale" | "none" = "none";
    if (typeof updatedAtMs === "number") {
      lastAgoMs = Date.now() - updatedAtMs;
      const fresh = lastAgoMs <= LIVE_WINDOW_MS;
      source = isSharing && fresh ? "live" : "stale";
    } else {
      source = isSharing ? "stale" : "none";
    }

    cb({
      lat,
      lng,
      accuracy,
      heading,
      speed,
      updatedAtMs,
      isSharing,
      source,
      lastAgoMs,
    });
  }

  const unsubLoc = onSnapshot(
    locRef,
    (snap) => {
      latestLoc = snap.exists() ? snap.data() : null;
      emit();
    },
    (err) => {
      console.log("[liveLocation] location subscribe error:", err);
      latestLoc = null;
      emit();
    }
  );

  const unsubStatus = onSnapshot(
    statusRef,
    (snap) => {
      latestStatus = snap.exists() ? snap.data() : null;
      emit();
    },
    (err) => {
      console.log("[liveLocation] status subscribe error:", err);
      latestStatus = null;
      emit();
    }
  );

  return () => {
    unsubLoc();
    unsubStatus();
  };
}
