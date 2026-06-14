import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Dashboard.css';

const EarningsDashboard = () => {
 const navigate = useNavigate();
  const [earnings, setEarnings] = useState(null);
 const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
   fetchEarnings();
  }, [period]);

 const fetchEarnings = async () => {
   try {
     setLoading(true);
    const token = sessionStorage.getItem('token');
     const response = await axios.get(`/api/earnings/dashboard?period=${period}`, {
      headers: { Authorization: `Bearer ${token}` }
     });

     if (response.data.success) {
      setEarnings(response.data.earnings);
     } else {
      toast.error('Failed to load earnings data');
     }
   } catch (error) {
    console.error('Error fetching earnings:', error);
     toast.error(error.response?.data?.message || 'Error loading earnings data');
   } finally {
    setLoading(false);
   }
  };

  if (loading) {
   return <div className="dashboard-container text-center">Loading...</div>;
  }

  if (!earnings) {
   return <div className="dashboard-container text-center">No earnings data found</div>;
  }

 return (
   <div className="dashboard-container">
    <div className="dashboard-header">
     <div className="d-flex justify-content-between align-items-center mb-3">
      <div>
       <h1>Earnings Dashboard</h1>
        <p>Track your income and revenue</p>
      </div>
      <button 
       className="btn btn-outline-secondary"
        onClick={() => navigate('/hotel-dashboard')}
      style={{ height: 'fit-content' }}
     >
      ← Go Back
     </button>
     </div>
    </div>

    <div className="container">
     <div className="mb-3">
      <label className="form-label">Select Period</label>
       <select
        className="form-select"
         value={period}
      onChange={(e) => setPeriod(e.target.value)}
     >
      <option value="today">Today</option>
       <option value="week">This Week</option>
      <option value="month">This Month</option>
       <option value="year">This Year</option>
     </select>
    </div>

    <div className="row g-4 mb-4">
     <div className="col-md-3">
      <div className="card text-center">
       <div className="card-body">
        <h6 className="text-muted">Total Earnings</h6>
         <h3 className="text-success">PKR {earnings.totalEarnings}</h3>
       </div>
      </div>
     </div>
     <div className="col-md-3">
      <div className="card text-center">
       <div className="card-body">
        <h6 className="text-muted">Period Earnings</h6>
         <h3 className="text-primary">PKR {earnings.periodEarnings}</h3>
       </div>
      </div>
     </div>
     <div className="col-md-3">
      <div className="card text-center">
       <div className="card-body">
        <h6 className="text-muted">Total Bookings</h6>
         <h3>{earnings.totalBookings}</h3>
       </div>
      </div>
     </div>
     <div className="col-md-3">
      <div className="card text-center">
       <div className="card-body">
        <h6 className="text-muted">Avg Booking Value</h6>
         <h3>PKR {earnings.averageBookingValue}</h3>
       </div>
      </div>
     </div>
    </div>

    <div className="card">
     <div className="card-body">
      <h3>Earnings by Hotel</h3>
       {earnings.hotels && earnings.hotels.length > 0 ? (
        <div className="table-responsive">
         <table className="table">
          <thead>
           <tr>
            <th>Hotel Name</th>
             <th>Total Bookings</th>
            <th>Total Earnings</th>
             <th>Period Earnings</th>
            <th>Avg Booking Value</th>
           </tr>
          </thead>
          <tbody>
           {earnings.hotels.map((hotel) => (
            <tr key={hotel.hotelId}>
             <td>{hotel.hotelName}</td>
              <td>{hotel.totalBookings}</td>
             <td>PKR {hotel.totalEarnings}</td>
              <td>PKR {hotel.periodEarnings}</td>
             <td>PKR {hotel.averageBookingValue}</td>
            </tr>
           ))}
          </tbody>
         </table>
        </div>
       ) : (
        <p>No hotel earnings data available</p>
       )}
     </div>
    </div>
   </div>
  </div>
 );
};

export default EarningsDashboard;

