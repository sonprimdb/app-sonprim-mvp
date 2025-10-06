import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Profile from './components/Profile';
import Catalog from './components/Catalog';
import MembershipPlans from './components/MembershipPlans';
import AdminPanel from './components/AdminPanel';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() { return this.state.hasError ? <h1>Something went wrong. Please refresh.</h1> : this.props.children; }
}

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAdmin(!!currentUser && currentUser.email === 'admin@sonprim.com'); // Simulate admin check
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px', fontSize: '24px' }}>
        Loading App... {/* Can add CSS spinner here, e.g., <div className="spinner"></div> */}
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="App">
        <h1>Bienvenido a Son Prim</h1>
        {!user && <Login />}
        {user && isAdmin && <AdminPanel />}
        {user && !isAdmin && (
          <div>
            <Profile />
            <Catalog />
            <MembershipPlans />
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;