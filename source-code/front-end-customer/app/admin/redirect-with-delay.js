'use client'

import { useEffect, useState } from 'react'

export default function AdminRedirectWithDelay() {
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          window.location.href = 'http://localhost:3000'
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        textAlign: 'center',
        padding: '3rem',
        backgroundColor: 'white',
        borderRadius: '15px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
        maxWidth: '500px',
        animation: 'fadeInUp 0.6s ease-out'
      }}>
        {/* Logo or Icon */}
        <div style={{
          width: '80px',
          height: '80px',
          backgroundColor: '#667eea',
          borderRadius: '50%',
          margin: '0 auto 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
          color: 'white'
        }}>
          ⚙️
        </div>
        
        <h1 style={{ 
          color: '#333', 
          marginBottom: '1rem',
          fontSize: '2rem',
          fontWeight: 'bold'
        }}>
          Chuyển hướng đến Admin
        </h1>
        
        <p style={{ 
          color: '#666', 
          marginBottom: '2rem',
          fontSize: '1.1rem',
          lineHeight: '1.6'
        }}>
          Bạn đang được chuyển hướng đến trang quản trị trong
        </p>
        
        {/* Countdown Circle */}
        <div style={{
          position: 'relative',
          width: '100px',
          height: '100px',
          margin: '0 auto 2rem'
        }}>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '2.5rem',
            fontWeight: 'bold',
            color: '#667eea'
          }}>
            {countdown}
          </div>
          <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="#e0e0e0"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="#667eea"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (countdown / 3)}`}
              style={{
                transition: 'stroke-dashoffset 1s linear'
              }}
            />
          </svg>
        </div>
        
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => window.location.href = 'http://localhost:3000'}
            style={{
              padding: '12px 24px',
              backgroundColor: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#5a6fd8'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#667eea'}
          >
            Đi ngay
          </button>
          
          <button
            onClick={() => window.history.back()}
            style={{
              padding: '12px 24px',
              backgroundColor: 'transparent',
              color: '#667eea',
              border: '2px solid #667eea',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#667eea'
              e.target.style.color = 'white'
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = 'transparent'
              e.target.style.color = '#667eea'
            }}
          >
            Quay lại
          </button>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
