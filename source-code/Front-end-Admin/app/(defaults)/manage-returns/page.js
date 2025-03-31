import ReturnList from '@/components/manage-returns/return-list';
import ReturnStatistics from '@/components/manage-returns/return-statistics';
import React from 'react';

export const metadata = {
    title: 'Quản lý Yêu cầu Đổi/Trả Hàng',
};

const ManageReturnsPage = () => {
    return (
        <div className="space-y-6">
            <ReturnStatistics />
            <ReturnList />
        </div>
    );
};

export default ManageReturnsPage; 