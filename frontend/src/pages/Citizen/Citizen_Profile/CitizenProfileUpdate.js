import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import "./CitizenProfileUpdate.css";
import { GoogleMap, Marker, Autocomplete } from "@react-google-maps/api";
import CitizenNavbar from "../../../components/Citizen/CitizenNavbar";

const CitizenProfileUpdate = () => {
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    address: "",
    date_of_birth: "",
    gender: "Male",
    latitude: "",
    longitude: "",
    photo: null
  });

  const [previewImage, setPreviewImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [autocomplete, setAutocomplete] = useState(null);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
  const [mapType, setMapType] = useState("roadmap");
  const [, setMap] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Map configuration
  const mapContainerStyle = {
    width: "100%",
    height: "300px",
    borderRadius: "12px",
    marginTop: "10px",
    border: "1px solid #e0e0e0"
  };

  const defaultCenter = {
    lat: 6.9271, // Sri Lanka coordinates
    lng: 79.8612
  };

  const [mapCenter, setMapCenter] = useState(defaultCenter);

  // Load Google Maps script
  useEffect(() => {
    const checkGoogleMaps = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        setIsGoogleMapsLoaded(true);
        return true;
      }
      return false;
    };

    if (checkGoogleMaps()) return;

    // Check if script is already loading
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      const interval = setInterval(() => {
        if (checkGoogleMaps()) {
          setIsGoogleMapsLoaded(true);
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }

    const script = document.createElement("script");
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'AIzaSyDCDq2OdTXSFuee8I7L83_0vmavC65lMCc';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      console.log("Google Maps loaded successfully");
      setIsGoogleMapsLoaded(true);
    };
    
    script.onerror = () => {
      console.error("Failed to load Google Maps");
      setErrorMessage("Failed to load Google Maps. Please check your API key.");
    };

    document.head.appendChild(script);

    return () => {
      // Don't remove script as it might be used elsewhere
    };
  }, []);

  // Load citizen data
  useEffect(() => {
    const citizen = JSON.parse(localStorage.getItem("citizen"));
    if (!citizen) return;

    const newForm = {
      full_name: citizen.full_name || "",
      phone: citizen.phone || "",
      address: citizen.address || "",
      date_of_birth: citizen.date_of_birth
        ? citizen.date_of_birth.split("T")[0]
        : "",
      gender: citizen.gender || "Male",
      latitude: citizen.latitude || "",
      longitude: citizen.longitude || "",
      photo: null
    };

    setForm(newForm);

    // Update map center if coordinates exist
    if (citizen.latitude && citizen.longitude) {
      const lat = parseFloat(citizen.latitude);
      const lng = parseFloat(citizen.longitude);
      setMapCenter({
        lat: isNaN(lat) ? defaultCenter.lat : lat,
        lng: isNaN(lng) ? defaultCenter.lng : lng
      });
    }

    if (citizen.photo_url) {
      setPreviewImage(`http://localhost:5000${citizen.photo_url}`);
    }
  }, [defaultCenter.lat, defaultCenter.lng]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "photo") {
      if (!files || !files[0]) return;

      const file = files[0];

      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage("Image must be under 5MB");
        return;
      }

      setForm({ ...form, photo: file });
      setPreviewImage(URL.createObjectURL(file));
      setErrorMessage("");
      return;
    }

    if (name === "address") {
      setSearchQuery(value);
    }

    setForm({ ...form, [name]: value });
  };

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrorMessage("Geolocation is not supported by your browser");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        
        setForm({
          ...form,
          latitude: lat,
          longitude: lng
        });
        
        setMapCenter({
          lat: parseFloat(lat),
          lng: parseFloat(lng)
        });
        
        setLoading(false);
        setSuccessMessage("Location detected successfully!");
      },
      (error) => {
        console.error("Geolocation error:", error);
        let errorMsg = "Location access denied";
        
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = "Please allow location access in your browser settings";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = "Location information is unavailable";
        } else if (error.code === error.TIMEOUT) {
          errorMsg = "Location request timed out";
        } else {
          errorMsg = "An unknown error occurred while getting location";
        }
        
        setErrorMessage(errorMsg);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Handle place selection from autocomplete
  const onPlaceChanged = () => {
    if (!autocomplete) {
      console.error("Autocomplete not initialized");
      return;
    }

    try {
      const place = autocomplete.getPlace();
      
      if (!place || !place.geometry || !place.geometry.location) {
        setErrorMessage("Please select a valid location from the suggestions");
        return;
      }

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const address = place.formatted_address || place.name || "";

      setForm({
        ...form,
        address: address,
        latitude: lat.toFixed(6),
        longitude: lng.toFixed(6)
      });

      setMapCenter({ lat, lng });
      setSearchQuery(address);
      setSuccessMessage("Location selected successfully!");
    } catch (error) {
      console.error("Error in onPlaceChanged:", error);
      setErrorMessage("Failed to select location. Please try again.");
    }
  };

  // Handle Enter key in search
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      e.preventDefault();
      performSearch();
    }
  };

  // Perform search
  const performSearch = () => {
    if (!searchQuery.trim()) {
      setErrorMessage("Please enter a location to search");
      return;
    }

    if (!window.google || !window.google.maps) {
      setErrorMessage("Google Maps not loaded yet");
      return;
    }

    setLoading(true);
    
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: searchQuery }, (results, status) => {
      setLoading(false);
      
      if (status === window.google.maps.GeocoderStatus.OK && results[0]) {
        const location = results[0].geometry.location;
        const lat = location.lat();
        const lng = location.lng();
        
        setForm({
          ...form,
          address: results[0].formatted_address,
          latitude: lat.toFixed(6),
          longitude: lng.toFixed(6)
        });
        
        setMapCenter({ lat, lng });
        setSuccessMessage("Location found!");
      } else {
        setErrorMessage("Could not find the location. Please try a different search term.");
      }
    });
  };

  // Handle map click
  const onMapClick = useCallback((e) => {
    if (!e.latLng) return;
    
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();

    setForm({
      ...form,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6)
    });

    setMapCenter({ lat, lng });
    
    // Reverse geocode to get address
    if (window.google && window.google.maps) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === window.google.maps.GeocoderStatus.OK && results[0]) {
          setForm(prev => ({
            ...prev,
            address: results[0].formatted_address
          }));
          setSearchQuery(results[0].formatted_address);
        }
      });
    }
  }, [form]);

  // Handle map load
  const onMapLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
  }, []);

  // Toggle map type
  const toggleMapType = () => {
    setMapType(prev => prev === "roadmap" ? "satellite" : "roadmap");
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const citizen = JSON.parse(localStorage.getItem("citizen"));
    if (!citizen?.id) {
      setErrorMessage("Please login again");
      return;
    }

    if (!form.full_name.trim()) {
      setErrorMessage("Full name is required");
      return;
    }

    // Validate coordinates
    if (form.latitude && form.longitude) {
      const lat = parseFloat(form.latitude);
      const lng = parseFloat(form.longitude);
      
      if (isNaN(lat) || lat < -90 || lat > 90) {
        setErrorMessage("Invalid latitude value");
        return;
      }
      if (isNaN(lng) || lng < -180 || lng > 180) {
        setErrorMessage("Invalid longitude value");
        return;
      }
    }

    try {
      setLoading(true);

      const data = new FormData();
      Object.keys(form).forEach((key) => {
        if (form[key] !== null && form[key] !== undefined) {
          data.append(key, form[key]);
        }
      });

      const token =
        localStorage.getItem("citizenToken") ||
        localStorage.getItem("token");

      const res = await axios.put(
        `http://localhost:5000/api/citizen/update-profile/${citizen.id}`,
        data,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "multipart/form-data"
          }
        }
      );

      if (res.data.success) {
        localStorage.setItem("citizen", JSON.stringify(res.data.citizen));
        setSuccessMessage("Profile updated successfully!");
        setForm({ ...form, photo: null });
      } else {
        setErrorMessage(res.data.message || "Update failed");
      }
    } catch (err) {
      console.error("Update error:", err);
      setErrorMessage(
        err.response?.data?.message || 
        "Server error. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <CitizenNavbar setActiveTab={() => {}} />
      <div className="profile-update-container">
        <div className="profile-header">
          <h2>Update Profile</h2>
          <p className="profile-subtitle">Update your personal information and location</p>
        </div>

      {successMessage && (
        <div className="success-message">{successMessage}</div>
      )}
      {errorMessage && (
        <div className="error-message">{errorMessage}</div>
      )}

      <form onSubmit={handleSubmit} className="profile-form">
        {/* Photo Section */}
        <div className="form-section">
          <h3 className="section-title">Profile Photo</h3>
          <div className="photo-section">
            <div className="photo-preview-container">
              <img
                src={previewImage || "/default-user.png"}
                alt="Profile Preview"
                className="profile-preview-img"
              />
            </div>
            <div className="photo-upload-controls">
              <label className="file-upload-label">
                Choose New Photo
                <input 
                  type="file" 
                  name="photo" 
                  accept="image/*" 
                  onChange={handleChange}
                  className="file-input"
                />
              </label>
              <p className="file-hint">Max size: 5MB (JPEG, PNG)</p>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="form-section">
          <h3 className="section-title">Personal Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="full_name">Full Name *</label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                placeholder="Enter your full name"
                value={form.full_name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="text"
                id="phone"
                name="phone"
                placeholder="Enter phone number"
                value={form.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date_of_birth">Date of Birth</label>
              <input
                type="date"
                id="date_of_birth"
                name="date_of_birth"
                value={form.date_of_birth}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="gender">Gender</label>
              <select 
                id="gender" 
                name="gender" 
                value={form.gender} 
                onChange={handleChange}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="address">Address</label>
            <textarea
              id="address"
              name="address"
              placeholder="Enter your address"
              value={form.address}
              onChange={handleChange}
              rows="3"
            />
          </div>
        </div>

        {/* Location Section */}
        <div className="form-section">
          <h3 className="section-title">Location Information</h3>
          
          <div className="location-controls">
            <div className="location-buttons">
              <button 
                type="button" 
                onClick={getCurrentLocation}
                className="location-btn"
                disabled={loading}
              >
                <span className="btn-icon">📍</span>
                {loading ? "Detecting..." : "Use Current Location"}
              </button>
              
              <button 
                type="button" 
                onClick={toggleMapType}
                className="location-btn secondary"
                disabled={!isGoogleMapsLoaded}
              >
                <span className="btn-icon">
                  {mapType === "roadmap" ? "🛰️" : "🗺️"}
                </span>
                {mapType === "roadmap" ? "Satellite View" : "Map View"}
              </button>
            </div>
          </div>

          {/* Google Maps Section */}
          <div className="map-section">
            <div className="map-search-container">
              <label htmlFor="location-search" className="map-search-label">
                Search Location
                <span className="map-search-hint"> (Type and press Enter or select from suggestions)</span>
              </label>
              {isGoogleMapsLoaded ? (
                <Autocomplete 
                  onLoad={(ac) => {
                    setAutocomplete(ac);
                  }}
                  onPlaceChanged={onPlaceChanged}
                  options={{
                    types: ['geocode', 'establishment'],
                    componentRestrictions: { country: 'lk' }
                  }}
                >
                  <input
                    id="location-search"
                    type="text"
                    placeholder="Type an address or place name and press Enter"
                    className="map-search-input-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleSearchKeyPress}
                  />
                </Autocomplete>
              ) : (
                <input
                  id="location-search"
                  type="text"
                  placeholder="Loading Google Maps..."
                  className="map-search-input-full"
                  disabled
                />
              )}
            </div>

            <div className="map-container">
              {isGoogleMapsLoaded ? (
                <>
                  <div className="map-type-indicator">
                    {mapType === "satellite" ? "🛰️ Satellite View" : "🗺️ Map View"}
                  </div>
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={mapCenter}
                    zoom={14}
                    onClick={onMapClick}
                    onLoad={onMapLoad}
                    options={{
                      streetViewControl: true,
                      mapTypeControl: true,
                      fullscreenControl: true,
                      zoomControl: true,
                      clickableIcons: true,
                      mapTypeId: mapType,
                      gestureHandling: "greedy"
                    }}
                  >
                    {form.latitude && form.longitude && (
                      <Marker 
                        position={mapCenter}
                        animation={window.google.maps.Animation.DROP}
                        title="Your selected location"
                      />
                    )}
                  </GoogleMap>
                </>
              ) : (
                <div className="map-placeholder">
                  <div className="loading-spinner"></div>
                  <p>Loading Google Maps...</p>
                  <p className="map-placeholder-hint">If map doesn't load, check your API key</p>
                </div>
              )}
            </div>

            <div className="coordinates-display">
              <div className="coordinate-item">
                <span className="coord-label">Latitude:</span>
                <span className="coord-value">{form.latitude || "Not set"}</span>
              </div>
              <div className="coordinate-item">
                <span className="coord-label">Longitude:</span>
                <span className="coord-value">{form.longitude || "Not set"}</span>
              </div>
            </div>
          </div>

          <div className="coordinates-row">
            <div className="form-group">
              <label htmlFor="latitude">Latitude</label>
              <input
                type="number"
                id="latitude"
                name="latitude"
                placeholder="Enter latitude"
                value={form.latitude}
                onChange={handleChange}
                step="any"
                min="-90"
                max="90"
              />
            </div>
            <div className="form-group">
              <label htmlFor="longitude">Longitude</label>
              <input
                type="number"
                id="longitude"
                name="longitude"
                placeholder="Enter longitude"
                value={form.longitude}
                onChange={handleChange}
                step="any"
                min="-180"
                max="180"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="form-actions">
          <button 
            type="submit" 
            className="submit-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Updating...
              </>
            ) : (
              "Update Profile"
            )}
          </button>
        </div>
        </form>
      </div>
    </>
  );
};

export default CitizenProfileUpdate;
