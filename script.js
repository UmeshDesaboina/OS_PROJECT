const socket = io();
let memoryPieChart, memoryBarChart, memoryLineChart;
let processHistory = [];
let currentData = { running: [], deallocated: [] };

socket.on("processData", (data) => {
    currentData = data;
    processHistory.push({ time: new Date().toLocaleTimeString(), used: data.usedMemory });

    updateCharts();
    updateTable();
});

function updateCharts() {
    if (memoryPieChart) memoryPieChart.destroy();
    if (memoryBarChart) memoryBarChart.destroy();
    if (memoryLineChart) memoryLineChart.destroy();

    memoryPieChart = new Chart(document.getElementById("memoryPieChart"), {
        type: "pie",
        data: {
            labels: ["Used Memory", "Free Memory"],
            datasets: [{
                data: [currentData.usedMemory, currentData.freeMemory],
                backgroundColor: ["#ff6384", "#36a2eb"]
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    memoryBarChart = new Chart(document.getElementById("memoryBarChart"), {
        type: "bar",
        data: {
            labels: currentData.running.map(p => p.name),
            datasets: [{
                label: "Memory Usage (MB)",
                data: currentData.running.map(p => p.memory),
                backgroundColor: "#ffcc00"
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    memoryLineChart = new Chart(document.getElementById("memoryLineChart"), {
        type: "line",
        data: {
            labels: processHistory.map(p => p.time),
            datasets: [{
                label: "Memory Allocation Over Time",
                data: processHistory.map(p => p.used),
                borderColor: "#00ffcc",
                fill: false
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function updateTable() {
    const table = document.getElementById("processTable");
    table.innerHTML = "";

    let filter = document.getElementById("filterDropdown").value;
    let search = document.getElementById("searchInput").value.toLowerCase();

    let filteredProcesses = [...currentData.running, ...currentData.deallocated].filter(p => {
        if (filter === "running" && p.isDeallocated) return false;
        if (filter === "deallocated" && !p.isDeallocated) return false;
        if (filter === "all") return false; // Hide all processes
        if (search && !p.name.toLowerCase().includes(search) && !p.pid.toString().includes(search)) return false;
        return true;
    });

    filteredProcesses.forEach((process, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${process.name}</td>
            <td>${process.pid}</td>
            <td>${process.memory.toFixed(2)} MB</td>
            <td>${process.isDeallocated ? "Deallocated" : "Running"}</td>
            <td>${process.timestamp}</td>
        `;
        table.appendChild(row);
    });
}

document.getElementById("filterDropdown").addEventListener("change", updateTable);
document.getElementById("searchInput").addEventListener("input", updateTable);

// CSV Download Function
function downloadCSV() {
    window.location.href = "http://localhost:8080/download";
}
