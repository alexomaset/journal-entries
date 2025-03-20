"use client";

import React from 'react';

interface ScrollableContainerProps {
  children: React.ReactNode;
}

export default function ScrollableContainer({ children }: ScrollableContainerProps) {
  return (
    <div className="h-[calc(100vh-4rem)] overflow-y-auto pb-6">
      <div className="space-y-6 px-4">
        {children}
      </div>
    </div>
  );
}
