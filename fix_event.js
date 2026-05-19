const fs = require('fs');
let code = fs.readFileSync('artifacts/mobile/app/(tabs)/body.tsx', 'utf8');

code = code.replace(
  /event\.results\[0\]\?\.alternatives\[0\]\?\.transcript/,
  'event.results[0]?.transcript'
);

fs.writeFileSync('artifacts/mobile/app/(tabs)/body.tsx', code);
