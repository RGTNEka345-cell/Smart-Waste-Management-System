import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import CitizenNavbar from "../../../components/Citizen/CitizenNavbar";
import "./EcoTipsView.css";

const API = "http://localhost:5000/api";
const HOST = "http://localhost:5000";

export default function CitizenEcoTips() {
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(true);

  const [category, setCategory] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [q, setQ] = useState("");

  const fetchTips = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/eco-tips?audience=CITIZEN`);
      setTips(Array.isArray(res.data) ? res.data : []);
    } catch {
      setTips([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTips();
  }, []);

  const filtered = useMemo(() => {
    return tips.filter((t) => {
      const okCat = category === "all" || t.category === category;
      const okDiff = difficulty === "all" || t.difficulty === difficulty;
      const text = `${t.title || ""} ${t.content || ""}`.toLowerCase();
      const okQ = !q.trim() || text.includes(q.toLowerCase());
      return okCat && okDiff && okQ;
    });
  }, [tips, category, difficulty, q]);

  return (
    <>
      <CitizenNavbar setActiveTab={() => {}} />

      <div className="et-wrap">
        <div className="et-top">
          <div>
            <h2>Eco Tips</h2>
            <p className="muted">Simple tips to keep your area clean</p>
          </div>

          <button className="btn secondary" onClick={fetchTips} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        <div className="filters">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search tips..."
          />

          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">All Categories</option>
            <option value="general">general</option>
            <option value="recycle">recycle</option>
            <option value="reduce">reduce</option>
            <option value="reuse">reuse</option>
            <option value="compost">compost</option>
            <option value="energy">energy</option>
            <option value="water">water</option>
            <option value="plastic">plastic</option>
          </select>

          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            <option value="all">All Difficulty</option>
            <option value="easy">easy</option>
            <option value="medium">medium</option>
            <option value="hard">hard</option>
          </select>
        </div>

        {loading ? (
          <div className="card">Loading tips...</div>
        ) : filtered.length === 0 ? (
          <div className="card empty">No eco tips found.</div>
        ) : (
          <div className="grid">
            {filtered.map((t) => (
              <div className="tipCard" key={t.tip_id}>
                <div className="img">
                  {t.image_url ? (
                    <img src={`${HOST}${t.image_url}`} alt="tip" />
                  ) : (
                    <div className="imgEmpty">Tips</div>
                  )}
                </div>

                <div className="body">
                  <div className="meta">
                    <span className="pill">{t.category || "general"}</span>
                    <span className={`pill diff ${t.difficulty || "easy"}`}>
                      {t.difficulty || "easy"}
                    </span>
                  </div>

                  <h3>{t.title}</h3>
                  <p className="content">{t.content}</p>

                  <div className="foot">
                    <small>{t.created_at ? new Date(t.created_at).toLocaleDateString() : ""}</small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
