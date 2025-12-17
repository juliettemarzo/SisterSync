const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();

exports.runMatchingAlgorithm = functions.https.onCall(async (data, context) => {
  // 🔹 Ensure only authenticated NMEs can run the function
  if (!context.auth?.token?.email) {
    throw new functions.https.HttpsError("unauthenticated", "You must be logged in.");
  }

  const nmeEmail = context.auth.token.email;

  // 🔹 Look up the NME’s user record to get their school and sorority
  const nmeDoc = await db.collection("users").where("email", "==", nmeEmail).limit(1).get();
  if (nmeDoc.empty) {
    throw new functions.https.HttpsError("not-found", "No user found for this email.");
  }

  const nmeData = nmeDoc.docs[0].data();
  const { school, sorority } = nmeData;

  if (!school || !sorority) {
    throw new functions.https.HttpsError("failed-precondition", "Your user record must include school and sorority.");
  }

  // 🔹 Load users only from the same school + sorority
  const usersSnap = await db.collection("users")
    .where("school", "==", school)
    .where("sorority", "==", sorority)
    .get();

  if (usersSnap.empty) {
    throw new functions.https.HttpsError("not-found", "No users found for your sorority.");
  }

  // 🔹 Separate Bigs and Littles
  const bigs = {};
  const littles = {};

  usersSnap.forEach(doc => {
    const d = doc.data();
    if (d.role === "Big") {
      bigs[d.name] = d.nameList || [];
    } else if (d.role === "Little") {
      littles[d.name] = d.nameList || [];
    }
  });

  // 🔹 Run the matching just for this group
  const matches = matchBigsLittles(bigs, littles);

  // 🔹 Save matches in a doc specific to this sorority/school
  const key = `${school}|${sorority}`;
  await db.collection("matches").doc(key).set({
    matches,
    school,
    sorority,
    createdBy: nmeEmail,
    createdAt: new Date()
  });

  // 🔹 Return matches only for this sorority
  return { school, sorority, matches };
});


// ---------------- Helper Functions ----------------

function makeRankMap(preferences) {
  const rankMap = {};
  for (const person in preferences) {
    rankMap[person] = {};
    preferences[person].forEach((other, i) => {
      rankMap[person][other] = i + 1;
    });
  }
  return rankMap;
}

function bestMutualChoice(person, theirPrefs, otherRanks, matchedSet) {
  const prefs = theirPrefs[person] || [];
  for (const other of prefs) {
    if (!matchedSet.has(other) && otherRanks[other]?.[person]) return other;
  }
  for (const other of prefs) {
    if (!matchedSet.has(other)) return other;
  }
  return null;
}

function matchBigsLittles(bigPrefs, littlePrefs) {
  const bigRanks = makeRankMap(bigPrefs);
  const littleRanks = makeRankMap(littlePrefs);

  const matches = {};
  const matchedBigs = new Set();
  const matchedLittles = new Set();

  const allBigs = new Set([...Object.keys(bigPrefs), ...Object.values(littlePrefs).flat()]);
  const allLittles = new Set([...Object.keys(littlePrefs), ...Object.values(bigPrefs).flat()]);

  const maxRank = Math.max(
    ...Object.values(bigPrefs).map(v => v.length),
    ...Object.values(littlePrefs).map(v => v.length),
    0
  );

  const order = [[1, 1, "exact"], [1, 2, "big"], [2, 1, "little"]];
  for (let n = 2; n <= maxRank; n++) {
    if (n + 1 <= maxRank) order.push([n, n + 1, "big"]);
  }

  for (const [rankBig, rankLittle] of order) {
    for (const big of [...allBigs].sort()) {
      if (matchedBigs.has(big)) continue;
      const bigList = bigPrefs[big] || [];
      if (bigList.length < rankBig) continue;
      const little = bigList[rankBig - 1];
      if (matchedLittles.has(little)) continue;
      const littleRank = littleRanks[little]?.[big];
      if (littleRank === rankLittle) {
        matches[big] = [little];
        matchedBigs.add(big);
        matchedLittles.add(little);
      }
    }
  }

  for (const big of [...allBigs].filter(b => !matchedBigs.has(b))) {
    const choice = bestMutualChoice(big, bigPrefs, littleRanks, matchedLittles);
    if (choice) {
      matches[big] = [choice];
      matchedBigs.add(big);
      matchedLittles.add(choice);
    }
  }

  for (const little of [...allLittles].filter(l => !matchedLittles.has(l))) {
    const choice = bestMutualChoice(little, littlePrefs, bigRanks, matchedBigs);
    if (choice) {
      matches[choice] = (matches[choice] || []).concat(little);
      matchedBigs.add(choice);
      matchedLittles.add(little);
    }
  }

  const remainingBigs = [...allBigs].filter(b => !matchedBigs.has(b));
  const remainingLittles = [...allLittles].filter(l => !matchedLittles.has(l));
  for (let i = 0; i < Math.min(remainingBigs.length, remainingLittles.length); i++) {
    const big = remainingBigs[i];
    const little = remainingLittles[i];
    matches[big] = (matches[big] || []).concat(little);
  }

  return matches;
}
