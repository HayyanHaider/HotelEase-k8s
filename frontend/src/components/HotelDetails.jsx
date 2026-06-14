import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { resolveAssetUrl } from '../services/urlResolver';
import 'leaflet/dist/leaflet.css';
import './HotelDetails.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const HotelDetails = () => {
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const guestSelectRef = useRef(null);
  const mapSectionRef = useRef(null);

  const todayDate = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    setIsLoggedIn(!!token);
    fetchHotelDetails();
    checkFavorite();
    fetchReviews();
  }, [hotelId]);

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

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`/api/reviews/hotel/${hotelId}`);
      if (response.data.success) {
        setReviews(response.data.reviews || []);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const checkFavorite = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) return;
      const response = await axios.get('/api/users/favorites', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        const favorites = response.data.favorites || [];
        setIsFavorite(favorites.some(f => String(f._id || f.id) === String(hotelId)));
      }
    } catch (error) {
      console.error('Error checking favorite:', error);
    }
  };

  const toggleFavorite = async (e) => {
    if (e) e.stopPropagation();
    
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      if (isFavorite) {
        await axios.delete(`/api/users/favorites/${hotelId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsFavorite(false);
        toast.info('Removed from favorites');
      } else {
        await axios.post('/api/users/favorites', { hotelId }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsFavorite(true);
        toast.success('Added to favorites');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      const errorMessage = error && error.response && error.response.data && error.response.data.message 
        ? error.response.data.message 
        : 'Error updating favorite';
      toast.error(errorMessage);
    }
  };

  const handleBookNow = () => {
    if (!checkIn || !checkOut) {
      toast.warning('Please select check-in and check-out dates');
      return;
    }
    navigate(`/booking/${hotelId}`, {
      state: { checkIn, checkOut, guests }
    });
  };

  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0;
    const diff = Math.abs(new Date(checkOut).getTime() - new Date(checkIn).getTime());
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const calculateTotal = () => {
    if (!hotel) return 0;
    const nights = calculateNights();
    return (hotel.pricing?.basePrice || 0) * nights + (hotel.pricing?.cleaningFee || 0) + (hotel.pricing?.serviceFee || 0);
  };

  const getMinCheckOutDate = () => {
    if (!checkIn) return todayDate;
    const checkInDate = new Date(checkIn);
    checkInDate.setDate(checkInDate.getDate() + 1);
    const year = checkInDate.getFullYear();
    const month = String(checkInDate.getMonth() + 1).padStart(2, '0');
    const day = String(checkInDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const processImages = (imgs = []) => {
    if (!imgs || !Array.isArray(imgs)) return [];
    return imgs.map((img, index) => {
      if (!img) return null;
      let url = '';
      if (typeof img === 'string') {
        url = img.trim();
      } else if (img && typeof img === 'object' && img.url) {
        url = String(img.url).trim();
      } else {
        url = String(img).trim();
      }
      if (!url || url === 'undefined' || url === 'null' || url === '') return null;

      return resolveAssetUrl(url);
    }).filter(Boolean);
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleThumbnailClick = (index) => {
    setCurrentImageIndex(index);
  };

  const images = processImages(hotel?.images || []);

  if (loading) {
    return (
      <div className="hotel-container loading">
        <div className="text-center">
          <div className="spinner"></div>
          <p className="text-muted" style={{ marginTop: '16px' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="hotel-container not-found">
        <div className="text-center">
          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '16px' }}>Hotel not found</h2>
          <button
            onClick={() => navigate('/browse-hotels')}
            className="back-btn"
            style={{ padding: '8px 24px', border: '1px solid var(--color-border)', borderRadius: '8px' }}
          >
            Browse Hotels
          </button>
        </div>
      </div>
    );
  }

  const scrollToMapSection = () => {
    if (mapSectionRef.current) {
      mapSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="hotel-container">
      <div className="hotel-header">
        <button onClick={() => navigate(-1)} className="back-btn">
          ← Back
        </button>
        <div className="header-content">
          <div style={{ flex: 1 }}>
            <h1 className="hotel-title">{hotel.name}</h1>
            <div className="header-meta">
              <div className="rating-badge">
                <span className="star">★</span>
                <span className="rating-value">{hotel.rating?.toFixed(1) || '0.0'}</span>
                <span className="reviews-count">({hotel.totalReviews || 0} reviews)</span>
              </div>
              <span className="divider">·</span>
              <span
                className="location-text"
                role="button"
                tabIndex={0}
                onClick={scrollToMapSection}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    scrollToMapSection();
                  }
                }}
              >
                {hotel.location?.city}, {hotel.location?.country}
              </span>
            </div>
          </div>
          {isLoggedIn && (
            <button
              onClick={toggleFavorite}
              className={`header-heart-btn ${isFavorite ? 'active' : ''}`}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              {isFavorite ? '♥' : '♡'}
            </button>
          )}
        </div>
      </div>

      <div className="gallery-section">
        <div className="image-gallery">
          {images.length > 0 ? (
            <div className="carousel-container">
              <div className="carousel-main">
                <img
                  src={images[currentImageIndex] || "/placeholder.svg"}
                  alt={`${hotel.name} - Image ${currentImageIndex + 1}`}
                  className="carousel-image"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />

                {images.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevImage}
                      className="carousel-arrow carousel-arrow-prev"
                      title="Previous image"
                    >
                      <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                      </svg>
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="carousel-arrow carousel-arrow-next"
                      title="Next image"
                    >
                      <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </button>
                  </>
                )}

              </div>

              {images.length > 1 && (
                <div className="carousel-thumbnails">
                  {images.map((img, index) => (
                    <button
                      key={index}
                      className={`thumbnail ${index === currentImageIndex ? 'active' : ''}`}
                      onClick={() => handleThumbnailClick(index)}
                      title={`Image ${index + 1}`}
                    >
                      <img src={img || "/placeholder.svg"} alt={`Thumbnail ${index + 1}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="image-placeholder">
              <span>Preview unavailable</span>
            </div>
          )}
        </div>
      </div>

      <div className="content-grid">
        <div className="main-content">

          {(hotel.capacity?.guests || hotel.capacity?.bedrooms || hotel.capacity?.bathrooms) && (
            <section className="section-card">
              <h3 className="section-title">Property Details</h3>
              <div className="property-details-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '20px',
                marginTop: '16px'
              }}>
                {hotel.capacity?.guests && (
                  <div key="guests" className="property-detail-item">
                    <div className="property-detail-label" style={{
                      fontSize: '14px',
                      color: '#717171',
                      marginBottom: '4px'
                    }}>Max guests</div>
                    <div className="property-detail-value" style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#222'
                    }}>
                      Up to {hotel.capacity.guests} {hotel.capacity.guests === 1 ? 'guest' : 'guests'}
                    </div>
                  </div>
                )}
                {hotel.capacity?.bedrooms && (
                  <div key="bedrooms" className="property-detail-item">
                    <div className="property-detail-label" style={{
                      fontSize: '14px',
                      color: '#717171',
                      marginBottom: '4px'
                    }}>Max bedrooms</div>
                    <div className="property-detail-value" style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#222'
                    }}>
                      Up to {hotel.capacity.bedrooms} {hotel.capacity.bedrooms === 1 ? 'bedroom' : 'bedrooms'}
                    </div>
                  </div>
                )}
                {hotel.capacity?.bathrooms && (
                  <div key="bathrooms" className="property-detail-item">
                    <div className="property-detail-label" style={{
                      fontSize: '14px',
                      color: '#717171',
                      marginBottom: '4px'
                    }}>Max bathrooms</div>
                    <div className="property-detail-value" style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#222'
                    }}>
                      Up to {hotel.capacity.bathrooms} {hotel.capacity.bathrooms === 1 ? 'bathroom' : 'bathrooms'}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {hotel.amenities && hotel.amenities.length > 0 && (
            <section className="section-card">
              <h3 className="section-title">What this place offers</h3>
              <div className="amenities-grid">
                {hotel.amenities.map((amenity, index) => (
                  <div key={index} className="amenity-item">
                    <span className="amenity-check">✓</span>
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="section-card">
            <h3 className="section-title">
              <span className="star">★</span> {hotel.rating?.toFixed(1) || '0.0'} · {hotel.totalReviews || 0} reviews
            </h3>
            {reviews.length === 0 ? (
              <p className="text-muted">No reviews yet</p>
            ) : (
              <div className="reviews-list">
                {reviews.slice(0, 5).map((review) => (
                  <div key={review._id} className="review-item">
                    <div className="review-header">
                      <div>
                        <div className="reviewer-name">{review.userId?.email || review.customer?.email || 'Anonymous'}</div>
                        <div className="review-date">{new Date(review.createdAt).toLocaleDateString()}</div>
                      </div>
                      <div className="review-rating">
                        <span className="star">★</span> {review.rating}
                      </div>
                    </div>
                    <p className="review-text">{review.comment || 'No comment'}</p>
                    {(review.reply?.text || review.replyText) && (
                      <div className="host-reply-slim">
                        <div className="reply-slim-header">
                          <div className="reply-slim-label">Reply</div>
                          <div className="reply-slim-date">
                            {new Date(review.reply?.repliedAt || review.repliedAt).toLocaleDateString()}
                          </div>
                        </div>
                        <p className="reply-slim-text">{review.reply?.text || review.replyText}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {hotel.location?.coordinates?.lat != null && hotel.location?.coordinates?.lng != null && (
            <section className="section-card" ref={mapSectionRef}>
              <h3 className="section-title">Where you'll be</h3>
              <div className="map-wrapper">
                <MapContainer
                  center={[Number(hotel.location.coordinates.lat), Number(hotel.location.coordinates.lng)]}
                  zoom={15}
                  scrollWheelZoom
                >
                  <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[Number(hotel.location.coordinates.lat), Number(hotel.location.coordinates.lng)]} icon={redIcon}>
                    <Popup>
                      <strong>{hotel.name}</strong><br />
                      {hotel.location.address}<br />
                      {hotel.location.city}, {hotel.location.country}
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>
              <p className="location-address">
                {hotel.location.address}, {hotel.location.city}, {hotel.location.state} {hotel.location.zipCode}, {hotel.location.country}
              </p>
            </section>
          )}
        </div>

        <div className="booking-sidebar">
          <div className="booking-card sticky">
            <div className="price-header">
              <div className="price-amount">PKR {hotel.pricing?.basePrice || 0}</div>
              <div className="price-period">per night</div>
            </div>

            <div className="date-inputs">
              <div className="date-input-group">
                <label>CHECK-IN</label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  min={todayDate}
                />
              </div>
              <div className="date-input-group">
                <label>CHECKOUT</label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  min={getMinCheckOutDate()}
                />
              </div>
            </div>

            <div className="guests-select">
              <label>GUESTS</label>
              <select
                ref={guestSelectRef}
                value={guests}
                onChange={(e) => {
                  const selectedGuests = parseInt(e.target.value, 10);
                  setGuests(selectedGuests);
                  guestSelectRef.current?.blur();
                }}
                style={{ paddingRight: '36px' }}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                  <option key={num} value={num}>{num} {num === 1 ? 'guest' : 'guests'}</option>
                ))}
              </select>
            </div>

            <button onClick={handleBookNow} className="reserve-btn">
              Reserve
            </button>

            {checkIn && checkOut && (
              <div className="price-breakdown">
                <div className="breakdown-row">
                  <span>PKR {hotel.pricing?.basePrice || 0} × {calculateNights()} nights</span>
                  <span>PKR {((hotel.pricing?.basePrice || 0) * calculateNights()).toFixed(2)}</span>
                </div>
                {(hotel.pricing?.cleaningFee || 0) > 0 && (
                  <div className="breakdown-row">
                    <span>Cleaning fee</span>
                    <span>PKR {hotel.pricing.cleaningFee}</span>
                  </div>
                )}
                {(hotel.pricing?.serviceFee || 0) > 0 && (
                  <div className="breakdown-row">
                    <span>Service fee</span>
                    <span>PKR {hotel.pricing.serviceFee}</span>
                  </div>
                )}
                <div className="breakdown-total">
                  <span>Total</span>
                  <span>PKR {calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            )}

            <div className="booking-note">You won't be charged yet</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelDetails;
