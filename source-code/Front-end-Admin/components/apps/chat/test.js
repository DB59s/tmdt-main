'use client';;
import Dropdown from '@/components/dropdown';
import IconBell from '@/components/icon/icon-bell';
import IconCamera from '@/components/icon/icon-camera';
import IconCopy from '@/components/icon/icon-copy';
import IconDownload from '@/components/icon/icon-download';
import IconHelpCircle from '@/components/icon/icon-help-circle';
import IconHorizontalDots from '@/components/icon/icon-horizontal-dots';
import IconLogin from '@/components/icon/icon-login';
import IconMenu from '@/components/icon/icon-menu';
import IconMessage from '@/components/icon/icon-message';
import IconMessagesDot from '@/components/icon/icon-messages-dot';
import IconMicrophoneOff from '@/components/icon/icon-microphone-off';
import IconMoodSmile from '@/components/icon/icon-mood-smile';
import IconPhone from '@/components/icon/icon-phone';
import IconPhoneCall from '@/components/icon/icon-phone-call';
import IconSearch from '@/components/icon/icon-search';
import IconSend from '@/components/icon/icon-send';
import IconSettings from '@/components/icon/icon-settings';
import IconShare from '@/components/icon/icon-share';
import IconTrashLines from '@/components/icon/icon-trash-lines';
import IconUserPlus from '@/components/icon/icon-user-plus';
import IconVideo from '@/components/icon/icon-video';
import PerfectScrollbar from 'react-perfect-scrollbar';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';

const loginUser = {
    id: 0,
    name: 'Alon Smith',
    path: 'profile-34.jpeg',
    designation: 'Software Developer',
};

// Khởi tạo socket
const socket = io('http://localhost:3000', { // Đảm bảo địa chỉ này đúng với server của bạn
    auth: {
        token: localStorage.getItem('adminToken') // Nếu bạn có token
    }
});

const ComponentsAppsChat = () => {
    const isRtl = useSelector((state) => state.themeConfig.rtlClass) === 'rtl';
    const isDark = useSelector(
        (state) => state.themeConfig.theme === 'dark' || state.themeConfig.isDarkMode
    );

    const [activeChats, setActiveChats] = useState([]); // Danh sách chat đang hoạt động
    const [currentChatId, setCurrentChatId] = useState(null); // ID của chat hiện tại
    const [textMessage, setTextMessage] = useState('');

    // Hàm lấy danh sách chat đang hoạt động
    const fetchActiveChats = async () => {
        const token = localStorage.getItem('adminToken');
        const response = await fetch('http://localhost:3000/api/admin/chat/active-chats', {
            method: 'GET',
            headers: {
                'authorization': `${token}`
            }
        });
        const data = await response.json();
        setActiveChats(data); // Cập nhật danh sách chat
    };

    useEffect(() => {
        fetchActiveChats(); // Gọi API khi component mount

        // Lắng nghe sự kiện chat mới từ socket
        socket.on('new_chat', (data) => {
            fetchActiveChats(); // Cập nhật lại danh sách chat khi có chat mới
        });

        return () => {
            socket.off('new_chat');
        };
    }, []);

    const selectChat = (chatId) => {
        setCurrentChatId(chatId);
        // Gọi API để lấy lịch sử chat
        fetchChatHistory(chatId);
    };

    const fetchChatHistory = async (chatId) => {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`http://localhost:3000/api/admin/chat/chat-history/${chatId}`, {
            method: 'GET',
            headers: {
                'authorization': `${token}`
            }
        });
        const data = await response.json();
        // Xử lý dữ liệu lịch sử chat
        console.log('Chat history:', data);
    };

    const sendMessage = () => {
        if (textMessage.trim()) {
            const messageData = {
                chatId: currentChatId, // ID của chat hiện tại
                content: textMessage,
                type: 'message',
                sender: 'admin',
                timestamp: new Date()
            };

            // Gửi tin nhắn qua socket
            socket.emit('admin_message', messageData);
            setTextMessage(''); // Xóa nội dung tin nhắn sau khi gửi
        }
    };

    return (
        <div>
            <div className="header">
                <h1>Admin Chat</h1>
                <div className="admin-info">
                    <div className="admin-avatar">A</div>
                    <div>
                        <p>{loginUser.name}</p>
                        <p>{loginUser.designation}</p>
                    </div>
                </div>
            </div>
            <div className="main-content">
                <div id="chat-list">
                    {activeChats.map(chat => (
                        <div key={chat.chatId} className="chat-item" onClick={() => selectChat(chat.chatId)}>
                            <div className="customer-avatar">{chat.customerInfo.name[0]}</div>
                            <div className="chat-info">
                                <div className="chat-name">{chat.customerInfo.name}</div>
                                <div className="chat-email">{chat.customerInfo.email}</div>
                                <div className="chat-message-count">{chat.messages.length} messages</div>
                            </div>
                        </div>
                    ))}
                </div>
                <div id="chat-detail">
                    {currentChatId && (
                        <div className="messages-container">
                            {/* Hiển thị tin nhắn ở đây */}
                        </div>
                    )}
                </div>
            </div>
            <div className="input-container">
                <div className="input-wrapper">
                    <input
                        type="text"
                        className="message-input"
                        placeholder="Type a message"
                        value={textMessage}
                        onChange={(e) => setTextMessage(e.target.value)}
                        onKeyUp={(e) => e.key === 'Enter' && sendMessage()}
                    />
                    <button className="send-button" onClick={sendMessage}>Send</button>
                </div>
            </div>
        </div>
    );
};

export default ComponentsAppsChat;
