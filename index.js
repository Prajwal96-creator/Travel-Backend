// Import dependencies
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { connectDB } = require("./config/config");
require("dotenv").config();
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const tripRoutes = require('./routes/tripRoutes');
require('./services/cronJobs'); // Import cron jobs

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB();

// Serve static files from the uploads folder
// app.use("/uploads", express.static(path.join(__dirname, "./uploads")));

// Configure session middleware
// app.use(
// 	cookieSession({
// 		name: "session",
// 		keys: [process.env.SESSION_SECRET || "default_secret_key"], // Replace with a secure key
// 		maxAge: 24 * 60 * 60 * 1000, // Session expires in 24 hours
// 	})
// );
// app.use(express.json()); // Ensures Express can handle JSON request bodies

// app.use("/api/admin", adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/trips', tripRoutes);

// Testing Route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// app.use("/api/auth", require("./routes/userRoute"));

const PORT = process.env.PORT || 5000;



app.listen(PORT, () => {
  console.log(`Server is running on prajwal partil port ${PORT}`);
});

// app.use(errorController);


//https://ganesh.click