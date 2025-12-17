import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import {
  doc,
  getDoc,
  updateDoc,
  getDocs,
  collection,
  query,
  where,
} from "firebase/firestore";
import { db } from "./firebase";

function Results() {
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;

  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedList, setEditedList] = useState([]);
  const [availableNames, setAvailableNames] = useState([]);
  const [votingOpen, setVotingOpen] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // load current user's doc
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          setSubmission(null);
          setLoading(false);
          return;
        }

        const userData = userSnap.data();
        setSubmission(userData);
        setEditedList(userData.nameList || []);

        // Fetch all users in same sorority & school (safer than relying on exact role string)
        const { sorority, school, role } = userData;
        if (!sorority || !school) {
          setAvailableNames([]);
        } else {
          // query users by sorority & school only
          const usersQ = query(
            collection(db, "users"),
            where("sorority", "==", sorority),
            where("school", "==", school)
          );

          const usersSnap = await getDocs(usersQ);
          const allUsers = usersSnap.docs.map(d => d.data()).filter(Boolean);

          // filter by opposite role, case-insensitive
          const normalizedRole = (role || "").toString().trim().toLowerCase();
          let targetRole = "";
          if (normalizedRole === "big") targetRole = "little";
          else if (normalizedRole === "little") targetRole = "big";
          else {
            // fallback: if role not recognized, collect both roles
            targetRole = null;
          }

          let names = [];
          if (targetRole) {
            names = allUsers
              .filter(u => (u.role || "").toString().trim().toLowerCase() === targetRole)
              .map(u => u.name)
              .filter(Boolean);
          } else {
            // fallback to include both big and little names
            names = allUsers.map(u => u.name).filter(Boolean);
          }

          // sort and dedupe
          const uniq = Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
          setAvailableNames(uniq);

          console.log("Results.js: availableNames loaded", uniq.length, uniq);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  useEffect(() => {
    const loadVotingStatus = async () => {
      if (!submission?.sorority || !submission?.school) return;

      const statusId = `${submission.sorority}_${submission.school}_votingStatus`;
      const votingRef = doc(db, "settings", statusId);

      try {
        const snap = await getDoc(votingRef);
        if (snap.exists()) {
          setVotingOpen(!!snap.data().votingOpen);
        } else {
          setVotingOpen(true); // default
        }
      } catch (err) {
        console.error("Error loading voting status:", err);
      }
    };

    loadVotingStatus();
  }, [submission]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const handleEditToggle = () => {
    if (!isEditing) {
      const currentList = submission?.nameList || [];
      const filledList = [...currentList];
      while (filledList.length < 10) filledList.push("");
      setEditedList(filledList);
      setIsEditing(true);
    } else {
      setIsEditing(false);
    }
  };

  const handleChange = (index, value) => {
    setEditedList((prev) => {
      const newList = [...prev];
      const currentValue = newList[index];

      if (value === currentValue) return prev;

      if (value === "") {
        newList[index] = "";
        return newList;
      }

      const otherIndex = newList.findIndex((v, i) => i !== index && v === value);
      if (otherIndex !== -1) {
        newList[otherIndex] = currentValue;
      }

      newList[index] = value;
      return newList;
    });
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      const cleanedList = editedList.filter((name) => name && name.trim() !== "");
      const docRef = doc(db, "users", user.uid);
      await updateDoc(docRef, { nameList: cleanedList });
      setSubmission({ ...submission, nameList: cleanedList });
      setIsEditing(false);
    } catch (err) {
      console.error("Error saving updated list:", err);
    }
  };

  if (loading) {
    return <h2>Loading your submission...</h2>;
  }

  if (!submission || !submission.nameList) {
    return (
      <div style={styles.container}>
        <h1>No rankings found ❌</h1>
        <button style={styles.button} onClick={() => navigate("/form")}>
          Back to Form
        </button>
        <button style={styles.logoutButton} onClick={handleLogout}>
          Logout
        </button>
      </div>
    );
  }

  // build options same behavior as form: show all availableNames, but avoid duplicates across slots
  const buildOptions = (currentName) => {
    return availableNames.filter((name) => !editedList.includes(name) || name === currentName);
  };

  return (
    <div style={styles.container}>
      <h1>Thank you, {submission.name}!</h1>
      <h2>{isEditing ? "Edit Your Rankings:" : "Here's Your Rankings:"}</h2>

      <div style={styles.namesList}>
        {isEditing ? (
          editedList.map((name, i) => (
            <div key={i} style={styles.editRow}>
              <label style={{ width: 30 }}>{i + 1}.</label>
              <select
                value={name || ""}
                onChange={(e) => handleChange(i, e.target.value)}
                style={styles.smallInput}
              >
                <option value="">Select a name</option>
                {buildOptions(name).map((n, index) => (
                  <option key={index} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          ))
        ) : (
          submission.nameList.map((n, i) => (
            <div key={i} style={styles.nameItem}>
              {i + 1}. {n}
            </div>
          ))
        )}
      </div>

      <div>
        {isEditing ? (
          <>
            <button style={styles.button} onClick={handleSave}>
              Save Changes
            </button>
            <button style={styles.cancelButton} onClick={handleEditToggle}>
              Cancel
            </button>
          </>
        ) : (
          votingOpen && (
            <button style={styles.button} onClick={handleEditToggle}>
              Edit Rankings
            </button>
          )
        )}
      </div>

      <button style={styles.logoutButton} onClick={handleLogout}>
        Logout
      </button>
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
  namesList: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginTop: "20px",
  },
  nameItem: {
    margin: "5px 0",
    padding: "6px 12px",
    background: "#fcd5ea",
    borderRadius: "6px",
    width: "200px",
    textAlign: "center",
  },
  button: {
    marginTop: "30px",
    padding: "10px 20px",
    background: "black",
    color: "white",
    border: "none",
    borderRadius: "50px",
    cursor: "pointer",
  },
};

export default Results;
