import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const StudentLayout = () => {
    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            <Navbar />
            <main>
                <Outlet />
            </main>
        </div>
    );
};

export default StudentLayout;
