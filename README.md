# Subnetting Calculator

A simple, efficient web-based subnet calculator that helps network administrators and students calculate optimal subnet allocation using VLSM (Variable Length Subnet Masking).

## Features

- **VLSM Subnetting**: Automatically calculates optimal subnet sizes based on host requirements
- **Growth Planning**: Optional growth percentage to plan for future expansion
- **Multiple Requirements**: Add unlimited department/role requirements
- **Complete Subnet Information**: Shows network address, broadcast address, host range, and spare IPs
- **Largest First Allocation**: Automatically sorts by host count for optimal address space utilization
- **Special Subnet Support**: Handles /31 (point-to-point) and /32 (host route) subnets correctly

## How to Use

### 1. Enter Network Block
Enter your base network in CIDR notation:
- `192.168.1.0/24`
- `10.0.0.0/16` 
- `172.16.0.0/20`

### 2. Add Host Requirements
For each subnet you need:
- **Role/Department**: Descriptive name (e.g., "Sales Team", "Server VLAN")
- **Hosts**: Number of hosts needed
- **Growth %**: Optional percentage for future growth

### 3. Calculate
Click "Calculate Subnets" to see the optimal allocation table.

## Example

**Input:**
- Network: `192.168.1.0/24`
- Sales Team: 50 hosts, 20% growth
- IT Department: 25 hosts
- Management: 10 hosts

**Output:**
```
Sales Team (50 → 60 with 20% growth)  /26  192.168.1.0    192.168.1.63   192.168.1.1-192.168.1.62    62-60=2
IT Department (25)                     /27  192.168.1.64   192.168.1.95   192.168.1.65-192.168.1.94   30-25=5  
Management (10)                        /28  192.168.1.96   192.168.1.111  192.168.1.97-192.168.1.110  14-10=4
```

## Technical Details

### Subnet Allocation Method
- Uses **VLSM (Variable Length Subnet Masking)** for efficient IP address utilization
- Sorts requirements by host count (largest first) for optimal allocation
- Calculates minimum required bits: `while (2^bits - 2 < hosts_needed) bits++`
- Special handling for /31 and /32 subnets per RFC standards

### Growth Calculation
- Formula: `adjusted_hosts = ceil(original_hosts * (1 + growth_percentage/100))`
- Example: 50 hosts + 20% growth = ceil(50 * 1.2) = 60 hosts

### Supported Subnet Ranges
- **Minimum**: /8 (16,777,214 hosts)
- **Maximum**: /32 (1 host - host route)
- **Special Cases**:
  - /31: 2 hosts (point-to-point links, RFC 3021)
  - /32: 1 host (host routes, loopbacks)

## File Structure

```
subnetting-calculator/
├── index.html          # Main HTML file
├── README.md           # This file
└── assets/
    └── screenshots/    # Example screenshots
```

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support  
- Safari: Full support
- Internet Explorer: Not supported (uses modern JavaScript)

## Use Cases

### Network Administration
- Corporate network design
- VLAN planning
- IP address space optimization
- Network documentation

### Education
- Networking courses (CCNA, Network+)
- Subnetting practice and verification
- Understanding VLSM concepts

### Planning & Design
- Network capacity planning
- Merger/acquisition network integration
- Data center IP allocation

## Mathematical Background

### VLSM Principles
1. **Largest First**: Allocate largest subnets first to minimize waste
2. **Power of Two**: All subnet sizes are powers of 2
3. **Contiguous Allocation**: Subnets are allocated in order without gaps

### Calculation Formula
```
Required Bits = ceil(log2(hosts_needed + 2))
Subnet Size = 2^Required_Bits  
New Prefix = 32 - Required_Bits
Usable Hosts = Subnet_Size - 2  (except /31 and /32)
```

## Limitations

- Requires CIDR notation input (no automatic subnet detection)
- No support for discontiguous subnets
- No IPv6 support (IPv4 only)
- No subnet mask validation beyond basic format checking

## Contributing

Feel free to submit issues, feature requests, or pull requests. Areas for improvement:

- Input validation enhancements
- IPv6 support
- Export functionality (CSV, JSON)
- Visual network diagrams
- Subnet mask format support (255.255.255.0)

## License

MIT License - feel free to use, modify, and distribute.

## Educational Resources

### Learn More About Subnetting:
- [RFC 950 - Internet Standard Subnetting Procedure](https://tools.ietf.org/html/rfc950)
- [RFC 3021 - Using 31-Bit Prefixes on IPv4 Point-to-Point Links](https://tools.ietf.org/html/rfc3021)
- [Cisco VLSM Documentation](https://www.cisco.com/c/en/us/support/docs/ip/routing-information-protocol-rip/13788-3.html)

### Common Subnet Reference:
| Prefix | Subnet Mask     | Hosts  | Use Case           |
|--------|----------------|--------|--------------------|
| /24    | 255.255.255.0  | 254    | Small networks     |
| /25    | 255.255.255.128| 126    | Medium departments |
| /26    | 255.255.255.192| 62     | Small departments  |
| /27    | 255.255.255.224| 30     | Server subnets     |
| /28    | 255.255.255.240| 14     | Management networks|
| /30    | 255.255.255.252| 2      | Legacy P2P links   |
| /31    | 255.255.255.254| 2      | Modern P2P links   |
| /32    | 255.255.255.255| 1      | Host routes        |