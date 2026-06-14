import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import Navbar from './components/Navbar';
import ScrollToTop from './components/ScrollToTop';
import Signup from './components/Signup';
import Login from './components/Login';
import CustomerDashboard from './components/CustomerDashboard';
import AdminDashboard from './components/AdminDashboard';
import HotelDashboard from './components/HotelDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './components/Home';
import BrowseHotels from './components/BrowseHotels';
import HotelDetails from './components/HotelDetails';
import Favorites from './components/Favorites';
import CreateBooking from './components/CreateBooking';
import Payment from './components/Payment';
import BookingHistory from './components/BookingHistory';
import LeaveReview from './components/LeaveReview';
import RescheduleBooking from './components/RescheduleBooking';
import EditProfile from './components/EditProfile';
import ManageHotelProfile from './components/ManageHotelProfile';
import ManageCoupons from './components/ManageCoupons';
import OwnerBookingManagement from './components/OwnerBookingManagement';
import ReplyToReviews from './components/ReplyToReviews';
import EarningsDashboard from './components/EarningsDashboard';
import './App.css';

function AppContent() {
 const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
   const verifyStoredToken = async () => {
     const token = sessionStorage.getItem('token');
    const userData = sessionStorage.getItem('user');

     if (token && userData) {
      try {
         const response = await fetch('/api/auth/verify-token', {
          method: 'GET',
           headers: {
            'Authorization': `Bearer ${token}`,
             'Content-Type': 'application/json'
           }
         });

         if (!response.ok) {
          sessionStorage.removeItem('token');
           sessionStorage.removeItem('user');
          window.dispatchEvent(new Event('userStatusChanged'));
         } else {
          const data = await response.json();
           if (!data.success || !data.valid) {
            sessionStorage.removeItem('token');
             sessionStorage.removeItem('user');
            window.dispatchEvent(new Event('userStatusChanged'));
           } else {
             sessionStorage.setItem('user', JSON.stringify(data.user));
            window.dispatchEvent(new Event('userStatusChanged'));
           }
         }
       } catch (error) {
        console.error('Token verification error:', error);
       }
     }
     
    setIsVerifying(false);
   };

   verifyStoredToken();
  }, []);

  if (isVerifying) {
   return (
     <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
       </div>
     </div>
   );
  }

 return (
   <div className="app">
    <Navbar />
     <ToastContainer
      position="top-right"
       autoClose={3000}
      hideProgressBar={false}
       newestOnTop={false}
      closeOnClick
       rtl={false}
      pauseOnFocusLoss
       draggable
      pauseOnHover
       theme="light"
     />
     <Routes>
      <Route path="/" element={<BrowseHotels />} />
       <Route path="/home" element={<Home />} />
      <Route path="/signup" element={<Signup />} />
       <Route path="/login" element={<Login />} />
        
       <Route 
        path="/customer-dashboard" 
         element={
          <ProtectedRoute requiredRole="customer">
           <CustomerDashboard />
          </ProtectedRoute>
         } 
       />
      <Route path="/browse-hotels" element={<BrowseHotels />} />
       <Route path="/hotel/:hotelId" element={<HotelDetails />} />
      <Route 
        path="/favorites" 
         element={
          <ProtectedRoute requiredRole="customer">
           <Favorites />
          </ProtectedRoute>
         } 
       />
      <Route 
        path="/booking/:hotelId" 
         element={
          <ProtectedRoute requiredRole="customer">
           <CreateBooking />
          </ProtectedRoute>
         } 
       />
      <Route 
        path="/payment/:bookingId" 
         element={
          <ProtectedRoute requiredRole="customer">
           <Payment />
          </ProtectedRoute>
         } 
       />
      <Route 
        path="/booking-history" 
         element={
          <ProtectedRoute requiredRole="customer">
           <BookingHistory />
          </ProtectedRoute>
         } 
       />
      <Route 
        path="/review/:bookingId" 
         element={
          <ProtectedRoute requiredRole="customer">
           <LeaveReview />
          </ProtectedRoute>
         } 
       />
      <Route 
        path="/reschedule/:bookingId" 
         element={
          <ProtectedRoute requiredRole="customer">
           <RescheduleBooking />
          </ProtectedRoute>
         } 
       />
      <Route 
        path="/edit-profile" 
         element={
          <ProtectedRoute requiredRole="customer">
           <EditProfile />
          </ProtectedRoute>
         } 
       />
        
       <Route 
        path="/hotel-dashboard" 
         element={
          <ProtectedRoute requiredRole="hotel">
           <HotelDashboard />
          </ProtectedRoute>
         } 
       />
      <Route 
        path="/manage-hotel-profile" 
         element={
          <ProtectedRoute requiredRole="hotel">
           <HotelDashboard />
          </ProtectedRoute>
         } 
       />
      <Route 
        path="/manage-coupons" 
         element={
          <ProtectedRoute requiredRole="hotel">
           <HotelDashboard />
          </ProtectedRoute>
         } 
       />
      <Route 
        path="/owner-bookings" 
         element={
          <ProtectedRoute requiredRole="hotel">
           <HotelDashboard />
          </ProtectedRoute>
         } 
       />
      <Route 
        path="/reply-reviews" 
         element={
          <ProtectedRoute requiredRole="hotel">
           <HotelDashboard />
          </ProtectedRoute>
         } 
       />
      <Route 
        path="/earnings-dashboard" 
         element={
          <ProtectedRoute requiredRole="hotel">
           <HotelDashboard />
          </ProtectedRoute>
         } 
       />
        
       <Route 
        path="/admin-dashboard" 
         element={
          <ProtectedRoute requiredRole="admin">
           <AdminDashboard />
          </ProtectedRoute>
         } 
       />
     </Routes>
   </div>
  );
}

function App() {
 return (
   <Router>
    <ScrollToTop />
     <AppContent />
   </Router>
  );
}

export default App;
