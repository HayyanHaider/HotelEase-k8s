const BaseService = require('./BaseService');
const IAuthenticationService = require('./interfaces/IAuthenticationService');
const UserRepository = require('../repositories/UserRepository');
const User = require('../classes/User');

class AuthenticationService extends BaseService {
  constructor(dependencies = {}) {
     super(dependencies);
      this.userRepository = dependencies.userRepository || UserRepository;
  }

    async register(userData) {
    try {
       this.validateRequired(userData, ['name', 'email', 'password']);

      const existingUser = await this.userRepository.findByEmail(userData.email);
       if (existingUser) {
          throw new Error('User with this email already exists');
      }

        const user = new User({
        name: userData.name,
         email: userData.email,
          phone: userData.phone || '',
        role: userData.role || 'customer'
       });

      const validationErrors = user.validate();
       if (validationErrors.length > 0) {
          throw new Error(validationErrors.join(', '));
      }

        await user.hashPassword(userData.password);

       const savedUser = await this.userRepository.create({
          name: user.name,
        email: user.email,
         passwordHash: user.passwordHash,
          phone: user.phone,
        role: user.role,
         isVerified: user.isVerified,
          isSuspended: user.isSuspended,
        favorites: user.favorites,
         walletBalance: user.walletBalance
        });

       user.id = savedUser._id || savedUser.id;

      const token = user.generateToken();

        return {
        user: user.getPublicInfo(),
         token
        };
    } catch (error) {
       this.handleError(error, 'Registration failed');
      }
  }

    async login(email, password) {
    try {
       if (!email || !password) {
          throw new Error('Email and password are required');
      }

        const userData = await this.userRepository.findByEmail(email);
      if (!userData) {
         throw new Error('Invalid email or password');
        }

       const user = new User({
          ...userData,
        id: userData._id || userData.id,
         _id: userData._id
        });

       if (user.isSuspended) {
          throw new Error('Account is suspended. Please contact support.');
      }

        const isPasswordValid = await user.verifyPassword(password);
      if (!isPasswordValid) {
         throw new Error('Invalid email or password');
        }

       const token = user.generateToken();

      console.log('Login successful - User ID:', user.id, 'Type:', typeof user.id);

        return {
        user: user.getPublicInfo(),
         token
        };
    } catch (error) {
       this.handleError(error, 'Login failed');
      }
  }

    async verifyToken(token) {
    try {
       const jwt = require('jsonwebtoken');
        const secret = process.env.JWT_SECRET || 'your-secret-key';
      
       const decoded = jwt.verify(token, secret);
      
      const userData = await this.userRepository.findById(decoded.userId);
       if (!userData) {
          throw new Error('User not found');
      }

        if (userData.isSuspended) {
        throw new Error('User account is suspended');
       }

      return {
         userId: decoded.userId,
          role: decoded.role,
        user: userData
       };
      } catch (error) {
      if (error.name === 'JsonWebTokenError') {
         throw new Error('Invalid token');
        }
      if (error.name === 'TokenExpiredError') {
         throw new Error('Token has expired');
        }
      this.handleError(error, 'Token verification failed');
     }
    }

   generateToken(user) {
      if (!user || !user.id) {
      throw new Error('User object with id is required');
     }

    const jwt = require('jsonwebtoken');
     const secret = process.env.JWT_SECRET || 'your-secret-key';

    return jwt.sign(
       { userId: user.id, role: user.role },
        secret,
      { expiresIn: '7d' }
     );
    }
}

module.exports = new AuthenticationService();
