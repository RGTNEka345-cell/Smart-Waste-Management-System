const WasteType = require("../models/WasteType");

exports.createWasteType = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Waste type name is required" });
    }

    await WasteType.create(name, description);
    res.status(201).json({ message: "Waste type added successfully" });

  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Waste type already exists" });
    }
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllWasteTypes = async (req, res) => {
  try {
    const [rows] = await WasteType.getAll();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteWasteType = async (req, res) => {
  try {
    const { id } = req.params;
    await WasteType.deleteById(id);
    res.json({ message: "Waste type deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
