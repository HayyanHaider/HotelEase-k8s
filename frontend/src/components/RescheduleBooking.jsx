import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Dashboard.css';

const RescheduleBooking = () => {
 const { bookingId } = useParams();
  const navigate = useNavigate();
 const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
 const [submitting, setSubmitting] = useState(false);
  const [checkIn, setCheckIn] = useState('');
 const [checkOut, setCheckOut] = useState('');

  useEffect(() => {
   fetchBookingDetails();
  }, [bookingId]);

 const fetchBookingDetails = async () => {
   try {
     setLoading(true);
    const token = sessionStorage.getItem('token');
     const response = await axios.get(`/api/bookings/${bookingId}`, {
      headers: { Authorization: `Bearer ${token}` }
     });

     if (response.data.success) {
      const bookingData = response.data.booking;
       setBooking(bookingData);
      if (bookingData.checkIn) {
       const checkInDate = new Date(bookingData.checkIn);
        setCheckIn(checkInDate.toISOString().split('T')[0]);
      }
      if (bookingData.checkOut) {
       const checkOutDate = new Date(bookingData.checkOut);
        setCheckOut(checkOutDate.toISOString().split('T')[0]);
      }
     }
   } catch (error) {
    console.error('Error fetching booking details:', error);
     toast.error('Error loading booking details');
    navigate('/booking-history');
   } finally {
    setLoading(false);
   }
  };

  const getTodayDate = () => {
   const today = new Date();
    today.setHours(0, 0, 0, 0);
   return today;
  };

 const handleSubmit = async (e) => {
   e.preventDefault();
    
   if (!checkIn || !checkOut) {
     toast.warning('Please select both check-in and check-out dates');
      return;
    }

   const checkInDate = new Date(checkIn);
    checkInDate.setHours(0, 0, 0, 0);
   const checkOutDate = new Date(checkOut);
    checkOutDate.setHours(0, 0, 0, 0);
   const today = getTodayDate();
    
   if (checkInDate >= checkOutDate) {
     toast.warning('Check-out date must be after check-in date');
      return;
    }
    
   if (checkInDate < today) {
     toast.warning('Check-in date cannot be in the past');
      return;
    }

    try {
     setSubmitting(true);
    const token = sessionStorage.getItem('token');
     
     const response = await axios.put(
      `/api/bookings/${bookingId}/reschedule`,
       { checkInDate: checkIn, checkOutDate: checkOut },
     {
       headers: { Authorization: `Bearer ${token}` }
      }
    );

     if (response.data.success) {
      toast.success('Booking rescheduled successfully!');
       navigate('/booking-history');
     }
   } catch (error) {
    console.error('Error rescheduling booking:', error);
     toast.error(error.response?.data?.message || 'Error rescheduling booking');
   } finally {
    setSubmitting(false);
   }
  };

  if (loading) {
   return <div className="dashboard-container text-center">Loading...</div>;
  }

  if (!booking) {
   return <div className="dashboard-container text-center">Booking not found</div>;
  }

 return (
   <div className="dashboard-container">
    <div className="container">
     <div className="row justify-content-center">
      <div className="col-md-8">
       <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Reschedule Booking</h1>
         <button className="btn btn-secondary" onClick={() => navigate('/booking-history')}>
          ← Back to Bookings
         </button>
       </div>

       <div className="card mb-4">
        <div className="card-body">
         <h5>Current Booking Details</h5>
          <p><strong>Hotel:</strong> {booking.hotelId?.name || 'Hotel'}</p>
         <p><strong>Current Check-in:</strong> {new Date(booking.checkIn).toLocaleDateString()}</p>
          <p><strong>Current Check-out:</strong> {new Date(booking.checkOut).toLocaleDateString()}</p>
         <p><strong>Nights:</strong> {booking.nights}</p>
          <p><strong>Guests:</strong> {booking.guests}</p>
         <p><strong>Status:</strong> {booking.status}</p>
        </div>
       </div>

       <form onSubmit={handleSubmit}>
        <div className="card">
         <div className="card-body">
          <h5 className="mb-4">Select New Dates</h5>
           
          <div className="mb-3">
           <label className="form-label">New Check-in Date</label>
            <input
             type="date"
              className="form-control"
           value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
           min={new Date().toISOString().split('T')[0]}
            required
          />
         </div>

         <div className="mb-3">
          <label className="form-label">New Check-out Date</label>
           <input
            type="date"
             className="form-control"
          value={checkOut}
           onChange={(e) => setCheckOut(e.target.value)}
          min={(checkIn && checkIn !== '') ? checkIn : new Date().toISOString().split('T')[0]}
           required
         />
        </div>

        {checkIn && checkOut && (() => {
         const checkInDate = new Date(checkIn);
          const checkOutDate = new Date(checkOut);
         checkInDate.setHours(0, 0, 0, 0);
          checkOutDate.setHours(0, 0, 0, 0);
         const daysDiff = (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24);
          const nights = Math.max(1, Math.floor(daysDiff));
         return (
          <div className="alert alert-info">
           <p><strong>New Stay Duration:</strong> {nights} {nights === 1 ? 'night' : 'nights'}</p>
            <p className="mb-0"><strong>Note:</strong> Price will be recalculated based on the new dates. Any applicable discounts will be preserved.</p>
          </div>
         );
        })()}

        <div className="d-flex gap-2 mt-4">
         <button
          type="button"
           className="btn btn-secondary"
         onClick={() => navigate('/booking-history')}
        >
         Cancel
        </button>
        <button
         type="submit"
          className="btn btn-primary"
        disabled={submitting}
       >
        {submitting ? 'Rescheduling...' : 'Reschedule Booking'}
       </button>
      </div>
     </div>
    </div>
   </form>
  </div>
 </div>
</div>
</div>
);
};

export default RescheduleBooking;

