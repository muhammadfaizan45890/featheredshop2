import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { getData } from "@/context/userContext";
import API from "@/utils/api";

/**
 * Wraps the existing user context + logout call so the Navbar component
 * only deals with a small, stable auth surface.
 *
 * @returns {{
 *   user: object | null,
 *   isAuthenticated: boolean,
 *   userRole: string,
 *   profileRoute: string,
 *   logout: () => Promise<void>,
 * }}
 */
export default function useAuth() {
  const { user, setUser } = getData();
  const navigate = useNavigate();

  const userRole = user?.role || "user";
  const profileRoute = userRole === "admin" ? "/admin/profile" : "/profile";

  const logout = useCallback(async () => {
    const accessToken = window.localStorage.getItem("accessToken");
    try {
      const res = await axios.post(
        `${API}/user/logout`,
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (res.data.success) {
        setUser(null);
        window.localStorage.clear();
        toast.success(res.data.message || "Signed out");
        navigate("/");
      } else {
        toast.error("Logout failed");
      }
    } catch {
      toast.error("Logout failed. Please try again.");
    }
  }, [navigate, setUser]);

  return { user, isAuthenticated: Boolean(user), userRole, profileRoute, logout };
}
