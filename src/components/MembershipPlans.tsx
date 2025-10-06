import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Button, Card, CardContent, Typography } from '@mui/material';
import { getFunctions, httpsCallable } from 'firebase/functions'; // Add this import

interface Plan {
  id: string;
  name: string;
  benefits: string;
  price: number;
  stripePriceId: string; // Add to subscriptions in Firestore
}

const MembershipPlans: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [userPlan, setUserPlan] = useState<string>('None');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const plansSnap = await getDocs(collection(db, 'subscriptions'));
        setPlans(plansSnap.docs.map(d => ({ id: d.id, ...d.data() } as Plan)));

        const user = auth.currentUser;
        if (user) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          setUserPlan(userDoc.data()?.plan || 'None');
        }
        setLoading(false);
      } catch (error) {
        console.error('Fetch error:', error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubscribe = async (plan: Plan) => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const functions = getFunctions();
      const createCheckoutSession = httpsCallable(functions, 'createCheckoutSession');
      const result = await createCheckoutSession({ planId: plan.stripePriceId });
      const data = result.data as { url: string };
      const url = data.url;
      window.location.href = url; // Redirect using URL
    } catch (error) {
      console.error('Subscribe error:', error);
    }
  };

  if (loading) {
    return <div>Loading plans...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Subscription Plans</h2>
      <p>Current Plan: {userPlan}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
        {plans.map(plan => (
          <Card key={plan.id} style={{ width: '200px' }}>
            <CardContent>
              <Typography variant="h6">{plan.name}</Typography>
              <Typography>{plan.benefits}</Typography>
              <Typography>Price: €{plan.price}/year</Typography>
              <Button
                variant="contained"
                onClick={() => handleSubscribe(plan)}
                disabled={userPlan === plan.name}
              >
                {userPlan === plan.name ? 'Subscribed' : 'Subscribe'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MembershipPlans;
export {};