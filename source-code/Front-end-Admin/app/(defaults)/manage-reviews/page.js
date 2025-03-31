import ReviewList from '@/components/manage-reviews/review-list';
import ReviewStats from '@/components/manage-reviews/review-stats';
import React from 'react';

export const metadata = {
    title: 'Quản lý Đánh giá',
};

const ManageReviewsPage = () => {
    return (
        <div className="space-y-6">
            <ReviewStats />
            <ReviewList />
        </div>
    );
};

export default ManageReviewsPage; 