import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Dashboard.css';

const OwnerBookingManagement = () => {
 const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
 const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
   fetchBookings();
  }, []);

 const fetchBookings = async () => {
   try {
     setLoading(true);
    const token = sessionStorage.getItem('token');
    
    const response = await axios.get('/api/owner/bookings', {
     headers: { Authorization: `Bearer ${token}` }
    });

    if (response.data.success) {
     setBookings(response.data.bookings || []);
    }
   } catch (error) {
    console.error('Error fetching bookings:', error);
   } finally {
    setLoading(false);
   }
  };

  const handleConfirm = async (bookingId) => {
   try {
     const token = sessionStorage.getItem('token');
      await axios.put(
      `/api/owner/bookings/${bookingId}/confirm`,
       {},
     {
       headers: { Authorization: `Bearer ${token}` }
      }
    );
     toast.success('Booking confirmed!');
    fetchBookings();
   } catch (error) {
    console.error('Error confirming booking:', error);
     toast.error(error.response?.data?.message || 'Error confirming booking');
   }
  };

 const handleReject = async (bookingId) => {
   if (!window.confirm('Are you sure you want to reject this booking?')) {
     return;
    }

    try {
     const token = sessionStorage.getItem('token');
      await axios.put(
      `/api/owner/bookings/${bookingId}/reject`,
       {},
     {
       headers: { Authorization: `Bearer ${token}` }
      }
    );
     toast.success('Booking rejected!');
    fetchBookings();
   } catch (error) {
    console.error('Error rejecting booking:', error);
     toast.error(error.response?.data?.message || 'Error rejecting booking');
   }
  };

  const handleCheckIn = async (bookingId) => {
   try {
     const token = sessionStorage.getItem('token');
      await axios.put(
      `/api/owner/bookings/${bookingId}/check-in`,
       {},
     {
       headers: { Authorization: `Bearer ${token}` }
      }
    );
     toast.success('Guest checked in!');
    fetchBookings();
   } catch (error) {
    console.error('Error checking in:', error);
     toast.error(error.response?.data?.message || 'Error checking in');
   }
  };

 const handleCheckOut = async (bookingId) => {
   try {
     const token = sessionStorage.getItem('token');
      await axios.put(
      `/api/owner/bookings/${bookingId}/check-out`,
       {},
     {
       headers: { Authorization: `Bearer ${token}` }
      }
    );
     toast.success('Guest checked out!');
    fetchBookings();
   } catch (error) {
    console.error('Error checking out:', error);
     toast.error(error.response?.data?.message || 'Error checking out');
   }
  };

 const filteredBookings = filter === 'all' 
   ? bookings 
    : bookings.filter(b => b.status === filter);

  if (loading) {
   return <div className="dashboard-container text-center">Loading...</div>;
  }

 return (
   <div className="dashboard-container">
    <div className="dashboard-header">
     <div className="d-flex justify-content-between align-items-center mb-3">
      <div>
       <h1>Booking Management</h1>
        <p>Manage your hotel bookings</p>
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
      <label className="form-label">Filter by Status</label>
       <select
        className="form-select"
         value={filter}
      onChange={(e) => setFilter(e.target.value)}
     >
      <option value="all">All Bookings</option>
       <option value="pending">Pending</option>
      <option value="confirmed">Confirmed</option>
       <option value="checked-in">Checked In</option>
      <option value="checked-out">Checked Out</option>
       <option value="completed">Completed</option>
      <option value="cancelled">Cancelled</option>
     </select>
    </div>

    {filteredBookings.length === 0 ? (
     <div className="text-center">
      <p>No bookings found</p>
     </div>
    ) : (
     <div className="row g-4">
      {filteredBookings.map((booking) => (
       <div key={booking._id || booking.id} className="col-12">
        <div className="card">
         <div className="card-body">
          <div className="d-flex justify-content-between align-items-start owner-booking-row">
           <div className="owner-booking-details">
            <h5 className="owner-booking-title">Booking #{booking._id || booking.id}</h5>
             <p><strong>Hotel:</strong> {booking.hotelId?.name || booking.hotel?.name || 'N/A'}</p>
            <p><strong>Check-in:</strong> {new Date(booking.checkIn).toLocaleDateString()}</p>
             <p><strong>Check-out:</strong> {new Date(booking.checkOut).toLocaleDateString()}</p>
            <p><strong>Nights:</strong> {booking.nights}</p>
             <p><strong>Total:</strong> PKR {booking.priceSnapshot?.totalPrice || booking.totalPrice || 0}</p>
            <p>
             <strong>Status:</strong> <span className={`badge bg-${getStatusColor(booking.status)}`} style={{ textTransform: 'uppercase' }}>
              {booking.status === 'cancelled' ? 'CANCELLED' : booking.status}
             </span>
            </p>
            {booking.status === 'cancelled' && booking.cancelledAt && (
             <p className="text-muted small">
              <strong>Cancelled on:</strong> {new Date(booking.cancelledAt).toLocaleDateString()}
             </p>
            )}
           </div>
           <div className="d-flex flex-column gap-2 owner-booking-actions">
            {booking.status === 'pending' && (
             <>
              <button
               className="btn btn-success btn-sm"
                onClick={() => handleConfirm(booking._id || booking.id)}
            >
             Confirm
            </button>
            <button
             className="btn btn-danger btn-sm"
              onClick={() => handleReject(booking._id || booking.id)}
           >
          Reject
         </button>
        </>
       )}
       {booking.status === 'confirmed' && (
        <button
         className="btn btn-primary btn-sm"
          onClick={() => handleCheckIn(booking._id || booking.id)}
       >
      Check In
     </button>
    )}
    {booking.status === 'checked-in' && (
     <button
      className="btn btn-warning btn-sm"
       onClick={() => handleCheckOut(booking._id || booking.id)}
    >
   Check Out
  </button>
 )}
 {booking.status === 'cancelled' && (
  <div className="text-muted small text-center" style={{ padding: '8px', fontStyle: 'italic' }}>
   This booking was cancelled
  </div>
 )}
</div>
</div>
</div>
</div>
</div>
))}
</div>
)}
</div>
</div>
);
};

const getStatusColor = (status) => {
 switch (status) {
  case 'confirmed':
   return 'success';
    case 'pending':
   return 'warning';
  case 'cancelled':
   return 'danger';
    case 'checked-in':
   return 'info';
  case 'checked-out':
   return 'primary';
    case 'completed':
   return 'secondary';
  default:
   return 'secondary';
 }
};

export default OwnerBookingManagement;

