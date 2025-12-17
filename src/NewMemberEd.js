import React, {  useState , useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SisterSync from "./SisterSync.png";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
} from "firebase/firestore";
import app from "./firebase";
import { runMatchingAlgorithmFrontend } from "./matchingAlgorithm";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const db = getFirestore(app);
const auth = getAuth(app);

function NewMemberEd() {
  const navigate = useNavigate();

  // State
  const [matches, setMatches] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [editing, setEditing] = useState(false);
  const [votingOpen, setVotingOpen] = useState(true);
  const [toggling, setToggling] = useState(false);

  // Load user info and matches
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setAuthReady(true);
      if (!currentUser) {
        setUserData(null);
        setMatches(null);
        setError("Please log in to continue.");
        return;
      }

      try {
        const email = currentUser.email;
        const userQuery = query(collection(db, "users"), where("email", "==", email));
        const userSnap = await getDocs(userQuery);

        if (!userSnap.empty) {
          const data = userSnap.docs[0].data();
          const info = {
            uid: userSnap.docs[0].id,
            name: data.name || "",
            sorority: data.sorority || "",
            school: data.school || "",
          };
          setUserData(info);

          // Load matches
          if (info.school && info.sorority) {
            const key = `${info.school}|${info.sorority}`;
            const matchesRef = doc(db, "matches", key);
            const matchesSnap = await getDoc(matchesRef);
            if (matchesSnap.exists()) {
              setMatches(matchesSnap.data().matches || null);
            }
          }
        } else {
          setError("User data not found.");
        }
      } catch (err) {
        console.error(err);
        setError("Error loading account data.");
      }
    });

    return () => unsubscribe();
  }, []);

  // Listen for voting status specific to this sorority/university
  useEffect(() => {
    if (!userData?.sorority || !userData?.school) return;

    const votingDocRef = doc(db, "settings", `${userData.sorority}_${userData.school}_votingStatus`);
    const unsubscribe = onSnapshot(votingDocRef, async (snap) => {
      if (snap.exists()) {
        setVotingOpen(snap.data().votingOpen);
      } else {
        await setDoc(votingDocRef, { votingOpen: true });
        setVotingOpen(true);
      }
    });

    return () => unsubscribe();
  }, [userData]);

  // Toggle voting open/closed
  const handleToggleVoting = async () => {
    setToggling(true);
    try {
      if (!userData?.sorority || !userData?.school) {
        throw new Error("Missing sorority/university info");
      }

      const docId = `${userData.sorority}_${userData.school}_votingStatus`;
      const docRef = doc(db, "settings", docId);
      const newStatus = !votingOpen;
      await setDoc(docRef, { votingOpen: newStatus }, { merge: true });
      setVotingOpen(newStatus);

      alert(`Voting is now ${newStatus ? "OPEN ✅" : "PAUSED ⏸️"}.`);
    } catch (err) {
      console.error("Error updating voting status:", err);
      alert("Failed to toggle voting status.");
    }
    setToggling(false);
  };

  // Run matching algorithm
  async function handleRunAlgorithm() {
    setLoading(true);
    setError(null);
    try {
      const result = await runMatchingAlgorithmFrontend();
      setMatches(result || null);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to run algorithm.");
    }
    setLoading(false);
  }

  // Save edited pairings
  async function handleSavePairings() {
    if (!userData) return;
    try {
      const key = `${userData.school}|${userData.sorority}`;
      await setDoc(
        doc(db, "matches", key),
        {
          matches,
          school: userData.school,
          sorority: userData.sorority,
          updatedAt: new Date(),
        },
        { merge: true }
      );
      setEditing(false);
    } catch (err) {
      console.error(err);
      setError("Failed to save pairings.");
    }
  }

  // Handle drag and drop
  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId) return;

    setMatches((prev) => {
      const newMatches = { ...prev };
      newMatches[source.droppableId] = newMatches[source.droppableId].filter((l) => l !== draggableId);
      newMatches[destination.droppableId] = [...(newMatches[destination.droppableId] || []), draggableId];
      return newMatches;
    });
  };

  // Navigation handlers
  const handleViewMembers = () => navigate("/members");
  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  if (!authReady) {
    return <div style={styles.container}><p>Loading authentication...</p></div>;
  }

  if (!userData) {
    return (
      <div style={styles.container}>
        <p style={{ color: "red" }}>{error || "Please log in to continue."}</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <img src={SisterSync} alt="Sister Sync Logo" style={styles.logo} />

      <div style={{ marginBottom: "30px" }}>
        <h1 style={styles.title}>Welcome, {userData.name} 💫</h1>
        <h2 style={styles.subtitle}>New Member Educator</h2>
        <p style={styles.text}>
          {userData.sorority} • {userData.school}
        </p>
      </div>

      <div style={styles.card}>
        <h2 style={styles.subtitle}>Your Dashboard</h2>
        <p style={styles.text}>
          Manage members, run matching, edit pairings, and control voting.
        </p>

        <div style={styles.buttonGroup}>
          <button style={styles.button} onClick={handleViewMembers}>
            View Members
          </button>
          {/* <button style={styles.button} onClick={handleRunAlgorithm}>
            {loading ? "Running..." : "Run Algorithm"}
          </button> */}
          <button style={styles.button} onClick={() => navigate("/pairings")}>
              View & Manage Pairings
          </button>
          {editing && (
            <button style={styles.button} onClick={handleSavePairings}>
              Save Changes
            </button>
          )}
          <button
            style={{
              ...styles.button,
              backgroundColor: votingOpen ? "#d9534f" : "#28a745",
            }}
            onClick={handleToggleVoting}
            disabled={toggling}
          >
            {toggling
              ? "Updating..."
              : votingOpen
              ? "Pause Voting"
              : "Resume Voting"}
          </button>
        </div>

        <p style={{ marginTop: "15px", color: votingOpen ? "green" : "red" }}>
          Voting is currently {votingOpen ? "OPEN ✅" : "PAUSED ⏸️"}
        </p>

        {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}

        {/* {matches && (
          <div style={{ marginTop: "20px", textAlign: "left" }}>
            <h3>{editing ? "Drag Littles to Reassign" : "Match Results"}</h3>
            {editing ? (
              <DragDropContext onDragEnd={onDragEnd}>
                {Object.entries(matches).map(([big, littles]) => (
                  <Droppable key={big} droppableId={big}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        style={{
                          marginBottom: "15px",
                          padding: "10px",
                          border: "1px solid #ccc",
                          borderRadius: "8px",
                        }}
                      >
                        <strong>{big}</strong>
                        {littles.map((little, index) => (
                          <Draggable key={little} draggableId={little} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={{
                                  padding: "6px 12px",
                                  margin: "5px 0",
                                  backgroundColor: "#f0f0f0",
                                  borderRadius: "4px",
                                  ...provided.draggableProps.style,
                                }}
                              >
                                {little}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                ))}
              </DragDropContext>
            ) : (
              Object.entries(matches).map(([big, littles]) => (
                <p key={big}>
                  <strong>{big}</strong> → {Array.isArray(littles) ? littles.join(", ") : littles}
                </p>
              ))
            )}
          </div>
        )} */}
      </div>

      <button style={styles.logoutButton} onClick={handleLogout}>
        Log Out
      </button>
    </div>
  );
}


const styles = {
  container: {
    fontFamily: "Georgia, serif",
    backgroundColor: "#ffe9ec",
    maxWidth: "600px",
    margin: "60px auto",
    padding: "40px",
    borderRadius: "12px",
    textAlign: "center",
    boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
  },
  logo: {
    width: "140px",
    height: "auto",
    marginBottom: "20px",
  },
  title: {
    fontWeight: "bold",
    fontSize: "24px",
    marginBottom: "25px",
  },
  card: {
    backgroundColor: "white",
    padding: "25px",
    borderRadius: "10px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    marginBottom: "25px",
  },
  subtitle: {
    fontSize: "20px",
    fontWeight: "bold",
    marginBottom: "10px",
  },
  text: {
    fontSize: "16px",
    color: "#333",
    lineHeight: "1.5",
    marginBottom: "25px",
  },
  buttonGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  button: {
    backgroundColor: "black",
    color: "white",
    padding: "12px 0",
    borderRadius: "50px",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
  },
  logoutButton: {
    backgroundColor: "#d9534f",
    color: "white",
    padding: "10px 25px",
    border: "none",
    borderRadius: "30px",
    cursor: "pointer",
    fontSize: "15px",
    marginTop: "10px",
  },
}; 



export default NewMemberEd; 
