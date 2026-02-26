import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import CollectorNavbar from "../../../components/Collector/CollectorNavbar";
import "./CollectorActiveJob.css";

const API = "http://localhost:5000/api";

const CollectorActiveJob = () => {
  const token = localStorage.getItem("collectorToken");
  const collectorData = JSON.parse(localStorage.getItem("collectorData") || "null");
  const collectorId = collectorData?.collector_id;
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchActiveJob = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/collector/active-job`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(collectorId ? { "x-collector-id": collectorId } : {})
        }
      });
      setJob(res.data || null);
    } catch {
      setJob(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveJob();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startJob = async () => {
    if (!job) return;
    try {
      setActionLoading(true);
      await axios.post(
        `${API}/collector/jobs/${job.request_id}/start`,
        {},
        {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(collectorId ? { "x-collector-id": collectorId } : {})
          }
        }
      );
      fetchActiveJob();
    } catch {
      alert("Failed to start job");
    } finally {
      setActionLoading(false);
    }
  };

  const arrivedJob = async () => {
    if (!job) return;
    try {
      setActionLoading(true);
      await axios.post(
        `${API}/collector/jobs/${job.request_id}/arrived`,
        {},
        {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(collectorId ? { "x-collector-id": collectorId } : {})
          }
        }
      );
      navigate(`/collector/job/${job.request_id}/complete`);
    } catch {
      alert("Failed to mark arrived");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <CollectorNavbar />
        <div className="caj-wrap">
          <div className="caj-card">Loading active job...</div>
        </div>
      </>
    );
  }

  if (!job) {
    return (
      <>
        <CollectorNavbar />
        <div className="caj-wrap">
          <div className="caj-card empty">
            No active job right now.
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <CollectorNavbar />
      <div className="caj-wrap">
        <div className="caj-top">
          <h2>My Active Job</h2>
          <span className={`badge ${job.status}`}>{job.status}</span>
        </div>

        <div className="caj-card">
          <h3>Pickup Request #{job.request_id}</h3>

        <div className="grid2">
          <div>
            <strong>Citizen</strong>
            <p>{job.citizen_name}</p>
            <small>{job.citizen_phone || "-"}</small>
          </div>

          <div>
            <strong>Request Type</strong>
            <p>{job.request_type}</p>
          </div>

          <div>
            <strong>Pickup Address</strong>
            <p>{job.pickup_address || "-"}</p>
          </div>

          <div>
            <strong>Distance</strong>
            <p>{job.distance_km != null ? `${job.distance_km} km` : "-"}</p>
          </div>
        </div>

        <div className="map-box">
          <div className="map-placeholder">Route Preview</div>
          <button
            className="btn"
            onClick={() =>
              window.open(
                `https://www.google.com/maps/dir/?api=1&destination=${job.pickup_latitude},${job.pickup_longitude}`,
                "_blank"
              )
            }
            disabled={!job.pickup_latitude || !job.pickup_longitude}
          >
            Open Route in Maps
          </button>
        </div>

        <div className="actions">
          {job.status === "ACCEPTED_BY_COLLECTOR" && (
            <button
              className="btn start"
              onClick={startJob}
              disabled={actionLoading}
            >
              Start
            </button>
          )}

          {job.status === "IN_PROGRESS" && (
            <>
              <button
                className="btn arrived"
                onClick={arrivedJob}
                disabled={actionLoading}
              >
                Arrived
              </button>

              <button
                className="btn complete"
                onClick={() =>
                  navigate(`/collector/job/${job.request_id}/complete`)
                }
              >
                Complete
              </button>
            </>
          )}
        </div>
        </div>
      </div>
    </>
  );
};

export default CollectorActiveJob;
