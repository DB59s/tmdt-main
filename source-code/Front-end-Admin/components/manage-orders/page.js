'use client';
import { DataTable } from 'mantine-datatable';
import { useEffect, useState, useCallback } from 'react';
import sortBy from 'lodash/sortBy';
import axios from 'axios'; // Import axios để gọi API
import IconTrashLines from '@/components/icon/icon-trash-lines';
import IconPencilPaper from '@/components/icon/icon-pencil-paper';
import IconEye from '@/components/icon/icon-eye';
import IconCpuBolt from '@/components/icon/icon-cpu-bolt';
import IconLogout from '@/components/icon/icon-logout';

const ManageOrders = () => {
    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [initialRecords, setInitialRecords] = useState([]);
    const [recordsData, setRecordsData] = useState(initialRecords);
    const [selectedRecords, setSelectedRecords] = useState([]);
    const [search, setSearch] = useState('');
    const [sortStatus, setSortStatus] = useState({
        columnAccessor: 'createdAt',
        direction: 'desc',
    });
    const [totalRecords, setTotalRecords] = useState(0);
    const [statusFilter, setStatusFilter] = useState('');
    const [customerNameFilter, setCustomerNameFilter] = useState('');
    const [customerPhoneFilter, setCustomerPhoneFilter] = useState('');
    const [customerEmailFilter, setCustomerEmailFilter] = useState('');
    const [orderIdFilter, setOrderIdFilter] = useState('');
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [sortOrder, setSortOrder] = useState('newest');
    const [selectedStatus, setSelectedStatus] = useState(''); // Thêm state để lưu trạng thái đã chọn để cập nhật hàng loạt
    const [isUpdating, setIsUpdating] = useState(false); // Thêm state để kiểm soát trạng thái đang cập nhật
    const [selectedOrderStatus, setSelectedOrderStatus] = useState({});

    // Danh sách trạng thái đơn hàng
    const orderStatuses = [
        'Đã đặt hàng',
        'Đã xác nhận',
        'Đang đóng gói',
        'Đơn vị giao hàng đang lấy hàng',
        'Đang vận chuyển',
        'Đã đến kho phân loại',
        'Đang tới địa chỉ giao hàng',
        'Đã giao hàng',
        'Đã hủy'
    ];

    // Tách hàm fetchOrders ra để có thể gọi lại
    const fetchOrders = useCallback(async () => {
        try {
            const response = await axios.get('https://vuquangduy.io.vn/api/admin/orders', {
                params: {
                    page: page,
                    limit: pageSize,
                    status: statusFilter,
                    orderId: orderIdFilter,
                    customerName: customerNameFilter,
                    customerPhone: customerPhoneFilter,
                    customerEmail: customerEmailFilter
                },
                headers: {
                    authorization: `${sessionStorage.getItem('token')}`
                }
            });
            setInitialRecords(response.data.orders);
            setRecordsData(response.data.orders);
            setTotalRecords(response.data.totalOrders);
        } catch (error) {
            console.error('Error fetching orders:', error);
        }
    }, [page, pageSize, statusFilter, orderIdFilter, customerNameFilter, customerPhoneFilter, customerEmailFilter]);

    useEffect(() => {
        // Gọi API để lấy tất cả category
        const fetchCategories = async () => {
            try {
                const response = await axios.get('https://vuquangduy.io.vn/api/categories'); // Đảm bảo URL đúng
                setCategories(response.data); // Cập nhật danh sách category
                
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };

        fetchCategories();
    }, []); // Chỉ gọi một lần khi component mount

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    useEffect(() => {
        setPage(1);
    }, [pageSize, statusFilter, orderIdFilter, customerNameFilter, customerPhoneFilter, customerEmailFilter]);

    // Log ra ID của các đơn hàng đã chọn khi có thay đổi
    useEffect(() => {
        console.log("Selected order IDs:", selectedRecords);
    }, [selectedRecords]);

    const handleViewOrder = (id) => {
        // Logic để xem chi tiết đơn hàng
        console.log("View order with ID:", id);
        // Có thể chuyển hướng đến trang chi tiết đơn hàng
        // window.location.href = `/manage-orders/${id}`;
    };

    const handleEditOrder = (id) => {
        // Logic để chỉnh sửa đơn hàng
        console.log("Edit order with ID:", id);
    };

    const handleUpdateStatus = async (id, newStatus) => {
        try {
            setIsUpdating(true);
            const response = await axios.patch('https://vuquangduy.io.vn/api/admin/orders/update-status', {
                orderId: id,
                status: newStatus
            }, {
                headers: {
                    authorization: `${sessionStorage.getItem('token')}`
                }
            });
            
            // Fetch lại dữ liệu sau khi cập nhật
            await fetchOrders();
            alert('Cập nhật trạng thái đơn hàng thành công!');
        } catch (error) {
            console.error('Error updating order status:', error);
            alert('Đã xảy ra lỗi khi cập nhật trạng thái đơn hàng!');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleUpdateMultipleOrders = async () => {
        if (selectedRecords.length === 0) {
            alert('Vui lòng chọn ít nhất một đơn hàng!');
            return;
        }

        if (!selectedStatus) {
            alert('Vui lòng chọn trạng thái để cập nhật!');
            return;
        }

        try {
            setIsUpdating(true);
            const response = await axios.patch('https://vuquangduy.io.vn/api/admin/orders/update-multiple', {
                orderIds: selectedRecords,
                status: selectedStatus
            }, {
                headers: {
                    authorization: `${sessionStorage.getItem('token')}`
                }
            });
            
            // Fetch lại dữ liệu sau khi cập nhật
            await fetchOrders();
            setSelectedRecords([]); // Reset danh sách đã chọn
            setSelectedStatus(''); // Reset trạng thái đã chọn
            alert(`Đã cập nhật ${response.data.updatedCount} đơn hàng thành công!`);
        } catch (error) {
            console.error('Error updating multiple orders:', error);
            alert('Đã xảy ra lỗi khi cập nhật nhiều đơn hàng!');
        } finally {
            setIsUpdating(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN');
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    // Hàm xử lý khi chọn/bỏ chọn đơn hàng
    const handleSelectedRecordsChange = (ids) => {
        setSelectedRecords(ids);
    };

    const handleSelectStatus = (orderId, status) => {
        setSelectedOrderStatus({
            ...selectedOrderStatus,
            [orderId]: status
        });
    };

    const handleUpdateSingleOrder = (orderId) => {
        const newStatus = selectedOrderStatus[orderId];
        if (!newStatus) {
            alert('Vui lòng chọn trạng thái để cập nhật!');
            return;
        }
        handleUpdateStatus(orderId, newStatus);
    };

    return (
        <div className="panel mt-6">
            <div className="mb-5 flex flex-col gap-5 md:flex-row md:items-center">
                <h5 className="text-lg font-semibold dark:text-white-light">Quản lý đơn hàng</h5>
            </div>

            <div className="mb-5 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                <div>
                    <label>Mã đơn hàng</label>
                    <input
                        type="text"
                        className="form-input w-full"
                        placeholder="Tìm theo mã đơn hàng..."
                        value={orderIdFilter}
                        onChange={(e) => setOrderIdFilter(e.target.value)}
                    />
                </div>
                <div>
                    <label>Tên khách hàng</label>
                    <input
                        type="text"
                        className="form-input w-full"
                        placeholder="Tìm theo tên khách hàng..."
                        value={customerNameFilter}
                        onChange={(e) => setCustomerNameFilter(e.target.value)}
                    />
                </div>
                <div>
                    <label>Số điện thoại</label>
                    <input
                        type="text"
                        className="form-input w-full"
                        placeholder="Tìm theo số điện thoại..."
                        value={customerPhoneFilter}
                        onChange={(e) => setCustomerPhoneFilter(e.target.value)}
                    />
                </div>
                <div>
                    <label>Email</label>
                    <input
                        type="text"
                        className="form-input w-full"
                        placeholder="Tìm theo email..."
                        value={customerEmailFilter}
                        onChange={(e) => setCustomerEmailFilter(e.target.value)}
                    />
                </div>
                <div>
                    <label>Trạng thái</label>
                    <select
                        className="form-select w-full"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="">Tất cả trạng thái</option>
                        {orderStatuses.map((status) => (
                            <option key={status} value={status}>
                                {status}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Phần cập nhật hàng loạt */}
            <div className="mb-5 border border-gray-200 p-4 rounded-md bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                    <div className="flex items-center">
                        <span className="mr-2 font-semibold">Đã chọn: {selectedRecords.length} đơn hàng</span>
                    </div>
                    <div className="flex-1">
                        <select
                            className="form-select w-full md:w-auto"
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            disabled={selectedRecords.length === 0 || isUpdating}
                        >
                            <option value="">Chọn trạng thái để cập nhật</option>
                            {orderStatuses.map((status) => (
                                <option key={status} value={status}>
                                    {status}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button 
                        className="btn btn-primary" 
                        onClick={handleUpdateMultipleOrders}
                        disabled={selectedRecords.length === 0 || !selectedStatus || isUpdating}
                    >
                        {isUpdating ? 'Đang cập nhật...' : 'Cập nhật đơn hàng đã chọn'}
                    </button>
                </div>
            </div>

            <div className="datatables">
                <DataTable
                    className="table-hover whitespace-nowrap"
                    records={recordsData}
                    columns={[
                        { 
                            accessor: 'orderId',
                            title: 'Mã đơn hàng',
                            sortable: true 
                        },
                        { 
                            accessor: 'customerName',
                            title: 'Khách hàng',
                            sortable: true 
                        },
                        { 
                            accessor: 'customerPhone',
                            title: 'Số điện thoại',
                            sortable: true 
                        },
                        { 
                            accessor: 'totalAmount',
                            title: 'Tổng tiền',
                            sortable: true,
                        },
                        { 
                            accessor: 'status',
                            title: 'Trạng thái',
                            sortable: true,
                            render: ({ status }) => (
                                <span className={`badge ${getStatusBadgeClass(status)}`}>
                                    {status}
                                </span>
                            )
                        },
                        { 
                            accessor: 'createdAt',
                            title: 'Ngày đặt',
                            sortable: true,
                            render: ({ createdAt }) => formatDate(createdAt)
                        },
                        {
                            accessor: 'actions',
                            title: 'Thao tác',
                            width: '20%',
                            render: (record) => (
                                <div className="action-buttons" style={{ width: "100%" }}>
                                    <button title="Xem chi tiết" onClick={() => handleViewOrder(record._id)}><IconEye /></button>
                                    <button title="Cập nhật trạng thái" onClick={() => handleEditOrder(record._id)}><IconPencilPaper /></button>
                                    <div className="dropdown">
                                        <select
                                            className="form-select form-select-sm"
                                            value={selectedOrderStatus[record._id] || ''}
                                            onChange={(e) => handleSelectStatus(record._id, e.target.value)}
                                        >
                                            <option value="">Chọn trạng thái</option>
                                            {orderStatuses.map(status => (
                                                <option 
                                                    key={status} 
                                                    value={status}
                                                    style={{ 
                                                        color: status === record.status ? 'red' : 'inherit',
                                                        fontWeight: status === record.status ? 'bold' : 'normal'
                                                    }}
                                                >
                                                    {status} {status === record.status ? '(Hiện tại)' : ''}
                                                </option>
                                            ))}
                                        </select>
                                        <button 
                                            className="btn btn-sm btn-primary mt-1"
                                            onClick={() => handleUpdateSingleOrder(record._id)}
                                            disabled={!selectedOrderStatus[record._id] || isUpdating}
                                        >
                                            Cập nhật
                                        </button>
                                    </div>
                                </div>
                            ),
                        },
                    ]}
                    highlightOnHover
                    totalRecords={totalRecords}
                    recordsPerPage={pageSize}
                    page={page}
                    onPageChange={(p) => setPage(p)}
                    recordsPerPageOptions={PAGE_SIZES}
                    onRecordsPerPageChange={setPageSize}
                    sortStatus={sortStatus}
                    onSortStatusChange={setSortStatus}
                    selectedRecords={selectedRecords}
                    onSelectedRecordsChange={handleSelectedRecordsChange}
                    minHeight={200}
                    paginationText={({ from, to, totalRecords }) => `Hiển thị ${from} đến ${to} của ${totalRecords} đơn hàng`}
                    checkboxColumn
                    idAccessor="_id"
                />
            </div>
        </div>
    );
};

// Hàm trợ giúp để lấy class cho badge trạng thái
function getStatusBadgeClass(status) {
    const statusClasses = {
        'Đã đặt hàng': 'badge-outline-info',
        'Đã xác nhận': 'badge-outline-primary',
        'Đang đóng gói': 'badge-outline-secondary',
        'Đơn vị giao hàng đang lấy hàng': 'badge-outline-warning',
        'Đang vận chuyển': 'badge-outline-warning',
        'Đã đến kho phân loại': 'badge-outline-warning',
        'Đang tới địa chỉ giao hàng': 'badge-outline-warning',
        'Đã giao hàng': 'badge-outline-success',
        'Đã hủy': 'badge-outline-danger'
    };
    
    return statusClasses[status] || 'badge-outline-info';
}

export default ManageOrders;