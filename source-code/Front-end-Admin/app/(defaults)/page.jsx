import DashboardOverview from '@/components/analytics/dashboard-overview';
import RevenueStatistics from '@/components/analytics/revenue-statistics';
import TopProducts from '@/components/analytics/top-products';
import ReturnRateAnalysis from '@/components/analytics/return-rate';
import UserBehaviorAnalysis from '@/components/analytics/user-behavior';
import CategoryStatistics from '@/components/analytics/category-statistics';
import React from 'react';

export const metadata = {
    title: 'Admin',
};

const Sales = () => {
    return (
        <div className="space-y-8">
            <DashboardOverview />
            <RevenueStatistics />
            <TopProducts />
            <ReturnRateAnalysis />
            <UserBehaviorAnalysis />
            <CategoryStatistics />
        </div>
    );
};

export default Sales;
