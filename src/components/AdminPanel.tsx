import React, { useState, useEffect } from 'react';
import { Button, TextField, List, ListItem, ListItemText, IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import Papa from 'papaparse'; // Install: npm install papaparse

interface Wine {
  id: string;
  name: string;
  year: number;
  description: string;
  price: number;
  stock: number;
  quantity?: number;
}

interface Order {
  orderNumber: string;
  wines: Wine[];
  status: 'On the Way' | 'Pick Up' | 'Completed';
  date: string;
  userId: string;
}

interface User {
  id: string;
  email: string;
  plan: string;
  joined: string;
}

const AdminPanel: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [wines, setWines] = useState<Wine[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [openWineDialog, setOpenWineDialog] = useState(false);
  const [openOrderDialog, setOpenOrderDialog] = useState(false);
  const [selectedWine, setSelectedWine] = useState<Wine | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newWine, setNewWine] = useState<Wine>({ id: '', name: '', year: 0, description: '', price: 0, stock: 0 });
  const [newStatus, setNewStatus] = useState<'On the Way' | 'Pick Up' | 'Completed'>('On the Way');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser && currentUser.email === 'admin@sonprim.com') {
        try {
          const winesSnap = await getDocs(collection(db, 'wines'));
          setWines(winesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Wine)));

          const ordersSnap = await getDocs(collection(db, 'orders'));
          setOrders(ordersSnap.docs.map(d => ({ orderNumber: d.id, ...d.data() } as Order)));

          const usersSnap = await getDocs(collection(db, 'users'));
          setUsers(usersSnap.docs.map(d => ({ id: d.id, ...d.data() } as User)));
        } catch (error) {
          console.error('Fetch error:', error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleAddEditWine = async () => {
    try {
      if (selectedWine) {
        const { id, ...wineData } = newWine;
        await updateDoc(doc(db, 'wines', selectedWine.id), wineData);
        setWines(wines.map(w => w.id === selectedWine.id ? { ...newWine, id: selectedWine.id } : w));
      } else {
        const newRef = doc(collection(db, 'wines'));
        await setDoc(newRef, newWine);
        setWines([...wines, { ...newWine, id: newRef.id }]);
      }
      setOpenWineDialog(false);
      setSelectedWine(null);
      setNewWine({ id: '', name: '', year: 0, description: '', price: 0, stock: 0 });
    } catch (error) {
      console.error('Wine update error:', error);
    }
  };

  const handleDeleteWine = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'wines', id));
      setWines(wines.filter(w => w.id !== id));
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleUpdateOrder = async () => {
    try {
      if (selectedOrder) {
        await updateDoc(doc(db, 'orders', selectedOrder.orderNumber), { status: newStatus });
        setOrders(orders.map(o => o.orderNumber === selectedOrder.orderNumber ? { ...o, status: newStatus } : o));
        setOpenOrderDialog(false);
        setSelectedOrder(null);
      }
    } catch (error) {
      console.error('Order update error:', error);
    }
  };

  const exportReport = (data: any[], filename: string) => {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
  };

  if (loading || !user || user.email !== 'admin@sonprim.com') {
    return <div>Access denied. Admin only.</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Admin Panel</h2>
      <Button variant="contained" color="secondary" onClick={() => signOut(auth)}>Sign Out</Button>
      <h3>Manage Wines</h3>
      <Button onClick={() => setOpenWineDialog(true)}>Add New Wine</Button>
      <List>
        {wines.map(wine => (
          <ListItem key={wine.id}>
            <ListItemText primary={`${wine.name} ${wine.year} - €${wine.price} (Stock: ${wine.stock})`} secondary={wine.description} />
            <IconButton onClick={() => { setSelectedWine(wine); setNewWine(wine); setOpenWineDialog(true); }}><EditIcon /></IconButton>
            <IconButton onClick={() => handleDeleteWine(wine.id)}><DeleteIcon /></IconButton>
          </ListItem>
        ))}
      </List>
      <h3>Manage Orders</h3>
      <List>
        {orders.map(order => (
          <ListItem key={order.orderNumber}>
            <ListItemText primary={`Order #${order.orderNumber} - Status: ${order.status}`} secondary={order.wines.map(w => `${w.name} x${w.quantity || 1}`).join(', ')} />
            <IconButton onClick={() => { setSelectedOrder(order); setNewStatus(order.status); setOpenOrderDialog(true); }}><EditIcon /></IconButton>
          </ListItem>
        ))}
      </List>
      <Button onClick={() => exportReport(orders.map(o => ({ ...o, wines: o.wines.map(w => w.name).join(',') })), 'orders_report')}>Export Orders CSV</Button>
      <h3>Client Subscriptions & Activity</h3>
      <List>
        {users.map(u => (
          <ListItem key={u.id}>
            <ListItemText primary={`${u.email} - Plan: ${u.plan}`} secondary={`Joined: ${u.joined}`} />
          </ListItem>
        ))}
      </List>
      <Button onClick={() => exportReport(users, 'clients_report')}>Export Clients CSV</Button>

      <Dialog open={openWineDialog} onClose={() => setOpenWineDialog(false)}>
        <DialogTitle>{selectedWine ? 'Edit Wine' : 'Add Wine'}</DialogTitle>
        <DialogContent>
          <TextField label="Name" value={newWine.name} onChange={e => setNewWine({ ...newWine, name: e.target.value })} fullWidth />
          <TextField label="Year" type="number" value={newWine.year} onChange={e => setNewWine({ ...newWine, year: parseInt(e.target.value) || 0 })} fullWidth />
          <TextField label="Description" value={newWine.description} onChange={e => setNewWine({ ...newWine, description: e.target.value })} fullWidth />
          <TextField label="Price" type="number" value={newWine.price} onChange={e => setNewWine({ ...newWine, price: parseFloat(e.target.value) || 0 })} fullWidth />
          <TextField label="Stock" type="number" value={newWine.stock} onChange={e => setNewWine({ ...newWine, stock: parseInt(e.target.value) || 0 })} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenWineDialog(false)}>Cancel</Button>
          <Button onClick={handleAddEditWine} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openOrderDialog} onClose={() => setOpenOrderDialog(false)}>
        <DialogTitle>Update Order Status</DialogTitle>
        <DialogContent>
          <TextField select label="Status" value={newStatus} onChange={e => setNewStatus(e.target.value as any)} fullWidth SelectProps={{ native: true }}>
            <option value="On the Way">On the Way</option>
            <option value="Pick Up">Pick Up</option>
            <option value="Completed">Completed</option>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenOrderDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdateOrder} variant="contained">Update</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AdminPanel;