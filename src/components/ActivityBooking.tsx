import React, { useState, useEffect } from 'react';
import { Button, TextField, Alert, CircularProgress, MenuItem, Select } from '@mui/material';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Declare gapi as a global variable
declare const gapi: any;

const ActivityBooking: React.FC = () => {
  const [activity, setActivity] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [user, setUser] = useState<any>(null);
  const [availability, setAvailability] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const checkAvailability = async () => {
    if (!user || !date || !time) {
      setAvailability(false);
      setError('Debes iniciar sesión, seleccionar una fecha y hora.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const startTime = new Date(date + 'T' + time + ':00Z').toISOString();
      const endTime = new Date(new Date(startTime).getTime() + 2 * 60 * 60 * 1000).toISOString();
      const response = await gapi.client.calendar.events.list({
        calendarId: 'CALENDAR_ID', // Reemplaza con el ID del calendario de la bodega
        timeMin: startTime,
        timeMax: endTime,
        singleEvents: true,
        orderBy: 'startTime',
      });
      const events = response.result.items || [];
      setAvailability(events.length === 0); // Disponible si no hay eventos en ese bloque
    } catch (err) {
      console.error('Error checking availability:', err);
      setAvailability(false);
      setError('Error al verificar disponibilidad. Revisa la consola.');
    }
    setLoading(false);
  };

  const handleBook = async () => {
    if (!user || !activity || !date || !time || !availability) {
      setError('Reserva no disponible o campos incompletos.');
      return;
    }
    setLoading(true);
    try {
      const startTime = new Date(date + 'T' + time + ':00Z').toISOString();
      const endTime = new Date(new Date(startTime).getTime() + 2 * 60 * 60 * 1000).toISOString();
      const event = {
        summary: `Reserva: ${activity} - ${user.email}`,
        description: `Actividad: ${activity}. Usuario: ${user.email}`,
        start: { dateTime: startTime },
        end: { dateTime: endTime },
      };
      await gapi.client.calendar.events.insert({
        calendarId: 'CALENDAR_ID', // Reemplaza con el ID del calendario de la bodega
        resource: event,
      });
      alert(`¡Reserva confirmada para ${activity} el ${date} a las ${time}!`);
      setActivity('');
      setDate('');
      setTime('');
      setAvailability(null);
    } catch (err) {
      console.error('Error booking:', err);
      setError('Error al reservar. Revisa la consola.');
    }
    setLoading(false);
  };

  // Filtra días de miércoles a sábado y horas 11:00 o 13:00
  const isValidDay = (d: Date) => {
    const day = d.getDay();
    return day >= 3 && day <= 6; // 3 = Miércoles, 6 = Sábado
  };
  const getValidTimes = (selectedDate: string) => {
    const d = new Date(selectedDate);
    return isValidDay(d) ? ['11:00', '13:00'] : [];
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Reservar Actividades</h2>
      {!user ? (
        <p>Inicia sesión para reservar.</p>
      ) : (
        <>
          <TextField
            label="Actividad"
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
            style={{ marginBottom: '10px', width: '100%' }}
          />
          <TextField
            label="Fecha"
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setTime(''); // Resetea tiempo si cambia la fecha
            }}
            style={{ marginBottom: '10px', width: '100%' }}
            InputLabelProps={{ shrink: true }}
          />
          <Select
            value={time}
            onChange={(e) => setTime(e.target.value as string)}
            displayEmpty
            style={{ marginBottom: '10px', width: '100%' }}
            disabled={!date}
          >
            <MenuItem value="" disabled>Selecciona una hora</MenuItem>
            {getValidTimes(date).map((t) => (
              <MenuItem key={t} value={t}>{t}</MenuItem>
            ))}
          </Select>
          <Button onClick={checkAvailability} disabled={!date || !time || loading} variant="outlined">
            {loading ? <CircularProgress size={24} /> : 'Verificar Disponibilidad'}
          </Button>
          {availability !== null && (
            <Alert severity={availability ? 'success' : 'warning'} style={{ marginTop: '10px' }}>
              {availability ? 'Disponible' : error || 'No disponible (fecha u hora bloqueada)'}
            </Alert>
          )}
          <Button
            variant="contained"
            color="primary"
            onClick={handleBook}
            disabled={!availability || loading || !activity}
            style={{ marginTop: '10px' }}
          >
            {loading ? <CircularProgress size={24} /> : 'Reservar'}
          </Button>
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </>
      )}
    </div>
  );
};

export default ActivityBooking;
export {};