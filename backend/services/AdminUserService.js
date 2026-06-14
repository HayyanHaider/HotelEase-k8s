const UserModel = require('../models/userModel');
const HotelModel = require('../models/hotelModel');
const BookingModel = require('../models/bookingModel');
const ReviewModel = require('../models/reviewsModel');
const BaseService = require('./BaseService');
const AdminActivityLogger = require('./AdminActivityLogger');
const { sendEmail, emailTemplates } = require('../utils/emailService');

class AdminUserService extends BaseService {
  async getUsers({ role, status, search, page = 1, limit = 50 }) {
     const skip = (page - 1) * limit;
      const query = this._buildUserQuery(role, status, search);

     const users = await UserModel.find(query)
        .select('-passwordHash')
      .sort({ createdAt: -1 })
       .limit(parseInt(limit))
        .skip(skip)
      .lean();

      const enrichedUsers = await this._enrichUsersWithStats(users);

     const total = await UserModel.countDocuments(query);

    return {
       users: enrichedUsers,
        pagination: {
        total,
         page: parseInt(page),
          limit: parseInt(limit),
        pages: Math.ceil(total / limit)
       }
      };
  }

    async suspendUser(userId, adminId, reason = '') {
    const user = await UserModel.findByIdAndUpdate(
       userId,
        {
        isSuspended: true,
         suspendedReason: reason,
          suspendedAt: new Date()
      },
       { new: true }
      ).select('-passwordHash');

     if (!user) {
        throw new Error('User not found');
    }

      await AdminActivityLogger.log(
      adminId,
       'user_suspended',
        'user',
      userId,
       `Suspended user: ${user.name} (${user.email})`,
        { userName: user.name, userEmail: user.email, reason }
    );

      try {
      if (user.email) {
         const emailTemplate = emailTemplates.userSuspensionEmail(user, reason);
        
        await sendEmail(
           user.email,
            emailTemplate.subject,
          emailTemplate.html,
           emailTemplate.text
          );
        
         console.log(`✅ User suspension email sent to: ${user.email}`);
        } else {
        console.warn(`⚠️  Could not send suspension email - user email not found for user: ${user.name}`);
       }
      } catch (emailError) {
      console.error('❌ Error sending user suspension email:', emailError);
     }

    return user;
   }

  async unsuspendUser(userId, adminId) {
     const user = await UserModel.findByIdAndUpdate(
        userId,
      {
         isSuspended: false,
          suspendedReason: '',
        suspendedAt: null
       },
        { new: true }
    ).select('-passwordHash');

      if (!user) {
      throw new Error('User not found');
     }

    await AdminActivityLogger.log(
       adminId,
        'user_unsuspended',
      'user',
       userId,
        `Unsuspended user: ${user.name} (${user.email})`,
      { userName: user.name, userEmail: user.email }
     );

    return user;
   }

  _buildUserQuery(role, status, search) {
     const query = { role: { $in: ['customer', 'hotel'] } };

    if (role && ['customer', 'hotel'].includes(role)) {
       query.role = role;
      }

     if (status === 'active') {
        query.isSuspended = false;
    } else if (status === 'suspended') {
       query.isSuspended = true;
      }

     if (search) {
        query.$or = [
        { name: { $regex: search, $options: 'i' } },
         { email: { $regex: search, $options: 'i' } }
        ];
    }

      return query;
  }

    async _enrichUsersWithStats(users) {
    if (users.length === 0) return [];

      const userIds = users.map(u => u._id);
    const hotelIds = users.filter(u => u.role === 'hotel').map(u => u._id);

      const [hotelStats, bookingStats, reviewStats] = await Promise.all([
      hotelIds.length > 0 
         ? HotelModel.aggregate([
              { $match: { ownerId: { $in: hotelIds } } },
            { $group: { _id: '$ownerId', count: { $sum: 1 } } }
           ])
          : [],
      
       BookingModel.aggregate([
          { $match: { userId: { $in: userIds } } },
        { $group: { _id: '$userId', count: { $sum: 1 } } }
       ]),
      
      ReviewModel.aggregate([
         { $match: { userId: { $in: userIds } } },
          { $group: { _id: '$userId', count: { $sum: 1 } } }
      ])
     ]);

    const hotelMap = new Map(hotelStats.map(s => [s._id.toString(), s.count]));
     const bookingMap = new Map(bookingStats.map(s => [s._id.toString(), s.count]));
      const reviewMap = new Map(reviewStats.map(s => [s._id.toString(), s.count]));

     return users.map(user => ({
        ...user,
      stats: {
         hotelCount: user.role === 'hotel' ? (hotelMap.get(user._id.toString()) || 0) : 0,
          bookingCount: bookingMap.get(user._id.toString()) || 0,
        reviewCount: reviewMap.get(user._id.toString()) || 0
       }
      }));
  }
}

module.exports = new AdminUserService();

