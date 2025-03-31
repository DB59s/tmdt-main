'use client';
import { useState, useEffect, useCallback } from 'react';
import { DataTable } from 'mantine-datatable';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import IconEye from '@/components/icon/icon-eye';
import { formatDate, formatCurrency } from '@/utils/format';
import ReturnStatusBadge from './return-status-badge';
import ReturnTypeBadge from './return-type-badge';

const ReturnList = () => {
    const apiUrl = process.env.domainApi;
    const router = useRouter();
    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [returnRequests, setReturnRequests] = useState([]);
    const [totalReturns, setTotalReturns] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    // Filter states
    const [statusFilter, setStatusFilter] = useState('');
    const [requestTypeFilter, setRequestTypeFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');

    const statusOptions = ['pending', 'processing', 'approved', 'completed', 'rejected'];
    const requestTypeOptions = ['refund', 'exchange'];
    const statusLabels = {
        'pending': 'Chờ xử lý',
        'processing': 'Đang xử lý',
        'approved': 'Đã chấp nhận',
        'completed': 'Hoàn thành',
        'rejected': 'Từ chối'
    };

    const requestTypeLabels = {
        'refund': 'Hoàn tiền',
        'exchange': 'Đổi hàng'
    };

    const fetchReturnRequests = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page,
                limit: pageSize,
                sortBy,
                sortOrder
            });

            if (statusFilter) {
                params.append('status', statusFilter);
            }

            if (requestTypeFilter) {
                params.append('requestType', requestTypeFilter);
            }

            if (searchTerm) {
                params.append('search', searchTerm);
            }

            const response = await axios.get(`${apiUrl}/api/admin/return-requests?${params.toString()}`, {
                headers: { authorization: sessionStorage.getItem('token') }
            });

            setReturnRequests(response.data.data);
            setTotalReturns(response.data.total);
        } catch (error) {
            console.error('Error fetching return requests:', error);
            alert('Failed to load return requests. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [apiUrl, page, pageSize, statusFilter, requestTypeFilter, searchTerm, sortBy, sortOrder]);

    useEffect(() => {
        fetchReturnRequests();
    }, [fetchReturnRequests]);

    useEffect(() => {
        setPage(1);
    }, [pageSize, statusFilter, requestTypeFilter, searchTerm, sortBy, sortOrder]);

    const viewReturnDetails = (id) => {
        router.push(`/manage-returns/${id}`);
    };

    const handleStatusFilterChange = (e) => {
        setStatusFilter(e.target.value);
    };

    const handleRequestTypeFilterChange = (e) => {
        setRequestTypeFilter(e.target.value);
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleSortChange = (field) => {
        if (field === sortBy) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
    };

    const clearFilters = () => {
        setStatusFilter('');
        setRequestTypeFilter('');
        setSearchTerm('');
        setSortBy('createdAt');
        setSortOrder('desc');
    };

    return (
        <div>
            <div className="mb-5">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                    <h2 className="text-xl font-bold">Quản lý Yêu cầu Đổi/Trả hàng</h2>
                    <div className="flex flex-wrap gap-2">
                        <button 
                            className="btn btn-outline-primary"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            {showFilters ? 'Ẩn Bộ Lọc' : 'Hiện Bộ Lọc'}
                        </button>
                    </div>
                </div>

                {/* Filters */}
                {showFilters && (
                    <div className="panel mb-5 p-4">
                        <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block mb-2 text-sm font-medium">Tìm kiếm</label>
                                <input
                                    type="text"
                                    placeholder="Tên, email, số điện thoại..."
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    className="form-input w-full"
                                />
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-medium">Trạng thái</label>
                                <select
                                    value={statusFilter}
                                    onChange={handleStatusFilterChange}
                                    className="form-select w-full"
                                >
                                    <option value="">Tất cả trạng thái</option>
                                    {statusOptions.map(status => (
                                        <option key={status} value={status}>
                                            {statusLabels[status]}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-medium">Loại yêu cầu</label>
                                <select
                                    value={requestTypeFilter}
                                    onChange={handleRequestTypeFilterChange}
                                    className="form-select w-full"
                                >
                                    <option value="">Tất cả loại</option>
                                    {requestTypeOptions.map(type => (
                                        <option key={type} value={type}>
                                            {requestTypeLabels[type]}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex flex-col justify-end">
                                <button
                                    className="btn btn-outline-danger w-full"
                                    onClick={clearFilters}
                                >
                                    Xóa bộ lọc
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Return Requests Table */}
                <div className="panel">
                    <div className="datatables">
                        <DataTable
                            className="whitespace-nowrap table-hover"
                            records={returnRequests}
                            columns={[
                                {
                                    accessor: 'orderId',
                                    title: 'Đơn hàng',
                                    sortable: true,
                                    render: ({ orderId }) => (
                                        <span className="font-semibold">
                                            {orderId?.orderId || 'N/A'}
                                        </span>
                                    ),
                                },
                                {
                                    accessor: 'requestType',
                                    title: 'Loại yêu cầu',
                                    sortable: true,
                                    render: ({ requestType }) => <ReturnTypeBadge type={requestType} />,
                                },
                                {
                                    accessor: 'customerId',
                                    title: 'Khách hàng',
                                    sortable: true,
                                    render: ({ customerId }) => (
                                        <div className="flex flex-col">
                                            <span>{customerId?.name || 'N/A'}</span>
                                            <span className="text-xs text-gray-500">{customerId?.email}</span>
                                        </div>
                                    ),
                                },
                                {
                                    accessor: 'items',
                                    title: 'Sản phẩm',
                                    render: ({ items }) => (
                                        <span>
                                            {items?.length || 0} sản phẩm
                                        </span>
                                    ),
                                },
                                {
                                    accessor: 'reason',
                                    title: 'Lý do',
                                    sortable: true,
                                    width: '20%',
                                    render: ({ reason }) => (
                                        <div className="max-w-xs truncate">
                                            {reason}
                                        </div>
                                    ),
                                },
                                {
                                    accessor: 'status',
                                    title: 'Trạng thái',
                                    sortable: true,
                                    render: ({ status }) => <ReturnStatusBadge status={status} />,
                                },
                                {
                                    accessor: 'createdAt',
                                    title: 'Ngày yêu cầu',
                                    sortable: true,
                                    render: ({ createdAt }) => formatDate(createdAt),
                                },
                                {
                                    accessor: 'actions',
                                    title: 'Thao tác',
                                    render: (row) => (
                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => viewReturnDetails(row._id)}
                                                className="btn btn-sm btn-outline-info"
                                            >
                                                <IconEye className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ),
                                },
                            ]}
                            totalRecords={totalReturns}
                            recordsPerPage={pageSize}
                            page={page}
                            onPageChange={(p) => setPage(p)}
                            recordsPerPageOptions={PAGE_SIZES}
                            onRecordsPerPageChange={setPageSize}
                            minHeight={200}
                            paginationText={({ from, to, totalRecords }) => `Hiển thị ${from} đến ${to} trên tổng số ${totalRecords} yêu cầu`}
                            loading={isLoading}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReturnList; 