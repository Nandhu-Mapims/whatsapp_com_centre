import React from 'react';
import { Outlet } from 'react-router-dom';
import { SimpleNavbar } from './SimpleNavbar';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-[#F5F7FB] text-slate-900 flex flex-col">
      {/* Simple, Modern Top Navbar */}
      <SimpleNavbar />

      {/* Main Viewport */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
