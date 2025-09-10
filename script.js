// Subnetting Calculator JavaScript
// Author: Your Name
// Description: VLSM subnet calculator with growth planning

const addHostBtn = document.getElementById("addHost");
const hostsContainer = document.getElementById("hostsContainer");

// Add event listener for adding new host requirements
addHostBtn.addEventListener("click", () => {
    const div = document.createElement("div");
    div.className = "input-group mb-2";
    div.innerHTML = `
        <input type="text" class="form-control hostName" placeholder="Role (e.g. Sales)" required>
        <input type="number" class="form-control hostInput" placeholder="Hosts (e.g. 10)" required>
        <input type="number" class="form-control growthInput" placeholder="Growth % (optional)">
        <button class="btn btn-danger removeHost" type="button">Remove</button>
    `;
    hostsContainer.appendChild(div);

    // Add remove functionality to new row
    div.querySelector(".removeHost").addEventListener("click", () => div.remove());
});

// Main calculation function
document.getElementById("subnetForm").addEventListener("submit", function(e) {
    e.preventDefault();

    try {
        // Get and validate network block
        const networkBlock = document.getElementById("networkBlock").value.trim();
        if (!validateNetworkBlock(networkBlock)) {
            throw new Error("Invalid network block format. Please use CIDR notation (e.g., 192.168.1.0/24)");
        }

        // Parse network block
        const [baseIp, prefixStr] = networkBlock.split("/");
        const prefix = parseInt(prefixStr);
        let baseParts = baseIp.split(".").map(x => parseInt(x));
        let base = (baseParts[0] << 24) + (baseParts[1] << 16) + (baseParts[2] << 8) + baseParts[3];

        // Calculate network boundaries
        const subnetMask = (0xFFFFFFFF << (32 - prefix)) >>> 0;
        const networkAddress = (base & subnetMask) >>> 0;
        const broadcastAddress = (networkAddress | (0xFFFFFFFF >>> prefix)) >>> 0;
        const totalAvailableHosts = Math.pow(2, 32 - prefix) - 2;

        // Collect and process host requirements
        let hostEntries = Array.from(document.querySelectorAll(".input-group"))
            .map(group => {
                const name = group.querySelector(".hostName").value.trim();
                const hosts = parseInt(group.querySelector(".hostInput").value);
                const growthField = group.querySelector(".growthInput").value;
                const growth = growthField ? parseInt(growthField) : 0;

                if (!name || !hosts || hosts <= 0) {
                    return null; // Skip invalid entries
                }

                let adjusted = hosts;
                let future = null;

                // Calculate growth if specified
                if (growth > 0) {
                    const grown = hosts * (1 + growth / 100);
                    adjusted = Math.ceil(grown);
                    future = adjusted;
                }

                return {
                    name,
                    hosts,
                    growth,
                    adjusted,
                    future
                };
            })
            .filter(entry => entry !== null) // Remove invalid entries
            .sort((a, b) => b.adjusted - a.adjusted); // Sort by host count (largest first)

        if (hostEntries.length === 0) {
            throw new Error("Please add at least one valid host requirement.");
        }

        // Check if total hosts needed exceeds available space
        const totalHostsNeeded = hostEntries.reduce((sum, entry) => sum + entry.adjusted, 0);
        if (totalHostsNeeded > totalAvailableHosts) {
            throw new Error(`Total hosts needed (${totalHostsNeeded}) exceeds available hosts (${totalAvailableHosts}) in the network ${networkBlock}.`);
        }

        // Generate subnet allocation table
        generateSubnetTable(hostEntries, base);

    } catch (error) {
        // Display error message
        document.getElementById("results").innerHTML = `
            <div class="alert alert-danger" role="alert">
                <strong>Error:</strong> ${error.message}
            </div>
        `;
    }
});

/**
 * Validates network block format (CIDR notation)
 * @param {string} networkBlock - Network in CIDR format
 * @returns {boolean} - True if valid, false otherwise
 */
