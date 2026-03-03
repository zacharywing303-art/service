import React from 'react';
import { cn } from '../lib/utils.js';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Card({ className, ...props }: CardProps) {
  return <div className={cn('rounded-lg border border-gray-200 bg-white p-6 shadow-sm', className)} {...props} />;
}
