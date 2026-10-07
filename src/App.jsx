import React, { useEffect } from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  useLocation,
} from 'react-router-dom';

/* ────────────────────────────────────────────────────────
   Public Pages
   ──────────────────────────────────────────────────────── */
import Home from './pages/Home';
import Signup from './pages/Signup';
import Login from './pages/Login';
import VerifyEmail from './pages/VerifyEmail';
import Verify from './pages/Verify';
import ForgotPassword from './pages/ForgotPassword';
import VerifyOTP from './pages/VerifyOTP';
import ChangePassword from './pages/ChangePassword';
import AuthSuccess from './pages/AuthSuccess';
import NotFound from './pages/NotFound';
import News from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import About from './pages/About';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import WriteForUs from './pages/WriteForUs';
// import Advertise from './pages/Advertise';
import FeaturedDetail from './pages/FeaturedDetail';
import AudioPage from './pages/AudioPage';

/* ────────────────────────────────────────────────────────
   Components
   ──────────────────────────────────────────────────────── */
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

/* ────────────────────────────────────────────────────────
   User Pages
   ──────────────────────────────────────────────────────── */
import UserProfile from './pages/User/UserProfile';

/* ────────────────────────────────────────────────────────
   Admin Layout & Pages
   ──────────────────────────────────────────────────────── */
import AdminLayout from './pages/Admin/AdminLayout';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminProfile from './pages/Admin/AdminProfile';
import AdminUsers from './pages/Admin/AdminUsers';
import AdminProducts from './pages/Admin/AdminProducts';
import AdminHero from './pages/Admin/AdminHero';
import AdminMessages from './pages/Admin/AdminMessages';
import AdminAdvertise from './pages/Admin/AdminAdvertise';
import AdminFeatured from './pages/Admin/AdminFeatured';
import AdminAudio from './pages/Admin/AdminAudio';
import Advertisements from './pages/Admin/Advertisements';
import Guide from './pages/Guide';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import AdminOrders from './pages/Admin/AdminOrders';
import Orders from './pages/Orders';
import Brands from './pages/Brands';

/* ────────────────────────────────────────────────────────
   ScrollToTop
   ──────────────────────────────────────────────────────── */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);

  return null;
};

/* ────────────────────────────────────────────────────────
   Root Layout
   ──────────────────────────────────────────────────────── */
const RootLayout = () => {
  const location = useLocation();
  const path = location.pathname;

  const isAuthPage =
    path === '/signup' ||
    path === '/login' ||
    path === '/forgot-password' ||
    path === '/auth-success' ||
    path.startsWith('/verify') ||
    path.startsWith('/verify-otp') ||
    path.startsWith('/change-password');

  // ✅ Hide Navbar + Footer on all admin pages
  const isAdminPage = path.startsWith('/admin');

  const hideChrome = isAuthPage || isAdminPage;

  return (
    <>
      {!hideChrome && <Navbar />}
      <ScrollToTop />
      <Outlet />
      {!hideChrome && <Footer />}
    </>
  );
};

/* ────────────────────────────────────────────────────────
   Router
   ──────────────────────────────────────────────────────── */
const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      /* ── Public routes ── */
      { path: '/', element: <Home /> },
      { path: '/verify', element: <VerifyEmail /> },
      { path: '/verify/:token', element: <Verify /> },
      { path: '/login', element: <Login /> },
      { path: '/signup', element: <Signup /> },
      { path: '/auth-success', element: <AuthSuccess /> },
      { path: '/forgot-password', element: <ForgotPassword /> },
      { path: '/verify-otp/:email', element: <VerifyOTP /> },
      { path: '/change-password/:email', element: <ChangePassword /> },

      /* ── Articles / Blog (News component) ── */
      { path: '/news', element: <News /> },

      /* ── Shop (products) ── */
      { path: '/shop', element: <News /> },
      { path: '/shop/:slug', element: <ProductDetail /> },
      { path: '/shop/:id', element: <ProductDetail /> },
            { path: '/guide', element: <Guide /> },
                        { path: '/cart', element: <Cart /> },
                                                { path: '/checkout', element: <Checkout /> },
                        { path: '/orders', element: <Orders /> },
                                                { path: '/brands', element: <Brands /> },








      /* ── Static pages ── */
      { path: '/about', element: <About /> },
      { path: '/contact', element: <Contact /> },
      { path: '/privacy', element: <Privacy /> },
      { path: '/write-for-us', element: <WriteForUs /> },
      // { path: '/advertise', element: <Advertise /> },
      { path: '/article/:slug', element: <FeaturedDetail /> },
      { path: '/audio', element: <AudioPage /> },

      /* ── User routes (protected) ── */
      {
        element: (
          <ProtectedRoute requiredRole="user">
            <Outlet />
          </ProtectedRoute>
        ),
        children: [
          { path: '/profile', element: <UserProfile /> },
                      { path: '/orders', element: <Orders /> },

        ],
      },

      /* ── Admin routes (protected) ── */
      {
        element: (
          <ProtectedRoute requiredRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        ),
        children: [
          { path: '/admin/dashboard', element: <AdminDashboard /> },
          { path: '/admin/profile', element: <AdminProfile /> },
          { path: '/admin/users', element: <AdminUsers /> },
          { path: '/admin/create-posts', element: <AdminProducts /> },
          { path: '/admin/admin-hero', element: <AdminHero /> },
          { path: '/admin/admin-messages', element: <AdminMessages /> },
          { path: '/admin/admin-advertise', element: <AdminAdvertise /> },
          { path: '/admin/admin-featured', element: <AdminFeatured /> },
          { path: '/admin/admin-audio', element: <AdminAudio /> },
          { path: '/admin/advertisements', element: <Advertisements /> },
                    { path: '/admin/orders', element: <AdminOrders /> },

        ],
      },

      /* ── 404 catch-all ── */
      { path: '*', element: <NotFound /> },
    ],
  },
]);

/* ────────────────────────────────────────────────────────
   App
   ──────────────────────────────────────────────────────── */
const App = () => {
  return <RouterProvider router={router} />;
};

export default App;