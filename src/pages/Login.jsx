import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, Mail, Lock, ArrowRight, ShieldCheck, Feather } from "lucide-react";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { getData } from "@/context/userContext";
import Google from "../assets/googleLogo.png";
import API from "@/utils/api";

const Login = () => {
  const { setUser } = getData();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [touched, setTouched] = useState({});
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});

  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    },
    [errors]
  );

  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    setErrors(newErrors);
    setTouched({ email: true, password: true });
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      const res = await axios.post(`${API}/user/login`, formData, {
        headers: { "Content-Type": "application/json" },
      });

      if (res.data.success) {
        localStorage.setItem("user", JSON.stringify(res.data.user));
        localStorage.setItem("accessToken", res.data.accessToken);
        localStorage.setItem("loginTime", Date.now().toString());
        setUser(res.data.user);
        toast.success(res.data.message || "Login successful");
        navigate("/");
      }
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setIsGoogleLoading(true);
    window.open(`${API}/auth/google`, "_self");
  };

  const toggleRememberMe = () => setRememberMe((prev) => !prev);

  const handleRememberKeyDown = (e) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      toggleRememberMe();
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-white flex flex-col">
      {/* Soft radial glow behind content */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 20%, rgba(0,0,0,0.03), transparent 70%)",
        }}
      />

      <main className="relative flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12 lg:py-16">
        <div className="w-full max-w-md mx-auto">
          {/* ─── Brand mark ─────────────────────────────────── */}
          <div className="flex flex-col items-center text-center">
            <Link
              to="/"
              aria-label="FeatheredSHOP home"
              className="group inline-flex items-center gap-1.5 rounded-lg px-2 py-1 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 transition-opacity hover:opacity-80"
            >
              <Feather
                className="h-5 w-5 sm:h-6 sm:w-6 text-neutral-900 transition-transform duration-300 group-hover:-rotate-12"
                strokeWidth={2}
                aria-hidden="true"
              />
              <span className="text-lg sm:text-xl font-black tracking-tighter text-neutral-900 leading-none">
                FeatheredSHOP
                <span className="text-amber-500">.</span>
              </span>
            </Link>
          </div>

          {/* ─── Welcome headline ──────────────────────────── */}
          <div className="mt-8 sm:mt-10 text-center">
            <h1
              className="text-[2rem] sm:text-[2.5rem] leading-[1.1] font-medium tracking-[-0.03em] text-neutral-900"
              style={{ fontFamily: "'Fraunces', 'Playfair Display', Georgia, serif" }}
            >
              Welcome back.
            </h1>
            <p className="mt-3 text-[14px] sm:text-[15px] text-neutral-500 leading-relaxed max-w-sm mx-auto">
              Sign in to access your orders, wishlist, and personalized
              recommendations.
            </p>
          </div>

          {/* ─── Form ──────────────────────────────────────── */}
          <form onSubmit={handleSubmit} noValidate className="mt-8 sm:mt-10 space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-[13px] font-semibold text-neutral-900"
              >
                Email address
              </Label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-neutral-400 pointer-events-none"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <Input
                  id="email"
                  type="email"
                  name="email"
                  inputMode="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isLoading}
                  placeholder="you@example.com"
                  className={`h-12 pl-12 pr-4 rounded-full bg-neutral-50 border-transparent hover:bg-neutral-100 focus:bg-white focus:border-neutral-300 focus:ring-4 focus:ring-neutral-900/5 transition-all text-[14px] placeholder:text-neutral-400 ${
                    touched.email && errors.email
                      ? "border-red-400 focus:border-red-400 focus:ring-red-500/10 bg-red-50/50"
                      : ""
                  }`}
                  aria-invalid={!!(touched.email && errors.email)}
                  aria-describedby="email-error"
                />
              </div>
              {touched.email && errors.email && (
                <p id="email-error" role="alert" className="text-[12.5px] text-red-600 pl-4">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label
                  htmlFor="password"
                  className="text-[13px] font-semibold text-neutral-900"
                >
                  Password
                </Label>
                <Link
                  to="/forgot-password"
                  className="text-[12.5px] font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-neutral-400 pointer-events-none"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <Input
                  id="password"
                  name="password"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isLoading}
                  type={showPassword ? "text" : "password"}
                  className={`h-12 pl-12 pr-12 rounded-full bg-neutral-50 border-transparent hover:bg-neutral-100 focus:bg-white focus:border-neutral-300 focus:ring-4 focus:ring-neutral-900/5 transition-all text-[14px] placeholder:text-neutral-400 ${
                    touched.password && errors.password
                      ? "border-red-400 focus:border-red-400 focus:ring-red-500/10 bg-red-50/50"
                      : ""
                  }`}
                  aria-invalid={!!(touched.password && errors.password)}
                  aria-describedby="password-error"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  disabled={isLoading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center justify-center h-8 w-8 rounded-full text-neutral-400 hover:text-neutral-900 hover:bg-neutral-200/60 transition-colors outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <EyeOff className="h-[18px] w-[18px]" strokeWidth={1.75} />
                  ) : (
                    <Eye className="h-[18px] w-[18px]" strokeWidth={1.75} />
                  )}
                </button>
              </div>
              {touched.password && errors.password && (
                <p id="password-error" role="alert" className="text-[12.5px] text-red-600 pl-4">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Remember + Need account */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  id="remember"
                  onClick={toggleRememberMe}
                  onKeyDown={handleRememberKeyDown}
                  className={`relative w-[18px] h-[18px] shrink-0 rounded-[5px] border transition-all outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/30 focus-visible:ring-offset-1 ${
                    rememberMe
                      ? "bg-neutral-900 border-neutral-900"
                      : "bg-white border-neutral-300 hover:border-neutral-400"
                  }`}
                  aria-checked={rememberMe}
                  role="checkbox"
                >
                  {rememberMe && (
                    <svg
                      className="absolute inset-0 w-[18px] h-[18px] text-white pointer-events-none"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3.5"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>
                <Label
                  htmlFor="remember"
                  className="text-[13px] text-neutral-600 cursor-pointer select-none font-medium"
                  onClick={toggleRememberMe}
                >
                  Remember me
                </Label>
              </div>

              <Link
                to="/signup"
                className="text-[12.5px] font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                Need an account?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="group w-full h-12 rounded-full bg-neutral-900 hover:bg-black text-white text-[14px] font-semibold tracking-[-0.005em] inline-flex items-center justify-center gap-2 shadow-[0_10px_24px_-12px_rgba(0,0,0,0.5)] transition-all duration-200 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                    strokeWidth={2.25}
                    aria-hidden="true"
                  />
                </>
              )}
            </button>
          </form>

          {/* ─── Divider ────────────────────────────────────── */}
          <div className="relative my-6 sm:my-7">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-neutral-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-neutral-400">
                or
              </span>
            </div>
          </div>

          {/* ─── Google ─────────────────────────────────────── */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading || isLoading}
            className="w-full h-12 rounded-full bg-neutral-50 hover:bg-neutral-100 border border-transparent hover:border-neutral-200 text-neutral-800 text-[14px] font-semibold inline-flex items-center justify-center gap-3 transition-all duration-200 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
          >
            {isGoogleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <img
                src={Google}
                alt=""
                aria-hidden="true"
                className="h-5 w-5 shrink-0"
              />
            )}
            Continue with Google
          </button>

          {/* ─── Sign up prompt ─────────────────────────────── */}
          <p className="mt-7 sm:mt-8 text-center text-[13.5px] text-neutral-500">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="font-semibold text-neutral-900 hover:text-neutral-700 hover:underline transition-colors"
            >
              Create one
            </Link>
          </p>

          {/* ─── SSL note ───────────────────────────────────── */}
          <p className="mt-5 flex items-center justify-center gap-1.5 text-[12px] text-neutral-400">
            <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
            Protected by 256-bit SSL encryption
          </p>
        </div>
      </main>

      {/* ─── Footer terms ─────────────────────────────────── */}
      <footer className="relative px-4 sm:px-6 pb-6 sm:pb-8">
        <p className="text-center text-[12px] text-neutral-400 leading-relaxed max-w-md mx-auto">
          By signing in you agree to our{" "}
          <Link
            to="/terms"
            className="text-neutral-500 hover:text-neutral-900 underline underline-offset-2 decoration-neutral-300 hover:decoration-neutral-900 transition-colors"
          >
            Terms
          </Link>{" "}
          and{" "}
          <Link
            to="/privacy"
            className="text-neutral-500 hover:text-neutral-900 underline underline-offset-2 decoration-neutral-300 hover:decoration-neutral-900 transition-colors"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </footer>
    </div>
  );
};

export default Login;