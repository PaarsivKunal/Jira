import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { createObjectCsvWriter } from 'csv-writer';

/**
 * Export report data to CSV format
 */
export const exportToCSV = async (data, filename, headers) => {
  const csvWriter = createObjectCsvWriter({
    path: filename,
    header: headers || Object.keys(data[0] || {}).map(key => ({ id: key, title: key })),
  });

  await csvWriter.writeRecords(data);
  return filename;
};

/**
 * Export report data to Excel format
 */
export const exportToExcel = (data, filename, sheetName = 'Report') => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename);
  return filename;
};

/**
 * Export report data to PDF format
 */
export const exportToPDF = (data, filename, title, chartImage = null) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  
  // Add chart image if provided
  if (chartImage) {
    doc.addImage(chartImage, 'PNG', 14, 40, 180, 100);
  }
  
  // Add table
  if (data && data.length > 0) {
    const tableData = data.map(row => Object.values(row));
    const tableHeaders = Object.keys(data[0]);
    
    autoTable(doc, {
      head: [tableHeaders],
      body: tableData,
      startY: chartImage ? 150 : 40,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [59, 130, 246] },
    });
  }
  
  doc.save(filename);
  return filename;
};

/**
 * Convert report data to CSV format (for download)
 */
export const convertToCSV = (data, headers = null) => {
  if (!data || data.length === 0) return '';
  
  const csvHeaders = headers || Object.keys(data[0]);
  const csvRows = [csvHeaders.join(',')];
  
  data.forEach(row => {
    const values = csvHeaders.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value).replace(/"/g, '""');
    });
    csvRows.push(values.map(v => `"${v}"`).join(','));
  });
  
  return csvRows.join('\n');
};

/**
 * Convert report data to JSON format
 */
export const convertToJSON = (data) => {
  return JSON.stringify(data, null, 2);
};

