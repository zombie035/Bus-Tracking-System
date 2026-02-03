// Script to append the complete sidebar section to DriverPage
// This will replace lines 515-576 with the corrected version

const correctSidebarSection = `
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <i className="fas fa-users text-blue-600 mb-2"></i>
                    <div className="text-xs text-gray-600">Passengers</div>
                    <div className="text-xl font-bold text-gray-900">{bus.currentPassengers || 0}/{bus.capacity}</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <i className="fas fa-tachometer-alt text-green-600 mb-2"></i>
                    <div className="text-xs text-gray-600">Status</div>
                    <div className="text-sm font-bold text-gray-900 capitalize">{bus.status || 'idle'}</div>
                  </div>
                </div>

                <button
                  onClick={() => setShowDelayModal(true)}
                  className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-red-700 transition-all flex items-center justify-center gap-2"
                >
                  <i className="fas fa-clock"></i>
                  <span>Report Delay</span>
                </button>
              </div>
            )}

            {/* Assigned Route Card */}
            <AssignedRouteCard />

            {/* Quick Messages */}
            <QuickMessageBar />

            {/* Notifications Panel */}
            <NotificationsPanel />

            {/* Student Pickup List */}
            <StudentPickupList />
          </div>
        </div>

        {/* Delay Report Modal */}
        <Del ayReportModal
          isOpen={showDelayModal}
          onClose={() => setShowDelayModal(false)}
          onSubmit={handleDelayReport}
        />

        {/* Toast Notification */}
        {toast && (
          <div
            className={\`fixed bottom-8 right-8 px-6 py-4 rounded-lg shadow-2xl transform transition-all duration-300 z-50 \${
              toast.type === 'success' ? 'bg-green-500 text-white' :
                toast.type === 'error' ? 'bg-red-500 text-white' :
                  'bg-blue-500 text-white'
            }\`}
          >
            <div className="flex items-center gap-3">
              <i className={\`fas \${toast.type === 'success' ? 'fa-check-circle' :
                toast.type === 'error' ? 'fa-exclamation-circle' :
                  'fa-info-circle'} text-xl\`}></i>
              <div>
                <p className="font-semibold">{toast.message}</p>
              </div>
              <button
                onClick={() => setToast(null)}
                className="ml-4 text-white hover:text-gray-200 transition-colors"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverDashboard;
`;

console.log('Sidebar section ready to insert');
console.log('Lines to replace: 515-576');
console.log('Please manually review and fix the DriverPage.jsx file');
