import psList from "ps-list";

async function checkProcesses() {
    try {
        const processes = await psList();
        console.log(processes.slice(0, 10)); // Print first 10 processes
    } catch (error) {
        console.error("Error fetching processes:", error.message);
    }
}

checkProcesses();
