import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requiredRole = null }) => {
 const token = sessionStorage.getItem('token');
  const userData = sessionStorage.getItem('user');
  
 if (!token || !userData) {
   return <Navigate to="/login" replace />;
  }
  
 if (requiredRole) {
   const user = JSON.parse(userData);
    if (requiredRole === 'hotel') {
     if (user.role !== 'hotel' && user.role !== 'hotel_owner') {
      return <Navigate to="/" replace />;
     }
    } else if (user.role !== requiredRole) {
     return <Navigate to="/" replace />;
    }
  }
  
 return children;
};

export default ProtectedRoute;
