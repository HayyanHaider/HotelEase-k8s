const BaseController = require('./BaseController');
const EarningsService = require('../services/EarningsService');

class EarningsController extends BaseController {
   constructor() {
      super();
    this.earningsService = EarningsService;
   }

  getEarningsDashboard = async (req, res) => {
     try {
        const ownerId = req.user.userId;
      const { period = 'month' } = req.query;

        const earnings = await this.earningsService.getEarningsDashboard(ownerId, period);
      
       return this.ok(res, { earnings });
      } catch (error) {
      console.error('Get earnings dashboard error:', error);
       return this.fail(res, 500, error.message || 'Server error while fetching earnings dashboard');
      }
  };

    getEarningsByHotel = async (req, res) => {
    try {
       const ownerId = req.user.userId;
        const { hotelId } = req.params;
      const { period = 'month' } = req.query;

        const hotel = await this.earningsService.getEarningsByHotel(ownerId, hotelId, period);
      
       return this.ok(res, { hotel });
      } catch (error) {
      console.error('Get earnings by hotel error:', error);
       const statusCode = error.message.includes('not found') || 
                          error.message.includes('permission') ? 404 : 500;
      return this.fail(res, statusCode, error.message || 'Server error while fetching hotel earnings');
     }
    };
}

module.exports = new EarningsController();
