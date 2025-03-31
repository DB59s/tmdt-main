'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ReviewStats = () => {
    const apiUrl = process.env.domainApi;
    const [stats, setStats] = useState({
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: {
            '1': 0,
            '2': 0,
            '3': 0,
            '4': 0,
            '5': 0
        },
        approvedReviews: 0,
        pendingReviews: 0,
        rejectedReviews: 0
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchStats = async () => {
            setIsLoading(true);
            setError('');

            try {
                // Collect review statistics from the review listing
                const response = await axios.get(`${apiUrl}/api/admin/reviews?limit=0`, {
                    headers: { authorization: sessionStorage.getItem('token') }
                });
                
                if (response.data.success && response.data.reviews) {
                    const reviews = response.data.reviews;
                    const totalReviews = response.data.totalReviews || reviews.length;
                    
                    // Count rating distribution
                    const ratingDistribution = {
                        '1': 0,
                        '2': 0,
                        '3': 0,
                        '4': 0,
                        '5': 0
                    };
                    
                    // Count status distribution
                    let approvedReviews = 0;
                    let rejectedReviews = 0;
                    let pendingReviews = 0;
                    
                    reviews.forEach(review => {
                        // Add to rating distribution
                        if (review.rating >= 1 && review.rating <= 5) {
                            ratingDistribution[review.rating.toString()]++;
                        }
                        
                        // Add to status counts
                        if (review.isApproved === true) {
                            approvedReviews++;
                        } else if (review.isApproved === false) {
                            rejectedReviews++;
                        } else {
                            pendingReviews++;
                        }
                    });
                    
                    // Calculate average rating
                    const total = Object.values(ratingDistribution).reduce((sum, count) => sum + count, 0);
                    const weightedSum = Object.entries(ratingDistribution)
                        .reduce((sum, [rating, count]) => sum + (parseInt(rating) * count), 0);
                    
                    const averageRating = total > 0 ? (weightedSum / total).toFixed(1) : 0;
                    
                    setStats({
                        totalReviews,
                        averageRating,
                        ratingDistribution,
                        approvedReviews,
                        pendingReviews,
                        rejectedReviews
                    });
                }
            } catch (err) {
                console.error('Error fetching review statistics:', err);
                setError('Không thể tải thống kê đánh giá');
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, [apiUrl]);

    // Helper to calculate percentage for rating distribution
    const calculatePercentage = (count) => {
        if (stats.totalReviews === 0) return 0;
        return Math.round((count / stats.totalReviews) * 100);
    };

    // Render rating stars
    const renderStars = (rating) => {
        const stars = [];
        for (let i = 0; i < 5; i++) {
            stars.push(
                <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-300'}>★</span>
            );
        }
        return stars;
    };

    return (
        <Card className="mb-6">
            <CardHeader>
                <CardTitle>Thống kê Đánh giá</CardTitle>
            </CardHeader>
            <CardContent>
                {error ? (
                    <div className="bg-red-50 text-red-600 p-4 rounded-md">
                        {error}
                    </div>
                ) : isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin h-8 w-8 border-4 border-primary border-l-transparent rounded-full"></div>
                        <p className="ml-2">Đang tải...</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-green-50 p-4 rounded-md">
                                <h3 className="text-sm font-medium text-gray-500">Tổng số đánh giá</h3>
                                <p className="text-3xl font-bold">{stats.totalReviews}</p>
                            </div>
                            
                            <div className="bg-yellow-50 p-4 rounded-md">
                                <h3 className="text-sm font-medium text-gray-500">Đánh giá trung bình</h3>
                                <div className="flex items-baseline">
                                    <p className="text-3xl font-bold mr-2">{stats.averageRating}</p>
                                    <div className="flex">{renderStars(Math.round(stats.averageRating))}</div>
                                </div>
                            </div>
                            
                            <div className="bg-blue-50 p-4 rounded-md">
                                <h3 className="text-sm font-medium text-gray-500">Đánh giá đã duyệt</h3>
                                <p className="text-3xl font-bold">{stats.approvedReviews}</p>
                            </div>
                            
                            <div className="bg-amber-50 p-4 rounded-md">
                                <h3 className="text-sm font-medium text-gray-500">Đánh giá chờ duyệt</h3>
                                <p className="text-3xl font-bold">{stats.pendingReviews}</p>
                            </div>
                        </div>
                        
                        {/* Rating Distribution */}
                        <div>
                            <h3 className="text-lg font-semibold mb-3">Phân bố đánh giá</h3>
                            <div className="space-y-2">
                                {[5, 4, 3, 2, 1].map(rating => {
                                    const count = stats.ratingDistribution[rating] || 0;
                                    const percentage = calculatePercentage(count);
                                    
                                    return (
                                        <div key={rating} className="flex items-center">
                                            <div className="w-16 flex justify-end mr-2">
                                                <span className="font-medium">{rating}</span>
                                                <span className="text-yellow-400 ml-1">★</span>
                                            </div>
                                            <div className="flex-1 bg-gray-200 rounded-full h-3 mr-2 overflow-hidden">
                                                <div 
                                                    className="bg-yellow-400 h-full rounded-full" 
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                            <div className="w-12 text-right">
                                                <span className="text-sm text-gray-500">{percentage}%</span>
                                            </div>
                                            <div className="w-12 text-right">
                                                <span className="text-sm text-gray-700">({count})</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        
                        {/* Status Distribution */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white border rounded-md p-4">
                                <h3 className="text-base font-semibold mb-2">Đã duyệt</h3>
                                <div className="flex justify-between items-center">
                                    <span className="text-2xl font-bold text-green-600">{stats.approvedReviews}</span>
                                    <span className="text-sm text-gray-500">
                                        {calculatePercentage(stats.approvedReviews)}% tổng đánh giá
                                    </span>
                                </div>
                            </div>
                            
                            <div className="bg-white border rounded-md p-4">
                                <h3 className="text-base font-semibold mb-2">Chờ duyệt</h3>
                                <div className="flex justify-between items-center">
                                    <span className="text-2xl font-bold text-amber-500">{stats.pendingReviews}</span>
                                    <span className="text-sm text-gray-500">
                                        {calculatePercentage(stats.pendingReviews)}% tổng đánh giá
                                    </span>
                                </div>
                            </div>
                            
                            <div className="bg-white border rounded-md p-4">
                                <h3 className="text-base font-semibold mb-2">Đã từ chối</h3>
                                <div className="flex justify-between items-center">
                                    <span className="text-2xl font-bold text-red-600">{stats.rejectedReviews}</span>
                                    <span className="text-sm text-gray-500">
                                        {calculatePercentage(stats.rejectedReviews)}% tổng đánh giá
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default ReviewStats; 