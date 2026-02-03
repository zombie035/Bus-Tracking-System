// client/src/components/Admin/DateRangeFilter.jsx
import React, { useState } from 'react';
import { CalendarIcon } from '@heroicons/react/24/outline';

const DateRangeFilter = ({ onDateChange, initialStartDate = '', initialEndDate = '' }) => {
    const [startDate, setStartDate] = useState(initialStartDate);
    const [endDate, setEndDate] = useState(initialEndDate);

    const handleStartDateChange = (e) => {
        const newStartDate = e.target.value;
        setStartDate(newStartDate);
        if (onDateChange) {
            onDateChange(newStartDate, endDate);
        }
    };

    const handleEndDateChange = (e) => {
        const newEndDate = e.target.value;
        setEndDate(newEndDate);
        if (onDateChange) {
            onDateChange(startDate, newEndDate);
        }
    };

    const setQuickRange = (preset) => {
        const today = new Date();
        let start, end;

        switch (preset) {
            case 'today':
                start = end = today.toISOString().split('T')[0];
                break;
            case 'week':
                start = new Date(today.setDate(today.getDate() - 7)).toISOString().split('T')[0];
                end = new Date().toISOString().split('T')[0];
                break;
            case 'month':
                start = new Date(today.setMonth(today.getMonth() - 1)).toISOString().split('T')[0];
                end = new Date().toISOString().split('T')[0];
                break;
            case 'year':
                start = new Date(today.setFullYear(today.getFullYear() - 1)).toISOString().split('T')[0];
                end = new Date().toISOString().split('T')[0];
                break;
            default:
                return;
        }

        setStartDate(start);
        setEndDate(end);
        if (onDateChange) {
            onDateChange(start, end);
        }
    };

    const clearDates = () => {
        setStartDate('');
        setEndDate('');
        if (onDateChange) {
            onDateChange('', '');
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
                <CalendarIcon className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Date Range</h3>
            </div>

            {/* Quick Select Buttons */}
            <div className="flex flex-wrap gap-2 mb-4">
                <button
                    onClick={() => setQuickRange('today')}
                    className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                    Today
                </button>
                <button
                    onClick={() => setQuickRange('week')}
                    className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                    Last 7 Days
                </button>
                <button
                    onClick={() => setQuickRange('month')}
                    className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                    Last 30 Days
                </button>
                <button
                    onClick={() => setQuickRange('year')}
                    className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                    Last Year
                </button>
                {(startDate || endDate) && (
                    <button
                        onClick={clearDates}
                        className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Clear
                    </button>
                )}
            </div>

            {/* Date Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date
                    </label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={handleStartDateChange}
                        max={endDate || undefined}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Date
                    </label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={handleEndDateChange}
                        min={startDate || undefined}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                </div>
            </div>

            {/* Selected Range Display */}
            {startDate && endDate && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-900">
                        <strong>Selected Range:</strong>{' '}
                        {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
                    </p>
                </div>
            )}
        </div>
    );
};

export default DateRangeFilter;
