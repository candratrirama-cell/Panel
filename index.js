const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = require("@whiskeysockets/baileys");
const pino = require("pino");
const axios = require("axios");
const { Boom } = require("@hapi/boom");

const api_key = "nz-ba164a98eb";
const ownerNumber = "62882008519349";

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("session_rabot");
    const conn = makeWASocket({
        logger: pino({ level: "silent" }),
        auth: state,
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    conn.ev.on("creds.update", saveCreds);
    conn.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === "close") {
            if ((lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut) startBot();
        } else if (connection === "open") console.log("RaBot Connected!");
    });

    conn.ev.on("messages.upsert", async (chatUpdate) => {
        const m = chatUpdate.messages[0];
        if (!m.message || m.key.fromMe) return;
        const from = m.key.remoteJid;
        const body = (m.message.conversation || m.message.extendedTextMessage?.text || "").trim();
        const command = body.split(" ")[0].toLowerCase();
        const text = body.split(" ").slice(1).join(" ");

        if (command === ".brat") {
            const res = await axios.get(`https://api.naze.biz.id/create/brat?text=${encodeURIComponent(text)}&apikey=${api_key}`, { responseType: 'arraybuffer' });
            await conn.sendMessage(from, { sticker: res.data });
        }
        // Tambahkan case .ai, .iqc, dll di sini...
    });
}
startBot();
