const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const BaseEntity = require('./BaseEntity');
const { getBaseUserPermissions } = require('./utils/RolePermissions');

class User extends BaseEntity {
  constructor(userData = {}) {
     super(userData);
      this.name = userData.name;
    this.email = userData.email;
     this.passwordHash = userData.passwordHash;
      this.phone = userData.phone || '';
    this.role = userData.role || 'customer';
     this.isVerified = userData.isVerified || false;
      this.isSuspended = userData.isSuspended || false;
    this.suspendedReason = userData.suspendedReason || '';
     this.suspendedAt = userData.suspendedAt || null;
      this.favorites = userData.favorites || [];
    this.walletBalance = userData.walletBalance || 0;
   }

  #validateEmail(email) {
     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
  }

    #validatePassword(password) {
    return password && password.length >= 6;
   }

  async hashPassword(password) {
     if (!this.#validatePassword(password)) {
        throw new Error('Password must be at least 6 characters long');
    }
     const saltRounds = 12;
      this.passwordHash = await bcrypt.hash(password, saltRounds);
  }

    async verifyPassword(password) {
    return await bcrypt.compare(password, this.passwordHash);
   }

  generateToken() {
     return jwt.sign(
        { userId: this.id, role: this.role },
      process.env.JWT_SECRET || 'your-secret-key',
       { expiresIn: '7d' }
      );
  }

    validate() {
    const errors = [];
    
      if (!this.name || this.name.trim().length === 0) {
      errors.push('Name is required');
     }
    
    if (!this.email || !this.#validateEmail(this.email)) {
       errors.push('Valid email is required');
      }
    
     return errors;
    }

   updateProfile(updates) {
      const allowedFields = ['name', 'phone'];
    
     allowedFields.forEach(field => {
        if (updates[field] !== undefined) {
        this[field] = updates[field];
       }
      });
    
     this.updatedAt = new Date();
    }

   suspend(reason) {
      this.isSuspended = true;
    this.suspendedReason = reason || '';
     this.suspendedAt = new Date();
      this.updatedAt = new Date();
  }

    unsuspend() {
    this.isSuspended = false;
     this.suspendedReason = '';
      this.suspendedAt = null;
    this.updatedAt = new Date();
   }

  verify() {
     this.isVerified = true;
      this.updatedAt = new Date();
  }

    getPublicInfo() {
    return {
       id: this.id,
        name: this.name,
      email: this.email,
       phone: this.phone,
        role: this.role,
      isVerified: this.isVerified,
       favorites: this.favorites,
        walletBalance: this.walletBalance || 0
    };
   }

  getSpecificCapabilities() {
     throw new Error('getSpecificCapabilities method must be implemented by child classes');
    }

   hasPermission(permission) {
      return getBaseUserPermissions().includes(permission);
  }
}

module.exports = User;
