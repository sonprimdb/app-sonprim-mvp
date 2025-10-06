import React from 'react';
import { render, screen } from '@testing-library/react';
import Catalog from './Catalog';

jest.mock('../firebase', () => ({ db: {}, auth: {} }));

test('renders catalog loading', () => {
  render(<Catalog />);
  expect(screen.getByText(/Loading catalog/)).toBeInTheDocument();
});
export {};