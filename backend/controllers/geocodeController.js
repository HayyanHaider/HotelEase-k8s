const BaseController = require('./BaseController');
const axios = require('axios');

class GeocodeController extends BaseController {
  constructor() {
    super();
  }

  geocodeAddress = async (req, res) => {
    try {
      const { address } = req.query;

      if (!address) {
        return this.fail(res, 400, 'Address is required');
      }

      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          format: 'json',
          q: address,
          limit: 1
        },
        headers: {
          'User-Agent': 'BookSmartClone/1.0',
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      return this.ok(res, {
        results: response.data
      });

    } catch (error) {
      console.error('Geocoding error:', error.message);
      
      if (error.response?.status === 429) {
        return this.fail(res, 429, 'Rate limit exceeded. Please try again later.');
      }
      
      return this.fail(res, 500, error.message || 'Geocoding failed');
    }
  };

  reverseGeocode = async (req, res) => {
    try {
      const { lat, lon } = req.query;

      if (!lat || !lon) {
        return this.fail(res, 400, 'Latitude and longitude are required');
      }

      const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
        params: {
          format: 'json',
          lat,
          lon
        },
        headers: {
          'User-Agent': 'BookSmartClone/1.0',
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      return this.ok(res, {
        result: response.data
      });

    } catch (error) {
      console.error('Reverse geocoding error:', error.message);
      
      if (error.response?.status === 429) {
        return this.fail(res, 429, 'Rate limit exceeded. Please try again later.');
      }
      
      return this.fail(res, 500, error.message || 'Reverse geocoding failed');
    }
  };
}

module.exports = new GeocodeController();
