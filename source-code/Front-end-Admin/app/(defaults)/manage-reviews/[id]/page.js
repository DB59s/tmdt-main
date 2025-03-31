import ReviewDetails from '@/components/manage-reviews/review-details';
import React from 'react';

export const metadata = {
    title: 'Chi tiết Đánh giá',
};

const ReviewDetailsPage = ({ params }) => {
    return <ReviewDetails id={params.id} />;
};

export default ReviewDetailsPage; 