'use client';

import * as React from 'react';
import { Toaster as RadToaster } from 'react-hot-toast';
import { createContext, useContext, useState } from 'react';
import { cn } from '@/lib/utils';

const ToastContext = createContext({
  toast: (options) => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = (options) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = {
      id,
      ...options,
    };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-0 right-0 z-50 flex flex-col items-end p-4 space-y-4">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function Toast({ title, description, variant = 'default', id }) {
  return (
    <div
      className={cn(
        'flex items-start w-full max-w-sm p-4 rounded-lg shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transform transition-all duration-300 translate-x-0',
        {
          'border-red-400 dark:border-red-400': variant === 'destructive',
          'border-green-400 dark:border-green-400': variant === 'success',
        }
      )}
      id={id}
    >
      <div className="flex-1 ml-3">
        {title && (
          <h4 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h4>
        )}
        {description && (
          <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</div>
        )}
      </div>
      <button
        className="ml-4 text-gray-400 hover:text-gray-500 focus:outline-none"
        onClick={() => document.getElementById(id)?.remove()}
      >
        <span className="sr-only">Close</span>
        <svg
          className="w-5 h-5"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
}

export function Toaster() {
  return <RadToaster position="top-right" />;
} 