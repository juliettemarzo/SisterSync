import React, { useEffect, useState, useRef } from "react";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import SisterSync from "./SisterSync.png";

import { universities } from "./data/schools";
import { sororities } from "./data/sororities";

export default function EditProfile() {
  const auth = getAuth();
  const user = auth.currentUser;
  const db = getFirestore();
  const navigate = useNavigate();

  const [school, setSchool] = useState("");
  const [schoolSearch, setSchoolSearch] = useState("");
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);

  const [sorority, setSorority] = useState("");
  const [sororitySearch, setSororitySearch] = useState("");
  const [showSororityDropdown, setShowSororityDropdown] = useState(false);

  const [memberClass, setMemberClass] = useState("");
  const [showClassDropdown, setShowClassDropdown] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const schoolRef = useRef(null);
  const sororityRef = useRef(null);
  const classRef = useRef(null);

  // Fetch existing user data
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();
        setSchool(data.school || "");
        setSchoolSearch(data.school || "");
        setSorority(data.sorority || "");
        setSororitySearch(data.sorority || "");
        setMemberClass(data.memberClass || "");
      }

      setLoading(false);
    };

    fetchData();
  }, [user, db]);

  // Handle click outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (schoolRef.current && !schoolRef.current.contains(event.target)) {
        setShowSchoolDropdown(false);
      }
      if (sororityRef.current && !sororityRef.current.contains(event.target)) {
        setShowSororityDropdown(false);
      }
      if (classRef.current && !classRef.current.contains(event.target)) {
        setShowClassDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);

    try {
      const ref = doc(db, "users", user.uid);
      await updateDoc(ref, { school, sorority, memberClass });
      navigate("/role");
    } catch (error) {
      console.error("Error updating profile:", error);
    }

    setSaving(false);
  };

  if (loading) return <p style={{ textAlign: "center" }}>Loading...</p>;

  // Filter lists
  const filteredSchools = universities.filter((s) =>
    s.toLowerCase().includes(schoolSearch.toLowerCase())
  );
  const filteredSororities = sororities.filter((s) =>
    s.toLowerCase().includes(sororitySearch.toLowerCase())
  );

  // Member Class options
  const currentYear = new Date().getFullYear();
  const memberClasses = [];
  for (let year = 2022; year <= currentYear; year++) {
    memberClasses.push(year.toString());
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <img src={SisterSync} alt="logo" style={styles.logo} />
        <h1 style={styles.title}>Edit Profile</h1>

        {/* School Dropdown */}
        <div style={styles.field} ref={schoolRef}>
          <label style={styles.label}>School</label>
          <input
            type="text"
            placeholder="Search your University"
            value={schoolSearch}
            onChange={(e) => {
              setSchoolSearch(e.target.value);
              setShowSchoolDropdown(true);
            }}
            onFocus={() => setShowSchoolDropdown(true)}
            style={styles.input}
          />
          {showSchoolDropdown && (
            <div style={styles.dropdown}>
              {filteredSchools.length === 0 ? (
                <div style={styles.dropdownItem}>No matches</div>
              ) : (
                filteredSchools.map((s, i) => (
                  <div
                    key={i}
                    style={styles.dropdownItem}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "#f0f0f0")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "white")
                    }
                    onClick={() => {
                      setSchool(s);
                      setSchoolSearch(s);
                      setShowSchoolDropdown(false);
                    }}
                  >
                    {s}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Sorority Dropdown */}
        <div style={styles.field} ref={sororityRef}>
          <label style={styles.label}>Sorority</label>
          <input
            type="text"
            placeholder="Search your Sorority"
            value={sororitySearch}
            onChange={(e) => {
              setSororitySearch(e.target.value);
              setShowSororityDropdown(true);
            }}
            onFocus={() => setShowSororityDropdown(true)}
            style={styles.input}
          />
          {showSororityDropdown && (
            <div style={styles.dropdown}>
              {filteredSororities.length === 0 ? (
                <div style={styles.dropdownItem}>No matches</div>
              ) : (
                filteredSororities.map((s, i) => (
                  <div
                    key={i}
                    style={styles.dropdownItem}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "#f0f0f0")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "white")
                    }
                    onClick={() => {
                      setSorority(s);
                      setSororitySearch(s);
                      setShowSororityDropdown(false);
                    }}
                  >
                    {s}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Member Class Dropdown */}
        <div style={styles.field} ref={classRef}>
          <label style={styles.label}>Member Class</label>
          <input
            type="text"
            placeholder="Select Member Class"
            value={memberClass}
            onChange={(e) => setMemberClass(e.target.value)}
            onFocus={() => setShowClassDropdown(true)}
            style={styles.input}
          />
          {showClassDropdown && (
            <div style={styles.dropdown}>
              {memberClasses.map((year) => (
                <div
                  key={year}
                  style={styles.dropdownItem}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#f0f0f0")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "white")
                  }
                  onClick={() => {
                    setMemberClass(year);
                    setShowClassDropdown(false);
                  }}
                >
                  {year}
                </div>
              ))}
            </div>
          )}
        </div>

        <button style={styles.button} onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </button>

        <p style={styles.backLink} onClick={() => navigate("/role")}>
          Cancel
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    fontFamily: "Georgia, serif",
    backgroundColor: "#ffffff",
    minHeight: "100vh",
    paddingTop: "30px",
  },
  container: {
    backgroundColor: "#ffe9ec",
    maxWidth: "450px",
    margin: "30px auto",
    padding: "40px",
    borderRadius: "12px",
    textAlign: "center",
    boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
  },
  logo: { width: "150px", marginBottom: "20px" },
  title: { fontSize: "26px", fontWeight: "bold", marginBottom: "25px" },
  field: { marginBottom: "20px", textAlign: "left", position: "relative" },
  label: { fontSize: "16px", marginBottom: "8px", display: "block" },
  input: {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "16px",
    boxSizing: "border-box",
  },
  dropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    maxHeight: "180px",
    overflowY: "auto",
    border: "1px solid #ccc",
    borderRadius: "8px",
    backgroundColor: "white",
    zIndex: 10,
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  dropdownItem: {
    padding: "10px",
    cursor: "pointer",
    borderBottom: "1px solid #eee",
    transition: "background 0.2s",
  },
  button: {
    backgroundColor: "black",
    color: "white",
    padding: "12px 0",
    width: "100%",
    borderRadius: "50px",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    marginTop: "10px",
  },
  backLink: {
    marginTop: "15px",
    textDecoration: "underline",
    cursor: "pointer",
    color: "#333",
  },
};
