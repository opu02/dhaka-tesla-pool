 
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  getMyVehicle,
  toggleOnline,
  getPendingRides,
  getDriverRides,
  acceptRide,
  updateRideStatus,
  createVehicle,
} from '@/lib/api';

export default function DriverPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [vehicle, setVehicle] = useState<any>(null);
  const [pendingRides, setPendingRides] = useState<any[]>([]);
  const [myPools, setMyPools] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pending' | 'pools'>('dashboard');
  const [loading, setLoading] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ name: '', capacity: 3 });
  const [showVehicleForm, setShowVehicleForm] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const userData = localStorage.getItem('user');

    if (!token || role !== 'DRIVER') {
      router.push('/login');
      return;
    }

    if (userData) setUser(JSON.parse(userData));
    fetchVehicle();
    fetchPendingRides();
    fetchMyPools();
  }, []);

  const fetchVehicle = async () => {
    try {
      const res = await getMyVehicle();
      setVehicle(res.data);
    } catch {
      setVehicle(null);
    }
  };

  const fetchPendingRides = async () => {
    try {
      const res = await getPendingRides();
      setPendingRides(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMyPools = async () => {
    try {
      const res = await getDriverRides();
      setMyPools(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateVehicle = async () => {
    if (!newVehicle.name) {
      toast.error('Enter vehicle name');
      return;
    }
    setLoading(true);
    try {
      await createVehicle(newVehicle);
      toast.success('🚗 Vehicle registered!');
      setShowVehicleForm(false);
      fetchVehicle();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleOnline = async () => {
    try {
      const res = await toggleOnline();
      setVehicle({ ...vehicle, isOnline: res.data.isOnline });
      toast.success(res.data.isOnline ? '🟢 You are now online!' : '🔴 You are offline');
    } catch (err: any) {
      toast.error('Failed to toggle status');
    }
  };

  const handleAcceptRide = async (rideId: string) => {
    try {
      await acceptRide(rideId);
      toast.success('✅ Ride accepted!');
      fetchPendingRides();
      fetchMyPools();
      setActiveTab('pools');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleUpdateStatus = async (rideId: string, status: string) => {
    try {
      await updateRideStatus(rideId, status);
      toast.success(`Status updated to ${status}`);
      fetchMyPools();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid transition');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  const getNextStatus = (current: string) => {
    const map: any = {
      MATCHED: 'DRIVER_ARRIVED',
      DRIVER_ARRIVED: 'STARTED',
      STARTED: 'COMPLETED',
    };
    return map[current];
  };

  const getStatusClass = (status: string) =>
    `status-badge status-${status.toLowerCase()}`;

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Navbar */}
      <nav className="navbar">
        <div className="logo">🛺 Tesla Pool</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {vehicle && (
            <span style={{
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 700,
              background: vehicle.isOnline ? 'rgba(0,184,148,0.2)' : 'rgba(214,48,49,0.2)',
              color: vehicle.isOnline ? '#00b894' : '#e17055',
            }}>
              {vehicle.isOnline ? '🟢 Online' : '🔴 Offline'}
            </span>
          )}
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
            🚗 {user?.name}
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

      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '24px' }}>
        {/* Tabs */}
        <div style={{
          display: 'flex',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '12px',
          padding: '4px',
          marginBottom: '24px',
          gap: '4px',
        }}>
          {[
            { key: 'dashboard', label: '🏠 Dashboard' },
            { key: 'pending', label: `🔔 Pending (${pendingRides.length})` },
            { key: 'pools', label: `🚗 My Pools (${myPools.length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key as any);
                if (tab.key === 'pending') fetchPendingRides();
                if (tab.key === 'pools') fetchMyPools();
              }}
              style={{
                flex: 1, padding: '10px', border: 'none', borderRadius: '10px',
                background: activeTab === tab.key ? 'rgba(233,69,96,0.8)' : 'transparent',
                color: 'white', fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.3s', fontSize: '13px',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {!vehicle ? (
              <div className="card">
                <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>Register Your Tesla</h3>
                {!showVehicleForm ? (
                  <button className="btn-primary" onClick={() => setShowVehicleForm(true)}>
                    + Add Vehicle
                  </button>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <input
                      className="input-field"
                      placeholder="Vehicle name (e.g. Bullet)"
                      value={newVehicle.name}
                      onChange={(e) => setNewVehicle({ ...newVehicle, name: e.target.value })}
                    />
                    <select
                      className="input-field"
                      value={newVehicle.capacity}
                      onChange={(e) => setNewVehicle({ ...newVehicle, capacity: Number(e.target.value) })}
                    >
                      <option value={1}>1 Seat</option>
                      <option value={2}>2 Seats</option>
                      <option value={3}>3 Seats</option>
                    </select>
                    <button className="btn-primary" onClick={handleCreateVehicle} disabled={loading}>
                      {loading ? 'Registering...' : 'Register Vehicle'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>
                      🚗 {vehicle.name}
                    </h3>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
                      Capacity: {vehicle.capacity} seats
                    </p>
                  </div>
                  <button
                    onClick={handleToggleOnline}
                    style={{
                      padding: '10px 20px',
                      border: 'none',
                      borderRadius: '12px',
                      background: vehicle.isOnline
                        ? 'rgba(214,48,49,0.3)'
                        : 'rgba(0,184,148,0.3)',
                      color: vehicle.isOnline ? '#e17055' : '#00b894',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    {vehicle.isOnline ? 'Go Offline' : 'Go Online'}
                  </button>
                </div>

                {/* Stats */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  marginTop: '20px',
                }}>
                  <div style={{
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '12px',
                    padding: '16px',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: '#fdcb6e' }}>
                      {pendingRides.length}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>
                      Pending Rides
                    </div>
                  </div>
                  <div style={{
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '12px',
                    padding: '16px',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: '#00b894' }}>
                      {myPools.length}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>
                      Total Pools
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pending Rides Tab */}
        {activeTab === 'pending' && (
          <div>
            <h2 style={{ marginBottom: '16px', fontSize: '20px', fontWeight: 700 }}>
              Pending Ride Requests
            </h2>
            {pendingRides.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔔</div>
                <p style={{ color: 'rgba(255,255,255,0.5)' }}>No pending rides right now</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {pendingRides.map((ride) => (
                  <div key={ride.id} className="ride-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: '16px' }}>
                          {ride.pickupArea} → {ride.destinationArea}
                        </p>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginTop: '4px' }}>
                          👤 {ride.passenger?.name} • {ride.seatsRequested} seat(s)
                        </p>
                      </div>
                      <span style={{ color: '#fdcb6e', fontWeight: 700, fontSize: '18px' }}>
                        ৳{(ride.farePaisa / 100).toFixed(0)}
                      </span>
                    </div>
                    <button
                      className="btn-success"
                      onClick={() => handleAcceptRide(ride.id)}
                      style={{ width: '100%' }}
                    >
                      ✅ Accept Ride
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* My Pools Tab */}
        {activeTab === 'pools' && (
          <div>
            <h2 style={{ marginBottom: '16px', fontSize: '20px', fontWeight: 700 }}>
              My Pools
            </h2>
            {myPools.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚗</div>
                <p style={{ color: 'rgba(255,255,255,0.5)' }}>No active pools yet</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {myPools.map((pool) => (
                  <div key={pool.id} className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <h3 style={{ fontWeight: 700 }}>Pool</h3>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 600,
                        background: pool.availableSeats > 0
                          ? 'rgba(0,184,148,0.2)'
                          : 'rgba(214,48,49,0.2)',
                        color: pool.availableSeats > 0 ? '#00b894' : '#e17055',
                      }}>
                        {pool.availableSeats} seat(s) left
                      </span>
                    </div>

                    {pool.rideRequests?.map((ride: any) => (
                      <div key={ride.id} style={{
                        padding: '12px',
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '10px',
                        marginBottom: '10px',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <div>
                            <p style={{ fontWeight: 600, fontSize: '14px' }}>
                              {ride.pickupArea} → {ride.destinationArea}
                            </p>
                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>
                              👤 {ride.passenger?.name}
                            </p>
                          </div>
                          <span className={getStatusClass(ride.status)}>
                            {ride.status}
                          </span>
                        </div>

                        {getNextStatus(ride.status) && (
                          <button
                            className="btn-success"
                            onClick={() => handleUpdateStatus(ride.id, getNextStatus(ride.status))}
                            style={{ width: '100%', fontSize: '13px', padding: '8px' }}
                          >
                            Mark as {getNextStatus(ride.status)}
                          </button>
                        )}
                      </div>
                    ))}
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