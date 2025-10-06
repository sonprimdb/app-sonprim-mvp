import React from 'react';
import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

const provider = new GoogleAuthProvider();

const Login: React.FC = () => {
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
      console.log('Logged in');
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log('Logged out');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div>
      <button onClick={handleLogin}>Login with Google</button>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default Login;