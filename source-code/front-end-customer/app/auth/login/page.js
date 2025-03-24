'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Layout from '@/components/layout/Layout'

const LoginPage = () => {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
      const response = await fetch('http://localhost:8080/api/customer/profile/login', {
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
        setError(data.message || 'Login failed')
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
        <section className="login-area pt-100 pb-100">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-6">
                <div className="basic-login">
                  <h3 className="text-center mb-60">Login</h3>
                  {error && (
                    <div className="alert alert-danger mb-30" role="alert">
                      {error}
                    </div>
                  )}
                  <form onSubmit={handleSubmit}>
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
                      <label htmlFor="password">Password <span>*</span></label>
                      <input 
                        id="password" 
                        name="password" 
                        type="password" 
                        placeholder="Password" 
                        value={formData.password}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="login-action mb-30 d-flex justify-content-between">
                      <div className="remember-login">
                        <input id="remember" type="checkbox" />
                        <label htmlFor="remember">Remember me</label>
                      </div>
                      <span className="forgot-login">
                        <Link href="/auth/forgot-password">Forgot password?</Link>
                      </span>
                    </div>
                    <button type="submit" className="tp-btn w-100" disabled={loading}>
                      {loading ? 'Logging in...' : 'Login Now'}
                    </button>
                    <div className="mt-15 text-center">
                      <span>Don&apos;t have an account? </span>
                      <Link href="/auth/register" className="text-primary">Register</Link>
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

export default LoginPage 