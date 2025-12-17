import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs,
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import app from "./firebase";
import { runMatchingAlgorithmFrontend } from "./matchingAlgorithm";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const db = getFirestore(app);
const auth = getAuth(app);

function PairingsPage() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [matches, setMatches] = useState(null);
  const [editableMatches, setEditableMatches] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);

  // Load user + match data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate("/");
        return;
      }

      try {
        const email = currentUser.email;
        const userQuery = query(
          collection(db, "users"),
          where("email", "==", email)
        );
        const userSnap = await getDocs(userQuery);

        if (!userSnap.empty) {
          const data = userSnap.docs[0].data();
          const info = {
            uid: userSnap.docs[0].id,
            name: data.name,
            sorority: data.sorority,
            school: data.school,
          };
          setUserData(info);

          const key = `${info.school}|${info.sorority}`;
          const matchRef = doc(db, "matches", key);
          const matchSnap = await getDoc(matchRef);

          if (matchSnap.exists()) {
            setMatches(matchSnap.data().matches || {});
          } else {
            setMatches({});
          }
        }
      } catch (err) {
        setError("Failed to load pairing data.");
      }
    });

    return () => unsubscribe();
  }, []);

  // Run algorithm
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
    const handleEditToggle = () => {
        if (editing) {
            // Cancel editing: discard changes
            setEditableMatches(null);
        } else {
            // Start editing: copy current matches
            setEditableMatches(JSON.parse(JSON.stringify(matches)));
        }
        setEditing(!editing);
    };

    // Handle drag and drop
const onDragEnd = (result) => {
    if (!editing) return; 
    const { source, destination } = result;
    if (!destination) return;

    setEditableMatches((prev) => {
        const newMatches = { ...prev };
        const sourceList = [...newMatches[source.droppableId]];

        // Moving within the same list
        if (source.droppableId === destination.droppableId) {
            const [moved] = sourceList.splice(source.index, 1);
            sourceList.splice(destination.index, 0, moved);
            newMatches[source.droppableId] = sourceList;
        } else {
            // Moving to a different list
            const [moved] = sourceList.splice(source.index, 1);
            const destList = [...(newMatches[destination.droppableId] || [])];
            destList.splice(destination.index, 0, moved);
            newMatches[source.droppableId] = sourceList;
            newMatches[destination.droppableId] = destList;
        }

        return newMatches;
    });
};


    const handleSavePairings = async () => {
        if (!userData || !editableMatches) return;
        try {
            const key = `${userData.school}|${userData.sorority}`;
            await setDoc(
            doc(db, "matches", key),
            {
                matches: editableMatches,
                school: userData.school,
                sorority: userData.sorority,
                updatedAt: new Date(),
            },
            { merge: true }
            );
            setMatches(editableMatches); // update the main state
            setEditing(false);
            setEditableMatches(null);
        } catch (err) {
            console.error(err);
            setError("Failed to save pairings.");
        }
    };

    const displayedMatches = editing ? editableMatches : matches;

  return (
    <div style={styles.container}>
        <button style={styles.backButton} onClick={() => navigate(-1)}>
          ⬅ Back
        </button>
      <h1 style={styles.title}>Manage Pairings 👯‍♀️</h1>
      {error && <p style={styles.error}>{error}</p>}

      <div style={styles.buttonGroup}>
        <button onClick={handleRunAlgorithm} style={styles.button}>
          {loading ? "Running..." : "Run Matching Algorithm"}
        </button>
        <button onClick={handleEditToggle} style={styles.button}>
          {editing ? "Cancel Editing" : "Edit Pairings"}
        </button>
        {editing && (
          <button onClick={handleSavePairings} style={styles.button}>
            Save Pairings
          </button>
        )}
      </div>

      {displayedMatches && (
        <div style={{ marginTop: "30px" }}>
          <DragDropContext onDragEnd={onDragEnd}>
            {Object.entries(displayedMatches).map(([big, littles]) => (
              <Droppable key={big} droppableId={big}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={styles.card}
                  >
                    <div style={styles.bigName}>{big}</div>
                    {littles.map((little, index) => (
                      <Draggable
                        key={little}
                        draggableId={little}
                        index={index}
                        isDragDisabled = {!editing}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              ...styles.item,
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
        </div>
      )}
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
  title: {
    fontWeight: "bold",
    fontSize: "24px",
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
  backButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 16,
    marginBottom: 15,
    textDecoration: "underline",
  },
  card: {
    backgroundColor: "white",
    padding: "15px",
    borderRadius: "12px",
    boxShadow: "0 3px 10px rgba(0,0,0,0.15)",
    marginBottom: "15px",
    textAlign: "left",
    //minHeight: "80px",
  },
  bigName: {
    fontSize: "16px",
    fontWeight: "bold",
    marginBottom: "10px",
  },
  item: {
    backgroundColor: "#f7d9df",
    padding: "8px",
    margin: "6px 0",
    borderRadius: "8px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
    fontSize: "14px",
  },
  error: {
    color: "red",
    marginBottom: "15px",
  },
};


export default PairingsPage;