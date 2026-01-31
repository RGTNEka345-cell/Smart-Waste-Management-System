import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import AdminNavbar from "../../../components/Admin/AdminNavbar";
import "./WasteType.css";

const WasteType = () => {
  const [wasteTypes, setWasteTypes] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const admin = JSON.parse(localStorage.getItem("admin"));

  // Load waste types from backend
  const fetchWasteTypes = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/admin/wastetypes", {
        headers: {
          "x-admin-id": admin?.admin_id
        }
      });
      setWasteTypes(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to load waste types");
    }
  }, [admin?.admin_id]);

  useEffect(() => {
    fetchWasteTypes();
  }, [fetchWasteTypes]);

  const handleAdd = async (e) => {
    e.preventDefault();

    if (!name) {
      alert("Waste type name required");
      return;
    }

    try {
      await axios.post(
        "http://localhost:5000/api/admin/wastetypes",
        { name, description },
        {
          headers: {
            "x-admin-id": admin?.admin_id
          }
        }
      );

      setName("");
      setDescription("");
      fetchWasteTypes(); // reload table
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Error adding waste type");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this waste type?")) return;

    try {
      await axios.delete(
        `http://localhost:5000/api/admin/wastetypes/${id}`,
        {
          headers: {
            "x-admin-id": admin?.admin_id
          }
        }
      );
      fetchWasteTypes();
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  };

  return (
    <>
      <AdminNavbar />
      <div className="admin-container">
        <h2>Manage Waste Types</h2>
        <p>Add and manage waste categories</p>

      {/* Add Form */}
      <form className="waste-form" onSubmit={handleAdd}>
        <input
          type="text"
          placeholder="Waste Type (e.g. Plastic)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <textarea
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <button type="submit">Add Waste Type</button>
      </form>

      {/* List */}
      <table className="waste-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Waste Type</th>
            <th>Description</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {wasteTypes.length === 0 ? (
            <tr>
              <td colSpan="4">No waste types added</td>
            </tr>
          ) : (
            wasteTypes.map((w, i) => (
              <tr key={w.id}>
                <td>{i + 1}</td>
                <td>{w.name}</td>
                <td>{w.description}</td>
                <td>
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(w.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      </div>
    </>
  );
};

export default WasteType;
