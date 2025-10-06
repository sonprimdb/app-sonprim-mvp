import React, { useState, useEffect } from 'react';
import { Button, TextField, List, ListItem, ListItemText, IconButton } from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { wines as catalogWines } from '../data'; // Simulated data, replace with Firestore
import { auth } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase'; // For automating emails, use Firebase Functions later

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

const AdminPanel: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stock, setStock] = useState<Wine[]>(catalogWines);
  const [selectedWine, setSelectedWine] = useState<Wine | null>(null);
  const [selectedVintage, setSelectedVintage] = useState<Vintage | null>(null);
  const [newStock, setNewStock] = useState(0);
  const [orders, setOrders] = useState<any[]>([]); // Simulated orders
  const [subscriptions, setSubscriptions] = useState<any[]>([]); // Simulated subscriptions

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      setIsAdmin(!!currentUser && currentUser.email === 'admin@sonprim.com');
      if (!!currentUser && currentUser.email === 'admin@sonprim.com') {
        // Fetch orders and subscriptions from Firestore
        // Example: getDocs(query(collection(db, 'orders')));
        const sampleOrders = [{ orderNumber: 'ORDER-123', user: 'user@email.com', status: 'On the Way' }];
        const sampleSubscriptions = [{ user: 'user@email.com', plan: 'Premium' }];
        setOrders(sampleOrders);
        setSubscriptions(sampleSubscriptions);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleUpdateStock = async () => {
    if (selectedWine && selectedVintage && newStock >= 0) {
      // Update in Firestore
      await updateDoc(doc(db, 'wines', selectedWine.id.toString()), { vintages: stock.find(w => w.id === selectedWine.id)?.vintages });
      setStock(stock.map(w => w.id === selectedWine.id ? { ...w, vintages: w.vintages.map(v => v.year === selectedVintage.year ? { ...v, stock: newStock } : v) } : w));
      alert('Stock updated and email sent to subscribers (simulated).');
    }
  };

  const handleManageOrder = (order: any) => {
    alert(`Order #${order.orderNumber} updated (simulated email to client).`);
  };

  const handleManageSubscription = (sub: any) => {
    alert(`Subscription for ${sub.user} updated (simulated email to client).`);
  };

    if (loading || !isAdmin) {
      return <p>Access denied. Admin only.</p>;
    }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Admin Panel</h2>
      <h3>Update Stock</h3>
      <List>
        {stock.map((wine) => (
          <ListItem key={wine.id}>
            <ListItemText primary={wine.name} />
            {wine.vintages.map((vintage, index) => (
              <div key={index}>
                Year: {vintage.year}, Stock: {vintage.stock}
                <IconButton onClick={() => { setSelectedWine(wine); setSelectedVintage(vintage); setNewStock(vintage.stock); }}><EditIcon /></IconButton>
              </div>
            ))}
          </ListItem>
        ))}
      </List>
      <TextField
        label="New Stock"
        type="number"
        value={newStock}
        onChange={(e) => setNewStock(parseInt(e.target.value) || 0)}
        style={{ marginBottom: '10px' }}
      />
      <Button onClick={handleUpdateStock} variant="contained">Update Stock</Button>
      <h3>Manage Orders</h3>
      <List>
        {orders.map((order, index) => (
          <ListItem key={index}>
            <ListItemText primary={`Order #${order.orderNumber} - User: ${order.user} - Status: ${order.status}`} />
            <Button onClick={() => handleManageOrder(order)}>Update</Button>
          </ListItem>
        ))}
      </List>
      <h3>Manage Subscriptions</h3>
      <List>
        {subscriptions.map((sub, index) => (
          <ListItem key={index}>
            <ListItemText primary={`User: ${sub.user} - Plan: ${sub.plan}`} />
            <Button onClick={() => handleManageSubscription(sub)}>Update</Button>
          </ListItem>
        ))}
      </List>
      <Button onClick={() => signOut(auth)}>Sign Out</Button>
    </div>
  );
};

export default AdminPanel;