import React, { useState, useRef, useEffect } from "react";
import { auth, db } from "./firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import SisterSync from "./SisterSync.png";

import { universities } from "./data/schools";
import { sororities } from "./data/sororities";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const [school, setSchool] = useState("");
  const [schoolSearch, setSchoolSearch] = useState("");
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);

  const [sorority, setSorority] = useState("");
  const [sororitySearch, setSororitySearch] = useState("");
  const [showSororityDropdown, setShowSororityDropdown] = useState(false);

  const [memberClass, setMemberClass] = useState("");
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);

  const [isSignup, setIsSignup] = useState(false);

  const navigate = useNavigate();

  const schoolRef = useRef(null);
  const sororityRef = useRef(null);
  const memberRef = useRef(null);

  // Outside click detection
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (schoolRef.current && !schoolRef.current.contains(event.target)) {
        setShowSchoolDropdown(false);
      }
      if (sororityRef.current && !sororityRef.current.contains(event.target)) {
        setShowSororityDropdown(false);
      }
      if (memberRef.current && !memberRef.current.contains(event.target)) {
        setShowMemberDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const goToResetPage = () => navigate("/resetPassword");

  const determineRoleFromYear = (memberClassYear) => {
    const currentYear = new Date().getFullYear();
    const year = parseInt(memberClassYear, 10);
    if (!year) return "Unknown";
    if (year === currentYear) return "Little";
    if (year === currentYear - 1) return "Big";
    return "Alumna";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isSignup) {
        if (!name || !email || !password || !school || !sorority || !memberClass) {
          alert("Please fill in all fields");
          return;
        }

        if (!email.endsWith(".edu")) {
          alert("Please use your official university (.edu) email address.");
          return;
        }

        if (!sororities.includes(sorority)) {
          alert("Please select a valid sorority from the list.");
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const role = determineRoleFromYear(memberClass);

        await updateProfile(user, { displayName: name });
        await setDoc(doc(db, "users", user.uid), {
          name,
          email,
          school,
          sorority,
          memberClass,
          role,
          createdAt: new Date(),
        });

        navigate(role === "New Member Educator" ? "/newmembered" : "/role");
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.exists() ? userDoc.data() : null;

        navigate(userData?.role === "New Member Educator" ? "/newmembered" : "/role");
      }
    } catch (error) {
      alert(error.message);
    }
  };

  // Dropdown filtering
  const filteredSchools = universities.filter((s) =>
    s.toLowerCase().includes(schoolSearch.toLowerCase())
  );

  const filteredSororities = sororities.filter((s) =>
    s.toLowerCase().includes(sororitySearch.toLowerCase())
  );

  const currentYear = new Date().getFullYear();
  const memberClassOptions = [];
  for (let y = 2022; y <= currentYear; y++) memberClassOptions.push(y.toString());

  /*return (
    <div style={styles.container}>
      <img src={SisterSync} alt="Sister Sync Logo" style={styles.logo} />
      <h1 style={styles.title}>{isSignup ? "Sign Up" : "Login"}</h1>

      <form onSubmit={handleSubmit} style={styles.form}>
        {isSignup && (
          <>
            <input
              type="text"
              placeholder="Full Name (ex: Mary Smith)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
            />

            {/* School Dropdown }
            <div style={{ position: "relative" }} ref={schoolRef}>
              <input
                type="text"
                placeholder="Search your University"
                value={schoolSearch}
                onFocus={() => setShowSchoolDropdown(true)}
                onChange={(e) => {
                  setSchoolSearch(e.target.value);
                  setShowSchoolDropdown(true);
                }}
                style={styles.input}
              />
              {showSchoolDropdown && (
                <div style={styles.dropdown}>
                  {filteredSchools.length === 0 ? (
                    <p style={styles.dropdownItem}>No matches</p>
                  ) : (
                    filteredSchools.map((s, i) => (
                      <div
                        key={i}
                        style={styles.dropdownItem}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f0f0f0")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
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

            {/* Sorority Dropdown }
            <div style={{ position: "relative" }} ref={sororityRef}>
              <input
                type="text"
                placeholder="Search your Sorority"
                value={sororitySearch}
                onFocus={() => setShowSororityDropdown(true)}
                onChange={(e) => {
                  setSororitySearch(e.target.value);
                  setShowSororityDropdown(true);
                }}
                style={styles.input}
              />
              {showSororityDropdown && (
                <div style={styles.dropdown}>
                  {filteredSororities.length === 0 ? (
                    <p style={styles.dropdownItem}>No matches</p>
                  ) : (
                    filteredSororities.map((s, i) => (
                      <div
                        key={i}
                        style={styles.dropdownItem}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f0f0f0")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
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

            {/* Member Class Dropdown }
            <div style={{ position: "relative" }} ref={memberRef}>
              <input
                type="text"
                placeholder="Select Member Class"
                value={memberClass}
                onFocus={() => setShowMemberDropdown(true)}
                onChange={(e) => {
                  setMemberClass(e.target.value);
                  setShowMemberDropdown(true);
                }}
                style={styles.input}
              />
              {showMemberDropdown && (
                <div style={styles.dropdown}>
                  {memberClassOptions.map((year, i) => (
                    <div
                      key={i}
                      style={styles.dropdownItem}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f0f0f0")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
                      onClick={() => {
                        setMemberClass(year);
                        setShowMemberDropdown(false);
                      }}
                    >
                      {year}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />

        <button type="submit" style={styles.button}>
          {isSignup ? "Sign Up" : "Login"}
        </button>
      </form>

      <p style={styles.toggleText}>
        {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
        <span style={styles.link} onClick={() => setIsSignup(!isSignup)}>
          {isSignup ? "Login" : "Sign Up"}
        </span>
      </p>

      <button style={styles.submitButton} onClick={goToResetPage}>
        Forgot password?
      </button>
    </div>
  );
}

export default Login;
/*
const styles = {
  container: {
    fontFamily: "Georgia, serif",
    backgroundColor: "#ffe9ec",
    maxWidth: "400px",
    margin: "50px auto",
    padding: "40px",
    borderRadius: "12px",
    textAlign: "center",
    boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
  },
  logo: { width: "150px", height: "auto", marginBottom: "20px" },
  title: { fontWeight: "bold", fontSize: "24px", marginBottom: "20px" },
  form: { display: "flex", flexDirection: "column", gap: "15px" },
  input: {
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    width: "100%",
    fontSize: "16px",
    boxSizing: "border-box",
  },
  button: {
    backgroundColor: "black",
    color: "white",
    padding: "12px 0",
    borderRadius: "50px",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    marginTop: "10px",
  },
  toggleText: { marginTop: "15px", fontSize: "14px" },
  link: { color: "blue", textDecoration: "underline", cursor: "pointer" },
  submitButton: { background: "none", border: "none", color: "blue", cursor: "pointer", marginTop: "10px", fontSize: "14px", textDecoration: "underline" },
  dropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    maxHeight: "180px",
    overflowY: "auto",
    border: "1px solid #ccc",
    borderRadius: "8px",
    background: "white",
    zIndex: 10,
    fontSize: "16px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  dropdownItem: {
    padding: "10px",
    cursor: "pointer",
    borderBottom: "1px solid #eee",
    transition: "background 0.2s",
  },
}; 
const styles = {
  container: {
    fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    background: "linear-gradient(180deg, #fff5f7 0%, #ffe9ec 100%)",
    maxWidth: "420px",
    margin: "60px auto",
    padding: "44px 40px",
    borderRadius: "24px",
    textAlign: "center",
    boxShadow:
      "0 20px 40px rgba(232,140,163,0.25), 0 6px 12px rgba(0,0,0,0.08)",
  },

  logo: {
    width: "140px",
    height: "auto",
    marginBottom: "24px",
  },

  title: {
    fontWeight: "700",
    fontSize: "28px",
    marginBottom: "28px",
    color: "#2b2b2b",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },

  input: {
    padding: "14px 16px",
    borderRadius: "14px",
    border: "1.5px solid #f1c5d1",
    width: "100%",
    fontSize: "16px",
    boxSizing: "border-box",
    transition: "border 0.2s ease, box-shadow 0.2s ease",
    outline: "none",
  },

  button: {
    background: "linear-gradient(135deg, #e88ca3, #c96b85)",
    color: "white",
    padding: "14px 0",
    borderRadius: "999px",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "600",
    marginTop: "12px",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    boxShadow: "0 8px 20px rgba(201,107,133,0.35)",
  },

  toggleText: {
    marginTop: "22px",
    fontSize: "14px",
    color: "#555",
  },

  link: {
    color: "#c96b85",
    fontWeight: "600",
    textDecoration: "none",
    cursor: "pointer",
  },

  submitButton: {
    background: "none",
    border: "none",
    color: "#c96b85",
    cursor: "pointer",
    marginTop: "14px",
    fontSize: "14px",
    fontWeight: "600",
    textDecoration: "underline",
  },

  dropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    maxHeight: "180px",
    overflowY: "auto",
    border: "1px solid #f1c5d1",
    borderRadius: "14px",
    background: "white",
    zIndex: 10,
    fontSize: "16px",
    boxShadow: "0 10px 20px rgba(0,0,0,0.12)",
  },

  dropdownItem: {
    padding: "12px 14px",
    cursor: "pointer",
    borderBottom: "1px solid #f5d5dc",
    transition: "background 0.2s ease",
  },
};

*/
return (
  <div style={styles.page}>
    <div style={styles.container}>
      <div style={styles.logoWrapper}>
        <img src={SisterSync} alt="SisterSync Logo" style={styles.logo} />
        <p style={styles.tagline}>Built for sisterhood</p>
      </div>

      <h1 style={styles.title}>{isSignup ? "Sign Up" : "Welcome Back!"}</h1>

      <form onSubmit={handleSubmit} style={styles.form}>
        {isSignup && (
          <>
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
            />

            {/* School Dropdown */}
            <div style={styles.dropdownWrapper} ref={schoolRef}>
              <input
                type="text"
                placeholder="Search your University"
                value={schoolSearch}
                onFocus={() => setShowSchoolDropdown(true)}
                onChange={(e) => {
                  setSchoolSearch(e.target.value);
                  setShowSchoolDropdown(true);
                }}
                style={styles.input}
              />
              {showSchoolDropdown && (
                <div style={styles.dropdown}>
                  {filteredSchools.length === 0 ? (
                    <p style={styles.dropdownItem}>No matches</p>
                  ) : (
                    filteredSchools.map((s, i) => (
                      <div
                        key={i}
                        style={styles.dropdownItem}
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
            <div style={styles.dropdownWrapper} ref={sororityRef}>
              <input
                type="text"
                placeholder="Search your Sorority"
                value={sororitySearch}
                onFocus={() => setShowSororityDropdown(true)}
                onChange={(e) => {
                  setSororitySearch(e.target.value);
                  setShowSororityDropdown(true);
                }}
                style={styles.input}
              />
              {showSororityDropdown && (
                <div style={styles.dropdown}>
                  {filteredSororities.map((s, i) => (
                    <div
                      key={i}
                      style={styles.dropdownItem}
                      onClick={() => {
                        setSorority(s);
                        setSororitySearch(s);
                        setShowSororityDropdown(false);
                      }}
                    >
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Member Class Dropdown */}
            <div style={styles.dropdownWrapper} ref={memberRef}>
              <input
                type="text"
                placeholder="Select Member Class"
                value={memberClass}
                onFocus={() => setShowMemberDropdown(true)}
                onChange={(e) => {
                  setMemberClass(e.target.value);
                  setShowMemberDropdown(true);
                }}
                style={styles.input}
              />
              {showMemberDropdown && (
                <div style={styles.dropdown}>
                  {memberClassOptions.map((year, i) => (
                    <div
                      key={i}
                      style={styles.dropdownItem}
                      onClick={() => {
                        setMemberClass(year);
                        setShowMemberDropdown(false);
                      }}
                    >
                      {year}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />

        <button type="submit" style={styles.button}>
          {isSignup ? "Sign Up" : "Login"}
        </button>
      </form>

      <p style={styles.toggleText}>
        {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
        <span style={styles.link} onClick={() => setIsSignup(!isSignup)}>
          {isSignup ? "Login" : "Sign Up"}
        </span>
      </p>

      <button style={styles.resetLink} onClick={goToResetPage}>
        Forgot Password?
      </button>
    </div>
  </div>
);
}
export default Login; 

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f8cfee",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Inter', sans-serif",
  },

  container: {
    backgroundColor: "#f9ddf1",
    width: "380px",
    padding: "40px 36px",
    borderRadius: "20px",
    textAlign: "center",
    boxShadow: "0 20px 40px rgba(0,0,0,0.12)",
  },

  logoWrapper: {
    marginBottom: "16px",
  },

  logo: {
    width: "160px",
    marginBottom: "6px",
  },

  tagline: {
    fontSize: "13px",
    color: "#7a4b6d",
    marginBottom: "20px",
  },

  title: {
    fontSize: "26px",
    fontWeight: "600",
    color: "#3a0f31",
    marginBottom: "24px",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  input: {
    padding: "12px 14px",
    borderRadius: "10px",
    border: "none",
    backgroundColor: "#fff5fb",
    fontSize: "14px",
    outline: "none",
  },

  button: {
    marginTop: "10px",
    padding: "12px",
    borderRadius: "999px",
    border: "none",
    backgroundColor: "#5b144d",
    color: "white",
    fontSize: "15px",
    fontWeight: "500",
    cursor: "pointer",
  },

  toggleText: {
    marginTop: "18px",
    fontSize: "13px",
    color: "#5a3a52",
  },

  link: {
    color: "#a94a8f",
    fontWeight: "600",
    cursor: "pointer",
  },

  resetLink: {
    background: "none",
    border: "none",
    marginTop: "10px",
    fontSize: "12px",
    color: "#a94a8f",
    cursor: "pointer",
    textDecoration: "underline",
  },

  dropdownWrapper: {
    position: "relative",
  },

  dropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    maxHeight: "180px",
    overflowY: "auto",
    backgroundColor: "white",
    borderRadius: "10px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
    zIndex: 10,
  },

  dropdownItem: {
    padding: "10px 12px",
    fontSize: "14px",
    cursor: "pointer",
    borderBottom: "1px solid #f0f0f0",
  },
};
