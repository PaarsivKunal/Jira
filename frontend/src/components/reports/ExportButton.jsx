import { useState } from 'react';
import { Download, FileDown, FileSpreadsheet, FileText, FileJson } from 'lucide-react';
import { exportReport } from '../../services/api';
import toast from 'react-hot-toast';

const ExportButton = ({ reportId, reportName }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleExport = async (format) => {
    try {
      setIsExporting(true);
      setShowMenu(false);
      
      const response = await exportReport(reportId, format);
      
      // Create download link
      const blob = format === 'excel' 
        ? new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        : format === 'json'
        ? new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' })
        : new Blob([response.data], { type: 'text/csv' });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${reportName?.replace(/[^a-z0-9]/gi, '_') || 'report'}_${timestamp}.${format === 'excel' ? 'xlsx' : format}`;
      link.download = filename;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Export error:', error);
      }
      toast.error('Failed to export report');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={isExporting}
        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center space-x-2 disabled:opacity-50"
      >
        <Download size={16} />
        <span>{isExporting ? 'Exporting...' : 'Export'}</span>
      </button>
      
      {showMenu && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <button
              onClick={() => handleExport('csv')}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2 rounded-t-lg"
            >
              <FileText size={16} className="text-gray-600" />
              <span>Export as CSV</span>
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2"
            >
              <FileSpreadsheet size={16} className="text-gray-600" />
              <span>Export as Excel</span>
            </button>
            <button
              onClick={() => handleExport('json')}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2 rounded-b-lg"
            >
              <FileJson size={16} className="text-gray-600" />
              <span>Export as JSON</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ExportButton;

