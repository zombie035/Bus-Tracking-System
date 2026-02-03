// client/src/components/Student/DailyScheduleCard.jsx
import React from 'react';

const DailyScheduleCard = ({ schedule }) => {
    if (!schedule) {
        return null;
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <i className="fas fa-calendar-check text-blue-600"></i>
                Daily Schedule
            </h3>

            <div className="space-y-4">
                {/* Morning Pickup */}
                {schedule.morningPickup && (
                    <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-200">
                        <div className="w-12 h-12 rounded-lg bg-orange-500 flex items-center justify-center text-white flex-shrink-0">
                            <i className="fas fa-sunrise text-xl"></i>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-600 mb-1">Morning Pickup</p>
                            <p className="text-2xl font-bold text-gray-900">{schedule.morningPickup}</p>
                            {schedule.boardingStop && (
                                <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                                    <i className="fas fa-map-marker-alt text-xs"></i>
                                    {schedule.boardingStop}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Evening Drop */}
                {schedule.eveningDrop && (
                    <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                        <div className="w-12 h-12 rounded-lg bg-indigo-500 flex items-center justify-center text-white flex-shrink-0">
                            <i className="fas fa-moon text-xl"></i>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-600 mb-1">Evening Drop</p>
                            <p className="text-2xl font-bold text-gray-900">{schedule.eveningDrop}</p>
                            {schedule.droppingStop && (
                                <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                                    <i className="fas fa-map-marker-alt text-xs"></i>
                                    {schedule.droppingStop}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* No Schedule */}
                {!schedule.morningPickup && !schedule.eveningDrop && (
                    <div className="text-center py-8 text-gray-500">
                        <i className="fas fa-calendar-times text-3xl mb-2"></i>
                        <p>No schedule available</p>
                        <p className="text-sm mt-1">Contact admin for schedule details</p>
                    </div>
                )}
            </div>

            {/* Reminder Note */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs text-blue-800 flex items-start gap-2">
                    <i className="fas fa-info-circle mt-0.5"></i>
                    <span>Please arrive 5 minutes before scheduled time to avoid missing the bus.</span>
                </p>
            </div>
        </div>
    );
};

export default DailyScheduleCard;
