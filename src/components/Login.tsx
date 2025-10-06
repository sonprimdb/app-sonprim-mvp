import React from 'react';
import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithPopup, signOut, OAuthProvider } from 'firebase/auth';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

const appleProvider = new OAuthProvider('apple.com');
appleProvider.setCustomParameters({ prompt: 'select_account' });

const Login: React.FC = () => {
  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      console.log('Logged in with Google');
    } catch (error) {
      console.error('Google login error:', error);
    }
  };

  const handleAppleLogin = async () => {
    try {
      await signInWithPopup(auth, appleProvider);
      console.log('Logged in with Apple');
    } catch (error) {
      console.error('Apple login error:', error);
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
      <button onClick={handleGoogleLogin}>Login with Google</button>
      <button onClick={handleAppleLogin}>Login with Apple</button>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default Login;
export {};