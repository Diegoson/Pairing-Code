
import PastebinAPI from 'pastebin-js';
import { makeid } from './id.js';
import express from 'express';
import fs from 'fs';
import pino from 'pino';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.static(path.join(__dirname, 'statics')));
app.get('/', (req, res) => {
    if (req.query.number) {
        return router.handle(req, res);
    }
    res.sendFile(path.join(__dirname, 'statics', 'pair.html'));
});
import { 
  makeWASocket,
    useMultiFileAuthState,
    delay,
    Browsers,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore 
} from "@whiskeysockets/baileys";
import { readFile } from "node:fs/promises";

const pastebin = new PastebinAPI('ypkqXUGgzysc_yLPTBaEZ_G3G-nvjEsh');
const router = express.Router();

function removeFile(FilePath) {
    if (!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, { recursive: true, force: true });
}

router.get('/', async (req, res) => {
    if (!req.query.number) {
        return res.status(400).send({ 
            code: "Bad Request",
            error: "Phone number is required" 
        });
    }
    const id = makeid();
    let num = req.query.number;

    async function Dani() {
        const { state, saveCreds } = await useMultiFileAuthState('./session/' + id);
        try {
            let session = makeWASocket({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({level: "fatal"}).child({level: "fatal"})),
                },
                printQRInTerminal: false,
                logger: pino({level: "fatal"}).child({level: "fatal"}),
                browser: Browsers.macOS("Safari"),
             });
            if (!session.authState.creds.registered) {
                await delay(1500);
                num = num.replace(/[^0-9]/g, '');
                const code = await session.requestPairingCode(num);
                if (!res.headersSent) {
                    await res.send({ code });
                }
            }
            session.ev.on('creds.update', saveCreds);

            session.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect } = s;

                if (connection == "open") {
                    await delay(10000);
                    let link = await pastebin.createPasteFromFile(__dirname+`/session/${id}/creds.json`, "pastebin-js test", null, 1, "N");
                    let data = link.replace("https://pastebin.com/", "");
                    let code = btoa(data);
                    var words = code.split("");
                    var ress = words[Math.floor(words.length / 2)];
                    let c = code.split(ress).join(ress + "_X_ASTRAL_");
                    await session.sendMessage(session.user.id, {text:`${c}`})
    
                    await delay(100);
                    await session.ws.close();
                    return await removeFile('./session/' + id);
                } else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode != 401) {
                    await delay(10000);
                    Dani();
                }
            });
        } catch (err) {
            console.log(err.message);
            await removeFile('./session/' + id);
            if (!res.headersSent) {
                await res.send({ 
                    code: "Service Unavailable",
                    error: err.message 
                });
            }
        }
    }

    return await Dani();
});

app.use('/', router);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
