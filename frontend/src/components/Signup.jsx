import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import brandLogo from '../assets/brand.svg';

const Signup = () => {
 const [formData, setFormData] = useState({
  name: '',
   email: '',
  password: '',
   confirmPassword: '',
  phone: '',
   role: 'customer'
 });
  const [errors, setErrors] = useState({});
 const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
 const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [signupType, setSignupType] = useState('customer');
 const navigate = useNavigate();
  const [searchParams] = useSearchParams();

 useEffect(() => {
   const type = searchParams.get('type');
    if (type === 'customer') {
     setSignupType('customer');
    setFormData(prev => ({ ...prev, role: 'customer' }));
   } else if (type === 'host') {
     setSignupType('host');
    setFormData(prev => ({ ...prev, role: 'hotel' }));
   } else {
    setSignupType('all');
   }
  }, [searchParams]);

  const validateForm = () => {
   const newErrors = {};
    let hasError = false;

   if (!formData.name.trim()) {
     newErrors.name = 'Name is required';
    if (!hasError) {
     toast.error('Name is required');
      hasError = true;
    }
   }

    if (!formData.email.trim()) {
     newErrors.email = 'Email is required';
    if (!hasError) {
     toast.error('Email is required');
      hasError = true;
    }
   } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
    newErrors.email = 'Email is invalid';
     if (!hasError) {
      toast.error('Please enter a valid email address');
       hasError = true;
     }
   }

   if (!formData.password) {
     newErrors.password = 'Password is required';
    if (!hasError) {
     toast.error('Password is required');
      hasError = true;
    }
   } else if (formData.password.length < 6) {
    newErrors.password = 'Password must be at least 6 characters';
     if (!hasError) {
      toast.error('Password must be at least 6 characters');
       hasError = true;
     }
   }

    if (formData.password !== formData.confirmPassword) {
     newErrors.confirmPassword = 'Passwords do not match';
    if (!hasError) {
     toast.error('Passwords do not match');
      hasError = true;
    }
   }

   setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

  const handlePasswordBlur = (e) => {
   const { value } = e.target;
    if (value.length > 0 && value.length < 6) {
     toast.error('Password must be at least 6 characters', { autoClose: 3000 });
    }
  };

 const handleSubmit = async (e) => {
   e.preventDefault();
    
   setErrors({});
    
   if (!validateForm()) {
     return;
    }

   setLoading(true);
    try {
     console.log('Submitting signup data:', {
      name: formData.name,
       email: formData.email,
      password: formData.password ? '***' : '',
       phone: formData.phone,
      role: formData.role
     });

     const requestData = {
      name: formData.name?.trim() || '',
       email: formData.email?.trim() || '',
      password: formData.password || '',
       role: formData.role || 'customer'
     };
     
    if (formData.phone && formData.phone.trim()) {
     requestData.phone = formData.phone.trim();
    }

     console.log('Request data being sent:', { ...requestData, password: '***' });

    const response = await axios.post('/api/auth/signup', requestData);

     console.log('Signup response:', response.data);

    if (response.data.success) {
     sessionStorage.setItem('token', response.data.token);
      sessionStorage.setItem('user', JSON.stringify(response.data.user));
     window.dispatchEvent(new Event('userStatusChanged'));
      
      toast.success('Account created successfully! Welcome to BookSmart!');
      
     if (response.data.user.role === 'customer') {
      navigate('/');
     } else if (response.data.user.role === 'hotel') {
      navigate('/hotel-dashboard');
     } else if (response.data.user.role === 'admin') {
      navigate('/admin-dashboard');
     } else {
      navigate(`/${response.data.user.role}-dashboard`);
     }
    }
   } catch (error) {
    console.error('Signup error:', error);
     console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
     
    let errorMessage = 'Signup failed. Please try again.';
     
    if (error.response?.data?.message) {
     errorMessage = error.response.data.message;
    } else if (error.response?.data?.error) {
     errorMessage = error.response.data.error;
    } else if (error.message) {
     errorMessage = error.message;
    }
     
    toast.error(errorMessage);
     console.log('Setting error message:', errorMessage);
    setErrors({
     submit: errorMessage
    });
   } finally {
    setLoading(false);
   }
  };

 return (
   <div className="d-flex align-items-center justify-content-center bg-light"
   style={{
    minHeight: 'calc(100vh - 80px)',
     padding: '20px 0'
   }}>
    <div className="container">
     <div className="row justify-content-center">
      <div className="col-12 col-sm-10 col-md-8 col-lg-6 col-xl-5">
       <div className="card border-0 rounded-4" style={{ 
        background: '#FEFEFE',
         boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)'
       }}>
        <div className="card-body p-4">
         <div className="text-center mb-3">
          <img
           src={brandLogo}
           alt="BookSmart logo"
           width="64"
           height="64"
           className="mb-2"
           style={{ objectFit: 'contain' }}
          />
          <h2 className="h5 fw-bold mb-1" style={{ color: '#222222' }}>
           {signupType === 'host' ? 'Become a Host' : 'Create Account'}
          </h2>
           <p className="text-muted small mb-0">
            {signupType === 'host' 
             ? 'Start your hosting journey with us' 
              : 'Join our BookSmart community'
            }
           </p>
         </div>

         <form onSubmit={handleSubmit}>
          <div className="row g-2">
           <div className="col-md-6 mb-2">
            <label htmlFor="name" className="form-label fw-semibold" style={{ color: '#222222' }}>First name</label>
             <input
              type="text"
               id="name"
             name="name"
              value={formData.name}
             onChange={handleChange}
              className="form-control"
             style={{ borderColor: errors.name ? '#dc3545' : '' }}
              placeholder="Enter your first name"
            />
            {errors.name && <div className="text-danger small mt-1">{errors.name}</div>}
           </div>
           
           <div className="col-md-6 mb-2">
            <label htmlFor="email" className="form-label fw-semibold" style={{ color: '#222222' }}>Email</label>
             <input
              type="email"
               id="email"
             name="email"
              value={formData.email}
             onChange={handleChange}
              className="form-control"
             style={{ borderColor: errors.email ? '#dc3545' : '' }}
              placeholder="Enter your email"
            />
            {errors.email && <div className="text-danger small mt-1">{errors.email}</div>}
           </div>
          </div>

          <div className="mb-2">
           <label htmlFor="phone" className="form-label fw-semibold" style={{ color: '#222222' }}>Phone number (optional)</label>
            <input
             type="tel"
              id="phone"
            name="phone"
             value={formData.phone}
            onChange={handleChange}
             className="form-control"
            placeholder="Enter your phone number"
           />
          </div>

          {signupType === 'all' && (
           <div className="mb-2">
            <label htmlFor="role" className="form-label fw-semibold" style={{ color: '#222222' }}>Account Type</label>
             <select
              id="role"
               name="role"
             value={formData.role}
              onChange={handleChange}
             className="form-select"
            >
             <option value="customer">Customer</option>
              <option value="hotel">Hotel Owner</option>
            </select>
           </div>
          )}

          <div className="mb-2">
           <label htmlFor="password" className="form-label fw-semibold" style={{ color: '#222222' }}>Password</label>
            <div className="position-relative">
             <input
              type={showPassword ? "text" : "password"}
               id="password"
             name="password"
              value={formData.password}
             onChange={handleChange}
              onBlur={handlePasswordBlur}
             className="form-control"
              style={{ paddingRight: '40px', borderColor: errors.password ? '#dc3545' : '' }}
             placeholder="Create a password"
            />
            <button
             type="button"
              className="btn btn-link position-absolute top-50 translate-middle-y text-muted p-0"
            onClick={() => setShowPassword(!showPassword)}
             style={{border: 'none', background: 'none', right: '12px', zIndex: 10}}
           >
            {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
           </button>
          </div>
           {errors.password && <div className="text-danger small mt-1">{errors.password}</div>}
         </div>

         <div className="mb-3">
          <label htmlFor="confirmPassword" className="form-label fw-semibold" style={{ color: '#222222' }}>Confirm password</label>
           <div className="position-relative">
            <input
             type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
            name="confirmPassword"
             value={formData.confirmPassword}
            onChange={handleChange}
             className="form-control"
            style={{ paddingRight: '40px', borderColor: errors.confirmPassword ? '#dc3545' : '' }}
             placeholder="Confirm your password"
           />
           <button
            type="button"
             className="btn btn-link position-absolute top-50 translate-middle-y text-muted p-0"
           onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            style={{border: 'none', background: 'none', right: '12px', zIndex: 10}}
          >
           {showConfirmPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
          </button>
         </div>
          {errors.confirmPassword && <div className="text-danger small mt-1">{errors.confirmPassword}</div>}
        </div>

        {errors.submit && (
         <div className="alert alert-danger" role="alert">
          {errors.submit}
         </div>
        )}

        <button 
         type="submit" 
          className="btn w-100 mb-2 signup-btn"
        style={{
         backgroundColor: '#FF5A5F',
          color: '#FFFFFF',
         border: 'none',
          fontWeight: '600',
         transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
         if (!loading) {
          e.target.style.backgroundColor = '#E04146';
           e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = '0 4px 12px rgba(255, 90, 95, 0.4)';
         }
        }}
        onMouseLeave={(e) => {
         e.target.style.backgroundColor = '#FF5A5F';
          e.target.style.transform = 'translateY(0)';
         e.target.style.boxShadow = 'none';
        }}
        disabled={loading}
       >
        {loading ? (
         <>
          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
           {signupType === 'host' ? 'Creating Host Account...' : 'Creating Account...'}
         </>
        ) : (
         signupType === 'host' ? 'Become a Host' : 'Sign up'
        )}
       </button>
      </form>

      <div className="text-center mt-2">
       <p className="text-muted mb-1 small">
        Already have an account?{' '}
         <Link to="/login" className="fw-semibold" style={{color: '#FF5A5F', textDecoration: 'underline'}}>
         Log in
        </Link>
       </p>
       
       {signupType === 'customer' && (
        <p className="text-muted mb-0 small">
         Want to become a host?{' '}
          <Link to="/signup?type=host" className="fw-semibold" style={{color: '#FF5A5F', textDecoration: 'underline'}}>
          Host Signup
         </Link>
        </p>
       )}
       
       {signupType === 'host' && (
        <p className="text-muted mb-0 small">
         Want to sign up as a customer?{' '}
          <Link to="/signup?type=customer" className="fw-semibold" style={{color: '#FF5A5F', textDecoration: 'underline'}}>
          Customer Signup
         </Link>
        </p>
       )}
      </div>
     </div>
    </div>
   </div>
  </div>
 </div>
 </div>
 );
};

export default Signup;
