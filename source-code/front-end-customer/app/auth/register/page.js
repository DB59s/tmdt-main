'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Layout from '@/components/layout/Layout'

const RegisterPage = () => {
  const router = useRouter()
  const [customerId, setCustomerId] = useState(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phoneNumber: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Check if there's a stored anonymous customerId
    const storedCustomerId = localStorage.getItem('customerId')
    if (storedCustomerId) {
      setCustomerId(storedCustomerId)
    } else {
      // Identify device and get a customerId if none exists
      identifyDevice()
    }
  }, [])

  const identifyDevice = async () => {
    try {
      const fingerprint = generateFingerprint() // You would implement this function
      const response = await fetch('http://localhost:8080/api/customer/device/identify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fingerprint: fingerprint,
          userAgent: navigator.userAgent,
          ipAddress: '', // This would typically be set by your backend
          browser: getBrowserInfo(),
          os: getOSInfo(),
          device: getDeviceType(),
          screen: {
            width: window.screen.width,
            height: window.screen.height
          },
          language: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        })
      })
      
      const data = await response.json()
      if (data.success) {
        setCustomerId(data.customerId)
        localStorage.setItem('customerId', data.customerId)
      }
    } catch (err) {
      console.error('Failed to identify device:', err)
    }
  }

  // Simple browser detection
  const getBrowserInfo = () => {
    const userAgent = navigator.userAgent
    if (userAgent.indexOf("Chrome") > -1) return "Chrome"
    if (userAgent.indexOf("Safari") > -1) return "Safari"
    if (userAgent.indexOf("Firefox") > -1) return "Firefox"
    if (userAgent.indexOf("MSIE") > -1 || userAgent.indexOf("Trident") > -1) return "IE"
    return "Unknown"
  }

  // Simple OS detection
  const getOSInfo = () => {
    const userAgent = navigator.userAgent
    if (userAgent.indexOf("Windows") > -1) return "Windows"
    if (userAgent.indexOf("Mac") > -1) return "MacOS"
    if (userAgent.indexOf("Linux") > -1) return "Linux"
    if (userAgent.indexOf("Android") > -1) return "Android"
    if (userAgent.indexOf("iOS") > -1) return "iOS"
    return "Unknown"
  }

  // Simple device type detection
  const getDeviceType = () => {
    if (/Mobi|Android/i.test(navigator.userAgent)) return "Mobile"
    if (/iPad|Tablet/i.test(navigator.userAgent)) return "Tablet"
    return "Desktop"
  }

  // Simple fingerprint generator (for demo purposes)
  const generateFingerprint = () => {
    return `${navigator.userAgent}-${window.screen.width}x${window.screen.height}-${new Date().getTimezoneOffset()}-${navigator.language}`
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      // Use the register endpoint with the customerId if available
      const url = customerId 
        ? `http://localhost:8080/api/customer/profile/register/${customerId}` 
        : `http://localhost:8080/api/customer/profile/register`
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Store token and customer ID
        localStorage.setItem('token', data.token)
        localStorage.setItem('customerId', data.customerId)
        router.push('/')
      } else {
        setError(data.message || 'Registration failed')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <main>
        <section className="register-area pt-100 pb-100">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-6">
                <div className="basic-login">
                  <h3 className="text-center mb-60">Create an Account</h3>
                  {error && (
                    <div className="alert alert-danger mb-30" role="alert">
                      {error}
                    </div>
                  )}
                  <form onSubmit={handleSubmit}>
                    <div className="mb-30">
                      <label htmlFor="name">Full Name <span>*</span></label>
                      <input 
                        id="name" 
                        name="name" 
                        type="text" 
                        placeholder="Enter your full name" 
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="mb-30">
                      <label htmlFor="email">Email <span>*</span></label>
                      <input 
                        id="email" 
                        name="email" 
                        type="email" 
                        placeholder="Email address" 
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="mb-30">
                      <label htmlFor="phoneNumber">Phone Number <span>*</span></label>
                      <input 
                        id="phoneNumber" 
                        name="phoneNumber" 
                        type="tel" 
                        placeholder="Phone number" 
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="mb-30">
                      <label htmlFor="password">Password <span>*</span></label>
                      <input 
                        id="password" 
                        name="password" 
                        type="password" 
                        placeholder="Create a password" 
                        value={formData.password}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="login-action mb-30">
                      <div className="remember-login">
                        <input id="terms" type="checkbox" required />
                        <label htmlFor="terms">I agree to the <a href="/terms">Terms & Conditions</a></label>
                      </div>
                    </div>
                    <button type="submit" className="tp-btn w-100" disabled={loading}>
                      {loading ? 'Creating Account...' : 'Register'}
                    </button>
                    <div className="mt-15 text-center">
                      <span>Already have an account? </span>
                      <Link href="/auth/login" className="text-primary">Login</Link>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  )
}

export default RegisterPage 