const fs = require('fs');
let code = fs.readFileSync('artifacts/mobile/app/(tabs)/body.tsx', 'utf8');
code = code.replace(/\\\`/g, '`');
fs.writeFileSync('artifacts/mobile/app/(tabs)/body.tsx', code);
