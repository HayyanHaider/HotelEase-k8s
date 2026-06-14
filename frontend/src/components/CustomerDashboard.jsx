import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const CustomerDashboard = () => {
 const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
   const token = sessionStorage.getItem('token');
    const userData = sessionStorage.getItem('user');
    
   if (!token || !userData) {
     navigate('/login');
      return;
    }

   const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'customer') {
     navigate('/login');
      return;
    }

   setUser(parsedUser);
  }, [navigate]);

  if (!user) {
   return <div className="loading">Loading...</div>;
  }

 return (
   <div className="dashboard-container">
    <div className="dashboard-header">
     <h1>Welcome Customer, {user.name}!</h1>
     <p>Discover amazing places to stay around the world</p>
    </div>

    <div className="dashboard-content">
     <div className="dashboard-cards">
      <div className="dashboard-card">
       <div className="card-icon">🏠</div>
        <h3>Browse Properties</h3>
       <p>Find your perfect accommodation from thousands of listings</p>
        <button className="card-button" onClick={() => navigate('/')}>Start Browsing</button>
      </div>

      <div className="dashboard-card">
       <div className="card-icon">📅</div>
        <h3>My Bookings</h3>
       <p>View and manage your current and past reservations</p>
        <button className="card-button" onClick={() => navigate('/booking-history')}>View Bookings</button>
      </div>

      <div className="dashboard-card">
       <div className="card-icon">❤️</div>
        <h3>Favorites</h3>
       <p>Access your saved properties and wishlists</p>
        <button className="card-button" onClick={() => navigate('/favorites')}>View Favorites</button>
      </div>

      <div className="dashboard-card">
       <div className="card-icon">👤</div>
        <h3>Profile Settings</h3>
       <p>Update your personal information and preferences</p>
        <button className="card-button" onClick={() => navigate('/edit-profile')}>Edit Profile</button>
      </div>
     </div>

     <div className="dashboard-stats">
      <h3>Your Activity</h3>
       <div className="stats-grid">
       <div className="stat-item">
        <span className="stat-number">0</span>
         <span className="stat-label">Total Bookings</span>
       </div>
       <div className="stat-item">
        <span className="stat-number">0</span>
         <span className="stat-label">Favorite Properties</span>
       </div>
       <div className="stat-item">
        <span className="stat-number">0</span>
         <span className="stat-label">Reviews Written</span>
       </div>
      </div>
     </div>
    </div>
   </div>
 );
};

export default CustomerDashboard;
