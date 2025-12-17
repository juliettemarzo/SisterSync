// src/matchingAlgorithm.js
import { getFirestore, collection, query, where, getDocs, doc, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export async function runMatchingAlgorithmFrontend() {
  const auth = getAuth();
  const db = getFirestore();

  const user = auth.currentUser;
  if (!user) throw new Error("You must be logged in.");

  const nmeEmail = user.email;

  // Get NME record to find school + sorority
  const userQuery = query(collection(db, "users"), where("email", "==", nmeEmail));
  const userSnap = await getDocs(userQuery);
  if (userSnap.empty) throw new Error("No user found.");

  const nmeData = userSnap.docs[0].data();
  const { school, sorority } = nmeData;

  if (!school || !sorority) throw new Error("Your profile must include school and sorority.");

  // Load only chapter users
  const usersQuery = query(
    collection(db, "users"),
    where("school", "==", school),
    where("sorority", "==", sorority)
  );
  const usersSnap = await getDocs(usersQuery);

  const bigs = {};
  const littles = {};

  usersSnap.forEach(doc => {
    const d = doc.data();
    if (d.role === "Big") bigs[d.name] = d.nameList || [];
    if (d.role === "Little") littles[d.name] = d.nameList || [];
  });

  const matches = matchBigsLittles(bigs, littles);

  // Save match results for the whole chapter
  const key = `${school}|${sorority}`;
  await setDoc(doc(db, "matches", key), {
    matches,
    school,
    sorority,
    createdBy: nmeEmail,
    createdAt: new Date()
  });

  return matches;
}

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

export function matchBigsLittles(bigPrefs, littlePrefs) {
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

  // Build priority order
  const order = [[1,1,'exact'], [1,2,'big'], [2,1,'little']];
  for (let n = 2; n <= maxRank; n++) {
    if (n + 1 <= maxRank) order.push([n, n + 1, 'big']);
  }

  // Step 1: priority matching
  for (const [rankBig, rankLittle, kind] of order) {
    for (const big of Array.from(allBigs).sort()) {
      if (matchedBigs.has(big)) continue;
      const bigList = bigPrefs[big] || [];
      if (bigList.length < rankBig) continue;
      const little = bigList[rankBig - 1];
      if (matchedLittles.has(little)) continue;
      const littleRank = littleRanks[little]?.[big];
      if (littleRank === rankLittle) {
        matches[big] = matches[big] || [];
        matches[big].push(little);
        matchedBigs.add(big);
        matchedLittles.add(little);
      }
    }
  }

  // Step 2: unmatched bigs
  const remainingBigs = Array.from(allBigs).filter(b => !matchedBigs.has(b));
  for (const big of remainingBigs) {
    const choice = bestMutualChoice(big, bigPrefs, littleRanks, matchedLittles);
    if (choice) {
      matches[big] = matches[big] || [];
      matches[big].push(choice);
      matchedBigs.add(big);
      matchedLittles.add(choice);
    }
  }

  // Step 3: unmatched littles
  const remainingLittles = Array.from(allLittles).filter(l => !matchedLittles.has(l));
  for (const little of remainingLittles) {
    const choice = bestMutualChoice(little, littlePrefs, bigRanks, matchedBigs);
    if (choice) {
      matches[choice] = matches[choice] || [];
      matches[choice].push(little);
      matchedBigs.add(choice);
      matchedLittles.add(little);
    }
  }

  // Step 4: deterministic fallback
  const unmatchedB = Array.from(allBigs).filter(b => !matchedBigs.has(b));
  const unmatchedL = Array.from(allLittles).filter(l => !matchedLittles.has(l));
  for (let i = 0; i < Math.min(unmatchedB.length, unmatchedL.length); i++) {
    const big = unmatchedB[i];
    const little = unmatchedL[i];
    matches[big] = matches[big] || [];
    matches[big].push(little);
    matchedBigs.add(big);
    matchedLittles.add(little);
  }

  // Step 5: handle extras (imbalances, max 2 per person)
  const numB = allBigs.size;
  const numL = allLittles.size;

  const littleLoad = (little) => Object.values(matches).filter(v => v.includes(little)).length;

  if (numL > numB) {
    const extras = Array.from(allLittles).filter(l => !matchedLittles.has(l));
    for (const little of extras) {
      let candidates = Array.from(allBigs).filter(b => (matches[b]?.length || 0) < 2);
      if (!candidates.length) break;
      let mutuals = candidates.filter(b => (bigPrefs[b] || []).includes(little));
      if (mutuals.length) candidates = mutuals;
      candidates.sort((b1,b2) => (littleRanks[little]?.[b1] || Infinity) - (littleRanks[little]?.[b2] || Infinity));
      const chosenBig = candidates[0];
      matches[chosenBig] = matches[chosenBig] || [];
      matches[chosenBig].push(little);
      matchedLittles.add(little);
    }
  } else if (numB > numL) {
    const extras = Array.from(allBigs).filter(b => !matchedBigs.has(b));
    for (const big of extras) {
      let candidates = Array.from(allLittles).filter(l => littleLoad(l) < 2);
      if (!candidates.length) break;
      let mutuals = candidates.filter(l => (littlePrefs[l] || []).includes(big));
      if (mutuals.length) candidates = mutuals;
      candidates.sort((l1,l2) => (bigRanks[big]?.[l1] || Infinity) - (bigRanks[big]?.[l2] || Infinity));
      const chosenLittle = candidates[0];
      matches[big] = matches[big] || [];
      matches[big].push(chosenLittle);
      matchedBigs.add(big);
    }
  }

  return matches;
}
