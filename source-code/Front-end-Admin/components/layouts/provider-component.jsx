'use client';;
import App from '@/App';
import store from '@/store';
import { Provider } from 'react-redux';
import React, { Suspense } from 'react';
import Loading from '@/components/layouts/loading';
import { ToastProvider } from '@/components/ui/toast';

const ProviderComponent = ({
    children
}) => {
    return (
        <Provider store={store}>
            <ToastProvider>
                <Suspense fallback={<Loading />}>
                    <App>{children} </App>
                </Suspense>
            </ToastProvider>
        </Provider>
    );
};

export default ProviderComponent;
// todo
// export default appWithI18Next(ProviderComponent, ni18nConfig);
