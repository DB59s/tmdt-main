'use client';
import OrderDetails from '@/components/manage-orders/order-details';
import { useParams } from 'next/navigation';
import React from 'react';

const OrderDetailsPage = () => {
    const { id } = useParams();

    return (
        <div className="space-y-6">
            <OrderDetails orderId={id} />
        </div>
    );
};

export default OrderDetailsPage; 