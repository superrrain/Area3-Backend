const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");

const app = express();
const db = new sqlite3.Database("./performa.db");
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || "rahasia";

app.use(cors());
app.use(bodyParser.json());

db.run(`CREATE TABLE IF NOT EXISTS performa (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cabang TEXT,
  logbook REAL,
  rapi REAL,
  cup REAL,
  disiplin REAL,
  expired REAL,
  komplain REAL,
  skor REAL,
  tanggal TEXT
)`);

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (username === "admin" && password === "admin123") {
    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: "8h" });
    res.json({ token });
  } else {
    res.status(401).json({ message: "Username atau password salah" });
  }
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

app.post("/input", authenticateToken, (req, res) => {
  const { cabang, logbook, rapi, cup, disiplin, expired, komplain } = req.body;
  const skor = (logbook + rapi + cup + disiplin + expired + komplain) / 6;
  const tanggal = new Date().toISOString().split("T")[0];

  db.run(
    `INSERT INTO performa (cabang, logbook, rapi, cup, disiplin, expired, komplain, skor, tanggal) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [cabang, logbook, rapi, cup, disiplin, expired, komplain, skor, tanggal],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Data berhasil disimpan", id: this.lastID });
    }
  );
});

app.get("/data", (req, res) => {
  db.all("SELECT * FROM performa", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
