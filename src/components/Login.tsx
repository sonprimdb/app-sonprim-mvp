import React from 'react';
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from '../firebase';
import { Button } from '@mui/material'; // Instala Material-UI después

const Login: React.FC = () => {
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      alert("Login exitoso!");
    } catch (error) {
      console.error("Error al loguear:", error);
      alert("Error en Login, revisa la consola.");
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Inicia Sesión</h2>
      <Button variant="contained" color="primary" onClick={signInWithGoogle}>
        Iniciar con Google
      </Button>
    </div>
  );
};

export default Login;
export {};