'use client';
import ReturnDetails from '@/components/manage-returns/return-details';
import { useParams } from 'next/navigation';
import React from 'react';

const ReturnDetailsPage = () => {
    const { id } = useParams();

    return (
        <div className="space-y-6">
            <ReturnDetails returnId={id} />
        </div>
    );
};

export default ReturnDetailsPage; 