import { Component } from 'react';

class BaseComponent extends Component {
 handleError(error, onError) {
  const message = error.message || 'An error occurred';
   console.error('Component error:', error);
  
  if (onError && typeof onError === 'function') {
   onError(message);
  }
 }

  hasRole(requiredRole) {
   const user = JSON.parse(sessionStorage.getItem('user') || 'null');
    return user && user.role === requiredRole;
  }

 isAuthenticated() {
  return !!sessionStorage.getItem('token');
 }
}

export default BaseComponent;

