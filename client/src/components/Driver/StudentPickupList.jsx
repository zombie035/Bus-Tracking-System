// client/src/components/Driver/StudentPickupList.jsx
import React, { useState, useEffect } from 'react';
import { busService } from '../../services/busService';

const StudentPickupList = () => {
    const [students, setStudents] = useState([]);
    const [studentsByStop, setStudentsByStop] = useState({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStop, setSelectedStop] = useState('all');

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const response = await busService.getStudentList();

            if (response.success) {
                setStudents(response.students || []);
                setStudentsByStop(response.studentsByStop || {});
            }
        } catch (error) {
            console.error('Error fetching students:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = students.filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.studentId?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStop = selectedStop === 'all' || student.boardingStop === selectedStop;
        return matchesSearch && matchesStop;
    });

    const stops = ['all', ...Object.keys(studentsByStop)];

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-16 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <i className="fas fa-users text-blue-600"></i>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Student Pickup List</h3>
                            <p className="text-sm text-gray-600">{students.length} students assigned</p>
                        </div>
                    </div>
                    <button
                        onClick={fetchStudents}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                    >
                        <i className="fas fa-sync-alt mr-2"></i>
                        Refresh
                    </button>
                </div>

                {/* Search & Filter */}
                <div className="space-y-3">
                    <div className="relative">
                        <i className="fas fa-search absolute left-4 top-3.5 text-gray-400"></i>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search students..."
                            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {stops.map(stop => (
                            <button
                                key={stop}
                                onClick={() => setSelectedStop(stop)}
                                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${selectedStop === stop
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {stop === 'all' ? '📍 All Stops' : stop}
                                {stop !== 'all' && studentsByStop[stop] && (
                                    <span className="ml-2 px-2 py-0.5 bg-white bg-opacity-20 rounded-full text-xs">
                                        {studentsByStop[stop].length}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Student List */}
            <div className="max-h-96 overflow-y-auto">
                {filteredStudents.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                            <i className="fas fa-user-slash text-gray-400 text-2xl"></i>
                        </div>
                        <p className="text-gray-600">No students found</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filteredStudents.map((student, index) => (
                            <div
                                key={student.id || index}
                                className="p-4 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                                        {student.name?.charAt(0).toUpperCase() || 'S'}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className="font-semibold text-gray-900">{student.name}</h4>
                                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                                                {student.studentId}
                                            </span>
                                        </div>

                                        <div className="space-y-1 text-sm text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <i className="fas fa-map-marker-alt text-green-600 w-4"></i>
                                                <span className="font-medium">Pickup:</span>
                                                <span>{student.boardingStop || 'N/A'}</span>
                                                {student.boardingTime && (
                                                    <span className="text-gray-500">• {student.boardingTime}</span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <i className="fas fa-map-marker-alt text-red-600 w-4"></i>
                                                <span className="font-medium">Drop:</span>
                                                <span>{student.droppingStop || 'N/A'}</span>
                                                {student.droppingTime && (
                                                    <span className="text-gray-500">• {student.droppingTime}</span>
                                                )}
                                            </div>

                                            {student.phone && (
                                                <div className="flex items-center gap-2">
                                                    <i className="fas fa-phone text-blue-600 w-4"></i>
                                                    <a
                                                        href={`tel:${student.phone}`}
                                                        className="text-blue-600 hover:underline"
                                                    >
                                                        {student.phone}
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentPickupList;
