import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import './ReportsSection.css';

const ReportsSection = () => {
 const [reportType, setReportType] = useState('bookings');
  const [startDate, setStartDate] = useState('');
 const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState(null);
 const [loading, setLoading] = useState(false);
  const API_URL = '/api';

 const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b'];

  useEffect(() => {
   const end = new Date();
    const start = new Date();
   start.setDate(start.getDate() - 30);
    
   setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  }, []);

 const fetchReport = async () => {
   if (!startDate || !endDate) {
     toast.error('Please select both start and end dates');
      return;
    }

    setLoading(true);
   try {
     const token = sessionStorage.getItem('token');
      const url = `${API_URL}/admin/reports?type=${reportType}&startDate=${startDate}&endDate=${endDate}`;
     console.log('Fetching report from:', url);
    
    const response = await fetch(url, {
     headers: { 'Authorization': `Bearer ${token}` }
    });
    
   console.log('Response status:', response.status);
    const data = await response.json();
   console.log('Report data received:', data);
    
   if (data.success) {
    setReportData(data.report);
     toast.success('Report generated successfully!');
    } else {
     toast.error(data.message || 'Failed to generate report');
      console.error('Report error:', data);
    }
  } catch (error) {
   console.error('Error fetching report:', error);
    toast.error('Error generating report: ' + error.message);
  } finally {
   setLoading(false);
  }
 };

 const generatePDF = () => {
   if (!reportData) {
     toast.error('Please generate a report first');
      return;
    }

    const doc = new jsPDF();
   const pageWidth = doc.internal.pageSize.getWidth();
    
   doc.setFillColor(102, 126, 234);
    doc.rect(0, 0, pageWidth, 40, 'F');
   
   doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
   doc.setFont('helvetica', 'bold');
    doc.text('BookSmart Admin Report', 14, 20);
   
   doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
   doc.text(`Report Type: ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}`, 14, 30);
    doc.text(`Period: ${format(new Date(startDate), 'MMM dd, yyyy')} - ${format(new Date(endDate), 'MMM dd, yyyy')}`, 14, 36);
   
   doc.setTextColor(0, 0, 0);
    let yPosition = 50;

   switch (reportType) {
    case 'bookings':
     generateBookingsReport(doc, yPosition);
      break;
    case 'revenue':
     generateRevenueReport(doc, yPosition);
      break;
    case 'hotels':
     generateHotelsReport(doc, yPosition);
      break;
    case 'users':
     generateUsersReport(doc, yPosition);
      break;
    case 'performance':
     generatePerformanceReport(doc, yPosition);
      break;
   }

    // Add footer
   const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
     doc.setPage(i);
      doc.setFontSize(10);
     doc.setTextColor(128, 128, 128);
      doc.text(
      `Generated on ${format(new Date(), 'MMM dd, yyyy HH:mm')} | Page ${i} of ${pageCount}`,
      14,
       doc.internal.pageSize.getHeight() - 10
     );
    }

    // Save PDF
   const fileName = `${reportType}_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    doc.save(fileName);
   toast.success(`PDF report downloaded: ${fileName}`);
  };

 const generateBookingsReport = (doc, yPos) => {
   doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
   doc.text('Booking Statistics', 14, yPos);
    yPos += 10;

    // Summary
   doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
   doc.text(`Total Bookings: ${reportData.totalBookings}`, 14, yPos);
    yPos += 10;

    // Table
   if (reportData.bookingsByStatus && reportData.bookingsByStatus.length > 0) {
     const tableData = reportData.bookingsByStatus.map(item => [
      item._id || 'N/A',
       item.count.toString()
     ]);

     autoTable(doc, {
      startY: yPos,
       head: [['Status', 'Count']],
      body: tableData,
       theme: 'striped',
     headStyles: { fillColor: [102, 126, 234], fontSize: 11, fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 5 },
     alternateRowStyles: { fillColor: [245, 247, 250] }
    });
   }
  };

 const generateRevenueReport = (doc, yPos) => {
   doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
   doc.text('Revenue Analysis', 14, yPos);
    yPos += 10;

    // Summary
   doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
   doc.text(`Total Revenue: PKR ${(reportData.totalRevenue || 0).toLocaleString()}`, 14, yPos);
    yPos += 7;
   doc.setFont('helvetica', 'bold');
    doc.text(`Platform Revenue (10%): PKR ${(reportData.platformRevenue || 0).toLocaleString()}`, 14, yPos);
   yPos += 15;

    // Monthly breakdown
   if (reportData.byMonth && reportData.byMonth.length > 0) {
     const tableData = reportData.byMonth.map(item => [
      `${item._id.month}/${item._id.year}`,
       item.count.toString(),
     `PKR ${item.revenue.toFixed(2)}`,
      `PKR ${item.platformRevenue.toFixed(2)}`
    ]);

     autoTable(doc, {
      startY: yPos,
       head: [['Month/Year', 'Transactions', 'Total Revenue', 'Platform (10%)']],
     body: tableData,
      theme: 'striped',
       headStyles: { fillColor: [102, 126, 234], fontSize: 11, fontStyle: 'bold' },
     styles: { fontSize: 10, cellPadding: 5 },
      alternateRowStyles: { fillColor: [245, 247, 250] }
    });
   }
  };

 const generateHotelsReport = (doc, yPos) => {
   doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
   doc.text('Hotel Statistics', 14, yPos);
    yPos += 10;

   doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
   doc.text(`Total Hotels: ${reportData.totalHotels}`, 14, yPos);
    yPos += 15;

    // Top cities
   if (reportData.topCities && reportData.topCities.length > 0) {
     doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
     doc.text('Top Cities by Hotel Count', 14, yPos);
      yPos += 8;
    
    const tableData = reportData.topCities.map(item => [
     item._id || 'Unknown',
      item.count.toString(),
     item.avgRating.toFixed(2)
    ]);

     autoTable(doc, {
      startY: yPos,
       head: [['City', 'Hotel Count', 'Avg Rating']],
     body: tableData,
      theme: 'striped',
       headStyles: { fillColor: [102, 126, 234], fontSize: 11, fontStyle: 'bold' },
     styles: { fontSize: 10, cellPadding: 5 },
      alternateRowStyles: { fillColor: [245, 247, 250] }
    });
   }
  };

 const generateUsersReport = (doc, yPos) => {
   doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
   doc.text('Customer Analytics', 14, yPos);
    yPos += 10;

    // Summary statistics
   doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
   doc.text(`Total Customers: ${reportData.totalCustomers || 0}`, 14, yPos);
    yPos += 7;
   doc.text(`Total Bookings: ${reportData.totalBookings || 0}`, 14, yPos);
    yPos += 7;
   doc.text(`Avg Customers/Month: ${reportData.avgCustomersPerMonth || 0}`, 14, yPos);
    yPos += 7;
   doc.text(`Avg Bookings/Customer: ${reportData.avgBookingsPerCustomer || 0}`, 14, yPos);
    yPos += 15;

    // Monthly customer registration trend
   if (reportData.customersByMonth && reportData.customersByMonth.length > 0) {
     doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
     doc.text('Customer Registration Trend', 14, yPos);
      yPos += 8;

     const tableData = reportData.customersByMonth.map(item => [
      `${item._id.month}/${item._id.year}`,
       item.count.toString()
     ]);

     autoTable(doc, {
      startY: yPos,
       head: [['Month/Year', 'New Customers']],
     body: tableData,
      theme: 'striped',
       headStyles: { fillColor: [102, 126, 234], fontSize: 11, fontStyle: 'bold' },
     styles: { fontSize: 10, cellPadding: 5 },
      alternateRowStyles: { fillColor: [245, 247, 250] }
    });
   }
  };

 const generatePerformanceReport = (doc, yPos) => {
   doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
   doc.text('Performance Analysis', 14, yPos);
    yPos += 10;

    // Top performing hotels
   doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
   doc.text('Top Performing Hotels', 14, yPos);
    yPos += 8;

   if (reportData.topPerformingHotels && reportData.topPerformingHotels.length > 0) {
     const tableData = reportData.topPerformingHotels.slice(0, 10).map(item => [
      item.hotel?.name || 'Unknown',
       item.bookingCount.toString(),
     `PKR ${item.totalRevenue.toFixed(2)}`,
      `PKR ${item.platformRevenue.toFixed(2)}`
    ]);

     autoTable(doc, {
      startY: yPos,
       head: [['Hotel Name', 'Bookings', 'Total Revenue', 'Platform (10%)']],
     body: tableData,
      theme: 'striped',
       headStyles: { fillColor: [102, 126, 234], fontSize: 11, fontStyle: 'bold' },
     styles: { fontSize: 9, cellPadding: 4 },
      alternateRowStyles: { fillColor: [245, 247, 250] }
    });

     yPos = doc.lastAutoTable.finalY + 15;
    }

    // Worst rated hotels
   if (reportData.worstRatedHotels && reportData.worstRatedHotels.length > 0) {
     doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
     doc.text('Hotels Needing Attention (Lowest Rated)', 14, yPos);
      yPos += 8;

     const tableData = reportData.worstRatedHotels.slice(0, 10).map(item => [
      item.name || 'Unknown',
       item.rating.toFixed(1),
     item.totalReviews.toString(),
      `${item.location?.city || 'N/A'}, ${item.location?.state || 'N/A'}`
    ]);

     autoTable(doc, {
      startY: yPos,
       head: [['Hotel Name', 'Rating', 'Reviews', 'Location']],
     body: tableData,
      theme: 'striped',
       headStyles: { fillColor: [239, 68, 68], fontSize: 11, fontStyle: 'bold' },
     styles: { fontSize: 10, cellPadding: 5 },
      alternateRowStyles: { fillColor: [254, 242, 242] }
    });
   }
  };

 const renderCharts = () => {
   if (!reportData) {
     console.log('No report data available for charts');
      return null;
    }

    console.log('Rendering charts for type:', reportType, 'with data:', reportData);

   switch (reportType) {
    case 'bookings':
     return renderBookingsCharts();
      case 'revenue':
     return renderRevenueCharts();
    case 'hotels':
     return renderHotelsCharts();
      case 'users':
     return renderUsersCharts();
    default:
     return null;
    }
  };

 const renderBookingsCharts = () => {
   console.log('Rendering bookings charts with data:', reportData);
    return (
   <div className="charts-container">
    <div className="chart-box">
     <h3>Bookings by Status</h3>
      {reportData?.bookingsByStatus && reportData.bookingsByStatus.length > 0 ? (
       <ResponsiveContainer width="100%" height={300}>
        <PieChart>
         <Pie
          data={reportData.bookingsByStatus}
           dataKey="count"
         nameKey="_id"
          cx="50%"
         cy="50%"
          outerRadius={100}
         label
        >
         {reportData.bookingsByStatus.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
         ))}
        </Pie>
         <Tooltip />
        <Legend />
       </PieChart>
      </ResponsiveContainer>
     ) : (
      <p className="no-data">No data available</p>
     )}
    </div>

     {/* Removed revenue chart from bookings report as requested */}
   </div>
 )};

 const renderRevenueCharts = () => {
   console.log('Rendering revenue charts with data:', reportData);
    return (
   <div className="charts-container">
    <div className="chart-box full-width">
     <h3>Revenue Trend</h3>
      {reportData?.byMonth && reportData.byMonth.length > 0 ? (
       <ResponsiveContainer width="100%" height={350}>
        <LineChart data={reportData.byMonth}>
         <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
         dataKey={(item) => `${item._id.month}/${item._id.year}`}
          label={{ value: 'Month/Year', position: 'insideBottom', offset: -5 }}
        />
         <YAxis label={{ value: 'Revenue (PKR)', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
         <Legend />
          <Line type="monotone" dataKey="revenue" stroke="#667eea" strokeWidth={3} name="Total Revenue (PKR)" />
         <Line type="monotone" dataKey="platformRevenue" stroke="#43e97b" strokeWidth={3} name="Platform 10% (PKR)" />
          <Line type="monotone" dataKey="count" stroke="#764ba2" strokeWidth={2} name="Transactions" />
        </LineChart>
       </ResponsiveContainer>
     ) : (
      <p className="no-data">No data available</p>
     )}
    </div>
   </div>
 );
  };

 const renderHotelsCharts = () => {
   console.log('Rendering hotels charts with data:', reportData);
    return (
   <div className="charts-container">
    <div className="chart-box">
     <h3>Hotels by Status</h3>
      {reportData?.hotelsByStatus && reportData.hotelsByStatus.length > 0 ? (
       <ResponsiveContainer width="100%" height={300}>
        <PieChart>
         <Pie
          data={reportData.hotelsByStatus.map(item => ({
           name: `${item._id.isApproved ? 'Approved' : 'Not Approved'} ${item._id.isSuspended ? '(Suspended)' : ''}`,
            value: item.count
         }))}
          dataKey="value"
         nameKey="name"
          cx="50%"
         cy="50%"
          outerRadius={100}
         label
        >
         {reportData.hotelsByStatus.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
         ))}
        </Pie>
         <Tooltip />
        <Legend />
       </PieChart>
      </ResponsiveContainer>
     ) : (
      <p className="no-data">No data available</p>
     )}
    </div>

     <div className="chart-box">
     <h3>Top Cities by Hotel Count</h3>
      {reportData.topCities && reportData.topCities.length > 0 ? (
       <ResponsiveContainer width="100%" height={300}>
        <BarChart data={reportData.topCities.slice(0, 10)}>
         <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="_id" />
         <YAxis />
          <Tooltip />
         <Legend />
          <Bar dataKey="count" fill="#667eea" name="Hotel Count" />
        </BarChart>
       </ResponsiveContainer>
     ) : (
      <p className="no-data">No data available</p>
     )}
    </div>
   </div>
 );
  };

 const renderUsersCharts = () => (
   <div className="charts-container">
    <div className="chart-box full-width">
     <h3>Customer Registration Trend</h3>
      {reportData.customersByMonth && reportData.customersByMonth.length > 0 ? (
       <ResponsiveContainer width="100%" height={350}>
        <BarChart data={reportData.customersByMonth} barCategoryGap="60%" barGap={8}>
         <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
         dataKey={(item) => `${item._id.month}/${item._id.year}`}
          label={{ value: 'Month/Year', position: 'insideBottom', offset: -5 }}
        />
         <YAxis label={{ value: 'New Customers', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
         <Legend />
          <Bar dataKey="count" fill="#667eea" name="New Customers" barSize={28} maxBarSize={32} radius={[4,4,0,0]} />
        </BarChart>
       </ResponsiveContainer>
     ) : (
      <p className="no-data">No data available</p>
     )}
    </div>
   </div>
 );

 const renderPerformanceCharts = () => (
   <div className="charts-container">
    <div className="chart-box full-width">
     <h3>Top 10 Hotels by Revenue</h3>
      {reportData.topPerformingHotels && reportData.topPerformingHotels.length > 0 ? (
       <ResponsiveContainer width="100%" height={350}>
        <BarChart data={reportData.topPerformingHotels.slice(0, 10)}>
         <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="hotel.name" angle={-45} textAnchor="end" height={100} />
         <YAxis />
          <Tooltip />
         <Legend />
          <Bar dataKey="totalRevenue" fill="#667eea" name="Revenue (PKR)" />
         <Bar dataKey="bookingCount" fill="#764ba2" name="Bookings" />
        </BarChart>
       </ResponsiveContainer>
     ) : (
      <p className="no-data">No data available</p>
     )}
    </div>
   </div>
 );

 return (
   <div className="reports-section">
    <div className="reports-controls">
     <div className="control-group">
      <label>Report Type</label>
       <select 
      value={reportType} 
       onChange={(e) => setReportType(e.target.value)}
     className="report-select"
    >
     <option value="bookings">Bookings Report</option>
      <option value="revenue">Revenue Report</option>
     <option value="hotels">Hotels Report</option>
      <option value="users">Customers Report</option>
    </select>
   </div>

    <div className="control-group">
     <label>Start Date</label>
      <input
     type="date"
      value={startDate}
     onChange={(e) => setStartDate(e.target.value)}
      className="date-input"
    />
   </div>

    <div className="control-group">
     <label>End Date</label>
      <input
     type="date"
      value={endDate}
     onChange={(e) => setEndDate(e.target.value)}
      className="date-input"
    />
   </div>

    <div className="control-actions">
     <button 
      onClick={fetchReport} 
     disabled={loading}
      className="btn-generate"
    >
     {loading ? 'Generating...' : 'Generate Report'}
    </button>
     {reportData && (
      <button onClick={generatePDF} className="btn-download">
       Download PDF
      </button>
     )}
    </div>
   </div>

   {reportData && (
    <div className="reports-content">
     <div className="report-header">
      <h2>{reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report</h2>
       <p className="report-period">
      Period: {format(new Date(startDate), 'MMM dd, yyyy')} - {format(new Date(endDate), 'MMM dd, yyyy')}
     </p>
    </div>

     {renderCharts()}

     <div className="report-summary">
      <h3>Summary</h3>
       <div className="summary-grid">
      {reportType === 'bookings' && reportData.totalBookings !== undefined && (
       <>
        <div className="summary-item">
         <span className="summary-label">Total Bookings:</span>
          <span className="summary-value">{reportData.totalBookings}</span>
        </div>
         {/* Revenue details removed from bookings summary as requested */}
       </>
      )}
       {reportType === 'revenue' && reportData.totalRevenue !== undefined && (
       <>
        <div className="summary-item">
         <span className="summary-label">Total Revenue:</span>
          <span className="summary-value" style={{whiteSpace: 'nowrap'}}>PKR {reportData.totalRevenue?.toLocaleString() || '0'}</span>
        </div>
         <div className="summary-item">
          <span className="summary-label">Platform Revenue (10%):</span>
         <span className="summary-value" style={{whiteSpace: 'nowrap', color: '#43e97b', fontWeight: 'bold'}}>
          PKR {reportData.platformRevenue?.toLocaleString() || '0'}
         </span>
        </div>
       </>
      )}
       {reportType === 'hotels' && reportData.totalHotels !== undefined && (
       <>
        <div className="summary-item">
         <span className="summary-label">Total Hotels:</span>
          <span className="summary-value">{reportData.totalHotels}</span>
        </div>
         {/* Removed Total Revenue and Avg Bookings per Approved Hotel per Month from Hotels summary */}
       </>
      )}
       {reportType === 'users' && reportData.totalCustomers !== undefined && (
       <>
        <div className="summary-item">
         <span className="summary-label">Total Customers:</span>
          <span className="summary-value">{reportData.totalCustomers}</span>
        </div>
         <div className="summary-item">
          <span className="summary-label">Total Bookings:</span>
         <span className="summary-value">{reportData.totalBookings || 0}</span>
        </div>
         <div className="summary-item">
          <span className="summary-label">Avg Customers/Month:</span>
         <span className="summary-value" style={{color: '#667eea', fontWeight: 'bold'}}>
          {reportData.avgCustomersPerMonth || 0}
         </span>
        </div>
         <div className="summary-item">
          <span className="summary-label">Avg Bookings/Customer:</span>
         <span className="summary-value" style={{color: '#43e97b', fontWeight: 'bold'}}>
          {reportData.avgBookingsPerCustomer || 0}
         </span>
        </div>
       </>
      )}
     </div>
    </div>
   </div>
  )}

   {!reportData && !loading && (
    <div className="no-report">
     <div className="no-report-icon">📊</div>
      <h3>No Report Generated</h3>
     <p>Select a report type and date range, then click "Generate Report" to view analytics</p>
    </div>
   )}
  </div>
 );
};

export default ReportsSection;

