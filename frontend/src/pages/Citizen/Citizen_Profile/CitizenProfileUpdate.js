import React, { useEffect, useState } from "react";
import axios from "axios";
import "./CitizenProfileUpdate.css";

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

  /* ================= Load citizen ================= */
  useEffect(() => {
    const citizen = JSON.parse(localStorage.getItem("citizen"));
    if (!citizen) return;

    setForm({
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
    });

    if (citizen.photo_url) {
      setPreviewImage(`http://localhost:5000${citizen.photo_url}`);
    }
  }, []);

  /* ================= Handle input ================= */
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

  /* ================= Location ================= */
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm({
          ...form,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6)
        });
        setLoading(false);
      },
      () => {
        alert("Location access denied");
        setLoading(false);
      }
    );
  };

  /* ================= Submit ================= */
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
      setErrorMessage("Full name required");
      return;
    }

    try {
      setLoading(true);

      const data = new FormData();
      Object.keys(form).forEach((key) => {
        if (form[key]) data.append(key, form[key]);
      });

      const token =
        localStorage.getItem("citizenToken") ||
        localStorage.getItem("token");

      const res = await axios.put(
        `http://localhost:5000/api/citizen/update-profile/${citizen.id}`,
        data,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : ""
          }
        }
      );

      if (res.data.success) {
        localStorage.setItem("citizen", JSON.stringify(res.data.citizen));
        setSuccessMessage("Profile updated successfully");
        setForm({ ...form, photo: null });
      } else {
        setErrorMessage("Update failed");
      }
    } catch (err) {
      setErrorMessage("Server error. Try again");
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */
  return (
    <div className="profile-update-container">
      <h2>Update My Profile</h2>

      {successMessage && <p className="success-message">{successMessage}</p>}
      {errorMessage && <p className="error-message">{errorMessage}</p>}

      <form onSubmit={handleSubmit}>
        <div className="photo-section">
          <img
            src={previewImage || "/default-user.png"}
            alt="profile"
            className="profile-preview-img"
          />
          <input type="file" name="photo" accept="image/*" onChange={handleChange} />

        </div>

        <input
          type="text"
          name="full_name"
          placeholder="Full Name"
          value={form.full_name}
          onChange={handleChange}
        />

        <input
          type="text"
          name="phone"
          placeholder="Phone"
          value={form.phone}
          onChange={handleChange}
        />

        <input
          type="date"
          name="date_of_birth"
          value={form.date_of_birth}
          onChange={handleChange}
        />

        <select name="gender" value={form.gender} onChange={handleChange}>
          <option>Male</option>
          <option>Female</option>
          <option>Other</option>
        </select>

        <textarea
          name="address"
          placeholder="Address"
          value={form.address}
          onChange={handleChange}
        />

        <button type="button" onClick={getCurrentLocation}>
          Use Current Location
        </button>

        <input
          type="number"
          name="latitude"
          placeholder="Latitude"
          value={form.latitude}
          onChange={handleChange}
        />

        <input
          type="number"
          name="longitude"
          placeholder="Longitude"
          value={form.longitude}
          onChange={handleChange}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Updating..." : "Update Profile"}
        </button>
      </form>
    </div>
  );
};

export default CitizenProfileUpdate;
