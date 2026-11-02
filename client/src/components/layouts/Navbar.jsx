import { useEffect, useState } from "react";
import {
  Search,
  Bell,
  ChevronDown,
  Menu
} from "lucide-react";

import "./Navbar.css";

function Navbar() {

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
  return (
    <header className="navbar">

      {/* Left Section */}
      <div className="navbar-left">
        <div className="page-title">
          <p>Workspace / Overview</p>
          <h2>Dashboard</h2>
        </div>
      </div>

      {/* Right Section */}
      <div className="navbar-right">

        {/* Search Bar */}
        <div className="navbar-search">
          <Search size={19} />

          <input
            type="text"
            placeholder="Search anything..."
          />

          <span className="search-shortcut">⌘ K</span>
        </div>

        {/* Notification */}
        <button className="notification-button">
          <Bell size={21} />
          <span className="notification-dot"></span>
        </button>

        {/* User Profile */}
        <div className="navbar-profile">
          <div className="navbar-avatar">{user.name.charAt(0).toUpperCase()}
          </div>

          <div className="navbar-user-info">
            <h4>{user.name}</h4>
            <p>Personal</p>
          </div>

          <ChevronDown size={17} />
        </div>

      </div>

    </header>
  );
}

export default Navbar;
