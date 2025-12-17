import React, { useState } from "react";
import {doc, setDoc} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import SisterSync from "./SisterSync.png";
import { auth , db } from "./firebase"; //new
import { getAuth, sendPasswordResetEmail } from "firebase/auth"; //new
import ResetPassword from "./resetPassword"; //new
import email from "./resetPassword"; //new



const user = auth.currentUser;

function sendPasswordReset(email) {
  if(user){
  sendPasswordResetEmail(auth, email)
    .then(() => {
      // Password reset email sent successfully
      console.log("Password reset email sent to:", user.email);
      alert("A password reset email has been sent to your email address.");
      return (
      <div style={styles.container}>
      <h1>🎉 Thank you, a verification link should be sent to that email address!</h1>
    </div>
  );
    })
    .catch((error) => {
      // An error occurred while sending the email
      const errorCode = error.code;
      const errorMessage = error.message;
      console.error("Error sending password reset email:", errorCode, errorMessage);
      alert("Error sending password reset email. Please try again.");
    });
    //sendPasswordReset(UserActivation.email);
  }
  else {
  console.log("No user is currently signed in.");
  alert("No user is currently signed in");
}

 
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

export default sendPasswordReset;