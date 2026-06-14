// Location data for cascading dropdowns
export const countries = [
 { code: 'PK', name: 'Pakistan' },
  { code: 'US', name: 'United States' },
 { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
 { code: 'AU', name: 'Australia' },
  { code: 'IN', name: 'India' },
 { code: 'BD', name: 'Bangladesh' },
  { code: 'CN', name: 'China' },
 { code: 'AE', name: 'United Arab Emirates' },
  { code: 'SA', name: 'Saudi Arabia' },
];

export const pakistanData = {
 provinces: [
  { code: 'PUN', name: 'Punjab' },
   { code: 'SIN', name: 'Sindh' },
  { code: 'KPK', name: 'Khyber Pakhtunkhwa' },
   { code: 'BAL', name: 'Balochistan' },
  { code: 'GB', name: 'Gilgit-Baltistan' },
   { code: 'AJK', name: 'Azad Jammu and Kashmir' },
 ],
 cities: {
  'PUN': [
   'Lahore', 'Faisalabad', 'Rawalpindi', 'Multan', 'Gujranwala', 'Sialkot', 'Bahawalpur', 
    'Sargodha', 'Sheikhupura', 'Jhang', 'Kasur', 'Rahim Yar Khan', 'Gujrat', 'Sahiwal',
   'Okara', 'Wah Cantonment', 'Dera Ghazi Khan', 'Mianwali', 'Chiniot', 'Kamoke'
  ],
   'SIN': [
  'Karachi', 'Hyderabad', 'Sukkur', 'Larkana', 'Nawabshah', 'Mirpur Khas', 'Jacobabad',
   'Shikarpur', 'Khairpur', 'Dadu', 'Badin', 'Thatta', 'Tando Allahyar', 'Tando Muhammad Khan',
  'Umerkot', 'Sanghar', 'Naushahro Feroze', 'Ghotki', 'Kashmore', 'Jamshoro'
  ],
  'KPK': [
   'Peshawar', 'Mardan', 'Mingora', 'Kohat', 'Abbottabad', 'Dera Ismail Khan', 'Charsadda',
  'Nowshera', 'Mansehra', 'Swabi', 'Bannu', 'Haripur', 'Chitral', 'Timergara', 'Karak',
   'Hangu', 'Lakki Marwat', 'Tank', 'Dera Ismail Khan', 'Battagram'
  ],
  'BAL': [
   'Quetta', 'Turbat', 'Khuzdar', 'Chaman', 'Hub', 'Sibi', 'Loralai', 'Gwadar', 'Zhob',
  'Dera Murad Jamali', 'Dera Allah Yar', 'Usta Muhammad', 'Pasni', 'Surab', 'Kalat',
   'Mastung', 'Nushki', 'Panjgur', 'Tump', 'Ormara'
  ],
  'GB': [
   'Gilgit', 'Skardu', 'Chilas', 'Hunza', 'Astore', 'Ghanche', 'Shigar', 'Kharmang',
  'Nagar', 'Diamer', 'Ghizer', 'Roundu'
  ],
   'AJK': [
  'Muzaffarabad', 'Mirpur', 'Kotli', 'Bhimber', 'Rawalakot', 'Bagh', 'Hattian Bala',
   'Neelum', 'Sudhnuti', 'Poonch'
  ]
 },
 // Common societies/areas for major cities (can be expanded)
 societies: {
  'Lahore': [
   'DHA Phase 1', 'DHA Phase 2', 'DHA Phase 3', 'DHA Phase 4', 'DHA Phase 5', 'DHA Phase 6',
    'Gulberg', 'Johar Town', 'Model Town', 'Faisal Town', 'Wapda Town', 'Garden Town',
   'Bahria Town', 'Askari', 'Cantt', 'Iqbal Town', 'Allama Iqbal Town', 'Shadman',
    'Lakshmi Chowk', 'Anarkali', 'Old City', 'Ravi Road', 'Multan Road', 'Ferozepur Road'
  ],
  'Karachi': [
   'DHA Phase 1', 'DHA Phase 2', 'DHA Phase 3', 'DHA Phase 4', 'DHA Phase 5', 'DHA Phase 6',
    'Clifton', 'Gulshan-e-Iqbal', 'Gulistan-e-Johar', 'PECHS', 'Bahadurabad', 'Saddar',
   'Defence', 'Malir', 'Korangi', 'Landhi', 'Shah Faisal', 'Airport', 'Garden East',
    'Garden West', 'Lyari', 'Kharadar', 'Mithadar'
  ],
  'Islamabad': [
   'F-6', 'F-7', 'F-8', 'F-10', 'F-11', 'G-6', 'G-7', 'G-8', 'G-9', 'G-10', 'G-11',
    'I-8', 'I-9', 'I-10', 'E-7', 'E-8', 'E-9', 'E-11', 'DHA Phase 1', 'DHA Phase 2',
   'Bahria Town', 'Sector H-8', 'Sector H-9', 'Sector H-10', 'Sector H-11', 'Sector H-12'
  ],
  'Rawalpindi': [
   'DHA Phase 1', 'DHA Phase 2', 'DHA Phase 3', 'Bahria Town', 'Askari', 'Cantt',
    'Raja Bazar', 'Saddar', 'Commercial Market', 'Peshawar Road', 'Murree Road',
   '6th Road', 'Satellite Town', 'Westridge', 'Lalazar'
  ]
 }
};

// Get societies for a city
export const getSocietiesForCity = (city) => {
 return pakistanData.societies[city] || [];
};

// Geocoding function using OpenStreetMap Nominatim API
export const geocodeAddress = async (address) => {
 try {
  const response = await fetch(
   `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
    {
     headers: {
      'User-Agent': 'HotelManagementApp/1.0' // Required by Nominatim
     }
    }
  );
   const data = await response.json();
  if (data && data.length > 0) {
   return {
    lat: parseFloat(data[0].lat),
     lng: parseFloat(data[0].lon),
    displayName: data[0].display_name
   };
  }
  return null;
 } catch (error) {
  console.error('Geocoding error:', error);
   return null;
 }
};

// Reverse geocoding - get address from coordinates
export const reverseGeocode = async (lat, lng) => {
 try {
  const response = await fetch(
   `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
   {
     headers: {
     'User-Agent': 'HotelManagementApp/1.0'
     }
    }
  );
   const data = await response.json();
  if (data && data.address) {
   return data.address;
  }
  return null;
 } catch (error) {
  console.error('Reverse geocoding error:', error);
   return null;
 }
};

