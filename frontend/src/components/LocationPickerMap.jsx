import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
 iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
 iconShadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create a custom red marker icon
const redIcon = new L.Icon({
 iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
 iconSize: [25, 41],
  iconAnchor: [12, 41],
 iconPopupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function MapClickHandler({ onLocationSelect }) {
 useMapEvents({
  click: (e) => {
   const { lat, lng } = e.latlng;
    if (onLocationSelect) {
     onLocationSelect(lat, lng);
    }
  },
 });
 return null;
}

function MapViewUpdater({ center, zoom, forceUpdate }) {
 const map = useMap();
  useEffect(() => {
   if (center && center[0] && center[1] && !isNaN(center[0]) && !isNaN(center[1])) {
    map.setView([center[0], center[1]], zoom || 15, {
     animate: true,
      duration: 0.5
    });
   }
  }, [center, zoom, map, forceUpdate]);
 return null;
}

const LocationPickerMap = ({ onLocationSelect, initialLat = null, initialLng = null, height = '400px', addressToGeocode = null }) => {
 const [markerPosition, setMarkerPosition] = useState(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
 const [mapUpdateKey, setMapUpdateKey] = useState(0);
  const markerRef = useRef(null);
 const lastGeocodedAddress = useRef('');

  useEffect(() => {
   if (initialLat !== null && initialLng !== null && !isNaN(initialLat) && !isNaN(initialLng)) {
    if (!markerPosition || 
        Math.abs(markerPosition[0] - initialLat) > 0.0001 || 
         Math.abs(markerPosition[1] - initialLng) > 0.0001) {
     setMarkerPosition([initialLat, initialLng]);
    }
   }
  }, [initialLat, initialLng]);

 useEffect(() => {
   if (addressToGeocode && addressToGeocode.trim().length >= 3) {
    const trimmedAddress = addressToGeocode.trim();
     const lastAddress = lastGeocodedAddress.current.trim();
    
    const addressChanged = trimmedAddress !== lastAddress && trimmedAddress.length > 0;
    
    if (addressChanged) {
     setIsGeocoding(true);
      const geocodeAddress = async () => {
       try {
        console.log('Geocoding address:', trimmedAddress);
         const response = await fetch(
         `/api/geocode/search?address=${encodeURIComponent(trimmedAddress)}`
       );
        const data = await response.json();
       const results = data.results || [];
       if (results && results.length > 0) {
        const lat = parseFloat(results[0].lat);
         const lng = parseFloat(results[0].lon);
        const position = [lat, lng];
        
        console.log('Geocoding result:', { lat, lng, address: results[0].display_name });
        
        // Always update marker position when geocoding succeeds (overrides manual selection)
        setMarkerPosition(position);
         lastGeocodedAddress.current = trimmedAddress;
        
        // Force map view update
        setMapUpdateKey(prev => prev + 1);
        
        if (onLocationSelect) {
         onLocationSelect(lat, lng);
        }
       } else {
        console.warn('No geocoding results found for:', trimmedAddress);
         // Don't update lastGeocodedAddress if geocoding failed, so it will retry
       }
      } catch (error) {
       console.error('Geocoding error:', error);
      } finally {
       setIsGeocoding(false);
      }
     };
    
    // Reduced debounce time for better responsiveness (400ms)
     const timeoutId = setTimeout(geocodeAddress, 400);
    return () => {
     clearTimeout(timeoutId);
      setIsGeocoding(false);
    };
    }
   } else if (!addressToGeocode || addressToGeocode.trim().length === 0) {
    // Reset last geocoded address when address is cleared
     lastGeocodedAddress.current = '';
   }
  }, [addressToGeocode, onLocationSelect]);

  // Handle location selection (manual click/drag)
 const handleLocationSelect = (lat, lng) => {
   const position = [lat, lng];
    setMarkerPosition(position);
   // Update last geocoded address to prevent re-geocoding immediately after manual selection
    // But allow geocoding to override if address changes
   if (onLocationSelect) {
    onLocationSelect(lat, lng);
   }
  };

  // Map center - use marker position if set, otherwise default to world view
 const mapCenter = markerPosition || [20, 0];
  
  // Map zoom - zoom in if marker exists, otherwise world view
 const mapZoom = markerPosition ? 15 : 2;

  // Handle marker drag end
 const eventHandlers = {
  dragend: () => {
   const marker = markerRef.current;
    if (marker != null) {
     const position = marker.getLatLng();
    handleLocationSelect(position.lat, position.lng);
   }
  },
 };

 return (
   <div style={{ position: 'relative', width: '100%' }}>
    <div style={{ 
     height: height, 
      width: '100%', 
     border: '1px solid #e0e0e0', 
      borderRadius: '8px',
     overflow: 'hidden',
      zIndex: 0
    }}>
     <MapContainer
      center={mapCenter}
       zoom={mapZoom}
     style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
    >
     <TileLayer
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
       url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
     />
      <MapViewUpdater center={markerPosition || mapCenter} zoom={markerPosition ? 15 : mapZoom} forceUpdate={mapUpdateKey} />
     <MapClickHandler onLocationSelect={handleLocationSelect} />
      {markerPosition && (
       <Marker
        position={markerPosition}
         draggable={true}
       icon={redIcon}
        ref={markerRef}
         eventHandlers={eventHandlers}
      >
       <Popup>
        Hotel Location<br />
         Latitude: {markerPosition[0].toFixed(6)}<br />
        Longitude: {markerPosition[1].toFixed(6)}
       </Popup>
      </Marker>
     )}
    </MapContainer>
   </div>
   <div className="mt-2 p-2 bg-light rounded" style={{ fontSize: '0.875rem' }}>
    <strong>📍 Instructions:</strong>
     <ul className="mb-0 mt-2" style={{ paddingLeft: '20px' }}>
     <li>Fill in address fields above - map will automatically update</li>
      <li>Click anywhere on the map to place the red marker</li>
     <li>You can also drag the marker to adjust its position</li>
      <li>The coordinates will be automatically saved</li>
    </ul>
    {isGeocoding && (
     <div className="mt-2 text-info">
      <small>🔄 Geocoding address...</small>
     </div>
    )}
    {markerPosition && (
     <div className="mt-2">
      <strong>Selected Location:</strong>
       <div className="text-muted">
      Latitude: {markerPosition[0].toFixed(6)}, Longitude: {markerPosition[1].toFixed(6)}
     </div>
    </div>
   )}
  </div>
 </div>
 );
};

export default LocationPickerMap;
