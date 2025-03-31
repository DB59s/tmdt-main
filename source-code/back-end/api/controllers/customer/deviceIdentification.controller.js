const DeviceIdentification = require('../../models/deviceIdentification.model');
const Customer = require('../../models/customer.model');
const crypto = require('crypto');

/**
 * Tạo hash từ một đối tượng để sử dụng làm chỉ mục
 * @param {Object} obj - Đối tượng cần hash
 * @returns {String} - Chuỗi hash
 */
function createHashFromObject(obj) {
  try {
    // Sắp xếp các khóa để đảm bảo tạo ra cùng một hash cho cùng một nội dung
    const sortedObj = {};
    Object.keys(obj).sort().forEach(key => {
      sortedObj[key] = obj[key];
    });
    
    const objString = JSON.stringify(sortedObj);
    return crypto.createHash('md5').update(objString).digest('hex');
  } catch (error) {
    console.error('Error creating hash:', error);
    return '';
  }
}

/**
 * Identify a device and return the associated customer
 * If the device is new, create a new customer record
 */
exports.identifyDevice = async (req, res) => {
  try {
    const {
      fingerprint,
      userAgent,
      ipAddress,
      browser,
      os,
      device,
      screen,
      language,
      timezone,
      hardwareInfo,
      availableMemory,
      devicePixelRatio,
      colorDepth,
      plugins,
      touchSupport,
      webglInfo,
      audioInfo,
      canvasFingerprint,
      fonts,
      locationInfo,
      networkInfo,
      customerId // Thêm tham số customerId nếu client gửi
    } = req.body;
 
    // Validate required fields
    if (!userAgent) {
      return res.status(400).json({
        success: false,
        message: 'userAgent is required'
      });
    }

    // Tạo hash từ thông tin phần cứng nếu có
    let hardwareInfoHash = '';
    if (hardwareInfo) {
      hardwareInfoHash = createHashFromObject(hardwareInfo);
    }

    // Tạo một bộ thông tin để so sánh thiết bị
    const deviceIdentifiers = {
      // Thông tin cơ bản
      os,
      device,
      screen,
      
      // Thông tin chi tiết về phần cứng
      hardwareInfoHash,
      devicePixelRatio,
      colorDepth,
      availableMemory,
      
      // Thông tin về vị trí và mạng
      ipAddress,
      locationInfo,
      networkInfo
    };
    
    // Bỏ các thuộc tính undefined hoặc null
    const cleanedDeviceIdentifiers = JSON.stringify(
      Object.entries(deviceIdentifiers)
        .filter(([_, value]) => value !== undefined && value !== null)
        .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {})
    );

    // Tạo một trọng số cho từng thuộc tính để đánh giá khả năng là cùng thiết bị
    const HARDWARE_MATCH_THRESHOLD = 0.7; // Ngưỡng để xác định là cùng thiết bị
    
    // 1. Tìm thiết bị dựa trên fingerprint nếu có (cách chính xác nhất)
    let deviceMatch = null;
    if (fingerprint) {
      deviceMatch = await DeviceIdentification.findOne({ fingerprint });
      if (deviceMatch) {
        console.log("Found device by fingerprint");
      }
    }
    
    // 2. Nếu không tìm thấy bằng fingerprint, thử tìm bằng hardwareInfoHash
    if (!deviceMatch && hardwareInfoHash) {
      const potentialDevices = await DeviceIdentification.find({
        hardwareInfoHash: hardwareInfoHash
      });
      
      if (potentialDevices.length > 0) {
        // Nếu chỉ có một thiết bị, chọn ngay
        if (potentialDevices.length === 1) {
          deviceMatch = potentialDevices[0];
          console.log("Found device by hardware hash");
        } else {
          // Nếu có nhiều thiết bị, tính điểm tương đồng
          const scoredDevices = potentialDevices.map(device => {
            let matchScore = 0;
            let totalFeatures = 0;
            
            // So sánh các thuộc tính
            if (device.os === os && os) { matchScore += 1; totalFeatures += 1; }
            if (device.device === deviceIdentifiers.device && deviceIdentifiers.device) { matchScore += 2; totalFeatures += 2; } // Trọng số cao hơn
            
            // So sánh screen
            if (device.screen && screen) {
              if (device.screen.width === screen.width && device.screen.height === screen.height) {
                matchScore += 2; totalFeatures += 2;
              }
            }
            
            // So sánh IP address (nếu cùng subnet thì vẫn có khả năng là cùng một thiết bị)
            if (device.ipAddress && ipAddress) {
              const ipParts1 = device.ipAddress.split('.');
              const ipParts2 = ipAddress.split('.');
              if (ipParts1.length === 4 && ipParts2.length === 4) {
                // Nếu 3 octet đầu giống nhau, có thể là cùng mạng
                if (ipParts1[0] === ipParts2[0] && ipParts1[1] === ipParts2[1] && ipParts1[2] === ipParts2[2]) {
                  matchScore += 1; totalFeatures += 1;
                }
              }
            }
            
            // So sánh devicePixelRatio
            if (device.devicePixelRatio === devicePixelRatio && devicePixelRatio) { matchScore += 1; totalFeatures += 1; }
            
            // So sánh colorDepth
            if (device.colorDepth === colorDepth && colorDepth) { matchScore += 0.5; totalFeatures += 0.5; }
            
            // Tính điểm tương đồng (nếu không có đủ thông tin để so sánh, giả định là không trùng)
            const similarityScore = totalFeatures > 0 ? matchScore / totalFeatures : 0;
            
            return {
              device,
              score: similarityScore
            };
          });
          
          // Sắp xếp theo điểm giảm dần và lấy thiết bị có điểm cao nhất
          scoredDevices.sort((a, b) => b.score - a.score);
          
          // Nếu điểm cao nhất vượt ngưỡng, cho rằng đây là cùng một thiết bị
          if (scoredDevices.length > 0 && scoredDevices[0].score >= HARDWARE_MATCH_THRESHOLD) {
            deviceMatch = scoredDevices[0].device;
            console.log(`Found device by hardware matching with score: ${scoredDevices[0].score}`);
          }
        }
      }
    }

    // 3. Nếu vẫn không tìm thấy, thử tìm bằng thông tin network và IP
    if (!deviceMatch && ipAddress) {
      // Tìm thiết bị có cùng IP đã được ghi nhận gần đây (trong vòng 24 giờ)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const sameIpDevices = await DeviceIdentification.find({
        ipAddress: ipAddress,
        lastSeen: { $gte: oneDayAgo }
      }).sort({ lastSeen: -1 });
      
      if (sameIpDevices.length > 0) {
        // Chọn thiết bị được thấy gần đây nhất
        deviceMatch = sameIpDevices[0];
        console.log("Found device by recent IP address");
      }
    }

    // Kiểm tra nếu đã cung cấp customerId và tìm thấy thiết bị
    let existingCustomerId = null;
    if (deviceMatch && deviceMatch.customerId) {
      existingCustomerId = deviceMatch.customerId.toString();
      
      // Nếu client đã cung cấp customerId và khác với customerId của thiết bị được tìm thấy
      if (customerId && customerId !== existingCustomerId) {
        console.log(`Device associated with different customer. Current: ${customerId}, Existing: ${existingCustomerId}`);
      }
    }

    // Xử lý trường hợp tìm thấy thiết bị
    if (deviceMatch) {
      // Cập nhật thông tin thiết bị
      deviceMatch.lastSeen = Date.now();
      deviceMatch.userAgent = userAgent;
      
      // Cập nhật fingerprint nếu không có hoặc đã thay đổi
      if (fingerprint && (!deviceMatch.fingerprint || deviceMatch.fingerprint !== fingerprint)) {
        deviceMatch.fingerprint = fingerprint;
      }
      
      // Cập nhật các thông tin khác nếu được cung cấp
      if (ipAddress) deviceMatch.ipAddress = ipAddress;
      if (browser) deviceMatch.browser = browser;
      if (os) deviceMatch.os = os;
      if (device) deviceMatch.device = device;
      if (screen) deviceMatch.screen = screen;
      if (language) deviceMatch.language = language;
      if (timezone) deviceMatch.timezone = timezone;
      
      // Cập nhật thông tin phần cứng chi tiết
      if (hardwareInfo) {
        deviceMatch.hardwareInfo = hardwareInfo;
        deviceMatch.hardwareInfoHash = hardwareInfoHash;
      }
      if (devicePixelRatio) deviceMatch.devicePixelRatio = devicePixelRatio;
      if (colorDepth) deviceMatch.colorDepth = colorDepth;
      if (availableMemory) deviceMatch.availableMemory = availableMemory;
      if (canvasFingerprint) deviceMatch.canvasFingerprint = canvasFingerprint;
      if (webglInfo) deviceMatch.webglInfo = webglInfo;
      if (locationInfo) deviceMatch.locationInfo = locationInfo;
      if (networkInfo) deviceMatch.networkInfo = networkInfo;
      
      await deviceMatch.save();
      
      // Tìm khách hàng liên kết
      const customer = await Customer.findById(deviceMatch.customerId);
      
      if (customer) {
        // Cập nhật hoạt động gần đây của khách hàng
        customer.lastActivity = Date.now();
        await customer.save();
        
        return res.status(200).json({
          success: true,
          customerId: customer._id,
          isNewCustomer: false,
          isRegistered: customer.isRegistered,
          existingCustomerId: existingCustomerId // Thêm thông tin này cho client nếu cần
        });
      }
    }
    
    // Nếu không tìm thấy thiết bị hoặc không có khách hàng liên kết, tạo mới
    const newDeviceIdentification = new DeviceIdentification({
      fingerprint,
      userAgent,
      ipAddress,
      browser,
      os,
      device,
      screen,
      language,
      timezone,
      // Các thông tin bổ sung
      hardwareInfo,
      hardwareInfoHash,
      devicePixelRatio,
      colorDepth,
      availableMemory,
      canvasFingerprint,
      webglInfo,
      locationInfo,
      networkInfo
    });
    
    // Tạo mới khách hàng hoặc sử dụng customerId đã cung cấp
    let newCustomer;
    if (customerId) {
      // Nếu client đã cung cấp customerId, kiểm tra xem có tồn tại không
      const existingCustomer = await Customer.findById(customerId);
      if (existingCustomer) {
        newCustomer = existingCustomer;
      } else {
        newCustomer = new Customer({
          _id: customerId, // Sử dụng ID đã cung cấp
          deviceId: newDeviceIdentification._id,
          isRegistered: false
        });
      }
    } else {
      // Tạo mới customer nếu không có customerId
      newCustomer = new Customer({
        deviceId: newDeviceIdentification._id,
        isRegistered: false
      });
    }
    
    await newCustomer.save();
    
    // Liên kết khách hàng với thiết bị
    newDeviceIdentification.customerId = newCustomer._id;
    await newDeviceIdentification.save();
    
    return res.status(201).json({
      success: true,
      customerId: newCustomer._id,
      isNewCustomer: true,
      isRegistered: false
    });
    
  } catch (error) {
    console.error('Error identifying device:', error);
    res.status(500).json({
      success: false,
      message: 'Server error when identifying device',
      error: error.message
    });
  }
}; 