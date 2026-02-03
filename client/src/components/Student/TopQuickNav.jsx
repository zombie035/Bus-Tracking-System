import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const TopQuickNav = ({ user, onMenuClick }) => {
    const navigate = useNavigate();
    const { logout } = useAuth(); // Add useAuth hook for logout

    return (
        <div className="absolute top-12 left-4 right-4 z-[1000] flex justify-between items-center bg-white/90 backdrop-blur-md rounded-full shadow-lg p-2 pl-4 border border-white/20 ring-1 ring-black/5">
            {/* Left: Brand/Title */}
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-zinc-900 rounded-full flex items-center justify-center shadow-sm">
                    <i className="fas fa-bus text-white text-xs"></i>
                </div>
                <div>
                    <h1 className="text-sm font-bold text-zinc-800 leading-none">Bus Tracker</h1>
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1">
                <button
                    onClick={() => navigate('/student/notifications')}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-600 hover:bg-zinc-100 transition-colors relative"
                    title="Notifications"
                >
                    <i className="fas fa-bell text-sm"></i>
                    <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></span>
                </button>

                <div className="h-4 w-[1px] bg-gray-200 mx-1"></div>

                <button
                    onClick={() => navigate('/student/settings')}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-600 hover:bg-zinc-100 transition-colors"
                    title="Settings"
                >
                    <i className="fas fa-cog text-sm"></i>
                </button>

                <button
                    onClick={() => navigate('/student/help')}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-600 hover:bg-zinc-100 transition-colors"
                    title="Help"
                >
                    <i className="fas fa-question-circle text-sm"></i>
                </button>

                <button
                    onClick={logout}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors"
                    title="Logout"
                >
                    <i className="fas fa-sign-out-alt text-sm"></i>
                </button>

                <div className="h-4 w-[1px] bg-gray-200 mx-1"></div>

                <button
                    onClick={() => navigate('/student/profile')}
                    className="w-8 h-8 rounded-full bg-zinc-800 text-white flex items-center justify-center text-xs font-bold shadow-md ring-2 ring-white ml-1"
                >
                    {user?.name?.charAt(0).toUpperCase() || 'S'}
                </button>
            </div>
        </div>
    );
};

export default TopQuickNav;
