import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SisterSync from "./SisterSync.png";
import { getAuth, signOut } from "firebase/auth";
import { doc, setDoc, getDoc, getDocs, collection, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";

function FormPage() {
  const auth = getAuth();
  const user = auth.currentUser;
  const navigate = useNavigate();

  const [nameList, setNameList] = useState(Array(10).fill(""));
  const [userData, setUserData] = useState(null); 
  const [role, setRole] = useState(""); // comes from Firestore profile
  const [memberClass, setMemberClass] = useState("")
  const [loading, setLoading] = useState(true);
  const [availableNames, setAvailableNames] = useState([]);
  const [votingOpen, setVotingOpen] = useState(true);

const determineRoleFromYear = (memberClassYear) => {
  const currentYear = new Date().getFullYear();
  const year = parseInt(memberClassYear, 10); // convert string to number
  if (!year) return "Unknown";
  if (year === currentYear) return "Little";
  if (year === currentYear - 1) return "Big";
  return "Other"; // fallback for older years
};

useEffect(() => {
  if (!userData?.sorority || !userData?.school) return;

  const statusId = `${userData.sorority}_${userData.school}_votingStatus`;
  const votingRef = doc(db, "settings", statusId);

  console.log("Listening to votingRef:", statusId);

  const unsubscribe = onSnapshot(votingRef, (snapshot) => {
    if (snapshot.exists()) {
      const open = snapshot.data().votingOpen;
      console.log("Voting status updated:", open);
      setVotingOpen(open);
    } else {
      console.log("Voting status doc not found, defaulting open");
      setVotingOpen(true);
    }
  });

  return unsubscribe;
}, [userData]);

// Function for NME to toggle voting
const toggleVoting = async () => {
  if (role !== "New Member Educator" || !userData?.sorority || !userData?.school) return;

  try {
    const statusId = `${userData.sorority}_${userData.school}_votingStatus`;
    const votingRef = doc(db, "settings", statusId);
    await setDoc(votingRef, { votingOpen: !votingOpen }, { merge: true });
    alert(`Voting is now ${!votingOpen ? "OPEN" : "CLOSED"}.`);
  } catch (err) {
    console.error("Error toggling voting:", err);
  }
};


  // Fetch user profile data (role stored in users/{uid})
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      try {
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);

          const savedClass = data.memberClass || new Date().getFullYear();
          const newRole = determineRoleFromYear(savedClass);

          setMemberClass(savedClass);
          setRole(newRole);

          // Save computed role if not already there
          if (data.role !== newRole) {
            await setDoc(
              userRef,
              { role: newRole, memberClass: savedClass },
              { merge: true }
            );
          }
        } else {
          // If no profile exists, create one with current year as class
          const thisYear = new Date().getFullYear();
          const newRole = determineRoleFromYear(thisYear);
          await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            name: user.displayName,
            sorority: "",      
            school: "",
            memberClass: thisYear,
            role: newRole,
            timestamp: new Date(),
          });
          await setDoc(userRef, newUserData);
          setUserData(newUserData); 
          setMemberClass(thisYear);
          setRole(newRole);
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  useEffect(() => {
  const fetchAvailableNames = async () => {
    if (!user || !role) return;

    try {
      // get current user info first
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) return;

      const { sorority, school } = userDoc.data();

      // get all users
      const usersSnapshot = await getDocs(collection(db, "users"));
      const allUsers = usersSnapshot.docs.map(doc => doc.data());

      // determine which role to show (opposite role)
      const targetRole = role === "Big" ? "Little" : "Big";

      // filter users by sorority, school, and opposite role
      const filtered = allUsers.filter(
        u =>
          u.sorority === sorority &&
          u.school === school &&
          u.role === targetRole
      );

      // sort alphabetically for nicer dropdowns
      const names = filtered
        .map(u => u.name)
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));

      setAvailableNames(names);
    } catch (err) {
      console.error("Error fetching names:", err);
    }
  };

  fetchAvailableNames();
}, [user, role]);


  const handleListChange = (index, value) => {
    const newList = [...nameList];
    newList[index] = value;
    setNameList(newList);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      alert("You must be logged in to submit.");
      return;
    }

    if (!votingOpen && role !== "New Member Educator") {
      alert("Voting is currently paused. You cannot submit your list right now.");
      return;
    }

    const filledNames = nameList.filter((n) => n.trim() !== "");
    if (filledNames.length === 0) {
      alert("You must enter at least one name.");
      return;
    }

    const data = {
      uid: user.uid,
      email: user.email,
      name: user.displayName, // from Firebase Auth
      role,                   // from Firestore profile
      nameList: filledNames,
      timestamp: new Date(),
    };

    try {
      // Save/overwrite user’s submission at users/{uid}
      await setDoc(doc(db, "users", user.uid), data, { merge: true });
      navigate("/results");
    } catch (error) {
      console.error("Error saving submission: ", error);
      alert("❌ There was an error saving your submission.");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  if (loading) return <h2>Loading...</h2>;

  return (
    <div style={styles.container}>
      <img src={SisterSync} alt="Sister Sync Logo" style={styles.SisterSync} />
      <h1 style={styles.title}>WELCOME TO SISTERSYNC</h1>
      <h2>Hi {user?.displayName}! You are logged in as a {role}.</h2>

    
      {!votingOpen ? (
        <p style={{ color: "red", fontWeight: "bold" }}>
          Voting is currently closed. Please check back later.
        </p>
      ) : (
        <>

      <button onClick={handleLogout} style={styles.submitButton}>
        Logout
      </button>
  
      <form onSubmit={handleSubmit} style={styles.form}>
        {/* List of Names */}
        <div style={styles.listBox}>
          <p>ENTER YOUR LIST OF NAMES:</p>
          {nameList.map((n, i) => (
            <div key={i}>
              {i + 1}.{" "}
              <select
                value={n}
                onChange={(e) => handleListChange(i, e.target.value)}
                style={styles.smallInput}
              >
                <option value="">Select a name</option>
                {availableNames
                  .filter((name) => !nameList.includes(name) || name === n)
                  .map((name, index) => (
                  <option key={index} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {/* Submit */}
        <button type="submit" style={styles.submitButton}>
          SUBMIT
        </button>
      </form>
      </>
      )}
    </div>
  );
}

const styles = {
  container: {
    fontFamily: "Georgia, serif",
    backgroundColor: "#ffe9ec",
    padding: "40px",
    maxWidth: "700px",
    margin: "30px auto",
    borderRadius: "12px",
    textAlign: "center",
  },
  title: { fontWeight: "bold", marginBottom: "10px" },
  form: { marginTop: "20px" },
  input: {
    width: "70%",
    padding: "8px",
    margin: "10px 0",
    borderRadius: "6px",
    border: "1px solid #ccc",
  },
  listBox: {
    backgroundColor: "#fcd5ea",
    padding: "15px",
    borderRadius: "8px",
    textAlign: "center",
    margin: "20px auto",
    width: "80%",
  },
  smallInput: {
    margin: "5px 0",
    padding: "4px",
    width: "60%",
    borderRadius: "4px",
    border: "1px solid #ccc",
  },
  submitButton: {
    backgroundColor: "black",
    color: "white",
    padding: "10px 20px",
    border: "none",
    borderRadius: "50px",
    marginTop: "20px",
    cursor: "pointer",
  },
  SisterSync: {
    width: "195px",
    height: "auto",
    marginBottom: "20px",
  },
};

export default FormPage;
