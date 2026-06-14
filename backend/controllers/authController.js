const BaseController = require('./BaseController');
const AuthenticationService = require('../services/AuthenticationService');
const UserRepository = require('../repositories/UserRepository');
const User = require('../classes/User');
const Customer = require('../classes/Customer');
const HotelOwner = require('../classes/HotelOwner');
const Admin = require('../classes/Admin');
const { sendEmail, emailTemplates } = require('../utils/emailService');

class AuthController extends BaseController {
   constructor() {
      super();
    this.authService = AuthenticationService;
     this.userRepository = UserRepository;
    }

   createUserInstance(userData) {
      switch (userData.role) {
      case 'customer':
         return new Customer(userData);
        case 'hotel':
        return new HotelOwner(userData);
       case 'admin':
          return new Admin(userData);
      default:
         return new Customer(userData);
      }
  }

    signup = async (req, res) => {
    try {
       const { name, email, password, phone, role } = req.body;

      if (!name || !email || !password) {
         return this.fail(res, 400, 'Name, email, and password are required');
        }

       if (password.length < 6) {
          return this.fail(res, 400, 'Password must be at least 6 characters long');
      }

        const validRoles = ['customer', 'hotel', 'admin'];
      const userRole = role || 'customer';
       if (!validRoles.includes(userRole)) {
          return this.fail(res, 400, `Invalid role. Must be one of: ${validRoles.join(', ')}`);
      }

        const trimmedName = name?.trim() || '';
      const trimmedEmail = email?.trim().toLowerCase() || '';
       const trimmedPhone = phone?.trim() || '';

      if (!trimmedName || !trimmedEmail) {
         return this.fail(res, 400, 'Name and email are required');
        }

       const result = await this.authService.register({
          name: trimmedName,
        email: trimmedEmail,
         password,
          phone: trimmedPhone,
        role: userRole
       });

      if (result.user.role === 'customer') {
         const CustomerModel = require('../models/customerModel');
          const existingCustomer = await CustomerModel.findOne({ user: result.user.id });
        if (!existingCustomer) {
           await CustomerModel.create({
              user: result.user.id,
            loyaltyPoints: 0,
             bookingHistory: [],
              reviewsGiven: []
          });
         }
        }

       sendEmail(
          result.user.email,
        emailTemplates.accountCreatedEmail({ name: result.user.name, email: result.user.email }, result.user.role).subject,
         emailTemplates.accountCreatedEmail({ name: result.user.name, email: result.user.email }, result.user.role).html,
          emailTemplates.accountCreatedEmail({ name: result.user.name, email: result.user.email }, result.user.role).text
      ).catch(err => console.error('Email send error:', err));

        return this.created(res, {
        message: 'User created successfully',
         token: result.token,
          user: result.user
      });

      } catch (error) {
      console.error('Signup error:', error);
      
        if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(err => err.message);
         return this.fail(res, 400, validationErrors.join(', '));
        }
      
       if (error.code === 11000 || error.message.includes('already exists')) {
          return this.fail(res, 400, 'User already exists with this email');
      }
      
        return this.fail(res, 500, error.message || 'Server error during signup');
    }
   };

  login = async (req, res) => {
     try {
        const { email, password } = req.body;
        console.log('Login attempt for email:', email);

       if (!email || !password) {
          console.log('Missing credentials');
          return this.fail(res, 400, 'Email and password are required');
      }

        const result = await this.authService.login(email, password);
        console.log('Login successful for:', email);

       return this.ok(res, {
          message: 'Login successful',
        token: result.token,
         user: result.user
        });

     } catch (error) {
        console.error('Login error:', error.message);
      const status = error.message.includes('Invalid') || error.message.includes('suspended') ? 401 : 500;
       return this.fail(res, status, error.message || 'Server error during login');
      }
  };

    getProfile = async (req, res) => {
    try {
       const userData = await this.userRepository.findById(req.user.userId);
      
      if (!userData) {
         return this.fail(res, 404, 'User not found');
        }

       const userInstance = this.createUserInstance(userData);

      return this.ok(res, {
         user: userInstance.getPublicInfo()
        });

     } catch (error) {
        console.error('Get profile error:', error);
      return this.fail(res, 500, 'Server error while fetching profile');
     }
    };

   verifyTokenController = async (req, res) => {
      try {
      const userData = await this.userRepository.findById(req.user.userId);
      
        if (!userData) {
        return this.fail(res, 404, 'User not found');
       }

      if (userData.isSuspended) {
         return this.fail(res, 403, 'Account is suspended');
        }

       const userInstance = this.createUserInstance(userData);

      return this.ok(res, {
         valid: true,
          user: userInstance.getPublicInfo()
      });

      } catch (error) {
      console.error('Verify token error:', error);
       return this.fail(res, 500, 'Server error while verifying token');
      }
  };

    updateProfile = async (req, res) => {
    try {
       const { name, phone } = req.body;
        const userId = req.user.userId;

       const userData = await this.userRepository.findById(userId);
      
      if (!userData) {
         return this.fail(res, 404, 'User not found');
        }

       const updates = {};
        if (name !== undefined) {
        const trimmedName = name.trim();
         if (trimmedName.length < 2) {
            return this.fail(res, 400, 'Name must be at least 2 characters long');
        }
         updates.name = trimmedName;
        }

       if (phone !== undefined) {
          updates.phone = phone.trim();
      }

        const updatedUser = await this.userRepository.updateById(userId, updates);
      const userInstance = this.createUserInstance(updatedUser);

        return this.ok(res, {
        message: 'Profile updated successfully',
         user: userInstance.getPublicInfo()
        });

     } catch (error) {
        console.error('Update profile error:', error);
      return this.fail(res, 500, 'Server error while updating profile');
     }
    };
}

const authController = new AuthController();

module.exports = {
    signup: authController.signup,
  login: authController.login,
   getProfile: authController.getProfile,
    verifyTokenController: authController.verifyTokenController,
  updateProfile: authController.updateProfile
};
