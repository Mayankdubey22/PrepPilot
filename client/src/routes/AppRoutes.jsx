import { Navigate, Route, Routes } from "react-router";

import Landing from "../pages/Landing";
import SignUp from "../pages/auth/SignUp";
import SignIn from "../pages/auth/SignIn";
import Home from "../pages/dashboard/Home";
import ProtectedRoute from "./ProtectedRoute";
import StartPreparation from "../pages/preparation/StartPreparation";
import Preparation from "../pages/preparation/Preparation";
import PreparationHistory from "../pages/preparation/PreparationHistory";
import InterviewPractice from "../pages/preparation/InterviewPractice";
import MockInterview from "../pages/preparation/MockInterview";
import MockInterviewReport from "../pages/preparation/MockInterviewReport";
import Profile from "../pages/profile/Profile";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />

      <Route path="/signup" element={<SignUp />} />
      <Route path="/signin" element={<SignIn />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/home" element={<Home />} />
        <Route path="/start-prep" element={<StartPreparation />} />
        <Route path="/preparation" element={<Preparation />} />
        <Route
          path="/preparation-history"
          element={<PreparationHistory />}
        />
        <Route
          path="/preparation/:preparationId"
          element={<Preparation />}
        />
        <Route
          path="/interview-practice/:preparationId"
          element={<InterviewPractice />}
        />
        <Route
          path="/mock-interview/:preparationId"
          element={<MockInterview />}
        />
        <Route
          path="/mock-interview/:preparationId/report/:interviewId"
          element={<MockInterviewReport />}
        />
        <Route path="/profile" element={<Profile />} />


      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
