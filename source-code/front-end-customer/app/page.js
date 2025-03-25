'use client'
import { useEffect, useState } from 'react'
import Layout from "@/components/layout/Layout"
import Category from "@/components/sections/Category"
import DealProduct1 from "@/components/sections/DealProduct1"
import Product1 from "@/components/sections/Product1"
import Shop from "@/components/sections/Shop"
import Slider1 from "@/components/sections/Slider1"
import OnSaleProducts from "@/components/sections/OnSaleProducts"

export default function Home() {
    const [isMounted, setIsMounted] = useState(false)
    
    useEffect(() => {
        // Set mounted state to true after component mounts
        setIsMounted(true)
        
        // Identify device when component mounts
        if (typeof window !== 'undefined') {
            identifyDevice()
        }
    }, [])

    const identifyDevice = async () => {
        if (typeof window === 'undefined') return;
        
        try {
            // Check if customerId already exists in localStorage
            const existingCustomerId = localStorage.getItem('customerId')
            if (existingCustomerId) {
                console.log('Device already identified with customerId:', existingCustomerId)
                return
            }

            const fingerprint = generateFingerprint()
            const response = await fetch(`${process.env.domainApi}/api/customer/device/identify`, {
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
            
            if (!response.ok) {
                throw new Error(`Failed to identify device: ${response.status} ${response.statusText}`)
            }
            
            const data = await response.json()
            if (data.success) {
                console.log('Device identified successfully')
                localStorage.setItem('customerId', data.customerId)
            } else {
                console.error('Device identification unsuccessful:', data.message || 'Unknown error')
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

    // Enhanced fingerprint generator
    const generateFingerprint = () => {
        try {
            // Create a more robust fingerprint with additional factors
            const screenInfo = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`
            const timeZoneOffset = new Date().getTimezoneOffset()
            const plugins = Array.from(navigator.plugins || [])
                .map(plugin => plugin.name)
                .join(';')
            
            // Include available browser features
            const features = [
                'localStorage' in window,
                'sessionStorage' in window,
                'indexedDB' in window,
                'webgl' in window,
                'WebGLRenderingContext' in window,
                'Intl' in window
            ].map(feature => feature ? '1' : '0').join('');
            
            return `${navigator.userAgent}-${screenInfo}-${timeZoneOffset}-${navigator.language}-${features}-${plugins}`.replace(/\s+/g, '')
        } catch (err) {
            // Fallback to a simpler fingerprint if any error occurs
            console.error('Error generating fingerprint:', err)
            return `${navigator.userAgent}-${window.screen.width}x${window.screen.height}-${new Date().getTimezoneOffset()}`
        }
    }

    return (
        <>
            <Layout headerStyle={1} footerStyle={1}>
                <Slider1 />
                <Category />
                <Product1 />
                <OnSaleProducts />
                {/* <DealProduct1 /> */}
                <Shop />
            </Layout>
        </>
    )
}