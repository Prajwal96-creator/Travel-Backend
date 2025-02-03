const {Student} = require('../models/models'); // Assuming you renamed User to Student
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, passportNumber, emergencyContact } = req.body;

    let student = await Student.findOne({ email });
    if (student) return res.status(400).json({ message: "Student already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    student = new Student({ firstName, lastName, email, passportNumber, password: hashedPassword, emergencyContact });
    await student.save();

    res.status(201).json({ message: "Student registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const student = await Student.findOne({ email });
    if (!student) return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    const token = jwt.sign({ id: student._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.status(200).json({ token, student: { firstName: student.firstName, lastName: student.lastName, email: student.email } });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
