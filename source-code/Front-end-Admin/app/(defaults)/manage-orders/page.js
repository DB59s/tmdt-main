import OrdersList from '@/components/manage-orders/orders-list';
import OrderStatistics from '@/components/manage-orders/order-statistics';
import React from 'react';

export const metadata = {
    title: 'Manage Orders',
};

const ManageOrdersPage = () => {
    return (
        <div className="space-y-6">
            <OrderStatistics />
            <OrdersList />
        </div>
    );
};

export default ManageOrdersPage;
