import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TripHistoryPage = () => {
    // Placeholder data - in a real app, this would come from an API
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mock fetch
        setTimeout(() => {
            setHistory([
                { id: 1, date: '2023-11-01', status: 'Completed', pickTime: '08:15 AM', dropTime: '04:30 PM' },
                { id: 2, date: '2023-10-31', status: 'Completed', pickTime: '08:12 AM', dropTime: '04:28 PM' },
                { id: 3, date: '2023-10-30', status: 'Missed', pickTime: '-', dropTime: '-' },
                { id: 4, date: '2023-10-27', status: 'Completed', pickTime: '08:10 AM', dropTime: '04:35 PM' },
                { id: 5, date: '2023-10-26', status: 'Completed', pickTime: '08:14 AM', dropTime: '04:25 PM' },
            ]);
            setLoading(false);
        }, 500);
    }, []);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-bold text-slate-800 mb-6">Trip History</h1>

            {loading ? (
                <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pickup</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Drop</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {history.map((trip) => (
                                <tr key={trip.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{trip.date}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${trip.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                            {trip.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{trip.pickTime}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{trip.dropTime}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default TripHistoryPage;
