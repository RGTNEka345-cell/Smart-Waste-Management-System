import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./CollectorRegister.css";
import {
  FaRecycle,
  FaUserCircle,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaVenusMars,
  FaLock,
  FaTruck,
  FaTrashAlt,
  FaBuilding,
  FaIndustry,
  FaCamera,
  FaCloudUploadAlt,
  FaIdCard,
  FaMapMarkerAlt,
  FaMap,
  FaClock,
  FaArrowLeft,
  FaArrowRight,
  FaPaperPlane,
  FaCheckCircle,
  FaSpinner,
  FaSearchLocation,
  FaMapPin
} from "react-icons/fa";

const CollectorRegister = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [vehiclePhotoPreview, setVehiclePhotoPreview] = useState(null);
  
  const [form, setForm] = useState({
    // Step 1: Personal Information
    fullName: "",
    email: "",
    phone: "",
    gender: "Male",
    password: "",
    confirmPassword: "",
    
    // Step 2: Collection Details
    collectionType: "",
    vehicleNumber: "",
    vehiclePhoto: null,
    
    // Step 3: Factory Details (conditional)
    factoryName: "",
    factoryLicenceNo: "",
    factoryAddress: "",
    factoryLat: "",
    factoryLng: "",
    factoryContact: "",
    wasteTypesAccepted: "",
    operatingHours: ""
  });

  const [errors, setErrors] = useState({});

  // Load Google Maps
  useEffect(() => {
    if (form.collectionType === "Factory" && !window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDCDq2OdTXSFuee8I7L83_0vmavC65lMCc&libraries=places`;
      script.async = true;
      script.onload = () => {
        setMapLoaded(true);
        initMap();
      };
      document.head.appendChild(script);
    } else if (form.collectionType === "Factory" && window.google) {
      setMapLoaded(true);
      setTimeout(initMap, 100);
    }
  }, [form.collectionType]);

  // Initialize Google Map
  const initMap = () => {
    if (!window.google || !document.getElementById('factory-map')) return;

    const map = new window.google.maps.Map(document.getElementById('factory-map'), {
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

    const searchBox = new window.google.maps.places.SearchBox(
      document.getElementById('factory_location_search')
    );

    let marker;

    map.addListener('bounds_changed', () => {
      searchBox.setBounds(map.getBounds());
    });

    searchBox.addListener('places_changed', () => {
      const places = searchBox.getPlaces();
      if (places.length === 0) return;
      const place = places[0];
      if (!place.geometry) return;

      map.setCenter(place.geometry.location);
      if (marker) marker.setMap(null);
      marker = new window.google.maps.Marker({
        map: map,
        position: place.geometry.location,
        title: place.name
      });

      setForm(prev => ({
        ...prev,
        factoryLat: place.geometry.location.lat(),
        factoryLng: place.geometry.location.lng(),
        factoryAddress: place.formatted_address
      }));
    });

    map.addListener('click', (e) => {
      if (marker) marker.setMap(null);
      marker = new window.google.maps.Marker({
        position: e.latLng,
        map: map
      });
      
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: e.latLng }, (results, status) => {
        if (status === "OK" && results[0]) {
          setForm(prev => ({
            ...prev,
            factoryLat: e.latLng.lat(),
            factoryLng: e.latLng.lng(),
            factoryAddress: results[0].formatted_address
          }));
        }
      });
    });
  };

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === 'file' && files && files[0]) {
      const file = files[0];
      
      if (name === 'vehiclePhoto') {
        setForm(prev => ({ ...prev, vehiclePhoto: file }));
        
        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setVehiclePhotoPreview(reader.result);
        };
        reader.readAsDataURL(file);
      }
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Validate current step
  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 1) {
      if (!form.fullName.trim()) newErrors.fullName = "Full name is required";
      if (!form.email.trim()) newErrors.email = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        newErrors.email = "Invalid email format";
      }
      if (!form.phone.trim()) newErrors.phone = "Phone number is required";
      if (!form.password) newErrors.password = "Password is required";
      else if (form.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters";
      }
      if (form.password !== form.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }
    
    if (step === 2) {
      if (!form.collectionType) {
        newErrors.collectionType = "Please select collection type";
      }
      if (!form.vehicleNumber.trim()) {
        newErrors.vehicleNumber = "Vehicle number is required";
      }
    }
    
    if (step === 3 && form.collectionType === "Factory") {
      if (!form.factoryName.trim()) newErrors.factoryName = "Factory name is required";
      if (!form.factoryLicenceNo.trim()) newErrors.factoryLicenceNo = "Factory licence number is required";
      if (!form.factoryAddress.trim()) newErrors.factoryAddress = "Factory address is required";
      if (!form.factoryContact.trim()) newErrors.factoryContact = "Factory contact is required";
      if (!form.factoryLat || !form.factoryLng) {
        newErrors.factoryLocation = "Please select factory location on map";
      }
    }
    
    return newErrors;
  };

  // Navigation between steps
  const nextStep = () => {
    const stepErrors = validateStep(currentStep);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const stepErrors = validateStep(3);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    
    setLoading(true);
    
    try {
      // Prepare form data
      const formData = new FormData();
      Object.keys(form).forEach(key => {
        if (form[key] !== null && form[key] !== '') {
          formData.append(key, form[key]);
        }
      });
      
      // Simulate API call
      console.log("Collector Registration Data:", Object.fromEntries(formData));
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSuccess(true);
      setLoading(false);
      
      // Redirect after success
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (error) {
      console.error("Registration error:", error);
      setErrors({ submit: "Registration failed. Please try again." });
      setLoading(false);
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="form-section">
            <h3 className="section-title">
              <FaUserCircle /> Personal Information
            </h3>
            
            <div className="form-grid">
              <div className="form-group">
                <label><FaUser /> Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  placeholder="Enter your full name"
                  value={form.fullName}
                  onChange={handleChange}
                  className={errors.fullName ? 'error' : ''}
                  required
                />
                {errors.fullName && <span className="error-message">{errors.fullName}</span>}
              </div>
              
              <div className="form-group">
                <label><FaEnvelope /> Email Address *</label>
                <input
                  type="email"
                  name="email"
                  placeholder="example@domain.com"
                  value={form.email}
                  onChange={handleChange}
                  className={errors.email ? 'error' : ''}
                  required
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>
              
              <div className="form-group">
                <label><FaPhone /> Phone Number *</label>
                <input
                  type="text"
                  name="phone"
                  placeholder="+94 XX XXX XXXX"
                  value={form.phone}
                  onChange={handleChange}
                  className={errors.phone ? 'error' : ''}
                  required
                />
                {errors.phone && <span className="error-message">{errors.phone}</span>}
              </div>
              
              <div className="form-group">
                <label><FaVenusMars /> Gender *</label>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div className="form-group">
                <label><FaLock /> Password *</label>
                <input
                  type="password"
                  name="password"
                  placeholder="Create a strong password"
                  value={form.password}
                  onChange={handleChange}
                  className={errors.password ? 'error' : ''}
                  required
                />
                {errors.password && <span className="error-message">{errors.password}</span>}
              </div>
              
              <div className="form-group">
                <label><FaLock /> Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Re-enter your password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className={errors.confirmPassword ? 'error' : ''}
                  required
                />
                {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="form-section">
            <h3 className="section-title">
              <FaTruck /> Collection Details
            </h3>
            
            <div className="form-grid">
              <div className="form-group">
                <label><FaTrashAlt /> Collection Type *</label>
                <div className="radio-group">
                  <label className={`radio-option ${form.collectionType === 'Government' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="collectionType"
                      value="Government"
                      checked={form.collectionType === 'Government'}
                      onChange={handleChange}
                    />
                    <FaBuilding /> Government
                  </label>
                  <label className={`radio-option ${form.collectionType === 'Factory' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="collectionType"
                      value="Factory"
                      checked={form.collectionType === 'Factory'}
                      onChange={handleChange}
                    />
                    <FaIndustry /> Factory
                  </label>
                </div>
                {errors.collectionType && <span className="error-message">{errors.collectionType}</span>}
              </div>
              
              <div className="form-group">
                <label><FaTruck /> Vehicle Number *</label>
                <input
                  type="text"
                  name="vehicleNumber"
                  placeholder="e.g., WP ABC-1234"
                  value={form.vehicleNumber}
                  onChange={handleChange}
                  className={errors.vehicleNumber ? 'error' : ''}
                  required
                />
                {errors.vehicleNumber && <span className="error-message">{errors.vehicleNumber}</span>}
              </div>
              
              <div className="form-group">
                <label><FaCamera /> Vehicle Photo</label>
                <label htmlFor="vehiclePhoto" className="file-upload">
                  <FaCloudUploadAlt />
                  <p>Click to upload vehicle photo</p>
                  <small>Max file size: 5MB</small>
                </label>
                <input
                  type="file"
                  id="vehiclePhoto"
                  name="vehiclePhoto"
                  onChange={handleChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                
                {vehiclePhotoPreview && (
                  <div style={{ marginTop: '15px', textAlign: 'center' }}>
                    <img
                      src={vehiclePhotoPreview}
                      alt="Vehicle Preview"
                      style={{
                        width: '200px',
                        height: '150px',
                        borderRadius: '10px',
                        objectFit: 'cover',
                        border: '3px solid var(--secondary)'
                      }}
                    />
                    <p style={{ marginTop: '10px', fontSize: '0.9rem', color: '#666' }}>
                      Vehicle Photo Preview
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {form.collectionType === 'Factory' && (
              <div className="factory-section">
                <h4 style={{ color: 'var(--dark)', marginBottom: '15px' }}>
                  <FaIndustry /> Factory Details Required
                </h4>
                <p style={{ color: 'var(--gray)' }}>
                  Please fill in factory details in the next step to complete your registration.
                </p>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="form-section">
            {form.collectionType === 'Factory' ? (
              <div className="factory-section">
                <h3 className="section-title">
                  <FaIndustry /> Factory Details
                </h3>
                
                <div className="form-grid">
                  <div className="form-group">
                    <label><FaIndustry /> Factory Name *</label>
                    <input
                      type="text"
                      name="factoryName"
                      placeholder="Enter factory name"
                      value={form.factoryName}
                      onChange={handleChange}
                      className={errors.factoryName ? 'error' : ''}
                    />
                    {errors.factoryName && <span className="error-message">{errors.factoryName}</span>}
                  </div>
                  
                  <div className="form-group">
                    <label><FaIdCard /> Factory Licence No *</label>
                    <input
                      type="text"
                      name="factoryLicenceNo"
                      placeholder="Enter licence number"
                      value={form.factoryLicenceNo}
                      onChange={handleChange}
                      className={errors.factoryLicenceNo ? 'error' : ''}
                    />
                    {errors.factoryLicenceNo && <span className="error-message">{errors.factoryLicenceNo}</span>}
                  </div>
                  
                  <div className="form-group">
                    <label><FaMapMarkerAlt /> Factory Address *</label>
                    <input
                      type="text"
                      name="factoryAddress"
                      placeholder="Enter full address"
                      value={form.factoryAddress}
                      onChange={handleChange}
                      className={errors.factoryAddress ? 'error' : ''}
                    />
                    {errors.factoryAddress && <span className="error-message">{errors.factoryAddress}</span>}
                  </div>
                  
                  <div className="form-group">
                    <label><FaMap /> Factory Location *</label>
                    <div style={{ position: 'relative' }}>
                      <FaSearchLocation style={{
                        position: 'absolute',
                        left: '15px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--secondary)',
                        zIndex: 1
                      }} />
                      <input
                        type="text"
                        id="factory_location_search"
                        placeholder="Search location on map..."
                        style={{ paddingLeft: '45px' }}
                      />
                    </div>
                    {errors.factoryLocation && <span className="error-message">{errors.factoryLocation}</span>}
                    
                    <div className="map-container">
                      <div id="factory-map" className="map"></div>
                      <div style={{ marginTop: '15px', display: 'flex', gap: '20px', fontSize: '0.9rem' }}>
                        <div><FaMapPin /> Lat: {form.factoryLat || 'Not selected'}</div>
                        <div><FaMapPin /> Lng: {form.factoryLng || 'Not selected'}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label><FaPhone /> Factory Contact *</label>
                    <input
                      type="text"
                      name="factoryContact"
                      placeholder="Factory phone number"
                      value={form.factoryContact}
                      onChange={handleChange}
                      className={errors.factoryContact ? 'error' : ''}
                    />
                    {errors.factoryContact && <span className="error-message">{errors.factoryContact}</span>}
                  </div>
                  
                  <div className="form-group">
                    <label><FaTrashAlt /> Waste Types Accepted</label>
                    <textarea
                      name="wasteTypesAccepted"
                      rows="3"
                      placeholder="Plastic, Paper, Metal, Glass, etc."
                      value={form.wasteTypesAccepted}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label><FaClock /> Operating Hours</label>
                    <input
                      type="text"
                      name="operatingHours"
                      placeholder="e.g., 8:00 AM - 6:00 PM"
                      value={form.operatingHours}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="form-section">
                <h3 className="section-title">
                  <FaBuilding /> Government Collector
                </h3>
                <p style={{ textAlign: 'center', color: 'var(--gray)', padding: '30px' }}>
                  Your registration as a Government Collector is complete. 
                  Please review your information and submit the form.
                </p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // Success message
  if (success) {
    return (
      <div className="collector-container">
        <div className="collector-header">
          <h1><FaRecycle /> Collector Registration</h1>
          <p>Join our Smart Waste Management System as a waste collector</p>
        </div>
        
        <div className="success-message">
          <FaCheckCircle />
          <h2>Registration Submitted Successfully!</h2>
          <p>Your application has been submitted and is pending approval.</p>
          <p>You will be notified via email once your registration is approved.</p>
          <p>Redirecting to login page...</p>
        </div>
        
        <div className="collector-footer">
          <p><FaSpinner className="loading-spinner" /> Processing your registration...</p>
          <p style={{ marginTop: '5px', fontSize: '12px' }}>© 2023 Smart Waste Management System</p>
        </div>
      </div>
    );
  }

  return (
    <div className="collector-container">
      {/* Header */}
      <div className="collector-header">
        <h1><FaRecycle /> Collector Registration</h1>
        <p>Join our Smart Waste Management System as a waste collector</p>
      </div>

      {/* Form Container */}
      <div className="collector-form-container">
        {/* Progress Bar */}
        <div className="progress-bar">
          <div className={`progress-step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-title">Personal Info</div>
          </div>
          <div className={`progress-line ${currentStep >= 2 ? 'active' : ''}`}></div>
          
          <div className={`progress-step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-title">Collection Type</div>
          </div>
          <div className={`progress-line ${currentStep >= 3 ? 'active' : ''}`}></div>
          
          <div className={`progress-step ${currentStep >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-title">
              {form.collectionType === 'Factory' ? 'Factory Details' : 'Review'}
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {renderStepContent()}

          {/* Navigation Buttons */}
          <div className="form-navigation">
            {currentStep > 1 && (
              <button type="button" className="nav-btn prev" onClick={prevStep}>
                <FaArrowLeft /> Previous
              </button>
            )}
            
            {currentStep < 3 ? (
              <button type="button" className="nav-btn next" onClick={nextStep}>
                Next <FaArrowRight />
              </button>
            ) : (
              <button 
                type="submit" 
                className="submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="loading-spinner"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <FaPaperPlane /> Submit Registration
                  </>
                )}
              </button>
            )}
          </div>

          {errors.submit && (
            <div style={{
              marginTop: '15px',
              color: '#e74c3c',
              textAlign: 'center',
              background: 'rgba(231, 76, 60, 0.1)',
              padding: '10px',
              borderRadius: '8px'
            }}>
              {errors.submit}
            </div>
          )}
        </form>
      </div>

      {/* Footer */}
      <div className="collector-footer">
        <p><FaCheckCircle /> Your registration will be reviewed and you'll be notified via email</p>
        <p style={{ marginTop: '5px', fontSize: '12px' }}>© 2023 Smart Waste Management System</p>
      </div>
    </div>
  );
};

export default CollectorRegister;