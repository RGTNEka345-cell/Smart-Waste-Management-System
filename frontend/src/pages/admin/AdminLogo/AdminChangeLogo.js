import React, { useState, useEffect } from "react";
import axios from "axios";
import AdminNavbar from "../../../components/Admin/AdminNavbar";
import "./AdminChangeLogo.css";

const API = "http://localhost:5000/api";
const normalizeLogoUrl = (value) => {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return `http://localhost:5000${value}`;
  return `http://localhost:5000/${value}`;
};

export default function AdminChangeLogo() {

  const [currentLogo, setCurrentLogo] = useState("");
  const [newLogo, setNewLogo] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);

  const adminToken = localStorage.getItem("adminToken");

  useEffect(() => {
    fetchLogo();
  }, []);

  const fetchLogo = async () => {
    try {
      const res = await axios.get(`${API}/site/logo`);
      setCurrentLogo(res.data.logo || "");
    } catch (error) {
      console.log("Logo load error");
    }
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    setNewLogo(file);
    setPreview(URL.createObjectURL(file));
  };

  const updateLogo = async () => {

    if (!newLogo) {
      alert("Please select a logo");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("logo", newLogo);

      const res = await axios.post(`${API}/admin/update-logo`, formData, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "multipart/form-data"
        }
      });

      alert("Logo updated successfully");

      setPreview("");
      setNewLogo(null);
      if (res?.data?.logo !== undefined) {
        localStorage.setItem("siteLogo", res.data.logo || "");
        window.dispatchEvent(new Event("site-logo-updated"));
      }
      fetchLogo();

    } catch (error) {
      alert("Logo update failed");
    }

    setLoading(false);
  };

  return (
    <>
      <AdminNavbar />
      <div className="logoPage">
        <h2>Website Logo Settings</h2>

        <div className="logoCard">
          <div className="currentLogo">
            <p>Current Logo</p>
            {currentLogo && (
              <img
                src={normalizeLogoUrl(currentLogo)}
                alt="Current Logo"
              />
            )}
          </div>

          <div className="uploadSection">
            <input
              type="file"
              accept="image/*"
              onChange={handleFile}
            />

            {preview && (
              <div className="previewBox">
                <p>Preview</p>
                <img src={preview} alt="preview" />
              </div>
            )}

            <button
              className="updateBtn"
              onClick={updateLogo}
              disabled={loading}
            >
              {loading ? "Updating..." : "Update Logo"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
