import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SisterSync from "./SisterSync.png";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

export default function RoleSelection() {
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;
  const db = getFirestore();

  const [hasRankings, setHasRankings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [school, setSchool] = useState("");
  const [sorority, setSorority] = useState("");

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;

      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();
        setSchool(data.school || "");
        setSorority(data.sorority || "");

        if (data.nameList?.length > 0) {
          setHasRankings(true);
        }
      }

      setLoading(false);
    };

    fetchUserProfile();
  }, [user, db]);

  const handleForm = () => navigate("/form");
  const handleResults = () => navigate("/results");

  // ⭐ ADD THIS
  const handleLogout = async () => {
    await auth.signOut();
    navigate("/"); // redirect to landing or login page
  };

  if (loading) {
    return <p style={{ textAlign: "center" }}>Loading...</p>;
  }

  return (
    <div style={styles.page}>
      {/* ⭐ Top-right Edit + Logout */}
      <div style={styles.editProfileContainer}>
        <p style={styles.editQuestion}>Something not look right?</p>

        <span
          style={styles.editLink}
          onClick={() => navigate("/edit-profile")}
        >
          Edit Profile
        </span>

        <span
          style={{ ...styles.editLink, marginLeft: "10px", color: "red" }}
          onClick={handleLogout}
        >
          Log Out
        </span>
      </div>

      <div style={styles.container}>
        <img src={SisterSync} alt="logo" style={styles.logo} />

        <h1 style={styles.title}>
          Welcome, {user?.displayName || "Sister"}!
        </h1>

        {school && <p style={styles.subtitle}>{school}</p>}
        {sorority && <p style={styles.subtitle}>{sorority}</p>}

        <p style={styles.text}>Let's Get Started!</p>

        <div style={styles.buttonsContainer}>
          {!hasRankings && (
            <button style={styles.button} onClick={handleForm}>
              Enter My Rankings
            </button>
          )}

          <button style={styles.button} onClick={handleResults}>
            View My Rankings
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    position: "relative",
    fontFamily: "Georgia, serif",
    backgroundColor: "#ffe9ec",
    minHeight: "100vh",
    paddingTop: "20px",
  },

  editProfileContainer: {
    position: "absolute",
    top: "15px",
    right: "20px",
    textAlign: "right",
    lineHeight: "1.2",
  },

  editQuestion: {
    margin: 0,
    fontSize: "13px",
    color: "#444",
  },

  editLink: {
    cursor: "pointer",
    fontSize: "14px",
    color: "#444",
    textDecoration: "underline",
  },

  container: {
    backgroundColor: "#fff",
    maxWidth: "450px",
    margin: "50px auto",
    padding: "40px",
    borderRadius: "12px",
    textAlign: "center",
    boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
  },

  logo: {
    width: "150px",
    marginBottom: "20px",
  },

  title: {
    fontWeight: "bold",
    fontSize: "28px",
    marginBottom: "5px",
  },

  subtitle: {
    margin: "0",
    fontSize: "16px",
    color: "#555",
  },

  text: {
    fontSize: "16px",
    marginTop: "20px",
    marginBottom: "30px",
  },

  buttonsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
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
};
