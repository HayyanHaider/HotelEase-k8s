import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './EditProfile.css';

const EditProfile = () => {
 const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
  name: '',
   email: '',
  phone: ''
 });
  const [loading, setLoading] = useState(true);
 const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
 const navigate = useNavigate();

  useEffect(() => {
   fetchProfile();
  }, []);

 const fetchProfile = async () => {
   try {
     setLoading(true);
    const token = sessionStorage.getItem('token');
     
    if (!token) {
     toast.warning('Please login to view profile');
      navigate('/login');
     return;
    }

     const response = await axios.get('/api/auth/profile', {
      headers: { Authorization: `Bearer ${token}` }
     });

     if (response.data.success) {
      const userData = response.data.user;
       setUser(userData);
      setFormData({
       name: userData.name || '',
        email: userData.email || '',
       phone: userData.phone || ''
      });
     }
   } catch (error) {
    console.error('Error fetching profile:', error);
     
    if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
     toast.error('Cannot connect to server. Please make sure the backend server is running.');
    } else if (error.response?.status === 401) {
     toast.error('Session expired. Please login again.');
      sessionStorage.removeItem('token');
     sessionStorage.removeItem('user');
      navigate('/login');
    } else {
     toast.error(error.response?.data?.message || 'Error loading profile');
    }
   } finally {
    setLoading(false);
   }
  };

  const handleChange = (e) => {
   const { name, value } = e.target;
    setFormData(prev => ({
     ...prev,
    [name]: value
   }));
    
   if (errors[name]) {
     setErrors(prev => ({
      ...prev,
       [name]: ''
     }));
   }
  };

  const validateForm = () => {
   const newErrors = {};

    if (!formData.name.trim()) {
     newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
     newErrors.name = 'Name must be at least 2 characters';
    }

   if (!formData.email.trim()) {
     newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
     newErrors.email = 'Email is invalid';
    }

   setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

 const handleSubmit = async (e) => {
   e.preventDefault();
    
   if (!validateForm()) {
     return;
    }

   setSubmitting(true);
    try {
     const token = sessionStorage.getItem('token');
      const response = await axios.put(
       '/api/auth/profile',
      {
        name: formData.name.trim(),
         phone: formData.phone.trim()
       },
     {
       headers: { Authorization: `Bearer ${token}` }
      }
    );

     if (response.data.success) {
      sessionStorage.setItem('user', JSON.stringify(response.data.user));
       window.dispatchEvent(new Event('userStatusChanged'));
     toast.success('Profile updated successfully!');
      navigate(-1);
     }
   } catch (error) {
    console.error('Error updating profile:', error);
     
    if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
     toast.error('Cannot connect to server. Please make sure the backend server is running.');
    } else if (error.response?.status === 401) {
     toast.error('Session expired. Please login again.');
      sessionStorage.removeItem('token');
     sessionStorage.removeItem('user');
      navigate('/login');
    } else {
     toast.error(error.response?.data?.message || 'Error updating profile');
    }
   } finally {
    setSubmitting(false);
   }
  };

  if (loading) {
   return (
    <div className="edit-profile-loading">
     <div className="edit-profile-loading-spinner"></div>
    </div>
   );
  }

 return (
   <div className="edit-profile-container">
    <div className="edit-profile-wrapper">
     <div className="edit-profile-card">
      <div className="edit-profile-header">
       <button 
        className="edit-profile-back-btn"
         onClick={() => navigate(-1)}
      >
       ← Go Back
      </button>
      <h1 className="edit-profile-title">Edit Profile</h1>
     </div>

     <form onSubmit={handleSubmit} className="edit-profile-form">
      <div className="edit-profile-form-group">
       <label htmlFor="name" className="edit-profile-label">Name</label>
        <input
         type="text"
          id="name"
       name="name"
        value={formData.name}
       onChange={handleChange}
        className={`edit-profile-input ${errors.name ? 'error' : ''}`}
       placeholder="Enter your name"
      />
      {errors.name && <div className="edit-profile-error-text">{errors.name}</div>}
     </div>

     <div className="edit-profile-form-group">
      <label htmlFor="email" className="edit-profile-label">Email</label>
       <input
        type="email"
         id="email"
      name="email"
       value={formData.email}
      onChange={handleChange}
       className="edit-profile-input"
      disabled
     />
     <small className="edit-profile-hint">Email cannot be changed</small>
    </div>

    <div className="edit-profile-form-group">
     <label htmlFor="phone" className="edit-profile-label">Phone Number</label>
      <input
       type="tel"
        id="phone"
     name="phone"
      value={formData.phone}
     onChange={handleChange}
      className={`edit-profile-input ${errors.phone ? 'error' : ''}`}
     placeholder="Enter your phone number (optional)"
    />
    {errors.phone && <div className="edit-profile-error-text">{errors.phone}</div>}
   </div>

   <div className="edit-profile-actions">
    <button 
     type="submit" 
      className="edit-profile-btn edit-profile-btn-submit"
    disabled={submitting}
   >
    {submitting ? (
     <>
      <div className="edit-profile-spinner"></div>
       Updating...
     </>
    ) : (
     'Update Profile'
    )}
   </button>
  </div>
 </form>
</div>
</div>
</div>
);
};

export default EditProfile;

