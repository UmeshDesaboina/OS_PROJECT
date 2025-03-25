const ctxPie = document.getElementById('memoryPieChart').getContext('2d');
const ctxBar = document.getElementById('memoryBarGraph').getContext('2d');

let memoryPieChart = new Chart(ctxPie, {
    type: 'pie',
    data: { labels: ["Used", "Free"], datasets: [{ data: [0, 100], backgroundColor: ['#FF6384', '#36A2EB'] }] },
});

let memoryBarGraph = new Chart(ctxBar, {
    type: 'bar',
    data: { labels: [], datasets: [{ label: "Memory Usage (MB)", data: [], backgroundColor: '#36A2EB' }] },
});

function updateCharts(processes) {
    let usedMemory = processes.reduce((sum, p) => sum + p.memory, 0);
    let freeMemory = 1000 - usedMemory;

    memoryPieChart.data.datasets[0].data = [usedMemory, freeMemory];
    memoryPieChart.update();

    memoryBarGraph.data.labels = processes.map(p => p.name);
    memoryBarGraph.data.datasets[0].data = processes.map(p => p.memory);
    memoryBarGraph.update();
}
