import React from 'react';

interface AuthLayoutProps {
  leftContent: React.ReactNode;
  children: React.ReactNode;
}

export default function AuthLayout({ leftContent, children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex bg-[#121429]">
      <div className="lg:w-1/2">{leftContent}</div>
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 py-8">
        <div className="w-full">{children}</div>
      </div>
    </div>
  );
}