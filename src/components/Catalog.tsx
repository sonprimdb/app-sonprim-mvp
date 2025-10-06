import React, { useState } from 'react';
import { wines as catalogWines } from '../data';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { auth } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface Vintage {
  year: number;
  price: number;
  stock: number;
}

interface Wine {
  name: string;
  year: number;
  quantity?: number;
}

const Catalog: React.FC = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedWine, setSelectedWine] = useState<{ name: string } | null>(null);
  const [selectedVintage, setSelectedVintage] = useState<Vintage | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [orderNumber, setOrderNumber] = useState<string>('');

  const handleBuy = (wine: { name: string }, vintage: Vintage) => {
    setSelectedWine(wine);
    setSelectedVintage(vintage);
    setQuantity(1);
    setOrderNumber(`ORDER-${Date.now()}`);
    setOpenDialog(true);
  };

  const handlePurchase = async () => {
    if (selectedVintage && quantity <= selectedVintage.stock) {
      alert(`¡Compra simulada! Order #${orderNumber} for ${quantity} bottles of ${selectedWine?.name} ${selectedVintage.year} for ${quantity * selectedVintage.price}€. (Payment pending)`);
      const user = auth.currentUser;
      if (user) {
        const userId = user.uid;
        const wineDoc = { name: selectedWine?.name, year: selectedVintage.year, quantity, userId };
        await setDoc(doc(db, 'purchasedWines', `${userId}_${wineDoc.name}_${wineDoc.year}`), wineDoc);
        const newOrder = {
          orderNumber,
          wines: [wineDoc],
          status: 'On the Way',
          date: new Date().toISOString().split('T')[0],
          userId,
        };
        await setDoc(doc(db, 'orders', orderNumber), newOrder);
      }
      setOpenDialog(false);
    } else {
      alert('Quantity exceeds available stock.');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Catalog</h2>
      {catalogWines.map((wine) => (
        <div key={wine.id} style={{ marginBottom: '15px', border: '1px solid #ccc', padding: '10px' }}>
          <h3>{wine.name} ({wine.type})</h3>
          <p>{wine.description}</p>
          <h4>Available Vintages:</h4>
          <ul>
            {wine.vintages.map((vintage, index) => (
              <li key={index}>
                Year: {vintage.year}, Price: {vintage.price}€, Stock: {vintage.stock}
                <Button variant="outlined" size="small" onClick={() => handleBuy({ name: wine.name }, vintage)} style={{ marginLeft: '10px' }}>
                  Buy
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Buy {selectedWine?.name} {selectedVintage?.year}</DialogTitle>
        <DialogContent>
          <TextField
            label="Quantity"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            fullWidth
            inputProps={{ min: 1, max: selectedVintage?.stock || 1 }}
          />
          <p>Available stock: {selectedVintage?.stock}</p>
          <p>Total: {quantity * (selectedVintage?.price || 0)}€</p>
          <p>Order #: {orderNumber}</p>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handlePurchase} variant="contained">Purchase</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Catalog;
export {};