import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import SisterSync from "./SisterSync.png";

function ViewRankings() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setUserData(userSnap.data());
        } else {
          setUserData(null);
        }
      } catch (error) {
        console.error("Error fetching rankings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  if (loading) {
    return <p style={styles.loading}>Loading...</p>;
  }

  if (!userData) {
    return (
      <div style={styles.container}>
        <p style={styles.error}>User not found.</p>
        <button style={styles.backButton} onClick={() => navigate(-1)}>
          ⬅ Back
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <img src={SisterSync} alt="Logo" style={styles.logo} />

      <h1 style={styles.title}>
        Rankings for {userData.name || "Member"}
      </h1>

      {userData.nameList && userData.nameList.length > 0 ? (
        <ul style={styles.rankList}>
          {userData.nameList.map((name, index) => (
            <li key={index} style={styles.rankItem}>
              <strong>#{index + 1}</strong> — {name}
            </li>
          ))}
        </ul>
      ) : (
        <p style={styles.noRankings}>This member has not entered rankings.</p>
      )}

      <button style={styles.backButton} onClick={() => navigate(-1)}>
        ⬅ Back
      </button>
    </div>
  );
}

/* ---------------- STYLES ---------------- */
const styles = {
  container: {
    maxWidth: "450px",
    margin: "40px auto",
    textAlign: "center",
    background: "#ffe9ec",
    padding: "30px",
    borderRadius: "15px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
  },
  logo: {
    width: "140px",
    marginBottom: "15px",
  },
  title: {
    fontSize: "26px",
    fontWeight: "bold",
    marginBottom: "25px",
  },
  rankList: {
    listStyle: "none",
    padding: 0,
    textAlign: "left",
    margin: "0 auto 20px",
    width: "80%",
  },
  rankItem: {
    background: "white",
    padding: "10px",
    borderRadius: "8px",
    marginBottom: "10px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
  },
  noRankings: {
    fontSize: "16px",
    color: "gray",
    marginBottom: "25px",
  },
  error: {
    color: "red",
    marginBottom: "20px",
  },
  backButton: {
    background: "black",
    color: "white",
    border: "none",
    padding: "12px 18px",
    borderRadius: "50px",
    cursor: "pointer",
    fontSize: "16px",
  },
  loading: {
    textAlign: "center",
    marginTop: "50px",
  },
};

export default ViewRankings;
