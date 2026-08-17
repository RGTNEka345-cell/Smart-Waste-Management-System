import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import CitizenNavbar from "../../../components/Citizen/CitizenNavbar";
import "./CitizenDumpReportDetails.css";

const API = "http://localhost:5000/api";
const HOST = "http://localhost:5000";

const steps = [
  { key: "PENDING_ADMIN", label: "Pending Admin" },
  { key: "APPROVED_ADMIN", label: "Approved" },
  { key: "OFFERING", label: "Offering" },
  { key: "ACCEPTED_BY_COLLECTOR", label: "Accepted" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "CLEANED", label: "Cleaned" }
];

const rejectedStatuses = new Set(["REJECTED_ADMIN"]);

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString();
};

const statusLabel = (status) => String(status || "-").replaceAll("_", " ");

const getStepIndex = (status) => {
  const idx = steps.findIndex((step) => step.key === status);
  return idx === -1 ? 0 : idx;
};

export default function CitizenDumpReportDetails() {
  const { reportId } = useParams();
  const token = localStorage.getItem("citizenToken");
  const citizen = JSON.parse(localStorage.getItem("citizen") || "null");
  const citizenId = citizen?.id;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await axios.get(`${API}/illegal-dumping/${reportId}`, {
          params: citizenId ? { citizen_id: citizenId } : {},
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        setData(res.data);
      } catch (err) {
        setData(null);
        setError(err?.response?.data?.message || "Failed to load report details");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [reportId, citizenId, token]);

  const report = data?.report;
  const photos = data?.photos || [];
  const beforePhotos = photos.filter((photo) => photo.photo_type === "BEFORE");
  const afterPhotos = photos.filter((photo) => photo.photo_type === "AFTER");
  const otherPhotos = photos.filter(
    (photo) => photo.photo_type !== "BEFORE" && photo.photo_type !== "AFTER"
  );
  const activeIdx = useMemo(() => getStepIndex(report?.status), [report?.status]);
  const mapUrl = report
    ? `https://www.google.com/maps?q=${report.latitude},${report.longitude}`
    : "#";

  const renderPhotoGroup = (title, group, emptyText) => (
    <div className="cdr-photo-section">
      <h4>{title}</h4>
      {group.length === 0 ? (
        <p className="cdr-muted">{emptyText}</p>
      ) : (
        <div className="cdr-photo-grid">
          {group.map((photo) => (
            <a
              key={photo.photo_id}
              className="cdr-photo-card"
              href={`${HOST}${photo.photo_url}`}
              target="_blank"
              rel="noreferrer"
            >
              <img src={`${HOST}${photo.photo_url}`} alt={title} />
              <span>{formatDate(photo.uploaded_at)}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <>
        <CitizenNavbar setActiveTab={() => {}} />
        <div className="cdr-wrap">
          <div className="cdr-card">Loading...</div>
        </div>
      </>
    );
  }

  if (!report) {
    return (
      <>
        <CitizenNavbar setActiveTab={() => {}} />
        <div className="cdr-wrap">
          <div className="cdr-card">
            <p className="cdr-error">{error || "Report not found."}</p>
            <Link className="cdr-back" to="/citizen/illegal-dumping/my">Back to My Reports</Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <CitizenNavbar setActiveTab={() => {}} />
      <div className="cdr-wrap">
        <div className="cdr-top">
          <div>
            <h2>Dumping Report #{report.report_id}</h2>
            <p>{report.title || "Illegal dumping report details"}</p>
          </div>
          <Link className="cdr-back" to="/citizen/illegal-dumping/my">Back</Link>
        </div>

        <div className="cdr-card">
          <div className="cdr-summary">
            <div>
              <span>Status</span>
              <strong className={rejectedStatuses.has(report.status) ? "cdr-status bad" : "cdr-status"}>
                {statusLabel(report.status)}
              </strong>
            </div>
            <div>
              <span>Severity</span>
              <strong>{report.severity || "-"}</strong>
            </div>
            <div>
              <span>Reported</span>
              <strong>{formatDate(report.created_at)}</strong>
            </div>
            <div>
              <span>Last Updated</span>
              <strong>{formatDate(report.updated_at)}</strong>
            </div>
          </div>
        </div>

        <div className="cdr-card">
          <h3>Status Timeline</h3>
          {rejectedStatuses.has(report.status) ? (
            <div className="cdr-rejected">Rejected by admin</div>
          ) : (
            <div className="cdr-timeline">
              {steps.map((step, idx) => (
                <div key={step.key} className={`cdr-step ${idx <= activeIdx ? "done" : ""}`}>
                  <div className="cdr-dot" />
                  <span>{step.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="cdr-grid">
          <div className="cdr-card">
            <h3>Report Details</h3>
            <div className="cdr-detail-list">
              <div><span>Description</span><p>{report.description || "-"}</p></div>
              <div><span>Address</span><p>{report.address || "-"}</p></div>
              <div><span>Coordinates</span><p>{report.latitude}, {report.longitude}</p></div>
              <div>
                <span>Location</span>
                <a href={mapUrl} target="_blank" rel="noreferrer">Open in Google Maps</a>
              </div>
              <div><span>Admin Remarks</span><p>{report.admin_remarks || "No remarks yet."}</p></div>
              <div><span>Approved At</span><p>{formatDate(report.approved_at)}</p></div>
              <div><span>Rejected At</span><p>{formatDate(report.rejected_at)}</p></div>
            </div>
          </div>

          <div className="cdr-card">
            <h3>Collector Details</h3>
            {data.collector ? (
              <div className="cdr-detail-list">
                <div><span>Name</span><p>{data.collector.full_name || "-"}</p></div>
                <div><span>Phone</span><p>{data.collector.phone_number || "-"}</p></div>
                <div><span>Vehicle No.</span><p>{data.collector.vehicle_number || "-"}</p></div>
                <div><span>Distance</span><p>{data.collector.distance_km ? `${data.collector.distance_km} km` : "-"}</p></div>
                <div><span>Accepted At</span><p>{formatDate(data.collector.accepted_at)}</p></div>
              </div>
            ) : (
              <p className="cdr-muted">No collector has accepted this cleanup yet.</p>
            )}
          </div>
        </div>

        <div className="cdr-card">
          <h3>Photos</h3>
          {renderPhotoGroup("Before Cleanup", beforePhotos, "No citizen photos found.")}
          {renderPhotoGroup("After Cleanup", afterPhotos, "Cleanup proof photos are not uploaded yet.")}
          {otherPhotos.length > 0 && renderPhotoGroup("Other Photos", otherPhotos, "No other photos.")}
        </div>

        <div className="cdr-card">
          <h3>Activity History</h3>
          {(data.history || []).length === 0 ? (
            <p className="cdr-muted">No activity history available.</p>
          ) : (
            <div className="cdr-history">
              {data.history.map((item) => (
                <div className="cdr-history-row" key={item.history_id}>
                  <strong>{statusLabel(item.status)}</strong>
                  <span>{formatDate(item.changed_at)} by {item.changed_by_role}</span>
                  {item.note && <p>{item.note}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
