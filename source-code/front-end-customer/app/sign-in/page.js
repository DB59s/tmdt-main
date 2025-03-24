'use client'
import { useState, useEffect } from 'react'
import Layout from "@/components/layout/Layout"
import Link from "next/link"
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'

export default function SignIn() {
    const router = useRouter()
    const [customerId, setCustomerId] = useState(null)
    
    // Login form state
    const [loginData, setLoginData] = useState({
        email: '',
        password: ''
    })
    
    // Register form state
    const [registerData, setRegisterData] = useState({
        email: '',
        password: '',
        name: '',
        phoneNumber: ''
    })
    
    const [loading, setLoading] = useState({
        login: false,
        register: false
    })
    
    const [error, setError] = useState({
        login: '',
        register: ''
    })
    
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
            const fingerprint = generateFingerprint()
            const response = await fetch(`${process.env.domainApi}/api/customer/device/identify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fingerprint: fingerprint,
                    userAgent: navigator.userAgent,
                    ipAddress: '',
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

    // Simple fingerprint generator
    const generateFingerprint = () => {
        return `${navigator.userAgent}-${window.screen.width}x${window.screen.height}-${new Date().getTimezoneOffset()}-${navigator.language}`
    }
    
    // Handle login form change
    const handleLoginChange = (e) => {
        setLoginData({
            ...loginData,
            [e.target.name]: e.target.value
        })
    }
    
    // Handle register form change
    const handleRegisterChange = (e) => {
        setRegisterData({
            ...registerData,
            [e.target.name]: e.target.value
        })
    }
    
    // Handle login form submit
    const handleLoginSubmit = async (e) => {
        e.preventDefault()
        setLoading({...loading, login: true})
        setError({...error, login: ''})
        
        try {
            const response = await fetch(`${process.env.domainApi}/api/customer/profile/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            })
            
            const data = await response.json()
            
            if (data.success) {
                // Store token and customer ID
                localStorage.setItem('token', data.token)
                localStorage.setItem('customerId', data.customerId)
                toast.success('Login successful!')
                router.push('/')
            } else {
                setError({...error, login: data.message || 'Login failed'})
                toast.error(data.message || 'Login failed')
            }
        } catch (err) {
            setError({...error, login: 'An error occurred. Please try again.'})
            toast.error('An error occurred. Please try again.')
        } finally {
            setLoading({...loading, login: false})
        }
    }
    
    // Handle register form submit
    const handleRegisterSubmit = async (e) => {
        e.preventDefault()
        setLoading({...loading, register: true})
        setError({...error, register: ''})
        
        try {
            // Use the register endpoint with the customerId if available
            const url = customerId 
                ? `${process.env.domainApi}/api/customer/profile/register/${customerId}` 
                : `${process.env.domainApi}/api/customer/profile/register`
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(registerData)
            })
            
            const data = await response.json()
            
            if (data.success) {
                // Store token and customer ID
                localStorage.setItem('token', data.token)
                localStorage.setItem('customerId', data.customerId)
                toast.success('Registration successful!')
                router.push('/')
            } else {
                setError({...error, register: data.message || 'Registration failed'})
                toast.error(data.message || 'Registration failed')
            }
        } catch (err) {
            setError({...error, register: 'An error occurred. Please try again.'})
            toast.error('An error occurred. Please try again.')
        } finally {
            setLoading({...loading, register: false})
        }
    }

    return (
        <>
            <Layout headerStyle={3} footerStyle={1} breadcrumbTitle="Sign In">
                <section className="track-area pt-80 pb-40">
                    <div className="container">
                        <div className="row justify-content-center">
                            <div className="col-lg-6 col-sm-12">
                                <div className="tptrack__product mb-40">
                                    <div className="tptrack__thumb">
                                        <img src="/assets/img/banner/login-bg.jpg" alt="" />
                                    </div>
                                    <div className="tptrack__content grey-bg-3">
                                        <div className="tptrack__item d-flex mb-20">
                                            <div className="tptrack__item-icon">
                                                <img src="/assets/img/icon/lock.png" alt="" />
                                            </div>
                                            <div className="tptrack__item-content">
                                                <h4 className="tptrack__item-title">Login Here</h4>
                                                <p>Your personal data will be used to support your experience throughout this website, to manage access to your account.</p>
                                            </div>
                                        </div>
                                        {error.login && (
                                            <div className="alert alert-danger mb-20" role="alert">
                                                {error.login}
                                            </div>
                                        )}
                                        <form onSubmit={handleLoginSubmit}>
                                            <div className="tptrack__id mb-10">
                                                <span><i className="fal fa-user" /></span>
                                                <input 
                                                    type="email" 
                                                    name="email"
                                                    placeholder="Email address" 
                                                    value={loginData.email}
                                                    onChange={handleLoginChange}
                                                    required
                                                />
                                            </div>
                                            <div className="tptrack__email mb-10">
                                                <span><i className="fal fa-key" /></span>
                                                <input 
                                                    type="password" 
                                                    name="password"
                                                    placeholder="Password" 
                                                    value={loginData.password}
                                                    onChange={handleLoginChange}
                                                    required
                                                />
                                            </div>
                                            <div className="tpsign__remember d-flex align-items-center justify-content-between mb-15">
                                                <div className="form-check">
                                                    <input className="form-check-input" type="checkbox" id="flexCheckDefault" />
                                                    <label className="form-check-label" htmlFor="flexCheckDefault">Remember me</label>
                                                </div>
                                                <div className="tpsign__pass">
                                                    <Link href="/auth/forgot-password">Forget Password</Link>
                                                </div>
                                            </div>
                                            <div className="tptrack__btn">
                                                <button 
                                                    type="submit" 
                                                    className="tptrack__submition"
                                                    disabled={loading.login}
                                                >
                                                    {loading.login ? 'Logging in...' : 'Login Now'}
                                                    <i className="fal fa-long-arrow-right" />
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg-6 col-sm-12">
                                <div className="tptrack__product mb-40">
                                    <div className="tptrack__thumb">
                                        <img src="/assets/img/banner/sign-bg.jpg" alt="" />
                                    </div>
                                    <div className="tptrack__content grey-bg-3">
                                        <div className="tptrack__item d-flex mb-20">
                                            <div className="tptrack__item-icon">
                                                <img src="/assets/img/icon/sign-up.png" alt="" />
                                            </div>
                                            <div className="tptrack__item-content">
                                                <h4 className="tptrack__item-title">Sign Up</h4>
                                                <p>Your personal data will be used to support your experience throughout this website, to manage access to your account.</p>
                                            </div>
                                        </div>
                                        {error.register && (
                                            <div className="alert alert-danger mb-20" role="alert">
                                                {error.register}
                                            </div>
                                        )}
                                        <form onSubmit={handleRegisterSubmit}>
                                            <div className="tptrack__id mb-10">
                                                <span><i className="fal fa-user" /></span>
                                                <input 
                                                    type="text" 
                                                    name="name"
                                                    placeholder="Full name" 
                                                    value={registerData.name}
                                                    onChange={handleRegisterChange}
                                                    required
                                                />
                                            </div>
                                            <div className="tptrack__id mb-10">
                                                <span><i className="fal fa-envelope" /></span>
                                                <input 
                                                    type="email" 
                                                    name="email"
                                                    placeholder="Email address" 
                                                    value={registerData.email}
                                                    onChange={handleRegisterChange}
                                                    required
                                                />
                                            </div>
                                            <div className="tptrack__id mb-10">
                                                <span><i className="fal fa-phone" /></span>
                                                <input 
                                                    type="tel" 
                                                    name="phoneNumber"
                                                    placeholder="Phone number" 
                                                    value={registerData.phoneNumber}
                                                    onChange={handleRegisterChange}
                                                    required
                                                />
                                            </div>
                                            <div className="tptrack__email mb-10">
                                                <span><i className="fal fa-key" /></span>
                                                <input 
                                                    type="password" 
                                                    name="password"
                                                    placeholder="Password" 
                                                    value={registerData.password}
                                                    onChange={handleRegisterChange}
                                                    required
                                                />
                                            </div>
                                            <div className="form-check mb-15">
                                                <input className="form-check-input" type="checkbox" id="agreeTerms" required />
                                                <label className="form-check-label" htmlFor="agreeTerms">
                                                    I agree to the <Link href="/terms">Terms & Conditions</Link>
                                                </label>
                                            </div>
                                            <div className="tptrack__btn">
                                                <button 
                                                    type="submit" 
                                                    className="tptrack__submition tpsign__reg"
                                                    disabled={loading.register}
                                                >
                                                    {loading.register ? 'Creating Account...' : 'Register Now'}
                                                    <i className="fal fa-long-arrow-right" />
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </Layout>
        </>
    )
}