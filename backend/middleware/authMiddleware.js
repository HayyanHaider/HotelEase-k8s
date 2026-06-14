const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const mongoose = require('mongoose');

const verifyToken = async (req, res, next) => {
    try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
      if (!token) {
      return res.status(401).json({
         success: false,
          message: 'Access denied. No token provided.'
      });
     }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
      console.log('Decoded token:', decoded);
    
     let userId = decoded.userId;
    
    if (typeof userId === 'string' && mongoose.Types.ObjectId.isValid(userId)) {
       userId = new mongoose.Types.ObjectId(userId);
      }
    
     const user = await User.findById(userId);
    
    console.log('Found user:', user ? user._id : 'NOT FOUND');
    
      if (!user) {
      return res.status(401).json({
         success: false,
          message: 'User not found. Token is no longer valid.'
      });
     }

    if (user.isSuspended) {
       return res.status(403).json({
          success: false,
        message: 'Account is suspended.'
       });
      }

     req.user = {
        userId: user._id.toString(),
      role: decoded.role
     };
      req.userData = user;
    
     next();
    } catch (error) {
    console.error('Token verification error:', error);
    
      if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
         success: false,
          message: 'Invalid token format.'
      });
     }
    
    if (error.name === 'TokenExpiredError') {
       return res.status(401).json({
          success: false,
        message: 'Token has expired.'
       });
      }
    
     res.status(401).json({
        success: false,
      message: 'Token verification failed.'
     });
    }
};

const authorize = (...roles) => {
  return (req, res, next) => {
     if (!req.user) {
        return res.status(401).json({
        success: false,
         message: 'Access denied. Please login first.'
        });
    }

      if (!roles.includes(req.user.role)) {
      return res.status(403).json({
         success: false,
          message: 'Access denied. Insufficient permissions.'
      });
     }

    next();
   };
};

const authorizeRoles = (roles) => {
    return (req, res, next) => {
    if (!req.user) {
       return res.status(401).json({
          success: false,
        message: 'Access denied. Please login first.'
       });
      }

     let userRole = req.user.role;
      if (userRole === 'hotel_owner' && roles.includes('hotel')) {
      userRole = 'hotel';
     }

    if (!roles.includes(userRole)) {
       return res.status(403).json({
          success: false,
        message: 'Access denied. Insufficient permissions.'
       });
      }

     next();
    };
};

module.exports = {
  authenticateToken: verifyToken,
   authorizeRoles,
    verifyToken,
  authorize
};
