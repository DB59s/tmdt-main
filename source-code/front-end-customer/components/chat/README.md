# Chat Bubble Component

A real-time chat component for customer support that integrates with Socket.IO backend.

## Features

- Real-time messaging with customer support staff
- Typing indicators to show when the admin is typing
- Message read status tracking
- Chat session management
- Registration form for new users or guests
- Automatic reconnection if connection is lost
- Session persistence through page reloads and reconnects
- Responsive design optimized for mobile devices
- Proper positioning to avoid overlap with other UI elements like scroll buttons
- Smooth animations and transitions

## Implementation Details

### Components

- **ChatBubble.js**: Main component that handles the chat UI and functionality
- **ChatBubble.module.css**: CSS modules for styling the chat bubble
- **chatUtils.js**: Utility functions for authentication, customer data management, etc.

### Dependencies

- **socket.io-client**: For real-time communication with the backend

## Integration

To integrate the chat bubble into your application layout:

```jsx
// app/layout.js
import dynamic from 'next/dynamic'

// Import the chat bubble with SSR disabled to prevent hydration issues
const ChatBubble = dynamic(() => import('../components/chat/ChatBubble'), {
  ssr: false
})

export default function Layout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <ChatBubble />
      </body>
    </html>
  )
}
```

## Customer Registration

The chat bubble component now includes a registration form for customers who are not logged in. The form collects:

- Name (required)
- Email (required)
- Phone number (optional)

The information is stored in localStorage and sent to the server during socket connection.

## Socket Connection Flow

1. User clicks the chat button
2. Component checks if user is logged in (has token) or has previous chat info
3. If user has a previous customerId, attempt to reconnect
4. If no info is available, registration form is displayed
5. After registration, socket connection is established
6. Customer info is sent to the server with `register_info` event
7. Server responds with `customer_info` event containing the customer ID
8. Chat is initialized with `get_chat` event
9. Messages are loaded and displayed

## Reconnection Handling

The chat component includes robust reconnection handling:

1. Automatic reconnection attempts (up to 5 times) if connection is lost
2. Visual indicators showing reconnection status
3. Manual reconnect button if automatic attempts fail
4. Session persistence through the `reconnect` event
5. Seamless restoration of chat history after reconnection

The component emits a `reconnect` event with the customer ID when trying to restore a previous session. The server should handle this by:

1. Checking if the customer ID is valid
2. Restoring the customer's chat session
3. Sending back chat history
4. Notifying admins that the customer is back online

## Authentication

The chat component uses the following methods for authentication:

1. JWT token from localStorage (if available)
2. Customer ID from localStorage (if available)
3. New registration through the form

## Positioning

The chat bubble is designed to reposition itself when a scroll-to-top button appears on the page. This prevents UI overlap and ensures the chat is always accessible.

## Customization

You can customize the appearance of the chat bubble by modifying the CSS module file. The component uses CSS modules to ensure styles are scoped to the component.

## Server Implementation

The component is designed to work with a Socket.IO server that implements:

- `/customer` namespace for customer connections
- `register_info` event for registering customer information
- `reconnect` event for handling session restoration
- `reconnect_success` event for confirming successful reconnection
- `get_chat` event for retrieving chat history
- `send_message` event for sending messages
- `typing` event for typing indicators
- Various other events for chat functionality

## Environment Variables

The API server URL can be configured using:

- `process.env.NEXT_PUBLIC_API_URL`
- `process.env.domainApi`
- Defaults to `http://localhost:5000` if not specified 