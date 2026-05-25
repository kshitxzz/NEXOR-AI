import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <span className="logo-icon">◆</span> NEXOR<span className="gradient-text">AI</span>
          <p>Premium AI tools for productivity, marketing, and development.</p>
        </div>
        <div className="footer-links">
          <Link to="/#tools">All Tools</Link>
          <Link to="/pricing">Pricing</Link>
        </div>
        <p className="footer-copy">© {new Date().getFullYear()} NexorAI. All rights reserved.</p>
      </div>
    </footer>
  );
}
