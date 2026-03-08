// client/src/components/Student/TopContextBar.jsx
import React from 'react';
import { UserCircleIcon } from '@heroicons/react/24/outline';

const TopContextBar = ({ title = "Bus Tracker", onProfileClick }) => {
    return (
        <div className="fixed top-0 left-0 right-0 z-[1300] bg-white/80 backdrop-blur-xl border-b border-gray-200/50 safe-top">
            <div className="flex items-center justify-between h-14 px-4">
                {/* Left side - could add back button or menu later */}
                <div className="w-10"></div>

                {/* Center - Page Title */}
                <h1 className="text-lg font-bold text-gray-900 tracking-tight">
                    {title}
                </h1>

                {/* Right - Profile Icon */}
                <button
                    onClick={onProfileClick}
                    className="w-10 h-10 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors"
                    aria-label="Profile"
                >
                    <UserCircleIcon className="w-6 h-6 text-gray-700" />
                </button>
            </div>
        </div>
    );
};

export default TopContextBar;
