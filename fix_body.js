const fs = require('fs');
let content = fs.readFileSync('artifacts/mobile/app/(tabs)/body.tsx', 'utf8');

// The original file probably has double backslashes or something similar.
// Let's just manually replace the response: parts correctly.

content = content.replace(/response: [^,]+,/, "response: `Body part: ${selectedPart.slug}\\n\\nTranscript: ${transcript}\\n\\nSummary: ${res.summary}`,");
content = content.replace(/response: [^,]+,/g, function(match, p1, offset, string) {
    if (offset > 2000) {
        return "response: `Body part: ${selectedPart.slug}\\n\\nTranscript: ${transcript}`,";
    }
    return match;
});

// Since the first replace might not work due to regex, let's just write the entire function again.
