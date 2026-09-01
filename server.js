const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

const USERS_FILE = path.join(__dirname, "data", "users.json");
const UPLOADS_DIR = path.join(__dirname, "uploads");

// Make sure folders/files exist
fs.mkdirSync(path.dirname(USERS_FILE), { recursive: true });
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, "[]");
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
    session({
        secret: "CHANGE-THIS-TO-A-LONG-RANDOM-SECRET",
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 7
        }
    })
);

app.use(express.static(path.join(__dirname, "public")));

function getUsers() {
    return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
}

function saveUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function requireLogin(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({
            error: "You must be logged in."
        });
    }

    next();
}

// LOGIN
app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            error: "Username and password are required."
        });
    }

    const users = getUsers();

    const user = users.find(
        u => u.username.toLowerCase() === username.toLowerCase()
    );

    if (!user) {
        return res.status(401).json({
            error: "Invalid username or password."
        });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
        return res.status(401).json({
            error: "Invalid username or password."
        });
    }

    req.session.user = user.username;

    res.json({
        success: true,
        username: user.username
    });
});

// LOGOUT
app.post("/api/logout", (req, res) => {
    req.session.destroy(() => {
        res.json({ success: true });
    });
});

// CURRENT USER
app.get("/api/me", requireLogin, (req, res) => {
    res.json({
        username: req.session.user
    });
});

// FILE UPLOAD
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const username = req.session.user;

        const userFolder = path.join(UPLOADS_DIR, username);

        fs.mkdirSync(userFolder, { recursive: true });

        cb(null, userFolder);
    },

    filename: (req, file, cb) => {
        const uniqueName =
            Date.now() + "-" + file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");

        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 500 * 1024 * 1024
    }
});

app.post(
    "/api/upload",
    requireLogin,
    upload.single("media"),
    (req, res) => {
        res.json({
            success: true,
            filename: req.file.filename
        });
    }
);

// GET USER'S MEDIA
app.get("/api/media", requireLogin, (req, res) => {
    const userFolder = path.join(
        UPLOADS_DIR,
        req.session.user
    );

    if (!fs.existsSync(userFolder)) {
        return res.json([]);
    }

    const files = fs.readdirSync(userFolder);

    res.json(files);
});

// SERVE USER MEDIA
app.get("/media/:username/:filename", requireLogin, (req, res) => {
    if (req.params.username !== req.session.user) {
        return res.status(403).send("Forbidden");
    }

    const filePath = path.join(
        UPLOADS_DIR,
        req.params.username,
        req.params.filename
    );

    if (!fs.existsSync(filePath)) {
        return res.status(404).send("File not found");
    }

    res.sendFile(filePath);
});

// START SERVER
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Media server running on port ${PORT}`);
});
