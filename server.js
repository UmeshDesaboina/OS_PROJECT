import express from "express";
import http from "http";
import { Server } from "socket.io";
import os from "os";
import { exec } from "child_process";
import cors from "cors";
import fs from "fs";
import path from "path";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(express.static("public"));
app.use(cors());

let processes = new Map();
let deallocatedProcesses = [];

io.on("connection", (socket) => {
    console.log("Client connected");

    setInterval(async () => {
        const newProcesses = await getRunningProcesses();
        const newProcessMap = new Map(newProcesses.map(p => [p.pid, p]));

        processes.forEach((value, pid) => {
            if (!newProcessMap.has(pid)) {
                value.isDeallocated = true;
                deallocatedProcesses.push(value);
            }
        });

        processes = newProcessMap;

        socket.emit("processData", {
            running: Array.from(processes.values()),
            deallocated: deallocatedProcesses,
            totalMemory: os.totalmem(),
            usedMemory: os.totalmem() - os.freemem(),
            freeMemory: os.freemem(),
        });
    }, 3000);
});

async function getRunningProcesses() {
    return new Promise((resolve) => {
        exec('wmic process get Name,ProcessId,WorkingSetSize', (err, stdout) => {
            if (err) return resolve([]);

            const lines = stdout.split("\n").slice(1);
            const runningProcesses = lines.map(line => {
                const parts = line.trim().split(/\s+/);
                if (parts.length >= 3) {
                    return {
                        name: parts.slice(0, -2).join(" "),
                        pid: parseInt(parts[parts.length - 2]),
                        memory: parseInt(parts[parts.length - 1]) / (1024 * 1024), // Convert KB to MB
                        timestamp: new Date().toLocaleTimeString(),
                        isDeallocated: false
                    };
                }
            }).filter(Boolean);

            resolve(runningProcesses);
        });
    });
}

// CSV Download Route
app.get("/download", (req, res) => {
    const csvFilePath = path.join(process.cwd(), "process_data.csv");

    const headers = "Process Name,PID,Memory (MB),Timestamp,Status\n";
    const runningProcesses = Array.from(processes.values())
        .map(p => `${p.name},${p.pid},${p.memory.toFixed(2)},${p.timestamp},Running`)
        .join("\n");

    const deallocatedProcessesCSV = deallocatedProcesses
        .map(p => `${p.name},${p.pid},${p.memory.toFixed(2)},${p.timestamp},Deallocated`)
        .join("\n");

    const csvContent = headers + runningProcesses + "\n" + deallocatedProcessesCSV;
    fs.writeFileSync(csvFilePath, csvContent);

    res.download(csvFilePath, "process_data.csv", (err) => {
        if (err) {
            console.error("Error downloading CSV:", err);
            res.status(500).send("Error generating CSV file");
        }
    });
});

server.listen(8080, () => console.log("Server running on http://localhost:8080"));
