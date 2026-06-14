"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "react-toastify"
import { useHotels } from "../hooks/useHotels"
import { useAuth } from "../hooks/useAuth"
import UserApiService from "../services/api/UserApiService"
import { resolveAssetUrl } from "../services/urlResolver"
import { MapPin } from "lucide-react"
import BrowseHotelImage from "./BrowseHotelImage.jpg.png"
import "./Home.css"

const normalizeGuests = (value) => {
 const parsed = parseInt(value, 10)
  return !isNaN(parsed) && parsed > 0 ? parsed : 1
}

const BrowseHotels = () => {
 const [favorites, setFavorites] = useState([])
  const [showDatePicker, setShowDatePicker] = useState(false)
 const [activeDateInput, setActiveDateInput] = useState("checkIn")
  const checkInInputRef = useRef(null)
 const checkOutInputRef = useRef(null)
  const [searchParams, setSearchParams] = useSearchParams()
 const navigate = useNavigate()

  const { isAuthenticated } = useAuth()

 const [filters, setFilters] = useState({
   location: searchParams.get("location") || "",
    checkIn: searchParams.get("checkIn") || "",
   checkOut: searchParams.get("checkOut") || "",
   guests: normalizeGuests(searchParams.get("guests")),
   minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
   minRating: searchParams.get("minRating") || "",
    amenities: searchParams.get("amenities") ? searchParams.get("amenities").split(",") : [],
   sortBy: searchParams.get("sortBy") || "popularity",
    order: searchParams.get("order") || "desc",
   limit: 50,
  })

  useEffect(() => {
   const currentGuests = filters.guests || 1
    console.log(`[BrowseHotels] Current guests filter: ${currentGuests}`)
  }, [filters.guests])

 const { hotels, loading, error, refetch } = useHotels(filters)

  useEffect(() => {
   console.log('[BrowseHotels] Hotels state:', { hotels, loading, error, count: hotels?.length })
  }, [hotels, loading, error])

 const fetchFavorites = useCallback(async () => {
   if (!isAuthenticated) {
     setFavorites([])
      return
    }

    try {
     const response = await UserApiService.getFavorites()
      if (response.success) {
       const favoriteIds = (response.favorites || []).map((f) => String(f._id || f.id))
        setFavorites(favoriteIds)
      }
    } catch (error) {
     console.error("Error fetching favorites:", error)
      setFavorites([])
    }
  }, [isAuthenticated])

  useEffect(() => {
   fetchFavorites()
  }, [fetchFavorites])

 const toggleFavorite = async (hotelId, e) => {
   e.stopPropagation()

    if (!isAuthenticated) {
     return
    }

    try {
     const hotelIdStr = String(hotelId)
      const isFavorite = favorites.includes(hotelIdStr)

     if (isFavorite) {
      await UserApiService.removeFavorite(hotelId)
       setFavorites((prev) => prev.filter((id) => id !== hotelIdStr))
      toast.info("Removed from favorites")
     } else {
      await UserApiService.addFavorite(hotelId)
       setFavorites((prev) => [...prev, hotelIdStr])
      toast.success("Added to favorites")
     }
   } catch (error) {
    console.error("Error toggling favorite:", error)
     toast.error(error.message || "Error updating favorite. Please try again.")
   }
  }

 const checkIsFavorite = (hotelId) => {
   return favorites.includes(String(hotelId))
  }

  const handleFiltersChange = useCallback((updates) => {
   setFilters((prev) => {
     const next = { ...prev }

     Object.entries(updates).forEach(([key, rawValue]) => {
      if (key === "guests") {
       const validGuests = normalizeGuests(rawValue)
        console.log(`[BrowseHotels] Guest filter changed to: ${validGuests}`)
       next.guests = validGuests
      } else {
       next[key] = rawValue
      }
     })

     return next
    })
  }, [])

 useEffect(() => {
   const newParams = new URLSearchParams()

    if (filters.location) newParams.set("location", filters.location)
   if (filters.checkIn) newParams.set("checkIn", filters.checkIn)
    if (filters.checkOut) newParams.set("checkOut", filters.checkOut)
   if (filters.guests) newParams.set("guests", String(normalizeGuests(filters.guests)))
    if (filters.minPrice) newParams.set("minPrice", String(filters.minPrice))
   if (filters.maxPrice) newParams.set("maxPrice", String(filters.maxPrice))
    if (filters.minRating) newParams.set("minRating", String(filters.minRating))
   if (Array.isArray(filters.amenities) && filters.amenities.length > 0) {
    newParams.set("amenities", filters.amenities.join(","))
   }
    if (filters.sortBy) newParams.set("sortBy", filters.sortBy)
   if (filters.order) newParams.set("order", filters.order)

    const current = searchParams.toString()
   const next = newParams.toString()
    if (current !== next) {
    setSearchParams(newParams, { replace: true })
   }
  }, [filters, searchParams, setSearchParams])

  const handleFilterChange = (key, value) => {
   handleFiltersChange({ [key]: value })
  }

 const handleSort = (sortBy) => {
   let defaultOrder = "desc"
    if (sortBy === "price") {
     defaultOrder = "asc"
    }
   
   const order = filters.sortBy === sortBy && filters.order === defaultOrder 
     ? (defaultOrder === "desc" ? "asc" : "desc")
      : defaultOrder
   
   handleFiltersChange({ sortBy, order })
  }

 const formatDate = (dateString) => {
   if (!dateString) return ""
    const date = new Date(dateString)
   return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  const getDateDisplay = () => {
   if (filters.checkIn && filters.checkOut) {
     return `${formatDate(filters.checkIn)} - ${formatDate(filters.checkOut)}`
    }
   if (filters.checkIn) {
     return `${formatDate(filters.checkIn)} - Add checkout`
    }
   return "Add dates"
  }

 const getGuestsDisplay = () => {
   if (filters.guests === 1) {
     return "1 guest"
    }
   return `${filters.guests} guests`
  }

 return (
   <div className="home-container container-fluid px-2 px-sm-3 px-lg-4" style={{ minHeight: "100vh" }}>
    <div
     className="hero-section"
      style={{
      backgroundImage: `url(${BrowseHotelImage})`,
       backgroundSize: "cover",
      backgroundPosition: "center 30%",
       backgroundRepeat: "no-repeat",
      position: "relative",
       padding: "40px 20px 30px 20px",
     overflow: "hidden",
      minHeight: "auto",
       display: "flex",
     flexDirection: "column",
      justifyContent: "flex-start",
       alignItems: "center",
    borderRadius: "24px",
     margin: "12px 0 0 0",
     }}
   >
    <div
     style={{
      position: "absolute",
       top: 0,
     left: 0,
      right: 0,
       bottom: 0,
     background: "linear-gradient(180deg, rgba(30, 58, 95, 0.7) 0%, rgba(15, 39, 68, 0.8) 50%, rgba(10, 25, 41, 0.9) 100%)",
      zIndex: 1,
     }}
   >
   </div>
   <div style={{ textAlign: "center", marginBottom: "30px", color: "white", position: "relative", zIndex: 2, width: "100%" }}>
    <h1
     style={{
      fontSize: "clamp(32px, 5vw, 56px)",
       fontWeight: "700",
     marginBottom: "16px",
      lineHeight: "1.2",
       textShadow: "0 2px 8px rgba(0,0,0,0.2)",
     }}
   >
    Your Trip Starts Here
   </h1>
   <div
    style={{
     display: "flex",
      gap: "20px",
     justifyContent: "center",
      flexWrap: "wrap",
     fontSize: "14px",
    }}
   >
   <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
    <span style={{ fontSize: "16px" }}>✓</span> Secure payment
   </span>
   <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
    <span style={{ opacity: 0.7 }}>|</span>
   </span>
   <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
    <span style={{ fontSize: "16px" }}>✓</span> Support in approx. 30s
   </span>
  </div>
 </div>

 <div
  style={{
   display: "flex",
    gap: "12px",
   justifyContent: "center",
    flexWrap: "wrap",
   marginBottom: "20px",
    position: "relative",
   zIndex: 2,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  padding: "12px 16px",
   borderRadius: "30px",
    backdropFilter: "blur(10px)",
  width: "fit-content",
   margin: "0 auto 20px",
  alignItems: "center",
 }}
>
 <span style={{ fontSize: "14px", fontWeight: "600", color: "#fff", marginRight: "4px" }}>Sort by:</span>
  {["Popularity", "Price", "Rating"].map((option) => (
   <button
    key={option}
     onClick={() => handleSort(option.toLowerCase())}
   style={{
    background: filters.sortBy === option.toLowerCase() ? "#000" : "transparent",
     color: "#fff",
    border: filters.sortBy === option.toLowerCase() ? "1px solid #000" : "1px solid transparent",
     padding: "8px 16px",
    borderRadius: "20px",
     cursor: "pointer",
    fontSize: "14px",
     fontWeight: "600",
    transition: "all 0.2s",
   }}
    onMouseEnter={(e) => {
   if (filters.sortBy !== option.toLowerCase()) {
    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)"
   }
  }}
  onMouseLeave={(e) => {
   if (filters.sortBy !== option.toLowerCase()) {
    e.currentTarget.style.backgroundColor = "transparent"
   }
  }}
 >
  {option}
    {filters.sortBy === option.toLowerCase() ? (filters.order === "asc" ? " ↑" : " ↓") : ""}
 </button>
))}
</div>

<div
 style={{
  background: "#fff",
   borderRadius: "24px",
  padding: "12px 14px",
   boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)",
  maxWidth: "1200px",
   width: "100%",
  position: "relative",
   zIndex: 2,
 margin: "0 auto",
}}
>
 <div className="search-form-grid">
 <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
  <label
   style={{
   display: "block",
    fontSize: "11px",
   fontWeight: "600",
    marginBottom: "4px",
   color: "#333",
    textTransform: "uppercase",
   letterSpacing: "0.5px",
    lineHeight: "1.2",
   height: "14px",
  }}
 >
  <MapPin size={12} style={{ display: "inline", marginRight: "4px", verticalAlign: "middle" }} />
   Destination
 </label>
 <input
  type="text"
   placeholder="City, airport, region..."
 value={filters.location}
  onChange={(e) => handleFilterChange("location", e.target.value)}
  style={{
   width: "100%",
  border: "1px solid #ddd",
   borderRadius: "12px",
  padding: "8px 10px",
   fontSize: "13px",
  outline: "none",
   transition: "border-color 0.2s",
 height: "38px",
  boxSizing: "border-box",
 }}
  onFocus={(e) => (e.target.style.borderColor = "#1e3a5f")}
 onBlur={(e) => (e.target.style.borderColor = "#ddd")}
/>
</div>

<div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
 <label
  style={{
  display: "block",
   fontSize: "11px",
  fontWeight: "600",
   marginBottom: "4px",
  color: "#333",
   textTransform: "uppercase",
 letterSpacing: "0.5px",
  lineHeight: "1.2",
   height: "14px",
 }}
>
 Check-in
</label>
<input
 ref={checkInInputRef}
  type="date"
 value={filters.checkIn || ""}
  onChange={(e) => {
 handleFilterChange("checkIn", e.target.value)
  if (filters.checkOut && e.target.value && filters.checkOut <= e.target.value) {
   handleFilterChange("checkOut", "")
  }
 }}
 min={new Date().toISOString().split("T")[0]}
 style={{
  width: "100%",
   border: "1px solid #ddd",
 borderRadius: "12px",
  padding: "8px 10px",
   fontSize: "13px",
 outline: "none",
  transition: "border-color 0.2s",
  backgroundColor: "#fff",
 height: "38px",
  boxSizing: "border-box",
 }}
 onFocus={(e) => (e.target.style.borderColor = "#1e3a5f")}
 onBlur={(e) => (e.target.style.borderColor = "#ddd")}
/>
</div>

<div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
 <div
  style={{
  fontSize: "11px",
   fontWeight: "600",
 color: "#333",
  marginBottom: "4px",
   textTransform: "uppercase",
 letterSpacing: "0.5px",
  lineHeight: "1.2",
   textAlign: "center",
 height: "14px",
}}
>
 Duration
</div>
<div 
 style={{ 
 fontSize: "13px", 
  fontWeight: "600", 
 color: "#333", 
  height: "38px",
 display: "flex", 
  alignItems: "center", 
 justifyContent: "center",
  border: "1px solid #ddd",
 borderRadius: "12px",
  backgroundColor: "#f9f9f9",
 boxSizing: "border-box",
}}
>
 {filters.checkIn && filters.checkOut
  ? `${Math.ceil((new Date(filters.checkOut) - new Date(filters.checkIn)) / (1000 * 60 * 60 * 24))} night${Math.ceil((new Date(filters.checkOut) - new Date(filters.checkIn)) / (1000 * 60 * 60 * 24)) !== 1 ? "s" : ""}`
   : "-"}
</div>
</div>

<div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
 <label
  style={{
  display: "block",
   fontSize: "11px",
 fontWeight: "600",
  marginBottom: "4px",
   color: "#333",
 textTransform: "uppercase",
  letterSpacing: "0.5px",
   lineHeight: "1.2",
 height: "14px",
}}
>
 Check-out
</label>
<input
 ref={checkOutInputRef}
  type="date"
 value={filters.checkOut || ""}
  onChange={(e) => handleFilterChange("checkOut", e.target.value)}
 min={
  filters.checkIn
   ? (() => {
     const checkInDate = new Date(filters.checkIn)
      checkInDate.setDate(checkInDate.getDate() + 1)
    return checkInDate.toISOString().split("T")[0]
   })()
   : new Date().toISOString().split("T")[0]
 }
 disabled={!filters.checkIn}
 style={{
  width: "100%",
   border: "1px solid #ddd",
 borderRadius: "12px",
  padding: "8px 10px",
   fontSize: "13px",
 outline: "none",
  transition: "border-color 0.2s",
  backgroundColor: filters.checkIn ? "#fff" : "#f5f5f5",
 cursor: filters.checkIn ? "pointer" : "not-allowed",
  opacity: filters.checkIn ? 1 : 0.6,
  height: "38px",
 boxSizing: "border-box",
 }}
 onFocus={(e) => filters.checkIn && (e.target.style.borderColor = "#1e3a5f")}
 onBlur={(e) => (e.target.style.borderColor = "#ddd")}
/>
</div>

<div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
 <label
  style={{
  display: "block",
   fontSize: "11px",
 fontWeight: "600",
  marginBottom: "4px",
   color: "#333",
 textTransform: "uppercase",
  letterSpacing: "0.5px",
   lineHeight: "1.2",
 height: "14px",
}}
>
 Guests
</label>
<div
 style={{
 display: "flex",
  alignItems: "center",
 border: "1px solid #ddd",
  borderRadius: "12px",
 backgroundColor: "#fff",
  height: "38px",
 boxSizing: "border-box",
  overflow: "hidden",
}}
>
 <button
  type="button"
   onClick={() => {
  const currentGuests = filters.guests || 1;
   const newGuests = Math.max(1, currentGuests - 1);
  handleFilterChange("guests", newGuests);
 }}
 style={{
  border: "none",
   background: "transparent",
 padding: "0 12px",
  fontSize: "18px",
   fontWeight: "600",
 color: "#333",
  cursor: "pointer",
   height: "100%",
 display: "flex",
  alignItems: "center",
   justifyContent: "center",
 transition: "background-color 0.2s",
}}
 onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f5f5f5")}
 onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
>
 −
</button>
<div
 style={{
 flex: 1,
  textAlign: "center",
 fontSize: "13px",
  fontWeight: "600",
 color: "#333",
  padding: "0 8px",
}}
>
 {filters.guests || 1} {(filters.guests || 1) === 1 ? "guest" : "guests"}
</div>
<button
 type="button"
  onClick={() => {
 const currentGuests = filters.guests || 1;
  const newGuests = currentGuests + 1;
 handleFilterChange("guests", newGuests);
}}
style={{
 border: "none",
  background: "transparent",
padding: "0 12px",
 fontSize: "18px",
  fontWeight: "600",
color: "#333",
 cursor: "pointer",
  height: "100%",
display: "flex",
 alignItems: "center",
  justifyContent: "center",
transition: "background-color 0.2s",
}}
onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f5f5f5")}
onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
>
+
</button>
</div>
</div>

<div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
 <div
  style={{
 fontSize: "11px",
  fontWeight: "600",
 marginBottom: "4px",
  color: "transparent",
 textTransform: "uppercase",
  letterSpacing: "0.5px",
 lineHeight: "1.2",
  height: "14px",
}}
>
 &nbsp;
</div>
<button
 onClick={() => refetch()}
 style={{
 background: "#FF385C",
  color: "#fff",
border: "none",
 borderRadius: "12px",
  padding: "8px 20px",
 fontSize: "14px",
  fontWeight: "600",
cursor: "pointer",
 transition: "all 0.2s",
  display: "flex",
alignItems: "center",
 justifyContent: "center",
  height: "38px",
whiteSpace: "nowrap",
 width: "100%",
  boxSizing: "border-box",
}}
onMouseEnter={(e) => (e.currentTarget.style.background = "#E61E4D")}
onMouseLeave={(e) => (e.currentTarget.style.background = "#FF385C")}
>
Search
</button>
</div>
</div>
</div>
</div>

<div style={{ width: "100%", padding: "16px 0" }}>
 {loading ? (
  <div
   style={{
  display: "flex",
   justifyContent: "center",
 alignItems: "center",
  minHeight: "50vh",
   width: "100%",
 padding: "40px 20px",
 }}
>
 <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}>
  <span className="visually-hidden">Loading...</span>
 </div>
</div>
) : hotels.length === 0 ? (
 <div className="no-results-full">
  <div className="no-results-card text-center">
   <h3 className="mb-2">No places found</h3>
    <p className="text-muted mb-0">Try adjusting your search or filters</p>
  </div>
 </div>
) : (
 <div className="py-3" style={{ width: "100%" }}>
  <div
   className="hotels-grid"
   style={{ width: "100%" }}
 >
  {hotels.map((hotel) => (
   <div
    key={hotel.id || hotel._id}
     style={{ cursor: "pointer" }}
   onClick={() => navigate(`/hotel/${hotel.id || hotel._id}`)}
    className="hotel-card"
  >
  <div className="position-relative hotel-card-image" style={{ height: "300px" }}>
   {(() => {
    let imageUrl = ""
     if (hotel.images && hotel.images.length > 0) {
     const firstImage = hotel.images[0]
      if (typeof firstImage === "string") {
      imageUrl = firstImage
     } else if (firstImage && typeof firstImage === "object" && firstImage.url) {
      imageUrl = firstImage.url
     } else if (firstImage) {
      imageUrl = String(firstImage)
     }

      imageUrl = resolveAssetUrl(imageUrl)
    }

     return imageUrl ? (
     <img
      src={imageUrl || "/placeholder.svg"}
       alt={hotel.name}
     className="w-100 rounded-4 position-relative"
      style={{
      height: "300px",
       objectFit: "cover",
      transition: "transform 0.3s ease",
       zIndex: 1,
     }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
     onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      onError={(e) => {
     e.target.style.display = "none"
      const placeholder = e.target.parentElement.querySelector(".image-placeholder")
     if (placeholder) {
      placeholder.style.display = "flex"
     }
    }}
   />
  ) : null
 })()}
 <div
  className="w-100 h-100 rounded-4 bg-light d-flex align-items-center justify-content-center position-absolute top-0 start-0 image-placeholder"
   style={{
  display: hotel.images && hotel.images.length > 0 ? "none" : "flex",
   zIndex: 0,
 }}
>
 <span className="text-muted">Preview unavailable</span>
</div>
{isAuthenticated && (
 <button
  className="position-absolute top-0 end-0 m-3 border-0"
   style={{
 zIndex: 10,
  cursor: "pointer",
   transition: "transform 0.2s ease",
 display: "flex",
  alignItems: "center",
   justifyContent: "center",
 padding: "4px",
  margin: "12px",
   background: "transparent",
}}
 onClick={(e) => toggleFavorite(hotel.id || hotel._id, e)}
 onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
 onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
 title={checkIsFavorite(hotel.id || hotel._id) ? "Remove from favorites" : "Add to favorites"}
>
 <svg
  width="20"
   height="20"
 viewBox="0 0 16 16"
  style={{
 transition: "all 0.2s ease",
  pointerEvents: "none",
 flexShrink: 0,
}}
>
 {checkIsFavorite(hotel.id || hotel._id) ? (
  <path
   d="M8 2.748l-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748z"
   fill="#FF385C"
   stroke="#FF385C"
   strokeWidth="0.5"
  />
 ) : (
  <path
   d="M8 2.748l-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748z"
   fill="white"
   stroke="#222"
   strokeWidth="1"
  />
 )}
</svg>
</button>
)}
</div>
<div className="hotel-card-body">
 <div className="d-flex justify-content-between align-items-start mb-1">
  <div className="flex-grow-1">
   <div className="fw-semibold" style={{ fontSize: "16px", lineHeight: "1.2" }}>
    {hotel.location?.city || "Unknown"}, {hotel.location?.country || "Unknown"}
   </div>
   <div className="text-muted small mt-1" style={{ fontSize: "14px" }}>
    {hotel.name}
   </div>
  </div>
  <div className="d-flex align-items-center ms-2">
   <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16" className="text-warning">
    <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z" />
   </svg>
   <span className="ms-1" style={{ fontSize: "14px", fontWeight: "500" }}>
    {hotel.rating?.toFixed(1) || "0.0"}
   </span>
  </div>
 </div>
 <div className="text-muted small mb-1" style={{ fontSize: "14px" }}>
  {hotel.totalReviews || 0} {hotel.totalReviews === 1 ? "review" : "reviews"}
 </div>
 <div className="mt-2">
  <div className="d-flex align-items-baseline gap-1">
   <span className="fw-semibold" style={{ fontSize: "16px" }}>
    PKR {hotel.pricing?.basePrice || hotel.priceRange?.min || "0"}
   </span>
   <span className="text-muted" style={{ fontSize: "14px" }}>
    / night
   </span>
  </div>
 </div>
 {hotel.amenities && hotel.amenities.length > 0 && (
  <div className="mt-2 d-flex flex-wrap gap-1">
   {hotel.amenities.slice(0, 3).map((amenity, idx) => (
    <span key={idx} className="badge bg-light text-dark small">
     {amenity}
    </span>
   ))}
   {hotel.amenities.length > 3 && (
    <span className="badge bg-light text-dark small">+{hotel.amenities.length - 3}</span>
   )}
  </div>
 )}
</div>
</div>
))}
</div>
</div>
)}
</div>
</div>
)
}

export default BrowseHotels
