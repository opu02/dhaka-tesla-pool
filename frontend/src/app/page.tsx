'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token) {
      router.push('/login');
    } else if (role === 'DRIVER') {
      router.push('/driver');
    } else {
      router.push('/passenger');
    }
  }, [router]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div className="logo" style={{ fontSize: '32px', marginBottom: '16px' }}>
          🛺 Dhaka Tesla Pool
        </div>
        <p style={{ color: 'rgba(255,255,255,0.5)' }}>Loading...</p>
      </div>
    </div>
  );
}