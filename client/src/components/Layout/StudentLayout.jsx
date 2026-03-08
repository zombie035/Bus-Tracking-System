import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';

const StudentLayout = () => {
    const location = useLocation();
    const isDashboard = location.pathname === '/student/dashboard' || location.pathname === '/student/dashboard/';

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            {!isDashboard && <Navbar />}
            <main className={isDashboard ? 'h-screen overflow-hidden' : ''}>
                <Outlet />
            </main>
        </div>
    );
};

export default StudentLayout;
