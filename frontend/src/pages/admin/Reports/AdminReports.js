import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import AdminNavbar from "../../../components/Admin/AdminNavbar";
import "./AdminReports.css";

const API = "http://localhost:5000/api";

const REPORT_META = {
  summary: {
    title: "Summary Report",
    subtitle: "Overall admin snapshot for users, pickup flow, and dumping reports."
  },
  pickups: {
    title: "Pickup Report",
    subtitle: "Pickup request status, request type, citizen, and date details."
  },
  "illegal-dumping": {
    title: "Illegal Dumping Report",
    subtitle: "Illegal dumping queue and processed cleanup report summary."
  },
  "collector-performance": {
    title: "Collector Performance Report",
    subtitle: "Collector approval, service type, and operating area report."
  }
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || date.getFullYear() < 2000) return "-";
  return date.toLocaleString();
};

const normalizeStatus = (value) => String(value || "-").replaceAll("_", " ");
const VALID_DUMPING_SEVERITIES = new Set(["LOW", "MEDIUM", "HIGH"]);

const isValidDateValue = (value) => {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date.getFullYear() >= 2000;
};

const firstValidDate = (...values) => values.find(isValidDateValue) || "";

const isLikelyDateOnly = (value) => {
  if (!value || typeof value !== "string") return false;
  const trimmed = value.trim();
  return /^\d{1,2}\/\d{1,2}\/\d{4}/.test(trimmed) || /^\d{4}-\d{2}-\d{2}/.test(trimmed);
};

const safeAddress = (address, lat, lng) => {
  const value = String(address || "").trim();
  if (value && !isLikelyDateOnly(value)) return value;
  return coordinatesText(lat, lng);
};

const coordinatesText = (lat, lng) => {
  if (lat == null || lng == null || lat === "" || lng === "") return "-";
  return `${lat}, ${lng}`;
};

const pickupAddress = (row) =>
  row.pickup_address ||
  row.address ||
  row.citizen_address ||
  coordinatesText(row.pickup_latitude, row.pickup_longitude);

const dumpingSeverity = (row) => {
  const severity = String(row.severity || "").toUpperCase();
  return VALID_DUMPING_SEVERITIES.has(severity) ? severity : "-";
};

const downloadCsv = (filename, rows) => {
  if (!rows.length) return;

  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const value = row[header] == null ? "" : String(row[header]);
          return `"${value.replaceAll('"', '""')}"`;
        })
        .join(",")
    )
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const inDateRange = (row, from, to) => {
  const rawDate =
    row.date ||
    row.reported_date ||
    row.completed_date ||
    row.created_at ||
    row.requested_at ||
    row.approved_at ||
    row.completed_at ||
    row.rejected_at;

  if (!rawDate || (!from && !to)) return true;

  const rowTime = new Date(rawDate).getTime();
  if (Number.isNaN(rowTime)) return true;

  if (from) {
    const fromTime = new Date(`${from}T00:00:00`).getTime();
    if (rowTime < fromTime) return false;
  }

  if (to) {
    const toTime = new Date(`${to}T23:59:59`).getTime();
    if (rowTime > toTime) return false;
  }

  return true;
};

