import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';

const Home = () => {
 const navigate = useNavigate();
  const [searchLocation, setSearchLocation] = useState('');
 const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
 const [guests, setGuests] = useState(1);

  const handleSearch = (e) => {
   e.preventDefault();
    const params = new URLSearchParams();
   if (searchLocation) params.append('location', searchLocation);
    if (checkIn) params.append('checkIn', checkIn);
   if (checkOut) params.append('checkOut', checkOut);
    if (guests) params.append('guests', guests);
   navigate(`/?${params.toString()}`);
  };

 return (
   <div className="bg-white">
    <div style={{
     background: 'linear-gradient(135deg, #1e5bb8 0%, #4a90e2 50%, #6ba3d8 100%)',
      minHeight: '350px',
     display: 'flex',
      flexDirection: 'column',
     alignItems: 'center',
      justifyContent: 'center',
     position: 'relative',
      padding: '60px 20px 140px',
     backgroundImage: 'url("https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80")',
      backgroundSize: 'cover',
     backgroundPosition: 'center',
      backgroundBlendMode: 'overlay',
     borderRadius: '0 0 32px 32px'
    }}>
      <div className="container text-center position-relative" style={{ zIndex: 2 }}>
       <h1 className="fw-bold text-white mb-4" style={{ 
        textShadow: '2px 2px 8px rgba(0,0,0,0.3)',
         fontSize: 'clamp(2.5rem, 6vw, 4rem)',
        letterSpacing: '-0.02em'
       }}>
         Your Trip Starts Here
       </h1>
       <div className="d-flex justify-content-center align-items-center gap-3 flex-wrap">
        <div className="d-flex align-items-center gap-2 text-white">
         <span style={{ fontSize: '1.2rem' }}>✅</span>
          <span style={{ fontSize: '0.95rem', fontWeight: '500', textShadow: '1px 1px 4px rgba(0,0,0,0.4)' }}>Secure payment</span>
        </div>
        <span className="text-white" style={{ fontSize: '1.5rem', opacity: 0.6 }}>|</span>
         <div className="d-flex align-items-center gap-2 text-white">
          <span style={{ fontSize: '1.2rem' }}>✅</span>
         <span style={{ fontSize: '0.95rem', fontWeight: '500', textShadow: '1px 1px 4px rgba(0,0,0,0.4)' }}>Support in approx. 30s</span>
        </div>
       </div>
      </div>
     </div>

    <div style={{ marginTop: '-90px', position: 'relative', zIndex: 10, paddingBottom: '40px' }}>
     <div className="container">
      <div className="row justify-content-center">
       <div className="col-12 col-lg-11 col-xl-10">
        <form onSubmit={handleSearch}>
         <div className="card shadow-lg border-0" style={{ 
          borderRadius: '16px',
           overflow: 'hidden'
         }}>
          <div className="card-body p-3 p-md-4">
           <div className="row g-3 align-items-end">
            <div className="col-12 col-md-3">
             <label className="form-label fw-semibold text-dark mb-2" style={{ fontSize: '13px' }}>Destination</label>
              <input 
               type="text" 
              className="form-control border-0 bg-light" 
               placeholder="City, airport, region, landmark..."
              value={searchLocation}
               onChange={(e) => setSearchLocation(e.target.value)}
              style={{ 
               fontSize: '14px',
                padding: '12px 16px',
               borderRadius: '8px'
              }}
             />
            </div>
            
            <div className="col-6 col-md-2">
             <label className="form-label fw-semibold text-dark mb-2" style={{ fontSize: '13px' }}>Check-in</label>
              <input 
               type="date" 
              className="form-control border-0 bg-light" 
               value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
               style={{ 
                fontSize: '14px',
               padding: '12px 16px',
                borderRadius: '8px'
               }}
             />
            </div>
            
            <div className="col-6 col-md-2">
             <label className="form-label fw-semibold text-dark mb-2" style={{ fontSize: '13px' }}>Check-out</label>
              <input 
               type="date" 
              className="form-control border-0 bg-light" 
               value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
               style={{ 
                fontSize: '14px',
               padding: '12px 16px',
                borderRadius: '8px'
               }}
             />
            </div>
            
            <div className="col-12 col-md-3">
             <label className="form-label fw-semibold text-dark mb-2" style={{ fontSize: '13px' }}>Rooms and Guests</label>
              <select 
               className="form-select border-0 bg-light" 
              value={guests}
               onChange={(e) => setGuests(e.target.value)}
              style={{ 
               fontSize: '14px',
                padding: '12px 16px',
               borderRadius: '8px'
              }}
             >
              <option value="1">1 room, 1 guest</option>
               <option value="2">1 room, 2 guests</option>
              <option value="3">1 room, 3 guests</option>
               <option value="4">1 room, 4 guests</option>
              <option value="5">2 rooms, 5+ guests</option>
             </select>
            </div>
            
            <div className="col-12 col-md-2">
             <button 
              type="submit"
               className="btn w-100 d-flex align-items-center justify-content-center gap-2"
             style={{
              backgroundColor: '#1e5bb8',
               padding: '12px 24px',
              border: 'none',
               borderRadius: '8px',
              color: '#fff',
               fontSize: '15px',
              fontWeight: '600',
               transition: 'background-color 0.2s'
             }}
             onMouseEnter={(e) => e.target.style.backgroundColor = '#164a99'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#1e5bb8'}
            >
             <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
              <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
             </svg>
              Search
            </button>
           </div>
          </div>
         </div>
        </div>
       </form>
      </div>
     </div>
    </div>
   </div>

  </div>
 );
};

export default Home;
