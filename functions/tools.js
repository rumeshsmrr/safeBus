// functions/tools.js
// These are stubs — replace with real Firestore queries or business logic.
async function getBusETAByChild(childId) {
  // TODO: look up child's route & bus current position -> compute ETA
  return { etaMinutes: 14, stopName: "Main St Gate" };
}

async function getDriverPhone(busId = "BUS_1") {
  // TODO: look up driver phone by assigned bus
  return { phone: "+94 70 123 4567", driverName: "Mr. Silva" };
}

async function markNotGoing(childId, session) {
  // TODO: write to Firestore: attendance flag for today
  return { ok: true, message: `Marked ${childId} as not attending ${session}` };
}

async function reportEmergency(childId, kind, note) {
  // TODO: create an emergency doc + send FCM to parents/driver/admin
  return {
    ok: true,
    ticketId: "EMG-" + Math.random().toString(36).slice(2, 8),
  };
}

module.exports = {
  getBusETAByChild,
  getDriverPhone,
  markNotGoing,
  reportEmergency,
};
