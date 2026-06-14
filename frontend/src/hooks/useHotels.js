import { useState, useEffect, useCallback } from 'react';
import HotelApiService from '../services/api/HotelApiService';

export const useHotels = (filters = {}) => {
 const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
 const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  const fetchHotels = useCallback(async () => {
   try {
     setLoading(true);
    setError(null);
     
     const filtersWithGuests = {
      ...filters,
       guests: filters.guests || 1
     };
     
    console.log('[useHotels] Fetching hotels with filters:', filtersWithGuests);
     
     const response = await HotelApiService.getHotels(filtersWithGuests);
     
    if (response.success) {
      console.log(`[useHotels] Received ${response.hotels?.length || 0} hotels for ${filtersWithGuests.guests} guests`);
       setHotels(response.hotels || []);
      setPagination(response.pagination || null);
     } else {
      setError(response.message || 'Failed to fetch hotels');
     }
   } catch (err) {
    setError(err.message || 'Error fetching hotels');
     setHotels([]);
   } finally {
    setLoading(false);
   }
  }, [filters]);

 useEffect(() => {
   fetchHotels();
  }, [fetchHotels]);

  return {
   hotels,
    loading,
   error,
    pagination,
   refetch: fetchHotels
  };
};

export const useHotel = (hotelId) => {
 const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
 const [error, setError] = useState(null);

  const fetchHotel = useCallback(async () => {
   if (!hotelId) {
     setLoading(false);
    return;
   }

    try {
     setLoading(true);
    setError(null);
     
     const response = await HotelApiService.getHotelById(hotelId);
     
    if (response.success) {
      setHotel(response.hotel);
     } else {
      setError(response.message || 'Failed to fetch hotel');
     }
   } catch (err) {
    setError(err.message || 'Error fetching hotel');
     setHotel(null);
   } finally {
    setLoading(false);
   }
  }, [hotelId]);

 useEffect(() => {
   fetchHotel();
  }, [fetchHotel]);

  return {
   hotel,
    loading,
   error,
    refetch: fetchHotel
  };
};

export const useOwnerHotels = () => {
 const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
 const [error, setError] = useState(null);

  const fetchOwnerHotels = useCallback(async () => {
   try {
     setLoading(true);
    setError(null);
     
     const response = await HotelApiService.getOwnerHotels();
     
    if (response.success) {
      setHotels(response.hotels || []);
     } else {
      setError(response.message || 'Failed to fetch hotels');
     }
   } catch (err) {
    setError(err.message || 'Error fetching hotels');
     setHotels([]);
   } finally {
    setLoading(false);
   }
  }, []);

 useEffect(() => {
   fetchOwnerHotels();
  }, [fetchOwnerHotels]);

  return {
   hotels,
    loading,
   error,
    refetch: fetchOwnerHotels
  };
};
