import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import "./CitizenCreateDumpReport.css";

const API = "http://localhost:5000/api";
const GOOGLE_KEY =
  process.env.REACT_APP_GOOGLE_MAPS_KEY ||
  "AIzaSyDCDq2OdTXSFuee8I7L83_0vmavC65lMCc";

const loadGoogleMaps = () =>
  new Promise((resolve, reject) => {
    if (window.google?.maps) {
      resolve(window.google.maps);
      return;
    }

    const existing = document.getElementById("google-maps-script");
    if (existing) {
      existing.addEventListener("load", () => resolve(window.google.maps));
      existing.addEventListener("error", () => reject(new Error("Google Maps failed to load")));
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_KEY}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google.maps);
    script.onerror = () => reject(new Error("Google Maps failed to load"));
    document.body.appendChild(script);
  });

export default function CitizenCreateDumpReport() {
  const token = localStorage.getItem("citizenToken");
  const citizen = JSON.parse(localStorage.getItem("citizen"));

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("MEDIUM");

  const [latitude, setLatitude] = useState(citizen?.latitude ?? "");
  const [longitude, setLongitude] = useState(citizen?.longitude ?? "");
  const [address, setAddress] = useState(citizen?.address ?? "");
  const [mapSearch, setMapSearch] = useState(citizen?.address ?? "");
  const [mapError, setMapError] = useState("");

  const [beforePhotos, setBeforePhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const mapRef = useRef(null);
  const mapObjRef = useRef(null);
  const markerRef = useRef(null);
  const geocoderRef = useRef(null);

  const previews = useMemo(
    () => beforePhotos.map((f) => ({ f, url: URL.createObjectURL(f) })),
    [beforePhotos]
  );

  const updatePickedLocation = (lat, lng, resolvedAddress = "") => {
    setLatitude(Number(lat).toFixed(8));
    setLongitude(Number(lng).toFixed(8));
    if (resolvedAddress) {
      setAddress(resolvedAddress);
      setMapSearch(resolvedAddress);
    }
  };

  const reverseGeocode = (lat, lng) => {
    const geocoder = geocoderRef.current;
    if (!geocoder) return;

    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results && results[0]) {
        updatePickedLocation(lat, lng, results[0].formatted_address);
      } else {
        updatePickedLocation(lat, lng);
      }
    });
  };

  useEffect(() => {
    let clickListener = null;

    const initMap = async () => {
      try {
        setMapError("");
        const maps = await loadGoogleMaps();
        if (!mapRef.current) return;

        const initLat = Number(latitude) || 6.9271;
        const initLng = Number(longitude) || 79.8612;

        const map = new maps.Map(mapRef.current, {
          center: { lat: initLat, lng: initLng },
          zoom: 14,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: false
        });

        const marker = new maps.Marker({
          map,
          position: { lat: initLat, lng: initLng },
          draggable: true
        });

        geocoderRef.current = new maps.Geocoder();
        mapObjRef.current = map;
        markerRef.current = marker;

        clickListener = map.addListener("click", (e) => {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          marker.setPosition({ lat, lng });
          reverseGeocode(lat, lng);
        });

        marker.addListener("dragend", (e) => {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          reverseGeocode(lat, lng);
        });
      } catch (err) {
        setMapError("Map load failed");
      }
    };

    initMap();

    return () => {
      if (clickListener) clickListener.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const useMyLocation = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(8));
        const lng = Number(pos.coords.longitude.toFixed(8));
        updatePickedLocation(lat, lng);

        if (mapObjRef.current && markerRef.current) {
          mapObjRef.current.panTo({ lat, lng });
          markerRef.current.setPosition({ lat, lng });
        }
        reverseGeocode(lat, lng);
      },
      () => alert("Location permission denied")
    );
  };

  const searchOnMap = () => {
    const text = mapSearch.trim();
    if (!text) return;
    if (!geocoderRef.current || !mapObjRef.current || !markerRef.current) return;

    geocoderRef.current.geocode({ address: text }, (results, status) => {
      if (status !== "OK" || !results || !results[0]) {
        alert("Location not found");
        return;
      }

      const loc = results[0].geometry.location;
      const lat = loc.lat();
      const lng = loc.lng();
      mapObjRef.current.panTo({ lat, lng });
      markerRef.current.setPosition({ lat, lng });
      updatePickedLocation(lat, lng, results[0].formatted_address);
    });
  };

  const pickPhotos = (files) => {
    const arr = Array.from(files || []).slice(0, 3);
    setBeforePhotos(arr);
  };

  const removePhoto = (idx) => {
    setBeforePhotos(beforePhotos.filter((_, i) => i !== idx));
  };

  const validate = () => {
    if (!description.trim()) return "Description is required";
    if (!latitude || !longitude) return "Latitude/Longitude required";
    if (beforePhotos.length === 0) return "Upload at least 1 photo";
    return null;
  };

  const submit = async (e) => {
    e.preventDefault();
    const msg = validate();
    if (msg) return alert(msg);

    try {
      setLoading(true);
      const fd = new FormData();
      fd.append("citizen_id", citizen?.id || "");
      fd.append("title", title);
      fd.append("description", description);
      fd.append("severity", severity);
      fd.append("latitude", latitude);
      fd.append("longitude", longitude);
      fd.append("address", address);

      beforePhotos.forEach((f) => fd.append("before_photos", f));

      await axios.post(`${API}/illegal-dumping`, fd, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          "Content-Type": "multipart/form-data"
        }
      });

      alert("Report submitted ✅");
      setTitle("");
      setDescription("");
      setSeverity("MEDIUM");
      setBeforePhotos([]);
    } catch (err) {
      alert(err?.response?.data?.message || "Submit failed (duplicate location?)");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="id-wrap citizen-dump-create">
      <div className="id-top">
        <div>
          <h2>Report Illegal Dumping</h2>
          <p className="muted">Citizen only. Admin will approve before collectors see it.</p>
        </div>
      </div>

      <form className="card" onSubmit={submit}>
        <div className="field">
          <label>Title (optional)</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short title" />
        </div>

        <div className="field" style={{ marginTop: 10 }}>
          <label>Description *</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="grid" style={{ marginTop: 12 }}>
          <div className="field">
            <label>Severity</label>
            <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
            </select>
          </div>

          <div className="field">
            <label>Latitude *</label>
            <input value={latitude} onChange={(e) => setLatitude(e.target.value)} />
          </div>

          <div className="field">
            <label>Longitude *</label>
            <input value={longitude} onChange={(e) => setLongitude(e.target.value)} />
          </div>
        </div>

        <div className="field" style={{ marginTop: 10 }}>
          <label>Address (optional)</label>
          <input value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>

        <div className="actions" style={{ marginTop: 12 }}>
          <button type="button" className="btn secondary" onClick={useMyLocation}>
            Use Current Location
          </button>
          <input
            value={mapSearch}
            onChange={(e) => setMapSearch(e.target.value)}
            placeholder="Search place or address"
            style={{ minWidth: 260, flex: "1 1 260px" }}
          />
          <button type="button" className="btn secondary" onClick={searchOnMap}>
            Search on Map
          </button>
          <button
            type="button"
            className="btn secondary"
            disabled={!latitude || !longitude}
            onClick={() => window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, "_blank")}
          >
            Open in Maps
          </button>
        </div>

        <div className="mapBox" style={{ marginTop: 12 }}>
          {mapError ? (
            <span>{mapError}</span>
          ) : (
            <div ref={mapRef} style={{ width: "100%", height: 300, borderRadius: 10 }} />
          )}
        </div>

        <div className="field" style={{ marginTop: 14 }}>
          <label>Photos (BEFORE) * (max 3)</label>
          <input type="file" accept="image/*" multiple onChange={(e) => pickPhotos(e.target.files)} />
        </div>

        {previews.length > 0 && (
          <div className="previewGrid" style={{ marginTop: 12 }}>
            {previews.map((p, idx) => (
              <div className="imgBox" key={idx}>
                <img src={p.url} alt="before" />
                <button type="button" className="rm" onClick={() => removePhoto(idx)}>✕</button>
              </div>
            ))}
          </div>
        )}

        <button className="btn primary" style={{ marginTop: 14 }} disabled={loading}>
          {loading ? "Submitting..." : "Submit Report"}
        </button>
      </form>
    </div>
  );
}
