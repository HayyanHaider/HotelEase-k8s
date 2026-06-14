import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Dashboard.css';

const BookingHistory = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      if (!token) {
        toast.warning('Please login to view bookings');
        navigate('/login');
        return;
      }

      const response = await axios.get('/api/bookings/my-bookings', {
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

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        toast.error('Please login to cancel bookings');
        navigate('/login');
        return;
      }

      const response = await axios.put(
        `/api/bookings/${bookingId}/cancel`,
        { reason: 'Customer cancellation' },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        toast.success('Booking cancelled successfully');
        fetchBookings();
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      
      if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
        toast.error('Cannot connect to server. Please make sure the backend server is running.');
      } else {
        toast.error(error.response?.data?.message || 'Error cancelling booking');
      }
    }
  };

  const handleReview = (bookingId) => {
    navigate(`/review/${bookingId}`);
  };

  const handleReschedule = (bookingId) => {
    navigate(`/reschedule/${bookingId}`);
  };

  const handleDownloadInvoice = async (bookingId) => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get(
        `/api/payments/invoice/${bookingId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      const contentType = response.headers['content-type'];
      if (contentType && contentType.includes('application/json')) {
        const text = await response.data.text();
        const errorData = JSON.parse(text);
        toast.error(errorData.message || 'Error downloading invoice');
        return;
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${bookingId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading invoice:', error);
      
      if (error.response && error.response.data instanceof Blob) {
        try {
          const errorText = await error.response.data.text();
          const errorData = JSON.parse(errorText);
          toast.error(errorData.message || 'Error downloading invoice');
        } catch (parseError) {
          toast.error('Error downloading invoice');
        }
      } else {
        toast.error(error.response?.data?.message || error.message || 'Error downloading invoice');
      }
    }
  };

  if (loading) {
    return <div className="dashboard-container text-center">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header" style={{ textAlign: 'left' }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div style={{ padding: 0, margin: 0, width: '100%' }}>
            <h1 style={{ 
              fontSize: '28px', 
              fontWeight: '600', 
              color: '#222', 
              marginBottom: '8px',
              marginTop: 0,
              marginLeft: 0,
              marginRight: 0,
              padding: 0,
              lineHeight: '1.2',
              textAlign: 'left',
              display: 'block'
            }}>
              My Bookings
            </h1>
            <p style={{ 
              fontSize: '15px', 
              color: '#717171', 
              margin: 0,
              padding: 0,
              lineHeight: '1.4',
              textAlign: 'left',
              display: 'block'
            }}>
              View and manage your reservations
            </p>
          </div>
          <button
            className="btn btn-outline-secondary"
            onClick={() => navigate('/browse-hotels')}
            style={{ 
              height: 'fit-content',
              borderRadius: '8px',
              padding: '10px 20px',
              fontWeight: '500',
              borderWidth: '1.5px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              fontSize: '14px'
            }}
          >
            ← Go Back
          </button>
        </div>
      </div>

      <div className="container">
        {bookings.length === 0 ? (
          <div className="text-center" style={{ 
            minHeight: '60vh', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <div className="alert alert-info" style={{ maxWidth: '500px', margin: '0 auto' }}>
              <h5>No bookings found</h5>
              <p className="mb-3">You haven't made any reservations yet.</p>
              <button className="btn btn-primary" onClick={() => navigate('/browse-hotels')}>
                Browse Hotels
              </button>
            </div>
          </div>
        ) : (
          <div className="row g-4">
            {bookings.map((booking) => (
              <div key={booking._id || booking.id} className="col-12">
                <div className="card shadow-sm booking-history-card" style={{ border: '1px solid #e0e0e0', borderRadius: '12px', overflow: 'hidden' }}>
                  <div className="card-body p-4 booking-card-body">
                    <div className="row">
                      <div className="col-md-8">
                        <div className="d-flex align-items-start mb-3 booking-title-row">
                          <div className="flex-grow-1">
                            <h5 className="mb-2 booking-hotel-name" style={{ fontSize: '20px', fontWeight: '600', color: '#222' }}>
                              {booking.hotelId?.name || booking.hotel?.name || 'Hotel'}
                            </h5>
                            <p className="text-muted mb-3 booking-hotel-address" style={{ fontSize: '14px' }}>
                              {booking.hotelId?.location?.address || booking.hotel?.address || 'Address not available'}
                            </p>
                          </div>
                          <span className={`badge bg-${getStatusColor(booking.status)} booking-status-badge`} style={{ 
                            fontSize: '12px', 
                            padding: '6px 12px',
                            textTransform: 'uppercase',
                            fontWeight: '600'
                          }}>
                            {booking.status}
                          </span>
                        </div>

                        <div className="booking-meta-grid mb-3">
                          <div className="booking-meta-item">
                            <div style={{ fontSize: '13px', color: '#717171', marginBottom: '4px' }}>Check-in</div>
                            <div style={{ fontSize: '15px', fontWeight: '500', color: '#222' }}>
                              {new Date(booking.checkIn).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric' 
                              })}
                            </div>
                          </div>
                          <div className="booking-meta-item">
                            <div style={{ fontSize: '13px', color: '#717171', marginBottom: '4px' }}>Check-out</div>
                            <div style={{ fontSize: '15px', fontWeight: '500', color: '#222' }}>
                              {new Date(booking.checkOut).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric' 
                              })}
                            </div>
                          </div>
                          <div className="booking-meta-item">
                            <div style={{ fontSize: '13px', color: '#717171', marginBottom: '4px' }}>Nights</div>
                            <div style={{ fontSize: '15px', fontWeight: '500', color: '#222' }}>
                              {booking.nights} {booking.nights === 1 ? 'night' : 'nights'}
                            </div>
                          </div>
                          <div className="booking-meta-item">
                            <div style={{ fontSize: '13px', color: '#717171', marginBottom: '4px' }}>Guests</div>
                            <div style={{ fontSize: '15px', fontWeight: '500', color: '#222' }}>
                              {booking.guests || 1} {booking.guests === 1 ? 'guest' : 'guests'}
                            </div>
                          </div>
                          <div className="booking-meta-item">
                            <div style={{ fontSize: '13px', color: '#717171', marginBottom: '4px' }}>Total Price</div>
                            <div style={{ fontSize: '16px', fontWeight: '600', color: '#222' }}>
                              PKR {booking.priceSnapshot?.totalPrice || booking.totalPrice || 0}
                            </div>
                          </div>
                        </div>
                        {booking.review && (
                          <div className="mt-3 p-3" style={{ 
                            backgroundColor: '#f8f9fa', 
                            borderRadius: '8px',
                            border: '1px solid #e0e0e0'
                          }}>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#222', marginBottom: '8px' }}>
                              Your Review
                            </div>
                            <div className="mb-2">
                              <span className="text-warning">⭐ {booking.review.rating}/5</span>
                              <span style={{ fontSize: '12px', color: '#717171', marginLeft: '8px' }}>
                                {new Date(booking.review.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p style={{ fontSize: '14px', color: '#222', marginBottom: '12px' }}>
                              {booking.review.comment || 'No comment'}
                            </p>
                            {(booking.review.reply?.text || booking.review.replyText) && (
                              <div className="mt-2 p-2" style={{ 
                                backgroundColor: '#e3f2fd', 
                                borderRadius: '6px',
                                borderLeft: '3px solid #2196f3'
                              }}>
                                <div style={{ fontSize: '13px', fontWeight: '600', color: '#1976d2', marginBottom: '4px' }}>
                                  Hotel Owner's Reply
                                </div>
                                <p style={{ fontSize: '14px', color: '#222', marginBottom: '4px' }}>
                                  {booking.review.reply?.text || booking.review.replyText}
                                </p>
                                <small style={{ fontSize: '12px', color: '#717171' }}>
                                  {new Date(booking.review.reply?.repliedAt || booking.review.repliedAt).toLocaleDateString()}
                                </small>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="col-md-4 mt-3 mt-md-0">
                        <div 
                          className="d-flex flex-column gap-2 booking-actions"
                          style={{ 
                            borderLeft: '1px solid #e0e0e0',
                            paddingLeft: '24px'
                          }}
                        >
                          {(booking.status === 'pending' || booking.status === 'confirmed') && (
                            <>
                              <button
                                className="btn btn-outline-primary"
                                onClick={() => handleReschedule(booking._id || booking.id)}
                                style={{ 
                                  borderRadius: '8px',
                                  fontWeight: '500',
                                  padding: '10px 16px',
                                  borderWidth: '1.5px'
                                }}
                              >
                                Reschedule
                              </button>
                              <button
                                className="btn btn-danger"
                                onClick={() => handleCancel(booking._id || booking.id)}
                                style={{ 
                                  borderRadius: '8px',
                                  fontWeight: '500',
                                  padding: '10px 16px'
                                }}
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {booking.status === 'confirmed' && (booking.invoicePath || booking.invoiceUrl) && (
                            <button
                              className="btn btn-success"
                              onClick={() => handleDownloadInvoice(booking._id || booking.id)}
                              style={{ 
                                borderRadius: '8px',
                                fontWeight: '500',
                                padding: '10px 16px'
                              }}
                            >
                              Download Invoice
                            </button>
                          )}
                          {(booking.status === 'completed' || booking.status === 'checked-out') && (
                            <>
                              {!booking.review ? (
                                <button
                                  className="btn btn-primary"
                                  onClick={() => handleReview(booking._id || booking.id)}
                                  style={{ 
                                    borderRadius: '8px',
                                    fontWeight: '500',
                                    padding: '10px 16px'
                                  }}
                                >
                                  Leave Review
                                </button>
                              ) : (
                                <button
                                  className="btn btn-outline-primary"
                                  onClick={() => handleReview(booking._id || booking.id)}
                                  style={{ 
                                    borderRadius: '8px',
                                    fontWeight: '500',
                                    padding: '10px 16px',
                                    borderWidth: '1.5px'
                                  }}
                                >
                                  View Review
                                </button>
                              )}
                              {(booking.invoicePath || booking.invoiceUrl) && (
                                <button
                                  className="btn btn-success"
                                  onClick={() => handleDownloadInvoice(booking._id || booking.id)}
                                  style={{ 
                                    borderRadius: '8px',
                                    fontWeight: '500',
                                    padding: '10px 16px'
                                  }}
                                >
                                  Download Invoice
                                </button>
                              )}
                            </>
                          )}
                          {booking.status === 'cancelled' && (booking.invoicePath || booking.invoiceUrl) && (
                            <button
                              className="btn btn-outline-secondary"
                              onClick={() => handleDownloadInvoice(booking._id || booking.id)}
                              style={{ 
                                borderRadius: '8px',
                                fontWeight: '500',
                                padding: '10px 16px',
                                borderWidth: '1.5px'
                              }}
                            >
                              View Invoice
                            </button>
                          )}
                        </div>
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
    case 'completed':
      return 'info';
    default:
      return 'secondary';
  }
};

export default BookingHistory;

