import RefundList from '@/components/manage-refunds/refund-list';
import RefundStatistics from '@/components/manage-refunds/refund-statistics';
import React from 'react';

export const metadata = {
    title: 'Manage Refund Requests',
};

const ManageRefundsPage = () => {
    return (
        <div className="space-y-6">
            <RefundStatistics />
            <RefundList />
        </div>
    );
};

export default ManageRefundsPage; 