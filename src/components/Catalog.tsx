import React from 'react';
import { wines } from '../data';

interface Vintage {
  year: number;
  price: number;
  stock: number;
}

interface Wine {
  id: number;
  name: string;
  type: string;
  description: string;
  vintages: Vintage[];
}

const Catalog: React.FC = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h2>Catálogo de Vinos</h2>
      {wines.map((wine: Wine) => (
        <div key={wine.id} style={{ marginBottom: '15px' }}>
          <h3>{wine.name} ({wine.type})</h3>
          <p>{wine.description}</p>
          <h4>Añadas Disponibles:</h4>
          <ul>
            {wine.vintages.map((vintage: Vintage, index) => (
              <li key={index}>
                Año: {vintage.year}, Precio: {vintage.price}€, Stock: {vintage.stock}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default Catalog;
export {};