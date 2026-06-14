import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Dashboard.css';

const CreateBooking = () => {
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [hotel, setHotel] = useState(null);
  const [checkIn, setCheckIn] = useState(location.state?.checkIn || '');
  const [checkOut, setCheckOut] = useState(location.state?.checkOut || '');
  const [guests, setGuests] = useState(location.state?.guests || 1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [availabilityChecked, setAvailabilityChecked] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoCodeError, setPromoCodeError] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getMinCheckOutDate = () => {
    if (!checkIn) return getTodayDate();
    const checkInDate = new Date(checkIn);
    checkInDate.setDate(checkInDate.getDate() + 1);
    const year = checkInDate.getFullYear();
    const month = String(checkInDate.getMonth() + 1).padStart(2, '0');
    const day = String(checkInDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    fetchHotelDetails();
  }, [hotelId]);

  useEffect(() => {
    if (hotel && checkIn && checkOut && guests) {
      checkAvailability();
    } else {
      setAvailabilityChecked(false);
      setIsAvailable(false);
    }
  }, [hotel, checkIn, checkOut, guests]);

  useEffect(() => {
    if (checkIn && checkOut) {
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      const minCheckOut = new Date(checkInDate);
      minCheckOut.setDate(minCheckOut.getDate() + 1);
      
      if (checkOutDate <= checkInDate) {
        const year = minCheckOut.getFullYear();
        const month = String(minCheckOut.getMonth() + 1).padStart(2, '0');
        const day = String(minCheckOut.getDate()).padStart(2, '0');
        setCheckOut(`${year}-${month}-${day}`);
      }
    }
  }, [checkIn]);

  const fetchHotelDetails = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`/api/hotels/${hotelId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (response.data.success) {
        setHotel(response.data.hotel);
      }
    } catch (error) {
      console.error('Error fetching hotel details:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAvailability = async () => {
    try {
      setAvailabilityChecked(false);
      const maxGuests = hotel?.capacity?.guests || 0;
      if (parseInt(guests) <= maxGuests && checkIn && checkOut) {
        setIsAvailable(true);
      } else {
        setIsAvailable(false);
        if (checkIn && checkOut) {
          toast.error('Hotel is fully booked for these dates/guests. Please adjust and try again.');
        }
      }
      setAvailabilityChecked(true);
    } catch (error) {
      console.error('Error checking availability:', error);
      setIsAvailable(false);
      setAvailabilityChecked(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!hotelId) {
      toast.error('Hotel ID is missing. Please try again.');
      return;
    }

    if (!checkIn || !checkOut || !guests) {
      toast.warning('Please fill in all required fields');
      return;
    }

    if (!isAvailable || !availabilityChecked) {
      toast.error('Hotel is fully booked or unavailable for those dates/guests. Please pick different dates or reduce guests.');
      return;
    }

    try {
      setSubmitting(true);
      const token = sessionStorage.getItem('token');
      if (!token) {
          toast.warning('Please login to create a booking');
        navigate('/login');
        return;
      }

      const bookingData = {
        hotelId: hotelId,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        guests: parseInt(guests) || 1,
        couponCode: promoCode || undefined
      };

      const response = await axios.post(
        '/api/bookings',
        bookingData,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        const bookingId = response.data.booking._id || response.data.booking.id;
        const appliedCoupon = response.data.appliedCoupon;
        
        if (appliedCoupon) {
          toast.success(`Great! Coupon "${appliedCoupon.code}" (${appliedCoupon.discountPercentage}% off) has been automatically applied. You saved PKR ${appliedCoupon.discountAmount.toFixed(2)}!`);
        }
        
        if (bookingId) {
          navigate(`/payment/${bookingId}`);
        } else {
          toast.warning('Booking created but booking ID is missing. Please check your bookings.');
          navigate('/booking-history');
        }
      } else {
        toast.error(response.data.message || 'Failed to create booking. Please try again.');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error(error.response?.data?.message || 'Error creating booking');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="dashboard-container text-center">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <h1>Create Booking</h1>
            {hotel && <h3>{hotel.name}</h3>}

            <form onSubmit={handleSubmit} className="mt-4">
              <div className="mb-3">
                <label className="form-label">Check-in Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  min={getTodayDate()}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Check-out Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  min={getMinCheckOutDate()}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Guests</label>
                <input
                  type="number"
                  className="form-control"
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  min="1"
                  max={hotel?.capacity?.guests || 10}
                  required
                />
                {hotel?.capacity?.guests && (
                  <small className="text-muted">Maximum {hotel.capacity.guests} guests</small>
                )}
              </div>

              {checkIn && checkOut && guests && availabilityChecked && (
                <div className="mb-4">
                  {isAvailable ? (
                    <div className="alert alert-success">
                      ✓ Hotel is available for the selected dates and number of guests.
                    </div>
                  ) : (
                    <div className="alert alert-warning">
                      Hotel is not available for the selected dates and number of guests. Please select different dates or reduce the number of guests.
                    </div>
                  )}
                </div>
              )}

              <div className="mb-4">
                <label className="form-label">Promo Code (Optional)</label>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter promo code"
                    value={promoCode}
                    onChange={(e) => {
                      setPromoCode(e.target.value.toUpperCase());
                      setPromoCodeError('');
                    }}
                  />
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={async () => {
                      if (!promoCode) {
                        setPromoCodeError('Please enter a promo code');
                        return;
                      }
                      try {
                        const token = localStorage.getItem('token');
                        const response = await axios.get(
                          `/api/coupons/validate?code=${promoCode}&hotelId=${hotelId}`,
                          { headers: { Authorization: `Bearer ${token}` } }
                        );
                        if (response.data.success) {
                          setAppliedCoupon(response.data.coupon);
                          setPromoCodeError('');
                          toast.success(`Coupon "${response.data.coupon.code}" applied successfully!`);
                        }
                      } catch (error) {
                        setPromoCodeError(error.response?.data?.message || 'Invalid coupon code');
                        setAppliedCoupon(null);
                      }
                    }}
                  >
                    Apply
                  </button>
                </div>
                {promoCodeError && (
                  <div className="text-danger small mt-1">{promoCodeError}</div>
                )}
                {appliedCoupon && (
                  <div className="alert alert-success mt-2">
                    ✓ Coupon "{appliedCoupon.code}" applied! {appliedCoupon.discountPercentage}% discount
                  </div>
                )}
              </div>

              {hotel && checkIn && checkOut && (
                <div className="mb-4">
                  <h5>Price Breakdown</h5>
                  <div className="border rounded p-3">
                    {(() => {
                      const checkInDate = new Date(checkIn);
                      const checkOutDate = new Date(checkOut);
                      checkInDate.setHours(0, 0, 0, 0);
                      checkOutDate.setHours(0, 0, 0, 0);
                      const daysDiff = (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24);
                      const nights = Math.max(1, Math.floor(daysDiff));
                      const basePrice = hotel.pricing?.basePrice || 0;
                      const cleaningFee = hotel.pricing?.cleaningFee || 0;
                      const serviceFee = hotel.pricing?.serviceFee || 0;
                      const subtotal = (basePrice * nights) + cleaningFee + serviceFee;
                      const discount = appliedCoupon ? (subtotal * (appliedCoupon.discountPercentage / 100)) : 0;
                      const total = subtotal - discount;
                      
                      return (
                        <>
                          <div className="d-flex justify-content-between mb-2">
                            <span>PKR {basePrice} × {nights} {nights === 1 ? 'night' : 'nights'}</span>
                            <span>PKR {(basePrice * nights).toFixed(2)}</span>
                          </div>
                          {cleaningFee > 0 && (
                            <div className="d-flex justify-content-between mb-2">
                              <span>Cleaning fee</span>
                              <span>PKR {cleaningFee.toFixed(2)}</span>
                            </div>
                          )}
                          {serviceFee > 0 && (
                            <div className="d-flex justify-content-between mb-2">
                              <span>Service fee</span>
                              <span>PKR {serviceFee.toFixed(2)}</span>
                            </div>
                          )}
                          <hr />
                          <div className="d-flex justify-content-between mb-2">
                            <span>Subtotal</span>
                            <span>PKR {subtotal.toFixed(2)}</span>
                          </div>
                          {appliedCoupon && discount > 0 && (
                            <div className="d-flex justify-content-between mb-2 text-success">
                              <span>Discount ({appliedCoupon.discountPercentage}%)</span>
                              <span>-PKR {discount.toFixed(2)}</span>
                            </div>
                          )}
                          <hr />
                          <div className="d-flex justify-content-between fw-bold">
                            <span>Total</span>
                            <span>PKR {total.toFixed(2)}</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}

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
                  {submitting ? 'Creating...' : 'Create Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateBooking;

