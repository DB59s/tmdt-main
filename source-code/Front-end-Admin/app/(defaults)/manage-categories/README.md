# Quản lý danh mục sản phẩm

Module này cung cấp giao diện quản lý danh mục sản phẩm trong hệ thống admin, cho phép admin thực hiện các chức năng CRUD (Create, Read, Update, Delete) đối với danh mục.

## Tính năng

- **Xem danh sách danh mục**: Hiển thị danh sách tất cả các danh mục kèm số lượng sản phẩm thuộc mỗi danh mục.
- **Tìm kiếm danh mục**: Tìm kiếm danh mục theo tên.
- **Thêm danh mục mới**: Tạo một danh mục mới trong hệ thống.
- **Cập nhật danh mục**: Chỉnh sửa thông tin danh mục đã có.
- **Xóa danh mục**: Xóa danh mục không còn sử dụng (chỉ cho phép xóa khi không có sản phẩm nào thuộc danh mục).
- **Xem chi tiết danh mục**: Xem chi tiết thông tin danh mục và danh sách sản phẩm thuộc danh mục đó.

## Hướng dẫn sử dụng

### Xem danh sách danh mục
1. Truy cập vào mục "Manage Categories" từ menu chính.
2. Danh sách danh mục sẽ được hiển thị với các thông tin: tên danh mục và số lượng sản phẩm.

### Tìm kiếm danh mục
1. Nhập từ khóa tìm kiếm vào ô tìm kiếm ở trên đầu danh sách.
2. Hệ thống sẽ lọc và hiển thị các danh mục phù hợp với từ khóa.

### Thêm danh mục mới
1. Nhấn nút "Thêm danh mục" ở trên đầu danh sách.
2. Điền thông tin danh mục mới trong form hiện ra.
3. Nhấn "Thêm danh mục" để lưu.

### Cập nhật danh mục
1. Nhấn nút "Sửa" bên cạnh danh mục cần cập nhật.
2. Chỉnh sửa thông tin trong form hiện ra.
3. Nhấn "Cập nhật" để lưu thay đổi.

### Xóa danh mục
1. Nhấn nút "Xóa" bên cạnh danh mục cần xóa (chỉ khả dụng với danh mục không có sản phẩm).
2. Xác nhận xóa trong hộp thoại hiện ra.

### Xem chi tiết danh mục
1. Nhấn vào tên danh mục trong danh sách.
2. Xem thông tin chi tiết và danh sách sản phẩm thuộc danh mục đó.

## Lưu ý

- Không thể xóa danh mục đang có sản phẩm. Cần di chuyển hoặc xóa tất cả sản phẩm trước khi có thể xóa danh mục.
- Tên danh mục phải là duy nhất trong hệ thống. 