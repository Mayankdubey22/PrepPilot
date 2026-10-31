import { useEffect, useState } from "react";
import { getCurrentUser, signoutUser } from "../services/auth.service";
import { AuthContext } from "./authContext";

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("prepPilot-user");

    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      localStorage.removeItem("prepPilot-user");
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    localStorage.removeItem("prepPilot-token");
    localStorage.removeItem("token");

    getCurrentUser().then((result) => {
      if (!active) return;

      if (result.success && result.data?.user) {
        setToken(true);
        setUser(result.data.user);
        localStorage.setItem(
          "prepPilot-user",
          JSON.stringify(result.data.user)
        );
      } else {
        setToken(null);
        setUser(null);
        localStorage.removeItem("prepPilot-user");
      }
    }).finally(() => {
      if (active) setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const login = (loginData) => {
    localStorage.setItem(
      "prepPilot-user",
      JSON.stringify(loginData.user)
    );

    setToken(true);
    setUser(loginData.user);
  };

  const logout = () => {
    signoutUser();
    localStorage.removeItem("prepPilot-user");

    setToken(null);
    setUser(null);
  };

  const isAuthenticated = Boolean(token);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
