import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Button, Card, CardContent, Typography } from '@mui/material';
import { doc, setDoc } from 'firebase/firestore';

interface Wine {
  id: string;
  name: string;
  year: number;
  description: string;
  price: number;
  stock: number;
}

const Catalog: React.FC = () => {
  const [wines, setWines] = useState<Wine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWines = async () => {
      try {
        const winesSnap = await getDocs(collection(db, 'wines'));
        const winesData = winesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Wine));
        setWines(winesData);
        setLoading(false);
      } catch (error) {
        console.error('Fetch wines error:', error);
        setLoading(false);
      }
    };
    fetchWines();
  }, []);

  const handlePurchase = async (wine: Wine) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        alert('Please login to purchase');
        return;
      }
      const order = {
        orderNumber: `ORDER-${Date.now()}`,
        wines: [{ name: wine.name, year: wine.year, quantity: 1 }],
        status: 'On the Way' as const,
        date: new Date().toISOString().split('T')[0],
        userId: user.uid,
      };
      await setDoc(doc(db, 'orders', order.orderNumber), order);
      await setDoc(doc(db, 'purchasedWines', `${user.uid}_${wine.name}_${wine.year}`), {
        name: wine.name,
        year: wine.year,
        quantity: 1,
        userId: user.uid,
      });
      alert('Purchase successful! Check your orders.');
    } catch (error) {
      console.error('Purchase error:', error);
      alert('Purchase failed.');
    }
  };

  if (loading) {
    return <div>Loading catalog...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Wine Catalog</h2>
      {wines.length > 0 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
          {wines.map(wine => (
            <Card key={wine.id} style={{ width: '200px' }}>
              <CardContent>
                <Typography variant="h6">{wine.name} {wine.year}</Typography>
                <Typography>{wine.description}</Typography>
                <Typography>Price: €{wine.price}</Typography>
                <Typography>Stock: {wine.stock}</Typography>
                <Button
                  variant="contained"
                  onClick={() => handlePurchase(wine)}
                  disabled={wine.stock === 0}
                >
                  Purchase
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p>No wines available.</p>
      )}
    </div>
  );
};

export default Catalog;