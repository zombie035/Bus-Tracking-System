import React from 'react';

const HelpPage = () => {
    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-bold text-slate-800 mb-6">Help & Support</h1>

            <div className="space-y-6">
                {/* Contact Admin */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <i className="fas fa-headset text-blue-600"></i> Contact Administration
                    </h2>
                    <p className="text-gray-600 mb-4">For issues regarding route changes, bus scheduling, or account problems.</p>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                <i className="fas fa-phone"></i>
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">Transport Office</p>
                                <p className="text-sm text-gray-500">+91 98765 43210</p>
                            </div>
                        </div>
                        <a href="tel:+919876543210" className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors text-center">
                            Call Now
                        </a>
                    </div>
                </div>

                {/* FAQ */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Frequently Asked Questions</h2>
                    <div className="space-y-4">
                        <details className="group border border-gray-200 rounded-lg overflow-hidden">
                            <summary className="flex cursor-pointer items-center justify-between bg-gray-50 p-4 font-medium text-gray-900 hover:bg-gray-100">
                                How do I change my boarding point?
                                <span className="transition group-open:rotate-180">
                                    <i className="fas fa-chevron-down text-gray-400"></i>
                                </span>
                            </summary>
                            <div className="p-4 text-gray-600 border-t border-gray-200">
                                You cannot change your boarding point directly in the app. Please contact the transport administrator or use the 'Report Issue' feature to request a change.
                            </div>
                        </details>

                        <details className="group border border-gray-200 rounded-lg overflow-hidden">
                            <summary className="flex cursor-pointer items-center justify-between bg-gray-50 p-4 font-medium text-gray-900 hover:bg-gray-100">
                                What if my bus is late?
                                <span className="transition group-open:rotate-180">
                                    <i className="fas fa-chevron-down text-gray-400"></i>
                                </span>
                            </summary>
                            <div className="p-4 text-gray-600 border-t border-gray-200">
                                Check the Home page for delay alerts. If the bus is delayed, the status will update automatically. You can also view delay notifications in the 'Notifications' tab.
                            </div>
                        </details>

                        <details className="group border border-gray-200 rounded-lg overflow-hidden">
                            <summary className="flex cursor-pointer items-center justify-between bg-gray-50 p-4 font-medium text-gray-900 hover:bg-gray-100">
                                The map is not showing my location?
                                <span className="transition group-open:rotate-180">
                                    <i className="fas fa-chevron-down text-gray-400"></i>
                                </span>
                            </summary>
                            <div className="p-4 text-gray-600 border-t border-gray-200">
                                Please ensure you have granted location permissions to the app in your browser settings. Refresh the page after enabling location access.
                            </div>
                        </details>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HelpPage;
