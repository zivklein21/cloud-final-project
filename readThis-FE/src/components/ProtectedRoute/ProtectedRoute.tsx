import React from "react";
import { Navigate } from "react-router-dom";
import useAuth from "../../Utils/useAuth"; // Adjust path as needed

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  console.log("ProtectedRoute - isAuthenticated:", isAuthenticated); // Debugging

  return isAuthenticated ? <>{children}</> : <Navigate to="/signin" replace />;
};

export default ProtectedRoute;