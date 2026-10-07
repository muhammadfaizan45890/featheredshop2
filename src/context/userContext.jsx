import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import axios from "axios";
import API from "@/utils/api";
import { FiFeather } from "react-icons/fi"; // 👈 added for the feather icon

export const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem("accessToken");
    setUser(null);
  }, []);

  const loadUser = useCallback(async () => {
    try {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        setLoading(false);
        return;
      }

      const res = await axios.get(`${API}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data?.success) {
        setUser(res.data.user);
      } else {
        logout();
      }
    } catch (error) {
      console.error("User restore failed:", error);
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // ─── Custom loader: feather + spinning ring ──────────
  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900 z-50">
        <div className="relative flex items-center justify-center">
          {/* Spinning ring */}
          <div className="w-16 h-16 rounded-full border-4 border-gray-200 dark:border-gray-700 border-t-gray-900 animate-spin" />
          {/* Feather in the centre */}
          <FiFeather
            className="absolute text-gray-900 w-8 h-8"
            style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
          />
        </div>
      </div>
    );
  }

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        logout,
        loading,
        loadUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const getData = () => useContext(UserContext);