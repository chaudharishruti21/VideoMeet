import "./App.css";
import { Route, Routes, BrowserRouter as Router } from "react-router-dom";
import { useState } from "react";
import LandingPage from "./pages/landing.jsx";
import Authentication from "./pages/authentication.jsx";
import HomeComponent from "./pages/home.jsx";
import History from "./pages/history.jsx";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import VideoMeetComponent from "./pages/VideoMeet.jsx";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />}></Route>
            <Route path="/auth" element={<Authentication />}></Route>
            <Route path="/home" element={<HomeComponent />}></Route>
            <Route path="/history" element={<History />}></Route>
            <Route path="/:url" element={<VideoMeetComponent />}></Route>
          </Routes>
        </AuthProvider>
      </Router>
    </>
  );
}

export default App;
