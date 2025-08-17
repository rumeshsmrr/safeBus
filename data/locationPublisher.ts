// data/locationPublisher.ts
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";

// IMPORTANT: keep this name stable across builds
export const TASK = "child-live-location-task";

/**
 * Define the background task only once (guards fast refresh)
 */
function defineTaskOnce() {
  // @ts-ignore
  if (global.__SB_TASK_DEFINED__) return;

  TaskManager.defineTask(TASK, async ({ data, error }) => {
    try {
      if (error) {
        console.log("[Task] error:", error);
        return;
      }

      // Lazy import firebase to avoid circular deps at app start
      const { auth, db } = await import("@/app/lib/firebase");
      const { doc, serverTimestamp, setDoc } = await import(
        "firebase/firestore"
      );

      const payload = data as any;
      const first = payload?.locations?.[0];
      if (!first) return;

      const user = auth.currentUser;
      if (!user) return;

      const { latitude, longitude, accuracy, heading, speed } =
        first.coords || {};

      // Write the latest coordinates (merge)
      const locRef = doc(db, "liveLocations", user.uid);
      await setDoc(
        locRef,
        {
          lat: latitude ?? null,
          lng: longitude ?? null,
          accuracy: accuracy ?? null,
          heading: heading ?? null,
          speed: speed ?? null,
          updatedAt: serverTimestamp(),
          updatedAtClientMs: Date.now(),
        },
        { merge: true }
      );

      // Update the "liveStatus" heartbeat as well (so parents flip immediately)
      const statusRef = doc(db, "liveStatus", user.uid);
      await setDoc(
        statusRef,
        {
          isSharing: true,
          lastActiveAt: serverTimestamp(),
          lastActiveAtClientMs: Date.now(),
        },
        { merge: true }
      );
    } catch (e) {
      console.log("[Task] handler failed:", e);
    }
  });

  // @ts-ignore
  global.__SB_TASK_DEFINED__ = true;
}
defineTaskOnce();

/**
 * Ask for permissions
 */
export async function requestLocationPermissions() {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== "granted") {
    throw new Error("Foreground location permission not granted");
  }
  const bg = await Location.requestBackgroundPermissionsAsync();
  if (bg.status !== "granted") {
    throw new Error("Background location permission not granted");
  }
}

/**
 * Start background updates (idempotent).
 * Also flips liveStatus -> isSharing:true immediately and primes one reading.
 */
export async function startSharingLocation() {
  const [{ auth, db }, firestore] = await Promise.all([
    import("@/app/lib/firebase"),
    import("firebase/firestore"),
  ]);
  const { doc, serverTimestamp, setDoc } = firestore;

  await requestLocationPermissions();

  const already = await Location.hasStartedLocationUpdatesAsync(TASK);
  if (!already) {
    await Location.startLocationUpdatesAsync(TASK, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 10_000, // Android hint (ms)
      distanceInterval: 20, // iOS throttle (m)
      showsBackgroundLocationIndicator: true, // iOS pill
      pausesUpdatesAutomatically: true,
      activityType: Location.ActivityType.AutomotiveNavigation,
      foregroundService: {
        notificationTitle: "Sharing location",
        notificationBody: "Your location is being shared with your parent.",
        notificationColor: "#FF9800",
      },
    });
  }

  // Immediately mark sharing ON so the parent UI flips to LIVE right away
  const user = auth.currentUser;
  if (user) {
    const statusRef = doc(db, "liveStatus", user.uid);
    await setDoc(
      statusRef,
      {
        isSharing: true,
        lastActiveAt: serverTimestamp(),
        lastActiveAtClientMs: Date.now(),
      },
      { merge: true }
    );

    // Prime an immediate foreground reading so the first pin appears instantly
    try {
      const cur = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const locRef = doc(db, "liveLocations", user.uid);
      await setDoc(
        locRef,
        {
          lat: cur.coords.latitude,
          lng: cur.coords.longitude,
          accuracy: cur.coords.accuracy ?? null,
          heading: cur.coords.heading ?? null,
          speed: cur.coords.speed ?? null,
          updatedAt: serverTimestamp(),
          updatedAtClientMs: Date.now(),
        },
        { merge: true }
      );
    } catch (e) {
      // Not fatal—background task will write soon
      console.log("[startSharingLocation] prime location failed:", e);
    }
  }
}

/**
 * Stop background updates (idempotent) and flip liveStatus -> false
 */
export async function stopSharingLocation() {
  const [{ auth, db }, firestore] = await Promise.all([
    import("@/app/lib/firebase"),
    import("firebase/firestore"),
  ]);
  const { doc, setDoc, serverTimestamp } = firestore;

  const started = await Location.hasStartedLocationUpdatesAsync(TASK);
  if (started) {
    await Location.stopLocationUpdatesAsync(TASK);
  }

  const user = auth.currentUser;
  if (user) {
    const statusRef = doc(db, "liveStatus", user.uid);
    await setDoc(
      statusRef,
      {
        isSharing: false,
        lastActiveAt: serverTimestamp(),
        lastActiveAtClientMs: Date.now(),
      },
      { merge: true }
    );
  }
}
