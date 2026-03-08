// client/src/components/Student/ProfileSheetContent.jsx
import React from 'react';
import {
    UserCircleIcon,
    EnvelopeIcon,
    IdentificationIcon,
    TruckIcon,
    UserIcon,
    PhoneIcon
} from '@heroicons/react/24/outline';

const ProfileSheetContent = ({ profile, onLogout }) => {
    if (!profile) {
        return (
            <div className="flex flex-col h-full items-center justify-center p-6">
                <UserCircleIcon className="w-16 h-16 text-gray-300 mb-3" />
                <p className="text-gray-500">Loading profile...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header with Avatar */}
            <div className="px-6 py-6 bg-gradient-to-br from-black to-gray-800 flex-shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-white text-black flex items-center justify-center text-3xl font-black shadow-xl">
                        {profile.name ? profile.name.charAt(0).toUpperCase() : 'S'}
                    </div>
                    <div className="flex-1">
                        <h2 className="text-2xl font-black text-white mb-1">{profile.name || 'Student'}</h2>
                        <p className="text-sm text-gray-300 font-medium">Student Profile</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 pb-40 space-y-3">

                {/* Student ID */}
                <div className="bg-white rounded-2xl border-2 border-gray-200 p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                            <IdentificationIcon className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Student ID</p>
                            <p className="text-lg font-black text-black mt-0.5">{profile.studentId || 'N/A'}</p>
                        </div>
                    </div>
                </div>

                {/* Email */}
                {profile.email && (
                    <div className="bg-white rounded-2xl border-2 border-gray-200 p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                                <EnvelopeIcon className="w-6 h-6 text-purple-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Email Address</p>
                                <p className="text-sm font-bold text-black mt-0.5 truncate">{profile.email}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Assigned Bus */}
                {(profile.busNumber || profile.busId) && (
                    <div className="bg-white rounded-2xl border-2 border-gray-200 p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                                <TruckIcon className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Assigned Bus</p>
                                <p className="text-lg font-black text-black mt-0.5">
                                    {profile.busNumber || `Bus #${profile.busId}`}
                                </p>
                                {profile.routeName && (
                                    <p className="text-xs text-gray-500 mt-1">{profile.routeName}</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Bus Driver Information */}
                {(profile.driverName || profile.driverPhone) && (
                    <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl border-2 border-orange-200 p-4 shadow-sm">
                        <h3 className="text-xs font-black text-orange-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <UserIcon className="w-4 h-4" />
                            Bus Driver Contact
                        </h3>

                        {profile.driverName && (
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                                    <span className="text-lg font-black text-orange-600">
                                        {profile.driverName.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-xs text-orange-700 font-medium">Driver Name</p>
                                    <p className="text-base font-black text-black">{profile.driverName}</p>
                                </div>
                            </div>
                        )}

                        {profile.driverPhone && (
                            <a
                                href={`tel:${profile.driverPhone}`}
                                className="flex items-center gap-3 p-3 bg-white rounded-xl hover:bg-orange-100 transition-colors border border-orange-200"
                            >
                                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                                    <PhoneIcon className="w-5 h-5 text-orange-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-orange-700 font-medium">Phone Number</p>
                                    <p className="text-base font-black text-black">{profile.driverPhone}</p>
                                </div>
                                <div className="text-orange-600 text-xs font-bold uppercase bg-orange-100 px-2 py-1 rounded-md">
                                    Call
                                </div>
                            </a>
                        )}
                    </div>
                )}

                {/* Quick Info - if no driver info available */}
                {!profile.driverName && !profile.driverPhone && (
                    <div className="bg-gray-50 rounded-xl p-4 text-center">
                        <p className="text-sm text-gray-500">Driver information not available</p>
                        <p className="text-xs text-gray-400 mt-1">Contact admin for details</p>
                    </div>
                )}

                {/* Logout Button */}
                <div className="pt-2 pb-4">
                    <button
                        onClick={onLogout}
                        className="w-full py-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-sm uppercase tracking-wider transition-all shadow-lg hover:shadow-xl active:scale-95"
                    >
                        Logout
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ProfileSheetContent;
