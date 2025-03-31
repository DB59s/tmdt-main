# Tài liệu API cho Admin

## Mục lục
1. [Xác thực](#xác-thực)
2. [Quản lý sản phẩm](#quản-lý-sản-phẩm)
3. [Quản lý danh mục](#quản-lý-danh-mục)
4. [Quản lý đơn hàng](#quản-lý-đơn-hàng)
5. [Quản lý mã giảm giá](#quản-lý-mã-giảm-giá)
6. [Quản lý yêu cầu đổi/trả hàng](#quản-lý-yêu-cầu-đổi-trả-hàng)
7. [Quản lý đánh giá](#quản-lý-đánh-giá)
8. [Dashboard & Thống kê](#dashboard--thống-kê)
9. [Quản lý tệp và hình ảnh](#quản-lý-tệp-và-hình-ảnh)

## Xác thực

### Đăng nhập Admin
- **URL**: `/api/login`
- **Method**: `POST`
- **Mô tả**: Đăng nhập vào hệ thống với quyền admin
- **Body**:
  ```json
  {
    "email": "admin@example.com",
    "password": "password"
  }
  ```
- **Response Success**:
  ```json
  {
    "success": true,
    "message": "Đăng nhập thành công",
    "token": "jwt_token_here",
    "user": {
      "_id": "user_id",
      "name": "Admin Name",
      "email": "admin@example.com",
      "role": "1"  // 1 là role admin
    }
  }
  ```


## Quản lý sản phẩm

### Lấy danh sách sản phẩm
- **URL**: `/api/admin/products`
- **Method**: `GET`
- **Headers**: `authorization: {token}`
- **Params**:
  - `page`: số trang (mặc định: 1)
  - `limit`: số sản phẩm mỗi trang (mặc định: 10)
  - `search`: từ khóa tìm kiếm
  - `category`: lọc theo danh mục
  - `minPrice`: giá tối thiểu
  - `maxPrice`: giá tối đa
  - `onSale`: lọc sản phẩm đang giảm giá (true/false)
  - `sort`: sắp xếp (newest, oldest, price-low, price-high, name-asc, name-desc)
- **Response Success**:
  ```json
  {
    "products": [...],
    "totalProducts": 100,
    "totalPages": 10,
    "currentPage": 1,
    "limit": 10
  }
  ```

### Tạo sản phẩm mới
- **URL**: `/api/admin/products`
- **Method**: `POST`
- **Headers**: `authorization: {token}`
- **Body**:
  ```json
  {
    "title": "Tên sản phẩm",
    "description": "Mô tả sản phẩm",
    "categoryId": "category_id",
    "price": 100000,
    "priceBeforeSale": 120000,
    "discountPercentage": 16.67,
    "rating": 0,
    "stock": 100,
    "tags": ["tag1", "tag2"],
    "brand": "Thương hiệu",
    "sku": "SP001",
    "weight": 0.5,
    "dimensions": {
      "width": 10,
      "height": 5,
      "depth": 2
    },
    "warrantyInformation": "Thông tin bảo hành",
    "shippingInformation": "Thông tin vận chuyển",
    "availabilityStatus": "Còn hàng",
    "returnPolicy": "Chính sách đổi trả",
    "images": ["url1", "url2"],
    "thumbnail": "url_thumbnail",
    "onSale": true
  }
  ```
- **Response Success**:
  ```json
  {
    "message": "Thêm sản phẩm thành công",
    "product": {...}
  }
  ```

### Cập nhật sản phẩm
- **URL**: `/api/admin/products/:id`
- **Method**: `PATCH`
- **Headers**: `authorization: {token}`
- **Body**: Các trường cần cập nhật (tương tự như khi tạo sản phẩm)
- **Response Success**:
  ```json
  {
    "message": "Cập nhật sản phẩm thành công",
    "product": {...}
  }
  ```

### Xóa sản phẩm
- **URL**: `/api/admin/products/:id`
- **Method**: `DELETE`
- **Headers**: `authorization: {token}`
- **Response Success**:
  ```json
  {
    "message": "Xóa sản phẩm thành công",
    "productId": "product_id"
  }
  ```

### Tính toán giá trước khi giảm giá
- **URL**: `/api/admin/products/calculate-price`
- **Method**: `POST`
- **Headers**: `authorization: {token}`
- **Body**:
  ```json
  {
    "price": 100000,
    "discountPercentage": 20
  }
  ```
- **Response Success**:
  ```json
  {
    "priceBeforeSale": 125000,
    "price": 100000,
    "discountPercentage": 20
  }
  ```

### Tính lại giá gốc cho tất cả sản phẩm
- **URL**: `/api/admin/products/calculate-all-prices`
- **Method**: `POST`
- **Headers**: `authorization: {token}`
- **Response Success**:
  ```json
  {
    "message": "Đã cập nhật giá ban đầu cho X sản phẩm",
    "updated": 50,
    "total": 100,
    "errors": 0
  }
  ```

### Đặt trạng thái giảm giá theo danh mục
- **URL**: `/api/admin/products/set-sale-by-category`
- **Method**: `POST`
- **Headers**: `authorization: {token}`
- **Body**:
  ```json
  {
    "categoryId": "category_id",
    "discountPercentage": 15
  }
  ```
- **Response Success**:
  ```json
  {
    "message": "Đã cập nhật 20 sản phẩm thuộc danh mục thành đang sale và đặt các sản phẩm còn lại thành không sale",
    "productsUpdated": 20,
    "categoryId": "category_id",
    "discountPercentage": 15,
    "updatedProducts": [...]
  }
  ```

## Quản lý danh mục

### Lấy danh sách danh mục
- **URL**: `/api/admin/categories`
- **Method**: `GET`
- **Headers**: `authorization: {token}`
- **Response Success**:
  ```json
  {
    "categories": [
      {
        "_id": "category_id",
        "name": "Tên danh mục",
        "createdAt": "timestamp",
        "updatedAt": "timestamp"
      }
    ]
  }
  ```

### Tạo danh mục mới
- **URL**: `/api/admin/categories`
- **Method**: `POST`
- **Headers**: `authorization: {token}`
- **Body**:
  ```json
  {
    "name": "Tên danh mục"
  }
  ```
- **Response Success**:
  ```json
  {
    "message": "Thêm danh mục thành công",
    "category": {
      "_id": "category_id",
      "name": "Tên danh mục",
      "createdAt": "timestamp",
      "updatedAt": "timestamp"
    }
  }
  ```

### Cập nhật danh mục
- **URL**: `/api/admin/categories/:id`
- **Method**: `PATCH`
- **Headers**: `authorization: {token}`
- **Body**:
  ```json
  {
    "name": "Tên danh mục mới"
  }
  ```
- **Response Success**:
  ```json
  {
    "message": "Cập nhật danh mục thành công",
    "category": {...}
  }
  ```

### Xóa danh mục
- **URL**: `/api/admin/categories/:id`
- **Method**: `DELETE`
- **Headers**: `authorization: {token}`
- **Response Success**:
  ```json
  {
    "message": "Xóa danh mục thành công",
    "categoryId": "category_id"
  }
  ```

## Quản lý đơn hàng

### Lấy danh sách đơn hàng
- **URL**: `/api/admin/orders`
- **Method**: `GET`
- **Headers**: `authorization: {token}`
- **Params**:
  - `page`: số trang (mặc định: 1)
  - `limit`: số đơn hàng mỗi trang (mặc định: 10)
  - `status`: lọc theo trạng thái (Đang xác nhận, Đang đóng gói, Đang giao hàng, Đã giao hàng, Đã hủy)
  - `fromDate`: từ ngày (yyyy-mm-dd)
  - `toDate`: đến ngày (yyyy-mm-dd)
  - `search`: tìm kiếm theo tên, email, phone hoặc mã đơn hàng
- **Response Success**:
  ```json
  {
    "orders": [...],
    "totalOrders": 50,
    "totalPages": 5,
    "currentPage": 1,
    "limit": 10
  }
  ```

### Lấy chi tiết đơn hàng
- **URL**: `/api/admin/orders/:id`
- **Method**: `GET`
- **Headers**: `authorization: {token}`
- **Response Success**:
  ```json
  {
    "order": {...},
    "orderItems": [...],
    "orderTracking": [...]
  }
  ```

### Cập nhật trạng thái đơn hàng
- **URL**: `/api/admin/orders/:id/status`
- **Method**: `PATCH`
- **Headers**: `authorization: {token}`
- **Body**:
  ```json
  {
    "status": "Đang giao hàng",
    "note": "Ghi chú cho việc cập nhật trạng thái"
  }
  ```
- **Response Success**:
  ```json
  {
    "message": "Cập nhật trạng thái đơn hàng thành công",
    "order": {...},
    "tracking": {
      "status": "Đang giao hàng",
      "description": "Ghi chú cho việc cập nhật trạng thái",
      "updatedBy": "admin_name",
      "updatedAt": "timestamp"
    }
  }
  ```

## Quản lý mã giảm giá

### Lấy danh sách mã giảm giá
- **URL**: `/api/admin/discounts`
- **Method**: `GET`
- **Headers**: `authorization: {token}`
- **Params**:
  - `page`: số trang (mặc định: 1)
  - `limit`: số mã giảm giá mỗi trang (mặc định: 10)
  - `active`: lọc theo trạng thái kích hoạt (true/false)
- **Response Success**:
  ```json
  {
    "discounts": [...],
    "totalDiscounts": 20,
    "totalPages": 2,
    "currentPage": 1,
    "limit": 10
  }
  ```

### Tạo mã giảm giá mới
- **URL**: `/api/admin/discounts`
- **Method**: `POST`
- **Headers**: `authorization: {token}`
- **Body**:
  ```json
  {
    "code": "SUMMER2023",
    "description": "Giảm giá hè 2023",
    "amount": 50000,
    "type": "fixed",  // "fixed" hoặc "percentage"
    "minimumOrderAmount": 200000,
    "expirationDate": "2023-08-31T23:59:59Z",
    "quantity": 100,
    "isActive": true
  }
  ```
- **Response Success**:
  ```json
  {
    "message": "Thêm mã giảm giá thành công",
    "discount": {...}
  }
  ```

### Cập nhật mã giảm giá
- **URL**: `/api/admin/discounts/:id`
- **Method**: `PATCH`
- **Headers**: `authorization: {token}`
- **Body**: Các trường cần cập nhật (tương tự như khi tạo mã giảm giá)
- **Response Success**:
  ```json
  {
    "message": "Cập nhật mã giảm giá thành công",
    "discount": {...}
  }
  ```

### Xóa mã giảm giá
- **URL**: `/api/admin/discounts/:id`
- **Method**: `DELETE`
- **Headers**: `authorization: {token}`
- **Response Success**:
  ```json
  {
    "message": "Xóa mã giảm giá thành công",
    "discountId": "discount_id"
  }
  ```

## Quản lý yêu cầu đổi/trả hàng

### Lấy danh sách yêu cầu đổi/trả hàng
- **URL**: `/api/admin/return-requests`
- **Method**: `GET`
- **Headers**: `authorization: {token}`
- **Params**:
  - `page`: số trang (mặc định: 1)
  - `limit`: số yêu cầu mỗi trang (mặc định: 10)
  - `status`: lọc theo trạng thái (pending, processing, approved, completed, rejected)
  - `requestType`: lọc theo loại yêu cầu (exchange, refund)
  - `sortBy`: sắp xếp theo trường (createdAt, updatedAt)
  - `sortOrder`: thứ tự sắp xếp (asc, desc)
  - `search`: tìm kiếm theo tên, email, phone
- **Response Success**:
  ```json
  {
    "success": true,
    "count": 10,
    "total": 50,
    "totalPages": 5,
    "currentPage": 1,
    "data": [...]
  }
  ```

### Lấy chi tiết yêu cầu đổi/trả hàng
- **URL**: `/api/admin/return-requests/:id`
- **Method**: `GET`
- **Headers**: `authorization: {token}`
- **Response Success**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "return_request_id",
      "orderId": {...},
      "customerName": "Tên khách hàng",
      "customerEmail": "email@example.com",
      "customerPhone": "0123456789",
      "customerId": {...},
      "requestType": "exchange/refund",
      "reason": "Lý do đổi/trả",
      "images": ["url1", "url2"],
      "items": [...],
      "refundInfo": {...},
      "totalRefundAmount": 150000,
      "status": "pending",
      "adminNote": "",
      "statusHistory": [...],
      "exchangeItems": [...],
      "createdAt": "timestamp",
      "updatedAt": "timestamp"
    }
  }
  ```

### Cập nhật trạng thái yêu cầu đổi/trả hàng
- **URL**: `/api/admin/return-requests/:id/status`
- **Method**: `PUT`
- **Headers**: `authorization: {token}`
- **Body**:
  ```json
  {
    "status": "processing",
    "note": "Đang xử lý yêu cầu của bạn",
    "adminName": "Admin Name"
  }
  ```
- **Response Success**:
  ```json
  {
    "success": true,
    "message": "Đã cập nhật trạng thái yêu cầu đổi/trả hàng",
    "data": {...}
  }
  ```

### Thêm sản phẩm thay thế cho yêu cầu đổi hàng
- **URL**: `/api/admin/return-requests/:id/exchange-items`
- **Method**: `POST`
- **Headers**: `authorization: {token}`
- **Body**:
  ```json
  {
    "exchangeItems": [
      {
        "productId": "product_id",
        "quantity": 1
      }
    ]
  }
  ```
- **Response Success**:
  ```json
  {
    "success": true,
    "message": "Đã thêm sản phẩm thay thế cho yêu cầu đổi hàng",
    "data": {...}
  }
  ```

## Quản lý đánh giá

### Lấy danh sách đánh giá
- **URL**: `/api/admin/reviews`
- **Method**: `GET`
- **Headers**: `authorization: {token}`
- **Params**:
  - `page`: số trang (mặc định: 1)
  - `limit`: số đánh giá mỗi trang (mặc định: 10)
  - `productId`: lọc theo sản phẩm
  - `rating`: lọc theo số sao (1-5)
  - `sortBy`: sắp xếp theo trường (createdAt, rating)
  - `sortOrder`: thứ tự sắp xếp (asc, desc)
- **Response Success**:
  ```json
  {
    "reviews": [...],
    "totalReviews": 100,
    "totalPages": 10,
    "currentPage": 1,
    "limit": 10
  }
  ```

### Xóa đánh giá
- **URL**: `/api/admin/reviews/:id`
- **Method**: `DELETE`
- **Headers**: `authorization: {token}`
- **Response Success**:
  ```json
  {
    "message": "Xóa đánh giá thành công",
    "reviewId": "review_id"
  }
  ```

## Dashboard & Thống kê

### Tổng quan doanh số
- **URL**: `/api/admin/statistics/overview`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer {token}`
- **Response Success**:
  ```json
  {
    "totalRevenue": 15000000,
    "totalOrders": 150,
    "totalProducts": 80,
    "totalCustomers": 200,
    "recentOrders": [...],
    "topSellingProducts": [...]
  }
  ```

### Thống kê doanh thu theo thời gian
- **URL**: `/api/admin/statistics/revenue`
- **Method**: `GET`
- **Headers**: `authorization: {token}`
- **Params**:
  - `period`: giai đoạn (day, week, month, year)
  - `fromDate`: từ ngày (yyyy-mm-dd)
  - `toDate`: đến ngày (yyyy-mm-dd)
- **Response Success**:
  ```json
  {
    "revenueData": [
      {
        "date": "2023-05-01",
        "revenue": 1500000,
        "orders": 15
      },
      // ...
    ]
  }
  ```

### Thống kê sản phẩm bán chạy
- **URL**: `/api/admin/statistics/top-products`
- **Method**: `GET`
- **Headers**: `authorization: {token}`
- **Params**:
  - `limit`: số lượng sản phẩm (mặc định: 10)
  - `fromDate`: từ ngày (yyyy-mm-dd)
  - `toDate`: đến ngày (yyyy-mm-dd)
- **Response Success**:
  ```json
  {
    "topProducts": [
      {
        "product": {...},
        "totalSold": 50,
        "totalRevenue": 5000000
      },
      // ...
    ]
  }
  ```

### Thống kê tỷ lệ đơn hàng bị đổi/trả
- **URL**: `/api/admin/statistics/return-rate`
- **Method**: `GET`
- **Headers**: `authorization: {token}`
- **Params**:
  - `fromDate`: từ ngày (yyyy-mm-dd)
  - `toDate`: đến ngày (yyyy-mm-dd)
- **Response Success**:
  ```json
  {
    "totalOrders": 150,
    "totalReturns": 10,
    "returnRate": 6.67,
    "returnsByReason": [
      {
        "reason": "Sản phẩm bị lỗi",
        "count": 5,
        "percentage": 50
      },
      // ...
    ]
  }
  ```

## Quản lý tệp và hình ảnh

### Upload một hình ảnh
- **URL**: `/api/upload`
- **Method**: `POST`
- **Headers**: `authorization: {token}`
- **Body**: Form Data với field `image` chứa file hình ảnh
- **Response Success**:
  ```json
  {
    "success": true,
    "message": "Upload thành công",
    "file": {
      "filename": "generated_filename.jpg",
      "originalname": "original_name.jpg",
      "size": 12345,
      "path": "/path/to/file",
      "url": "http://domain.com/uploads/images/generated_filename.jpg"
    }
  }
  ```

### Upload nhiều hình ảnh
- **URL**: `/api/upload/multiple`
- **Method**: `POST`
- **Headers**: `authorization: {token}`
- **Body**: Form Data với field `images` chứa các file hình ảnh
- **Response Success**:
  ```json
  {
    "success": true,
    "message": "Upload thành công",
    "files": [...],
    "urls": [
      "http://domain.com/uploads/images/file1.jpg",
      "http://domain.com/uploads/images/file2.jpg"
    ]
  }
  ```

---

## Đề xuất thêm các API cần triển khai

### 1. Dashboard & Thống kê
- **Thống kê theo danh mục**: Hiển thị tỷ lệ doanh thu theo từng danh mục
- **Thống kê khách hàng thân thiết**: Những khách hàng có lịch sử mua hàng tốt nhất
- **Thống kê tồn kho**: Cảnh báo sản phẩm sắp hết hàng

### 2. Quản lý người dùng
- Cần bổ sung đầy đủ các API quản lý người dùng (danh sách, chi tiết, khóa/mở khóa)

### 3. Quản lý đánh giá
- Cần triển khai API kiểm duyệt đánh giá (chấp nhận/từ chối)

### 4. Quản lý hệ thống
- API cấu hình toàn hệ thống (thiết lập chung) 