import React from 'react';
import { DateRangeFilter } from '../types';
import { Calendar } from 'lucide-react';

interface DateFilterProps {
  filter: DateRangeFilter;
  onChange: (filter: DateRangeFilter) => void;
}

const DateFilter: React.FC<DateFilterProps> = ({ filter, onChange }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="h-5 w-5 text-gray-600" />
        <h3 className="font-medium text-gray-900">Date Range</h3>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {[
          { value: 'daily', label: 'Today' },
          { value: 'weekly', label: 'This Week' },
          { value: 'monthly', label: 'This Month' },
          { value: 'custom', label: 'Custom' }
        ].map(option => (
          <button
            key={option.value}
            onClick={() => onChange({ ...filter, type: option.value as any })}
            className={`px-2 sm:px-3 py-2 text-xs sm:text-sm rounded-md transition-colors ${
              filter.type === option.value
                ? 'bg-[#806351] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {filter.type === 'custom' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={filter.startDate || ''}
              onChange={(e) => onChange({ ...filter, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#806351] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={filter.endDate || ''}
              onChange={(e) => onChange({ ...filter, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#806351] focus:border-transparent"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DateFilter;