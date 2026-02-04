const bcrypt = require("bcryptjs");
const db = require("../config/database");
const Collector = require("../models/Collector");
const Factory = require("../models/FactoryDetails");
const Government = require("../models/GovernmentDetails");

exports.registerCollector = async (req, res) => {
  try {
    const {
      full_name, email, gender, password,
      phone_number, home_address,
      collection_type, vehicle_number,
      factory_details, government_details
    } = req.body;

    // log incoming data for debugging
    console.log('Collector register - req.body keys:', Object.keys(req.body));
    console.log('Collector register - file:', req.file ? req.file.filename : null);

    // Validate required fields
    if (!full_name || !email || !gender || !password || 
        !phone_number || !collection_type || !vehicle_number) {
      return res.status(400).json({ 
        message: "Required fields are missing" 
      });
    }

    if (!req.file) {
      return res.status(400).json({ 
        message: "Vehicle image required" 
      });
    }

    // Parse JSON strings if present
    let parsedFactory = null;
    let parsedGovernment = null;
    
    if (factory_details) {
      try {
        parsedFactory = typeof factory_details === 'string' 
          ? JSON.parse(factory_details) 
          : factory_details;
      } catch (e) {
        console.warn('Failed to parse factory_details:', e.message);
      }
    }

    if (government_details) {
      try {
        parsedGovernment = typeof government_details === 'string'
          ? JSON.parse(government_details)
          : government_details;
      } catch (e) {
        console.warn('Failed to parse government_details:', e.message);
      }
    }

    // Validate collection type specific details
    if (collection_type === "factory" && !parsedFactory) {
      return res.status(400).json({ 
        message: "Factory details required for factory collector" 
      });
    }

    if (collection_type === "government" && !parsedGovernment) {
      return res.status(400).json({ 
        message: "Government details required for government collector" 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Prepare collector data array
    const collectorData = [
      full_name,
      email,
      gender,
      hashedPassword,
      phone_number,
      home_address || null,
      collection_type,
      req.file.filename,
      vehicle_number
    ];

    console.log('Collector data to insert:', collectorData);

    // Create collector using model
    const collectorId = await Collector.createCollector(collectorData);
    console.log('Created collector ID:', collectorId);

    // Create factory details if factory collector
    if (collection_type === "factory" && parsedFactory) {
      const factoryData = [
        collectorId,
        parsedFactory.factory_name || '',
        parsedFactory.factory_licence_no || '',
        parsedFactory.operating_hours || null,
        parsedFactory.waste_types_accepted 
          ? JSON.stringify(parsedFactory.waste_types_accepted)
          : '[]',
        parsedFactory.factory_address || null,
        parsedFactory.factory_contact || null,
        parsedFactory.factory_latitude || null,
        parsedFactory.factory_longitude || null
      ];
      
      console.log('Factory data to insert:', factoryData);
      await Factory.createFactory(factoryData);
    }

    // Create government details if government collector
    if (collection_type === "government" && parsedGovernment) {
      const govData = [
        collectorId,
        parsedGovernment.service_number || '',
        parsedGovernment.department_name || '',
        parsedGovernment.working_area_name || null,
        parsedGovernment.working_area_latitude || null,
        parsedGovernment.working_area_longitude || null,
        parsedGovernment.designation || null
      ];
      
      console.log('Government data to insert:', govData);
      await Government.createGovernment(govData);
    }

    res.status(201).json({
      success: true,
      message: "Collector registered successfully. Await admin approval.",
      collectorId: collectorId
    });

  } catch (err) {
    console.error("Registration error details:", err);
    
    // Handle duplicate email error
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        message: "Email already registered" 
      });
    }
    
    res.status(500).json({ 
      message: "Server error during registration",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

exports.loginCollector = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        message: "Email and password required" 
      });
    }

    // Get collector from database using model
    const collector = await Collector.findByEmail(email);

    if (!collector) {
      return res.status(401).json({ 
        message: "Invalid email or password" 
      });
    }

    // Check if collector is approved
    if (collector.status !== "APPROVED") {
      return res.status(403).json({
        message: `Your account is ${collector.status}. Please wait for admin approval or contact support.`,
        status: collector.status
      });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, collector.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: "Invalid email or password" 
      });
    }

    // Return collector info (without password)
    const { password: _, ...collectorData } = collector;
    res.json({
      success: true,
      message: "Login successful",
      collector: collectorData
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ 
      message: "Login failed" 
    });
  }
};

// ============ COLLECTOR PROFILE (GET/UPDATE) ============
exports.getProfile = async (req, res) => {
  try {
    const collectorId = req.collectorId;

    const [collectors] = await db.execute(
      `SELECT collector_id, full_name, email, gender, phone_number, home_address,
              collection_type, vehicle_photo, vehicle_number, latitude, longitude,
              status, created_at
       FROM Collectors
       WHERE collector_id = ?`,
      [collectorId]
    );

    if (collectors.length === 0) {
      return res.status(404).json({ message: "Collector not found" });
    }

    const collector = collectors[0];

    const [factoryRows] = await db.execute(
      `SELECT * FROM Factory_Details WHERE collector_id = ? LIMIT 1`,
      [collectorId]
    );

    const [govRows] = await db.execute(
      `SELECT * FROM Government_Details WHERE collector_id = ? LIMIT 1`,
      [collectorId]
    );

    res.json({
      collector,
      factory_details: factoryRows[0] || null,
      government_details: govRows[0] || null
    });
  } catch (err) {
    console.error("Get collector profile error:", err);
    res.status(500).json({ message: "Failed to load profile" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const collectorId = req.collectorId;
    const {
      full_name,
      phone_number,
      home_address,
      latitude,
      longitude
    } = req.body || {};

    if (!full_name || !full_name.trim()) {
      return res.status(400).json({ message: "Full name is required" });
    }
    if (!phone_number || !phone_number.trim()) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    const lat =
      latitude === "" || latitude === undefined || latitude === null
        ? null
        : parseFloat(latitude);
    const lng =
      longitude === "" || longitude === undefined || longitude === null
        ? null
        : parseFloat(longitude);

    if (lat !== null && Number.isNaN(lat)) {
      return res.status(400).json({ message: "Invalid latitude" });
    }
    if (lng !== null && Number.isNaN(lng)) {
      return res.status(400).json({ message: "Invalid longitude" });
    }

    const fields = [
      "full_name = ?",
      "phone_number = ?",
      "home_address = ?",
      "latitude = ?",
      "longitude = ?"
    ];
    const values = [
      full_name.trim(),
      phone_number.trim(),
      home_address || null,
      lat,
      lng
    ];

    if (req.file) {
      fields.push("vehicle_photo = ?");
      values.push(req.file.filename);
    }

    values.push(collectorId);

    const sql = `UPDATE Collectors SET ${fields.join(", ")} WHERE collector_id = ?`;
    await db.execute(sql, values);

    res.json({ success: true, message: "Profile updated" });
  } catch (err) {
    console.error("Update collector profile error:", err);
    res.status(500).json({ message: "Update failed" });
  }
};
