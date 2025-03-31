'use client';
import { useState, useEffect, useCallback } from 'react';
import { DataTable } from 'mantine-datatable';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import IconEye from '@/components/icon/icon-eye';
import IconTrashLines from '@/components/icon/icon-trash-lines';
import OrderStatusBadge from './order-status-badge';
import { formatDate, formatCurrency } from '@/utils/format';

const OrdersList = () => {
    const apiUrl = process.env.domainApi;
    const router = useRouter();
    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [orders, setOrders] = useState([]);
    const [totalOrders, setTotalOrders] = useState(0);
    const [selectedOrders, setSelectedOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [summary, setSummary] = useState({ orderStatus: {}, paymentStatus: {} });

    // Filter states
    const [filters, setFilters] = useState({
        orderId: '',
        customerName: '',
        customerPhone: '',
        status: '',
        paymentStatus: '',
        paymentMethod: '',
        startDate: '',
        endDate: '',
    });

    const orderStatuses = ['Đang xác nhận', 'Đang đóng gói', 'Đang giao hàng', 'Đã giao hàng', 'Đã hủy'];
    const paymentStatuses = ['Chưa thanh toán', 'Đã thanh toán'];
    const paymentMethods = ['Thanh toán khi nhận hàng', 'Chuyển khoản qua ngân hàng'];

    const fetchOrders = useCallback(async () => {
        setIsLoading(true);
        try {
            const queryParams = new URLSearchParams({
                page,
                limit: pageSize,
                ...Object.fromEntries(
                    Object.entries(filters).filter(([_, value]) => value !== '')
                ),
            });

            const response = await axios.get(`${apiUrl}/api/admin/orders?${queryParams.toString()}`, {
                headers: { authorization: sessionStorage.getItem('token') }
            });

            setOrders(response.data.orders);
            setTotalOrders(response.data.totalOrders);
            setSummary(response.data.summary || { orderStatus: {}, paymentStatus: {} });
        } catch (error) {
            console.error('Error fetching orders:', error);
            alert('Failed to load orders. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [page, pageSize, filters]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    useEffect(() => {
        setPage(1);
    }, [pageSize, filters]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const clearFilters = () => {
        setFilters({
            orderId: '',
            customerName: '',
            customerPhone: '',
            status: '',
            paymentStatus: '',
            paymentMethod: '',
            startDate: '',
            endDate: '',
        });
    };

    const viewOrderDetails = (id) => {
        router.push(`/manage-orders/${id}`);
    };

    const handleBulkStatusUpdate = async (status) => {
        if (selectedOrders.length === 0) {
            alert('Please select at least one order to update.');
            return;
        }

        if (!confirm(`Are you sure you want to update ${selectedOrders.length} orders to "${status}" status?`)) {
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.post(`${apiUrl}/api/admin/orders/update-multiple`, {
                orderIds: selectedOrders,
                status,
                description: `Bulk update to ${status} status`,
            }, {
                headers: { authorization: sessionStorage.getItem('token') }
            });

            alert(`Successfully updated ${response.data.updatedCount} orders.`);
            fetchOrders();
            setSelectedOrders([]);
        } catch (error) {
            console.error('Error updating orders:', error);
            alert('Failed to update orders. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const renderSummaryCard = (title, data, bgColor) => {
        const total = Object.values(data).reduce((acc, value) => acc + value, 0);
        
        return (
            <div className={`panel p-4 ${bgColor} rounded-md`}>
                <h5 className="text-lg font-semibold mb-3">{title}</h5>
                <div className="flex flex-col space-y-2">
                    {Object.entries(data).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                            <span>{key}</span>
                            <div className="flex items-center">
                                <span className="font-semibold mr-2">{value}</span>
                                <span className="text-xs text-gray-500">
                                    ({total > 0 ? Math.round((value / total) * 100) : 0}%)
                                </span>
                            </div>
                        </div>
                    ))}
                    <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
                        <span>Total</span>
                        <span>{total}</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div>
            <div className="mb-5">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                    <h2 className="text-xl font-bold">Order Management</h2>
                    <div className="flex flex-wrap gap-2">
                        <button 
                            className="btn btn-outline-primary"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            {showFilters ? 'Hide Filters' : 'Show Filters'}
                        </button>
                    </div>
                </div>
                
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {renderSummaryCard('Order Status', summary.orderStatus || {}, 'bg-white')}
                    {renderSummaryCard('Payment Status', summary.paymentStatus || {}, 'bg-white')}
                </div>

                {/* Bulk Actions */}
                {selectedOrders.length > 0 && (
                    <div className="bg-primary-light p-4 rounded-md mb-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="font-semibold">{selectedOrders.length} orders selected</span>
                            <div className="flex flex-wrap gap-2">
                                {orderStatuses.map(status => (
                                    <button
                                        key={status}
                                        className="btn btn-sm btn-outline-primary"
                                        onClick={() => handleBulkStatusUpdate(status)}
                                    >
                                        Set to {status}
                                    </button>
                                ))}
                                <button 
                                    className="btn btn-sm btn-danger"
                                    onClick={() => setSelectedOrders([])}
                                >
                                    Clear Selection
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                {showFilters && (
                    <div className="panel mb-5 p-4">
                        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block mb-2 text-sm font-medium">Order ID</label>
                                <input
                                    type="text"
                                    name="orderId"
                                    value={filters.orderId}
                                    onChange={handleFilterChange}
                                    className="form-input w-full"
                                    placeholder="Search by order ID"
                                />
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-medium">Customer Name</label>
                                <input
                                    type="text"
                                    name="customerName"
                                    value={filters.customerName}
                                    onChange={handleFilterChange}
                                    className="form-input w-full"
                                    placeholder="Search by customer name"
                                />
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-medium">Phone Number</label>
                                <input
                                    type="text"
                                    name="customerPhone"
                                    value={filters.customerPhone}
                                    onChange={handleFilterChange}
                                    className="form-input w-full"
                                    placeholder="Search by phone number"
                                />
                            </div>
                        </div>

                        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block mb-2 text-sm font-medium">Order Status</label>
                                <select
                                    name="status"
                                    value={filters.status}
                                    onChange={handleFilterChange}
                                    className="form-select w-full"
                                >
                                    <option value="">All Statuses</option>
                                    {orderStatuses.map(status => (
                                        <option key={status} value={status}>
                                            {status}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-medium">Payment Status</label>
                                <select
                                    name="paymentStatus"
                                    value={filters.paymentStatus}
                                    onChange={handleFilterChange}
                                    className="form-select w-full"
                                >
                                    <option value="">All Payment Statuses</option>
                                    {paymentStatuses.map(status => (
                                        <option key={status} value={status}>
                                            {status}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-medium">Payment Method</label>
                                <select
                                    name="paymentMethod"
                                    value={filters.paymentMethod}
                                    onChange={handleFilterChange}
                                    className="form-select w-full"
                                >
                                    <option value="">All Payment Methods</option>
                                    {paymentMethods.map(method => (
                                        <option key={method} value={method}>
                                            {method}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block mb-2 text-sm font-medium">Start Date</label>
                                <input
                                    type="date"
                                    name="startDate"
                                    value={filters.startDate}
                                    onChange={handleFilterChange}
                                    className="form-input w-full"
                                />
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-medium">End Date</label>
                                <input
                                    type="date"
                                    name="endDate"
                                    value={filters.endDate}
                                    onChange={handleFilterChange}
                                    className="form-input w-full"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                className="btn btn-outline-danger"
                                onClick={clearFilters}
                            >
                                Clear All Filters
                            </button>
                        </div>
                    </div>
                )}

                {/* Orders Table */}
                <div className="panel">
                    <div className="datatables">
                        <DataTable
                            className="whitespace-nowrap table-hover"
                            records={orders}
                            columns={[
                                {
                                    accessor: 'orderId',
                                    title: 'Order ID',
                                    sortable: true,
                                    render: ({ orderId }) => (
                                        <span className="font-semibold">{orderId}</span>
                                    ),
                                },
                                {
                                    accessor: 'customerName',
                                    title: 'Customer',
                                    sortable: true,
                                    render: ({ customerName, customerPhone, customerEmail }) => (
                                        <div className="flex flex-col">
                                            <span>{customerName}</span>
                                            <span className="text-xs text-gray-500">{customerPhone}</span>
                                            <span className="text-xs text-gray-500">{customerEmail}</span>
                                        </div>
                                    ),
                                },
                                {
                                    accessor: 'totalAmount',
                                    title: 'Total',
                                    sortable: true,
                                    render: ({ totalAmount, totalAmountBeforeDiscount }) => (
                                        <div className="flex flex-col">
                                            <span className="font-semibold">{formatCurrency(totalAmount)}</span>
                                            {totalAmountBeforeDiscount > totalAmount && (
                                                <span className="text-xs text-gray-500 line-through">
                                                    {formatCurrency(totalAmountBeforeDiscount)}
                                                </span>
                                            )}
                                        </div>
                                    ),
                                },
                                {
                                    accessor: 'status',
                                    title: 'Status',
                                    sortable: true,
                                    render: ({ status }) => <OrderStatusBadge status={status} />,
                                },
                                {
                                    accessor: 'paymentStatus',
                                    title: 'Payment',
                                    sortable: true,
                                    render: ({ paymentStatus, paymentMethod }) => (
                                        <div className="flex flex-col">
                                            <span className={`badge ${paymentStatus === 'Đã thanh toán' ? 'bg-success' : 'bg-warning'}`}>
                                                {paymentStatus}
                                            </span>
                                            <span className="text-xs text-gray-500 mt-1">{paymentMethod}</span>
                                        </div>
                                    ),
                                },
                                {
                                    accessor: 'orderDate',
                                    title: 'Order Date',
                                    sortable: true,
                                    render: ({ orderDate }) => formatDate(orderDate),
                                },
                                {
                                    accessor: 'actions',
                                    title: 'Actions',
                                    render: (row) => (
                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => viewOrderDetails(row._id)}
                                                className="btn btn-sm btn-outline-info"
                                            >
                                                <IconEye className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ),
                                },
                            ]}
                            totalRecords={totalOrders}
                            recordsPerPage={pageSize}
                            page={page}
                            onPageChange={(p) => setPage(p)}
                            recordsPerPageOptions={PAGE_SIZES}
                            onRecordsPerPageChange={setPageSize}
                            minHeight={200}
                            selectedRecords={selectedOrders}
                            onSelectedRecordsChange={setSelectedOrders}
                            paginationText={({ from, to, totalRecords }) => `Showing ${from} to ${to} of ${totalRecords} orders`}
                            loading={isLoading}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrdersList; 