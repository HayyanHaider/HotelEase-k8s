import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import brandLogo from '../assets/brand.svg';

const Navbar = () => {
 const [user, setUser] = useState(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
 const [hovered, setHovered] = useState(false);
  const [hostHovered, setHostHovered] = useState(false);
  const [userHovered, setUserHovered] = useState(false);
 const navigate = useNavigate();
  const location = useLocation();
  
 const [isCompact, setIsCompact] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 992 : false);
 const [isVerySmallScreen, setIsVerySmallScreen] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 450 : false);

  useEffect(() => {
    const onResize = () => {
     setIsCompact(window.innerWidth < 992);
     setIsVerySmallScreen(window.innerWidth < 450);
    };
    window.addEventListener('resize', onResize);
   return () => window.removeEventListener('resize', onResize);
  }, []);

 useEffect(() => {
   const checkUserStatus = () => {
    const token = sessionStorage.getItem('token');
     const userData = sessionStorage.getItem('user');

    if (token && userData) {
     setUser(JSON.parse(userData));
    } else {
     setUser(null);
    }
   };

   checkUserStatus();
    window.addEventListener('storage', checkUserStatus);
   window.addEventListener('userStatusChanged', checkUserStatus);

   return () => {
    window.removeEventListener('storage', checkUserStatus);
     window.removeEventListener('userStatusChanged', checkUserStatus);
   };
  }, []);

  useEffect(() => {
   const token = sessionStorage.getItem('token');
    const userData = sessionStorage.getItem('user');

   if (token && userData) {
    setUser(JSON.parse(userData));
   } else {
    setUser(null);
   }
  }, [location.pathname]);

 const handleLogout = () => {
   sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
   setUser(null);
    window.dispatchEvent(new Event('userStatusChanged'));
   toast.info('You have been logged out.');
    navigate('/');
  };

  const handleLogoClick = (e) => {
   if (user) {
    e.preventDefault();
     if (user.role === 'admin') {
      navigate('/admin-dashboard', { replace: true });
       window.dispatchEvent(new Event('resetAdminDashboard'));
     } else if (user.role === 'customer') {
      navigate('/', { replace: true });
     } else if (user.role === 'hotel' || user.role === 'hotel_owner') {
      navigate('/hotel-dashboard', { replace: true });
       window.dispatchEvent(new Event('resetHotelDashboard'));
     }
   } else {
    e.preventDefault();
     navigate('/', { replace: true });
   }
  };

 const handleBecomeHost = () => {
   navigate('/signup?type=host');
  };

  const toggleMobileMenu = () => {
   setShowMobileMenu(!showMobileMenu);
  };

 const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

 const hostButtonStyle = {
  fontSize: '14px',
  borderRadius: '22px',
  border: '1.5px solid #212529',
  backgroundColor: hostHovered ? '#212529' : 'transparent',
  color: hostHovered ? '#ffffff' : '#212529',
  fontWeight: '500',
  padding: '8px 18px',
  lineHeight: '1.2',
  whiteSpace: 'nowrap',
  boxShadow: 'none',
  transition: 'all 0.2s ease'
 };

 return (
  <nav className="navbar navbar-expand-lg border-bottom sticky-top m-0 p-0">
    <div className="container-fluid">
     <Link
      to={
       user && user.role === 'admin' ? "/admin-dashboard" :
        user && user.role === 'customer' ? "/" :
       (user && (user.role === 'hotel' || user.role === 'hotel_owner')) ? "/hotel-dashboard" : "/"
      }
       className="navbar-brand d-flex align-items-center text-decoration-none"
     onClick={handleLogoClick}
     >
      <img
       src={brandLogo}
       alt="BookSmart logo"
        width="60"
        height="60"
        className="brand-logo"
       style={{ objectFit: 'contain' }}
      />
       <span className="ms-2" style={{ 
         fontSize: '26px', 
        fontWeight: '700',
         fontFamily: 'Circular, -apple-system, system-ui, Roboto, "Helvetica Neue", sans-serif',
        letterSpacing: '-0.02em'
       }}>
        <span style={{ color: '#FF385C' }}>Book</span>
        <span style={{ color: '#0c2569' }}>Smart</span>
       </span>
     </Link>

     <div className="navbar-nav d-none d-lg-flex align-items-center ms-auto">
      {user ? (
       <div className="d-flex align-items-center">
        <div className="dropdown me-3">
         <button
          className="btn rounded-circle d-flex align-items-center justify-content-center"
           type="button"
         data-bs-toggle="dropdown"
          aria-expanded="false"
         style={{
          width: "40px",
           height: "40px",
          boxShadow: "none",
           border: userHovered ? "2px solid #007bff" : "2px solid #f2f4f6ff",
         background: userHovered ? "#f8f9fa" : "transparent",
          transition: "all 0.2s ease",
           color: userHovered ? "#007bff" : "#6c757d",
         }}
         onMouseEnter={() => setUserHovered(true)}
          onMouseLeave={() => setUserHovered(false)}
        >
         <svg
          width="22"
           height="22"
         viewBox="0 0 24 24"
          fill="none"
         stroke="currentColor"
          strokeWidth="2"
         strokeLinecap="round"
          strokeLinejoin="round"
         xmlns="http://www.w3.org/2000/svg"
        >
         <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
       </button>

      <ul className="dropdown-menu dropdown-menu-end mt-3 p-2 shadow border-0 rounded-4 account-dropdown-menu" style={{ minWidth: "280px" }}>
        <li className="dropdown-header">
         <div className="d-flex align-items-center mb-2">
          <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3" style={{ width: "40px", height: "40px" }}>
           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
             <circle cx="12" cy="7" r="4"/>
           </svg>
          </div>
          <div>
           <div className="fw-bold text-dark">{user.name}</div>
            <div className="text-muted small">{user.email}</div>
           <div className="text-muted small text-capitalize">{user.role}</div>
          </div>
         </div>
        </li>
        <li><hr className="dropdown-divider" /></li>
        
        {user.role === 'admin' && (
         <>
          
         </>
        )}
        
        {user.role === 'customer' && (
         <>
          <li>
           <Link className="dropdown-item py-2" to="/booking-history">
            <span className="me-2">📅</span> My Bookings
           </Link>
          </li>
          <li>
           <Link className="dropdown-item py-2" to="/favorites">
            <span className="me-2">❤️</span> Favorites
           </Link>
          </li>
          <li>
           <Link className="dropdown-item py-2" to="/edit-profile">
            <span className="me-2">✏️</span> Edit Profile
           </Link>
          </li>
          <li><hr className="dropdown-divider" /></li>
         </>
        )}
        
        {(user.role === 'hotel' || user.role === 'hotel_owner') && (
         <>
          
         </>
        )}
        
        <li><button className="dropdown-item py-2" onClick={handleLogout}>Logout</button></li>
       </ul>
      </div>

     </div>
     ) : (
      <div className="d-flex align-items-center">
       {!isAuthPage && (
        <>
         <button
          onClick={handleBecomeHost}
           className="btn me-3"
         style={hostButtonStyle}
         onMouseEnter={() => setHostHovered(true)}
         onMouseLeave={() => setHostHovered(false)}
         onFocus={() => setHostHovered(true)}
         onBlur={() => setHostHovered(false)}
        >
         Become a Host
        </button>
        <div className="dropdown">
         <button
          className="btn d-flex align-items-center"
           type="button"
         data-bs-toggle="dropdown"
          aria-expanded="false"
         style={{
          boxShadow: "none",
           borderColor: "transparent",
         background: "transparent",
         }}
         onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
         <svg
          width="20"
           height="20"
         viewBox="0 0 24 24"
          fill={hovered ? "grey" : "black"}
         xmlns="http://www.w3.org/2000/svg"
        >
         <path d="M19.14,12.936c.036-.303,.06-.612,.06-.936s-.024-.633-.072-.936l2.055-1.605c.183-.144,.231-.411,.111-.624l-1.947-3.369c-.12-.213-.372-.297-.585-.213l-2.427,.978c-.507-.393-1.059-.717-1.659-.951l-.369-2.58c-.036-.231-.231-.408-.471-.408h-3.894c-.24,0-.435,.177-.471,.408l-.369,2.58c-.6,.234-1.152,.558-1.659,.951l-2.427-.978c-.219-.084-.465,0-.585,.213l-1.947,3.369c-.12,.213-.072,.48,.111,.624l2.055,1.605c-.048,.303-.075,.612-.075,.936s.027,.633,.075,.936l-2.055,1.605c-.183,.144-.231,.411-.111,.624l1.947,3.369c.12,.213,.372,.297,.585,.213l2.427-.978c.507,.393,1.059,.717,1.659,.951l.369,2.58c.036,.231,.231,.408,.471,.408h3.894c.24,0,.435-.177,.471-.408l.369-2.58c.6-.234,1.152-.558,1.659-.951l2.427,.978c.213,.081,.465,0,.585-.213l1.947-3.369c.12-.213,.072-.48-.111-.624l-2.055-1.605Zm-7.14,2.064c-1.656,0-3-1.344-3-3s1.344-3,3-3,3,1.344,3,3-1.344,3-3,3Z"/>
        </svg>
       </button>

       <ul className="dropdown-menu dropdown-menu-end mt-3 p-2 shadow border-0 rounded-4" style={{ minWidth: "220px" }}>
        <li><Link className="dropdown-item py-2" to="/login">Log in</Link></li>
         <li><Link className="dropdown-item py-2" to="/signup">Sign up</Link></li>
       </ul>
      </div>
     </>
    )}
   </div>
  )}
 </div>

 <div className="d-flex d-lg-none align-items-center ms-auto">
  {user ? (
   <>
    <div className="dropdown position-relative">
    <button
     className="btn rounded-circle d-flex align-items-center justify-content-center"
      type="button"
    data-bs-toggle="dropdown"
     aria-expanded="false"
    aria-label="Account menu"
     style={{ width: "40px", height: "40px", border: "2px solid #dee2e6" }}
   >
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
     <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
   </button>
   <ul
    className="dropdown-menu dropdown-menu-end mt-3 p-2 shadow border-0 rounded-4 account-dropdown-menu"
     style={{ minWidth: "280px", right: 0, left: "auto", zIndex: 1080 }}
   >
    <li className="px-2 py-1 text-muted small">Signed in as <span className="fw-semibold text-dark">{user.name}</span></li>
     <li><hr className="dropdown-divider" /></li>
    
    {user.role === 'admin' && (
     <li>
      <Link className="dropdown-item py-2" to="/admin-dashboard">
       <span className="me-2">🏠</span> Dashboard
      </Link>
     </li>
    )}
    
    {user.role === 'customer' && (
     <>
      <li>
       <Link className="dropdown-item py-2" to="/booking-history">
        <span className="me-2">📅</span> My Bookings
       </Link>
      </li>
      <li>
       <Link className="dropdown-item py-2" to="/favorites">
        <span className="me-2">❤️</span> Favorites
       </Link>
      </li>
      <li>
       <Link className="dropdown-item py-2" to="/edit-profile">
        <span className="me-2">✏️</span> Edit Profile
       </Link>
      </li>
     </>
    )}
    
    {(user.role === 'admin' || user.role === 'customer') && <li><hr className="dropdown-divider" /></li>}
     <li>
     <button className="dropdown-item py-2" onClick={handleLogout}>Logout</button>
    </li>
   </ul>
  </div>
   </>
  ) : (
  !isAuthPage && (
   <div className="d-flex align-items-center gap-2 mobile-auth-actions">
     {!isVerySmallScreen && (
     <button
      onClick={handleBecomeHost}
     className="btn me-2 mobile-host-cta"
     style={hostButtonStyle}
     onMouseEnter={() => setHostHovered(true)}
     onMouseLeave={() => setHostHovered(false)}
     onFocus={() => setHostHovered(true)}
     onBlur={() => setHostHovered(false)}
    >
     Become a Host
    </button>
     )}
    <div className="dropdown">
     <button
      className="btn d-flex align-items-center"
       type="button"
     data-bs-toggle="dropdown"
      aria-expanded="false"
     style={{ boxShadow: "none", borderColor: "transparent", background: "transparent" }}
    >
     <svg width="20" height="20" viewBox="0 0 24 24" fill="black" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.14,12.936c.036-.303,.06-.612,.06-.936s-.024-.633-.072-.936l2.055-1.605c.183-.144,.231-.411,.111-.624l-1.947-3.369c-.12-.213-.372-.297-.585-.213l-2.427,.978c-.507-.393-1.059-.717-1.659-.951l-.369-2.58c-.036-.231-.231-.408-.471-.408h-3.894c-.24,0-.435,.177-.471,.408l-.369,2.58c-.6,.234-1.152,.558-1.659,.951l-2.427-.978c-.219-.084-.465,0-.585,.213l-1.947,3.369c-.12,.213-.072,.48,.111,.624l2.055,1.605c-.048,.303-.075,.612-.075,.936s.027,.633,.075,.936l-2.055,1.605c-.183,.144-.231,.411-.111,.624l1.947,3.369c.12,.213,.372,.297,.585,.213l2.427-.978c.507,.393,1.059,.717,1.659,.951l.369,2.58c.036,.231,.231,.408,.471,.408h3.894c.24,0,.435-.177,.471-.408l.369-2.58c.6-.234,1.152-.558,1.659-.951l2.427,.978c.213,.081,.465,0,.585-.213l1.947-3.369c.12-.213,.072-.48-.111-.624l-2.055-1.605Zm-7.14,2.064c-1.656,0-3-1.344-3-3s1.344-3,3-3,3,1.344,3,3-1.344,3-3,3Z"/>
     </svg>
    </button>
    <ul className="dropdown-menu dropdown-menu-end mt-4 p-2 shadow border-0 rounded-4" style={{ minWidth: "220px", right: 0, left: "auto", zIndex: 1080 }}>
     {isVerySmallScreen && (
      <>
       <li>
        <button type="button" className="dropdown-item py-2 mobile-host-dropdown-item" onClick={handleBecomeHost}>Become a Host</button>
       </li>
       <li className="mobile-host-dropdown-item"><hr className="dropdown-divider" /></li>
      </>
     )}
     <li><Link className="dropdown-item py-2" to="/login">Log in</Link></li>
      <li><Link className="dropdown-item py-2" to="/signup">Sign up</Link></li>
    </ul>
   </div>
  </div>
   )
  )}
 </div>

    </div>
   </nav>
  );
};

export default Navbar;
