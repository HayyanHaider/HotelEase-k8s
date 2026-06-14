const UserModel = require('../models/userModel');
const HotelModel = require('../models/hotelModel');

const addFavorite = async (req, res) => {
   try {
      const userId = req.user.userId;
    const { hotelId } = req.body;

      if (!hotelId) {
      return res.status(400).json({ success: false, message: 'hotelId is required' });
     }

    const hotel = await HotelModel.findById(hotelId).select('_id');
     if (!hotel) {
        return res.status(404).json({ success: false, message: 'Hotel not found' });
    }

      await UserModel.findByIdAndUpdate(
      userId,
       { $addToSet: { favorites: hotelId } },
        { new: true }
    );

      return res.json({ success: true, message: 'Added to favorites' });
  } catch (error) {
     console.error('addFavorite error:', error);
      return res.status(500).json({ success: false, message: 'Server error while adding favorite' });
  }
};

const removeFavorite = async (req, res) => {
   try {
      const userId = req.user.userId;
    const { hotelId } = req.params;

      if (!hotelId) {
      return res.status(400).json({ success: false, message: 'hotelId is required' });
     }

    await UserModel.findByIdAndUpdate(
       userId,
        { $pull: { favorites: hotelId } },
      { new: true }
     );

    return res.json({ success: true, message: 'Removed from favorites' });
   } catch (error) {
      console.error('removeFavorite error:', error);
    return res.status(500).json({ success: false, message: 'Server error while removing favorite' });
   }
};

const listFavorites = async (req, res) => {
    try {
    const userId = req.user.userId;
     const user = await UserModel.findById(userId).populate('favorites', 'name description address images rating totalReviews');
      if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
     }
      return res.json({ success: true, count: (user.favorites || []).length, favorites: user.favorites });
  } catch (error) {
     console.error('listFavorites error:', error);
      return res.status(500).json({ success: false, message: 'Server error while listing favorites' });
  }
};

module.exports = { addFavorite, removeFavorite, listFavorites };
