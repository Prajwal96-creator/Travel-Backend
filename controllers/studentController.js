const {Student} = require('../models/models');

// Get logged-in student's profile
exports.getProfile = async (req, res) => {
  try {
    const student = await Student.findById(req.student.id).select('-password');
    if (!student) return res.status(404).json({ message: "Student not found" });

    res.status(200).json(student);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update student profile
exports.updateProfile = async (req, res) => {
  try {
    const updates = req.body; // Allow dynamic updates from request body

    // Ensure email is not updated (optional security measure)
    if (updates.email) {
      return res.status(400).json({ message: "Email update is not allowed" });
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      req.student.id,
      updates,  // Apply all provided fields dynamically
      { new: true, runValidators: true }
    ).select('-password'); // Exclude password from response

    if (!updatedStudent) return res.status(404).json({ message: "Student not found" });

    res.status(200).json(updatedStudent);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// Add/Update emergency contact information
exports.updateEmergencyContact = async (req, res) => {
  try {
    const { name, relationship, email, phone } = req.body;

    const updatedStudent = await Student.findByIdAndUpdate(
      req.student.id,
      { emergencyContact: { name, relationship, email, phone } },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedStudent) return res.status(404).json({ message: "Student not found" });

    res.status(200).json(updatedStudent.emergencyContact);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
