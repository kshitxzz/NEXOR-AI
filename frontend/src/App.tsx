import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { UserProvider } from './context/UserContext';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import SubscriptionGate from './components/SubscriptionGate';
import Home from './pages/Home';
import ToolPage from './pages/ToolPage';
import Pricing from './pages/Pricing';
import PaymentSuccess from './pages/PaymentSuccess';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AuthCallback from './pages/AuthCallback';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <UserProvider>
          <ErrorBoundary>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route
                  path="/tool/:toolId"
                  element={
                    <ProtectedRoute>
                      <SubscriptionGate>
                        <ToolPage />
                      </SubscriptionGate>
                    </ProtectedRoute>
                  }
                />
                <Route path="/pricing" element={<Pricing />} />
                <Route
                  path="/payment/success"
                  element={
                    <ProtectedRoute>
                      <PaymentSuccess />
                    </ProtectedRoute>
                  }
                />
              </Route>
            </Routes>
          </ErrorBoundary>
        </UserProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}
