import React, { useEffect, useState } from "react";
import axios from "axios";
import "./CollectorProfileUpdate.css";
import CollectorNavbar from "../../../components/Collector/CollectorNavbar";

const API = "http://localhost:5000/api";
const HOST = "http://localhost:5000";

const CollectorProfileUpdate = () => {
  const token = localStorage.getItem("collectorToken");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [collector, setCollector] = useState(null);

  const [form, setForm] = useState({
    full_name: "",
    phone_number: "",
    home_address: "",
    latitude: "",
    longitude: ""
  });

  const [vehiclePhotoFile, setVehiclePhotoFile] = useState(null);
  const [vehiclePhotoPreview, setVehiclePhotoPreview] = useState("");

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/collector/profile`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      // expected:
      // {
      //   collector: {...},
      //   factory_details: {...} | null,
      //   government_details: {...} | null
      // }
      const data = res.data || null;
      setCollector(data);

      const c = data?.collector;

      setForm({
        full_name: c?.full_name || "",
        phone_number: c?.phone_number || "",
        home_address: c?.home_address || "",
        latitude: c?.latitude ?? "",
        longitude: c?.longitude ?? ""
      });

      const photo = c?.vehicle_photo ? `${HOST}${c.vehicle_photo}` : "";
      setVehiclePhotoPreview(photo);
      setVehiclePhotoFile(null);
    } catch (e) {
      setCollector(null);
      alert("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleVehiclePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVehiclePhotoFile(file);
    setVehiclePhotoPreview(URL.createObjectURL(file));
  };

  const validate = () => {
    if (!form.full_name.trim()) return "Full name is required";
    if (!form.phone_number.trim()) return "Phone number is required";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const msg = validate();
    if (msg) {
      alert(msg);
      return;
    }

    try {
      setSaving(true);

      const fd = new FormData();
      fd.append("full_name", form.full_name);
      fd.append("phone_number", form.phone_number);
      fd.append("home_address", form.home_address);

      // allow empty values
      fd.append("latitude", form.latitude);
      fd.append("longitude", form.longitude);

      if (vehiclePhotoFile) {
        fd.append("vehicle_photo", vehiclePhotoFile);
      }

      await axios.put(`${API}/collector/profile`, fd, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          "Content-Type": "multipart/form-data"
        }
      });

      alert("Profile updated ✅");
      fetchProfile();
    } catch (err) {
      alert("Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <CollectorNavbar />
        <div className="apu-wrap">
          <div className="apu-card">Loading profile...</div>
        </div>
      </>
    );
  }

  const c = collector?.collector;
  const factory = collector?.factory_details;
  const gov = collector?.government_details;

  return (
    <>  
      <CollectorNavbar />
    <div className="cpu-wrap">
      <div className="cpu-top">
        <div>
          <h2>My Profile</h2>
          <p className="muted">Update editable fields only.</p>
        </div>

        
      </div>

      <form className="cpu-card" onSubmit={handleSubmit}>
        {/* Profile photo / vehicle photo */}
        <div className="photoRow">
          <div className="photoBox">
            <div className="imgWrap">
              <img
                src={vehiclePhotoPreview || "/default-user.png"}
                alt="vehicle"
                onError={(e) => (e.target.src = "/default-user.png")}
              />
            </div>

            <div className="photoActions">
              <label className="fileBtn">
                Change Vehicle Photo
                <input type="file" accept="image/*" onChange={handleVehiclePhoto} hidden />
              </label>
              <small className="hint">Optional</small>
            </div>
          </div>

          <div className="statusBox">
            <div>
              <strong>Status</strong>
              <div className={`pill ${c?.status}`}>{c?.status || "-"}</div>
            </div>
            <div>
              <strong>Collection Type</strong>
              <div className="pill type">{c?.collection_type || "-"}</div>
            </div>
          </div>
        </div>

        {/* Editable fields */}
        <h3 className="secTitle">Editable Details</h3>

        <div className="grid2">
          <div className="field">
            <label>Full Name *</label>
            <input
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              placeholder="Full name"
            />
          </div>

          <div className="field">
            <label>Phone Number *</label>
            <input
              name="phone_number"
              value={form.phone_number}
              onChange={handleChange}
              placeholder="Phone number"
            />
          </div>

          <div className="field full">
            <label>Home Address</label>
            <textarea
              name="home_address"
              value={form.home_address}
              onChange={handleChange}
              placeholder="Home address"
            />
          </div>

          
        </div>

        {/* Non-editable (Permanent) */}
        <h3 className="secTitle">Permanent (Read Only)</h3>

        <div className="grid2 readonly">
          <div className="ro">
            <strong>Email</strong>
            <div>{c?.email || "-"}</div>
          </div>
          <div className="ro">
            <strong>Gender</strong>
            <div>{c?.gender || "-"}</div>
          </div>
          <div className="ro">
            <strong>Vehicle Number</strong>
            <div>{c?.vehicle_number || "-"}</div>
          </div>
          <div className="ro">
            <strong>Created At</strong>
            <div>{c?.created_at ? new Date(c.created_at).toLocaleString() : "-"}</div>
          </div>
        </div>

        {/* Factory/Government details (view only) */}
        {c?.collection_type === "factory" && (
          <>
            <h3 className="secTitle">Factory Details (Read Only)</h3>
            <div className="grid2 readonly">
              <div className="ro"><strong>Factory Name</strong><div>{factory?.factory_name || "-"}</div></div>
              <div className="ro"><strong>Licence No</strong><div>{factory?.factory_licence_no || "-"}</div></div>
              <div className="ro"><strong>Operating Hours</strong><div>{factory?.operating_hours || "-"}</div></div>
              <div className="ro full"><strong>Accepted Waste Types</strong><div>{factory?.waste_types_accepted || "-"}</div></div>
              <div className="ro full"><strong>Factory Address</strong><div>{factory?.factory_address || "-"}</div></div>
              <div className="ro"><strong>Contact</strong><div>{factory?.factory_contact || "-"}</div></div>
              <div className="ro"><strong>Latitude</strong><div>{factory?.factory_latitude ?? "-"}</div></div>
              <div className="ro"><strong>Longitude</strong><div>{factory?.factory_longitude ?? "-"}</div></div>
            </div>
          </>
        )}

        {c?.collection_type === "government" && (
          <>
            <h3 className="secTitle">Government Details (Read Only)</h3>
            <div className="grid2 readonly">
              <div className="ro"><strong>Service No</strong><div>{gov?.service_number || "-"}</div></div>
              <div className="ro"><strong>Department</strong><div>{gov?.department_name || "-"}</div></div>
              <div className="ro"><strong>Designation</strong><div>{gov?.designation || "-"}</div></div>
              <div className="ro full"><strong>Working Area</strong><div>{gov?.working_area_name || "-"}</div></div>
              <div className="ro"><strong>Latitude</strong><div>{gov?.working_area_latitude ?? "-"}</div></div>
              <div className="ro"><strong>Longitude</strong><div>{gov?.working_area_longitude ?? "-"}</div></div>
            </div>
          </>
        )}

        <button className="btn save" type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
    </>
  );
};

export default CollectorProfileUpdate;
