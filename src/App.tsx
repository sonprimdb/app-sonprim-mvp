import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Profile from './components/Profile';
import Catalog from './components/Catalog';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="App">
      <h1>Bienvenido a Son Prim</h1>
      {!user && <Login />}
      {user && (
        <div>
          <Profile />
          <Catalog />
        </div>
      )}
    </div>
  );
}

export default App;