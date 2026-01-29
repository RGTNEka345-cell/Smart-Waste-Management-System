import React, { useEffect, useMemo, useState } from "react";
import CitizenNavbar from "../../../components/Citizen/CitizenNavbar";
import axios from "axios";
import "./CreatePickupRequest.css";

const CreatePickupRequest = () => {
  const citizen = JSON.parse(localStorage.getItem("citizen"));

  const [requestType, setRequestType] = useState("NORMAL");
  const [note, setNote] = useState("");
  const [wasteTypes, setWasteTypes] = useState([]);

  // items only used for SPECIAL (factory)
  const [items, setItems] = useState([{ wastetype_id: "", quantity: "", unit: "kg" }]);

  // photos (max 3)
  const [photos, setPhotos] = useState([]); // File[]
  const [photoError, setPhotoError] = useState("");

  const isSpecial = useMemo(() => requestType === "SPECIAL", [requestType]);
  const photoPreviews = useMemo(
    () => photos.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [photos]
  );

  useEffect(() => {
    return () => {
      photoPreviews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [photoPreviews]);

  /* ================= LOAD WASTE TYPES ================= */
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/waste-types")
      .then((res) => setWasteTypes(res.data))
      .catch(() => setWasteTypes([]));
  }, []);

  /* ================= REQUEST TYPE CHANGE ================= */
  useEffect(() => {
    // When switching to NORMAL, clear special items (since normal doesn't need waste types)
    if (!isSpecial) {
      setItems([{ wastetype_id: "", quantity: "", unit: "kg" }]);
    } else {
      // SPECIAL must have exactly one item
      setItems((prev) => (prev.length ? [prev[0]] : [{ wastetype_id: "", quantity: "", unit: "kg" }]));
    }
  }, [isSpecial]);

  /* ================= UPDATE ITEM (SPECIAL ONLY) ================= */
  const updateItem = (field, value) => {
    // only one item allowed
    setItems((prev) => {
      const one = prev[0] || { wastetype_id: "", quantity: "", unit: "kg" };
      return [{ ...one, [field]: value }];
    });
  };

  /* ================= PHOTO HANDLING (MAX 3) ================= */
  const handlePhotoChange = (e) => {
    setPhotoError("");
    const selected = Array.from(e.target.files || []);

    // Only keep up to 3
    const next = [...photos, ...selected].slice(0, 3);

    if (photos.length + selected.length > 3) {
      setPhotoError("You can upload maximum 3 photos.");
    }
    setPhotos(next);

    // Reset input so same file can be re-selected if removed
    e.target.value = "";
  };

  const removePhoto = (index) => {
    setPhotos(photos.filter((_, i) => i !== index));
    setPhotoError("");
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!citizen?.id) {
      alert("Citizen not found. Please login again.");
      return;
    }

    // SPECIAL must have one waste type selected
    if (isSpecial && !items[0]?.wastetype_id) {
      alert("Please select one waste type for Special (Factory) request.");
      return;
    }

    // photos: optional, but if user selects, max 3 (already enforced)
    // Build FormData because we send files
    const formData = new FormData();

    const payload = {
      citizen_id: citizen.id,
      request_type: requestType,
      target_collection_type: isSpecial ? "factory" : "government",
      pickup_latitude: citizen.latitude,
      pickup_longitude: citizen.longitude,
      pickup_address: citizen.address,
      note,
      items: isSpecial ? items : [] // NORMAL => empty
    };

    formData.append("data", JSON.stringify(payload));

    photos.forEach((file) => {
      formData.append("photos", file); // backend should accept "photos" array
    });

    console.log("SEND TO BACKEND (payload):", payload);
    console.log("PHOTOS:", photos);

    try {
      await axios.post("http://localhost:5000/api/pickup-requests", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      alert("Pickup request submitted");

      setNote("");
      setPhotos([]);
      setPhotoError("");
      setItems([{ wastetype_id: "", quantity: "", unit: "kg" }]);
      setRequestType("NORMAL");
    } catch (err) {
      alert("Error submitting request");
    }
  };

  return (
    <>
      <CitizenNavbar setActiveTab={() => {}} />
      <div className="pickup-container">
        <h2>Create Pickup Request</h2>

        <form onSubmit={handleSubmit}>
        {/* Request Type */}
        <label>Request Type</label>
        <select value={requestType} onChange={(e) => setRequestType(e.target.value)}>
          <option value="NORMAL">Normal (Government)</option>
          <option value="SPECIAL">Special (Factory)</option>
        </select>

        {/* Waste Items (ONLY for SPECIAL) */}
        {isSpecial && (
          <>
            <h3>Waste Type (Special Request - select only one)</h3>

            <div className="waste-row single">
              <select
                value={items[0]?.wastetype_id || ""}
                onChange={(e) => updateItem("wastetype_id", e.target.value)}
                required
              >
                <option value="">Select Waste Type</option>
                {wasteTypes.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Qty"
                value={items[0]?.quantity || ""}
                onChange={(e) => updateItem("quantity", e.target.value)}
                min="0"
                step="0.01"
              />

              <select value={items[0]?.unit || "kg"} onChange={(e) => updateItem("unit", e.target.value)}>
                <option value="kg">kg</option>
                <option value="bag">bag</option>
                <option value="piece">piece</option>
                <option value="other">other</option>
              </select>
            </div>

            <p className="hint">
              There is no need to select waste types in general (government) requests. Only one waste type is required for special (factory) requests.
            </p>
          </>
        )}

        {/* Photos (NORMAL + SPECIAL both) */}
        <h3>Upload Photos (Max 3)</h3>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handlePhotoChange}
        />

        {photoError && <p className="error-text">{photoError}</p>}

        {photos.length > 0 && (
          <div className="photo-grid">
            {photoPreviews.map((p, idx) => (
              <div className="photo-card" key={p.url}>
                <img src={p.url} alt={`Upload ${idx + 1}`} />
                <div className="photo-meta">
                  <span className="photo-name">{p.file.name}</span>
                  <button type="button" className="photo-remove" onClick={() => removePhoto(idx)}>
                    x
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Note */}
        <label>Note</label>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} />

        <button type="submit" className="submit-btn">
          Submit Pickup Request
        </button>
        </form>
      </div>
    </>
  );
};

export default CreatePickupRequest;

