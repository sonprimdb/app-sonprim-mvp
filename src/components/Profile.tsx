import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, List, ListItem, ListItemText } from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { memberships } from '../data';
import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase'; // Asegúrate de exportar db desde firebase.ts

interface Wine {
  name: string;
  year: number;
  quantity?: number;
  notes?: string;
  orderNumber?: string;
}

interface Order {
  orderNumber: string;
  wines: Wine[];
  status: 'On the Way' | 'Pick Up' | 'Completed';
  date: string;
  userId: string;
}

const Profile: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [purchasedWines, setPurchasedWines] = useState<Wine[]>([]);
  const [ordersInProcess, setOrdersInProcess] = useState<Order[]>([]);
  const [cellarWines, setCellarWines] = useState<Wine[]>([]);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [addType, setAddType] = useState<'purchased' | 'cellar'>('purchased');
  const [newWine, setNewWine] = useState<Wine>({ name: '', year: 0, quantity: 1 });
  const [editWine, setEditWine] = useState<Wine | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        const userId = currentUser.uid;
        // Fetch data from Firestore
        const purchasedQuery = query(collection(db, 'purchasedWines'), where('userId', '==', userId));
        const ordersQuery = query(collection(db, 'orders'), where('userId', '==', userId));
        const cellarQuery = query(collection(db, 'cellarWines'), where('userId', '==', userId));

        const [purchasedSnap, ordersSnap, cellarSnap] = await Promise.all([
          getDocs(purchasedQuery),
          getDocs(ordersQuery),
          getDocs(cellarQuery),
        ]);

        setPurchasedWines(purchasedSnap.docs.map(doc => doc.data() as Wine));
        setOrdersInProcess(ordersSnap.docs.map(doc => doc.data() as Order));
        setCellarWines(cellarSnap.docs.map(doc => doc.data() as Wine));
      }
    });
    return () => unsubscribe();
  }, []);

  const handleAddWine = async () => {
    if (newWine.name && newWine.year && user) {
      const userId = user.uid;
      const wineDoc = { ...newWine, userId };
      if (addType === 'purchased') {
        await setDoc(doc(db, 'purchasedWines', `${userId}_${newWine.name}_${newWine.year}`), wineDoc);
  const newOrder: Order = { orderNumber: `ORDER-${Date.now()}`, wines: [newWine], status: "On the Way" as const, date: new Date().toISOString().split('T')[0], userId };
        await setDoc(doc(db, 'orders', newOrder.orderNumber), newOrder);
        setPurchasedWines([...purchasedWines, newWine]);
      } else {
        await setDoc(doc(db, 'cellarWines', `${userId}_${newWine.name}_${newWine.year}`), wineDoc);
        setCellarWines([...cellarWines, newWine]);
      }
      setNewWine({ name: '', year: 0, quantity: 1 });
      setOpenAddDialog(false);
    }
  };

  const handleCompleteOrder = async (order: Order) => {
    const userId = user?.uid;
    if (userId) {
      const cellarUpdate = order.wines.map(w => ({ ...w, userId, orderNumber: order.orderNumber }));
      await Promise.all(cellarUpdate.map(wine => 
        setDoc(doc(db, 'cellarWines', `${userId}_${wine.name}_${wine.year}`), wine)
      ));
      await deleteDoc(doc(db, 'orders', order.orderNumber));
      setCellarWines([...cellarWines, ...cellarUpdate]);
      setOrdersInProcess(ordersInProcess.filter(o => o !== order));
    }
  };

  const handleDeleteWine = async (wineToDelete: Wine, type: 'purchased' | 'cellar') => {
    const userId = user?.uid;
    if (userId) {
      const docId = `${userId}_${wineToDelete.name}_${wineToDelete.year}`;
      if (type === 'purchased') {
        await deleteDoc(doc(db, 'purchasedWines', docId));
        setPurchasedWines(purchasedWines.filter(w => w !== wineToDelete));
      } else {
        await deleteDoc(doc(db, 'cellarWines', docId));
        setCellarWines(cellarWines.filter(w => w !== wineToDelete));
      }
    }
  };

  const handleEditWine = (wine: Wine) => {
    setEditWine(wine);
    setOpenEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (editWine && editWine.quantity !== undefined && user) {
      const userId = user.uid;
      await updateDoc(doc(db, 'cellarWines', `${userId}_${editWine.name}_${editWine.year}`), { ...editWine });
      setCellarWines(cellarWines.map(w => w === editWine ? editWine : w));
      setOpenEditDialog(false);
      setEditWine(null);
    }
  };

  if (loading) {
    return <div>Loading profile...</div>;
  }

  const plan = user?.displayName?.split('|')[1] || 'None';
  const activeMembership = memberships.find(m => m.name === plan) || null;

  return (
    <div style={{ padding: '20px' }}>
      {user ? (
        <>
          <h2>Profile</h2>
          <p>Welcome, {user.displayName?.split('|')[0] || user.email}</p>
          <p>Email: {user.email}</p>
          <p>Current Plan: {plan}</p>
          {activeMembership && (
            <div style={{ marginTop: '10px', padding: '10px', border: '1px solid #ddd' }}>
              <h4>Benefits of your plan:</h4>
              <p>{activeMembership.benefits}</p>
            </div>
          )}
          <h3>Purchase Wines</h3>
          <Button onClick={() => { setAddType('purchased'); setOpenAddDialog(true); }}>Add Purchase</Button>
          {purchasedWines.length > 0 ? (
            <List>
              {purchasedWines.map((wine, index) => (
                <ListItem key={index}>
                  <ListItemText primary={`${wine.name} - ${wine.year}`} />
                  <IconButton onClick={() => handleDeleteWine(wine, 'purchased')}><DeleteIcon /></IconButton>
                </ListItem>
              ))}
            </List>
          ) : (
            <p>No purchases yet.</p>
          )}
          <h3>Orders in Process</h3>
          {ordersInProcess.length > 0 ? (
            <List>
              {ordersInProcess.map((order, index) => (
                <ListItem key={index}>
                  <ListItemText primary={`Order #${order.orderNumber} - Status: ${order.status} - Date: ${order.date}`} secondary={order.wines.map(w => `${w.name} ${w.year} x${w.quantity || 1}`).join(', ')} />
                  <Button onClick={() => handleCompleteOrder(order)} variant="contained">Complete Order</Button>
                </ListItem>
              ))}
            </List>
          ) : (
            <p>No orders in process.</p>
          )}
          <h3>Private Collection Cellar</h3>
          <Button onClick={() => { setAddType('cellar'); setOpenAddDialog(true); }}>Add Manual Wine</Button>
          {cellarWines.length > 0 ? (
            <List>
              {cellarWines.map((wine, index) => (
                <ListItem key={index}>
                  <ListItemText primary={`${wine.name} - ${wine.year}`} secondary={`Quantity: ${wine.quantity || 0}${wine.orderNumber ? ` (Order #${wine.orderNumber})` : ''}`} />
                  <IconButton onClick={() => handleEditWine(wine)}><EditIcon /></IconButton>
                  <IconButton onClick={() => handleDeleteWine(wine, 'cellar')}><DeleteIcon /></IconButton>
                </ListItem>
              ))}
            </List>
          ) : (
            <p>No wines in your cellar.</p>
          )}
          <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)}>
            <DialogTitle>Add {addType === 'purchased' ? 'Purchase' : 'Manual Wine to Cellar'}</DialogTitle>
            <DialogContent>
              <TextField
                label="Wine Name"
                value={newWine.name}
                onChange={(e) => setNewWine({ ...newWine, name: e.target.value })}
                fullWidth
                style={{ marginBottom: '10px' }}
              />
              <TextField
                label="Year"
                type="number"
                value={newWine.year}
                onChange={(e) => setNewWine({ ...newWine, year: parseInt(e.target.value) || 0 })}
                fullWidth
                style={{ marginBottom: '10px' }}
              />
              <TextField
                label="Quantity"
                type="number"
                value={newWine.quantity}
                onChange={(e) => setNewWine({ ...newWine, quantity: parseInt(e.target.value) || 1 })}
                fullWidth
                inputProps={{ min: 1 }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
              <Button onClick={handleAddWine} variant="contained">Add</Button>
            </DialogActions>
          </Dialog>
          <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)}>
            <DialogTitle>Edit Wine in Cellar</DialogTitle>
            <DialogContent>
              <TextField
                label="Wine Name"
                value={editWine?.name || ''}
                fullWidth
                style={{ marginBottom: '10px' }}
                disabled
              />
              <TextField
                label="Year"
                type="number"
                value={editWine?.year || 0}
                fullWidth
                style={{ marginBottom: '10px' }}
                disabled
              />
              <TextField
                label="Quantity"
                type="number"
                value={editWine?.quantity || 0}
                onChange={(e) => setEditWine({ ...editWine!, quantity: parseInt(e.target.value) || 0 })}
                fullWidth
                inputProps={{ min: 1 }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
              <Button onClick={handleSaveEdit} variant="contained">Save</Button>
            </DialogActions>
          </Dialog>
          <Button variant="contained" color="secondary" onClick={() => signOut(auth)}>
            Sign Out
          </Button>
        </>
      ) : (
        <p>You are not logged in. Sign in to view your profile.</p>
      )}
    </div>
  );
};

export default Profile;
export {};