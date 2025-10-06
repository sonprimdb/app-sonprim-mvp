import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Profile from './components/Profile';
import Catalog from './components/Catalog';
import MembershipPlans from './components/MembershipPlans';
import AdminPanel from './components/AdminPanel';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
        setIsAdmin(currentUser ? currentUser.email === 'admin@sonprim.com' : false); // Simulate admin check
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
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
  );
}

export default App;