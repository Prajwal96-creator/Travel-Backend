// Import dependencies
require("dotenv").config();
const mongoose = require("mongoose");

// Connect to MongoDB using environment variable directly
const connectDB = async () => {
	try {
		await mongoose.connect(process.env.DATABASE_CONNECTION_URL, {
			// useNewUrlParser: true,
			// useUnifiedTopology: true,
			family: 4,
		});
		console.log("Connected to MongoDB");
	} catch (error) {
		console.error("MongoDB connection error:", error);
		process.exit(1); // Exit process if the connection fails
	}
};

// Export the connectDB function
module.exports = {
	connectDB,
};