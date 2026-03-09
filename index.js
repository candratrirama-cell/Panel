const express = require('express');
const fileUpload = require('express-fileupload');
const admZip = require('adm-zip');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const PASS = "190713"; // Password Akses

app.use(fileUpload());
app.use(express.json());
app.use(express.static('public'));

let botProcess = null;
let logs = "--- RaBot System Log ---\n";

// Middleware Keamanan
const auth = (req, res, next) => {
    const userPass = req.query.pass || req.body.pass;
    if (userPass !== PASS) return res.status(401).json({ error: "Akses Ditolak" });
    next();
};

app.post('/api/login', (req, res) => {
    if (req.body.password === PASS) res.json({ success: true });
    else res.json({ success: false });
});

app.get('/api/status', auth, (req, res) => {
    res.json({ running: !!botProcess, logs: logs });
});

app.post('/api/upload', auth, (req, res) => {
    if (!req.files || !req.files.botZip) return res.status(400).send("File tidak ada");
    const uploadPath = path.join(__dirname, 'bot_files');
    if (fs.existsSync(uploadPath)) fs.rmSync(uploadPath, { recursive: true, force: true });
    fs.mkdirSync(uploadPath);

    const tempZip = path.join(__dirname, 'temp.zip');
    req.files.botZip.mv(tempZip, (err) => {
        if (err) return res.status(500).send(err);
        const zip = new admZip(tempZip);
        zip.extractAllTo(uploadPath, true);
        fs.unlinkSync(tempZip);
        logs += "[SYSTEM] Bot Berhasil Diupdate.\n";
        res.send("Selesai!");
    });
});

app.post('/api/control', auth, (req, res) => {
    if (req.body.action === 'start') {
        if (botProcess) return res.send("Bot sudah jalan");
        botProcess = spawn('node', ['index.js'], { cwd: path.join(__dirname, 'bot_files'), shell: true });
        botProcess.stdout.on('data', (d) => { logs += d.toString(); });
        botProcess.stderr.on('data', (d) => { logs += d.toString(); });
        botProcess.on('close', () => { botProcess = null; logs += "[SYSTEM] Bot Mati.\n"; });
        res.send("Started");
    } else {
        if (botProcess) { botProcess.kill(); botProcess = null; }
        res.send("Stopped");
    }
});

app.listen(PORT, () => console.log("Server Active on Port " + PORT));
