'use client'

import { useEffect } from 'react'

export default function AdminRedirect() {
  useEffect(() => {
    // Redirect to localhost:3000 immediately when component mounts
    window.location.href = 'http://localhost:3000'
  }, [])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        textAlign: 'center',
        padding: '2rem',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        maxWidth: '400px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #007bff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1rem'
        }}></div>

        <h2 style={{ color: '#333', marginBottom: '1rem' }}>
          Đang chuyển hướng...
        </h2>

        <p style={{ color: '#666', marginBottom: '1.5rem' }}>
          Bạn đang được chuyển hướng đến trang quản trị.
        </p>

        <p style={{ fontSize: '0.9rem', color: '#999' }}>
          Nếu không tự động chuyển hướng,
          <a
            href="http://localhost:3000"
            style={{ color: '#007bff', textDecoration: 'none', marginLeft: '5px' }}
          >
            nhấn vào đây
          </a>
        </p>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}