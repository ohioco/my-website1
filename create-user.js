const bcrypt = require("bcrypt");
const fs = require("fs");

const username = process.argv[2];
const password = process.argv[3];

if (!username || !password) {
    console.log("Usage: node create-user.js username password");
    process.exit();
}

const file = "data/users.json";

let users = [];

if (fs.existsSync(file)) {
    users = JSON.parse(fs.readFileSync(file, "utf8"));
}

const hashedPassword = await bcrypt.hash(password, 12);

users.push({
    username,
    password: hashedPassword
});

fs.writeFileSync(file, JSON.stringify(users, null, 2));

console.log(`Created user: ${username}`);
