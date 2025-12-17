import React, { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { doc, getDoc, collection, getDocs, query, where, deleteDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import SisterSync from "./SisterSync.png";

function MembersList() {
  const [members, setMembers] = useState([]);
  const [bigs, setBigs] = useState([]);
  const [littles, setLittles] = useState([]);
  const [educatorData, setEducatorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          alert("You must be logged in to view members.");
          return;
        }

        // Get New Member Educator info
        const educatorRef = doc(db, "users", user.uid);
        const educatorSnap = await getDoc(educatorRef);

        if (!educatorSnap.exists()) {
          alert("Educator data not found.");
          return;
        }

        const educatorInfo = educatorSnap.data();
        setEducatorData(educatorInfo);

        // Query users with same sorority + school
        const usersRef = collection(db, "users");
        const q = query(
          usersRef,
          where("sorority", "==", educatorInfo.sorority),
          where("school", "==", educatorInfo.school)
        );

        const querySnapshot = await getDocs(q);
        const memberList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setMembers(memberList);
      } catch (error) {
        console.error("Error fetching members:", error);
        alert("Error fetching members. Check your permissions or connection.");
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  // ⭐ Sort by last name whenever members change
  useEffect(() => {
    const getLastName = (fullName) => {
      const parts = fullName.trim().split(" ");
      return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : parts[0].toLowerCase();
    };

    const sortedBigs = members
      .filter((m) => m.role === "Big")
      .sort((a, b) => getLastName(a.name).localeCompare(getLastName(b.name)));

    const sortedLittles = members
      .filter((m) => m.role === "Little")
      .sort((a, b) => getLastName(a.name).localeCompare(getLastName(b.name)));

    setBigs(sortedBigs);
    setLittles(sortedLittles);
  }, [members]);

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        await deleteDoc(doc(db, "users", id));
        setMembers((prev) => prev.filter((member) => member.id !== id));
        alert(`${name} has been deleted successfully.`);
      } catch (error) {
        console.error("Error deleting member:", error);
        alert("Failed to delete member. Please try again.");
      }
    }
  };

  const handleBack = () => {
    navigate("/newmembered");
  };

  const handleViewRankings = (memberId) => {
    navigate(`/view-rankings/${memberId}`);
  };

  if (loading) {
    return <div style={styles.loading}>Loading members...</div>;
  }

  return (
    <div style={styles.container}>
      <img src={SisterSync} alt="Sister Sync Logo" style={styles.logo} />
      <h1 style={styles.title}>Members of {educatorData?.sorority}</h1>
      <p style={styles.subtitle}>{educatorData?.school}</p>

      {/* Bigs Section */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>🌸 Bigs</h2>
        {bigs.length > 0 ? (
          <ul style={styles.list}>
            {bigs.map((member) => (
              <li key={member.id} style={styles.card}>
                <div style={styles.cardContent}>
                  <div>
                    <strong
                      style={{ cursor: "pointer", textDecoration: "underline" }}
                      onClick={() => handleViewRankings(member.id)}
                    >
                      {member.name}
                    </strong>
                    <p style={styles.info}>{member.email}</p>
                  </div>
                  <button
                    style={styles.deleteButton}
                    onClick={() => handleDelete(member.id, member.name)}
                  >
                    🗑️
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>No Bigs found.</p>
        )}
      </div>

      {/* Littles Section */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>🌼 Littles</h2>
        {littles.length > 0 ? (
          <ul style={styles.list}>
            {littles.map((member) => (
              <li key={member.id} style={styles.card}>
                <div style={styles.cardContent}>
                  <div>
                    <strong
                      style={{ cursor: "pointer", textDecoration: "underline" }}
                      onClick={() => handleViewRankings(member.id)}
                    >
                      {member.name}
                    </strong>
                    <p style={styles.info}>{member.email}</p>
                  </div>
                  <button
                    style={styles.deleteButton}
                    onClick={() => handleDelete(member.id, member.name)}
                  >
                    🗑️
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>No Littles found.</p>
        )}
      </div>

      <button style={styles.backButton} onClick={handleBack}>
        ⬅ Back to Dashboard
      </button>
    </div>
  );
}

/* -------------------- STYLES -------------------- */
const styles = {
  container: {
    fontFamily: "Georgia, serif",
    backgroundColor: "#ffe9ec",
    maxWidth: "420px",
    margin: "50px auto",
    padding: "40px",
    borderRadius: "12px",
    textAlign: "center",
    boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
  },
  logo: {
    width: "130px",
    height: "auto",
    marginBottom: "15px",
  },
  title: {
    fontWeight: "bold",
    fontSize: "20px",
    marginBottom: "5px",
  },
  subtitle: {
    marginBottom: "25px",
    fontSize: "16px",
    color: "#444",
  },
  section: {
    marginBottom: "25px",
  },
  sectionTitle: {
    backgroundColor: "white",
    padding: "10px",
    borderRadius: "8px",
    fontWeight: "bold",
    fontSize: "18px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    marginBottom: "10px",
  },
  list: {
    listStyle: "none",
    padding: 0,
    textAlign: "left",
  },
  card: {
    backgroundColor: "white",
    borderRadius: "8px",
    padding: "10px",
    marginBottom: "10px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
    transition: "transform 0.2s",
  },
  cardContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  info: {
    fontSize: "14px",
    color: "#555",
    margin: "4px 0 0 0",
  },
  deleteButton: {
    backgroundColor: "transparent",
    border: "none",
    fontSize: "18px",
    cursor: "pointer",
  },
  backButton: {
    backgroundColor: "black",
    color: "white",
    padding: "12px 20px",
    borderRadius: "50px",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    marginTop: "20px",
  },
  loading: {
    textAlign: "center",
    fontFamily: "Georgia, serif",
    marginTop: "100px",
    fontSize: "18px",
  },
};

export default MembersList;
