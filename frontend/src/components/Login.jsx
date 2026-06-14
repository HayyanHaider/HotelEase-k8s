import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import brandLogo from '../assets/brand.svg';

const Login = () => {
 const [formData, setFormData] = useState({
  email: '',
   password: ''
 });
  const [errors, setErrors] = useState({});
 const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
 const navigate = useNavigate();

  const validateForm = () => {
   const newErrors = {};

    if (!formData.email.trim()) {
     newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
     newErrors.email = 'Email is invalid';
    }

   if (!formData.password) {
     newErrors.password = 'Password is required';
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

  const handleSubmit = async (e) => {
   e.preventDefault();
    
   if (!validateForm()) {
     return;
    }

   setLoading(true);
    try {
     const response = await axios.post('/api/auth/login', {
      email: formData.email,
       password: formData.password
     });

     if (response.data.success) {
      sessionStorage.setItem('token', response.data.token);
       sessionStorage.setItem('user', JSON.stringify(response.data.user));
      window.dispatchEvent(new Event('userStatusChanged'));
       
       toast.success('Login successful! Welcome back!');
       
      if (response.data.user.role === 'customer') {
       navigate('/');
      } else if (response.data.user.role === 'hotel' || response.data.user.role === 'hotel_owner') {
       navigate('/hotel-dashboard');
      } else if (response.data.user.role === 'admin') {
       navigate('/admin-dashboard');
      } else {
       navigate('/');
      }
     }
   } catch (error) {
    const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
     toast.error(errorMessage);
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
      <div className="col-12 col-sm-10 col-md-6 col-lg-5 col-xl-4">
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
          <h2 className="h5 fw-bold mb-1" style={{ color: '#222222' }}>Welcome back</h2>
           <p className="text-muted small mb-0">Log in to your account</p>
         </div>

         <form onSubmit={handleSubmit}>
          <div className="mb-2">
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

          <div className="mb-3">
           <label htmlFor="password" className="form-label fw-semibold" style={{ color: '#222222' }}>Password</label>
            <div className="position-relative">
             <input
              type={showPassword ? "text" : "password"}
               id="password"
             name="password"
              value={formData.password}
             onChange={handleChange}
              className="form-control"
             style={{ paddingRight: '40px', borderColor: errors.password ? '#dc3545' : '' }}
              placeholder="Enter your password"
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

         {errors.submit && (
          <div className="alert alert-danger" role="alert">
           {errors.submit}
          </div>
         )}

         <button 
          type="submit" 
           className="btn w-100 mb-2 login-btn"
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
            Logging in...
          </>
         ) : (
          'Log in'
         )}
        </button>
       </form>

       <div className="text-center mt-2">
        <p className="text-muted mb-0 small">
         Don't have an account?{' '}
          <Link to="/signup" className="fw-semibold" style={{color: '#FF5A5F', textDecoration: 'underline'}}>
          Sign up
         </Link>
        </p>
       </div>
      </div>
     </div>
    </div>
   </div>
  </div>
 </div>
 );
};

export default Login;
