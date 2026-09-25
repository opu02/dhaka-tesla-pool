 
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { requestRide, getMyRides, cancelRide } from '@/lib/api';

const DHAKA_AREAS = [
  'Banani', 'Gulshan1', 'Mohakhali', 'Dhanmondi',
  'Mirpur', 'Uttara', 'Farmgate', 'Bashundhara'
];

const AREA_COORDS: any = {
  Banani: { lat: 23.7937, lng: 90.4066 },
  Gulshan1: { lat: 23.7807, lng: 90.4148 },
  Mohakhali: { lat: 23.7799, lng: 90.4023 },
  Dhanmondi: { lat: 23.7461, lng: 90.3742 },
  Mirpur: { lat: 23.8223, lng: 90.3654 },
  Uttara: { lat: 23.8759, lng: 90.3795 },
  Farmgate: { lat: 23.7593, lng: 90.3919 },
  Bashundhara: { lat: 23.8141, lng: 90.4238 },
};

export default function PassengerPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'request' | 'history'>('request');
  const [form, setForm] = useState({
    pickupArea: 'Banani',
    destinationArea: 'Mohakhali',
    seatsRequested: 1,
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const userData = localStorage.getItem('user');

    if (!token || role !== 'PASSENGER') {
      router.push('/login');
      return;
    }

    if (userData) setUser(JSON.parse(userData));
    fetchRides();
  }, []);

  const fetchRides = async () => {
    try {
      const res = await getMyRides();
      setRides(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRequestRide = async () => {
    if (form.pickupArea === form.destinationArea) {
      toast.error('Pickup and destination cannot be the same!');
      return;
    }
    setLoading(true);
    try {
      const coords = AREA_COORDS[form.pickupArea];
      const res = await requestRide({
        ...form,
        pickupLat: coords.lat,
        pickupLng: coords.lng,
      });

      if (res.data.matched) {
        toast.success('🎉 Matched with a Tesla! Your pool is ready.');
      } else {
        toast.success('Ride requested! Waiting for a driver...');
      }

      fetchRides();
      setActiveTab('history');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to request ride');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await cancelRide(id);
      toast.success('Ride cancelled');
      fetchRides();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Cannot cancel');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  const getStatusClass = (status: string) =>
    `status-badge status-${status.toLowerCase()}`;

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Navbar */}
      <nav className="navbar">
        <div className="logo">🛺 Tesla Pool</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
            👤 {user?.name}
          </span>
          <button
            onClick={handleLogout}
            style={{
              background: 'rgba(233,69,96,0.2)',
              border: '1px solid rgba(233,69,96,0.4)',
              color: '#e94560',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            Logout
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px' }}>
        {/* Tab buttons */}
        <div style={{
          display: 'flex',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '12px',
          padding: '4px',
          marginBottom: '24px',
        }}>
          <button
            onClick={() => setActiveTab('request')}
            style={{
              flex: 1, padding: '10px', border: 'none', borderRadius: '10px',
              background: activeTab === 'request' ? 'rgba(233,69,96,0.8)' : 'transparent',
              color: 'white', fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s',
            }}
          >
            🚕 Request Ride
          </button>
          <button
            onClick={() => { setActiveTab('history'); fetchRides(); }}
            style={{
              flex: 1, padding: '10px', border: 'none', borderRadius: '10px',
              background: activeTab === 'history' ? 'rgba(233,69,96,0.8)' : 'transparent',
              color: 'white', fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s',
            }}
          >
            📋 My Rides ({rides.length})
          </button>
        </div>

        {/* Request Ride Tab */}
        {activeTab === 'request' && (
          <div className="card">
            <h2 style={{ marginBottom: '24px', fontSize: '20px', fontWeight: 700 }}>
              Request a Ride
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', marginBottom: '8px', display: 'block' }}>
                  📍 Pickup Area
                </label>
                <select
                  className="input-field"
                  value={form.pickupArea}
                  onChange={(e) => setForm({ ...form, pickupArea: e.target.value })}
                >
                  {DHAKA_AREAS.map((area) => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', marginBottom: '8px', display: 'block' }}>
                  🏁 Destination
                </label>
                <select
                  className="input-field"
                  value={form.destinationArea}
                  onChange={(e) => setForm({ ...form, destinationArea: e.target.value })}
                >
                  {DHAKA_AREAS.map((area) => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', marginBottom: '8px', display: 'block' }}>
                  👥 Seats Needed
                </label>
                <select
                  className="input-field"
                  value={form.seatsRequested}
                  onChange={(e) => setForm({ ...form, seatsRequested: Number(e.target.value) })}
                >
                  <option value={1}>1 Seat</option>
                  <option value={2}>2 Seats</option>
                  <option value={3}>3 Seats</option>
                </select>
              </div>

              <div className="fare-display">
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginBottom: '4px' }}>
                  ESTIMATED FARE
                </p>
                <div className="fare-amount">৳ 30 - 60</div>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginTop: '4px' }}>
                  Pool discount applied if matched
                </p>
              </div>

              <button
                className="btn-primary"
                onClick={handleRequestRide}
                disabled={loading}
                style={{ opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Finding your Tesla...' : '🛺 Request Ride'}
              </button>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div>
            <h2 style={{ marginBottom: '16px', fontSize: '20px', fontWeight: 700 }}>
              My Rides
            </h2>

            {rides.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛺</div>
                <p style={{ color: 'rgba(255,255,255,0.5)' }}>No rides yet. Request your first ride!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {rides.map((ride) => (
                  <div key={ride.id} className="ride-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <p style={{ fontWeight: 700, marginBottom: '4px' }}>
                          {ride.pickupArea} → {ride.destinationArea}
                        </p>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>
                          {new Date(ride.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <span className={getStatusClass(ride.status)}>
                        {ride.status}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ color: '#fdcb6e', fontWeight: 700, fontSize: '18px' }}>
                          ৳ {(ride.farePaisa / 100).toFixed(0)}
                        </span>
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginLeft: '8px' }}>
                          {ride.seatsRequested} seat(s)
                        </span>
                      </div>

                      {['REQUESTED', 'MATCHED'].includes(ride.status) && (
                        <button
                          className="btn-danger"
                          onClick={() => handleCancel(ride.id)}
                          style={{ padding: '6px 14px', fontSize: '12px' }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>

                    {ride.pool?.vehicle && (
                      <div style={{
                        marginTop: '12px',
                        padding: '10px',
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '8px',
                        fontSize: '13px',
                      }}>
                        🚗 {ride.pool.vehicle.name} • Driver: {ride.pool.vehicle.driver?.name}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}