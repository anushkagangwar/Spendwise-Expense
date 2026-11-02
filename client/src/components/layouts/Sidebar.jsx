
import { useState, useEffect } from "react";

import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  ChartNoAxesCombined,
  Target,
  Settings,
  CircleDollarSign,
  Menu,
  X
} from "lucide-react";

import "./Sidebar.css";

function Sidebar() {

  const [user, setUser] = useState({
  name: "User",
  email: ""
});

useEffect(() => {
  const savedUser = localStorage.getItem("spendwiseCurrentUser");

  if (savedUser) {
    setUser(JSON.parse(savedUser));
  }
}, []);
  const [isOpen, setIsOpen] = useState(false);

  const closeSidebar = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="mobile-menu-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle navigation menu"
      >
        {isOpen ? <X size={23} /> : <Menu size={23} />}
      </button>

      {/* Mobile Overlay */}
      <div
        className={`sidebar-overlay ${isOpen ? "show" : ""}`}
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? "sidebar-open" : ""}`}>

        {/* Logo Section */}
        <div className="sidebar-logo">
          <div className="logo-icon">
            <CircleDollarSign size={26} />
          </div>

          <h2>SpendWise</h2>

          <button
            className="sidebar-close-button"
            onClick={closeSidebar}
            aria-label="Close navigation menu"
          >
            <X size={21} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">

          <p className="nav-heading">MENU</p>

          <a href="/" className="nav-link active" onClick={closeSidebar}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </a>

          <a href="/transactions" className="nav-link" onClick={closeSidebar}>
            <ArrowLeftRight size={20} />
            <span>Transactions</span>
          </a>

          <a href="/budgets" className="nav-link" onClick={closeSidebar}>
            <Wallet size={20} />
            <span>Budgets</span>
          </a>

          <a href="/analytics" className="nav-link" onClick={closeSidebar}>
            <ChartNoAxesCombined size={20} />
            <span>Analytics</span>
          </a>

          <a href="/savings" className="nav-link" onClick={closeSidebar}>
            <Target size={20} />
            <span>Savings Goals</span>
          </a>

        </nav>

        {/* Bottom Section */}
        <div className="sidebar-bottom">

          <a href="/settings" className="nav-link" onClick={closeSidebar}>
            <Settings size={20} />
            <span>Settings</span>
          </a>

          <div className="sidebar-profile">
            <div className="profile-avatar">{user.name.charAt(0).toUpperCase()}</div>

            <div className="profile-info">
              <h4>{user.name}</h4>
              <p>Personal Account</p>
            </div>
          </div>

        </div>

      </aside>
    </>
  );
}

export default Sidebar;
