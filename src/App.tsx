import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Layout from "./components/common/Layout";

import Home from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import BudgetPage from "./pages/BudgetPage";
import GhostPage from "./pages/GhostPage";
import AdminPage from "./pages/AdminPage";
import IncomePage from "./pages/IncomePage";

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/budget" element={<BudgetPage />} />
          <Route path="/ghost" element={<GhostPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/income" element={<IncomePage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;