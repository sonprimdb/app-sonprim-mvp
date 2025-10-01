import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { Button } from '@mui/material';

const Profile: React.FC = () => {
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
    return <div>Cargando perfil...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      {user ? (
        <>
          <h2>Perfil</h2>
          <p>Bienvenido, {user.displayName || user.email}</p>
          <p>Email: {user.email}</p>
          <Button variant="contained" color="secondary" onClick={() => signOut(auth)}>
            Cerrar Sesión
          </Button>
        </>
      ) : (
        <p>No estás logueado. Inicia sesión para ver tu perfil.</p>
      )}
    </div>
  );
};

export default Profile;
export {};