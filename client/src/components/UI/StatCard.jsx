// client/src/components/UI/StatCard.jsx - UPDATED VERSION
import React from 'react';

const StatCard = ({ title, value, icon: Icon, color, trend, trendUp = true, loading = false }) => {
  const colorClasses = {
    blue: { bg: 'bg-blue-500', light: 'bg-blue-100', text: 'text-blue-700' },
    green: { bg: 'bg-green-500', light: 'bg-green-100', text: 'text-green-700' },
    purple: { bg: 'bg-purple-500', light: 'bg-purple-100', text: 'text-purple-700' },
    amber: { bg: 'bg-amber-500', light: 'bg-amber-100', text: 'text-amber-700' },
    red: { bg: 'bg-red-500', light: 'bg-red-100', text: 'text-red-700' },
  };

  const currentColor = colorClasses[color] || colorClasses.blue;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest">
            {title}
          </p>
          
          {loading ? (
            <div className="mt-3 space-y-2">
              <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-3 w-32 bg-gray-100 rounded animate-pulse"></div>
            </div>
          ) : (
            <>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </p>
              
              {trend && (
                <div className="flex items-center mt-3">
                  <span className={`text-sm font-semibold ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
                    {trend}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">from last month</span>
                </div>
              )}
            </>
          )}
        </div>
        
        <div className={`p-2.5 rounded-lg ${currentColor.light}`}>
          <Icon className={`w-5 h-5 ${currentColor.text}`} />
        </div>
      </div>
      
      {loading ? (
        <div className="mt-4 h-1 bg-gray-200 rounded-full animate-pulse"></div>
      ) : (
        <div className="mt-5 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600 font-medium">View details</span>
            <span className={`${currentColor.text}`}>→</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatCard;