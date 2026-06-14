const BASE_USER_PERMISSIONS = Object.freeze([
   'view_profile',
    'update_profile'
]);

const CUSTOMER_PERMISSIONS = Object.freeze([
  'book_rooms',
   'cancel_bookings',
    'write_reviews',
  'add_favorites',
   'view_booking_history',
    'earn_loyalty_points'
]);

const HOTEL_OWNER_PERMISSIONS = Object.freeze([
  'manage_hotels',
   'add_hotels',
    'update_hotel_info',
  'manage_rooms',
   'view_bookings',
    'respond_to_reviews',
  'view_earnings',
   'manage_availability'
]);

const ADMIN_LEVEL_PERMISSIONS = Object.freeze({
    basic: Object.freeze([
    'view_users', 'suspend_users', 'verify_users',
     'view_hotels', 'approve_hotels', 'suspend_hotels',
      'view_bookings', 'cancel_bookings', 'refund_bookings',
    'view_reports', 'generate_reports'
   ]),
    senior: Object.freeze([
    'view_users', 'suspend_users', 'verify_users',
     'view_hotels', 'approve_hotels', 'suspend_hotels',
      'view_bookings', 'cancel_bookings', 'refund_bookings',
    'view_reports', 'generate_reports',
     'delete_users', 'delete_hotels', 'manage_admins',
      'view_financials', 'manage_commissions'
  ]),
   super: Object.freeze([
      'view_users', 'suspend_users', 'verify_users',
    'view_hotels', 'approve_hotels', 'suspend_hotels',
     'view_bookings', 'cancel_bookings', 'refund_bookings',
      'view_reports', 'generate_reports',
    'delete_users', 'delete_hotels', 'manage_admins',
     'view_financials', 'manage_commissions',
      'system_settings', 'backup_data', 'restore_data',
    'manage_permissions', 'view_audit_logs'
   ])
});

const getBaseUserPermissions = () => BASE_USER_PERMISSIONS;

const getCustomerPermissions = () => CUSTOMER_PERMISSIONS;

const getHotelOwnerPermissions = () => HOTEL_OWNER_PERMISSIONS;

const getAdminPermissionsByLevel = (level = 'basic') => {
    return ADMIN_LEVEL_PERMISSIONS[level] || ADMIN_LEVEL_PERMISSIONS.basic;
};

module.exports = {
  getBaseUserPermissions,
   getCustomerPermissions,
    getHotelOwnerPermissions,
  getAdminPermissionsByLevel
};