const countBy = (rows, field) =>
  rows.reduce((acc, row) => {
    const key = row[field] || "Unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

const buildSummaryRows = (stats, pickups, dumpingRows, collectors) => [
  { metric: "Citizens", value: stats.citizens || 0 },
  { metric: "Collectors", value: stats.collectors || collectors.length || 0 },
  { metric: "Pickup Requests", value: pickups.length },
  { metric: "Illegal Dumping Reports", value: dumpingRows.length },
  { metric: "Approved Collectors", value: collectors.filter((c) => c.approval_status === "APPROVED").length },
  { metric: "Rejected Collectors", value: collectors.filter((c) => c.approval_status === "REJECTED").length }
];

const AdminReports = ({ type = "summary" }) => {
  const meta = REPORT_META[type] || REPORT_META.summary;
  const token = localStorage.getItem("adminToken");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ status: "", from: "", to: "" });
  const [stats, setStats] = useState({});
  const [pickups, setPickups] = useState([]);
  const [dumpingRows, setDumpingRows] = useState([]);
  const [collectors, setCollectors] = useState([]);

  useEffect(() => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const loadReports = async () => {
      try {
        setLoading(true);
        setError("");

        const [statsRes, pickupRes, dumpingHistoryRes, dumpingQueueRes, approvedRes, rejectedRes] =
          await Promise.allSettled([
            axios.get(`${API}/admin/stats`, { headers }),
            axios.get(`${API}/admin/pickup-requests`, { headers }),
            axios.get(`${API}/admin/illegal-dumping/history`, { headers }),
            axios.get(`${API}/admin/illegal-dumping?status=PENDING_ADMIN`, { headers }),
            axios.get(`${API}/admin/collectors/approved`, { headers }),
            axios.get(`${API}/admin/collectors/rejected`, { headers })
          ]);

        setStats(statsRes.status === "fulfilled" ? statsRes.value.data || {} : {});
        setPickups(pickupRes.status === "fulfilled" && Array.isArray(pickupRes.value.data) ? pickupRes.value.data : []);

        const history = dumpingHistoryRes.status === "fulfilled" && Array.isArray(dumpingHistoryRes.value.data)
          ? dumpingHistoryRes.value.data
          : [];
        const queue = dumpingQueueRes.status === "fulfilled" && Array.isArray(dumpingQueueRes.value.data)
          ? dumpingQueueRes.value.data
          : [];
        setDumpingRows([...queue, ...history]);

        const approved = approvedRes.status === "fulfilled" && Array.isArray(approvedRes.value.data)
          ? approvedRes.value.data
          : [];
        const rejected = rejectedRes.status === "fulfilled" && Array.isArray(rejectedRes.value.data)
          ? rejectedRes.value.data
          : [];
        setCollectors([...approved, ...rejected]);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load report data");
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, [token]);

  const tableRows = useMemo(() => {
    if (type === "pickups") {
      return pickups.map((row) => ({
        id: row.request_id,
        status: row.status,
        type: row.request_type || row.target_collection_type || "-",
        citizen: row.citizen_name || "-",
        email: row.citizen_email || "-",
        date: row.requested_at,
        address: pickupAddress(row)
      }));
    }

    if (type === "illegal-dumping") {
      return dumpingRows.map((row) => ({
        id: row.report_id,
        status: row.status,
        title: row.title || "-",
        severity: dumpingSeverity(row),
        citizen: row.citizen_name || "-",
        collector: row.collector_name || "-",
        reported_date: firstValidDate(row.created_at, row.approved_at, row.updated_at),
        completed_date: firstValidDate(row.completed_at, row.cleaned_at, row.rejected_at),
        address: safeAddress(row.address, row.latitude, row.longitude)
      }));
    }

    if (type === "collector-performance") {
      return collectors.map((row) => ({
        id: row.collector_id || row.approval_id,
        status: row.approval_status || row.status,
        name: row.full_name || "-",
        email: row.email || "-",
        type: row.collection_type || "-",
        vehicle: row.vehicle_number || "-",
        date: row.approved_at || row.created_at,
        area: row.home_address || row.address || coordinatesText(row.latitude, row.longitude)
      }));
    }

    return buildSummaryRows(stats, pickups, dumpingRows, collectors).map((row) => ({
      id: row.metric,
      status: "",
      metric: row.metric,
      value: row.value
    }));
  }, [collectors, dumpingRows, pickups, stats, type]);

  const filteredRows = useMemo(() => {
    return tableRows.filter((row) => {
      const statusMatch = !filters.status || String(row.status || "").toLowerCase() === filters.status.toLowerCase();
      return statusMatch && inDateRange(row, filters.from, filters.to);
    });
  }, [filters, tableRows]);

  const statusOptions = useMemo(() => {
    return [...new Set(tableRows.map((row) => row.status).filter(Boolean))];
  }, [tableRows]);

  const statCards = useMemo(() => {
    if (type === "summary") {
      return buildSummaryRows(stats, pickups, dumpingRows, collectors);
    }

    const statusCounts = countBy(tableRows, "status");
    return [
      { metric: "Total", value: tableRows.length },
      ...Object.entries(statusCounts).slice(0, 4).map(([metric, value]) => ({
        metric: normalizeStatus(metric),
        value
      }))
    ];
  }, [collectors, dumpingRows, pickups, stats, tableRows, type]);

  const visibleHeaders = useMemo(() => {
    if (type === "summary") return ["metric", "value"];
    if (type === "pickups") return ["id", "status", "type", "citizen", "email", "date", "address"];
    if (type === "illegal-dumping") return ["id", "status", "title", "severity", "citizen", "collector", "reported_date", "completed_date", "address"];
    if (type === "collector-performance") return ["id", "status", "name", "email", "type", "vehicle", "date", "area"];
    return filteredRows.length > 0 ? Object.keys(filteredRows[0]) : [];
  }, [filteredRows, type]);

  return (
    <>
      <AdminNavbar />
      <div className="admin-report-page">
        <div className="report-top">
          <div>
            <p className="report-kicker">Admin Reports</p>
            <h1>{meta.title}</h1>
            <p>{meta.subtitle}</p>
          </div>

          <div className="report-actions">
            <button
              type="button"
              className="report-btn secondary"
              onClick={() => window.print()}
            >
              Export PDF
            </button>
            <button
              type="button"
              className="report-btn primary"
              onClick={() => downloadCsv(`${type}-report.csv`, filteredRows)}
              disabled={filteredRows.length === 0}
            >
              Export CSV
            </button>
          </div>
        </div>

        <div className="report-filters">
          <label>
            Status
            <select
              value={filters.status}
              onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
            >
              <option value="">All Statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {normalizeStatus(status)}
                </option>
              ))}
            </select>
          </label>
          <label>
            From
            <input
              type="date"
              value={filters.from}
              onChange={(event) => setFilters((prev) => ({ ...prev, from: event.target.value }))}
            />
          </label>
          <label>
            To
            <input
              type="date"
              value={filters.to}
              onChange={(event) => setFilters((prev) => ({ ...prev, to: event.target.value }))}
            />
          </label>
          <button
            type="button"
            className="report-btn ghost"
            onClick={() => setFilters({ status: "", from: "", to: "" })}
          >
            Reset
          </button>
        </div>

        <div className="report-stat-grid">
          {statCards.map((card) => (
            <div className="report-stat" key={card.metric}>
              <span>{card.metric}</span>
              <strong>{card.value}</strong>
            </div>
          ))}
        </div>

        <div className="report-table-card">
          {error && <div className="report-error">{error}</div>}
          {loading ? (
            <div className="report-muted">Loading report data...</div>
          ) : filteredRows.length === 0 ? (
            <div className="report-muted">No records found for the selected filters.</div>
          ) : (
            <div className="report-table-wrap">
              <table className="report-table">
                <thead>
                  <tr>
                    {visibleHeaders.map((header) => (
                      <th key={header}>{header.replaceAll("_", " ")}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => (
                    <tr key={`${type}-${row.id}`}>
                      {visibleHeaders.map((header) => (
                        <td key={header}>
                          {header.includes("date") ? formatDate(row[header]) : normalizeStatus(row[header])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminReports;
