import React from 'react';
import { render, screen } from '@testing-library/react';
import AdminPanel from './AdminPanel';
import { auth } from '../firebase';

jest.mock('../firebase', () => ({
  auth: { currentUser: { email: 'admin@sonprim.com' } },
  db: {},
}));

test('renders admin panel', () => {
  render(<AdminPanel />);
  expect(screen.getByText(/Admin Panel/)).toBeInTheDocument();
});

export {};

// Your existing test code here