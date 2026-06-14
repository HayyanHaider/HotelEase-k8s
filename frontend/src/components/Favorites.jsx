import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Dashboard.css';

const Favorites = () => {
 const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
 const navigate = useNavigate();

  useEffect(() => {
   fetchFavorites();
  }, []);

 const fetchFavorites = async () => {
   try {
     setLoading(true);
    const token = sessionStorage.getItem('token');
     if (!token) {
      toast.warning('Please login to view favorites');
       navigate('/login');
      return;
     }

     const response = await axios.get('/api/users/favorites', {
      headers: { Authorization: `Bearer ${token}` }
     });

     if (response.data.success) {
      setFavorites(response.data.favorites || []);
     } else {
      toast.error('Failed to load favorites');
     }
   } catch (error) {
    console.error('Error fetching favorites:', error);
     toast.error(error.response?.data?.message || 'Error loading favorites');
   } finally {
    setLoading(false);
   }
  };

  const removeFavorite = async (hotelId) => {
   try {
     const token = sessionStorage.getItem('token');
      const response = await axios.delete(`/api/users/favorites/${hotelId}`, {
       headers: { Authorization: `Bearer ${token}` }
     });
     
    if (response.data.success) {
     setFavorites(favorites.filter(f => String(f._id || f.id) !== String(hotelId)));
      toast.success('Removed from favorites');
     }
   } catch (error) {
    console.error('Error removing favorite:', error);
     toast.error(error.response?.data?.message || 'Error removing favorite');
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
       <h1>My Favorites</h1>
        <p>Your saved hotels</p>
      </div>
      <button
       className="btn btn-outline-secondary"
        onClick={() => navigate('/browse-hotels')}
      style={{ height: 'fit-content' }}
     >
      ← Go Back
     </button>
     </div>
    </div>

    <div className="container">
     {favorites.length === 0 ? (
      <div className="text-center">
       <p>No favorites yet</p>
        <button className="btn btn-primary" onClick={() => navigate('/browse-hotels')}>
         Browse Hotels
        </button>
      </div>
     ) : (
      <div className="row g-4">
       {favorites.map((hotel) => (
        <div key={hotel._id || hotel.id} className="col-md-4">
         <div className="card">
          {hotel.images && hotel.images.length > 0 && (
           <img
            src={hotel.images[0]}
             className="card-img-top"
           alt={hotel.name}
            style={{ height: '200px', objectFit: 'cover' }}
          />
         )}
         <div className="card-body">
          <h5 className="card-title">{hotel.name}</h5>
           <p className="card-text">{hotel.description?.substring(0, 100)}...</p>
          <p className="text-warning">⭐ {hotel.rating || 0}</p>
           <div className="d-flex gap-2">
           <button
            className="btn btn-primary"
             onClick={() => navigate(`/hotel/${hotel._id || hotel.id}`)}
          >
           View Details
          </button>
          <button
           className="btn btn-danger"
            onClick={() => removeFavorite(hotel._id || hotel.id)}
         >
          Remove
         </button>
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

export default Favorites;

