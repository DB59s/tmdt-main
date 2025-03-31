'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Trash } from 'lucide-react';
import { formatDate } from '@/utils/format';
import Link from 'next/link';

export const columns = [
    {
        accessorKey: 'productId',
        header: 'Sản phẩm',
        cell: ({ row }) => {
            const product = row.original.productId;
            return (
                <div className="flex items-center">
                    {product?.thumbnail && (
                        <img 
                            src={product.thumbnail} 
                            alt={product.title} 
                            className="h-10 w-10 rounded object-cover mr-2"
                        />
                    )}
                    <div className="max-w-[200px] truncate font-medium">
                        {product?.title || 'Sản phẩm không tồn tại'}
                    </div>
                </div>
            );
        },
    },
    {
        accessorKey: 'rating',
        header: 'Đánh giá',
        cell: ({ row }) => {
            const rating = row.original.rating;
            return (
                <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <svg
                            key={i}
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-4 w-4 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                    ))}
                </div>
            );
        },
    },
    {
        accessorKey: 'comment',
        header: 'Nội dung',
        cell: ({ row }) => (
            <div className="max-w-[300px] truncate">
                {row.original.comment}
            </div>
        ),
    },
    {
        accessorKey: 'isApproved',
        header: 'Trạng thái',
        cell: ({ row }) => {
            const isApproved = row.original.isApproved;
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
        },
    },
    {
        accessorKey: 'createdAt',
        header: 'Thời gian',
        cell: ({ row }) => {
            return (
                <div className="text-sm text-gray-500">
                    {formatDate(row.original.createdAt)}
                </div>
            );
        },
    },
    {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => {
            return (
                <div className="flex items-center space-x-2">
                    <Link href={`/manage-reviews/${row.original._id}`}>
                        <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            Chi tiết
                        </Button>
                    </Link>
                </div>
            )
        },
    },
]; 