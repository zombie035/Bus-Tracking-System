// client/src/components/Admin/RouteAnalytics.jsx
import React, { useState, useEffect } from 'react';
import { TruckIcon, UserGroupIcon, MapPinIcon, ChartBarIcon, DocumentArrowDownIcon } from '@heroicons/react/20/solid';
import api from '../../services/api';
import ChartComponent from '../UI/ChartComponent';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const RouteAnalytics = () => {
    const [routeData, setRouteData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalStudents, setTotalStudents] = useState(0);

    useEffect(() => {
        fetchRouteAnalytics();
    }, []);

    const fetchRouteAnalytics = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log('📊 Fetching route analytics...');

            const response = await api.get('/api/admin/analytics/routes');
            console.log('📊 Response:', response.data);

            if (response.data.success) {
                setRouteData(response.data.routeStats || []);
                setTotalStudents(response.data.totalStudents || 0);
                console.log(`✅ Loaded ${response.data.routeStats?.length || 0} routes`);
            }
        } catch (error) {
            console.error('❌ Error fetching route analytics:', error);
            setError(error.response?.data?.message || 'Failed to load analytics data');
        } finally {
            setLoading(false);
        }
    };

    // Generate dynamic colors for chart
    const generateColors = (count) => {
        const baseColors = [
            { bg: 'rgba(59, 130, 246, 0.8)', border: 'rgb(59, 130, 246)' },
            { bg: 'rgba(16, 185, 129, 0.8)', border: 'rgb(16, 185, 129)' },
            { bg: 'rgba(245, 158, 11, 0.8)', border: 'rgb(245, 158, 11)' },
            { bg: 'rgba(139, 92, 246, 0.8)', border: 'rgb(139, 92, 246)' },
            { bg: 'rgba(236, 72, 153, 0.8)', border: 'rgb(236, 72, 153)' },
            { bg: 'rgba(14, 165, 233, 0.8)', border: 'rgb(14, 165, 233)' },
            { bg: 'rgba(234, 88, 12, 0.8)', border: 'rgb(234, 88, 12)' },
            { bg: 'rgba(168, 85, 247, 0.8)', border: 'rgb(168, 85, 247)' },
        ];

        const colors = { bg: [], border: [] };
        for (let i = 0; i < count; i++) {
            const color = baseColors[i % baseColors.length];
            colors.bg.push(color.bg);
            colors.border.push(color.border);
        }
        return colors;
    };

    const colors = generateColors(routeData.length);

    // Chart data for route visualization
    const chartData = {
        labels: routeData.map(r => r.routeName || r.routeNumber || `Route ${r.id}`),
        datasets: [{
            label: 'Students per Route',
            data: routeData.map(r => r.studentCount || 0),
            backgroundColor: colors.bg,
            borderColor: colors.border,
            borderWidth: 2,
            borderRadius: 8,
        }]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        return `Students: ${context.parsed.y}`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    borderDash: [2],
                    drawBorder: false,
                },
                ticks: {
                    stepSize: 1,
                    font: {
                        size: 11
                    }
                }
            },
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    font: {
                        size: 11,
                        weight: '500'
                    },
                    maxRotation: 45,
                    minRotation: 0
                }
            }
        }
    };

    // Export to Excel
    const exportToExcel = () => {
        if (routeData.length === 0) {
            alert('No data to export');
            return;
        }
        const exportData = routeData.map(route => ({
            'Route Name': route.routeName || 'N/A',
            'Route Number': route.routeNumber || 'N/A',
            'Starting Point': route.startingPoint || 'N/A',
            'Destination': route.destinationPoint || 'N/A',
            'Student Count': route.studentCount || 0,
            'Bus Count': route.busCount || 0,
            'Utilization %': totalStudents > 0 ? ((route.studentCount / totalStudents) * 100).toFixed(1) + '%' : '0%'
        }));

        // Add summary row
        exportData.unshift({
            'Route Name': 'SUMMARY',
            'Route Number': `Total Routes: ${routeData.length}`,
            'Starting Point': '',
            'Destination': '',
            'Student Count': `Total: ${totalStudents}`,
            'Bus Count': `Total: ${routeData.reduce((sum, r) => sum + (r.busCount || 0), 0)}`,
            'Utilization %': '100%'
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Route Analytics');
        const fileName = `route-analytics-${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
    };

    const exportToPDF = () => {
        if (routeData.length === 0) {
            alert('No data to export');
            return;
        }
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // Header
        doc.setFontSize(22);
        doc.setTextColor(30, 41, 59); // slate-800
        doc.text('Route Analytics Report', 14, 20);

        // Date and summary info
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139); // slate-500
        doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 28);
        doc.text(`Bus Tracking System`, 14, 34);

        // Summary statistics box
        doc.setFillColor(239, 246, 255); // blue-50
        doc.roundedRect(14, 40, pageWidth - 28, 25, 3, 3, 'F');

        doc.setFontSize(11);
        doc.setTextColor(30, 41, 59);
        doc.text('Summary Statistics', 18, 48);

        doc.setFontSize(9);
        const totalRoutes = routeData.length;
        const totalBuses = routeData.reduce((sum, r) => sum + (r.busCount || 0), 0);
        const avgStudents = totalRoutes > 0 ? (totalStudents / totalRoutes).toFixed(1) : 0;

        const summaryY = 55;
        doc.text(`Total Routes: ${totalRoutes}`, 18, summaryY);
        doc.text(`Total Students: ${totalStudents}`, 75, summaryY);
        doc.text(`Total Buses: ${totalBuses}`, 132, summaryY);
        doc.text(`Avg Students/Route: ${avgStudents}`, 18, summaryY + 6);

        // Route details table
        const tableStartY = 75;
        autoTable(doc, {
            startY: tableStartY,
            head: [['Route', 'Students', 'Buses', 'Starting Point', 'Destination', 'Utilization %']],
            body: routeData.map(route => [
                route.routeName || route.routeNumber || 'N/A',
                route.studentCount || 0,
                route.busCount || 0,
                (route.startingPoint || 'N/A').substring(0, 25),
                (route.destinationPoint || 'N/A').substring(0, 25),
                totalStudents > 0 ? ((route.studentCount / totalStudents) * 100).toFixed(1) + '%' : '0%'
            ]),
            headStyles: {
                fillColor: [37, 99, 235], // blue-600
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 9
            },
            bodyStyles: {
                fontSize: 8,
                textColor: [30, 41, 59]
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252] // slate-50
            },
            margin: { top: 10, left: 14, right: 14 },
            theme: 'grid'
        });

        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184); // slate-400
            doc.text(
                `Page ${i} of ${pageCount}`,
                pageWidth / 2,
                doc.internal.pageSize.getHeight() - 10,
                { align: 'center' }
            );
        }

        // Save the PDF
        const fileName = `route-analytics-${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
    };
    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 font-medium">Loading analytics...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                        <i className="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-red-900">Error Loading Analytics</h3>
                        <p className="text-red-700 mt-1">{error}</p>
                        <button
                            onClick={fetchRouteAnalytics}
                            className="mt-3 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const hasData = routeData.length > 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <ChartBarIcon className="w-7 h-7 text-blue-600" />
                            Route Analytics
                        </h1>
                        <p className="text-sm text-gray-600 mt-1">Student distribution across routes</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={fetchRouteAnalytics}
                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow flex items-center gap-2"
                        >
                            <i className="fas fa-sync-alt"></i>
                            Refresh
                        </button>
                        {hasData && (
                            <>
                                <button
                                    onClick={exportToExcel}
                                    className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-all duration-200 shadow-sm hover:shadow flex items-center gap-2"
                                >
                                    <i className="fas fa-file-excel"></i>
                                    Export Excel
                                </button>
                                <button
                                    onClick={exportToPDF}
                                    className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-all duration-200 shadow-sm hover:shadow flex items-center gap-2"
                                >
                                    <DocumentArrowDownIcon className="w-5 h-5" />
                                    Export PDF
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Students</p>
                            <p className="text-3xl font-bold text-blue-600 mt-2">{totalStudents}</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <UserGroupIcon className="w-8 h-8 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Routes</p>
                            <p className="text-3xl font-bold text-green-600 mt-2">{routeData.length}</p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-lg">
                            <MapPinIcon className="w-8 h-8 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Avg per Route</p>
                            <p className="text-3xl font-bold text-purple-600 mt-2">
                                {routeData.length > 0 ? Math.round(totalStudents / routeData.length) : 0}
                            </p>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <TruckIcon className="w-8 h-8 text-purple-600" />
                        </div>
                    </div>
                </div>
            </div>

            {!hasData ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                    <ChartBarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Routes Found</h3>
                    <p className="text-gray-600 mb-4">There are no routes in the system yet.</p>
                    <p className="text-sm text-gray-500">Create routes in the Route Management section to see analytics here.</p>
                </div>
            ) : (
                <>
                    {/* Charts */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 overflow-hidden">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Route Distribution Chart</h2>
                            <div className="h-70 w-full relative">
                                <ChartComponent data={chartData} options={chartOptions} type="bar" />
                            </div>
                        </div>

                        {/* Top Routes */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 overflow-hidden">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Top Routes by Students</h2>
                            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                                {routeData
                                    .sort((a, b) => (b.studentCount || 0) - (a.studentCount || 0))
                                    .slice(0, 5)
                                    .map((route, index) => (
                                        <div key={route.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${index === 0 ? 'bg-yellow-500' :
                                                    index === 1 ? 'bg-gray-400' :
                                                        index === 2 ? 'bg-orange-600' :
                                                            'bg-blue-500'
                                                    }`}>
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">
                                                        {route.routeName || route.routeNumber || `Route #${route.id}`}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {route.routeNumber ? `#${route.routeNumber}` : 'No route number'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-blue-600">{route.studentCount || 0}</p>
                                                <p className="text-xs text-gray-500">students</p>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>

                    {/* Detailed Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg font-bold text-gray-900">Detailed Route Statistics</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Route</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Students</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Buses</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Starting Point</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Destination</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Capacity Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {routeData.map((route) => (
                                        <tr key={route.id} className="hover:bg-blue-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-semibold text-gray-900">
                                                        {route.routeName || 'Unnamed Route'}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        #{route.routeNumber || 'No number'}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                                    {route.studentCount || 0}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-gray-900 font-medium">{route.busCount || 0}</span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">{route.startingPoint || 'N/A'}</td>
                                            <td className="px-6 py-4 text-gray-600">{route.destinationPoint || 'N/A'}</td>
                                            <td className="px-6 py-4">
                                                {route.studentCount > 0 ? (
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${route.studentCount > 40 ? 'bg-red-100 text-red-800' :
                                                        route.studentCount > 25 ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-green-100 text-green-800'
                                                        }`}>
                                                        {route.studentCount > 40 ? 'High' : route.studentCount > 25 ? 'Medium' : 'Low'}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 text-sm">Empty</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div >
    );
};

export default RouteAnalytics;
