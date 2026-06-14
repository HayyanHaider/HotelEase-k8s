import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Dashboard.css';

const ReplyToReviews = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState('');
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    fetchHotels();
  }, []);

  useEffect(() => {
    if (selectedHotelId) {
      fetchReviews(selectedHotelId);
    } else {
      setReviews([]);
    }
  }, [selectedHotelId]);

  const fetchHotels = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');

      const hotelsResponse = await axios.get('/api/hotels/owner/my-hotels', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (hotelsResponse.data.success) {
        const userHotels = (hotelsResponse.data.hotels || []).filter(hotel => !hotel.isSuspended);
        setHotels(userHotels);

        if (userHotels.length > 0) {
          const firstHotelId = userHotels[0]._id || userHotels[0].id;
          setSelectedHotelId(String(firstHotelId));
        }
      }
    } catch (error) {
      console.error('Error fetching hotels:', error);
      toast.error('Failed to load hotels');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async (hotelId) => {
    if (!hotelId) return;
    try {
      setReviewsLoading(true);
      const token = sessionStorage.getItem('token');
      const reviewsResponse = await axios.get(`/api/reviews/hotel/${hotelId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (reviewsResponse.data.success) {
        setReviews(reviewsResponse.data.reviews || []);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleReply = async (reviewId) => {
    if (!replyText.trim()) {
      toast.warning('Please enter a reply');
      return;
    }

    try {
      const token = sessionStorage.getItem('token');
      await axios.post(
        `/api/reviews/${reviewId}/reply`,
        { text: replyText },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
        toast.success('Reply submitted successfully!');
      setReplyingTo(null);
      setReplyText('');
      fetchReviews(selectedHotelId);
    } catch (error) {
      console.error('Error submitting reply:', error);
      toast.error(error.response?.data?.message || 'Error submitting reply');
    }
  };

  if (loading) {
    return <div className="dashboard-container text-center">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h1>Reply to Reviews</h1>
            <p>Respond to guest reviews</p>
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
        <div className="w-100 mb-3">
          <label className="form-label">Select Hotel</label>
          <select
            className="form-select"
            value={selectedHotelId}
            onChange={(e) => setSelectedHotelId(e.target.value)}
          >
            <option value="">-- Select a Hotel --</option>
            {hotels.map((hotel) => (
              <option key={hotel._id || hotel.id} value={hotel._id || hotel.id}>
                {hotel.name}
              </option>
            ))}
          </select>
        </div>

        {reviewsLoading ? (
          <div className="text-center">
            <p>Loading reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center">
            <p>No reviews awaiting replies</p>
          </div>
        ) : (
          <div className="row g-4">
            {reviews.map((review) => (
              <div key={review._id || review.id} className="col-12">
                <div className="card">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <h5>{review.userId?.email || review.customer?.email || 'Guest'}</h5>
                        <p className="text-warning">⭐ {review.rating}/5</p>
                        <p>{review.comment || 'No comment'}</p>
                        <p className="text-muted small">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {(review.reply?.text || review.replyText) && (
                      <div className="alert alert-info">
                        <strong>Your Reply:</strong> {review.reply?.text || review.replyText}
                        <br />
                        <small className="text-muted">
                          {new Date(review.reply?.repliedAt || review.repliedAt).toLocaleDateString()}
                        </small>
                      </div>
                    )}

                    {!review.reply?.text && !review.replyText && (
                      <div>
                        {replyingTo === (review._id || review.id) ? (
                          <div className="mt-3">
                            <textarea
                              className="form-control mb-2"
                              rows="3"
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Write your reply..."
                            />
                            <div className="d-flex gap-2 reply-form-actions">
                              <button
                                className="btn btn-primary btn-sm reply-form-action-btn"
                                onClick={() => handleReply(review._id || review.id)}
                              >
                                Submit Reply
                              </button>
                              <button
                                className="btn btn-secondary btn-sm reply-form-action-btn"
                                onClick={() => {
                                  setReplyingTo(null);
                                  setReplyText('');
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => setReplyingTo(review._id || review.id)}
                          >
                            Reply
                          </button>
                        )}
                      </div>
                    )}
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

export default ReplyToReviews;

