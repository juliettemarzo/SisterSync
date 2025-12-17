import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, onAuthStateChanged } from "firebase/auth";
//import { auth , db } from "./firebase";
//import {getAuth, sendEmailVerification} from "firebase/auth";
import { auth } from "./firebase";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import {doc, setDoc} from "firebase/firestore";

function ResetPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);//new

  const goToEVL = () => {
        navigate('/emailVerificationLink'); // Specify the path to your new page
  };

    const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      alert("Please enter your email address.");
      return;
    }

    setLoading(true);
    const authInstance = getAuth();

    try {
      await sendPasswordResetEmail(authInstance, email);
      alert("✅ A password reset link has been sent to your email!");
      //navigate("/emailVerificationLink");
    } catch (error) {
      console.error("Error sending password reset email:", error);
      alert("❌ " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1>Need a new password?</h1>
      <p>Please enter your email below. We’ll send you a reset link.</p>

      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
          required
        />
        <button
          type="submit"
          style={styles.submitButton}
          disabled={loading}
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
      </form>
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

export default ResetPassword;