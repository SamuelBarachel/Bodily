const { spawn } = require("child_process");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");

async function main() {
  console.log("Building Expo web app...");

  await new Promise((resolve, reject) => {
    const proc = spawn(
      "pnpm",
      ["exec", "expo", "export", "--platform", "web", "--output-dir", "dist"],
      {
        cwd: projectRoot,
        stdio: "inherit",
        env: {
          ...process.env,
          NODE_ENV: "production",
        },
      },
    );
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`expo export exited with code ${code}`));
    });
    proc.on("error", reject);
  });

  console.log("Web build complete → dist/");
}

main().catch((err) => {
  console.error("Build failed:", err.message);
  process.exit(1);
});
