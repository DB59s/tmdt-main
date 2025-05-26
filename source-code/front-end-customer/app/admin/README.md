# Admin Redirect Page

Thư mục này chứa các phiên bản khác nhau của trang redirect từ `localhost:5000/admin` sang `localhost:3000`.

## Các file có sẵn:

### 1. `page.js` (Đang sử dụng)
- **Loại**: Client-side redirect ngay lập tức
- **Mô tả**: Redirect ngay khi component được mount
- **Ưu điểm**: Đơn giản, có loading animation
- **Nhược điểm**: Cần JavaScript để hoạt động

### 2. `redirect-server.js` 
- **Loại**: Server-side redirect
- **Mô tả**: Redirect từ phía server, hiệu suất cao hơn
- **Ưu điểm**: Nhanh hơn, không cần JavaScript
- **Nhược điểm**: Không có UI loading

### 3. `redirect-with-delay.js`
- **Loại**: Client-side redirect với countdown
- **Mô tả**: Có countdown 3 giây trước khi redirect
- **Ưu điểm**: UI đẹp, cho phép user cancel
- **Nhược điểm**: Chậm hơn do có delay

## Cách thay đổi phiên bản:

### Để sử dụng Server-side redirect (nhanh nhất):
```bash
# Backup file hiện tại
mv app/admin/page.js app/admin/page-client.js

# Sử dụng server redirect
mv app/admin/redirect-server.js app/admin/page.js
```

### Để sử dụng Redirect với delay (UI đẹp):
```bash
# Backup file hiện tại  
mv app/admin/page.js app/admin/page-instant.js

# Sử dụng delay redirect
mv app/admin/redirect-with-delay.js app/admin/page.js
```

## Cách tùy chỉnh URL đích:

Trong bất kỳ file nào, thay đổi:
```javascript
'http://localhost:3000'
```

Thành URL mong muốn, ví dụ:
```javascript
'http://localhost:8080/admin'
'https://admin.yoursite.com'
```

## Test redirect:

1. Chạy server: `npm run dev:5000`
2. Truy cập: `http://localhost:5000/admin`
3. Kiểm tra xem có redirect đến `localhost:3000` không
