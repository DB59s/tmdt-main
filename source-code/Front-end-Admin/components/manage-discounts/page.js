'use client';
import { DataTable } from 'mantine-datatable';
import { useEffect, useState, useCallback } from 'react';
import sortBy from 'lodash/sortBy';
import axios from 'axios';
import IconTrashLines from '@/components/icon/icon-trash-lines';
import IconPencilPaper from '@/components/icon/icon-pencil-paper';
import IconEye from '@/components/icon/icon-eye';
import IconPlus from '@/components/icon/icon-plus';

const ManageDiscounts = () => {
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
    const [codeFilter, setCodeFilter] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentDiscount, setCurrentDiscount] = useState(null);
    const [formData, setFormData] = useState({
        code: '',
        amount: 0,
        quantity: 0,
        expirationDate: ''
    });

    // Tách hàm fetchDiscounts ra để có thể gọi lại
    const fetchDiscounts = useCallback(async () => {
        try {
            const response = await axios.get('http://localhost:8080/api/admin/discounts', {
                params: {
                    page: page,
                    limit: pageSize,
                    code: codeFilter
                },
                headers: {
                    authorization: `${sessionStorage.getItem('token')}`
                }
            });
            setInitialRecords(response.data.data.discounts);
            setRecordsData(response.data.data.discounts);
            setTotalRecords(response.data.data.pagination.total);
        } catch (error) {
            console.error('Error fetching discounts:', error);
        }
    }, [page, pageSize, codeFilter]);

    useEffect(() => {
        fetchDiscounts();
    }, [fetchDiscounts]);

    useEffect(() => {
        setPage(1);
    }, [pageSize, codeFilter]);

    // Log ra ID của các mã giảm giá đã chọn khi có thay đổi
    useEffect(() => {
        console.log("Selected discount IDs:", selectedRecords);
    }, [selectedRecords]);

    const handleViewDiscount = (id) => {
        console.log("View discount with ID:", id);
    };

    const handleEditDiscount = async (id) => {
        try {
            const response = await axios.get(`http://localhost:8080/api/admin/discounts/${id}`, {
                headers: {
                    authorization: `${sessionStorage.getItem('token')}`
                }
            });
            
            const discount = response.data.data;
            setCurrentDiscount(discount);
            
            // Format date for input field (YYYY-MM-DD)
            const date = new Date(discount.expirationDate);
            const formattedDate = date.toISOString().split('T')[0];
            
            setFormData({
                code: discount.code,
                amount: discount.amount,
                quantity: discount.quantity,
                expirationDate: formattedDate
            });
            
            setIsModalOpen(true);
        } catch (error) {
            console.error('Error fetching discount details:', error);
            alert('Đã xảy ra lỗi khi lấy thông tin mã giảm giá!');
        }
    };

    const handleAddDiscount = () => {
        setCurrentDiscount(null);
        setFormData({
            code: '',
            amount: 0,
            quantity: 0,
            expirationDate: ''
        });
        setIsModalOpen(true);
    };

    const handleDeleteDiscount = async (id) => {
        if (!confirm('Bạn có chắc chắn muốn xóa mã giảm giá này?')) {
            return;
        }
        
        try {
            setIsUpdating(true);
            await axios.delete(`http://localhost:8080/api/admin/discounts/${id}`, {
                headers: {
                    authorization: `${sessionStorage.getItem('token')}`
                }
            });
            
            await fetchDiscounts();
            alert('Xóa mã giảm giá thành công!');
        } catch (error) {
            console.error('Error deleting discount:', error);
            alert('Đã xảy ra lỗi khi xóa mã giảm giá!');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDeleteMultipleDiscounts = async () => {
        if (selectedRecords.length === 0) {
            alert('Vui lòng chọn ít nhất một mã giảm giá!');
            return;
        }

        if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedRecords.length} mã giảm giá đã chọn?`)) {
            return;
        }

        try {
            setIsUpdating(true);
            const response = await axios.delete('http://localhost:8080/api/admin/discounts', {
                headers: {
                    authorization: `${sessionStorage.getItem('token')}`
                },
                data: {
                    ids: selectedRecords
                }
            });
            
            await fetchDiscounts();
            setSelectedRecords([]);
            alert(response.data.message);
        } catch (error) {
            console.error('Error deleting multiple discounts:', error);
            alert('Đã xảy ra lỗi khi xóa nhiều mã giảm giá!');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmitForm = async (e) => {
        e.preventDefault();
        
        try {
            setIsUpdating(true);
            
            if (currentDiscount) {
                // Update existing discount
                await axios.patch(`http://localhost:8080/api/admin/discounts/${currentDiscount._id}`, formData, {
                    headers: {
                        authorization: `${sessionStorage.getItem('token')}`
                    }
                });
                alert('Cập nhật mã giảm giá thành công!');
            } else {
                // Create new discount
                await axios.post('http://localhost:8080/api/admin/discounts', formData, {
                    headers: {
                        authorization: `${sessionStorage.getItem('token')}`
                    }
                });
                alert('Tạo mã giảm giá thành công!');
            }
            
            setIsModalOpen(false);
            await fetchDiscounts();
        } catch (error) {
            console.error('Error saving discount:', error);
            alert(`Đã xảy ra lỗi: ${error.response?.data?.message || error.message}`);
        } finally {
            setIsUpdating(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    // Hàm xử lý khi chọn/bỏ chọn mã giảm giá
    const handleSelectedRecordsChange = (ids) => {
        setSelectedRecords(ids);
    };

    const isDiscountExpired = (expirationDate) => {
        const now = new Date();
        const expDate = new Date(expirationDate);
        return expDate < now;
    };

    return (
        <div className="panel mt-6">
            <div className="mb-5 flex flex-col gap-5 md:flex-row md:items-center">
                <h5 className="text-lg font-semibold dark:text-white-light">Quản lý mã giảm giá</h5>
                <button className="btn btn-primary" onClick={handleAddDiscount}>
                    <IconPlus className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                    Thêm mã giảm giá
                </button>
                {selectedRecords.length > 0 && (
                    <button 
                        className="btn btn-danger" 
                        onClick={handleDeleteMultipleDiscounts}
                        disabled={isUpdating}
                    >
                        <IconTrashLines className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                        Xóa {selectedRecords.length} mã đã chọn
                    </button>
                )}
            </div>

            <div className="mb-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                    <label>Mã giảm giá</label>
                    <input
                        type="text"
                        className="form-input w-full"
                        placeholder="Tìm theo mã giảm giá..."
                        value={codeFilter}
                        onChange={(e) => setCodeFilter(e.target.value)}
                    />
                </div>
            </div>

            <div className="datatables">
                <DataTable
                    className="table-hover whitespace-nowrap"
                    records={recordsData}
                    columns={[
                        { 
                            accessor: 'code',
                            title: 'Mã giảm giá',
                            sortable: true 
                        },
                        { 
                            accessor: 'amount',
                            title: 'Giá trị',
                            sortable: true,
                            render: ({ amount }) => formatCurrency(amount)
                        },
                        { 
                            accessor: 'quantity',
                            title: 'Số lượng còn lại',
                            sortable: true 
                        },
                        { 
                            accessor: 'expirationDate',
                            title: 'Ngày hết hạn',
                            sortable: true,
                            render: ({ expirationDate }) => (
                                <span className={isDiscountExpired(expirationDate) ? 'text-danger' : ''}>
                                    {formatDate(expirationDate)}
                                </span>
                            )
                        },
                        { 
                            accessor: 'createdAt',
                            title: 'Ngày tạo',
                            sortable: true,
                            render: ({ createdAt }) => formatDate(createdAt)
                        },
                        {
                            accessor: 'actions',
                            title: 'Thao tác',
                            width: '20%',
                            render: (record) => (
                                <div className="action-buttons" style={{ width: "100%" }}>
                                    {/* <button title="Xem chi tiết" onClick={() => handleViewDiscount(record._id)}><IconEye /></button> */}
                                    <button title="Chỉnh sửa" onClick={() => handleEditDiscount(record._id)}><IconPencilPaper /></button>
                                    <button 
                                        title="Xóa" 
                                        onClick={() => handleDeleteDiscount(record._id)}
                                        disabled={isUpdating}
                                    >
                                        <IconTrashLines />
                                    </button>
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
                    paginationText={({ from, to, totalRecords }) => `Hiển thị ${from} đến ${to} của ${totalRecords} mã giảm giá`}
                    checkboxColumn
                    idAccessor="_id"
                />
            </div>

            {/* Modal thêm/sửa mã giảm giá */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="w-full max-w-lg bg-white rounded-lg shadow-lg dark:bg-gray-800 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">
                                {currentDiscount ? 'Chỉnh sửa mã giảm giá' : 'Thêm mã giảm giá mới'}
                            </h3>
                            <button 
                                className="text-gray-400 hover:text-gray-600"
                                onClick={() => setIsModalOpen(false)}
                            >
                                &times;
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmitForm}>
                            <div className="mb-4">
                                <label className="block mb-2">Mã giảm giá</label>
                                <input
                                    type="text"
                                    name="code"
                                    className="form-input w-full"
                                    value={formData.code}
                                    onChange={handleFormChange}
                                    required
                                />
                            </div>
                            
                            <div className="mb-4">
                                <label className="block mb-2">Giá trị ($)</label>
                                <input
                                    type="number"
                                    name="amount"
                                    className="form-input w-full"
                                    value={formData.amount}
                                    onChange={handleFormChange}
                                    min="1"
                                    required
                                />
                            </div>
                            
                            <div className="mb-4">
                                <label className="block mb-2">Số lượng</label>
                                <input
                                    type="number"
                                    name="quantity"
                                    className="form-input w-full"
                                    value={formData.quantity}
                                    onChange={handleFormChange}
                                    min="1"
                                    required
                                />
                            </div>
                            
                            <div className="mb-4">
                                <label className="block mb-2">Ngày hết hạn</label>
                                <input
                                    type="date"
                                    name="expirationDate"
                                    className="form-input w-full"
                                    value={formData.expirationDate}
                                    onChange={handleFormChange}
                                    required
                                />
                            </div>
                            
                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    type="button"
                                    className="btn btn-outline-danger"
                                    onClick={() => setIsModalOpen(false)}
                                    disabled={isUpdating}
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={isUpdating}
                                >
                                    {isUpdating ? 'Đang lưu...' : (currentDiscount ? 'Cập nhật' : 'Thêm mới')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageDiscounts;