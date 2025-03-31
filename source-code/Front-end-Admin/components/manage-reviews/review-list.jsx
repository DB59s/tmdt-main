'use client';
import { useState, useEffect, useCallback } from 'react';
import { DataTable } from 'mantine-datatable';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import IconEye from '@/components/icon/icon-eye';
import IconTrash from '@/components/icon/icon-trash';
import { formatDate } from '@/utils/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

const ReviewList = () => {
    const apiUrl = process.env.domainApi;
    const router = useRouter();
    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [reviews, setReviews] = useState([]);
    const [totalReviews, setTotalReviews] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Filter states
    const [productId, setProductId] = useState('');
    const [productName, setProductName] = useState('');
    const [ratingFilter, setRatingFilter] = useState('');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [products, setProducts] = useState([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);

    const ratingOptions = [1, 2, 3, 4, 5];

    const fetchProducts = useCallback(async () => {
        if (!showFilters) return;
        
        setIsLoadingProducts(true);
        try {
            const response = await axios.get(`${apiUrl}/api/admin/products?limit=100`, {
                headers: { authorization: sessionStorage.getItem('token') }
            });
            setProducts(response.data.data.products || []);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setIsLoadingProducts(false);
        }
    }, [apiUrl, showFilters]);

    const fetchReviews = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page,
                limit: pageSize,
                sortBy,
                sortOrder
            });

            if (productId) {
                params.append('productId', productId);
            }

            if (ratingFilter) {
                params.append('rating', ratingFilter);
            }

            const response = await axios.get(`${apiUrl}/api/admin/reviews?${params.toString()}`, {
                headers: { authorization: sessionStorage.getItem('token') }
            });

            setReviews(response.data.reviews);
            setTotalReviews(response.data.totalReviews);
            setTotalPages(response.data.totalPages);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching reviews:', error);
            setError('Failed to fetch reviews. Please try again later.');
            setLoading(false);
        }
    }, [apiUrl, page, pageSize, productId, ratingFilter, sortBy, sortOrder]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    useEffect(() => {
        setPage(1);
    }, [pageSize, productId, ratingFilter, sortBy, sortOrder]);

    const viewReviewDetails = (id) => {
        router.push(`/manage-reviews/${id}`);
    };

    const handleProductFilterChange = (e) => {
        const selectedProductId = e.target.value;
        setProductId(selectedProductId);
        
        if (selectedProductId) {
            const selectedProduct = products.find(p => p._id === selectedProductId);
            setProductName(selectedProduct ? selectedProduct.title : '');
        } else {
            setProductName('');
        }
    };

    const handleRatingFilterChange = (e) => {
        setRatingFilter(e.target.value);
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
        setProductId('');
        setProductName('');
        setRatingFilter('');
        setSortBy('createdAt');
        setSortOrder('desc');
    };

    const deleteReview = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa đánh giá này?')) {
            return;
        }

        setIsDeleting(true);
        try {
            await axios.delete(`${apiUrl}/api/admin/reviews/${id}`, {
                headers: { authorization: sessionStorage.getItem('token') }
            });
            
            // Remove deleted review from local state
            setReviews(prevReviews => prevReviews.filter(review => review._id !== id));
            setTotalReviews(prev => prev - 1);
            
            alert('Xóa đánh giá thành công');
        } catch (error) {
            console.error('Error deleting review:', error);
            alert('Không thể xóa đánh giá. Vui lòng thử lại sau.');
        } finally {
            setIsDeleting(false);
        }
    };

    const moderateReview = async (id, isApproved) => {
        try {
            await axios.patch(`${apiUrl}/api/admin/reviews/${id}/moderate`, 
                { isApproved },
                { headers: { authorization: sessionStorage.getItem('token') } }
            );
            
            // Update the review status in local state
            setReviews(prevReviews => prevReviews.map(review => {
                if (review._id === id) {
                    return { ...review, isApproved };
                }
                return review;
            }));
            
            alert(`Đánh giá đã được ${isApproved ? 'chấp nhận' : 'từ chối'} thành công`);
        } catch (error) {
            console.error('Error moderating review:', error);
            alert('Không thể cập nhật trạng thái đánh giá. Vui lòng thử lại sau.');
        }
    };

    // Helper to render rating stars
    const renderRatingStars = (rating) => {
        const stars = [];
        for (let i = 0; i < 5; i++) {
            stars.push(
                <span key={i} className={i < rating ? 'text-warning' : 'text-gray-300'}>★</span>
            );
        }
        return <div className="flex">{stars}</div>;
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchReviews();
    };

    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Danh sách Đánh giá</CardTitle>
                <div className="flex items-center space-x-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        {showFilters ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {showFilters && (
                    <div className="bg-gray-50 p-4 mb-4 rounded-md">
                        <h3 className="text-sm font-medium mb-3">Bộ lọc</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-sm text-gray-600 mb-1 block">Sản phẩm</label>
                                <select
                                    className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={productId}
                                    onChange={handleProductFilterChange}
                                >
                                    <option value="">Tất cả sản phẩm</option>
                                    {products.map(product => (
                                        <option key={product._id} value={product._id}>
                                            {product.title}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-sm text-gray-600 mb-1 block">Đánh giá</label>
                                <select
                                    className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={ratingFilter}
                                    onChange={handleRatingFilterChange}
                                >
                                    <option value="">Tất cả đánh giá</option>
                                    {ratingOptions.map(rating => (
                                        <option key={rating} value={rating}>
                                            {rating} sao
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-sm text-gray-600 mb-1 block">Sắp xếp theo</label>
                                <div className="flex gap-2">
                                    <select
                                        className="flex-1 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                    >
                                        <option value="createdAt">Thời gian tạo</option>
                                        <option value="rating">Đánh giá</option>
                                    </select>
                                    <select
                                        className="w-24 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={sortOrder}
                                        onChange={(e) => setSortOrder(e.target.value)}
                                    >
                                        <option value="desc">Giảm dần</option>
                                        <option value="asc">Tăng dần</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end mt-4">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={clearFilters}
                                className="mr-2"
                            >
                                Xóa bộ lọc
                            </Button>
                            <Button 
                                size="sm" 
                                onClick={fetchReviews}
                            >
                                Áp dụng
                            </Button>
                        </div>
                    </div>
                )}

                {error ? (
                    <div className="text-center py-4 text-red-500">{error}</div>
                ) : (
                    <DataTable
                        className="whitespace-nowrap table-hover"
                        records={reviews}
                        columns={[
                            {
                                accessor: 'productId',
                                title: 'Sản phẩm',
                                render: ({ productId }) => (
                                    <div className="flex items-center">
                                        {productId?.thumbnail && (
                                            <img 
                                                src={productId.thumbnail} 
                                                alt={productId.title} 
                                                className="h-10 w-10 rounded object-cover mr-2"
                                            />
                                        )}
                                        <div className="max-w-[200px] truncate">
                                            {productId?.title || 'Sản phẩm không tồn tại'}
                                        </div>
                                    </div>
                                ),
                                sortable: true
                            },
                            {
                                accessor: 'rating',
                                title: 'Đánh giá',
                                render: ({ rating }) => renderRatingStars(rating),
                                sortable: true
                            },
                            {
                                accessor: 'comment',
                                title: 'Bình luận',
                                render: ({ comment }) => (
                                    <div className="max-w-[300px] truncate">
                                        {comment}
                                    </div>
                                )
                            },
                            {
                                accessor: 'createdAt',
                                title: 'Thời gian',
                                render: ({ createdAt }) => formatDate(createdAt),
                                sortable: true
                            },
                            {
                                accessor: 'actions',
                                title: 'Thao tác',
                                width: '180px',
                                render: (review) => (
                                    <div className="flex items-center space-x-2">
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => deleteReview(review._id)}
                                            disabled={isDeleting}
                                        >
                                            <IconTrash className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ),
                            },
                        ]}
                        totalRecords={totalReviews}
                        recordsPerPage={pageSize}
                        page={page}
                        onPageChange={setPage}
                        recordsPerPageOptions={PAGE_SIZES}
                        onRecordsPerPageChange={setPageSize}
                        fetching={loading}
                        noRecordsText="Không có đánh giá nào"
                        paginationText={({ from, to, totalRecords }) => `Hiển thị ${from} đến ${to} trên ${totalRecords} đánh giá`}
                    />
                )}
            </CardContent>
        </Card>
    );
};

export default ReviewList; 