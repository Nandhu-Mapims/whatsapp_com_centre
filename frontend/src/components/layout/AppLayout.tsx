import React from 'react';
import { Outlet } from 'react-router-dom';
import { SimpleNavbar } from './SimpleNavbar';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-[#F5F7FB] text-slate-900 flex flex-col">
      {/* Simple, Modern Top Navbar */}
      <SimpleNavbar />

      {/* Main Viewport */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
};
