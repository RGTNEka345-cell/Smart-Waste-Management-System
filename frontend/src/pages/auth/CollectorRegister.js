import { useState, useEffect, useRef } from "react";
import "./CollectorRegister.css";

const GOOGLE_API_KEY = "AIzaSyDCDq2OdTXSFuee8I7L83_0vmavC65lMCc";

const CollectorRegister = () => {
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    gender: "",
    password: "",
    phone_number: "",
    home_address: "",
    collection_type: "",
    vehicle_number: "",
    vehicle_photo: null,

    // Factory
    factory_name: "",
    factory_licence_no: "",
    operating_hours: "",
    waste_types_accepted: "",
    factory_address: "",
    factory_contact: "",
    factory_latitude: "",
    factory_longitude: "",

    // Government
    service_number: "",
    department_name: "",
    working_area: "",
    working_area_latitude: "",
    working_area_longitude: "",
    designation: ""
  });

  const factoryMapRef = useRef(null);
  const govMapRef = useRef(null);
  const factorySearchRef = useRef(null);
  const govSearchRef = useRef(null);

  // Load Google Map script
  useEffect(() => {
    if (window.google) return;

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places`;
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // Init Factory Map
  useEffect(() => {
    if (!window.google || step !== 3 || form.collection_type !== "Factory") return;

    const map = new window.google.maps.Map(factoryMapRef.current, {
      center: { lat: 6.9271, lng: 79.8612 },
      zoom: 10
    });

    const autocomplete = new window.google.maps.places.Autocomplete(factorySearchRef.current);
    autocomplete.bindTo("bounds", map);

    const marker = new window.google.maps.Marker({ map });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.geometry) return;

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();

      map.setCenter(place.geometry.location);
      marker.setPosition(place.geometry.location);

      setForm(prev => ({
        ...prev,
        factory_latitude: lat,
        factory_longitude: lng,
        factory_address: place.formatted_address || ""
      }));
    });
  }, [step, form.collection_type]);

  // Init Government Map
  useEffect(() => {
    if (!window.google || step !== 3 || form.collection_type !== "Government") return;

    const map = new window.google.maps.Map(govMapRef.current, {
      center: { lat: 6.9271, lng: 79.8612 },
      zoom: 10
    });

    const autocomplete = new window.google.maps.places.Autocomplete(govSearchRef.current);
    autocomplete.bindTo("bounds", map);

    const marker = new window.google.maps.Marker({ map });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.geometry) return;

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();

      map.setCenter(place.geometry.location);
      marker.setPosition(place.geometry.location);

      setForm(prev => ({
        ...prev,
        working_area_latitude: lat,
        working_area_longitude: lng,
        working_area: place.formatted_address || ""
      }));
    });
  }, [step, form.collection_type]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm({ ...form, [name]: files ? files[0] : value });
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(form).forEach(key => form[key] && data.append(key, form[key]));
    console.log(Object.fromEntries(data));
    alert("Registration submitted. Pending admin approval.");
  };

  return (
    <div className="collector-container">
      <h2>Collector Registration</h2>

      <form onSubmit={handleSubmit}>

        {/* STEP 1 */}
        {step === 1 && (
          <div className="form-box">
            <input name="full_name" placeholder="Full Name" onChange={handleChange} />
            <input name="email" type="email" placeholder="Email" onChange={handleChange} />
            <select name="gender" onChange={handleChange}>
              <option value="">Gender</option>
              <option>Male</option>
              <option>Female</option>
            </select>
            <input name="phone_number" placeholder="Phone" onChange={handleChange} />
            <input name="home_address" placeholder="Home Address" onChange={handleChange} />
            <input name="password" type="password" placeholder="Password" onChange={handleChange} />
            <button type="button" onClick={nextStep}>Next</button>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="form-box">
            <select name="collection_type" onChange={handleChange}>
              <option value="">Collection Type</option>
              <option value="Government">Government</option>
              <option value="Factory">Factory</option>
            </select>
            <input name="vehicle_number" placeholder="Vehicle Number" onChange={handleChange} />
            <input type="file" name="vehicle_photo" onChange={handleChange} />
            <div className="btn-group">
              <button type="button" onClick={prevStep}>Back</button>
              <button type="button" onClick={nextStep}>Next</button>
            </div>
          </div>
        )}

        {/* FACTORY */}
        {step === 3 && form.collection_type === "Factory" && (
          <div className="form-box">
            <input name="factory_name" placeholder="Factory Name" onChange={handleChange} />
            <input name="factory_licence_no" placeholder="Licence No" onChange={handleChange} />
            <input name="operating_hours" placeholder="Operating Hours" onChange={handleChange} />
            <input name="waste_types_accepted" placeholder="Waste Types Accepted" onChange={handleChange} />
            <input name="factory_contact" placeholder="Factory Contact" onChange={handleChange} />

            <input ref={factorySearchRef} placeholder="Search Factory Location" />
            <div ref={factoryMapRef} className="map-box"></div>

            <input value={form.factory_latitude} readOnly placeholder="Latitude" />
            <input value={form.factory_longitude} readOnly placeholder="Longitude" />

            <div className="btn-group">
              <button type="button" onClick={prevStep}>Back</button>
              <button type="submit">Submit</button>
            </div>
          </div>
        )}

        {/* GOVERNMENT */}
        {step === 3 && form.collection_type === "Government" && (
          <div className="form-box">
            <input name="service_number" placeholder="Service Number" onChange={handleChange} />
            <input name="department_name" placeholder="Department Name" onChange={handleChange} />
            <input name="designation" placeholder="Designation" onChange={handleChange} />

            <input ref={govSearchRef} placeholder="Search Working Area" />
            <div ref={govMapRef} className="map-box"></div>

            <input value={form.working_area_latitude} readOnly placeholder="Latitude" />
            <input value={form.working_area_longitude} readOnly placeholder="Longitude" />

            <div className="btn-group">
              <button type="button" onClick={prevStep}>Back</button>
              <button type="submit">Submit</button>
            </div>
          </div>
        )}

      </form>
    </div>
  );
};

export default CollectorRegister;
