import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaRecycle, FaTruck, FaUserPlus } from "react-icons/fa";
import Navbar from "../components/HomePage/Navbar";
import "./HomePage.css";

const API = "http://localhost:5000/api";

function HomePage() {
  const [stats, setStats] = useState([
    { value: "0", label: "Active Users" },
    { value: "0", label: "Requests Handled" },
    { value: "0", label: "Collectors" },
    { value: "0", label: "Citizens" }
  ]);

  useEffect(() => {
    let mounted = true;

    const loadStats = async () => {
      try {
        const res = await fetch(`${API}/public/stats`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.message || "Failed to load stats");
        }

        if (!mounted) return;

        setStats([
          { value: `${Number(data.activeUsers || 0).toLocaleString()}+`, label: "Active Users" },
          { value: `${Number(data.requests || 0).toLocaleString()}+`, label: "Requests Handled" },
          { value: Number(data.collectors || 0).toLocaleString(), label: "Collectors" },
          { value: Number(data.citizens || 0).toLocaleString(), label: "Citizens" }
        ]);
      } catch {
        if (!mounted) return;
        setStats([
          { value: "0", label: "Active Users" },
          { value: "0", label: "Requests Handled" },
          { value: "0", label: "Collectors" },
          { value: "0", label: "Citizens" }
        ]);
      }
    };

    loadStats();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="home-container">
      <Navbar />

      <main className="hero-shell">
        <div className="hero-glow hero-glow-left" />
        <div className="hero-glow hero-glow-right" />

        <div className="hero-frame">
          <section className="hero-panel">
            <div className="hero-logo">
              <FaRecycle />
            </div>

            <h1 className="hero-title">Smart Waste Management System</h1>
            <p className="hero-subtitle">
              Real-time tracking | Automated scheduling | Sustainable cities
            </p>

            <div className="hero-stats">
              {stats.map((item) => (
                <article className="hero-stat-card" key={item.label}>
                  <span className="hero-stat-value">{item.value}</span>
                  <span className="hero-stat-label">{item.label}</span>
                </article>
              ))}
            </div>

            <div className="hero-actions">
              <Link className="hero-btn hero-btn-primary" to="/register/collector">
                <FaTruck />
                <span>Join As Collectors</span>
              </Link>

              <Link className="hero-btn hero-btn-secondary" to="/register/citizen">
                <FaUserPlus />
                <span>Join As Citizen</span>
              </Link>
            </div>
          </section>

          <footer className="hero-footer">
            <p>WasteWise</p>
            <p>Smart waste operations for citizens, collectors, and cities.</p>
            <p>(c) {new Date().getFullYear()} Smart Waste Management System</p>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default HomePage;
