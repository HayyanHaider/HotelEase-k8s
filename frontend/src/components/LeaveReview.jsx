import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Dashboard.css';

const LeaveReview = () => {
 const { bookingId } = useParams();
  const navigate = useNavigate();
 const [booking, setBooking] = useState(null);
  const [rating, setRating] = useState(5);
 const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
 const [submitting, setSubmitting] = useState(false);

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
      setBooking(response.data.booking);
     }
   } catch (error) {
    console.error('Error fetching booking details:', error);
   } finally {
     setLoading(false);
   }
  };

  const handleSubmit = async (e) => {
   e.preventDefault();

    if (!rating || rating < 1 || rating > 5) {
     toast.warning('Please select a rating between 1 and 5');
      return;
    }

   try {
     setSubmitting(true);
    const token = sessionStorage.getItem('token');

     const response = await axios.post(
      '/api/reviews',
       {
        bookingId,
       rating,
        comment
       },
      {
        headers: { Authorization: `Bearer ${token}` }
       }
     );

     if (response.data.success) {
      toast.success('Review submitted successfully!');
       navigate('/booking-history');
     }
   } catch (error) {
    console.error('Error submitting review:', error);
     toast.error(error.response?.data?.message || 'Error submitting review');
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
      <div className="col-md-6">
       <h1>Leave a Review</h1>
        <div className="card mb-4">
         <div className="card-body">
          <h5>{booking.hotelId?.name || booking.hotel?.name || 'Hotel'}</h5>
           <p>Check-in: {new Date(booking.checkIn).toLocaleDateString()}</p>
          <p>Check-out: {new Date(booking.checkOut).toLocaleDateString()}</p>
         </div>
        </div>

        <form onSubmit={handleSubmit}>
         <div className="mb-3">
          <label className="form-label">Rating</label>
           <select
            className="form-select"
             value={rating}
           onChange={(e) => setRating(Number(e.target.value))}
            required
          >
           <option value="5">5 - Excellent</option>
            <option value="4">4 - Very Good</option>
           <option value="3">3 - Good</option>
            <option value="2">2 - Fair</option>
           <option value="1">1 - Poor</option>
          </select>
         </div>

         <div className="mb-3">
          <label className="form-label">Comment</label>
           <textarea
            className="form-control"
             rows="5"
           value={comment}
            onChange={(e) => setComment(e.target.value)}
           placeholder="Share your experience..."
          />
         </div>

         <div className="d-flex gap-2">
          <button
           type="button"
            className="btn btn-secondary"
          onClick={() => navigate(-1)}
         >
          Cancel
         </button>
         <button
          type="submit"
           className="btn btn-primary"
         disabled={submitting}
        >
         {submitting ? 'Submitting...' : 'Submit Review'}
        </button>
       </div>
      </form>
     </div>
    </div>
   </div>
  </div>
 );
};

export default LeaveReview;

