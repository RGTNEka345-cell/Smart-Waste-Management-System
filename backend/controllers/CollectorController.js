const bcrypt = require("bcryptjs");
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

    // If nested details were sent as JSON strings (from frontend FormData), parse them
    let parsedFactory = factory_details;
    let parsedGovernment = government_details;
    try {
      if (typeof factory_details === 'string' && factory_details) parsedFactory = JSON.parse(factory_details);
    } catch (e) {
      console.warn('Failed to parse factory_details JSON:', e.message);
    }
    try {
      if (typeof government_details === 'string' && government_details) parsedGovernment = JSON.parse(government_details);
    } catch (e) {
      console.warn('Failed to parse government_details JSON:', e.message);
    }
    if (!req.file) {
      return res.status(400).json({ message: "Vehicle image required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const collectorId = await Collector.createCollector([
      full_name,
      email,
      gender,
      hashedPassword,
      phone_number,
      home_address,
      collection_type,
      req.file.filename,
      vehicle_number
    ]);

    if (collection_type === "factory" && parsedFactory) {
      await Factory.createFactory([
        collectorId,
        parsedFactory.factory_name,
        parsedFactory.factory_licence_no,
        parsedFactory.operating_hours,
        JSON.stringify(parsedFactory.waste_types_accepted),
        parsedFactory.factory_address,
        parsedFactory.factory_contact,
        parsedFactory.factory_latitude,
        parsedFactory.factory_longitude
      ]);
    }

    if (collection_type === "government" && parsedGovernment) {
      await Government.createGovernment([
        collectorId,
        parsedGovernment.service_number,
        parsedGovernment.department_name,
        parsedGovernment.working_area_name,
        parsedGovernment.working_area_latitude,
        parsedGovernment.working_area_longitude,
        parsedGovernment.designation
      ]);
    }

    res.status(201).json({
      message: "Collector registered successfully. Await admin approval."
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ---------------- LOGIN COLLECTOR ---------------- */
exports.loginCollector = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    // Get collector from database
    const db = require("../config/database");
    const [[collector]] = await db.execute(
      "SELECT * FROM Collectors WHERE email = ?",
      [email]
    );

    if (!collector) {
      return res.status(401).json({ message: "Invalid email or password" });
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
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Return collector info (without password)
    const { password: _, ...collectorData } = collector;
    res.json({
      message: "Login successful",
      collector: collectorData
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
};
