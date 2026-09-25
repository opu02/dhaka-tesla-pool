'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { login, register } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'PASSENGER',
    phone: '',
  });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let res;
      if (isLogin) {
        res = await login({ email: form.email, password: form.password });
      } else {
        res = await register(form);
      }

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.user.role);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      toast.success(`Welcome, ${res.data.user.name}! 🛺`);

      if (res.data.user.role === 'DRIVER') {
        router.push('/driver');
      } else {
        router.push('/passenger');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🛺</div>
          <div className="logo" style={{ fontSize: '28px' }}>Dhaka Tesla Pool</div>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '8px', fontSize: '14px' }}>
            Share a seat. Split the fare. Survive Dhaka traffic.
          </p>
        </div>

        {/* Card */}
        <div className="card">
          {/* Toggle */}
          <div style={{
            display: 'flex',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '12px',
            padding: '4px',
            marginBottom: '24px',
          }}>
            <button
              onClick={() => setIsLogin(true)}
              style={{
                flex: 1, padding: '10px', border: 'none', borderRadius: '10px',
                background: isLogin ? 'rgba(233,69,96,0.8)' : 'transparent',
                color: 'white', fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s',
              }}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              style={{
                flex: 1, padding: '10px', border: 'none', borderRadius: '10px',
                background: !isLogin ? 'rgba(233,69,96,0.8)' : 'transparent',
                color: 'white', fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s',
              }}
            >
              Register
            </button>
          </div>

          {/* Fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {!isLogin && (
              <input
                className="input-field"
                placeholder="Full Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
            )}
            <input
              className="input-field"
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
            <input
              className="input-field"
              placeholder="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
            {!isLogin && (
              <>
                <input
                  className="input-field"
                  placeholder="Phone (optional)"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                />
                <select
                  className="input-field"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="PASSENGER">🧑 Passenger</option>
                  <option value="DRIVER">🚗 Driver</option>
                </select>
              </>
            )}

            <button
              className="btn-primary"
              onClick={handleSubmit}
              disabled={loading}
              style={{ marginTop: '8px', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Please wait...' : isLogin ? 'Login' : 'Create Account'}
            </button>
          </div>

          {/* Demo credentials */}
          <div style={{
            marginTop: '24px',
            padding: '16px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginBottom: '8px', fontWeight: 600 }}>
              DEMO CREDENTIALS
            </p>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>
              🚗 Driver: jashim@tesla.bd / jashim123
            </p>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginTop: '4px' }}>
              🧑 Passenger: nusrat@passenger.bd / nusrat123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}