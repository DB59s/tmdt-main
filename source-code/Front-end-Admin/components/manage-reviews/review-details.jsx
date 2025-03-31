'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { formatDate } from '@/utils/format';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const ReviewDetails = ({ id }) => {
    const apiUrl = process.env.domainApi;
    const router = useRouter();
    const [review, setReview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isModerating, setIsModerating] = useState(false);

    useEffect(() => {
        const fetchReviewDetails = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`${apiUrl}/api/admin/reviews/${id}`, {
                    headers: { authorization: sessionStorage.getItem('token') }
                });
                
                if (response.data.success) {
                    setReview(response.data.review);
                } else {
                    setError('Error: ' + response.data.message);
                }
                setLoading(false);
            } catch (err) {
                console.error('Error fetching review details:', err);
                setError('Failed to fetch review details. Please try again later.');
                setLoading(false);
            }
        };

        fetchReviewDetails();
    }, [apiUrl, id]);

    const handleDelete = async () => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa đánh giá này?')) {
            return;
        }

        setIsDeleting(true);
        try {
            const response = await axios.delete(`${apiUrl}/api/admin/reviews/${id}`, {
                headers: { authorization: sessionStorage.getItem('token') }
            });
            
            if (response.data.success) {
                alert('Xóa đánh giá thành công');
                router.push('/manage-reviews');
            } else {
                alert('Lỗi: ' + response.data.message);
            }
            setIsDeleting(false);
        } catch (err) {
            console.error('Error deleting review:', err);
            alert('Không thể xóa đánh giá. Vui lòng thử lại sau.');
            setIsDeleting(false);
        }
    };

    const handleModeration = async (isApproved) => {
        setIsModerating(true);
        try {
            const response = await axios.patch(
                `${apiUrl}/api/admin/reviews/${id}/moderate`, 
                { isApproved },
                { headers: { authorization: sessionStorage.getItem('token') } }
            );
            
            if (response.data.success) {
                alert(`Đánh giá đã được ${isApproved ? 'chấp nhận' : 'từ chối'} thành công`);
                setReview(response.data.review);
            } else {
                alert('Lỗi: ' + response.data.message);
            }
            setIsModerating(false);
        } catch (err) {
            console.error('Error moderating review:', err);
            alert('Không thể cập nhật trạng thái đánh giá. Vui lòng thử lại sau.');
            setIsModerating(false);
        }
    };

    const renderRatingStars = (rating) => {
        return (
            <div className="flex items-center">
                {Array.from({ length: 5 }).map((_, i) => (
                    <svg
                        key={i}
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-5 w-5 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                ))}
                <span className="ml-2 text-gray-600">{rating}/5</span>
            </div>
        );
    };

    const renderStatusBadge = (isApproved) => {
        let badgeClass = '';
        let label = '';

        if (isApproved === true) {
            badgeClass = 'bg-green-100 text-green-800';
            label = 'Đã duyệt';
        } else if (isApproved === false) {
            badgeClass = 'bg-red-100 text-red-800';
            label = 'Từ chối';
        } else {
            badgeClass = 'bg-yellow-100 text-yellow-800';
            label = 'Chờ duyệt';
        }

        return (
            <Badge className={badgeClass}>
                {label}
            </Badge>
        );
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="text-center py-4 text-red-500">{error}</div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/manage-reviews')}
                className="mb-4"
            >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại danh sách
            </Button>

            <Card>
                <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                        <div>Chi tiết Đánh giá</div>
                        <div>{review.isApproved !== undefined && renderStatusBadge(review.isApproved)}</div>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Product Information */}
                    <div className="flex flex-col md:flex-row gap-6 border-b pb-6">
                        <div className="relative w-full md:w-1/4 h-48">
                            {review.productId?.thumbnail ? (
                                <Image
                                    src={review.productId.thumbnail}
                                    alt={review.productId.title}
                                    fill
                                    className="object-cover rounded-md"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-md">
                                    <p className="text-gray-500">Không có hình ảnh</p>
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-semibold mb-2">
                                {review.productId?.title || 'Sản phẩm không tồn tại'}
                            </h3>
                            <p className="text-gray-500 mb-4">
                                Mã sản phẩm: {typeof review.productId === 'object' ? review.productId._id : review.productId}
                            </p>
                            {review.productId?.price && (
                                <p className="text-lg font-medium text-primary">
                                    {review.productId.price.toLocaleString('vi-VN')} đ
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Review Content */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-medium">Người đánh giá</h4>
                                <p>{review.userName || review.userId || 'Người dùng ẩn danh'}</p>
                            </div>
                            <div className="text-right">
                                <h4 className="font-medium">Thời gian</h4>
                                <p className="text-sm text-gray-500">
                                    {formatDate(review.createdAt)}
                                </p>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-medium">Đánh giá</h4>
                            <div className="mt-1">{renderRatingStars(review.rating)}</div>
                        </div>

                        <div>
                            <h4 className="font-medium">Nội dung</h4>
                            <p className="mt-1 text-gray-700">{review.comment || 'Không có nội dung'}</p>
                        </div>

                        {review.images && review.images.length > 0 && (
                            <div>
                                <h4 className="font-medium">Hình ảnh</h4>
                                <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {review.images.map((image, index) => (
                                        <div key={index} className="relative h-32 w-full">
                                            <Image
                                                src={image}
                                                alt={`Review image ${index + 1}`}
                                                fill
                                                className="object-cover rounded-md"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-4">
                    <div>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" disabled={isDeleting}>
                                    <Trash className="h-4 w-4 mr-2" />
                                    {isDeleting ? 'Đang xóa...' : 'Xóa đánh giá'}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Bạn có chắc chắn muốn xóa đánh giá này? Hành động này không thể hoàn tác.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDelete}>Xóa</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                    <div className="flex space-x-2">
                        <Button 
                            variant="outline" 
                            onClick={() => handleModeration(false)}
                            disabled={isModerating || review.isApproved === false}
                        >
                            <XCircle className="h-4 w-4 mr-2" />
                            {review.isApproved === false ? 'Đã từ chối' : 'Từ chối'}
                        </Button>
                        <Button 
                            variant="default"
                            onClick={() => handleModeration(true)}
                            disabled={isModerating || review.isApproved === true}
                        >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            {review.isApproved === true ? 'Đã duyệt' : 'Duyệt'}
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
};

export default ReviewDetails; 