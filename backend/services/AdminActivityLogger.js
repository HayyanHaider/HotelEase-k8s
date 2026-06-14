// Switched to use Admin model only; activity persistence removed as requested
const AdminModel = require('../models/adminModel');

class AdminActivityLogger {
   async log(adminId, action, targetType, targetId, description, metadata = {}) {
      try {
      // Validate admin exists; do not persist activity
       await AdminModel.findById(adminId).select('_id').lean().exec();
        return null;
    } catch (error) {
       console.error('Error validating admin during log:', error);
        return null;
    }
   }

  async getActivities({ action, targetType, page = 1, limit = 50 }) {
     return {
        activities: [],
      pagination: { total: 0, page: parseInt(page), limit: parseInt(limit), pages: 0 }
     };
    }

   async getRecentActivitiesByAdmin(adminId, limit = 10) {
      return [];
  }

    async getAdminStats(adminId) {
    return { totalActions: 0, actionBreakdown: [] };
   }
}

module.exports = new AdminActivityLogger();

