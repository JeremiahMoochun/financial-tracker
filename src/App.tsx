import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/common/ProtectedRoute";
import { RequireOnboarding } from "./components/common/RequireOnboarding";
import Layout from "./components/common/Layout";

import Home from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import BudgetPage from "./pages/BudgetPage";
import GhostPage from "./pages/GhostPage";
import AdminPage from "./pages/AdminPage";
import IncomePage from "./pages/IncomePage";
import ExpensePage from "./pages/ExpensePage";
import OnboardingPage from "./pages/OnboardingPage";
import SettingsPage from "./pages/SettingsPage";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><RequireOnboarding><DashboardPage /></RequireOnboarding></ProtectedRoute>} />
            <Route path="/budget" element={<ProtectedRoute><RequireOnboarding><BudgetPage /></RequireOnboarding></ProtectedRoute>} />
            <Route path="/ghost" element={<ProtectedRoute><RequireOnboarding><GhostPage /></RequireOnboarding></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><RequireOnboarding><AdminPage /></RequireOnboarding></ProtectedRoute>} />
            <Route path="/income" element={<ProtectedRoute><RequireOnboarding><IncomePage /></RequireOnboarding></ProtectedRoute>} />
            <Route path="/expenses" element={<ProtectedRoute><RequireOnboarding><ExpensePage /></RequireOnboarding></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><RequireOnboarding><SettingsPage /></RequireOnboarding></ProtectedRoute>} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;
