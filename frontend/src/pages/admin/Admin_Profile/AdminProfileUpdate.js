import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminNavbar from "../../../components/Admin/AdminNavbar";
import "./AdminProfileUpdate.css";

const API = "http://localhost:5000/api";
const HOST = "http://localhost:5000";

const AdminProfileUpdate = () => {
  const token = localStorage.getItem("adminToken");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [form, setForm] = useState({
    fullname: "",
    phone_number: "",
    address: ""
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [pendingPayload, setPendingPayload] = useState(null);
 
  /* ================= LOAD PROFILE ================= */
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/admin/profile`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const a = res.data || null;
      setAdmin(a);

      setForm({
        fullname: a?.fullname || "",
        phone_number: a?.phone_number || "",
        address: a?.address || ""
      });

      setPhotoPreview(a?.photo ? `${HOST}${a.photo}` : "");
      setPhotoFile(null);
      if (a) {
        localStorage.setItem("admin", JSON.stringify(a));
      }
    } catch {
      alert("Failed to load admin profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ================= HANDLERS ================= */
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const validate = () => {
    if (!form.fullname.trim()) return "Full name is required";
    return null;
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const msg = validate();
    if (msg) {
      alert(msg);
      return;
    }

    try {
      setSaving(true);

      const otpRes = await axios.post(`${API}/admin/profile/request-otp`, null, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      const devOtp = otpRes?.data?.otp;
      if (devOtp) {
        alert(`DEV MODE OTP: ${devOtp}`);
      }
          
      const fd = new FormData();
      fd.append("fullname", form.fullname);
      fd.append("phone_number", form.phone_number);
      fd.append("address", form.address);
      if (photoFile) fd.append("photo", photoFile);

      setPendingPayload(fd);
      setOtpValue("");
      setOtpOpen(true);
    } catch {
      alert("Profile update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleOtpConfirm = async () => {
    if (!otpValue.trim()) {
      alert("OTP is required to update profile");
      return;
    }

    try {
      setSaving(true);
      const fd = pendingPayload || new FormData();
      fd.set("otp", otpValue.trim());

      await axios.put(`${API}/admin/profile`, fd, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          "Content-Type": "multipart/form-data"
        }
      });

      alert("Profile updated successfully ✅");
      if (admin) {
        localStorage.setItem("admin", JSON.stringify({
          ...admin,
          fullname: form.fullname,
          phone_number: form.phone_number,
          address: form.address
        }));
      }
      setOtpOpen(false);
      setPendingPayload(null);
      fetchProfile();
    } catch {
      alert("Profile update failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <AdminNavbar />
        <div className="apu-wrap">
          <div className="apu-card">Loading profile...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminNavbar />
      <div className="apu-wrap">
        <div className="apu-top">
          <div>
            <h2>My Profile</h2>
            <p className="muted">Update your personal details</p>
          </div>
        </div>

        <form className="apu-card" onSubmit={handleSubmit}>
        {/* PHOTO */}
        <div className="photoRow">
          <div className="photoBox">
            <div className="imgWrap">
              <img
                src={photoPreview || "/default-user.png"}
                alt="admin"
                onError={(e) => (e.target.src = "/default-user.png")}
              />
            </div>

            <label className="fileBtn">
              Change Photo
              <input type="file" accept="image/*" hidden onChange={handlePhoto} />
            </label>
          </div>

          <div className="statusBox">
            <div>
              <strong>Role</strong>
              <div className="pill">{admin?.role}</div>
            </div>
            <div>
              <strong>Gender</strong>
              <div className="pill">{admin?.gender || "-"}</div>
            </div>
          </div>
        </div>

        {/* EDITABLE */}
        <h3 className="secTitle">Editable Details</h3>

        <div className="grid2">
          <div className="field">
            <label>Full Name *</label>
            <input
              name="fullname"
              value={form.fullname}
              onChange={handleChange}
            />
          </div>

          <div className="field">
            <label>Phone Number</label>
            <input
              name="phone_number"
              value={form.phone_number}
              onChange={handleChange}
            />
          </div>

          <div className="field full">
            <label>Address</label>
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* READ ONLY */}
        <h3 className="secTitle">Account Info (Read Only)</h3>

        <div className="grid2 readonly">
          <div className="ro">
            <strong>Email</strong>
            <div>{admin?.email}</div>
          </div>
          <div className="ro">
            <strong>Created At</strong>
            <div>
              {admin?.created_at
                ? new Date(admin.created_at).toLocaleString()
                : "-"}
            </div>
          </div>
        </div>

        <button className="btn save" type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
        </form>

        {otpOpen && (
          <div className="otp-modal">
            <div className="otp-card">
              <h3>Verify OTP</h3>
              <p>Enter the OTP sent to your email to confirm the update.</p>
              <input
                type="text"
                inputMode="numeric"
                maxLength="6"
                value={otpValue}
                onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="Enter 6-digit OTP"
              />
              <div className="otp-actions">
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => {
                    setOtpOpen(false);
                    setPendingPayload(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn save"
                  onClick={handleOtpConfirm}
                  disabled={saving}
                >
                  {saving ? "Verifying..." : "Verify & Update"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminProfileUpdate;
