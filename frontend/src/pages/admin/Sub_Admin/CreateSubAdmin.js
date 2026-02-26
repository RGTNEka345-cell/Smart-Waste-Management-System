import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminNavbar from "../../../components/Admin/AdminNavbar";
import "./CreateSubAdmin.css";

const API = "http://localhost:5000/api";

const CreateSubAdmin = () => {
  const token = localStorage.getItem("adminToken");

  // assume admin object is stored after login
  const [admin, setAdmin] = useState(null);

  const [form, setForm] = useState({
    fullname: "",
    gender: "Male",
    email: "",
    password: "",
    phone_number: "",
    address: "",
    photo: null
  });

  const [loading, setLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState("");

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("admin")); // <- adjust if your key differs
    setAdmin(stored);
  }, []);

  useEffect(() => {
    if (!form.photo) {
      setPhotoPreview("");
      return;
    }

    const previewUrl = URL.createObjectURL(form.photo);
    setPhotoPreview(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [form.photo]);

  const isMainAdmin = admin?.role === "main_admin";

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validate = () => {
    if (!form.fullname.trim()) return "Full name is required";
    if (!form.email.trim()) return "Email is required";
    if (!form.password.trim()) return "Password is required";
    if (form.password.length < 6) return "Password must be at least 6 characters";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isMainAdmin) {
      alert("Only Main Admin can create sub admins.");
      return;
    }

    const msg = validate();
    if (msg) {
      alert(msg);
      return;
    }

    try {
      setLoading(true);

      const fd = new FormData();
      fd.append("fullname", form.fullname);
      fd.append("gender", form.gender);
      fd.append("email", form.email);
      fd.append("password", form.password);
      fd.append("phone_number", form.phone_number);
      fd.append("address", form.address);
      if (form.photo) {
        fd.append("photo", form.photo);
      }

      await axios.post(`${API}/admin/sub-admins`, fd, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          "Content-Type": "multipart/form-data"
        }
      });

      alert("Sub Admin created ✅");
      setForm({
        fullname: "",
        gender: "Male",
        email: "",
        password: "",
        phone_number: "",
        address: "",
        photo: null
      });
      setPhotoPreview("");
    } catch (err) {
      const msg =
        err?.response?.status === 403
          ? "Only Main Admin can create sub admins."
          : err?.response?.data?.message || "Failed to create sub admin";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AdminNavbar />
      <div className="csa-wrap">
        <div className="csa-top">
          <div>
            <h2>Create Sub Admin</h2>
            <p className="muted">
              Only <b>Main Admin</b> can add new sub admins.
            </p>
          </div>

          <div className={`roleBadge ${isMainAdmin ? "ok" : "bad"}`}>
            {isMainAdmin ? "MAIN ADMIN" : "NOT AUTHORIZED"}
          </div>
        </div>

        {!isMainAdmin ? (
          <div className="csa-card blocked">
            <h3>Access Denied</h3>
            <p>
              Your account role is <b>{admin?.role || "unknown"}</b>.  
              Only <b>main_admin</b> can create sub admins.
            </p>
          </div>
        ) : (
          <form className="csa-card" onSubmit={handleSubmit}>
            <div className="grid2">
              <div className="field">
                <label>Full Name *</label>
                <input
                  name="fullname"
                  value={form.fullname}
                  onChange={handleChange}
                  placeholder="Full name"
                  required
                />
              </div>

              <div className="field">
                <label>Gender</label>
                <select name="gender" value={form.gender} onChange={handleChange}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="field">
                <label>Email *</label>
                <input
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="email@example.com"
                  type="email"
                  required
                />
              </div>

              <div className="field">
                <label>Password *</label>
                <input
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min 6 chars"
                  type="password"
                  required
                />
              </div>

              <div className="field">
                <label>Phone</label>
                <input
                  name="phone_number"
                  value={form.phone_number}
                  onChange={handleChange}
                  placeholder="07xxxxxxxx"
                />
              </div>

              <div className="field">
                <label>Photo</label>
                <input
                  name="photo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setForm({ ...form, photo: e.target.files?.[0] || null })}
                />
                {photoPreview && (
                  <div className="photo-preview-box">
                    <img src={photoPreview} alt="Sub admin preview" />
                  </div>
                )}
              </div>

              <div className="field full">
                <label>Address</label>
                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Address"
                />
              </div>
            </div>

            <button className="btn save" type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Sub Admin"}
            </button>
          </form>
        )}
      </div>
    </>
  );
};
export default CreateSubAdmin;
