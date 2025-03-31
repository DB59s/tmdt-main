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

            // Gather enhanced device information
            const deviceInfo = {
                // Basic device information
                fingerprint: generateFingerprint(),
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
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                
                // Enhanced hardware information
                hardwareInfo: getHardwareInfo(),
                availableMemory: getAvailableMemory(),
                devicePixelRatio: window.devicePixelRatio || 1,
                colorDepth: window.screen.colorDepth,
                
                // Browser capabilities
                plugins: getPluginsInfo(),
                touchSupport: getTouchSupport(),
                webglInfo: getWebglInfo(),
                audioInfo: getAudioInfo(),
                canvasFingerprint: generateCanvasFingerprint(),
                fonts: detectFonts(),
                
                // Network and location (when available)
                locationInfo: getLocationInfo(),
                networkInfo: getNetworkInfo()
            }

            console.log('Sending device identification data to server')
            const response = await fetch(`${process.env.domainApi}/api/customer/device/identify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(deviceInfo)
            })
            
            if (!response.ok) {
                throw new Error(`Failed to identify device: ${response.status} ${response.statusText}`)
            }
            
            const data = await response.json()
            if (data.success) {
                console.log('Device identified successfully', data)
                localStorage.setItem('customerId', data.customerId)
                
                // If customer was identified and is registered, we might want to store additional info
                if (!data.isNewCustomer && data.isRegistered) {
                    console.log('Recognized registered customer')
                }
            } else {
                console.error('Device identification unsuccessful:', data.message || 'Unknown error')
            }
        } catch (err) {
            console.error('Failed to identify device:', err)
        }
    }

    // Hardware information
    const getHardwareInfo = () => {
        try {
            return {
                platform: navigator.platform,
                productSub: navigator.productSub,
                hardwareConcurrency: navigator.hardwareConcurrency,
                maxTouchPoints: navigator.maxTouchPoints,
                deviceMemory: navigator.deviceMemory,
                screenResolution: `${window.screen.width}x${window.screen.height}`,
                availScreenResolution: `${window.screen.availWidth}x${window.screen.availHeight}`
            }
        } catch (err) {
            console.error('Error getting hardware info:', err)
            return {}
        }
    }

    // Available memory
    const getAvailableMemory = () => {
        try {
            return navigator.deviceMemory || null
        } catch (err) {
            return null
        }
    }

    // Plugins information
    const getPluginsInfo = () => {
        try {
            if (!navigator.plugins) return []
            
            return Array.from(navigator.plugins).map(plugin => ({
                name: plugin.name,
                description: plugin.description,
                filename: plugin.filename
            }))
        } catch (err) {
            console.error('Error getting plugins info:', err)
            return []
        }
    }

    // Touch support detection
    const getTouchSupport = () => {
        try {
            const maxTouchPoints = navigator.maxTouchPoints || 0
            const touchEvent = 'ontouchstart' in window
            const touchStart = window.DocumentTouch !== undefined
            
            return {
                maxTouchPoints,
                touchEvent,
                touchStart
            }
        } catch (err) {
            console.error('Error detecting touch support:', err)
            return {}
        }
    }

    // WebGL information
    const getWebglInfo = () => {
        try {
            const canvas = document.createElement('canvas')
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
            
            if (!gl) return null
            
            return {
                vendor: gl.getParameter(gl.VENDOR),
                renderer: gl.getParameter(gl.RENDERER),
                webglVersion: gl.getParameter(gl.VERSION),
                shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
                extensions: gl.getSupportedExtensions()
            }
        } catch (err) {
            console.error('Error getting WebGL info:', err)
            return null
        }
    }

    // Audio fingerprinting
    const getAudioInfo = () => {
        try {
            if (typeof AudioContext === 'undefined' && 
                typeof webkitAudioContext === 'undefined') {
                return null
            }
            
            const context = new (AudioContext || webkitAudioContext)()
            return {
                sampleRate: context.sampleRate,
                state: context.state,
                maxChannelCount: context.destination.maxChannelCount
            }
        } catch (err) {
            console.error('Error getting audio info:', err)
            return null
        }
    }

    // Canvas fingerprinting
    const generateCanvasFingerprint = () => {
        try {
            const canvas = document.createElement('canvas')
            canvas.width = 200
            canvas.height = 50
            
            const ctx = canvas.getContext('2d')
            if (!ctx) return null
            
            // Text
            ctx.font = '16px Arial'
            ctx.fillStyle = '#b48ef7'
            ctx.fillText('Canvas Fingerprint 👾', 10, 30)
            
            // Shapes and gradients
            ctx.beginPath()
            ctx.arc(160, 25, 20, 0, Math.PI * 2)
            const gradient = ctx.createLinearGradient(0, 0, 200, 0)
            gradient.addColorStop(0, 'blue')
            gradient.addColorStop(1, 'red')
            ctx.fillStyle = gradient
            ctx.fill()
            
            // Get base64 representation
            return canvas.toDataURL()
        } catch (err) {
            console.error('Error generating canvas fingerprint:', err)
            return null
        }
    }

    // Font detection
    const detectFonts = () => {
        try {
            const baseFonts = ['monospace', 'sans-serif', 'serif']
            const testString = 'mmMMMwWWiii'
            const testSize = '72px'
            const h = document.getElementsByTagName('body')[0]
            
            // Create a span to test fonts
            const s = document.createElement('span')
            s.style.fontSize = testSize
            s.innerHTML = testString
            
            // Create spans for base fonts
            const baseFontSpans = {}
            baseFonts.forEach(baseFont => {
                const span = document.createElement('span')
                span.style.fontSize = testSize
                span.style.fontFamily = baseFont
                span.innerHTML = testString
                h.appendChild(span)
                baseFontSpans[baseFont] = span
            })
            
            // List of fonts to detect
            const fontsToDetect = [
                'Arial', 'Verdana', 'Times New Roman', 'Courier New', 
                'Georgia', 'Palatino', 'Garamond', 'Bookman', 'Tahoma', 
                'Trebuchet MS', 'Impact', 'Comic Sans MS', 'Helvetica'
            ]
            
            const detected = []
            for (let font of fontsToDetect) {
                let detected = false
                for (let baseFont of baseFonts) {
                    s.style.fontFamily = `'${font}',${baseFont}`
                    h.appendChild(s)
                    
                    const matched = s.offsetWidth !== baseFontSpans[baseFont].offsetWidth || 
                                    s.offsetHeight !== baseFontSpans[baseFont].offsetHeight
                    
                    h.removeChild(s)
                    
                    if (matched) {
                        detected = true
                        break
                    }
                }
                
                if (detected) {
                    detected.push(font)
                }
            }
            
            // Clean up
            baseFonts.forEach(baseFont => {
                h.removeChild(baseFontSpans[baseFont])
            })
            
            return detected
        } catch (err) {
            console.error('Error detecting fonts:', err)
            return []
        }
    }

    // Location information
    const getLocationInfo = () => {
        // Note: This may require user consent and may not work without HTTPS
        // For privacy reasons, we just return navigator timezone and language info
        return {
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timezoneOffset: new Date().getTimezoneOffset(),
            language: navigator.language,
            languages: navigator.languages ? Array.from(navigator.languages) : []
        }
    }

    // Network information
    const getNetworkInfo = () => {
        try {
            if (!navigator.connection) return {}
            
            const connection = navigator.connection
            return {
                effectiveType: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt,
                downlinkMax: connection.downlinkMax,
                saveData: connection.saveData
            }
        } catch (err) {
            console.error('Error getting network info:', err)
            return {}
        }
    }

    // Simple browser detection
    const getBrowserInfo = () => {
        const userAgent = navigator.userAgent
        if (userAgent.indexOf("Chrome") > -1) return "Chrome"
        if (userAgent.indexOf("Safari") > -1) return "Safari"
        if (userAgent.indexOf("Firefox") > -1) return "Firefox"
        if (userAgent.indexOf("MSIE") > -1 || userAgent.indexOf("Trident") > -1) return "IE"
        if (userAgent.indexOf("Edge") > -1) return "Edge"
        if (userAgent.indexOf("Opera") > -1 || userAgent.indexOf("OPR") > -1) return "Opera"
        return "Unknown"
    }

    // Simple OS detection
    const getOSInfo = () => {
        const userAgent = navigator.userAgent
        if (userAgent.indexOf("Windows") > -1) return "Windows"
        if (userAgent.indexOf("Mac") > -1) return "MacOS"
        if (userAgent.indexOf("Linux") > -1) return "Linux"
        if (userAgent.indexOf("Android") > -1) return "Android"
        if (userAgent.indexOf("like Mac") > -1) return "iOS" // iOS user agents contain "like Mac"
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
            
            // Additional factors for more accurate fingerprinting
            const hardwareConcurrency = navigator.hardwareConcurrency || 'unknown'
            const deviceMemory = navigator.deviceMemory || 'unknown'
            const touchPoints = navigator.maxTouchPoints || 'unknown'
            const platform = navigator.platform || 'unknown'
            
            return `${navigator.userAgent}-${screenInfo}-${timeZoneOffset}-${navigator.language}-${features}-${plugins}-${hardwareConcurrency}-${deviceMemory}-${touchPoints}-${platform}`.replace(/\s+/g, '')
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