
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import Sidebar from "./components/layouts/Sidebar";
import Navbar from "./components/layouts/Navbar";
import Footer from "./components/layouts/Footer";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Signup from "./pages/Signup";
import Transactions from "./pages/Transactions";
import Budget from "./pages/Budget";
import Analytics from "./pages/Analytics";
import SavingsGoals from "./pages/SavingsGoals";
import Settings from "./pages/Settings";
import "./App.css";

// Dashboard Layout
function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <Navbar />

        <div className="page-content">
          {children || <Dashboard />}
        </div>

        <Footer />
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
    <Routes>
  <Route path="/" element={<Login />} />

  <Route path="/signup" element={<Signup />} />

  <Route
    path="/dashboard"
    element={
      <AppLayout>
        <Dashboard />
      </AppLayout>
    }
  />

  <Route
    path="/transactions"
    element={
      <AppLayout>
        <Transactions />
      </AppLayout>
    }
  />
  <Route
  path="/budgets"
  element={
    <AppLayout>
      <Budget />
    </AppLayout>
  }
/>

<Route
  path="/analytics"
  element={
    <AppLayout>
      <Analytics />
    </AppLayout>
  }
/>
<Route
  path="/savings"
  element={
    <AppLayout>
      <SavingsGoals />
    </AppLayout>
  }
/>

<Route
  path="/settings"
  element={
    <AppLayout>
      <Settings />
    </AppLayout>
  }
/>

  <Route path="*" element={<Navigate to="/" replace />} />
</Routes>
    </BrowserRouter>
  );
}

export default App;
