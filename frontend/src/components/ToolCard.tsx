import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Tool } from '../data/tools';
import './ToolCard.css';

interface ToolCardProps {
  tool: Tool;
}

export default function ToolCard({ tool }: ToolCardProps) {
  const { user } = useAuth();
  const toolPath = `/tool/${tool.id}`;

  if (!user) {
    return (
      <article className="tool-card glass-card animate-in">
        <h3>{tool.name}</h3>
        <p>{tool.description}</p>
        <Link
          to="/login"
          state={{ from: toolPath }}
          className="btn btn-primary btn-sm"
        >
          Try Now
        </Link>
      </article>
    );
  }

  return (
    <article className="tool-card glass-card animate-in">
      <h3>{tool.name}</h3>
      <p>{tool.description}</p>
      <Link to={toolPath} className="btn btn-primary btn-sm">
        Try Now
      </Link>
    </article>
  );
}
