import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import "./CitizenProfileUpdate.css";
import { GoogleMap, Marker, Autocomplete } from "@react-google-maps/api";

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

  // Map configuration
  const mapContainerStyle = {
    width: "100%",
    height: "300px",
    borderRadius: "12px",
    marginTop: "10px"
  };

  const defaultCenter = {
    lat: 6.9271, // Sri Lanka coordinates
    lng: 79.8612
  };

  const [mapCenter, setMapCenter] = useState(defaultCenter);

  // Load Google Maps script
  useEffect(() => {
    if (window.google && window.google.maps) {
      setIsGoogleMapsLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'AIzaSyDCDq2OdTXSFuee8I7L83_0vmavC65lMCc'}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsGoogleMapsLoaded(true);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
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
      setMapCenter({
        lat: parseFloat(citizen.latitude),
        lng: parseFloat(citizen.longitude)
      });
    }

    if (citizen.photo_url) {
      setPreviewImage(`http://localhost:5000${citizen.photo_url}`);
    }
  }, []);

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
      },
      (error) => {
        setErrorMessage(`Location access denied: ${error.message}`);
        setLoading(false);
      }
    );
  };

  // Handle place selection from autocomplete
  const onPlaceChanged = () => {
    if (!autocomplete) return;

    const place = autocomplete.getPlace();
    if (!place.geometry || !place.geometry.location) {
      setErrorMessage("Please select a valid location from the suggestions");
      return;
    }

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    const address = place.formatted_address || "";

    setForm({
      ...form,
      address: address,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6)
    });

    setMapCenter({ lat, lng });
  };

  // Handle map click
  const onMapClick = useCallback((e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();

    setForm({
      ...form,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6)
    });

    setMapCenter({ lat, lng });
  }, [form]);

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
            <button 
              type="button" 
              onClick={getCurrentLocation}
              className="location-btn"
              disabled={loading}
            >
              <span className="btn-icon">📍</span>
              {loading ? "Detecting..." : "Use Current Location"}
            </button>
          </div>

          {/* Google Maps Section */}
          <div className="map-section">
            <div className="map-search-container">
              <label htmlFor="location-search">Search Location</label>
              {isGoogleMapsLoaded ? (
                <Autocomplete 
                  onLoad={(autocomplete) => setAutocomplete(autocomplete)}
                  onPlaceChanged={onPlaceChanged}
                >
                  <input
                    id="location-search"
                    type="text"
                    placeholder="Type an address or place name"
                    className="map-search-input"
                  />
                </Autocomplete>
              ) : (
                <input
                  id="location-search"
                  type="text"
                  placeholder="Loading map..."
                  className="map-search-input"
                  disabled
                />
              )}
            </div>

            <div className="map-container">
              {isGoogleMapsLoaded ? (
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={mapCenter}
                  zoom={14}
                  onClick={onMapClick}
                  options={{
                    streetViewControl: false,
                    mapTypeControl: false,
                    fullscreenControl: false,
                    zoomControl: true,
                    clickableIcons: false
                  }}
                >
                  {form.latitude && form.longitude && (
                    <Marker 
                      position={mapCenter}
                      icon={{
                        url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
                      }}
                    />
                  )}
                </GoogleMap>
              ) : (
                <div className="map-placeholder">
                  Loading map...
                </div>
              )}
            </div>
          </div>

          <div className="coordinates-row">
            <div className="form-group">
              <label htmlFor="latitude">Latitude</label>
              <input
                type="number"
                id="latitude"
                name="latitude"
                placeholder="Latitude"
                value={form.latitude}
                onChange={handleChange}
                step="any"
              />
            </div>
            <div className="form-group">
              <label htmlFor="longitude">Longitude</label>
              <input
                type="number"
                id="longitude"
                name="longitude"
                placeholder="Longitude"
                value={form.longitude}
                onChange={handleChange}
                step="any"
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
  );
};

export default CitizenProfileUpdate;