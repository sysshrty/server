const express = require("express");
const app = express();
const Joi = require("joi");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');

const port = 3000;

app.use(express.static("public"));
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

// Multer setup for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Directory to store uploaded files
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // Filename for the uploaded file
    }
});
const upload = multer({ storage: storage });

// MongoDB connection setup
mongoose.connect("mongodb+srv://sbegay:shryb101@final-project.jyx9hkv.mongodb.net/?retryWrites=true&w=majority&appName=Final-project")
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.log('Error connecting to MongoDB:', err));

// schema & Model setup (Client's comment)
const commentSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: String,
    message: String,
    date: { type: Date, default: Date.now }
});
const Comment = mongoose.model("Comment", commentSchema);

// handle client comment submissions
app.post("/api/comments", async (req, res) => {
    const { firstName, lastName, email, message } = req.body;
    const newComment = new Comment({
        firstName,
        lastName,
        email,
        message,
        date: Date.now() // Adding the current date when creating a new comment
    });
    try {
        const result = await newComment.save();
        const comments = await Comment.find(); // Retrieve all comments after adding the new one
        res.status(200).send(comments); // Return all comments
    } catch (error) {
        console.error('Error saving comment:', error);
        res.status(400).send("Internal server error.");
    }
});

const validateComment = (comment) => {
    const schema = Joi.object({
        firstName: Joi.string().min(3).required(),
        lastName: Joi.string().min(3).required(),
        email: Joi.string().min(3).required().email(),
        message: Joi.string().required(),
        date: Joi.date().iso().default(Date.now, 'current date') 
    });
    return schema.validate(comment);
}

// script.js from the public directory
app.use(express.static(path.join(__dirname, '../sysshrty.github.io/final-project2/public')));

// index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, '../sysshrty.github.io/final-project2/public/index.html'));
});



// Get all comments
app.get("/api/comments", async (req, res) => {
    try {
        const comments = await Comment.find();
        res.send(comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).send("Error fetching comments.");
    }
});
const submitEvent = (e) => {
    e.preventDefault();
  
    const form = document.getElementById("my-form");
    const firstName = form.elements["txt-first-name"].value;
    const lastName = form.elements["txt-last-name"].value;
    const date = form.elements["time-date"].value;
    const theme = form.elements["type-theme"].value;
    const address = form.elements["address"].value;
    const guest = form.elements["quantity"].value;
    const email = form.elements["email"].value;
  
    // Retrieve the uploaded image file
    const imageFile = document.getElementById("image-upload").files[0];
  
    // Create a FormData object to send both form data and image file
    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("first-name", firstName);
    formData.append("last-name", lastName);
    formData.append("date", date);
    formData.append("theme", theme);
    formData.append("address", address);
    formData.append("quantity", guest);
    formData.append("email", email);
  
    // Make a fetch request to your backend, sending formData
    fetch("/api/bookings", {
      method: "POST",
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      // Handle success response
      console.log("Booking created:", data);
      // Display success message or handle redirection
    })
    .catch(error => {
      // Handle error
      console.error("Error creating booking:", error);
      // Display error message to the user
    });
  };
  app.post("/api/bookings", upload.single("image"), async (req, res) => {
    try {
      // Validate booking data
      const { error } = validateBooking(req.body);
      if (error) return res.status(400).send(error.details[0].message);
  
      // Check if image file exists
      if (!req.file) return res.status(400).send("No Image File Found");
  
      // Create a new booking document
      const booking = new Booking({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        date: req.body.date,
        theme: req.body.theme,
        address: req.body.address,
        guest: req.body.guest,
        email: req.body.email,
        image: req.file.filename // Save image filename to database
      });
  
      // Save the booking to the database
      await booking.save();
  
      res.send(booking);
    } catch (error) {
      res.status(500).send("Internal server error");
    }
  });

app.listen(3000, () => {
	console.log("listening...");
});