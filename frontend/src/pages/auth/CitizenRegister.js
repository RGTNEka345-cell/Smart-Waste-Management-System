import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./CitizenRegister.css";
import Navbar from "../../components/HomePage/Navbar";
import Footer from "../../components/HomePage/Footer";
import { 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaLock, 
  FaHome, 
  FaCalendarAlt,
  FaVenusMars,
  FaMapMarkerAlt,
  FaCamera,
  FaCheckCircle,
  FaSpinner,
  FaRedo,
  FaArrowLeft
} from "react-icons/fa";

const CitizenRegister = () => {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    address: "",
    date_of_birth: "",
    gender: "Male",
    latitude: "",
    longitude: "",
    photo: null
  });

  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(600);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [errors, setErrors] = useState({});

  const mapRef = useRef(null);
  const markerRef = useRef(null);

  // Handle form changes
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    
    console.log(`Field changed: ${name} = ${value}`);
    
    if (name === 'photo' && files && files[0]) {
      const file = files[0];
      setForm(prev => ({ ...prev, photo: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle OTP input
  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Auto-focus next input
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  // Handle OTP key events
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`).focus();
    }
  };

  /* ---------------- Google Maps + Search ---------------- */
  useEffect(() => {
    const script = document.createElement("script");
    const key = process.env.REACT_APP_GOOGLE_MAPS_KEY || "AIzaSyDCDq2OdTXSFuee8I7L83_0vmavC65lMCc";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
    script.async = true;
    script.onload = initMap;
    document.body.appendChild(script);
    
    return () => {
      // Cleanup
      if (mapRef.current) {
        mapRef.current = null;
      }
    };
  }, []);

  // Initialize Google Map
  const initMap = () => {
    const mapElement = document.getElementById("map");
    if (!mapElement) return;

    const map = new window.google.maps.Map(mapElement, {
      center: { lat: 6.9271, lng: 79.8612 },
      zoom: 12,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }]
        }
      ]
    });

    mapRef.current = map;

    const marker = new window.google.maps.Marker({
      position: map.getCenter(),
      map,
      draggable: true,
      title: "Drag to set your location"
    });

    markerRef.current = marker;

    // Add search box
    const input = document.getElementById("search-box");
    if (input) {
      const searchBox = new window.google.maps.places.SearchBox(input);

      map.controls[window.google.maps.ControlPosition.TOP_LEFT].push(input);

      searchBox.addListener("places_changed", () => {
        const places = searchBox.getPlaces();
        if (!places.length) return;

        const place = places[0];
        if (!place.geometry) return;

        map.panTo(place.geometry.location);
        marker.setPosition(place.geometry.location);

        setForm(prev => ({
          ...prev,
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng(),
          address: place.formatted_address || prev.address
        }));
      });
    }

    marker.addListener("dragend", (e) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      
      setForm(prev => ({
        ...prev,
        latitude: lat,
        longitude: lng
      }));

      // Reverse geocode to get address
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === "OK" && results[0]) {
          setForm(prev => ({
            ...prev,
            address: results[0].formatted_address
          }));
        }
      });
    });

    // Update form on map click
    map.addListener("click", (e) => {
      marker.setPosition(e.latLng);
      setForm(prev => ({
        ...prev,
        latitude: e.latLng.lat(),
        longitude: e.latLng.lng()
      }));
    });
  };

  /* ---------------- OTP Countdown ---------------- */
  useEffect(() => {
    if (step === 2 && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    } else if (step === 2 && timeLeft === 0) {
      setCanResend(true);
    }
  }, [step, timeLeft]);

  /* ---------------- Form Validation ---------------- */
  const validateForm = () => {
    const newErrors = {};
    
    if (!form.full_name.trim()) newErrors.full_name = "Full name is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Invalid email format";
    }
    if (!form.phone.trim()) newErrors.phone = "Phone number is required";
    if (!form.password) newErrors.password = "Password is required";
    else if (form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (!form.address.trim()) newErrors.address = "Address is required";
    if (!form.date_of_birth) newErrors.date_of_birth = "Date of birth is required";
    if (!form.latitude || !form.longitude) {
      newErrors.location = "Please select your location on the map";
    }
    
    return newErrors;
  };

  /* ---------------- API Calls ---------------- */
  const registerCitizen = async () => {
    console.log('Form data before submission:', form);
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      alert('Please fill all required fields correctly');
      return;
    }

    setLoading(true);
    
    try {
      // Create FormData object
      const formData = new FormData();
      
      // Append all form fields
      formData.append('full_name', form.full_name);
      formData.append('email', form.email);
      formData.append('phone', form.phone);
      formData.append('password', form.password);
      formData.append('address', form.address);
      formData.append('date_of_birth', form.date_of_birth);
      formData.append('gender', form.gender);
      formData.append('latitude', form.latitude);
      formData.append('longitude', form.longitude);
      
      // Append photo if exists
      if (form.photo) {
        formData.append('photo', form.photo);
      }
      
      // Log what we're sending
      console.log('Sending form data with keys:', Array.from(formData.keys()));
      
      // Send to backend
      const res = await axios.post("http://localhost:5000/api/citizen/register", formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 10000 // 10 second timeout
      });

      console.log('Registration response:', res.data);

      if (res.data.success || res.data.message) {
        setStep(2);
        setTimeLeft(600);
        setCanResend(false);
      } else {
        alert(res.data.message || "Registration failed");
      }
    } catch (err) {
      console.error('Registration error details:', err);
      
      if (err.response) {
        // Server responded with error
        const errorData = err.response.data;
        console.error('Server error response:', errorData);
        
        if (errorData.missingFields) {
          alert(`Missing fields: ${errorData.missingFields.join(', ')}`);
        } else {
          alert(errorData.message || `Server error: ${err.response.status}`);
        }
      } else if (err.request) {
        // No response received
        console.error('No response received:', err.request);
        alert("No response from server. Check if backend is running.");
      } else {
        // Request setup error
        console.error('Request setup error:', err.message);
        alert(`Request error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      alert("Please enter 6-digit OTP code");
      return;
    }

    setLoading(true);
    
    try {
      const res = await axios.post("http://localhost:5000/api/citizen/verify-otp", {
        email: form.email,
        otp: otpCode
      });

      if (res.data.success) {
        alert("Email verified successfully! You can now login.");
        window.location.href = "/login/citizen";
      } else {
        alert(res.data.message || "Invalid OTP");
        // Clear OTP on error
        setOtp(["", "", "", "", "", ""]);
        document.getElementById('otp-0').focus();
      }
    } catch (err) {
      alert(err?.response?.data?.message || "OTP verification failed");
      console.error("OTP verification failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (!canResend) return;
    
    setLoading(true);
    
    try {
      const res = await axios.post("http://localhost:5000/api/citizen/resend-otp", {
        email: form.email
      });

      if (res.data.success) {
        setTimeLeft(600);
        setCanResend(false);
        setOtp(["", "", "", "", "", ""]);
        document.getElementById('otp-0').focus();
        alert("New OTP sent to your email");
      } else {
        alert(res.data.message || "Failed to resend OTP");
      }
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to resend OTP");
      console.error("Resend OTP failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  /* ---------------- OTP Screen ---------------- */
  if (step === 2) {
    return (
      <>
        <Navbar />
        <div className="page-with-navbar">
          <div className="register-container">
          <div className="register-header">
            <h1><FaUser /> Email Verification</h1>
            <p>Verify your email to complete registration</p>
          </div>

          <div className="otp-verification-container">
            <div className="otp-header">
              <h2>OTP Verification</h2>
              <p>OTP sent to <strong>{form.email}</strong></p>
              <p className="otp-note">Check your email inbox (and spam folder)</p>
            </div>

            <div className="otp-input-group">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  maxLength="1"
                  value={otp[index]}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  className="otp-input"
                  autoFocus={index === 0}
                />
              ))}
            </div>

            <div className="timer-display">
              <p>Time remaining: <span className="time-left">{formatTime(timeLeft)}</span></p>
              <p className="expiry-note">OTP expires in {formatTime(timeLeft)}</p>
            </div>

            <div className="otp-actions">
              <button 
                className="back-btn" 
                onClick={() => setStep(1)}
                disabled={loading}
              >
                <FaArrowLeft /> Back to Registration
              </button>
              
              <button 
                className="verify-btn" 
                onClick={verifyOtp} 
                disabled={loading || timeLeft === 0}
              >
                {loading ? (
                  <>
                    <FaSpinner className="spinner" /> Verifying...
                  </>
                ) : (
                  <>
                    <FaCheckCircle /> Verify OTP
                  </>
                )}
              </button>
            </div>

            <div className="resend-section">
              <p>
                Didn't receive the code? 
                <button 
                  className={`resend-btn ${!canResend ? 'disabled' : ''}`}
                  onClick={resendOtp}
                  disabled={!canResend || loading}
                >
                  <FaRedo /> {canResend ? 'Resend OTP' : `Resend available in ${formatTime(timeLeft)}`}
                </button>
              </p>
            </div>
          </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  /* ---------------- Register Form ---------------- */
  return (
    <>
      <Navbar />
      <div className="page-with-navbar">
        <div className="register-container">
        <div className="register-header">
          <h1><FaUser /> Citizen Registration</h1>
          <p>Join our Smart Waste Management System</p>
        </div>

        <div className="register-form">
          <div className="form-grid">
            {/* Personal Information */}
            <div className="form-section">
              <h3><FaUser /> Personal Information</h3>
            
            <div className="form-group">
              <label><FaUser /> Full Name *</label>
              <input 
                className={`form-input ${errors.full_name ? 'error' : ''}`}
                name="full_name" 
                placeholder="Full Name" 
                value={form.full_name}
                onChange={handleChange}
                required
              />
              {errors.full_name && <span className="error-message">{errors.full_name}</span>}
            </div>

            <div className="form-group">
              <label><FaEnvelope /> Email *</label>
              <input 
                className={`form-input ${errors.email ? 'error' : ''}`}
                name="email" 
                placeholder="Email" 
                type="email"
                value={form.email}
                onChange={handleChange}
                required
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label><FaPhone /> Phone Number *</label>
              <input 
                className={`form-input ${errors.phone ? 'error' : ''}`}
                name="phone" 
                placeholder="Phone" 
                value={form.phone}
                onChange={handleChange}
                required
              />
              {errors.phone && <span className="error-message">{errors.phone}</span>}
            </div>
          </div>

          {/* Account Security */}
          <div className="form-section">
            <h3><FaLock /> Account Security</h3>
            
            <div className="form-group">
              <label><FaLock /> Password *</label>
              <input 
                className={`form-input ${errors.password ? 'error' : ''}`}
                type="password" 
                name="password" 
                placeholder="Password" 
                value={form.password}
                onChange={handleChange}
                required
              />
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label><FaCalendarAlt /> Date of Birth *</label>
              <input 
                className={`form-input ${errors.date_of_birth ? 'error' : ''}`}
                type="date" 
                name="date_of_birth" 
                value={form.date_of_birth}
                onChange={handleChange}
                required
              />
              {errors.date_of_birth && <span className="error-message">{errors.date_of_birth}</span>}
            </div>

            <div className="form-group">
              <label><FaVenusMars /> Gender</label>
              <select 
                className="form-input" 
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
        </div>

        {/* Address & Location */}
        <div className="form-section">
          <h3><FaHome /> Address & Location</h3>
          
          <div className="form-group">
            <label><FaHome /> Address *</label>
            <textarea 
              className={`form-input ${errors.address ? 'error' : ''}`}
              name="address" 
              placeholder="Address" 
              rows="3"
              value={form.address}
              onChange={handleChange}
              required
            />
            {errors.address && <span className="error-message">{errors.address}</span>}
          </div>

          <div className="form-group">
            <label><FaMapMarkerAlt /> Search Location</label>
            <div className="location-search">
              <input 
                id="search-box" 
                className="form-input" 
                placeholder="Search your location"
              />
            </div>
            {errors.location && <span className="error-message">{errors.location}</span>}
          </div>

          {/* Map Container */}
          <div className="map-container">
            <div id="map" className="map"></div>
            
            <div className="coordinates-display">
              <div className="coordinate">
                <span>Latitude:</span>
                <strong>{form.latitude || "Click on map"}</strong>
              </div>
              <div className="coordinate">
                <span>Longitude:</span>
                <strong>{form.longitude || "Click on map"}</strong>
              </div>
            </div>
            
            <p className="map-instruction">
              <FaMapMarkerAlt /> Click on the map or drag the marker to set your location
            </p>
          </div>
        </div>

        {/* Photo Upload */}
        <div className="form-section">
          <h3><FaCamera /> Profile Photo (Optional)</h3>
          
          <div className="photo-upload-container">
            <label className="file-upload-label">
              <input 
                type="file" 
                name="photo" 
                onChange={handleChange}
                accept="image/*"
                className="file-input"
              />
              <div className="upload-area">
                <FaCamera />
                <p>Click to upload profile photo</p>
                <small>JPG, PNG - Max 5MB</small>
              </div>
            </label>
            
            {photoPreview && (
              <div className="photo-preview">
                <img src={photoPreview} alt="Preview" />
                <p>Photo Preview</p>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="form-actions">
          <button 
            className="submit-btn" 
            onClick={registerCitizen}
            disabled={loading}
          >
            {loading ? (
              <>
                <FaSpinner className="spinner" /> Processing...
              </>
            ) : (
              <>
                <FaCheckCircle /> Register & Verify Email
              </>
            )}
          </button>
          
          <div className="debug-info" style={{ 
            marginTop: '20px', 
            padding: '10px', 
            background: '#f8f9fa', 
            borderRadius: '8px',
            fontSize: '0.8rem',
            color: '#666',
            display: 'none' // Change to 'block' for debugging
          }}>
            <strong>Debug Info:</strong>
            <div>Fields filled: {Object.keys(form).filter(key => form[key]).length} / {Object.keys(form).length}</div>
            <div>Latitude: {form.latitude || 'Not set'}</div>
            <div>Longitude: {form.longitude || 'Not set'}</div>
          </div>
          
          <p className="login-link">
            Already have an account? <a href="/login/citizen">Login here</a>
          </p>
          </div>
        </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default CitizenRegister;
