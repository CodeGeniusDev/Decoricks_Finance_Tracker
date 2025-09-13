import React, { useRef } from 'react';
import { AppData } from '../types';
import { exportToJSON, exportToCSV } from '../utils/storage';
import { getUsageStats } from '../utils/liveTracking';
import { getAutoDownloadSettings } from '../utils/autoDownload';
import { Download, Upload, FileText, Database } from 'lucide-react';

interface ExportImportProps {
  data: AppData;
  onImport: (data: AppData) => void;
  onExport: (type: 'json' | 'csv') => void;
}

const ExportImport: React.FC<ExportImportProps> = ({ data, onImport, onExport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const usageStats = getUsageStats();
  const autoDownloadSettings = getAutoDownloadSettings();

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedData = JSON.parse(content);
        
        // Validate the imported data structure
        if (importedData.transactions && importedData.categories) {
          onImport(importedData);
        } else {
          alert('Invalid file format. Please select a valid backup file.');
        }
      } catch (error) {
        alert('Error importing data. Please check the file format.');
      }
    };
    reader.readAsText(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleExportJSON = () => {
    exportToJSON(data);
    onExport('json');
  };
  
  const handleExportCSV = () => {
    exportToCSV(data.transactions);
    onExport('csv');
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Backup & Restore</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Data
          </h3>
          <div className="space-y-3">
            <button
              onClick={handleExportJSON}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Database className="h-4 w-4" />
              Export as JSON (Complete Backup)
            </button>
            <button
              onClick={handleExportCSV}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <FileText className="h-4 w-4" />
              Export Transactions as CSV
            </button>
          </div>
          <p className="mt-3 text-sm text-gray-600">
            JSON format includes all data (transactions + categories). CSV includes only transactions for spreadsheet analysis.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Data
          </h3>
          <div className="space-y-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImport}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#806351] text-white rounded-lg hover:bg-[#6b5444] transition-colors"
            >
              <Upload className="h-4 w-4" />
              Import JSON Backup
            </button>
          </div>
          <p className="mt-3 text-sm text-gray-600">
            Import a previously exported JSON backup file to restore your data.
          </p>
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-800">
              <strong>Warning:</strong> Importing will replace all existing data. Make sure to export your current data first!
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Current Data Summary</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-lg font-semibold text-gray-900">{data.transactions.length}</p>
            <p className="text-xs text-gray-500">Total Transactions</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-lg font-semibold text-gray-900">
              {data.transactions.filter(t => t.type === 'income').length}
            </p>
            <p className="text-xs text-gray-500">Income Entries</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-lg font-semibold text-gray-900">
              {data.transactions.filter(t => t.type === 'expense').length}
            </p>
            <p className="text-xs text-gray-500">Expense Entries</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-lg font-semibold text-gray-900">{data.categories.length}</p>
            <p className="text-xs text-gray-500">Categories</p>
          </div>
          
          {/* Live Tracking Stats */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Live Usage Statistics</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-lg font-semibold text-blue-900">{usageStats.totalSessions}</p>
                <p className="text-xs text-blue-600">Total Sessions</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-lg font-semibold text-green-900">{usageStats.totalTransactions}</p>
                <p className="text-xs text-green-600">Total Activities</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <p className="text-lg font-semibold text-purple-900">{usageStats.averageDaily}</p>
                <p className="text-xs text-purple-600">Daily Average</p>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <p className="text-lg font-semibold text-orange-900">
                  {autoDownloadSettings.enabled ? 'ON' : 'OFF'}
                </p>
                <p className="text-xs text-orange-600">Auto-Backup</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportImport;