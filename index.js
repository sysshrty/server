const express = require("express");
const app = express();
const Joi = require("joi");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path'); // Import the path module

app.use(express.static("public"));
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

// Multer setup for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'images/'); // Directory to store uploaded files
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // Filename for the uploaded file
    }
});
const upload = multer({ storage: storage });

const validateComment = (comment) => {
    const schema = Joi.object({
        firstName: Joi.string().min(3).required(),
        lastName: Joi.string().min(3).required(),
        email: Joi.string().min(3).required().email(),
        message: Joi.string().required(),
        date: Joi.date().iso().default(Date.now, 'current date') 
    });
    return schema.validate(comment);
};

mongoose.connect("mongodb+srv://sbegay:shryb101@final-project.jyx9hkv.mongodb.net/?retryWrites=true&w=majority&appName=Final-project")
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.log('Error connecting to MongoDB:', err));

// Schema & Model setup (Client's comment)
const commentSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: String,
    message: String,
    date: { type: Date, default: Date.now }
});
const Comment = mongoose.model("Comment", commentSchema);

//client comment submissions
app.post("/api/comments", async (req, res) => {
    try {
        const { error } = validateComment(req.body);
        if (error) return res.status(400).send(error.details[0].message);

        const existingComment = await Comment.findOne({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            message: req.body.message
        });
        if (existingComment) {
            return res.status(400).send("Duplicate comment detected.");
        }
        const { firstName, lastName, email, message } = req.body;
        const newComment = new Comment({
            firstName,
            lastName,
            email,
            message,
            date: Date.now()
        });
        const result = await newComment.save();
        const comments = await Comment.find(); 
        res.status(200).send(comments); 
    } catch (error) {
        console.error('Error saving comment:', error);
        res.status(500).send("Internal server error.");
    }
});


// Routes
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
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

app.listen(3000, () => {
    console.log("listening...");
});

