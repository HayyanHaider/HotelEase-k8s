import { useEffect, useState } from 'react';
import { FaInfoCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './AdminDashboard.css';
import ReportsSection from './ReportsSection';

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
   const [stats, setStats] = useState(null);
    const [activeSection, setActiveSection] = useState('home');
   const [isSidebarOpen, setIsSidebarOpen] = useState(false);
   const [isMobileSidebarLayout, setIsMobileSidebarLayout] = useState(
      typeof window !== 'undefined'
         ? window.innerWidth <= 1200 || window.matchMedia('(hover: none) and (pointer: coarse)').matches
         : false
   );
  const [hotels, setHotels] = useState([]);
   const [users, setUsers] = useState([]);
    const [refundRequests, setRefundRequests] = useState([]);
  const [lowRatedHotels, setLowRatedHotels] = useState([]);
   const [loading, setLoading] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
  const [modalType, setModalType] = useState(null);
   const [filterStatus, setFilterStatus] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
  
   const navigate = useNavigate();
    const API_URL = '/api';

   useEffect(() => {
      if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
     }
    }, [activeSection]);

   useEffect(() => {
      const token = sessionStorage.getItem('token');
    const userData = sessionStorage.getItem('user');
    
      if (!token || !userData) {
      navigate('/login');
       return;
      }

     const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== 'admin') {
      navigate('/login');
       return;
      }

     setUser(parsedUser);
      fetchDashboardStats(token);

     const handleResetDashboard = () => {
        setActiveSection('home');
    };

      window.addEventListener('resetAdminDashboard', handleResetDashboard);

     return () => {
        window.removeEventListener('resetAdminDashboard', handleResetDashboard);
    };
   }, [navigate]);

  const fetchDashboardStats = async (token) => {
     try {
        const response = await fetch(`${API_URL}/admin/dashboard/stats`, {
        headers: {
           'Authorization': `Bearer ${token}`
          }
      });
       const data = await response.json();
        if (data.success) {
        setStats(data.stats);
       }
      } catch (error) {
      console.error('Error fetching dashboard stats:', error);
     }
    };

   const fetchHotels = async (status = 'all') => {
      setLoading(true);
    try {
       const token = sessionStorage.getItem('token');
        const statusParam = status !== 'all' ? `&status=${status}` : '';
      const searchParam = searchQuery ? `&search=${searchQuery}` : '';
       const response = await fetch(`${API_URL}/admin/hotels?limit=50${statusParam}${searchParam}`, {
          headers: { 'Authorization': `Bearer ${token}` }
      });
       const data = await response.json();
        if (data.success) {
        setHotels(data.hotels);
       }
      } catch (error) {
      console.error('Error fetching hotels:', error);
     } finally {
        setLoading(false);
    }
   };

  const fetchUsers = async (status = 'all') => {
     setLoading(true);
      try {
      const token = sessionStorage.getItem('token');
       const statusParam = status !== 'all' ? `&status=${status}` : '';
        const searchParam = searchQuery ? `&search=${searchQuery}` : '';
      const response = await fetch(`${API_URL}/admin/users?limit=50${statusParam}${searchParam}`, {
         headers: { 'Authorization': `Bearer ${token}` }
        });
      const data = await response.json();
       if (data.success) {
          setUsers(data.users);
      }
     } catch (error) {
        console.error('Error fetching users:', error);
    } finally {
       setLoading(false);
      }
  };


  const fetchRefundRequests = async (status = 'all') => {
     setLoading(true);
      try {
      const token = sessionStorage.getItem('token');
       const statusParam = status !== 'all' ? `&status=${status}` : '';
        const response = await fetch(`${API_URL}/admin/support/refunds?limit=50${statusParam}`, {
        headers: { 'Authorization': `Bearer ${token}` }
       });
        const data = await response.json();
      if (data.success) {
         setRefundRequests(data.refunds);
        }
    } catch (error) {
       console.error('Error fetching refund requests:', error);
      } finally {
      setLoading(false);
     }
    };

   const fetchLowRatedHotels = async () => {
      setLoading(true);
    try {
       const token = sessionStorage.getItem('token');
        const response = await fetch(`${API_URL}/admin/monitoring/low-rated-hotels?limit=50`, {
        headers: { 'Authorization': `Bearer ${token}` }
       });
        const data = await response.json();
      if (data.success) {
         setLowRatedHotels(data.hotels);
        }
    } catch (error) {
       console.error('Error fetching low-rated hotels:', error);
      } finally {
      setLoading(false);
     }
    };

   const handleHotelAction = async (hotelId, action, reason = '') => {
      try {
      const token = sessionStorage.getItem('token');
       const response = await fetch(`${API_URL}/admin/hotels/${hotelId}/${action}`, {
          method: 'PUT',
        headers: {
           'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
         body: JSON.stringify({ reason })
        });
      const data = await response.json();
       if (data.success) {
          toast.success(`Hotel ${action}ed successfully!`);
        fetchHotels(filterStatus);
         fetchDashboardStats(token);
        
        if (activeSection === 'monitoring') {
           fetchLowRatedHotels();
          }
        
         closeModal();
        } else {
        toast.error(data.message || `Failed to ${action} hotel`);
       }
      } catch (error) {
      console.error(`Error ${action}ing hotel:`, error);
       toast.error(`Error ${action}ing hotel`);
      }
  };

    const handleUserAction = async (userId, action, reason = '') => {
    try {
       const token = sessionStorage.getItem('token');
        const response = await fetch(`${API_URL}/admin/users/${userId}/${action}`, {
        method: 'PUT',
         headers: {
            'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
         },
          body: JSON.stringify({ reason })
      });
       const data = await response.json();
        if (data.success) {
        toast.success(`User ${action}ed successfully!`);
         fetchUsers(filterStatus);
          fetchDashboardStats(token);
        closeModal();
       } else {
          toast.error(data.message || `Failed to ${action} user`);
      }
     } catch (error) {
        console.error(`Error ${action}ing user:`, error);
      toast.error(`Error ${action}ing user`);
     }
    };

   const handleRefundAction = async (refundId, action, notes = '') => {
      try {
      const token = sessionStorage.getItem('token');
       const response = await fetch(`${API_URL}/admin/support/refunds/${refundId}/process`, {
          method: 'PUT',
        headers: {
           'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
         body: JSON.stringify({ action, notes })
        });
      const data = await response.json();
       if (data.success) {
          toast.success(`Refund ${action}ed successfully!`);
        fetchRefundRequests(filterStatus);
         fetchDashboardStats(token);
          closeModal();
      } else {
         toast.error(data.message || `Failed to ${action} refund`);
        }
    } catch (error) {
       console.error(`Error ${action}ing refund:`, error);
        toast.error(`Error ${action}ing refund`);
    }
   };


   const openModal = (type, item) => {
      setModalType(type);
    setSelectedItem(item);
   };

  const closeModal = () => {
     setModalType(null);
      setSelectedItem(null);
  };

    const changeSection = (section) => {
    setActiveSection(section);
      if (isMobileSidebarLayout) {
         setIsSidebarOpen(false);
      }
     setFilterStatus('all');
      setSearchQuery('');
    
     const token = sessionStorage.getItem('token');
      switch(section) {
      case 'hotels':
         fetchHotels();
          break;
      case 'users':
         fetchUsers();
          break;
      case 'refunds':
         fetchRefundRequests();
          break;
      case 'monitoring':
         fetchLowRatedHotels();
          break;
      default:
         fetchDashboardStats(token);
      }
  };

    useEffect(() => {
    if (activeSection === 'hotels' && filterStatus) {
       fetchHotels(filterStatus);
      }
  }, [filterStatus, searchQuery]);

   useEffect(() => {
      if (typeof window === 'undefined') return;

      const handleResize = () => {
         const isTouchLayout = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
         const mobileMode = window.innerWidth <= 1200 || isTouchLayout;
         setIsMobileSidebarLayout(mobileMode);
         if (!mobileMode) {
            setIsSidebarOpen(false);
         }
      };

      handleResize();
      window.addEventListener('resize', handleResize);

      return () => {
         window.removeEventListener('resize', handleResize);
      };
   }, []);

   useEffect(() => {
      if (isMobileSidebarLayout && isSidebarOpen) {
         document.body.style.overflow = 'hidden';
      } else {
         document.body.style.overflow = '';
      }

      return () => {
         document.body.style.overflow = '';
      };
   }, [isMobileSidebarLayout, isSidebarOpen]);

    useEffect(() => {
    if (activeSection === 'users' && filterStatus) {
       fetchUsers(filterStatus);
      }
  }, [filterStatus, searchQuery]);

    if (!user || !stats) {
    return <div className="admin-loading">Loading...</div>;
   }

  return (
     <div className={`admin-dashboard ${isMobileSidebarLayout ? 'mobile-sidebar-layout' : ''}`}>
         <div className="admin-mobile-nav">
            <button
               type="button"
               className={`admin-menu-toggle ${isSidebarOpen ? 'open' : ''}`}
               onClick={() => setIsSidebarOpen((prev) => !prev)}
               aria-label="Toggle sidebar menu"
               aria-expanded={isSidebarOpen}
            >
               <span></span>
               <span></span>
               <span></span>
            </button>
            <span className="admin-mobile-nav-title">Menu</span>
         </div>

            <div className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <nav className="admin-nav">
           <button 
              className={activeSection === 'home' ? 'active' : ''}
            onClick={() => changeSection('home')}
           >
              🏠 Home
          </button>
           <button 
              className={activeSection === 'hotels' ? 'active' : ''}
            onClick={() => changeSection('hotels')}
           >
              🏨 Hotels
          </button>
           <button 
              className={activeSection === 'users' ? 'active' : ''}
            onClick={() => changeSection('users')}
           >
              👥 Users
          </button>
           <button 
              className={activeSection === 'monitoring' ? 'active' : ''}
            onClick={() => changeSection('monitoring')}
           >
              🚩 Monitoring
          </button>
           <button 
              className={activeSection === 'refunds' ? 'active' : ''}
            onClick={() => changeSection('refunds')}
           >
              💰 Refunds
          </button>
           <button 
              className={activeSection === 'reports' ? 'active' : ''}
            onClick={() => changeSection('reports')}
           >
              📈 Reports
          </button>
         </nav>
        </div>

         {isSidebarOpen && <div className="admin-sidebar-backdrop" onClick={() => setIsSidebarOpen(false)}></div>}

       <div className="admin-main">
          <div className="admin-header">
          <h1>
             {activeSection === 'home' && 'Home Dashboard'}
              {activeSection === 'hotels' && 'Hotel Management'}
            {activeSection === 'users' && 'User Management'}
             {activeSection === 'monitoring' && 'Performance Monitoring'}
              {activeSection === 'refunds' && 'Refund Requests'}
            {activeSection === 'reports' && 'Reports & Analytics'}
           </h1>
          </div>

         {activeSection === 'home' && (
            <div className="admin-overview">
            <div className="stats-grid">
               <div className="stat-card">
                  <div className="stat-icon">👥</div>
                <div className="stat-info">
                   <h3>{stats.users.total}</h3>
                    <p>Total Users</p>
                  <span className="stat-detail">{stats.users.suspended} suspended</span>
                 </div>
                </div>

               <div className="stat-card">
                  <div className="stat-icon">🏨</div>
                <div className="stat-info">
                   <h3>{stats.hotels.total}</h3>
                    <p>Total Hotels</p>
                  <span className="stat-detail">{stats.hotels.pending} pending approval</span>
                 </div>
                </div>

               <div className="stat-card">
                  <div className="stat-icon">📅</div>
                <div className="stat-info">
                   <h3>{stats.bookings.total}</h3>
                    <p>Total Bookings</p>
                  <span className="stat-detail">{stats.bookings.active} active</span>
                 </div>
                </div>

                 <div className="stat-card">
                    <div className="stat-icon">💵</div>
                  <div className="stat-info">
                     <h3 style={{whiteSpace: 'nowrap', fontSize: '1.5rem'}}>PKR {Math.round(stats.financial.totalRevenue).toLocaleString()}</h3>
                      <p>Total Revenue</p>
                    <span className="stat-detail" style={{whiteSpace: 'nowrap', fontSize: '0.85rem'}}>PKR {Math.round(stats.financial.monthlyRevenue).toLocaleString()} this month</span>
                   </div>
                  </div>

                 <div className="stat-card">
                    <div className="stat-icon">💰</div>
                  <div className="stat-info">
                     <h3 style={{whiteSpace: 'nowrap', fontSize: '1.5rem'}}>PKR {Math.round(stats.financial.totalCommission).toLocaleString()}</h3>
                      <p>Commission Earned</p>
                    <span className="stat-detail">10% per booking</span>
                   </div>
            </div>

               <div className="stat-card">
                  <div className="stat-icon">⚠️</div>
                <div className="stat-info">
                   <h3>{stats.hotels.lowRated}</h3>
                    <p>Low-Rated Hotels</p>
                  <span className="stat-detail">Rating &lt; 2.5</span>
                 </div>
            </div>

               <div className="stat-card">
                  <div className="stat-icon">🔄</div>
                <div className="stat-info">
                   <h3>{stats.support.pendingRefunds}</h3>
                    <p>Pending Refunds</p>
                  <span className="stat-detail">Awaiting review</span>
                 </div>
                </div>
          </div>

              <div className="quick-actions">
              <h3>Quick Actions</h3>
               <div className="action-buttons">
                  <button onClick={() => changeSection('hotels')} className="action-btn">
                  <span>🏨</span>
                   <div>
                      <strong>Approve Hotels</strong>
                    <small>{stats.hotels.pending} pending</small>
                   </div>
                  </button>
                <button onClick={() => changeSection('monitoring')} className="action-btn">
                   <span>🚩</span>
                    <div>
                    <strong>Flag Low-Rated</strong>
                     <small>{stats.hotels.lowRated} hotels</small>
                    </div>
                </button>
                 <button onClick={() => changeSection('refunds')} className="action-btn">
                    <span>💰</span>
                  <div>
                     <strong>Process Refunds</strong>
                      <small>{stats.support.pendingRefunds} pending</small>
                  </div>
                 </button>
                </div>
            </div>
           </div>
          )}

         {activeSection === 'hotels' && (
            <div className="admin-section">
            <div className="section-controls">
               <div className="filters">
                  <button 
                  className={filterStatus === 'all' ? 'filter-btn active' : 'filter-btn'}
                   onClick={() => setFilterStatus('all')}
                  >
                  All Hotels
                 </button>
                  <button 
                  className={filterStatus === 'pending' ? 'filter-btn active' : 'filter-btn'}
                   onClick={() => setFilterStatus('pending')}
                  >
                  Pending ({stats.hotels.pending})
                 </button>
                  <button 
                  className={filterStatus === 'approved' ? 'filter-btn active' : 'filter-btn'}
                   onClick={() => setFilterStatus('approved')}
                  >
                  Approved ({stats.hotels.approved})
                 </button>
                  <button 
                  className={filterStatus === 'suspended' ? 'filter-btn active' : 'filter-btn'}
                   onClick={() => setFilterStatus('suspended')}
                  >
                  Suspended ({stats.hotels.suspended})
                 </button>
                </div>
              <input 
                 type="text"
                  placeholder="Search hotels..."
                className="search-input"
                 value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
              />
           </div>

            {loading ? (
               <div className="loading">Loading hotels...</div>
              ) : (
              <div className="data-table">
                 <table>
                    <thead>
                    <tr>
                       <th>Hotel Name</th>
                        <th>Owner</th>
                      <th>Location</th>
                       <th>Rating</th>
                      
                      <th>Status</th>
                       <th>Actions</th>
                      </tr>
                  </thead>
                   <tbody>
                      {hotels.map(hotel => (
                      <tr key={hotel._id}>
                         <td>
                            <strong>{hotel.name}</strong>
                          {hotel.isApproved && hotel.totalReviews > 0 && hotel.rating < 2.5 && (
                             <span className="badge badge-warning">WARNING</span>
                            )}
                        </td>
                         <td>{hotel.ownerId?.name || 'N/A'}<br/><small>{hotel.ownerId?.email}</small></td>
                          <td>{hotel.location?.city}, {hotel.location?.state}</td>
                        <td>
                           {hotel.totalReviews > 0 && (
                              <>
                              ⭐ {hotel.rating.toFixed(1)} 
                               <small>({hotel.totalReviews} reviews)</small>
                              </>
                          )}
                         </td>
                        
                        <td>
                           {hotel.isSuspended && <span className="badge badge-danger">Suspended</span>}
                            {!hotel.isSuspended && hotel.isApproved && <span className="badge badge-success">Approved</span>}
                          {!hotel.isSuspended && !hotel.isApproved && <span className="badge badge-warning">Pending</span>}
                         </td>
                          <td>
                          <div className="action-btns">
                             {!hotel.isApproved && !hotel.isSuspended && (
                                <>
                                <button 
                                   className="btn-sm btn-success"
                                    onClick={() => handleHotelAction(hotel._id, 'approve')}
                                >
                                   Approve
                                  </button>
                                <button 
                                   className="btn-sm btn-danger"
                                    onClick={() => openModal('rejectHotel', hotel)}
                                >
                                   Reject
                                  </button>
                              </>
                             )}
                              {hotel.isApproved && !hotel.isSuspended && (
                              <button 
                                 className="btn-sm btn-danger"
                                  onClick={() => openModal('suspendHotel', hotel)}
                              >
                                 Suspend
                                </button>
                            )}
                             {hotel.isSuspended && (
                                <button 
                                className="btn-sm btn-info"
                                 onClick={() => handleHotelAction(hotel._id, 'unsuspend')}
                                >
                                Unsuspend
                               </button>
                              )}
                          </div>
                         </td>
                        </tr>
                    ))}
                   </tbody>
                  </table>
              </div>
             )}
            </div>
        )}

          {activeSection === 'users' && (
          <div className="admin-section">
             <div className="section-controls">
                <div className="filters">
                <button 
                   className={filterStatus === 'all' ? 'filter-btn active' : 'filter-btn'}
                    onClick={() => setFilterStatus('all')}
                >
                   All Users
                  </button>
                <button 
                   className={filterStatus === 'active' ? 'filter-btn active' : 'filter-btn'}
                    onClick={() => setFilterStatus('active')}
                >
                   Active
                  </button>
                <button 
                   className={filterStatus === 'suspended' ? 'filter-btn active' : 'filter-btn'}
                    onClick={() => setFilterStatus('suspended')}
                >
                   Suspended ({stats.users.suspended})
                  </button>
        </div>
               <input 
                  type="text"
                placeholder="Search users..."
                 className="search-input"
                  value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
               />
              </div>

             {loading ? (
                <div className="loading">Loading users...</div>
            ) : (
               <div className="data-table">
                  <table>
                  <thead>
                     <tr>
                        <th>Name</th>
                      <th>Email</th>
                       <th>Phone</th>
                        <th>Stats</th>
                      <th>Status</th>
                       <th>Actions</th>
                      </tr>
                  </thead>
                   <tbody>
                      {users.map(user => (
                      <tr key={user._id}>
                         <td><strong>{user.name}</strong></td>
                          <td>{user.email}</td>
                        <td>{user.phone || 'N/A'}</td>
                         <td>
                            <small>
                            {user.stats?.hotelCount > 0 && `${user.stats.hotelCount} hotels`}
                             {user.stats?.bookingCount > 0 && `${user.stats.bookingCount} bookings`}
                              {user.stats?.reviewCount > 0 && ` • ${user.stats.reviewCount} reviews`}
                          </small>
                         </td>
                          <td>
                          {user.isSuspended ? (
                             <span className="badge badge-danger">Suspended</span>
                            ) : (
                            <span className="badge badge-success">Active</span>
                           )}
                          </td>
                        <td>
                           <div className="action-btns">
                              {!user.isSuspended ? (
                              <button 
                                 className="btn-sm btn-danger"
                                  onClick={() => openModal('suspendUser', user)}
                              >
                                 Suspend
                                </button>
                            ) : (
                               <button 
                                  className="btn-sm btn-info"
                                onClick={() => handleUserAction(user._id, 'unsuspend')}
                               >
                                  Unsuspend
                              </button>
                             )}
                            </div>
                        </td>
                       </tr>
                      ))}
                  </tbody>
                 </table>
                </div>
            )}
           </div>
          )}

         {activeSection === 'monitoring' && (
            <div className="admin-section">
            <div className="section-header">
               <h3>Low-Rated Hotels (Rating &lt; 2.5)</h3>
              </div>

             {loading ? (
                <div className="loading">Loading hotels...</div>
            ) : (
               <div className="data-table">
                  <table>
                  <thead>
                     <tr>
                        <th>Hotel Name</th>
                      <th>Owner</th>
                       <th>Location</th>
                        <th>Rating</th>
                      <th>Reviews</th>
                       <th>Status</th>
                        <th>Actions</th>
                    </tr>
                   </thead>
                    <tbody>
                    {lowRatedHotels.map(hotel => (
                       <tr key={hotel._id}>
                          <td>
                          <strong>{hotel.name}</strong>
                         </td>
                          <td>{hotel.ownerId?.name}<br/><small>{hotel.ownerId?.email}</small></td>
                        <td>{hotel.location?.city}, {hotel.location?.state}</td>
                         <td className="rating-low">⭐ {hotel.rating.toFixed(1)}</td>
                          <td>{hotel.totalReviews}</td>
                        <td>
                           {hotel.isSuspended ? (
                              <span className="badge badge-danger">Suspended</span>
                          ) : (
                             <span className="badge badge-success">Active</span>
                            )}
                        </td>
                         <td>
                            <div className="action-btns">
                            {!hotel.isSuspended ? (
                               <button 
                                  className="btn-sm btn-danger"
                                onClick={() => openModal('suspendHotel', hotel)}
                               >
                                  Suspend
                              </button>
                             ) : (
                                <button 
                                className="btn-sm btn-info"
                                 onClick={() => handleHotelAction(hotel._id, 'unsuspend')}
                                >
                                Unsuspend
                               </button>
                              )}
                          </div>
                         </td>
                        </tr>
                    ))}
                   </tbody>
                  </table>
              </div>
             )}
            </div>
        )}

          {activeSection === 'refunds' && (
          <div className="admin-section">
             <div className="section-controls">
                <div className="filters">
                <button 
                   className={filterStatus === 'all' ? 'filter-btn active' : 'filter-btn'}
                    onClick={() => { setFilterStatus('all'); fetchRefundRequests('all'); }}
                >
                   All Refunds
                  </button>
                <button 
                   className={filterStatus === 'pending' ? 'filter-btn active' : 'filter-btn'}
                    onClick={() => { setFilterStatus('pending'); fetchRefundRequests('pending'); }}
                >
                   Pending ({stats.support.pendingRefunds})
                  </button>
                <button 
                   className={filterStatus === 'approved' ? 'filter-btn active' : 'filter-btn'}
                    onClick={() => { setFilterStatus('approved'); fetchRefundRequests('approved'); }}
                >
                   Approved
                  </button>
                <button 
                   className={filterStatus === 'rejected' ? 'filter-btn active' : 'filter-btn'}
                    onClick={() => { setFilterStatus('rejected'); fetchRefundRequests('rejected'); }}
                >
                   Rejected
                  </button>
              </div>
             </div>

            {loading ? (
               <div className="loading">Loading refund requests...</div>
              ) : (
              <div className="data-table">
                 <table>
                    <thead>
                    <tr>
                       <th>User</th>
                        <th>Amount</th>
                      <th>Reason</th>
                       <th>Description</th>
                        <th>Status</th>
                      <th>Requested</th>
                       <th>Actions</th>
                      </tr>
                  </thead>
                   <tbody>
                      {refundRequests.map(refund => (
                      <tr key={refund._id}>
                         <td>{refund.userId?.name}<br/><small>{refund.userId?.email}</small></td>
                          <td><strong>PKR {refund.amount.toFixed(2)}</strong></td>
                        <td><span className="badge badge-info">{refund.reason.replace('_', ' ')}</span></td>
                         <td>
                            {refund.description.length > 50 ? (
                            <>
                               {refund.description.substring(0, 50)}...
                                <button 
                                className="btn-icon"
                                 title={refund.description}
                                  style={{ marginLeft: '6px', cursor: 'pointer', border: 'none', background: 'transparent', padding: 0 }}
                                onClick={(e) => { e.stopPropagation(); toast.info(refund.description, { autoClose: 5000 }); }}
                                 aria-label="View full description"
                                >
                                <FaInfoCircle size={16} color="#64748b" />
                               </button>
                              </>
                          ) : (
                             refund.description
                            )}
                        </td>
                         <td>
                            <span className={`badge badge-${
                            refund.status === 'pending' ? 'warning' :
                             refund.status === 'approved' ? 'success' :
                              refund.status === 'rejected' ? 'danger' : 'info'
                          }`}>
                             {refund.status}
                            </span>
                        </td>
                         <td>{new Date(refund.requestedAt).toLocaleDateString()}</td>
                          <td>
                          {refund.status === 'pending' && (
                             <div className="action-btns">
                                <button 
                                className="btn-sm btn-success"
                                 onClick={() => openModal('approveRefund', refund)}
                                >
                                Approve
                               </button>
                                <button 
                                className="btn-sm btn-danger"
                                 onClick={() => openModal('rejectRefund', refund)}
                                >
                                Reject
                               </button>
                              </div>
                          )}
                         </td>
                        </tr>
                    ))}
                   </tbody>
                  </table>
              </div>
             )}
            </div>
        )}

          {activeSection === 'reports' && (
          <div className="admin-section">
             <ReportsSection />
            </div>
        )}
       </div>

      {modalType && (
         <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {modalType === 'suspendHotel' && (
               <div>
                  <h3>Suspend Hotel</h3>
                <p>Hotel: <strong>{selectedItem?.name}</strong></p>
                 <form onSubmit={(e) => {
                    e.preventDefault();
                  const reason = e.target.reason.value;
                   handleHotelAction(selectedItem._id, 'suspend', reason);
                  }}>
                  <label>Reason for suspension:</label>
                   <textarea name="reason" required placeholder="Enter reason..."></textarea>
                    <div className="modal-actions">
                    <button type="submit" className="btn-danger">Suspend Hotel</button>
                     <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
                    </div>
                </form>
               </div>
              )}

             {modalType === 'rejectHotel' && (
                <div>
                <h3>Reject Hotel</h3>
                 <p>Hotel: <strong>{selectedItem?.name}</strong></p>
                  <form onSubmit={(e) => {
                  e.preventDefault();
                   const reason = e.target.reason.value;
                    handleHotelAction(selectedItem._id, 'reject', reason);
                }}>
                   <label>Reason for rejection:</label>
                    <textarea name="reason" required placeholder="Enter reason..."></textarea>
                  <div className="modal-actions">
                     <button type="submit" className="btn-danger">Reject Hotel</button>
                      <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
                  </div>
                 </form>
                </div>
            )}

              {modalType === 'suspendUser' && (
              <div>
                 <h3>Suspend User</h3>
                  <p>User: <strong>{selectedItem?.name}</strong> ({selectedItem?.email})</p>
                <form onSubmit={(e) => {
                   e.preventDefault();
                    const reason = e.target.reason.value;
                  handleUserAction(selectedItem._id, 'suspend', reason);
                 }}>
                    <label>Reason for suspension:</label>
                  <textarea name="reason" required placeholder="Enter reason..."></textarea>
                   <div className="modal-actions">
                      <button type="submit" className="btn-danger">Suspend User</button>
                    <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
                   </div>
                  </form>
              </div>
             )}

            {modalType === 'approveRefund' && (
               <div>
                  <h3>Approve Refund</h3>
                <p>Amount: <strong>${selectedItem?.amount.toFixed(2)}</strong></p>
                 <p>User: {selectedItem?.userId?.name}</p>
                  <form onSubmit={(e) => {
                  e.preventDefault();
                   const notes = e.target.notes.value;
                    handleRefundAction(selectedItem._id, 'approve', notes);
                }}>
                   <label>Admin notes (optional):</label>
                    <textarea name="notes" placeholder="Enter notes..."></textarea>
                  <div className="modal-actions">
                     <button type="submit" className="btn-success">Approve Refund</button>
                      <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
                  </div>
                 </form>
                </div>
            )}

              {modalType === 'rejectRefund' && (
              <div>
                 <h3>Reject Refund</h3>
                  <p>Amount: <strong>${selectedItem?.amount.toFixed(2)}</strong></p>
                <p>User: {selectedItem?.userId?.name}</p>
                 <form onSubmit={(e) => {
                    e.preventDefault();
                  const notes = e.target.notes.value;
                   handleRefundAction(selectedItem._id, 'reject', notes);
                  }}>
                  <label>Reason for rejection:</label>
                   <textarea name="notes" required placeholder="Enter reason..."></textarea>
                    <div className="modal-actions">
                    <button type="submit" className="btn-danger">Reject Refund</button>
                     <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
                    </div>
                </form>
             </div>
              )}
          </div>
         </div>
        )}
      
       <ToastContainer
          position="top-right"
        autoClose={3000}
         hideProgressBar={false}
          newestOnTop={false}
        closeOnClick
         rtl={false}
          pauseOnFocusLoss
        draggable
         pauseOnHover
          theme="light"
      />
     </div>
    );
};

export default AdminDashboard;