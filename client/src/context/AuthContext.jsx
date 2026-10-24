import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() =>
    localStorage.getItem("prepPilot-token")
  );

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("prepPilot-user");

    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const login = (loginData) => {
    localStorage.setItem(
      "prepPilot-token",
      loginData.token
    );

    localStorage.setItem(
      "prepPilot-user",
      JSON.stringify(loginData.user)
    );

    setToken(loginData.token);
    setUser(loginData.user);
  };

  const logout = () => {
    localStorage.removeItem("prepPilot-token");
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

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
};