import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import API from "../../utils/api";
import { getData } from "@/context/userContext";
import { toast } from "sonner";
import {
  User,
  Mail,
  Calendar,
  Camera,
  Edit2,
  Save,
  X,
  Loader2,
  AtSign,
  Globe,
  MapPin,
  Briefcase,
  LogOut,
  Shield,
  CheckCircle2,
  BookOpen,
  Heart,
  MessageCircle,
  Users,
  Award,
  Clock,
  TrendingUp,
  Sparkles,
  ArrowUpRight,
  Feather,
} from "lucide-react";
import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaLinkedinIn,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

/* ────────────────────────────────────────────────────────────
   Design notes – same editorial style, but without animations
   and without the cover banner. The page is now purely static
   in terms of transitions.
   ──────────────────────────────────────────────────────────── */

// ─── Helpers ───────────────────────────────────────────
const stringToColor = (str) => {
  if (!str) return "hsl(220, 70%, 45%)";
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 45%)`;
};

const getAvatarUrl = (avatarPath) => {
  if (!avatarPath) return null;
  if (avatarPath.startsWith("http://") || avatarPath.startsWith("https://")) {
    return avatarPath;
  }
  const base = API ? API.replace(/\/+$/, "") : "";
  const path = avatarPath.replace(/^\/+/, "");
  return base ? `${base}/${path}` : null;
};

// ─── Skeleton ──────────────────────────────────────────
const SkeletonProfile = () => (
  <div className="min-h-screen bg-[#FAFAF8] dark:bg-[#0B0D10] px-3 sm:px-4 md:px-6">
    <div className="max-w-6xl mx-auto pt-4 sm:pt-10 md:pt-14">
      <div className="h-20 sm:h-32 md:h-44 lg:h-52 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
      <div className="px-2 sm:px-4 -mt-8 sm:-mt-12 flex items-end gap-4">
        <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-zinc-300 dark:bg-zinc-700" />
        <div className="flex-1 pb-2 space-y-2">
          <div className="h-5 sm:h-7 w-40 sm:w-56 rounded bg-zinc-300 dark:bg-zinc-700" />
          <div className="h-3 sm:h-4 w-24 sm:w-32 rounded bg-zinc-300 dark:bg-zinc-700" />
        </div>
      </div>
    </div>
  </div>
);

// ─── Editable Field ────────────────────────────────────
const EditableField = ({ icon: Icon, label, value, name, onChange, isEditing, type = "text", placeholder }) => (
  <div className="group flex items-start gap-3 py-3 sm:py-3.5 border-b border-zinc-200/80 dark:border-zinc-800/80 last:border-0">
    <div className="mt-0.5 w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 flex items-center justify-center flex-shrink-0">
      <Icon size={14} className="sm:w-4 sm:h-4" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-meta text-[9px] sm:text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{label}</p>
      {isEditing ? (
        type === "textarea" ? (
          <textarea
            name={name}
            value={value}
            onChange={onChange}
            rows={2}
            className="ink-focus w-full mt-1 bg-transparent border-b-2 border-zinc-300 dark:border-zinc-700 focus:border-black dark:focus:border-white outline-none py-0.5 text-zinc-900 dark:text-white text-sm sm:text-base resize-none"
            placeholder={placeholder || `Enter ${label}`}
          />
        ) : (
          <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            className="ink-focus w-full mt-1 bg-transparent border-b-2 border-zinc-300 dark:border-zinc-700 focus:border-black dark:focus:border-white outline-none py-0.5 text-zinc-900 dark:text-white text-sm sm:text-base"
            placeholder={placeholder || `Enter ${label}`}
          />
        )
      ) : (
        <p className="font-medium text-zinc-900 dark:text-white text-sm sm:text-base break-all mt-0.5">
          {value || <span className="text-zinc-400 dark:text-zinc-500 italic font-normal">Not set</span>}
        </p>
      )}
    </div>
  </div>
);

// ─── Social Icon (Cubic Form) ─────────────────────────
const SocialCube = ({ icon: Icon, href, label, color }) => {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`ink-focus w-11 h-11 sm:w-12 sm:h-12 rounded-lg border-2 border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-white hover:border-transparent ${color}`}
      aria-label={label}
      title={label}
    >
      <Icon size={17} className="sm:w-[18px] sm:h-[18px]" />
    </a>
  );
};

// ─── Tab Button ────────────────────────────────────────
const TabButton = ({ active, onClick, children, icon: Icon }) => (
  <button
    onClick={onClick}
    className={`ink-focus relative flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-lg whitespace-nowrap ${
      active
        ? "bg-black dark:bg-white text-white dark:text-black"
        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
    }`}
  >
    {Icon && <Icon size={14} className="sm:w-4 sm:h-4" />}
    {children}
  </button>
);

// ─── Empty State ───────────────────────────────────────
const EmptyState = ({ icon: Icon, title, subtitle }) => (
  <div className="flex flex-col items-center justify-center text-center py-12 sm:py-16 px-4">
    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3 sm:mb-4">
      <Icon size={22} className="sm:w-6 sm:h-6 text-zinc-400 dark:text-zinc-500" />
    </div>
    <p className="font-display text-base sm:text-lg font-semibold text-zinc-800 dark:text-zinc-200">{title}</p>
    <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs">{subtitle}</p>
  </div>
);

// ─── Main Component ────────────────────────────────────
const AdminProfile = () => {
  const { user: contextUser, setUser } = getData();
  const userId = contextUser?._id || contextUser?.id || localStorage.getItem("userId");
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const [user, setUserState] = useState(contextUser || null);
  const [loading, setLoading] = useState(!contextUser);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [avatarPreview, setAvatarPreview] = useState(
    contextUser?.avatar ? getAvatarUrl(contextUser.avatar) : null
  );

  const [formData, setFormData] = useState({
    fullname: contextUser?.fullname || "",
    username: contextUser?.username || "",
    bio: contextUser?.bio || "",
    website: contextUser?.website || "",
    location: contextUser?.location || "",
    occupation: contextUser?.occupation || "",
    twitter: contextUser?.twitter || "",
    facebook: contextUser?.facebook || "",
    instagram: contextUser?.instagram || "",
    youtube: contextUser?.youtube || "",
    linkedin: contextUser?.linkedin || "",
  });

  // ─── Fetch Profile ────────────────────────────────────
  const hydrateForm = (u) => ({
    fullname: u?.fullname || "",
    username: u?.username || "",
    bio: u?.bio || "",
    website: u?.website || "",
    location: u?.location || "",
    occupation: u?.occupation || "",
    twitter: u?.twitter || "",
    facebook: u?.facebook || "",
    instagram: u?.instagram || "",
    youtube: u?.youtube || "",
    linkedin: u?.linkedin || "",
  });

  const fetchProfile = useCallback(async () => {
    if (contextUser) {
      setUserState(contextUser);
      setFormData(hydrateForm(contextUser));
      setAvatarPreview(getAvatarUrl(contextUser.avatar));
      setLoading(false);
      return;
    }

    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      if (token) {
        const res = await axios.get(`${API}/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userData = res.data.data;
        if (userData) {
          setUserState(userData);
          setFormData(hydrateForm(userData));
          setAvatarPreview(getAvatarUrl(userData.avatar));
          setUser(userData);
          localStorage.setItem("user", JSON.stringify(userData));
          setLoading(false);
          return;
        }
      }

      const res2 = await axios.get(`${API}/admin/users`);
      const found = res2.data.find((u) => u._id === userId);
      if (found) {
        setUserState(found);
        setFormData(hydrateForm(found));
        setAvatarPreview(getAvatarUrl(found.avatar));
        setUser(found);
        localStorage.setItem("user", JSON.stringify(found));
      } else {
        setUserState(null);
      }
    } catch (error) {
      console.error("Profile fetch error:", error);
      setUserState(null);
    } finally {
      setLoading(false);
    }
  }, [contextUser, userId, setUser]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // ─── Handlers ──────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error("No authentication token. Please login again.");
        navigate("/login");
        return;
      }

      const formDataToSend = new FormData();
      Object.keys(formData).forEach((key) => {
        formDataToSend.append(key, formData[key] || "");
      });
      if (avatarFile) {
        formDataToSend.append("avatar", avatarFile);
      }

      const res = await axios.put(`${API}/user/profile`, formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const updatedUser = res.data.data;
      setUserState(updatedUser);
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setAvatarPreview(getAvatarUrl(updatedUser.avatar));
      toast.success("Profile updated!");
      setIsEditing(false);
      setAvatarFile(null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(hydrateForm(user));
    setAvatarPreview(getAvatarUrl(user?.avatar));
    setAvatarFile(null);
    setIsEditing(false);
  };

  // ─── Logout handler ──────────────────────────────────
  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (token) {
        await axios.post(
          `${API}/user/logout`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      setUser(null);
      localStorage.clear();
      toast.success("Logged out successfully");
      navigate("/");
    } catch {
      toast.error("Logout failed");
    }
  };

  // ─── Computed ──────────────────────────────────────────
  const avatarColor = stringToColor(user?.username || user?.email);
  const avatarUrl = avatarPreview || (user?.avatar ? getAvatarUrl(user.avatar) : null);
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  const hasSocials =
    !!(user?.twitter || user?.facebook || user?.instagram || user?.youtube || user?.linkedin);

  // ─── Loading ────────────────────────────────────────────
  if (loading) return <SkeletonProfile />;

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] p-5 dark:bg-[#0B0D10] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <User size={24} className="sm:w-8 sm:h-8 text-red-500 dark:text-red-400" />
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">User Not Found</h2>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 mt-2">Your session may have expired.</p>
          <button
            onClick={() => navigate("/login")}
            className="ink-focus mt-4 sm:mt-6 px-4 sm:px-6 py-1.5 sm:py-2 bg-black dark:bg-white text-white dark:text-black rounded-xl font-semibold text-sm sm:text-base"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FAFAF8] dark:bg-[#0B0D10] pb-16 sm:pb-20">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 pt-4 sm:pt-10 md:pt-14">

        {/* ─── Masthead (no cover banner) ────────────────── */}
        <div className="relative">
          {/* The cover banner has been removed entirely */}

          <div className="relative px-2 sm:px-4 flex flex-wrap items-end gap-3 sm:gap-5 md:gap-6">
            <div className="relative group flex-shrink-0">
              <div
                className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full overflow-hidden flex items-center justify-center bg-white dark:bg-black"
                style={{ backgroundColor: avatarUrl ? undefined : avatarColor }}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={34} className="sm:w-10 sm:h-10 md:w-12 md:h-12 text-white" />
                )}
              </div>
              {isEditing && (
                <>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="ink-focus absolute bottom-0 right-0 sm:bottom-1 sm:right-1 bg-black dark:bg-white text-white dark:text-black rounded-full p-1.5 sm:p-2"
                    aria-label="Change avatar"
                  >
                    <Camera size={13} className="sm:w-4 sm:h-4" />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarChange}
                    accept="image/*"
                    className="hidden"
                  />
                </>
              )}
            </div>

            {/* Name & byline */}
            <div className="flex-1 min-w-[160px] pb-2 sm:pb-3">
              {isEditing ? (
                <input
                  name="fullname"
                  value={formData.fullname}
                  onChange={handleInputChange}
                  className="ink-focus font-display text-xl sm:text-2xl md:text-3xl font-semibold bg-transparent border-b-2 border-zinc-300 dark:border-zinc-700 focus:border-black dark:focus:border-white outline-none w-full text-zinc-900 dark:text-white"
                  placeholder="Full name"
                />
              ) : (
                <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-semibold text-zinc-900 dark:text-white truncate">
                  {user.fullname || user.username}
                </h1>
              )}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 font-meta text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400">
                <span>@{user.username}</span>
                {user.location && (
                  <>
                    <span className="text-zinc-300 dark:text-zinc-700">·</span>
                    <span className="flex items-center gap-1"><MapPin size={11} />{user.location}</span>
                  </>
                )}
                <span className="text-zinc-300 dark:text-zinc-700">·</span>
                <span className="flex items-center gap-1"><Calendar size={11} />Joined {memberSince}</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {user.role && (
                  <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-semibold font-meta bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded-full uppercase tracking-wide">
                    <Award size={10} />
                    {user.role}
                  </span>
                )}
                {user.isVerified && (
                  <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-semibold font-meta bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full uppercase tracking-wide">
                    <CheckCircle2 size={10} />
                    Verified
                  </span>
                )}
              </div>
            </div>

            {/* Edit/Save buttons */}
            <div className="flex flex-wrap gap-2 pb-2 sm:pb-3">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="ink-focus flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-xl text-xs sm:text-sm font-semibold"
                >
                  <Edit2 size={14} className="sm:w-4 sm:h-4" />
                  Edit profile
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="ink-focus flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-xl text-xs sm:text-sm font-semibold disabled:opacity-60"
                  >
                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className="ink-focus flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs sm:text-sm font-semibold hover:bg-zinc-300 dark:hover:bg-zinc-700"
                  >
                    <X size={14} />
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ─── Follow us social bar ────────────────── */}
          <div className="relative px-2 sm:px-4 mt-2 sm:mt-3 flex flex-wrap items-center gap-3 sm:gap-4">
            <span className="font-meta text-[10px] sm:text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <Feather size={12} className="sm:w-3.5 sm:h-3.5" />
              Follow us
            </span>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <SocialCube icon={FaXTwitter} href={user.twitter} label="Twitter / X" color="hover:bg-black" />
              <SocialCube icon={FaFacebookF} href={user.facebook} label="Facebook" color="hover:bg-blue-600" />
              <SocialCube icon={FaInstagram} href={user.instagram} label="Instagram" color="hover:bg-pink-600" />
              <SocialCube icon={FaYoutube} href={user.youtube} label="YouTube" color="hover:bg-red-600" />
              <SocialCube icon={FaLinkedinIn} href={user.linkedin} label="LinkedIn" color="hover:bg-blue-700" />
            </div>
            {!hasSocials && !isEditing && (
              <span className="text-xs sm:text-sm text-zinc-400 dark:text-zinc-500 italic">No links added yet.</span>
            )}
          </div>
        </div>

        {/* ─── Body: sidebar + tabbed content ──────────── */}
        <div className="mt-6 sm:mt-8 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 sm:gap-6">

          {/* Sidebar */}
          <aside className="space-y-4 sm:space-y-6 lg:sticky lg:top-6 lg:self-start">
            {/* Bio card */}
            <div className="bg-white dark:bg-black rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 sm:p-5">
              <h3 className="font-meta text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Sparkles size={11} /> About
              </h3>
              {isEditing ? (
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={4}
                  className="ink-focus w-full bg-transparent border-b-2 border-zinc-300 dark:border-zinc-700 focus:border-black dark:focus:border-white outline-none py-1 text-zinc-900 dark:text-white text-sm resize-none"
                  placeholder="Tell readers about yourself"
                />
              ) : (
                <p className="font-display text-[15px] sm:text-base text-zinc-800 dark:text-zinc-200 leading-relaxed">
                  {user.bio || <span className="font-sans text-zinc-400 dark:text-zinc-500 italic text-sm">No bio yet — tell readers who you are.</span>}
                </p>
              )}

              {user.occupation && !isEditing && (
                <p className="flex items-center gap-1.5 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <Briefcase size={13} /> {user.occupation}
                </p>
              )}
              {user.website && !isEditing && (
                <a
                  href={user.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ink-focus flex items-center gap-1.5 text-xs sm:text-sm text-zinc-900 dark:text-white mt-2 font-medium hover:underline underline-offset-2"
                >
                  <Globe size={13} /> {user.website.replace(/^https?:\/\//, "")}
                  <ArrowUpRight size={12} />
                </a>
              )}
            </div>
          </aside>

          {/* Main column */}
          <main className="min-w-0">
            {/* Tabs */}
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 mb-4 sm:mb-5 -mx-1 px-1">
              <TabButton active={activeTab === "overview"} onClick={() => setActiveTab("overview")} icon={User}>
                Overview
              </TabButton>
              <TabButton active={activeTab === "posts"} onClick={() => setActiveTab("posts")} icon={BookOpen}>
                Posts
              </TabButton>
              <TabButton active={activeTab === "activity"} onClick={() => setActiveTab("activity")} icon={Clock}>
                Activity
              </TabButton>
            </div>

            {activeTab === "overview" && (
              <div className="bg-white dark:bg-black rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 sm:p-6">
                <h3 className="font-meta text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                  Personal information
                </h3>
                <div>
                  <EditableField icon={User} label="Full Name" value={formData.fullname} name="fullname" onChange={handleInputChange} isEditing={isEditing} placeholder="Enter full name" />
                  <EditableField icon={AtSign} label="Username" value={formData.username} name="username" onChange={handleInputChange} isEditing={isEditing} placeholder="Enter username" />
                  <EditableField icon={Mail} label="Email" value={user.email} name="email" onChange={() => {}} isEditing={false} />
                  <EditableField icon={Globe} label="Website" value={formData.website} name="website" onChange={handleInputChange} isEditing={isEditing} placeholder="https://example.com" />
                  <EditableField icon={MapPin} label="Location" value={formData.location} name="location" onChange={handleInputChange} isEditing={isEditing} placeholder="City, Country" />
                  <EditableField icon={Briefcase} label="Occupation" value={formData.occupation} name="occupation" onChange={handleInputChange} isEditing={isEditing} placeholder="Your job title" />
                  <EditableField icon={Shield} label="Role" value={user.role} name="role" onChange={() => {}} isEditing={false} />
                </div>
              </div>
            )}

            {activeTab === "posts" && (
              <div className="bg-white dark:bg-black rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <EmptyState
                  icon={BookOpen}
                  title="No posts yet"
                  subtitle="Published articles by this author will show up here."
                />
              </div>
            )}

            {activeTab === "activity" && (
              <div className="bg-white dark:bg-black rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <EmptyState
                  icon={MessageCircle}
                  title="No recent activity"
                  subtitle="Comments, likes, and replies will appear here once this author starts engaging."
                />
              </div>
            )}
          </main>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="ink-focus w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 font-medium text-sm"
          >
            <LogOut size={15} />
            Log out
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
