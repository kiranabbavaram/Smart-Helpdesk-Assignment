import React from 'react';

export const Skeleton: React.FC<{ className?: string }>
  = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} aria-hidden="true" />
);

export const SkeletonText: React.FC<{ lines?: number }>
  = ({ lines = 3 }) => (
  <div className="space-y-2" aria-hidden="true">
    {Array.from({ length: lines }).map((_, i) => (
      <div key={i} className="animate-pulse bg-gray-200 h-4 rounded w-full" />
    ))}
  </div>
);


