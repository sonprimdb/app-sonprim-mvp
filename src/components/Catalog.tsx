import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, setDoc, getDoc, query, where } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Button, Card, CardContent, Typography } from '@mui/material';

interface Wine {
  id: string;
  name: string;
  year: number;
  description: string;
  price: number;
  stock: number;
}

interface Plan {
  name: string;
  discount: number;
}

const Catalog = () => {
  const [wines, setWines] = useState<Wine[]>([]);
  const [userPlan, setUserPlan] = useState<string>('None');
  const [discount, setDiscount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const winesSnap = await getDocs(collection(db, 'wines'));
        const winesData = winesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Wine));
        setWines(winesData);

        const user = auth.currentUser;
        if (user) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const planName = userDoc.data()?.plan || 'None';
          setUserPlan(planName);

          if (planName !== 'None') {
            const subsQuery = query(collection(db, 'subscriptions'), where('name', '==', planName));
            const subsSnap = await getDocs(subsQuery);
            if (!subsSnap.empty) {
              const planData = subsSnap.docs[0].data() as Plan;
              setDiscount(planData.discount || 0);
            }
          }
        }
        setLoading(false);
      } catch (error) {
        console.error('Fetch error:', error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getDiscountedPrice = (price: number) => {
    return price * (1 - discount);
  };

  const handlePurchase = async (wine: Wine) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        alert('Please login to purchase');
        return;
      }
      if (wine.stock <= 0) {
        alert('Out of stock');
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
      await updateDoc(doc(db, 'wines', wine.id), { stock: wine.stock - 1 });
      setWines(wines.map(w => w.id === wine.id ? { ...w, stock: w.stock - 1 } : w));
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
      {discount > 0 && <p>Your {userPlan} discount: {discount * 100}% off!</p>}
      {wines.length > 0 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
          {wines.map(wine => (
            <Card key={wine.id} style={{ width: '200px' }}>
              <CardContent>
                <Typography variant="h6">{wine.name} {wine.year}</Typography>
                <Typography>{wine.description}</Typography>
                <Typography>
                  Price: €{getDiscountedPrice(wine.price).toFixed(2)} 
                  {discount > 0 && <span> (Original: €{wine.price})</span>}
                </Typography>
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
export {};