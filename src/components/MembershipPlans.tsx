import React, { useState, useEffect } from 'react';
import { memberships } from '../data';
import { Button } from '@mui/material';
import { auth } from '../firebase';
import { onAuthStateChanged, updateProfile } from 'firebase/auth';

const MembershipPlans: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const savedPlan = currentUser.displayName?.split('|')[1];
        setSelectedPlan(savedPlan || null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSubscribe = (planName: string) => {
    if (user) {
      if (selectedPlan) {
        alert("Debes cancelar tu plan actual antes de suscribirte a otro.");
        return;
      }
      updateProfile(user, { displayName: `${user.email}|${planName}` })
        .then(() => {
          setSelectedPlan(planName);
          alert(`¡Te has suscrito a ${planName}! (Funcionalidad de pago pendiente)`);
        })
        .catch((error) => {
          console.error("Error al actualizar perfil:", error);
          alert("Error al suscribirse, revisa la consola.");
        });
    }
  };

  const handleCancel = () => {
    if (user && selectedPlan) {
      updateProfile(user, { displayName: user.email })
        .then(() => {
          setSelectedPlan(null);
          alert("¡Suscripción cancelada!");
        })
        .catch((error) => {
          console.error("Error al cancelar suscripción:", error);
          alert("Error al cancelar, revisa la consola.");
        });
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Planes de Membresía</h2>
      {memberships.map((membership) => (
        <div key={membership.id} style={{ marginBottom: '15px', border: '1px solid #ccc', padding: '10px' }}>
          <h3>{membership.name}</h3>
          <p>{membership.benefits}</p>
          <p>Precio: {membership.price}€ / {membership.duration}</p>
          <Button
            variant="contained"
            color={selectedPlan === membership.name ? 'success' : 'primary'}
            onClick={() => handleSubscribe(membership.name)}
            disabled={!user || !!selectedPlan} // Deshabilita si no está logueado o ya tiene plan
          >
            {selectedPlan === membership.name ? 'Suscrito' : 'Suscribirse'}
          </Button>
        </div>
      ))}
      {selectedPlan && (
        <div style={{ marginTop: '20px' }}>
          <p>Plan seleccionado: {selectedPlan}</p>
          <Button variant="outlined" color="error" onClick={handleCancel}>
            Cancelar Suscripción
          </Button>
        </div>
      )}
    </div>
  );
};

export default MembershipPlans;
export {};