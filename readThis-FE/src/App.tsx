import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";

import Home from "./components/HomePage/Home.tsx";
import SignIn from "./components/AuthPages/Login.tsx";
import SignUp from "./components/AuthPages/Signup.tsx";
import NewPost from "./components/NewPost/NewPost.tsx";
import Profile from "./components/ProfilePage/Profile.tsx";
import PostPage from "./components/PostPage/PostPage.tsx";
import useAuth from "./Utils/useAuth.ts";
import LoadingSpinner from "./components/LoadingSpinner.tsx";

import styles from "./components/AuthPages/Auth.module.css";

const App: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className={styles.pageContainer}>
      <Router>
        <Routes>
          <Route
            path="/"
            element={isAuthenticated ? <Home /> : <Navigate to="/signin" />}
          />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/profile" element={<Profile />} />
          <Route
            path="/newPost"
            element={isAuthenticated ? <NewPost /> : <Navigate to="/signin" />}
          />
          <Route path="/post/:id" element={<PostPage />} />{" "}
        </Routes>
      </Router>
    </div>
  );
};

export default App;
