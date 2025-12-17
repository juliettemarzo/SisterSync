import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./Login";
import FormPage from "./FormPage";
import Results from "./Results";
import RoleSelection from "./RoleSelection";
import NewMemberEd from "./NewMemberEd";
import MembersList from "./MembersList";
import Pairings from "./Pairings";
import ResetPassword from "./resetPassword";
import EmailVerificationLink from "./emailVerificationLink";
import ViewRankings from "./ViewRankings";
import EditProfile from "./EditProfile";


function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/role" element={<RoleSelection />} />
      <Route path="/form" element={<FormPage />} />
      <Route path="/results" element={<Results />} />
      <Route path="/resetPassword" element={<ResetPassword />} />
      <Route path="/newmembered" element={<NewMemberEd />} />
      <Route path="/members" element={<MembersList />} /> 
      <Route path="/pairings" element={<Pairings />} /> 
      <Route path="/edit-profile" element={<EditProfile />} />
      <Route path="/emailVerificationLink" element = {<EmailVerificationLink />} />
      <Route path="/view-rankings/:userId" element={<ViewRankings />} />


    </Routes>
  );
}

export default App;