'use client'
import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import styles from './ChatBubble.module.css'
import { getChatToken, canAccessChat, getChatSocketUrl, storeCustomerInfo } from './chatUtils'

const ChatBubble = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [adminTyping, setAdminTyping] = useState(false)
  const [socket, setSocket] = useState(null)
  const [chatId, setChatId] = useState(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [isVisible, setIsVisible] = useState(false)
  const [customerInfo, setCustomerInfo] = useState(null)
  const [registrationMode, setRegistrationMode] = useState(false)
  const [reconnecting, setReconnecting] = useState(false)
  const [reconnectAttempt, setReconnectAttempt] = useState(0)
  const reconnectTimerRef = useRef(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: ''
  })
  const [formErrors, setFormErrors] = useState({})
  const [hasScrolled, setHasScrolled] = useState(false)
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  // Check if user can access chat
  useEffect(() => {
    // First render: check if user can access chat
    const checkAccess = () => {
      const hasAccess = canAccessChat()
      setIsVisible(true) // Always visible, but will show registration form if needed
      
      // Load customer info from localStorage if available
      const name = localStorage.getItem('customerName')
      const email = localStorage.getItem('customerEmail')
      const phoneNumber = localStorage.getItem('customerPhone')
      
      if (name && email) {
        setFormData({
          name,
          email,
          phoneNumber: phoneNumber || ''
        })
      }
    }
    
    // Check on mount and add event listener for storage changes
    checkAccess()
    
    // Add event listener for storage changes (when user logs in/out)
    const handleStorageChange = () => {
      checkAccess()
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // Check for scroll position to adjust chat bubble position
    const handleScroll = () => {
      if (window.scrollY > 100 && !hasScrolled) {
        setHasScrolled(true)
      } else if (window.scrollY < 100 && hasScrolled) {
        setHasScrolled(false)
      }
    }
    
    window.addEventListener('scroll', handleScroll)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [hasScrolled])

  // Connect to socket when chat is opened
  useEffect(() => {
    // Connect to socket when chat is opened
    if (isOpen && isVisible) {
      // If we already have a socket, don't create a new one
      if (!socket) {
        // Kiểm tra thông tin khách hàng
        const name = localStorage.getItem('customerName')
        const email = localStorage.getItem('customerEmail')
        const phoneNumber = localStorage.getItem('customerPhone')
        
        if (!name || !email || !phoneNumber) {
          // Hiển thị form đăng ký nếu chưa có đủ thông tin
          setRegistrationMode(true)
        } else {
          // Nếu đã có thông tin, kết nối socket
          connectToSocket()
        }
      }
    } else if (!isOpen && socket) {
      // Disconnect only when chat is closed
      socket.disconnect()
      setSocket(null)
      setChatId(null)
      setConnected(false)
    }

    return () => {
      // Cleanup function - only disconnect if component is unmounting
      if (socket && !isOpen) {
        socket.disconnect()
        setSocket(null)
      }
    }
  }, [isOpen, isVisible, socket])

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Add reconnection logic
  useEffect(() => {
    return () => {
      // Clean up any reconnection timers when component unmounts
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
      }
    }
  }, [])
  
  // Implement reconnection attempts when disconnected
  useEffect(() => {
    // Only attempt reconnection if:
    // 1. The chat is open
    // 2. We're not connected
    // 3. We haven't exceeded max reconnection attempts
    // 4. We're in reconnecting state
    if (!connected && isOpen && reconnectAttempt < 5 && reconnecting) {
      reconnectTimerRef.current = setTimeout(() => {
        console.log(`Attempting to reconnect... (${reconnectAttempt + 1}/5)`)
        
        // If we have a socket, try to reconnect it first
        if (socket) {
          console.log('Reconnecting existing socket...')
          socket.connect()
        } else {
          // Otherwise create a new connection
          console.log('Creating new connection for reconnect...')
          connectToSocket()
        }
        
        setReconnectAttempt(prev => prev + 1)
      }, 3000) // Wait 3 seconds between reconnection attempts
    } else if (connected) {
      // Reset reconnection state when successfully connected
      setReconnecting(false)
      setReconnectAttempt(0)
    }
    
    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
      }
    }
  }, [connected, isOpen, reconnectAttempt, reconnecting, socket])

  const handleRegistrationSubmit = (e) => {
    e.preventDefault()
    
    // Validate form
    const errors = {}
    if (!formData.name.trim()) errors.name = 'Vui lòng nhập tên của bạn'
    if (!formData.email.trim()) errors.email = 'Vui lòng nhập email của bạn'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Email không hợp lệ'
    if (!formData.phoneNumber.trim()) errors.phoneNumber = 'Vui lòng nhập số điện thoại của bạn'
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }
    
    // Tạo một customerId tạm thời nếu chưa có
    const customerId = localStorage.getItem('customerId') || 
      'temp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 15);
    
    // Store customer info
    storeCustomerInfo({
      customerId,
      name: formData.name,
      email: formData.email,
      phoneNumber: formData.phoneNumber
    })
    
    // Xóa thông báo lỗi khi gửi form thành công
    setError(null)
    
    // Hide registration form and connect to socket
    setRegistrationMode(false)
    
    // Nếu đã có kết nối socket, gửi thông tin đăng ký
    if (socket && socket.connected) {
      console.log('Socket already connected, sending registration info');
      socket.emit('register_info', {
        customerId,
        name: formData.name,
        email: formData.email,
        phoneNumber: formData.phoneNumber
      });
    } else {
      // Nếu chưa kết nối, tạo kết nối mới
      connectToSocket()
    }
  }

  const handleInputChangeForm = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear errors for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: undefined
      }))
    }
  }

  const connectToSocket = async () => {
    try {
      // If we already have an active socket, don't create a new one
      if (socket && socket.connected) {
        console.log('Socket already connected, reusing existing connection')
        return
      }
      
      // If we have a socket that's disconnected, try to reconnect it
      if (socket) {
        console.log('Socket exists but disconnected, reconnecting...')
        socket.connect()
        return
      }
      
      console.log('Initializing new socket connection...')
      
      // Initialize socket connection to the customer namespace
      const socketUrl = getChatSocketUrl()
      
      // Kết nối socket không cần token auth
      const socketInstance = io(`${socketUrl}/customer`, {
        reconnection: false // We'll handle reconnection manually
      })

      // Clean up function to help prevent memory leaks and duplicate handlers
      const cleanupSocket = () => {
        if (socket) {
          console.log('Cleaning up old socket connection...')
          // Remove all listeners
          socket.off('connect')
          socket.off('disconnect')
          socket.off('connect_error')
          socket.off('registration_successful')
          socket.off('reconnect_successful')
          socket.off('chat_history')
          socket.off('new_message')
          socket.off('admin_typing')
          socket.off('chat_closed')
          socket.off('error')
          socket.off('require_info')
          
          // Disconnect if still connected
          if (socket.connected) {
            socket.disconnect()
          }
        }
      }
      
      // Clean up any existing socket before setting up new one
      cleanupSocket()
      
      // Socket connection events
      socketInstance.on('connect', () => {
        console.log('Connected to chat server')
        setConnected(true)
        setError(null)
        
        // Server sẽ tự động emit require_info khi kết nối mới được thiết lập
        // Chúng ta sẽ đợi sự kiện này và xử lý sau
      })

      // Handle server requesting customer information
      socketInstance.on('require_info', (data) => {
        console.log('Server requires customer info:', data)
        
        // Lấy customerId từ dữ liệu nếu có
        const receivedCustomerId = data.customerId || null;
        
        // Check if we have customer info in localStorage
        let customerId = localStorage.getItem('customerId');
        // Nếu server đã chỉ định customerId và khác với localStorage, ưu tiên sử dụng của server
        if (receivedCustomerId) {
          customerId = receivedCustomerId;
          localStorage.setItem('customerId', receivedCustomerId);
        }
        
        const name = localStorage.getItem('customerName')
        const email = localStorage.getItem('customerEmail') 
        const phoneNumber = localStorage.getItem('customerPhone')
        
        // If we have complete info, try to register
        if (name && email && phoneNumber && customerId) {
          console.log('Sending registration info with customerId:', customerId);
          socketInstance.emit('register_info', {
            customerId, // PHẢI có customerId
            name,
            email,
            phoneNumber
          })
        } 
        else if (name && email && phoneNumber) {
          // Dùng UUID tạm thời làm customerId
          const tempCustomerId = 'temp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 15);
          console.log('Sending registration info with temporary customerId:', tempCustomerId);
          socketInstance.emit('register_info', {
            customerId: tempCustomerId,
            name,
            email,
            phoneNumber
          })
        }
        // Otherwise show registration form
        else {
          setRegistrationMode(true)
          if (data.message) {
            setError(data.message)
          }
        }
      })

      socketInstance.on('disconnect', (reason) => {
        console.log(`Disconnected from chat server. Reason: ${reason}`)
        setConnected(false)
        
        // Only start reconnection if chat is still open and it wasn't a manual disconnect
        if (isOpen && reason !== 'io client disconnect') {
          console.log('Starting reconnection process...')
          setReconnecting(true)
          setError('Kết nối bị gián đoạn. Đang kết nối lại...')
        }
      })

      socketInstance.on('connect_error', (err) => {
        console.error('Connection error:', err)
        setError('Không thể kết nối đến máy chủ. Đang thử lại...')
        setConnected(false)
        
        // Start reconnection process if chat is still open
        if (isOpen) {
          console.log('Starting reconnection process due to connection error...')
          setReconnecting(true)
        }
      })

      // Registration successful event
      socketInstance.on('registration_successful', (data) => {
        console.log('Registration successful:', data)
        setCustomerInfo(data)
        
        // Xóa thông báo lỗi sau khi đăng ký thành công
        setError(null)
        // Hiển thị thông báo thành công
        setSuccess('Đăng ký thành công! Bạn có thể bắt đầu trò chuyện.')
        
        // Tự động ẩn thông báo thành công sau 5 giây
        setTimeout(() => {
          setSuccess(null)
        }, 5000)
        
        // Save customer info to localStorage for reconnection
        if (data.customerId) {
          localStorage.setItem('customerId', data.customerId)
        }
        
        // Save chatId for future messages
        if (data.chatId) {
          setChatId(data.chatId)
          localStorage.setItem('chatId', data.chatId)
        }
      })

      // Reconnection successful event
      socketInstance.on('reconnect_successful', (data) => {
        console.log('Reconnection successful:', data)
        setCustomerInfo(data)
        
        // Xóa thông báo lỗi sau khi kết nối lại thành công
        setError(null)
        
        // Save chatId for future messages
        if (data.chatId) {
          setChatId(data.chatId)
          localStorage.setItem('chatId', data.chatId)
        }
      })

      // Chat history event
      socketInstance.on('chat_history', (data) => {
        console.log('Received chat history:', data)
        
        // Xóa thông báo lỗi khi nhận được lịch sử chat
        setError(null)
        
        if (data.chatId) {
          setChatId(data.chatId)
          localStorage.setItem('chatId', data.chatId)
        }
        setMessages(data.messages)
      })

      // New message event
      socketInstance.on('new_message', (data) => {
        console.log('Received new message:', data)
        setMessages(prevMessages => [...prevMessages, data.message])
      })

      // Admin typing event
      socketInstance.on('admin_typing', (data) => {
        setAdminTyping(data.isTyping)
      })

      // Chat closed event
      socketInstance.on('chat_closed', () => {
        setMessages(prev => [
          ...prev, 
          {
            content: 'Cuộc trò chuyện đã kết thúc. Cảm ơn bạn đã liên hệ với chúng tôi.',
            senderType: 'system', 
            timestamp: new Date()
          }
        ])
      })

      // Error handling
      socketInstance.on('error', (data) => {
        console.error('Socket error:', data)
        setError(data.message)
        
        // Nếu lỗi liên quan đến thông tin khách hàng, chuyển sang chế độ đăng ký
        if (data.code === 'MISSING_INFO' || data.code === 'MISSING_CUSTOMER_ID' || 
            data.code === 'NOT_REGISTERED' || data.code === 'CUSTOMER_NOT_FOUND') {
          setRegistrationMode(true)
          setError('Vui lòng cung cấp đầy đủ thông tin để tiếp tục trò chuyện')
          
          // Nếu server cung cấp customerId, lưu lại
          if (data.customerId) {
            localStorage.setItem('customerId', data.customerId)
          }
        }
      })

      setSocket(socketInstance)
      
      // Return cleanup function in case we need it elsewhere
      return cleanupSocket
    } catch (err) {
      console.error('Error initializing socket:', err)
      setError('Có lỗi xảy ra. Vui lòng thử lại sau.')
      return null
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = (e) => {
    e.preventDefault()
    
    if (!newMessage.trim() || !socket || !chatId) return
    
    // Send message to server
    socket.emit('send_message', {
      chatId: chatId,
      content: newMessage.trim()
    })
    
    
    
    // Clear message input
    setNewMessage('')
  }

  const handleInputChange = (e) => {
    setNewMessage(e.target.value)
    
    // Emit typing event
    if (!isTyping && socket && chatId) {
      setIsTyping(true)
      socket.emit('typing', { chatId, isTyping: true })
    }
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      if (socket && chatId) {
        socket.emit('typing', { chatId, isTyping: false })
      }
    }, 2000)
  }

  const toggleChat = () => {
    // If we're opening the chat
    if (!isOpen) {
      // Reset connection errors when opening the chat
      if (error) setError(null);
      
      // If we have a customerId but no active connection, make sure we'll reconnect
      if (!socket && localStorage.getItem('customerId')) {
        setReconnecting(true);
        setReconnectAttempt(0);
      }
      
      setIsOpen(true);
    } else {
      // We're closing the chat
      setIsOpen(false);
    }
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Position the chat bubble above the scroll button when scrolled
  const chatBubbleStyle = hasScrolled ? { bottom: '80px' } : {}

  return (
    <div className={styles.chatBubbleContainer} style={chatBubbleStyle}>
      {/* Chat Button */}
      <button
        className={`${styles.chatButton} ${isOpen ? styles.chatButtonActive : ''}`}
        onClick={toggleChat}
        aria-label="Chat with us"
      >
        <i className={`fa ${isOpen ? 'fa-times' : 'fa-comment'}`}></i>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className={styles.chatWindow}>
          {/* Chat Header */}
          <div className={styles.chatHeader}>
            <h3>Hỗ trợ trực tuyến</h3>
            <div className={styles.chatStatus}>
              {connected ? (
                <span className={styles.statusOnline}>
                  <span className={styles.statusDot}></span> Đang kết nối
                </span>
              ) : reconnecting ? (
                <span className={styles.statusReconnecting}>
                  <span className={styles.statusDot}></span> Đang kết nối lại...
                </span>
              ) : (
                <span className={styles.statusOffline}>
                  <span className={styles.statusDot}></span> Đang kết nối...
                </span>
              )}
            </div>
          </div>

          {/* Registration Form */}
          {registrationMode ? (
            <div className={styles.registrationContainer}>
              <div className={styles.registrationHeader}>
                <h4>Thông tin của bạn</h4>
                <p>Vui lòng cung cấp thông tin để chúng tôi có thể hỗ trợ bạn tốt hơn</p>
              </div>
              
              <form onSubmit={handleRegistrationSubmit} className={styles.registrationForm}>
                <div className={styles.formGroup}>
                  <label htmlFor="name">Họ tên <span className={styles.required}>*</span></label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChangeForm}
                    className={formErrors.name ? styles.inputError : ''}
                  />
                  {formErrors.name && <div className={styles.errorMessage}>{formErrors.name}</div>}
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="email">Email <span className={styles.required}>*</span></label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChangeForm}
                    className={formErrors.email ? styles.inputError : ''}
                  />
                  {formErrors.email && <div className={styles.errorMessage}>{formErrors.email}</div>}
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="phoneNumber">Số điện thoại <span className={styles.required}>*</span></label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChangeForm}
                    className={formErrors.phoneNumber ? styles.inputError : ''}
                  />
                  {formErrors.phoneNumber && <div className={styles.errorMessage}>{formErrors.phoneNumber}</div>}
                </div>
                
                <button type="submit" className={styles.registrationButton}>
                  Bắt đầu trò chuyện
                </button>
              </form>
            </div>
          ) : (
            <>
              {/* Chat Messages */}
              <div className={styles.chatMessages}>
                {messages.length === 0 ? (
                  <div className={styles.chatWelcome}>
                    <div className={styles.chatWelcomeIcon}>
                      <i className="fa fa-comments"></i>
                    </div>
                    <h4>Xin chào!</h4>
                    <p>Bạn có câu hỏi hoặc cần hỗ trợ gì không? Hãy cho chúng tôi biết!</p>
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div 
                      key={index} 
                      className={`${styles.messageContainer} ${
                        message.senderType === 'customer' 
                          ? styles.userMessage
                          : message.senderType === 'system'
                          ? styles.systemMessage
                          : styles.adminMessage
                      }`}
                    >
                      {message.senderType === 'admin' && (
                        <div className={styles.messageSender}>
                          {message.senderName || 'Nhân viên hỗ trợ'}
                        </div>
                      )}
                      <div className={styles.messageContent}>
                        <div className={styles.messageText}>{message.content}</div>
                        <div className={styles.messageTime}>
                          {formatTime(message.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                {adminTyping && (
                  <div className={`${styles.messageContainer} ${styles.adminMessage}`}>
                    <div className={styles.typingIndicator}>
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Error Message with Reconnect Button */}
              {error && (
                <div className={styles.chatError}>
                  <i className="fa fa-exclamation-circle"></i> 
                  <span className={styles.errorText}>{error}</span>
                  {reconnectAttempt >= 5 && (
                    <button 
                      className={styles.reconnectButton}
                      onClick={() => {
                        setReconnectAttempt(0);
                        setReconnecting(true);
                        connectToSocket();
                      }}
                    >
                      Kết nối lại
                    </button>
                  )}
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className={styles.chatSuccess}>
                  <i className="fa fa-check-circle"></i> 
                  <span>{success}</span>
                </div>
              )}

              {/* Connection status for debugging */}
              <div className={styles.debugStatus}>
                {connected ? (chatId ? `Chat ID: ${chatId.substring(0, 8)}...` : 'Đang tải chat...') : 'Chưa kết nối'}
              </div>

              {/* Chat Input */}
              <form className={styles.chatInputContainer} onSubmit={handleSendMessage}>
                <input
                  type="text"
                  className={styles.chatInput}
                  placeholder={!connected ? "Đang kết nối..." : !chatId ? "Đang tải phòng chat..." : "Nhập tin nhắn của bạn..."}
                  value={newMessage}
                  onChange={handleInputChange}
                  disabled={!connected || !chatId}
                />
                <button 
                  type="submit" 
                  className={styles.chatSendButton}
                  disabled={!connected || !chatId || !newMessage.trim()}
                >
                  <i className="fa fa-paper-plane"></i>
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default ChatBubble

export { storeCustomerInfo } 