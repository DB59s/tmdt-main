'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/layout/Layout'

const ProfilePage = () => {
  const router = useRouter()
  const [customerId, setCustomerId] = useState(null)
  const [token, setToken] = useState(null)
  const [profile, setProfile] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updateSuccess, setUpdateSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    defaultShippingAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    }
  })

  useEffect(() => {
    // Check if user is authenticated
    const storedToken = localStorage.getItem('token')
    const storedCustomerId = localStorage.getItem('customerId')
    
    if (!storedToken || !storedCustomerId) {
      router.push('/auth/login')
      return
    }
    
    setToken(storedToken)
    setCustomerId(storedCustomerId)
    
    // Fetch profile data
    fetchProfile(storedToken, storedCustomerId)
  }, [router])
  
  const fetchProfile = async (token, customerId) => {
    setLoading(true)
    try {
      let url = `http://localhost:8080/api/customer/profile`
      if (customerId) url += `/${customerId}`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      
      if (data.success) {
        setProfile(data.data)
        setFormData({
          name: data.data.name || '',
          phoneNumber: data.data.phoneNumber || '',
          defaultShippingAddress: {
            street: data.data.defaultShippingAddress?.street || '',
            city: data.data.defaultShippingAddress?.city || '',
            state: data.data.defaultShippingAddress?.state || '',
            zipCode: data.data.defaultShippingAddress?.zipCode || '',
            country: data.data.defaultShippingAddress?.country || ''
          }
        })
      } else {
        setError(data.message || 'Failed to fetch profile')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.')
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      })
    } else {
      setFormData({
        ...formData,
        [name]: value
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setUpdateSuccess(false)
    
    try {
      let url = `http://localhost:8080/api/customer/profile`
      if (customerId) url += `/${customerId}`
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        setProfile({
          ...profile,
          ...data.data
        })
        setUpdateSuccess(true)
        setIsEditing(false)
      } else {
        setError(data.message || 'Failed to update profile')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('customerId')
    router.push('/')
  }

  if (loading && !profile) {
    return (
      <Layout>
        <main>
          <section className="profile-area pt-100 pb-100">
            <div className="container">
              <div className="text-center">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            </div>
          </section>
        </main>
      </Layout>
    )
  }

  return (
    <Layout>
      <main>
        <section className="profile-area pt-100 pb-100">
          <div className="container">
            <div className="row">
              <div className="col-lg-4">
                <div className="profile-sidebar mb-30">
                  <div className="profile-info text-center mb-30 p-30 bg-white">
                    <div className="profile-img mb-25">
                      <img src="/assets/img/icon/user-icon.png" alt="Profile" />
                    </div>
                    <h4>{profile?.name || 'Customer'}</h4>
                    <span>{profile?.email}</span>
                    <div className="mt-20">
                      <button 
                        onClick={handleLogout} 
                        className="tp-btn-sm"
                        type="button"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                  <div className="profile-menu p-30 bg-white">
                    <h5 className="mb-10">My Account</h5>
                    <ul className="profile-menu-list">
                      <li className="active"><a href="/profile">Profile</a></li>
                      <li><a href="/profile/orders">Orders</a></li>
                      <li><a href="/profile/addresses">Addresses</a></li>
                      <li><a href="/wishlist">Wishlist</a></li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="col-lg-8">
                <div className="profile-content">
                  <div className="profile-title mb-30 d-flex justify-content-between align-items-center">
                    <h4>My Profile</h4>
                    {!isEditing && (
                      <button 
                        onClick={() => setIsEditing(true)} 
                        className="tp-btn-sm"
                        type="button"
                      >
                        Edit Profile
                      </button>
                    )}
                  </div>
                  
                  {error && (
                    <div className="alert alert-danger mb-30" role="alert">
                      {error}
                    </div>
                  )}
                  
                  {updateSuccess && (
                    <div className="alert alert-success mb-30" role="alert">
                      Profile updated successfully!
                    </div>
                  )}
                  
                  {isEditing ? (
                    <div className="profile-form p-30 bg-white">
                      <form onSubmit={handleSubmit}>
                        <div className="row">
                          <div className="col-md-6">
                            <div className="mb-30">
                              <label htmlFor="name">Full Name</label>
                              <input 
                                id="name" 
                                name="name" 
                                type="text" 
                                value={formData.name} 
                                onChange={handleChange} 
                                required
                              />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="mb-30">
                              <label htmlFor="email">Email</label>
                              <input 
                                type="email" 
                                value={profile.email} 
                                disabled 
                                className="disabled"
                              />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="mb-30">
                              <label htmlFor="phoneNumber">Phone Number</label>
                              <input 
                                id="phoneNumber" 
                                name="phoneNumber" 
                                type="tel" 
                                value={formData.phoneNumber} 
                                onChange={handleChange}
                              />
                            </div>
                          </div>
                        </div>
                        
                        <h5 className="mb-20 mt-30">Shipping Address</h5>
                        <div className="row">
                          <div className="col-md-6">
                            <div className="mb-30">
                              <label htmlFor="defaultShippingAddress.street">Street Address</label>
                              <input 
                                id="defaultShippingAddress.street" 
                                name="defaultShippingAddress.street" 
                                type="text" 
                                value={formData.defaultShippingAddress.street} 
                                onChange={handleChange} 
                              />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="mb-30">
                              <label htmlFor="defaultShippingAddress.city">City</label>
                              <input 
                                id="defaultShippingAddress.city" 
                                name="defaultShippingAddress.city" 
                                type="text" 
                                value={formData.defaultShippingAddress.city} 
                                onChange={handleChange} 
                              />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="mb-30">
                              <label htmlFor="defaultShippingAddress.state">State</label>
                              <input 
                                id="defaultShippingAddress.state" 
                                name="defaultShippingAddress.state" 
                                type="text" 
                                value={formData.defaultShippingAddress.state} 
                                onChange={handleChange} 
                              />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="mb-30">
                              <label htmlFor="defaultShippingAddress.zipCode">Zip Code</label>
                              <input 
                                id="defaultShippingAddress.zipCode" 
                                name="defaultShippingAddress.zipCode" 
                                type="text" 
                                value={formData.defaultShippingAddress.zipCode} 
                                onChange={handleChange} 
                              />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="mb-30">
                              <label htmlFor="defaultShippingAddress.country">Country</label>
                              <input 
                                id="defaultShippingAddress.country" 
                                name="defaultShippingAddress.country" 
                                type="text" 
                                value={formData.defaultShippingAddress.country} 
                                onChange={handleChange} 
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="d-flex gap-3">
                          <button type="submit" className="tp-btn-sm" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Changes'}
                          </button>
                          <button 
                            type="button" 
                            className="tp-btn-sm btn-outline-secondary" 
                            onClick={() => setIsEditing(false)}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className="profile-info-details p-30 bg-white">
                      <div className="row mb-20">
                        <div className="col-md-4">
                          <h6>Full Name</h6>
                          <p>{profile?.name || 'Not set'}</p>
                        </div>
                        <div className="col-md-4">
                          <h6>Email Address</h6>
                          <p>{profile?.email || 'Not set'}</p>
                        </div>
                        <div className="col-md-4">
                          <h6>Phone Number</h6>
                          <p>{profile?.phoneNumber || 'Not set'}</p>
                        </div>
                      </div>
                      
                      <div className="mt-30">
                        <h5 className="mb-20">Default Shipping Address</h5>
                        {profile?.defaultShippingAddress ? (
                          <address>
                            {profile.defaultShippingAddress.street}<br />
                            {profile.defaultShippingAddress.city}, {profile.defaultShippingAddress.state} {profile.defaultShippingAddress.zipCode}<br />
                            {profile.defaultShippingAddress.country}
                          </address>
                        ) : (
                          <p>No shipping address set</p>
                        )}
                      </div>
                      
                      <div className="mt-30">
                        <h5 className="mb-20">Account Information</h5>
                        <div className="row">
                          <div className="col-md-6">
                            <h6>Account Created</h6>
                            <p>{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Unknown'}</p>
                          </div>
                          <div className="col-md-6">
                            <h6>Last Activity</h6>
                            <p>{profile?.lastActivity ? new Date(profile.lastActivity).toLocaleDateString() : 'Unknown'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  )
}

export default ProfilePage 