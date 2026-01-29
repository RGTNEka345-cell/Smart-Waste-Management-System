import React, { useState, useRef, useEffect, useCallback } from "react";
import "./CollectorRegister.css";
import Navbar from "../../components/HomePage/Navbar";
import Footer from "../../components/HomePage/Footer";
import {
  GoogleMap,
  Marker,
  Autocomplete,
  useLoadScript
} from "@react-google-maps/api";

const libraries = ["places"];
const DEFAULT_LOCATION = { lat: 6.9271, lng: 79.8612 };

// Initial state objects
const initialCollectorState = {
  full_name: "",
  email: "",
  phone_number: "",
  password: "",
  gender: "",
  home_address: "",
  vehicle_number: "",
  vehicle_photo: null
};

const initialFactoryState = {
  factory_name: "",
  factory_licence_no: "",
  operating_hours: "",
  waste_types_accepted: "",
  factory_address: "",
  factory_contact: "",
  factory_latitude: "",
  factory_longitude: ""
};

const initialGovernmentState = {
  service_number: "",
  department_name: "",
  working_area_name: "",
  designation: "",
  working_area_latitude: "",
  working_area_longitude: ""
};

const CollectorRegister = () => {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "AIzaSyDCDq2OdTXSFuee8I7L83_0vmavC65lMCc",
    libraries
  });

  const [collectionType, setCollectionType] = useState("");
  const [wasteTypes, setWasteTypes] = useState([]);
  const [selectedWasteTypes, setSelectedWasteTypes] = useState([]);
  const [mapPosition, setMapPosition] = useState(DEFAULT_LOCATION);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vehiclePreview, setVehiclePreview] = useState("");

  // Refs for autocomplete
  const factoryAutoRef = useRef(null);
  const governmentAutoRef = useRef(null);

  const [collector, setCollector] = useState(initialCollectorState);
  const [factory, setFactory] = useState(initialFactoryState);
  const [government, setGovernment] = useState(initialGovernmentState);

  useEffect(() => {
    if (!collector.vehicle_photo) {
      setVehiclePreview("");
      return;
    }

    const url = URL.createObjectURL(collector.vehicle_photo);
    setVehiclePreview(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [collector.vehicle_photo]);

  // Fetch waste types
  useEffect(() => {
    const fetchWasteTypes = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/waste-types");
        if (!response.ok) throw new Error("Failed to fetch waste types");
        const data = await response.json();
        setWasteTypes(data);
      } catch (err) {
        console.error("Failed to fetch waste types:", err);
        // Optional: Show user-friendly error message
      }
    };
    fetchWasteTypes();
  }, []);

  // Handler functions
  const handleCollectorChange = useCallback((e) => {
    const { name, value, files } = e.target;
    setCollector(prev => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
  }, []);

  const handleFactoryChange = useCallback((e) => {
    setFactory(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  }, []);

  const handleGovernmentChange = useCallback((e) => {
    setGovernment(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  }, []);

  const handleWasteTypeChange = useCallback((wasteTypeId) => {
    setSelectedWasteTypes(prev => 
      prev.includes(wasteTypeId)
        ? prev.filter(id => id !== wasteTypeId)
        : [...prev, wasteTypeId]
    );
  }, []);

  const handleMapClick = useCallback((lat, lng) => {
    setMapPosition({ lat, lng });

    if (collectionType === "factory") {
      setFactory(prev => ({
        ...prev,
        factory_latitude: lat,
        factory_longitude: lng
      }));
    }

    if (collectionType === "government") {
      setGovernment(prev => ({
        ...prev,
        working_area_latitude: lat,
        working_area_longitude: lng
      }));
    }
  }, [collectionType]);

  const handleCollectionTypeChange = useCallback((e) => {
    const type = e.target.value;
    setCollectionType(type);
    // Reset map position when changing type
    setMapPosition(DEFAULT_LOCATION);
  }, []);

  // Reset form function
  const resetForm = useCallback(() => {
    setCollector(initialCollectorState);
    setFactory(initialFactoryState);
    setGovernment(initialGovernmentState);
    setCollectionType("");
    setSelectedWasteTypes([]);
    setMapPosition(DEFAULT_LOCATION);
  }, []);

  // Form validation
  const validateForm = useCallback(() => {
    if (!collector.vehicle_photo) {
      alert("Vehicle image is required!");
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(collector.email)) {
      alert("Please enter a valid email address");
      return false;
    }

    // Phone number validation (Sri Lankan format)
    const phoneRegex = /^(?:\+94|0)?[1-9]\d{8}$/;
    if (!phoneRegex.test(collector.phone_number.replace(/\s+/g, ''))) {
      alert("Please enter a valid Sri Lankan phone number");
      return false;
    }

    if (collectionType === "factory") {
      if (!factory.factory_name.trim() || !factory.factory_licence_no.trim()) {
        alert("Factory name and licence number are required");
        return false;
      }
    }

    if (collectionType === "government") {
      if (!government.service_number.trim() || !government.department_name.trim()) {
        alert("Service number and department name are required");
        return false;
      }
    }

    return true;
  }, [collector, factory, government, collectionType]);

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);

    try {
      const formData = new FormData();

      // Append collector fields
      Object.keys(collector).forEach(key => {
        if (key !== "vehicle_photo") {
          formData.append(key, collector[key]);
        }
      });

      formData.append("vehicle_photo", collector.vehicle_photo);
      formData.append("collection_type", collectionType);

      // Append type-specific details
      if (collectionType === "factory") {
        formData.append("factory_details", JSON.stringify({
          ...factory,
          waste_types_accepted: selectedWasteTypes
        }));
      }

      if (collectionType === "government") {
        formData.append("government_details", JSON.stringify(government));
      }

      const response = await fetch("http://localhost:5000/api/collectors/register", {
        method: "POST",
        body: formData
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      alert(data.message || "Collector registered successfully. Await admin approval.");
      resetForm();
      
    } catch (error) {
      console.error("Registration error:", error);
      alert(error.message || "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render loading state
  if (!isLoaded) {
    return (
      <>
        <Navbar />
        <div className="page-with-navbar">
          <div className="collector-register-container loading">
            <div className="loading-spinner"></div>
            <p>Loading maps...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="page-with-navbar">
        <div className="collector-register-container">
          <header className="form-header">
            <h2>Collector Registration</h2>
            <p className="form-subtitle">Register as a waste collector with the system</p>
          </header>

          <form onSubmit={handleSubmit} className="collector-form" noValidate>
            {/* Personal Details Section */}
            <section className="form-section">
              <h3 className="section-title">Personal Information</h3>
              <div className="input-group">
                <input 
                  name="full_name" 
                  placeholder="Full Name *" 
                  value={collector.full_name}
                  onChange={handleCollectorChange} 
                  required 
                  disabled={isSubmitting}
                />
                <input 
                  name="email" 
                  type="email"
                  placeholder="Email *" 
                  value={collector.email}
                  onChange={handleCollectorChange} 
                  required 
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="input-group">
                <input 
                  name="phone_number" 
                  placeholder="Phone Number *" 
                  value={collector.phone_number}
                  onChange={handleCollectorChange} 
                  required 
                  disabled={isSubmitting}
                />
                <input 
                  name="password" 
                  type="password" 
                  placeholder="Password *" 
                  value={collector.password}
                  onChange={handleCollectorChange} 
                  required 
                  disabled={isSubmitting}
                />
              </div>

              <div className="input-group">
                <select 
                  name="gender" 
                  value={collector.gender}
                  onChange={handleCollectorChange} 
                  required 
                  disabled={isSubmitting}
                >
                  <option value="">Select Gender *</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                
                <input 
                  name="vehicle_number" 
                  placeholder="Vehicle Number *" 
                  value={collector.vehicle_number}
                  onChange={handleCollectorChange} 
                  required 
                  disabled={isSubmitting}
                />
              </div>

              <textarea 
                name="home_address" 
                placeholder="Home Address *" 
                value={collector.home_address}
                onChange={handleCollectorChange} 
                required 
                rows="3"
                disabled={isSubmitting}
              />
            </section>

        {/* Vehicle Section */}
<section className="form-section">
  <h3 className="section-title">Vehicle Information</h3>
  <div className="file-upload-group">
    <label className="file-upload-label">
      <span>Vehicle Image * <span className="note-text">(must show numberplate clearly)</span></span>
      <input 
        type="file" 
        name="vehicle_photo" 
        accept="image/*" 
        onChange={handleCollectorChange} 
        required 
        disabled={isSubmitting}
      />
      <div className="file-upload-button">
        {collector.vehicle_photo ? collector.vehicle_photo.name : "Choose File"}
      </div>
    </label>
    {collector.vehicle_photo && (
      <span className="file-selected">✓ File selected</span>
    )}
    {vehiclePreview && (
      <div className="vehicle-preview">
        <img src={vehiclePreview} alt="Vehicle preview" />
      </div>
    )}
  </div>
</section>

        {/* Collector Type Section */}
        <section className="form-section">
          <h3 className="section-title">Collector Type</h3>
          <select 
            value={collectionType}
            onChange={handleCollectionTypeChange}
            required
            disabled={isSubmitting}
            className="type-select"
          >
            <option value="">Select Collector Type *</option>
            <option value="government">Government Collector</option>
            <option value="factory">Factory Collector</option>
          </select>
        </section>

        {/* Factory Details */}
        {collectionType === "factory" && (
          <FactoryDetails
            factory={factory}
            wasteTypes={wasteTypes}
            selectedWasteTypes={selectedWasteTypes}
            mapPosition={mapPosition}
            factoryAutoRef={factoryAutoRef}
            onFactoryChange={handleFactoryChange}
            onWasteTypeChange={handleWasteTypeChange}
            onMapClick={handleMapClick}
            isSubmitting={isSubmitting}
          />
        )}

        {/* Government Details */}
        {collectionType === "government" && (
          <GovernmentDetails
            government={government}
            mapPosition={mapPosition}
            governmentAutoRef={governmentAutoRef}
            onGovernmentChange={handleGovernmentChange}
            onMapClick={handleMapClick}
            isSubmitting={isSubmitting}
          />
        )}

        {/* Submit Button */}
          <div className="form-actions">
            <button 
              type="submit" 
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner"></span>
                  Processing...
                </>
              ) : "Submit Registration"}
            </button>
          </div>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
};

// Factory Details Component
const FactoryDetails = ({
  factory,
  wasteTypes,
  selectedWasteTypes,
  mapPosition,
  factoryAutoRef,
  onFactoryChange,
  onWasteTypeChange,
  onMapClick,
  isSubmitting
}) => (
  <section className="form-section">
    <h3 className="section-title">Factory Information</h3>
    
    <div className="input-group">
      <input 
        name="factory_name" 
        placeholder="Factory Name *" 
        value={factory.factory_name}
        onChange={onFactoryChange}
        required
        disabled={isSubmitting}
      />
      <input 
        name="factory_licence_no" 
        placeholder="Licence Number *" 
        value={factory.factory_licence_no}
        onChange={onFactoryChange}
        required
        disabled={isSubmitting}
      />
    </div>

    <div className="input-group">
      <input 
        name="operating_hours" 
        placeholder="Operating Hours" 
        value={factory.operating_hours}
        onChange={onFactoryChange}
        disabled={isSubmitting}
      />
      <input 
        name="factory_contact" 
        placeholder="Factory Contact" 
        value={factory.factory_contact}
        onChange={onFactoryChange}
        disabled={isSubmitting}
      />
    </div>

    <textarea 
      name="factory_address" 
      placeholder="Factory Address" 
      value={factory.factory_address}
      onChange={onFactoryChange}
      rows="3"
      disabled={isSubmitting}
    />

    {/* Waste Types Selection */}
    <div className="waste-types-section">
      <h4 className="subsection-title">Waste Types Accepted</h4>
      <div className="waste-types-grid">
        {wasteTypes.map(wasteType => (
          <label key={wasteType.id} className="checkbox-label">
            <input
              type="checkbox"
              checked={selectedWasteTypes.includes(wasteType.id)}
              onChange={() => onWasteTypeChange(wasteType.id)}
              disabled={isSubmitting}
            />
            <span className="checkbox-custom"></span>
            {wasteType.name}
          </label>
        ))}
      </div>
    </div>

    {/* Location Section */}
    <LocationSection
      title="Factory Location"
      mapPosition={mapPosition}
      autoRef={factoryAutoRef}
      latitude={factory.factory_latitude}
      longitude={factory.factory_longitude}
      onMapClick={onMapClick}
      isSubmitting={isSubmitting}
    />
  </section>
);

// Government Details Component
const GovernmentDetails = ({
  government,
  mapPosition,
  governmentAutoRef,
  onGovernmentChange,
  onMapClick,
  isSubmitting
}) => (
  <section className="form-section">
    <h3 className="section-title">Government Department Information</h3>
    
    <div className="input-group">
      <input 
        name="service_number" 
        placeholder="Service Number *" 
        value={government.service_number}
        onChange={onGovernmentChange}
        required
        disabled={isSubmitting}
      />
      <input 
        name="department_name" 
        placeholder="Department Name *" 
        value={government.department_name}
        onChange={onGovernmentChange}
        required
        disabled={isSubmitting}
      />
    </div>

    <div className="input-group">
      <input 
        name="working_area_name" 
        placeholder="Working Area" 
        value={government.working_area_name}
        onChange={onGovernmentChange}
        disabled={isSubmitting}
      />
      <input 
        name="designation" 
        placeholder="Designation" 
        value={government.designation}
        onChange={onGovernmentChange}
        disabled={isSubmitting}
      />
    </div>

    {/* Location Section */}
    <LocationSection
      title="Working Area Location"
      mapPosition={mapPosition}
      autoRef={governmentAutoRef}
      latitude={government.working_area_latitude}
      longitude={government.working_area_longitude}
      onMapClick={onMapClick}
      isSubmitting={isSubmitting}
    />
  </section>
);

// Reusable Location Section Component
const LocationSection = ({
  title,
  mapPosition,
  autoRef,
  latitude,
  longitude,
  onMapClick,
  isSubmitting
}) => (
  <div className="location-section">
    <h4 className="subsection-title">{title}</h4>
    
    <Autocomplete
      onLoad={(ref) => (autoRef.current = ref)}
      onPlaceChanged={() => {
        const place = autoRef.current.getPlace();
        if (!place?.geometry) return;
        const loc = place.geometry.location;
        onMapClick(loc.lat(), loc.lng());
      }}
    >
      <input 
        placeholder={`Search ${title}`}
        className="location-search"
        disabled={isSubmitting}
      />
    </Autocomplete>

    <div className="map-container">
  <GoogleMap
    zoom={14}
    center={mapPosition}
    mapContainerStyle={{ width: "100%", height: "300px" }}
    onClick={(e) => onMapClick(e.latLng.lat(), e.latLng.lng())}
    options={{
      disableDefaultUI: false,
      zoomControl: true,
      streetViewControl: false,
      mapTypeControl: true, // Changed from false to true to show map type control
      mapTypeControlOptions: {
        style: window.google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
        position: window.google.maps.ControlPosition.TOP_CENTER,
        mapTypeIds: [
          window.google.maps.MapTypeId.ROADMAP,
          window.google.maps.MapTypeId.SATELLITE,
          window.google.maps.MapTypeId.HYBRID
        ]
      },
      mapTypeId: window.google.maps.MapTypeId.HYBRID // Default to hybrid view
    }}
  >
    <Marker 
      position={mapPosition}
      animation={window.google?.maps?.Animation?.DROP}
    />
  </GoogleMap>
</div>

    <div className="coordinates-display">
      <div className="coordinate-input">
        <label>Latitude</label>
        <input 
          value={latitude} 
          readOnly 
          placeholder="Click on map or search"
          disabled={isSubmitting}
        />
      </div>
      <div className="coordinate-input">
        <label>Longitude</label>
        <input 
          value={longitude} 
          readOnly 
          placeholder="Click on map or search"
          disabled={isSubmitting}
        />
      </div>
    </div>
  </div>
);

export default CollectorRegister;
