
import { FangornAgent } from "./FangornAgent.js"
import readline from "readline/promises";

async function chatLoop(fangornAgent: FangornAgent) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    try {
      console.log("Began Chat Loop")
      console.log("Type your queries or '/bye' to exit.");

      while (true) {
        const message = await rl.question("\nQuery: ");
        if (message.toLowerCase() === "/bye") break;

        const response = await fangornAgent.invokeAgent(message);

        // Right now, we assume that once a response is received
        // then the LLM is done. However, once we add memory
        // this may not be the case and the model may
        // be needing more information from the user.
        fangornAgent.resetToolbay();
        console.log("\n" + response);
      }
    } finally {
      rl.close();
    }
  }

async function main() {
  const fangornAgent = await FangornAgent.create();
  console.log("\nFangorn Agent Created!");
  try {
    await chatLoop(fangornAgent);
  } catch (e) {
    console.error("Error:", e);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();
