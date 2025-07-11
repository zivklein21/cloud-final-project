import { useState, useEffect } from "react";
import { refreshTokens, getAccessToken } from "./user_service";

const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true); // Add a loading state

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const accessToken = getAccessToken();

        if (accessToken) {
          // If an access token exists, assume the user is authenticated for now
          setIsAuthenticated(true);
        } else {
          // Try to refresh the tokens
          await refreshTokens();
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error("User is not authenticated:", err);
        setIsAuthenticated(false);
      } finally {
        setLoading(false); // Auth check is complete
      }
    };

    initializeAuth();
  }, []);

  return { isAuthenticated, loading };
};

export default useAuth;
