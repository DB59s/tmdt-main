'use client';

import * as React from 'react';

const Badge = React.forwardRef(({ className, variant = 'default', ...props }, ref) => {
  const variantClasses = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/80',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/80',
    outline: 'text-foreground border border-gray-300 hover:bg-accent hover:text-accent-foreground',
  };

  return (
    <span
      ref={ref}
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variantClasses[variant] || variantClasses.default} ${className || ''}`}
      {...props}
    />
  );
});

Badge.displayName = 'Badge';

export { Badge }; 