
import {
  CircleDollarSign,
  Heart
} from "lucide-react";

import "./Footer.css";

function Footer() {
  return (
    <footer className="app-footer">

      <div className="footer-left">
        <div className="footer-brand">
          <CircleDollarSign size={21} />
          <span>SpendWise</span>
        </div>

        <p>Take control of your money, one step at a time.</p>
      </div>

      <div className="footer-right">
        <p>
          Made with <Heart size={14} /> for smarter money management
        </p>

        <span>© {new Date().getFullYear()} SpendWise. All rights reserved.</span>
      </div>

    </footer>
  );
}

export default Footer;
