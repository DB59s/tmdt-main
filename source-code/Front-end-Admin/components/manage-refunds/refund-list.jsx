'use client';
import { useState, useEffect, useCallback } from 'react';
import { DataTable } from 'mantine-datatable';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import IconEye from '@/components/icon/icon-eye';
import { formatDate, formatCurrency } from '@/utils/format';
import RefundStatusBadge from './refund-status-badge';

const RefundList = () => {
    const apiUrl = process.env.domainApi;
    const router = useRouter();
    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [refundRequests, setRefundRequests] = useState([]);
    const [totalRefunds, setTotalRefunds] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    // Filter states
    const [statusFilter, setStatusFilter] = useState('');

    const refundStatuses = ['Đang xử lý', 'Đã hoàn tiền', 'Từ chối'];

    const fetchRefundRequests = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page,
                limit: pageSize,
            });

            if (statusFilter) {
                params.append('status', statusFilter);
            }

            const response = await axios.get(`${apiUrl}/api/admin/refund-requests?${params.toString()}`, {
                headers: { authorization: sessionStorage.getItem('token') }
            });

            setRefundRequests(response.data.data.refundRequests);
            setTotalRefunds(response.data.data.pagination.total);
        } catch (error) {
            console.error('Error fetching refund requests:', error);
            alert('Failed to load refund requests. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [apiUrl, page, pageSize, statusFilter]);

    useEffect(() => {
        fetchRefundRequests();
    }, [fetchRefundRequests]);

    useEffect(() => {
        setPage(1);
    }, [pageSize, statusFilter]);

    const viewRefundDetails = (id) => {
        router.push(`/manage-refunds/refund-request/${id}`);
    };

    const handleStatusFilterChange = (e) => {
        setStatusFilter(e.target.value);
    };

    const clearFilters = () => {
        setStatusFilter('');
    };

    return (
        <div>
            <div className="mb-5">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                    <h2 className="text-xl font-bold">Refund Request Management</h2>
                    <div className="flex flex-wrap gap-2">
                        <button 
                            className="btn btn-outline-primary"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            {showFilters ? 'Hide Filters' : 'Show Filters'}
                        </button>
                    </div>
                </div>

                {/* Filters */}
                {showFilters && (
                    <div className="panel mb-5 p-4">
                        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block mb-2 text-sm font-medium">Refund Status</label>
                                <select
                                    value={statusFilter}
                                    onChange={handleStatusFilterChange}
                                    className="form-select w-full"
                                >
                                    <option value="">All Statuses</option>
                                    {refundStatuses.map(status => (
                                        <option key={status} value={status}>
                                            {status}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                className="btn btn-outline-danger"
                                onClick={clearFilters}
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>
                )}

                {/* Refund Requests Table */}
                <div className="panel">
                    <div className="datatables">
                        <DataTable
                            className="whitespace-nowrap table-hover"
                            records={refundRequests}
                            columns={[
                                {
                                    accessor: 'orderId',
                                    title: 'Order',
                                    sortable: true,
                                    render: ({ orderId }) => (
                                        <span className="font-semibold">
                                            {orderId?.orderId || 'N/A'}
                                        </span>
                                    ),
                                },
                                {
                                    accessor: 'amount',
                                    title: 'Refund Amount',
                                    sortable: true,
                                    render: ({ amount }) => (
                                        <span className="font-semibold">
                                            {formatCurrency(amount)}
                                        </span>
                                    ),
                                },
                                {
                                    accessor: 'reason',
                                    title: 'Reason',
                                    sortable: true,
                                    width: '25%',
                                },
                                {
                                    accessor: 'status',
                                    title: 'Status',
                                    sortable: true,
                                    render: ({ status }) => <RefundStatusBadge status={status} />,
                                },
                                {
                                    accessor: 'bankInfo',
                                    title: 'Bank Information',
                                    width: '20%',
                                    render: ({ bankName, bankAccountNumber, bankAccountName }) => (
                                        <div className="flex flex-col">
                                            <span>{bankName}</span>
                                            <span className="text-xs text-gray-500">{bankAccountNumber}</span>
                                            <span className="text-xs text-gray-500">{bankAccountName}</span>
                                        </div>
                                    ),
                                },
                                {
                                    accessor: 'createdAt',
                                    title: 'Request Date',
                                    sortable: true,
                                    render: ({ createdAt }) => formatDate(createdAt),
                                },
                                {
                                    accessor: 'actions',
                                    title: 'Actions',
                                    render: (row) => (
                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => viewRefundDetails(row._id)}
                                                className="btn btn-sm btn-outline-info"
                                            >
                                                <IconEye className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ),
                                },
                            ]}
                            totalRecords={totalRefunds}
                            recordsPerPage={pageSize}
                            page={page}
                            onPageChange={(p) => setPage(p)}
                            recordsPerPageOptions={PAGE_SIZES}
                            onRecordsPerPageChange={setPageSize}
                            minHeight={200}
                            paginationText={({ from, to, totalRecords }) => `Showing ${from} to ${to} of ${totalRecords} refund requests`}
                            loading={isLoading}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RefundList; 