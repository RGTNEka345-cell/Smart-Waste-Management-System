import React, { useState } from "react";
import axios from "axios";
import AdminNavbar from "../../../components/Admin/AdminNavbar";
import "./AdminAddEcoTip.css";

const API = "http://localhost:5000/api";

const AdminAddEcoTip = () => {
  const token = localStorage.getItem("adminToken");

  const [form, setForm] = useState({
    title: "",
    content: "",
    category: "general",
    difficulty: "easy",
    audience: "BOTH",
    is_published: true
  });

  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({
      ...p,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const validate = () => {
    if (!form.title.trim()) return "Title is required";
    if (!form.content.trim()) return "Content is required";
    return null;
  };

  const resetForm = () => {
    setForm({
      title: "",
      content: "",
      category: "general",
      difficulty: "easy",
      audience: "BOTH",
      is_published: true
    });
    setImageFile(null);
    setPreview("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const msg = validate();
    if (msg) return alert(msg);

    try {
      setLoading(true);

      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("content", form.content);
      fd.append("category", form.category);
      fd.append("difficulty", form.difficulty);
      fd.append("audience", form.audience);
      fd.append("is_published", form.is_published ? "1" : "0");

      if (imageFile) fd.append("image", imageFile);

      await axios.post(`${API}/admin/eco-tips`, fd, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          "Content-Type": "multipart/form-data"
        }
      });

      alert("Eco Tip added ✅");
      resetForm();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to add eco tip");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AdminNavbar />
      <div className="aet-wrap">
        <div className="aet-top">
          <div>
            <h2>Add Eco Tip</h2>
            <p className="muted">Publish tips for Citizens, Collectors, or both.</p>
          </div>
        </div>

        <form className="aet-card" onSubmit={handleSubmit}>
          <div className="grid2">
            <div className="field full">
              <label>Title *</label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Eg: Separate plastic and paper waste"
              />
            </div>

            <div className="field full">
              <label>Content *</label>
              <textarea
                name="content"
                value={form.content}
                onChange={handleChange}
                placeholder="Write the eco tip details..."
              />
            </div>

            <div className="field">
              <label>Category</label>
              <select name="category" value={form.category} onChange={handleChange}>
                <option value="general">general</option>
                <option value="recycle">recycle</option>
                <option value="reduce">reduce</option>
                <option value="reuse">reuse</option>
                <option value="compost">compost</option>
                <option value="energy">energy</option>
                <option value="water">water</option>
                <option value="plastic">plastic</option>
              </select>
            </div>

            <div className="field">
              <label>Difficulty</label>
              <select name="difficulty" value={form.difficulty} onChange={handleChange}>
                <option value="easy">easy</option>
                <option value="medium">medium</option>
                <option value="hard">hard</option>
              </select>
            </div>

            <div className="field">
              <label>Audience</label>
              <select name="audience" value={form.audience} onChange={handleChange}>
                <option value="BOTH">BOTH (Citizen + Collector)</option>
                <option value="CITIZEN">CITIZEN only</option>
                <option value="COLLECTOR">COLLECTOR only</option>
              </select>
            </div>

            <div className="field">
              <label>Publish</label>
              <div className="toggleRow">
                <input
                  id="pub"
                  type="checkbox"
                  name="is_published"
                  checked={form.is_published}
                  onChange={handleChange}
                />
                <label htmlFor="pub" className="toggleLabel">
                  {form.is_published ? "Published" : "Draft"}
                </label>
              </div>
            </div>
          </div>

          <div className="imageBox">
            <div className="imageLeft">
              <label className="imgBtn">
                Upload Image (optional)
                <input type="file" accept="image/*" hidden onChange={handleImage} />
              </label>
              <p className="hint">If you upload, it will be saved as image_url.</p>
            </div>

            <div className="imageRight">
              {preview ? (
                <img className="preview" src={preview} alt="preview" />
              ) : (
                <div className="previewEmpty">No image selected</div>
              )}
            </div>
          </div>

          <div className="actions">
            <button type="button" className="btn secondary" onClick={resetForm} disabled={loading}>
              Clear
            </button>

            <button type="submit" className="btn save" disabled={loading}>
              {loading ? "Saving..." : "Add Eco Tip"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default AdminAddEcoTip;
