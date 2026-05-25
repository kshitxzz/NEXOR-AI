import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || 'Something went wrong' };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="auth-page">
          <div className="auth-card glass-card" style={{ textAlign: 'center' }}>
            <h1>Something went wrong</h1>
            <p className="auth-sub">{this.state.message}</p>
            <Link to="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Back to Home
            </Link>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}
