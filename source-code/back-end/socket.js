const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const Message = require('./api/models/message.model');
const Chat = require('./api/models/chat.model');
const User = require('./api/models/User.model');
const Customer = require('./api/models/customer.model');
const mongoose = require('mongoose');
const axios = require('axios');
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
require('dotenv').config({ path: envFile });

// Map lưu trữ thông tin kết nối socket của admin: { userId: socketId }
const adminSocketMap = new Map();

// Map lưu trữ thông tin kết nối socket của customer: { customerId: socketId }
const customerSocketMap = new Map();

// Map lưu trữ thông tin phòng chat: { chatId: { admin: adminId, customer: customerId } }
const chatRooms = new Map();

// Map lưu trữ thông tin khách hàng để hỗ trợ reconnect: { customerId: { name, email, phoneNumber, lastActive } }
const customerInfoCache = new Map();

// Thời gian cache thông tin khách hàng (12 giờ)
const CUSTOMER_CACHE_EXPIRY = 12 * 60 * 60 * 1000;

/**
 * Khởi tạo Socket.IO
 * @param {Object} server - HTTP server instance
 * @returns {Object} Socket.IO instance
 */
function initSocket(server) {
    const io = socketIO(server, {
        cors: {
            origin: '*', // Cho phép tất cả các origin trong môi trường phát triển
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    // Namespace cho admin
    const adminIO = io.of('/admin');

    // Xác thực middleware cho admin
    adminIO.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;

            if (!token) {
                return next(new Error('Authentication error: Token not provided'));
            }

            // Xác thực token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Chỉ cho phép admin kết nối vào namespace này
            if (decoded.role !== '1') {
                return next(new Error('Authentication error: Not an admin'));
            }
            
            // Lưu thông tin admin vào socket
            socket.userId = decoded.id;
            
            // Kiểm tra admin có tồn tại trong database
            const admin = await User.findById(decoded.id);
            if (!admin) {
                return next(new Error('Authentication error: Admin not found'));
            }

            // Lưu thêm thông tin admin vào socket
            socket.fullname = admin.fullname;

            next();
        } catch (error) {
            console.error('Socket authentication error:', error);
            next(new Error('Authentication error: ' + error.message));
        }
    });

    // Namespace cho customer
    const customerIO = io.of('/customer');

    // Xử lý kết nối từ customer
    customerIO.on('connection', (socket) => {
        console.log('New customer socket connected');
        
        // Khi kết nối mới, không tự động tạo chat hoặc cho vào phòng chat
        // Khách hàng sẽ được yêu cầu cung cấp thông tin
        socket.emit('require_info', { 
            message: 'Vui lòng cung cấp thông tin để bắt đầu chat' 
        });
        
        // Xử lý đăng ký thông tin khách hàng
        socket.on('register_info', async (customerData) => {
            try {
                const { customerId, name, email, phoneNumber } = customerData;
                
                console.log('customerData', customerData);
                // Kiểm tra customerId (bắt buộc phải có)
                if (!customerId) {
                    return socket.emit('error', { 
                        code: 'MISSING_CUSTOMER_ID',
                        message: 'Vui lòng cung cấp customerId'
                    });
                }
                
                // Kiểm tra thông tin bắt buộc
                if (!name || !email || !phoneNumber) {
                    return socket.emit('error', { 
                        code: 'MISSING_INFO',
                        message: 'Vui lòng cung cấp đầy đủ thông tin (tên, email, số điện thoại)'
                    });
                }
                
                // Tìm customer trong database hoặc tạo mới nếu chưa có
                let customer = await Customer.findById(customerId);
                
                if (customer) {
                    // Cập nhật thông tin nếu cần
                    let needUpdate = false;
                    if (name && name !== customer.name) {
                        customer.name = name;
                        needUpdate = true;
                    }
                    if (email && email !== customer.email) {
                        customer.email = email;
                        needUpdate = true;
                    }
                    if (phoneNumber && phoneNumber !== customer.phoneNumber) {
                        customer.phoneNumber = phoneNumber;
                        needUpdate = true;
                    }
                    
                    if (needUpdate) {
                        customer.lastActivity = Date.now();
                        await customer.save();
                    }
                } else {
                    // Tạo mới customer với customerId đã cung cấp
                    customer = new Customer({
                        _id: customerId,
                        name,
                        email,
                        phoneNumber,
                        isRegistered: true,
                        lastActivity: Date.now()
                    });
                    await customer.save();
                }
                
                // Cập nhật thông tin socket
                socket.customerId = customerId;
                socket.customerName = name;
                socket.customerEmail = email;
                socket.customerPhone = phoneNumber;
                
                // Lưu kết nối vào map
                customerSocketMap.set(customerId, socket.id);
                
                // Lưu vào cache
                customerInfoCache.set(customerId, {
                    name,
                    email,
                    phoneNumber,
                    lastActive: Date.now()
                });
                
                // Tìm cuộc trò chuyện hiện có của customer
                let chat = await Chat.findOne({
                    customerId,
                    status: 'active'
                });
                
                // Nếu không có phòng chat active, tạo mới
                if (!chat) {
                    chat = new Chat({
                        customerId,
                        customerName: name,
                        customerEmail: email,
                        customerPhone: phoneNumber,
                        title: `Hỗ trợ khách hàng - ${name}`,
                        status: 'active',
                        lastMessageTime: new Date(),
                        createdAt: new Date()
                    });
                    
                    await chat.save();
                } 
                // Nếu chat đã tồn tại, cập nhật thông tin khách hàng
                else if (chat.customerName !== name || chat.customerEmail !== email || chat.customerPhone !== phoneNumber) {
                    chat.customerName = name;
                    chat.customerEmail = email;
                    chat.customerPhone = phoneNumber;
                    await chat.save();
                }
                
                // Lưu thông tin phòng chat vào socket
                socket.chatId = chat._id;
                
                // Lưu thông tin vào chatRooms
                if (!chatRooms.has(chat._id.toString())) {
                    chatRooms.set(chat._id.toString(), { customer: customerId });
                } else {
                    chatRooms.get(chat._id.toString()).customer = customerId;
                }
                
                // Phản hồi lại thông tin đăng ký thành công
                socket.emit('registration_successful', {
                    customerId,
                    name,
                    email,
                    phoneNumber,
                    chatId: chat._id
                });
                
                // Lấy lịch sử tin nhắn
                const messages = await Message.find({ chatId: chat._id })
                    .sort({ timestamp: 1 })
                    .limit(50);
                
                // Gửi lịch sử tin nhắn cho khách hàng
                socket.emit('chat_history', { 
                    chatId: chat._id, 
                    messages 
                });
                
                // Đánh dấu đã đọc tất cả tin nhắn của admin
                await Message.updateMany(
                    { chatId: chat._id, senderType: 'admin', isRead: false },
                    { isRead: true }
                );
                
                // Cập nhật số tin nhắn chưa đọc
                chat.unreadCustomer = 0;
                await chat.save();
                
                console.log(`Customer registered: ${customerId} (${name})`);
                
                // Thông báo cho admin về khách hàng nếu chưa có admin xử lý
                if (!chat.adminId) {
                    adminIO.emit('new_chat_request', {
                        chat: {
                            ...chat.toObject()
                        }
                    });
                } 
                // Nếu đã có admin xử lý, thông báo customer online
                else {
                    const adminSocketId = adminSocketMap.get(chat.adminId.toString());
                    if (adminSocketId) {
                        adminIO.to(adminSocketId).emit('customer_online', {
                            chatId: chat._id,
                            customerId,
                            customerName: name
                        });
                    }
                }
                
            } catch (error) {
                console.error('Error registering customer:', error);
                socket.emit('error', { 
                    message: 'Có lỗi khi đăng ký thông tin khách hàng' 
                });
            }
        });
        
        // Xử lý kết nối lại
        socket.on('reconnect', async ({ customerId, chatId }) => {
            try {
                if (!customerId) {
                    return socket.emit('error', { 
                        message: 'Không có ID khách hàng để kết nối lại' 
                    });
                }
                
                // Kiểm tra trong cache trước
                const cachedInfo = customerInfoCache.get(customerId);
                let customer;
                
                if (cachedInfo) {
                    // Cập nhật thông tin socket từ cache
                    socket.customerId = customerId;
                    socket.customerName = cachedInfo.name;
                    socket.customerEmail = cachedInfo.email;
                    socket.customerPhone = cachedInfo.phoneNumber;
                    
                    // Cập nhật thời gian hoạt động
                    cachedInfo.lastActive = Date.now();
                    
                    console.log(`Customer reconnected from cache: ${customerId}`);
                } else {
                    // Kiểm tra trong database
                    customer = await Customer.findById(customerId);
                    
                    if (!customer) {
                        return socket.emit('error', {
                            code: 'CUSTOMER_NOT_FOUND',
                            message: 'Không tìm thấy thông tin khách hàng. Vui lòng đăng ký lại.'
                        });
                    }
                    
                    // Cập nhật thông tin socket
                    socket.customerId = customerId;
                    socket.customerName = customer.name;
                    socket.customerEmail = customer.email;
                    socket.customerPhone = customer.phoneNumber;
                    
                    // Lưu vào cache
                    customerInfoCache.set(customerId, {
                        name: customer.name,
                        email: customer.email,
                        phoneNumber: customer.phoneNumber,
                        lastActive: Date.now()
                    });
                    
                    console.log(`Customer reconnected from database: ${customerId}`);
                }
                
                // Cập nhật map kết nối
                customerSocketMap.set(customerId, socket.id);
                
                // Tìm phòng chat hiện có
                let chat;
                
                if (chatId) {
                    // Nếu đã biết chatId, tìm chat theo ID
                    chat = await Chat.findOne({
                        _id: chatId,
                        customerId,
                        status: 'active'
                    });
                }
                
                if (!chat) {
                    // Nếu không tìm thấy bằng chatId, tìm chat active của customer
                    chat = await Chat.findOne({
                        customerId,
                        status: 'active'
                    });
                }
                
                if (!chat) {
                    // Nếu vẫn không tìm thấy, yêu cầu đăng ký lại
                    return socket.emit('require_info', {
                        message: 'Không tìm thấy phòng chat. Vui lòng đăng ký lại thông tin để tạo phòng chat mới.',
                        customerId
                    });
                }
                
                // Kiểm tra và cập nhật thông tin khách hàng trong chat nếu cần
                if (chat.customerName !== socket.customerName || 
                    chat.customerEmail !== socket.customerEmail || 
                    chat.customerPhone !== socket.customerPhone) {
                    
                    chat.customerName = socket.customerName;
                    chat.customerEmail = socket.customerEmail;
                    chat.customerPhone = socket.customerPhone;
                    await chat.save();
                }
                
                // Lưu thông tin phòng chat
                socket.chatId = chat._id;
                
                // Lưu vào chatRooms
                if (!chatRooms.has(chat._id.toString())) {
                    chatRooms.set(chat._id.toString(), { customer: customerId });
                } else {
                    chatRooms.get(chat._id.toString()).customer = customerId;
                }
                
                // Gửi thông tin kết nối lại thành công
                socket.emit('reconnect_successful', {
                    customerId,
                    name: socket.customerName,
                    email: socket.customerEmail,
                    phoneNumber: socket.customerPhone,
                    chatId: chat._id
                });
                
                // Lấy lịch sử tin nhắn
                const messages = await Message.find({ chatId: chat._id })
                    .sort({ timestamp: 1 })
                    .limit(50);
                
                // Gửi lịch sử tin nhắn
                socket.emit('chat_history', {
                    chatId: chat._id,
                    messages
                });
                
                // Đánh dấu đã đọc tất cả tin nhắn của admin
                await Message.updateMany(
                    { chatId: chat._id, senderType: 'admin', isRead: false },
                    { isRead: true }
                );
                
                // Cập nhật số tin nhắn chưa đọc
                chat.unreadCustomer = 0;
                await chat.save();
                
                // Thông báo cho admin
                if (chat.adminId) {
                    const adminSocketId = adminSocketMap.get(chat.adminId.toString());
                    if (adminSocketId) {
                        adminIO.to(adminSocketId).emit('customer_online', {
                            chatId: chat._id,
                            customerId,
                            customerName: socket.customerName
                        });
                    }
                }
                
            } catch (error) {
                console.error('Error reconnecting customer:', error);
                socket.emit('error', { 
                    message: 'Có lỗi khi kết nối lại' 
                });
            }
        });
        
        // Customer gửi tin nhắn
        socket.on('send_message', async ({ chatId, content }) => {
            try {
                // Kiểm tra xem customer đã đăng ký thông tin chưa
                if (!socket.customerId) {
                    return socket.emit('error', { 
                        code: 'NOT_REGISTERED',
                        message: 'Vui lòng cung cấp thông tin khách hàng trước khi gửi tin nhắn' 
                    });
                }
                
                // Kiểm tra chatId có phải là phòng chat đã được gán hay không
                if (!socket.chatId || socket.chatId.toString() !== chatId) {
                    return socket.emit('error', { 
                        code: 'INVALID_CHAT',
                        message: 'Bạn chỉ được phép gửi tin nhắn trong phòng chat đã được gán' 
                    });
                }
                
                // Kiểm tra chat tồn tại
                const chat = await Chat.findById(chatId);
                
                if (!chat || chat.status !== 'active') {
                    return socket.emit('error', { 
                        code: 'CHAT_NOT_FOUND',
                        message: 'Không tìm thấy phòng chat hoặc phòng chat đã đóng'
                    });
                }
                
                // Kiểm tra customer có quyền gửi tin nhắn trong chat này
                if (chat.customerId.toString() !== socket.customerId.toString()) {
                    return socket.emit('error', { 
                        code: 'UNAUTHORIZED',
                        message: 'Bạn không có quyền gửi tin nhắn trong phòng chat này' 
                    });
                }
                
                // Tạo tin nhắn mới
                const newMessage = new Message({
                    chatId: chat._id,
                    senderId: socket.customerId,
                    senderType: 'customer',
                    content,
                    isRead: false,
                    timestamp: new Date()
                });
                
                await newMessage.save();
                
                // Cập nhật thông tin cuộc trò chuyện
                chat.lastMessage = content;
                chat.lastMessageTime = new Date();
                chat.unreadAdmin += 1;
                await chat.save();
                
                // Gửi tin nhắn cho customer
                socket.emit('new_message', {
                    message: {
                        ...newMessage.toObject(),
                        senderName: socket.customerName
                    }
                });
                
                // Gửi tin nhắn cho admin nếu có
                if (chat.adminId) {
                    const adminSocketId = adminSocketMap.get(chat.adminId.toString());
                    
                    if (adminSocketId) {
                        adminIO.to(adminSocketId).emit('new_message', {
                            message: {
                                ...newMessage.toObject(),
                                senderName: socket.customerName
                            }
                        });
                    }
                } else {
                    // Gửi thông báo cho tất cả admin về khách hàng mới
                    adminIO.emit('new_chat_request', {
                        chat: {
                            ...chat.toObject()
                        }
                    });
                }
                
                console.log(`Customer ${socket.customerId} sent message to chat ${chat._id}`);
            } catch (error) {
                console.error('Error sending message:', error);
                socket.emit('error', { 
                    message: 'Có lỗi khi gửi tin nhắn' 
                });
            }
        });
        
        // Customer typing
        socket.on('typing', async ({ chatId, isTyping }) => {
            try {
                // Kiểm tra đã đăng ký và chatId hợp lệ
                if (!socket.customerId || !socket.chatId || socket.chatId.toString() !== chatId) {
                    return;
                }
                
                // Kiểm tra chat tồn tại
                const chat = await Chat.findById(chatId);
                
                if (!chat || chat.customerId.toString() !== socket.customerId.toString()) {
                    return;
                }
                
                // Nếu có admin đang xử lý
                if (chat.adminId) {
                    const adminSocketId = adminSocketMap.get(chat.adminId.toString());
                    
                    if (adminSocketId) {
                        adminIO.to(adminSocketId).emit('customer_typing', {
                            chatId,
                            isTyping
                        });
                    }
                }
            } catch (error) {
                console.error('Error handling typing event:', error);
            }
        });
        
        // Xử lý ngắt kết nối
        socket.on('disconnect', () => {
            if (socket.customerId) {
                console.log(`Customer disconnected: ${socket.customerId}`);
                
                // Xóa kết nối của customer
                customerSocketMap.delete(socket.customerId.toString());
                
                // KHÔNG xóa thông tin khỏi cache để hỗ trợ reconnect
                
                // Thông báo cho admin biết customer đã offline
                if (socket.chatId) {
                    const chatId = socket.chatId.toString();
                    const chatInfo = chatRooms.get(chatId);
                    
                    if (chatInfo && chatInfo.admin) {
                        const adminSocketId = adminSocketMap.get(chatInfo.admin);
                        
                        if (adminSocketId) {
                            adminIO.to(adminSocketId).emit('customer_offline', {
                                chatId,
                                customerId: socket.customerId
                            });
                        }
                    }
                }
            } else {
                console.log('Anonymous customer disconnected');
            }
        });
    });

    // Xử lý kết nối từ admin
    adminIO.on('connection', (socket) => {
        console.log(`Admin connected: ${socket.userId}`);
        
        // Lưu kết nối của admin
        adminSocketMap.set(socket.userId, socket.id);
        
        // Gửi danh sách các cuộc trò chuyện hiện có cho admin
        socket.on('get_chats', async () => {
            try {
                // Tìm tất cả các chat mà admin đang xử lý hoặc chưa có admin nào xử lý
                const chats = await Chat.find({
                    $or: [
                        { adminId: socket.userId },
                        { adminId: { $exists: false } }
                    ],
                    status: 'active'
                })
                .populate('customerId', 'name email phoneNumber') // Lấy thông tin cơ bản của customer
                .sort({ lastMessageTime: -1 }); // Sắp xếp theo thời gian tin nhắn cuối cùng
                
                socket.emit('chat_list', { chats });
            } catch (error) {
                console.error('Error getting chat list:', error);
                socket.emit('error', { message: 'Có lỗi khi lấy danh sách chat' });
            }
        });

        // Admin tham gia vào một cuộc trò chuyện
        socket.on('join_chat', async ({ chatId }) => {
            try {
                // Tìm thông tin cuộc trò chuyện
                const chat = await Chat.findById(chatId);
                
                if (!chat) {
                    return socket.emit('error', { message: 'Không tìm thấy cuộc trò chuyện' });
                }
                
                // Nếu chat chưa có admin hoặc admin khác đang xử lý
                if (chat.adminId && chat.adminId.toString() !== socket.userId) {
                    return socket.emit('error', { message: 'Cuộc trò chuyện đang được xử lý bởi admin khác' });
                }
                
                // Nếu chat chưa có admin, gán admin hiện tại
                if (!chat.adminId) {
                    chat.adminId = socket.userId;
                    await chat.save();
                }
                
                // Admin tham gia vào phòng chat
                socket.join(chatId);
                
                // Lưu thông tin phòng chat
                if (!chatRooms.has(chatId)) {
                    chatRooms.set(chatId, { admin: socket.userId, customer: chat.customerId });
                } else {
                    chatRooms.get(chatId).admin = socket.userId;
                }
                
                // Lấy lịch sử tin nhắn
                const messages = await Message.find({ chatId })
                    .sort({ timestamp: 1 })
                    .limit(50);
                
                // Gửi lịch sử tin nhắn cho admin
                socket.emit('chat_history', { chatId, messages });
                
                // Đánh dấu đã đọc tất cả tin nhắn của customer
                await Message.updateMany(
                    { chatId, senderType: 'customer', isRead: false },
                    { isRead: true }
                );
                
                // Cập nhật số tin nhắn chưa đọc
                chat.unreadAdmin = 0;
                await chat.save();
                
                console.log(`Admin ${socket.userId} joined chat ${chatId}`);
            } catch (error) {
                console.error('Error joining chat:', error);
                socket.emit('error', { message: 'Có lỗi khi tham gia cuộc trò chuyện' });
            }
        });

        // Admin gửi tin nhắn
        socket.on('send_message', async ({ chatId, content }) => {
            try {
                // Kiểm tra chat tồn tại
                const chat = await Chat.findById(chatId);
                
                if (!chat) {
                    return socket.emit('error', { message: 'Không tìm thấy cuộc trò chuyện' });
                }
                
                // Kiểm tra admin có quyền gửi tin nhắn trong chat này
                if (chat.adminId.toString() !== socket.userId) {
                    return socket.emit('error', { message: 'Bạn không có quyền gửi tin nhắn trong cuộc trò chuyện này' });
                }
                
                // Tạo tin nhắn mới
                const newMessage = new Message({
                    chatId,
                    senderId: socket.userId,
                    senderType: 'admin',
                    content,
                    isRead: false,
                    timestamp: new Date()
                });
                
                await newMessage.save();
                
                // Cập nhật thông tin cuộc trò chuyện
                chat.lastMessage = content;
                chat.lastMessageTime = new Date();
                chat.unreadCustomer += 1;
                await chat.save();
                
                // Gửi tin nhắn cho tất cả admin trong phòng
                adminIO.to(chatId).emit('new_message', {
                    message: {
                        ...newMessage.toObject(),
                        senderName: socket.fullname
                    }
                });
                
                // Gửi tin nhắn cho customer
                const customerId = chat.customerId.toString();
                const customerSocketId = customerSocketMap.get(customerId);
                
                if (customerSocketId) {
                    customerIO.to(customerSocketId).emit('new_message', {
                        message: {
                            ...newMessage.toObject(),
                            senderName: socket.fullname
                        }
                    });
                }
                
                console.log(`Admin ${socket.userId} sent message to chat ${chatId}`);
            } catch (error) {
                console.error('Error sending message:', error);
                socket.emit('error', { message: 'Có lỗi khi gửi tin nhắn' });
            }
        });

        // Admin đóng cuộc trò chuyện
        socket.on('close_chat', async ({ chatId }) => {
            try {
                // Kiểm tra chat tồn tại
                const chat = await Chat.findById(chatId);
                
                if (!chat) {
                    return socket.emit('error', { message: 'Không tìm thấy cuộc trò chuyện' });
                }
                
                // Kiểm tra admin có quyền đóng chat này
                if (chat.adminId.toString() !== socket.userId) {
                    return socket.emit('error', { message: 'Bạn không có quyền đóng cuộc trò chuyện này' });
                }
                
                // Đóng cuộc trò chuyện
                chat.status = 'closed';
                await chat.save();
                
                // Thông báo cho tất cả admin
                adminIO.to(chatId).emit('chat_closed', { chatId });
                
                // Thông báo cho customer
                const customerId = chat.customerId.toString();
                const customerSocketId = customerSocketMap.get(customerId);
                
                if (customerSocketId) {
                    customerIO.to(customerSocketId).emit('chat_closed', { chatId });
                }
                
                // Xóa thông tin phòng chat
                chatRooms.delete(chatId);
                
                console.log(`Admin ${socket.userId} closed chat ${chatId}`);
            } catch (error) {
                console.error('Error closing chat:', error);
                socket.emit('error', { message: 'Có lỗi khi đóng cuộc trò chuyện' });
            }
        });

        // Admin typing
        socket.on('typing', ({ chatId, isTyping }) => {
            // Lấy thông tin customer từ phòng chat
            const chatInfo = chatRooms.get(chatId);
            
            if (chatInfo && chatInfo.customer) {
                const customerSocketId = customerSocketMap.get(chatInfo.customer.toString());
                
                if (customerSocketId) {
                    customerIO.to(customerSocketId).emit('admin_typing', {
                        chatId,
                        isTyping
                    });
                }
            }
        });

        // Xử lý ngắt kết nối
        socket.on('disconnect', () => {
            console.log(`Admin disconnected: ${socket.userId}`);
            
            // Xóa kết nối của admin
            adminSocketMap.delete(socket.userId);
        });
    });

    // Cleanup logic - xóa customer cache cũ sau mỗi giờ 
    setInterval(() => {
        const now = Date.now();
        customerInfoCache.forEach((info, customerId) => {
            if (now - info.lastActive > CUSTOMER_CACHE_EXPIRY) {
                customerInfoCache.delete(customerId);
            }
        });
    }, 3600000); // Chạy mỗi giờ

    return io;
}

module.exports = { initSocket }; 