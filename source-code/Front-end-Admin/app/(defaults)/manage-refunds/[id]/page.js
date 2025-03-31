'use client';
import RefundDetails from '@/components/manage-refunds/refund-details';
import { useParams } from 'next/navigation';
import React from 'react';

const RefundDetailsPage = () => {
    const { id } = useParams();

    return (
        <div className="space-y-6">
            <RefundDetails refundId={id} />
        </div>
    );
};

export default RefundDetailsPage; 