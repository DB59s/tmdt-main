'use client';

import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { getCookie } from 'cookies-next';

const ComponentsAppsChat = () => {
  // State for managing chats and messages
  const [socket, setSocket] = useState(null);
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [customerTyping, setCustomerTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);
  const { toast } = useToast();

  // Initialize socket connection
  useEffect(() => {
    const initializeSocket = async () => {
      try {
        // Get the auth token from sessionStorage
        const token = sessionStorage.getItem('token');

        
        if (!token) {
          const error = "Authentication token not found";
          setError(error);
          toast({ 
            title: "Authentication Error", 
            description: "You must be logged in to use the chat feature.",
            variant: "destructive"
          });
          return;
        }

        // Create socket connection to admin namespace with token
        setConnectionStatus('connecting');
        const socketURL = `${process.env.domainApi}/admin`;
        
        const socketInstance = io(socketURL, {
          auth: { token },
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          transports: ['websocket', 'polling'] // Try websocket first, fallback to polling
        });

        // Socket event handlers
        socketInstance.on('connect', () => {
          setConnectionStatus('connected');
          // Get all chats when connected
          socketInstance.emit('get_chats');
        });

        socketInstance.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
          setConnectionStatus('error');
          setError(error.message);
          toast({ 
            title: "Connection Error", 
            description: error.message || "Failed to connect to chat server",
            variant: "destructive"
          });
        });

        socketInstance.on('disconnect', (reason) => {
          setConnectionStatus('disconnected');
        });

        socketInstance.on('reconnect', (attemptNumber) => {
          setConnectionStatus('connected');
        });

        socketInstance.on('chat_list', ({ chats }) => {

            console.log("chats", chats);
          
          if (!chats || !Array.isArray(chats)) {
            console.error("Invalid chat list received:", chats);
            setChats([]);
            setLoading(false);
            return;
          }
          
          // Transform chat data for display
          const formattedChats = chats.map(chat => ({
            id: chat._id,
            title: chat.title || `Chat with ${chat.customerId?.name || 'Customer'}`,
            customerName: chat.customerId?.name || 'Unknown',
            customerEmail: chat.customerId?.email || '',
            customerPhone: chat.customerId?.phoneNumber || '',
            lastMessage: chat.lastMessage || 'No messages yet',
            lastMessageTime: new Date(chat.lastMessageTime),
            unreadCount: chat.unreadAdmin || 0,
            status: chat.status,
            isActive: !!chat.adminId
          }));

          setChats(formattedChats);
          setLoading(false);
        });

        socketInstance.on('chat_history', ({ chatId, messages: receivedMessages }) => {
         
          
          // Store raw messages in a ref for direct access
          if (receivedMessages && Array.isArray(receivedMessages) && receivedMessages.length > 0) {
            window.DEBUG_MESSAGES = receivedMessages;
          }
          
          // Make sure we're using the latest activeChat value
          setActiveChat(currentActiveChat => {
            if (currentActiveChat && currentActiveChat.id === chatId) {
              if (!receivedMessages || !Array.isArray(receivedMessages)) {
                console.error("Invalid messages received:", receivedMessages);
                setMessages([]);
                return currentActiveChat;
              }
              
              
              // Check if message content and needed properties exist
              const validMessages = receivedMessages.filter(msg => 
                msg && msg.content && msg.senderType
              );
              
              if (validMessages.length !== receivedMessages.length) {
                console.warn("Some messages were filtered out due to missing properties");
              }
              
              
              // Force a new array reference to trigger re-render
              setMessages([...validMessages]);
              
              // Scroll to bottom after messages load
              setTimeout(() => {
                scrollToBottom();
                // Double-check if messages were updated
                console.log("After timeout, messages length is:", validMessages.length);
              }, 100);
            }
            return currentActiveChat;
          });
        });

        socketInstance.on('new_message', ({ message }) => {
          
          if (!message) {
            console.error("Invalid message received");
            return;
          }
          
          // Update messages if this is the active chat
          if (activeChat && activeChat.id === message.chatId) {
            setMessages(prev => [...prev, message]);
            scrollToBottom();
          }

          // Update unread count in chats list
          setChats(prev => 
            prev.map(chat => {
              if (chat.id === message.chatId) {
                // Only increment if not from active chat or is from customer
                const increment = (
                  (activeChat?.id !== message.chatId) && 
                  message.senderType === 'customer'
                ) ? 1 : 0;
                
                return {
                  ...chat,
                  lastMessage: message.content,
                  lastMessageTime: new Date(message.timestamp),
                  unreadCount: chat.unreadCount + increment
                };
              }
              return chat;
            })
          );
        });

        socketInstance.on('new_chat_request', ({ chat }) => {
          
          // Add new chat to list if it doesn't exist
          setChats(prev => {
            // Check if chat already exists
            const exists = prev.some(c => c.id === chat._id);
            if (!exists) {
              // Add new chat to beginning of list
              return [{
                id: chat._id,
                title: chat.title || `Chat with ${chat.customerName || 'Customer'}`,
                customerName: chat.customerName || 'Unknown',
                customerEmail: chat.customerEmail || '',
                customerPhone: chat.customerPhone || '',
                lastMessage: chat.lastMessage || 'New chat request',
                lastMessageTime: new Date(chat.lastMessageTime),
                unreadCount: chat.unreadAdmin || 1,
                status: chat.status,
                isActive: false
              }, ...prev];
            }
            return prev;
          });

          // Show notification
          toast({
            title: "New Chat Request",
            description: `${chat.customerName || 'A customer'} is requesting assistance`,
          });
        });

        socketInstance.on('customer_typing', ({ chatId, isTyping }) => {
          if (activeChat && activeChat.id === chatId) {
            setCustomerTyping(isTyping);
          }
        });

        socketInstance.on('customer_online', ({ chatId, customerId, customerName }) => {
          toast({
            title: "Customer Online",
            description: `${customerName || 'Customer'} is now online`,
          });
        });

        socketInstance.on('customer_offline', ({ chatId, customerId }) => {
          if (activeChat && activeChat.id === chatId) {
            toast({
              title: "Customer Offline",
              description: "The customer has disconnected",
              variant: "default"
            });
          }
        });

        socketInstance.on('chat_closed', ({ chatId }) => {
          // Update chat status in list
          setChats(prev => 
            prev.map(chat => {
              if (chat.id === chatId) {
                return { ...chat, status: 'closed' };
              }
              return chat;
            })
          );

          // If this is the active chat, show a notification
          if (activeChat && activeChat.id === chatId) {
            toast({
              title: "Chat Closed",
              description: "This conversation has been closed",
            });
          }
        });

        socketInstance.on('error', ({ message }) => {
          console.error("Socket error:", message);
          setError(message);
          toast({
            title: "Error",
            description: message,
            variant: "destructive"
          });
        });

        setSocket(socketInstance);

        // Cleanup on unmount
        return () => {
          socketInstance.disconnect();
        };
      } catch (error) {
        console.error('Error initializing socket:', error);
        setConnectionStatus('error');
        setError(error.message);
        toast({
          title: "Connection Error",
          description: "Failed to connect to chat server. Please try again later.",
          variant: "destructive"
        });
      }
    };

    initializeSocket();
  }, []);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle joining a chat
  const handleJoinChat = (chat) => {
    if (!socket) {
      console.error("Cannot join chat: No socket connection");
      toast({
        title: "Connection Error",
        description: "Not connected to chat server",
        variant: "destructive"
      });
      return;
    }

    
    // Reset messages while loading - BEFORE updating activeChat
    setMessages([]);
    
    // Update active chat
    setActiveChat(chat);
    
    // Join the chat room
    socket.emit('join_chat', { chatId: chat.id });
  };

  // Handle sending a message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!socket || !activeChat || !newMessage.trim()) return;

    console.log("Sending message to chat:", activeChat.id, newMessage);
    
    


    // Send message through socket
    socket.emit('send_message', {
      chatId: activeChat.id,
      content: newMessage.trim()
    });

    // hiển thị luôn tin nhắn
    setMessages(prev => [...prev, {
      _id: 'new-message',
      content: newMessage.trim(),
      senderType: 'admin',
      timestamp: new Date().toISOString()
    }]);

    // Clear input field
    setNewMessage('');
    
    // Reset typing status
    setIsTyping(false);
    socket.emit('typing', { chatId: activeChat.id, isTyping: false });
  };

  // Handle typing indicator
  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (!socket || !activeChat) return;
    
    // Only emit typing event if status changed
    if (!isTyping && e.target.value.trim()) {
      setIsTyping(true);
      socket.emit('typing', { chatId: activeChat.id, isTyping: true });
    } else if (isTyping && !e.target.value.trim()) {
      setIsTyping(false);
      socket.emit('typing', { chatId: activeChat.id, isTyping: false });
    }
  };

  // Handle closing a chat
  const handleCloseChat = () => {
    if (!socket || !activeChat) return;
    
    socket.emit('close_chat', { chatId: activeChat.id });
  };

  // Format timestamp for display
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format date for chat list
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  // Get connection status indicator color
  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'disconnected': return 'bg-red-500';
      case 'error': return 'bg-red-700';
      default: return 'bg-gray-500';
    }
  };

  useEffect(() => {
    
    // Ensure scroll to bottom when messages change
    if (messages && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);


  return (
    <div className="flex flex-col h-[calc(100vh-130px)] overflow-hidden">
      {/* Connection status */}
      <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 flex items-center">
        <div className={`h-3 w-3 rounded-full mr-2 ${getConnectionStatusColor()}`}></div>
        <span className="text-sm">
          {connectionStatus === 'connected' ? 'Connected to chat server' : 
           connectionStatus === 'connecting' ? 'Connecting to chat server...' :
           connectionStatus === 'disconnected' ? 'Disconnected from chat server' :
           `Connection error: ${error || 'Unknown error'}`}
        </span>
      </div>

      {/* Main chat interface */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat list sidebar */}
        <div className="w-1/4 border-r dark:border-gray-700 overflow-y-auto">
          <div className="p-4 border-b dark:border-gray-700">
            <h2 className="text-lg font-semibold">Customer Conversations</h2>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
            </div>
          ) : (
            <div>
              {chats.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  No active conversations
                </div>
              ) : (
                <div>
                  {chats
                    .filter(chat => chat.status === 'active')
                    .sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime))
                    .map(chat => (
                      <div 
                        key={chat.id}
                        onClick={() => handleJoinChat(chat)}
                        className={`p-4 border-b dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                          activeChat?.id === chat.id ? 'bg-gray-100 dark:bg-gray-800' : ''
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-medium truncate">{chat.customerName}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                              {chat.lastMessage}
                            </p>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {formatDate(chat.lastMessageTime)}
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {chat.isActive ? 'Assigned to you' : 'Unassigned'}
                          </div>
                          {chat.unreadCount > 0 && (
                            <Badge variant="destructive" className="rounded-full">
                              {chat.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Chat main area */}
        <div className="flex-1 flex flex-col">
          {activeChat ? (
            <>
              {/* Chat header */}
              <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                <div>
                  <h2 className="font-semibold">{activeChat.customerName}</h2>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {activeChat.customerEmail} • {activeChat.customerPhone}
                  </div>
                </div>
                <div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">Close Chat</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Close this conversation?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. The conversation will be marked as closed and 
                          you will no longer be able to send messages.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCloseChat} className="bg-red-600 hover:bg-red-700">
                          Close Conversation
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              {/* Chat messages */}
              <div className="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-gray-900">
                {/* Debug info - remove in production */}
                {/* <div className="bg-yellow-100 p-2 mb-4 text-xs rounded">
                  <div>Debug: Message count in state: {messages?.length || 0}</div>
                  <div>Debug: Message count in window: {window.DEBUG_MESSAGES?.length || 0}</div>
                  {messages && messages.length > 0 && (
                    <div>First message: {messages[0].content}</div>
                  )}
                  <button 
                    className="bg-blue-500 text-white px-2 py-1 text-xs rounded mt-1"
                    onClick={() => {
                      if (window.DEBUG_MESSAGES && window.DEBUG_MESSAGES.length > 0) {
                        console.log("Force setting messages from debug");
                        setMessages([...window.DEBUG_MESSAGES]);
                      }
                    }}
                  >
                    Force Load Messages
                  </button>
                </div> */}
                
                {/* If no messages in state but we have debug messages, show those */}
                {(!messages || messages.length === 0) && window.DEBUG_MESSAGES && window.DEBUG_MESSAGES.length > 0 ? (
                  <div className="space-y-4">
                    <div className="text-center text-amber-500 mb-4">
                      Showing messages from debug data (state issue detected)
                    </div>
                    {window.DEBUG_MESSAGES.map((message, index) => (
                      <div 
                        key={`debug-msg-${index}`}
                        className={`flex ${message.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div 
                          className={`max-w-[75%] p-3 rounded-lg ${
                            message.senderType === 'admin' 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border dark:border-gray-700'
                          }`}
                        >
                          <div className="text-sm">{message.content}</div>
                          <div className={`text-xs mt-1 ${
                            message.senderType === 'admin' 
                              ? 'text-blue-200' 
                              : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {formatTime(message.timestamp)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (!messages || messages.length === 0) ? (
                  <div className="flex justify-center items-center h-full text-gray-500 dark:text-gray-400">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message, index) => {
                      return (
                        <div 
                          key={message._id || `msg-${index}`}
                          className={`flex ${message.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div 
                            className={`max-w-[75%] p-3 rounded-lg ${
                              message.senderType === 'admin' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border dark:border-gray-700'
                            }`}
                          >
                            <div className="text-sm">{message.content}</div>
                            <div className={`text-xs mt-1 ${
                              message.senderType === 'admin' 
                                ? 'text-blue-200' 
                                : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              {formatTime(message.timestamp)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    {customerTyping && (
                      <div className="flex justify-start">
                        <div className="bg-gray-200 dark:bg-gray-700 rounded-lg px-3 py-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-500 dark:bg-gray-300 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-500 dark:bg-gray-300 rounded-full animate-bounce delay-100"></div>
                            <div className="w-2 h-2 bg-gray-500 dark:bg-gray-300 rounded-full animate-bounce delay-200"></div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Chat input */}
              <div className="p-4 border-t dark:border-gray-700">
                <form onSubmit={handleSendMessage} className="flex space-x-2">
                  <Input
                    type="text"
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={handleTyping}
                    className="flex-1"
                    disabled={activeChat.status === 'closed' || connectionStatus !== 'connected'}
                  />
                  <Button 
                    type="submit" 
                    disabled={!newMessage.trim() || activeChat.status === 'closed' || connectionStatus !== 'connected'}
                  >
                    Send
                  </Button>
                </form>
                {activeChat.status === 'closed' && (
                  <div className="text-sm text-red-500 mt-2">
                    This conversation is closed. You cannot send more messages.
                  </div>
                )}
                {connectionStatus !== 'connected' && (
                  <div className="text-sm text-yellow-500 mt-2">
                    You need to be connected to send messages.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                <p className="text-sm">Choose a conversation from the list to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComponentsAppsChat;
