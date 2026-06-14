import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Dashboard.css';

const ManageCoupons = () => {
 const navigate = useNavigate();
  const [hotels, setHotels] = useState([]);
 const [selectedHotel, setSelectedHotel] = useState('');
  const [coupons, setCoupons] = useState([]);
 const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
 const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState({
  hotelId: '',
   code: '',
  discountPercentage: '',
   validFrom: '',
  validTo: '',
   maxUses: ''
 });

  useEffect(() => {
   fetchHotels();
  }, []);

 useEffect(() => {
   if (selectedHotel) {
     fetchCoupons();
    }
  }, [selectedHotel]);

  const fetchHotels = async () => {
   try {
     setLoading(true);
    const token = sessionStorage.getItem('token');

     const response = await axios.get('/api/hotels/owner/my-hotels', {
      headers: { Authorization: `Bearer ${token}` }
     });

     if (response.data.success) {
      const userHotels = (response.data.hotels || []).filter(hotel => !hotel.isSuspended);
       setHotels(userHotels);
      if (userHotels.length > 0) {
       const firstHotelId = userHotels[0]._id || userHotels[0].id;
        setSelectedHotel(firstHotelId);
       setFormData(prev => ({...prev, hotelId: firstHotelId}));
      }
     }
   } catch (error) {
    console.error('Error fetching hotels:', error);
     setHotels([]);
   } finally {
    setLoading(false);
   }
  };

  const fetchCoupons = async () => {
   try {
     const token = sessionStorage.getItem('token');
      const response = await axios.get(`/api/coupons/hotel/${selectedHotel}`, {
       headers: { Authorization: `Bearer ${token}` }
     });

     if (response.data.success) {
      setCoupons(response.data.coupons || []);
     }
   } catch (error) {
    console.error('Error fetching coupons:', error);
   }
  };

 const handleSubmit = async (e) => {
   e.preventDefault();
    
   const hotelId = formData.hotelId || selectedHotel;
    
   if (!hotelId) {
     toast.warning('Please select a hotel');
      return;
    }
    
   if (!formData.code || !formData.discountPercentage || !formData.validFrom || !formData.validTo) {
     toast.warning('Please fill in all required fields');
      return;
    }

    try {
     const token = sessionStorage.getItem('token');
     
     const couponData = {
      hotelId: hotelId,
       code: formData.code,
     discountPercentage: parseFloat(formData.discountPercentage),
      validFrom: formData.validFrom,
       validTo: formData.validTo,
     maxUses: formData.maxUses ? parseInt(formData.maxUses) : null
     };
     
    console.log('Sending coupon data:', couponData);
    
    if (editingCoupon) {
     await axios.put(
      `/api/coupons/${editingCoupon._id || editingCoupon.id}`,
       couponData,
     {
       headers: { Authorization: `Bearer ${token}` }
      }
    );
     toast.success('Coupon updated successfully!');
    } else {
     await axios.post(
      '/api/coupons',
       couponData,
     {
       headers: { Authorization: `Bearer ${token}` }
      }
    );
     toast.success('Coupon created successfully!');
    }
    
    setShowForm(false);
     setEditingCoupon(null);
    setFormData({
     hotelId: selectedHotel,
      code: '',
     discountPercentage: '',
      validFrom: '',
     validTo: '',
      maxUses: ''
    });
    fetchCoupons();
   } catch (error) {
    console.error('Error saving coupon:', error);
     toast.error(error.response?.data?.message || 'Error saving coupon');
   }
  };

  const handleEdit = (coupon) => {
   setEditingCoupon(coupon);
    setFormData({
    hotelId: coupon.hotelId || selectedHotel,
     code: coupon.code || '',
    discountPercentage: coupon.discountPercentage || '',
     validFrom: coupon.validFrom ? new Date(coupon.validFrom).toISOString().split('T')[0] : '',
    validTo: coupon.validTo ? new Date(coupon.validTo).toISOString().split('T')[0] : '',
     maxUses: coupon.maxUses || ''
   });
   setShowForm(true);
  };

 const handleDelete = async (couponId) => {
   if (!window.confirm('Are you sure you want to delete this coupon?')) {
     return;
    }

    try {
     const token = sessionStorage.getItem('token');
      await axios.delete(`/api/coupons/${couponId}`, {
       headers: { Authorization: `Bearer ${token}` }
     });
    toast.success('Coupon deleted successfully!');
     fetchCoupons();
   } catch (error) {
    console.error('Error deleting coupon:', error);
     toast.error(error.response?.data?.message || 'Error deleting coupon');
   }
  };

  if (loading) {
   return <div className="dashboard-container text-center">Loading...</div>;
  }

 return (
   <div className="dashboard-container">
    <div className="dashboard-header">
     <div className="d-flex justify-content-between align-items-center mb-3">
      <div>
       <h1>Manage Coupons</h1>
        <p>Create and manage discount coupons for your hotels</p>
      </div>
      <button 
       className="btn btn-outline-secondary"
        onClick={() => navigate('/hotel-dashboard')}
      style={{ height: 'fit-content' }}
     >
      ← Go Back
     </button>
     </div>
    </div>

    <div className="container">
     <div className="mb-3">
      <label className="form-label">Select Hotel</label>
       <select
        className="form-select"
         value={selectedHotel}
      onChange={(e) => {
       const hotelId = e.target.value;
        setSelectedHotel(hotelId);
       setFormData(prev => ({...prev, hotelId: hotelId}));
      }}
     >
      <option value="">-- Select a Hotel --</option>
       {hotels.map((hotel) => (
        <option key={hotel._id || hotel.id} value={hotel._id || hotel.id}>
         {hotel.name}
        </option>
       ))}
     </select>
    </div>

    <button
     className="btn btn-primary mb-3"
      onClick={() => {
      if (!selectedHotel) {
       toast.warning('Please select a hotel first');
        return;
      }
      setShowForm(true);
       setEditingCoupon(null);
      setFormData({
       hotelId: selectedHotel,
        code: '',
       discountPercentage: '',
        validFrom: '',
       validTo: '',
        maxUses: ''
      });
     }}
    >
     Add New Coupon
    </button>

    {showForm && (
     <div className="card mb-4">
      <div className="card-body">
       <h3>{editingCoupon ? 'Edit Coupon' : 'Add New Coupon'}</h3>
        <form onSubmit={handleSubmit}>
        <div className="mb-3">
         <label className="form-label">Coupon Code</label>
          <input
           type="text"
            className="form-control"
         value={formData.code}
          onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
         placeholder="e.g., SUMMER2024"
          required
        />
       </div>
       <div className="mb-3">
        <label className="form-label">Discount Percentage</label>
         <input
          type="number"
           className="form-control"
        value={formData.discountPercentage}
         onChange={(e) => setFormData({...formData, discountPercentage: e.target.value})}
        min="0"
         max="100"
        required
       />
      </div>
      <div className="row">
       <div className="col-md-6 mb-3">
        <label className="form-label">Valid From</label>
         <input
          type="date"
           className="form-control"
        value={formData.validFrom}
         onChange={(e) => setFormData({...formData, validFrom: e.target.value})}
        required
       />
      </div>
      <div className="col-md-6 mb-3">
       <label className="form-label">Valid To</label>
        <input
         type="date"
          className="form-control"
       value={formData.validTo}
        onChange={(e) => setFormData({...formData, validTo: e.target.value})}
       required
      />
     </div>
    </div>
    <div className="mb-3">
     <label className="form-label">Max Uses (Optional)</label>
      <input
       type="number"
        className="form-control"
     value={formData.maxUses}
      onChange={(e) => setFormData({...formData, maxUses: e.target.value})}
     min="1"
      placeholder="Leave empty for unlimited"
    />
   </div>
   <div className="d-flex gap-2 coupon-form-actions">
    <button type="submit" className="btn btn-primary coupon-form-action-btn">
     {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
    </button>
    <button
     type="button"
      className="btn btn-secondary coupon-form-action-btn"
    onClick={() => {
     setShowForm(false);
      setEditingCoupon(null);
    }}
   >
    Cancel
   </button>
  </div>
 </form>
</div>
</div>
)}

<div className="row g-4">
 {coupons.length === 0 ? (
  <div className="col-12 text-center">
   <p>No coupons found. Add a coupon to get started.</p>
  </div>
 ) : (
  coupons.map((coupon) => (
   <div key={coupon._id || coupon.id} className="col-md-4">
    <div className="card">
     <div className="card-body">
      <h5>{coupon.code}</h5>
       <p><strong>Discount:</strong> {coupon.discountPercentage}%</p>
      <p><strong>Valid From:</strong> {new Date(coupon.validFrom).toLocaleDateString()}</p>
       <p><strong>Valid To:</strong> {new Date(coupon.validTo).toLocaleDateString()}</p>
      <p><strong>Status:</strong> {coupon.isValid ? 'Active' : 'Inactive'}</p>
       {coupon.maxUses && (
        <p><strong>Uses:</strong> {coupon.currentUses || 0} / {coupon.maxUses}</p>
       )}
      <div className="d-flex gap-2">
       <button
        className="btn btn-primary btn-sm"
         onClick={() => handleEdit(coupon)}
      >
       Edit
      </button>
      <button
       className="btn btn-danger btn-sm"
        onClick={() => handleDelete(coupon._id || coupon.id)}
     >
      Delete
     </button>
    </div>
   </div>
  </div>
 </div>
 ))
 )}
</div>
</div>
</div>
);
};

export default ManageCoupons;

