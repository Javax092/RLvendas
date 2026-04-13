import { Route, Routes } from "react-router-dom";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage";
import { AdminCampaignsPage } from "./pages/admin/AdminCampaignsPage";
import { AdminCustomersPage } from "./pages/admin/AdminCustomersPage";
import { AdminProductsPage } from "./pages/admin/AdminProductsPage";
import { AdminOrdersPage } from "./pages/admin/AdminOrdersPage";
import { AdminSettingsPage } from "./pages/admin/AdminSettingsPage";
import { AdminSubscriptionPage } from "./pages/admin/AdminSubscriptionPage";
import { LoginPage } from "./pages/admin/LoginPage";
import { PublicMenuPage } from "./pages/public/PublicMenuPage";
import { ProtectedRoute } from "./components/ProtectedRoute";

export function App() {
  return (
    <Routes>
      <Route path="/admin/login" element={<LoginPage />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="customers" element={<AdminCustomersPage />} />
        <Route path="campaigns" element={<AdminCampaignsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="billing" element={<AdminSubscriptionPage />} />
        <Route path="subscription" element={<AdminSubscriptionPage />} />
      </Route>
      <Route path="/:restaurantSlug" element={<PublicMenuPage />} />
      <Route path="*" element={<PublicMenuPage />} />
    </Routes>
  );
}