function validateNetworkBlock(networkBlock) {
    // Check basic CIDR format
    const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
    if (!cidrRegex.test(networkBlock)) {
        return false;
    }

    const [ip, prefix] = networkBlock.split("/");
    const prefixNum = parseInt(prefix);

    // Validate prefix length
    if (prefixNum < 8 || prefixNum > 32) {
        return false;
    }

    // Validate IP octets
    const parts = ip.split(".").map(x => parseInt(x));
    return parts.every(part => part >= 0 && part <= 255);
}

/**
 * Generates and displays the subnet allocation table
 * @param {Array} hostEntries - Array of host requirements
 * @param {number} base - Base network address as integer
 */
function generateSubnetTable(hostEntries, base) {
    let tableHTML = `
        <div class="table-responsive">
            <table class="table table-bordered table-striped">
                <thead class="table-dark">
                    <tr>
                        <th>Role</th>
                        <th>Prefix</th>
                        <th>Network Address</th>
                        <th>Broadcast Address</th>
                        <th>Valid Host Range</th>
                        <th># Spare IPs</th>
                    </tr>
                </thead>
                <tbody>
    `;

    let currentBase = base;

    for (let entry of hostEntries) {
        const hostsNeeded = entry.adjusted;
        
        // Calculate required bits for this subnet
        let bits = 0;
        while (Math.pow(2, bits) - 2 < hostsNeeded && bits < 32) {
            bits++;
        }

        const blockSize = Math.pow(2, bits);
        const newPrefix = 32 - bits;

        // Calculate usable hosts (handle special cases)
        let usableHosts;
        if (newPrefix === 31) {
            usableHosts = 2; // Point-to-point link (RFC 3021)
        } else if (newPrefix === 32) {
            usableHosts = 1; // Host route
        } else {
            usableHosts = blockSize - 2; // Normal subnet (subtract network & broadcast)
        }

        // Calculate addresses
        const networkAddr = intToIp(currentBase);
        const broadcastAddr = intToIp(currentBase + blockSize - 1);
        const firstHost = intToIp(currentBase + (newPrefix >= 31 ? 0 : 1));
        const lastHost = intToIp(currentBase + blockSize - (newPrefix === 32 ? 1 : newPrefix === 31 ? 1 : 2));
        const spare = usableHosts - hostsNeeded;

        // Format role label with growth information
        let roleLabel;
        if (entry.growth > 0) {
            roleLabel = `${entry.name} (${entry.hosts} → ${entry.future} with ${entry.growth}% growth)`;
        } else {
            roleLabel = `${entry.name} (${entry.hosts})`;
        }

        // Add row to table
        tableHTML += `
            <tr>
                <td>${roleLabel}</td>
                <td><code>/${newPrefix}</code></td>
                <td><code>${networkAddr}</code></td>
                <td><code>${broadcastAddr}</code></td>
                <td><code>${firstHost} - ${lastHost}</code></td>
                <td><span class="text-${spare > 10 ? 'success' : spare > 0 ? 'warning' : 'danger'}">${usableHosts} - ${hostsNeeded} = ${spare}</span></td>
            </tr>
        `;

        // Move to next subnet
        currentBase += blockSize;
    }

    tableHTML += `
                </tbody>
            </table>
        </div>
        
        <div class="mt-3">
            <small class="text-muted">
                <strong>Note:</strong> Subnets are allocated using VLSM (Variable Length Subnet Masking) 
                with largest requirements first for optimal address space utilization.
            </small>
        </div>
    `;

    document.getElementById("results").innerHTML = tableHTML;
}

/**
 * Converts integer IP address to dotted decimal notation
 * @param {number} int - IP address as 32-bit integer
 * @returns {string} - IP address in dotted decimal format
 */
function intToIp(int) {
    return ((int >>> 24) & 255) + "." + 
           ((int >>> 16) & 255) + "." + 
           ((int >>> 8) & 255) + "." + 
           (int & 255);
}

// Initialize remove functionality for the first row
document.addEventListener('DOMContentLoaded', function() {
    const initialRemoveBtn = document.querySelector(".removeHost");
    if (initialRemoveBtn) {
        initialRemoveBtn.addEventListener("click", function() {
            // Don't remove if it's the only row
            const inputGroups = document.querySelectorAll(".input-group");
            if (inputGroups.length > 1) {
                this.closest('.input-group').remove();
            } else {
                alert("At least one host requirement is needed.");
            }
        });
    }
});
