import { getData } from "@/context/userContext";
import API from "@/utils/api";
import axios from "axios";
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthSuccess = () => {
  const { setUser } = getData();
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const params = new URLSearchParams(
          window.location.search
        );

        const accessToken = params.get("token");

        if (!accessToken) {
          navigate("/login");
          return;
        }

        localStorage.setItem(
          "accessToken",
          accessToken
        );

        const res = await axios.get(
          `${API}/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (res.data.success) {
          setUser(res.data.user);

          localStorage.setItem(
            "user",
            JSON.stringify(res.data.user)
          );

          navigate("/");
        }
      } catch (error) {
        console.error(
          "Error fetching user:",
          error
        );

        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");

        navigate("/login");
      }
    };

    handleAuth();
  }, [navigate, setUser]);

  return <h2>Logging in...</h2>;
};

export default AuthSuccess;