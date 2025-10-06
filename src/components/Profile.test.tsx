export {};
import React from 'react';
import { render, screen } from '@testing-library/react';
import Profile from './Profile';
import { auth } from '../firebase';

jest.mock('../firebase', () => ({
  auth: { currentUser: { uid: 'test', email: 'test@example.com' } },
  db: {},
}));

test('renders profile with user info', () => {
  render(<Profile />);
  expect(screen.getByText(/Welcome/)).toBeInTheDocument();
});
