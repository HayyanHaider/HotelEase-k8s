import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import HotelApiService from '../services/api/HotelApiService';
import ManageHotelProfile from './ManageHotelProfile';
import ManageCoupons from './ManageCoupons';
import OwnerBookingManagement from './OwnerBookingManagement';
import ReplyToReviews from './ReplyToReviews';
import EarningsDashboard from './EarningsDashboard';
import './HotelDashboard.css';

const HotelDashboard = () => {
 const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
 const [activeSection, setActiveSection] = useState('home');
  const [loading, setLoading] = useState(false);
 const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobileSidebarLayout, setIsMobileSidebarLayout] = useState(
    typeof window !== 'undefined'
      ? window.innerWidth <= 1200 || window.matchMedia('(hover: none) and (pointer: coarse)').matches
      : false
  );
  const navigate = useNavigate();
 const location = useLocation();

  useEffect(() => {
   const path = location.pathname;
    const normalizedPath = path.endsWith('/') ? path.slice(0, -1) : path;
    
   if (normalizedPath === '/hotel-dashboard' || normalizedPath === '/') {
     setActiveSection('home');
    } else if (normalizedPath === '/manage-hotel-profile') {
     setActiveSection('properties');
    } else if (normalizedPath === '/manage-coupons') {
     setActiveSection('coupons');
    } else if (normalizedPath === '/owner-bookings') {
     setActiveSection('bookings');
    } else if (normalizedPath === '/reply-reviews') {
     setActiveSection('reviews');
    } else if (normalizedPath === '/earnings-dashboard') {
     setActiveSection('earnings');
    }
  }, [location.pathname]);

 useEffect(() => {
   const token = sessionStorage.getItem('token');
    const userData = sessionStorage.getItem('user');
    
   if (!token || !userData) {
     navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
   if (parsedUser.role !== 'hotel' && parsedUser.role !== 'hotel_owner') {
     navigate('/login');
      return;
    }

    setUser(parsedUser);
   fetchDashboardStats();

    const handleResetDashboard = () => {
     setActiveSection('home');
    };

    window.addEventListener('resetHotelDashboard', handleResetDashboard);

    return () => {
     window.removeEventListener('resetHotelDashboard', handleResetDashboard);
    };
  }, [navigate]);

 useEffect(() => {
   if (typeof window !== 'undefined') {
     window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, [activeSection]);

  const fetchDashboardStats = async () => {
   try {
     setLoading(true);
     
     const token = sessionStorage.getItem('token');
    if (!token) {
     navigate('/login');
      return;
    }
    
    const hotelsResponse = await HotelApiService.getOwnerHotels();

     const bookingsResponse = await axios.get('/api/owner/bookings', {
      headers: { Authorization: `Bearer ${token}` }
     });

    let earningsData = { total: 0, monthly: 0 };
   try {
     const earningsResponse = await axios.get('/api/earnings/dashboard?period=month', {
      headers: { Authorization: `Bearer ${token}` }
     });
    
    if (earningsResponse.data.success && earningsResponse.data.earnings) {
     earningsData = {
      total: parseFloat(earningsResponse.data.earnings.totalEarnings || 0),
       monthly: parseFloat(earningsResponse.data.earnings.periodEarnings || 0)
     };
    }
   } catch (earningsError) {
    console.error('Error fetching earnings:', earningsError);
   }

    if (hotelsResponse.success && bookingsResponse.data.success) {
     const hotels = hotelsResponse.hotels || [];
      const bookings = bookingsResponse.data.bookings || [];
    
    const activeHotels = hotels.filter(h => h.isApproved && !h.isSuspended);
     const pendingHotels = hotels.filter(h => !h.isApproved && !h.isSuspended);
    const activeBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'active');
     const pendingBookings = bookings.filter(b => b.status === 'pending');

     setStats({
      hotels: {
       total: hotels.length,
        active: activeHotels.length,
       pending: pendingHotels.length
      },
       bookings: {
      total: bookings.length,
       active: activeBookings.length,
      pending: pendingBookings.length
     },
      earnings: earningsData
    });
   }
  } catch (error) {
   console.error('Error fetching dashboard stats:', error);
    if (error.message.includes('Token') || error.message.includes('401')) {
     toast.error('Session expired. Please login again.');
      sessionStorage.clear();
     navigate('/login');
    } else {
     toast.error('Failed to load dashboard statistics');
    }
  } finally {
   setLoading(false);
  }
 };

 const changeSection = (section) => {
   setActiveSection(section);
    if (isMobileSidebarLayout) {
      setMobileMenuOpen(false);
    }
    const pathMap = {
    'home': '/hotel-dashboard',
     'properties': '/manage-hotel-profile',
    'coupons': '/manage-coupons',
     'bookings': '/owner-bookings',
    'reviews': '/reply-reviews',
     'earnings': '/earnings-dashboard'
   };
   if (pathMap[section]) {
    navigate(pathMap[section], { replace: false });
   }
  };

 useEffect(() => {
   if (typeof window === 'undefined') return;

   const handleResize = () => {
    const isTouchLayout = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    const mobileMode = window.innerWidth <= 1200 || isTouchLayout;
    setIsMobileSidebarLayout(mobileMode);
    if (!mobileMode) {
      setMobileMenuOpen(false);
    }
   };

   handleResize();
   window.addEventListener('resize', handleResize);

   return () => {
    window.removeEventListener('resize', handleResize);
   };
  }, []);

 useEffect(() => {
   if (isMobileSidebarLayout && mobileMenuOpen) {
    document.body.style.overflow = 'hidden';
   } else {
    document.body.style.overflow = '';
   }

   return () => {
    document.body.style.overflow = '';
   };
  }, [isMobileSidebarLayout, mobileMenuOpen]);

  if (!user) {
   return <div className="owner-loading">Loading...</div>;
  }

 return (
   <div className={`owner-dashboard ${isMobileSidebarLayout ? 'mobile-sidebar-layout' : ''}`}>
    <div className="owner-mobile-nav">
     <button
      type="button"
      className={`owner-menu-toggle ${mobileMenuOpen ? 'open' : ''}`}
      onClick={() => setMobileMenuOpen((prev) => !prev)}
      aria-label="Toggle sidebar menu"
      aria-expanded={mobileMenuOpen}
     >
      <span></span>
      <span></span>
      <span></span>
     </button>
     <span className="owner-mobile-nav-title">Menu</span>
    </div>

    {mobileMenuOpen && isMobileSidebarLayout && (
     <div
      className="owner-sidebar-backdrop"
      onClick={() => setMobileMenuOpen(false)}
     />
    )}

 <div className={`owner-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
  <nav className="owner-nav">
   <button 
    className={activeSection === 'home' ? 'active' : ''}
     onClick={() => changeSection('home')}
  >
  🏠 Home
 </button>
 <button 
  className={activeSection === 'properties' ? 'active' : ''}
   onClick={() => changeSection('properties')}
>
🏨 My Properties
</button>
<button 
 className={activeSection === 'coupons' ? 'active' : ''}
  onClick={() => changeSection('coupons')}
>
🎫 Coupons
</button>
<button 
 className={activeSection === 'bookings' ? 'active' : ''}
  onClick={() => changeSection('bookings')}
>
📋 Reservations
</button>
<button 
 className={activeSection === 'reviews' ? 'active' : ''}
  onClick={() => changeSection('reviews')}
>
⭐ Reviews
</button>
<button 
 className={activeSection === 'earnings' ? 'active' : ''}
  onClick={() => changeSection('earnings')}
>
💰 Earnings
</button>
</nav>
</div>

<div className="owner-main">
 <div className="owner-header">
  <h1>
   {activeSection === 'home' && 'Home Dashboard'}
    {activeSection === 'properties' && 'My Properties'}
   {activeSection === 'coupons' && 'Manage Coupons'}
    {activeSection === 'bookings' && 'Reservations'}
   {activeSection === 'reviews' && 'Reviews & Ratings'}
    {activeSection === 'earnings' && 'Earnings Dashboard'}
  </h1>
 </div>

 {activeSection === 'home' && (
  <div className="owner-overview">
   <div className="stats-grid">
    <div className="stat-card">
     <div className="stat-icon">🏨</div>
      <div className="stat-info">
      <h3>{stats?.hotels?.total || 0}</h3>
       <p>Total Properties</p>
      <span className="stat-detail">{stats?.hotels?.active || 0} active</span>
     </div>
    </div>

    <div className="stat-card">
     <div className="stat-icon">⏳</div>
      <div className="stat-info">
      <h3>{stats?.hotels?.pending || 0}</h3>
       <p>Pending Approval</p>
      <span className="stat-detail">Awaiting admin review</span>
     </div>
    </div>

    <div className="stat-card">
     <div className="stat-icon">📅</div>
      <div className="stat-info">
      <h3>{stats?.bookings?.total || 0}</h3>
       <p>Total Bookings</p>
      <span className="stat-detail">{stats?.bookings?.active || 0} active</span>
     </div>
    </div>

    <div className="stat-card">
     <div className="stat-icon">🔄</div>
      <div className="stat-info">
      <h3>{stats?.bookings?.pending || 0}</h3>
       <p>Pending Requests</p>
      <span className="stat-detail">Awaiting confirmation</span>
     </div>
    </div>

    <div className="stat-card" style={{backgroundColor: '#f0f9ff', border: '2px solid #0ea5e9'}}>
     <div className="stat-icon" style={{color: '#0ea5e9'}}>💰</div>
      <div className="stat-info">
      <h3 style={{whiteSpace: 'nowrap', fontSize: '1.5rem', color: '#0ea5e9', fontWeight: 'bold'}}>
       PKR {(stats?.earnings?.total || 0).toFixed(2)}
      </h3>
      <p style={{fontWeight: '600'}}>Total Earnings</p>
       <span className="stat-detail" style={{whiteSpace: 'nowrap', fontSize: '0.85rem', color: '#0284c7'}}>
      PKR {(stats?.earnings?.monthly || 0).toFixed(2)} this month
     </span>
    </div>
   </div>
  </div>

  <div className="quick-actions">
   <h3>Quick Actions</h3>
    <div className="action-buttons">
    <button onClick={() => changeSection('properties')} className="action-btn">
     <span>🏨</span>
      <div>
     <strong>Manage Properties</strong>
      <small>View and edit your hotels</small>
     </div>
    </button>
    <button onClick={() => changeSection('coupons')} className="action-btn">
     <span>🎫</span>
      <div>
     <strong>Manage Coupons</strong>
      <small>Create discount codes</small>
     </div>
    </button>
    <button onClick={() => changeSection('bookings')} className="action-btn">
     <span>📋</span>
      <div>
     <strong>View Reservations</strong>
      <small>{stats?.bookings?.pending || 0} pending</small>
     </div>
    </button>
    <button onClick={() => changeSection('earnings')} className="action-btn">
     <span>💰</span>
      <div>
     <strong>View Earnings</strong>
      <small>Track your income</small>
     </div>
    </button>
   </div>
  </div>
 </div>
)}

{activeSection === 'properties' && (
 <div className="owner-section">
  <ManageHotelProfile />
 </div>
)}

{activeSection === 'coupons' && (
 <div className="owner-section">
  <ManageCoupons />
 </div>
)}

{activeSection === 'bookings' && (
 <div className="owner-section">
  <OwnerBookingManagement />
 </div>
)}

{activeSection === 'reviews' && (
 <div className="owner-section">
  <ReplyToReviews />
 </div>
)}

{activeSection === 'earnings' && (
 <div className="owner-section">
  <EarningsDashboard />
 </div>
)}
</div>
</div>
);
};

export default HotelDashboard;
