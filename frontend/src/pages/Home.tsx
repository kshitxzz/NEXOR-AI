import { Link } from 'react-router-dom';
import HeroDashboard from '../components/HeroDashboard';
import ToolCard from '../components/ToolCard';
import { categories, tools } from '../data/tools';
import './Home.css';

export default function Home() {
  return (
    <main>
      <section className="hero section">
        <div className="container hero-grid">
          <div className="hero-content animate-in">
            <span className="hero-badge">Powered by Gemini AI</span>
            <h1>
              All-in-One AI Tools to{' '}
              <span className="gradient-text">Boost Your Productivity</span>
            </h1>
            <p className="hero-sub">
              Access powerful AI tools for writing, coding, marketing and automation
            </p>
            <div className="hero-buttons">
              <Link to="/signup" className="btn btn-primary">
                Try Tools Free
              </Link>
              <a href="#tools" className="btn btn-outline">
                Explore Tools
              </a>
            </div>
          </div>
          <div className="hero-preview animate-in">
            <HeroDashboard />
          </div>
        </div>
      </section>

      <section className="stats section">
        <div className="container stats-grid">
          <div className="stat-card glass-card">
            <span className="stat-value gradient-text">30+</span>
            <span className="stat-label">AI Tools</span>
          </div>
          <div className="stat-card glass-card">
            <span className="stat-value gradient-text">Fast</span>
            <span className="stat-label">AI Generation</span>
          </div>
          <div className="stat-card glass-card">
            <span className="stat-value gradient-text">Zero</span>
            <span className="stat-label">Coding Needed</span>
          </div>
        </div>
      </section>

      <section id="categories" className="section">
        <div className="container">
          <h2 className="section-title">Explore Categories</h2>
          <p className="section-subtitle">
            Six powerful categories with five specialized tools each
          </p>
          <div className="grid-3">
            {categories.map((cat) => (
              <a
                key={cat.id}
                href={`#category-${cat.id}`}
                className="category-card glass-card"
              >
                <span className="category-icon">{cat.icon}</span>
                <h3>{cat.name}</h3>
                <p>{cat.description}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section id="tools" className="section">
        <div className="container">
          <h2 className="section-title">All AI Tools</h2>
          <p className="section-subtitle">
            Every tool is fully functional with real AI-powered responses
          </p>
          {categories.map((cat) => (
            <div key={cat.id} id={`category-${cat.id}`} className="category-section">
              <h3 className="category-heading">
                <span>{cat.icon}</span> {cat.name}
              </h3>
              <div className="grid-3">
                {tools
                  .filter((t) => t.categoryId === cat.id)
                  .map((tool) => (
                    <ToolCard key={tool.id} tool={tool} />
                  ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
