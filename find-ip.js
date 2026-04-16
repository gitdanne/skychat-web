const { networkInterfaces } = require('os');

const nets = networkInterfaces();
const results = {};

for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
        // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
        if (net.family === 'IPv4' && !net.internal) {
            if (!results[name]) {
                results[name] = [];
            }
            results[name].push(net.address);
        }
    }
}

console.log('\n--- ☁️ SkyChat Network Info ---');
console.log('Use one of these IP addresses to connect from your phone:');
console.log('-------------------------------------------------------');

let found = false;
for (const [name, ips] of Object.entries(results)) {
    ips.forEach(ip => {
        console.log(`📡 [${name}]: http://${ip}:3000`);
        found = true;
    });
}

if (!found) {
    console.log('❌ No external IP addresses found. Are you connected to Wi-Fi?');
}
console.log('-------------------------------------------------------');
console.log('Note: Both PC and Phone must be on the same Wi-Fi network!');
