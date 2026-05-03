import { readFileSync, writeFileSync } from "fs";
import { tool } from "langchain";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

const dirName = dirname(fileURLToPath(import.meta.url));
const tasteMdRelativePath = "../../../../TASTE.md";
let hasReadTaste = false;

export const readTaste = tool(
  async () => {
    console.log("console.log - agent called readTaste tool");
    try {
      const content = readFileSync(
        resolve(dirName, tasteMdRelativePath),
        "utf-8",
      );
      console.log("CONTENT:");
      console.log(content);
      // hasReadTaste = true
      return JSON.stringify({
        status: 200,
        statusText: "OK",
        result: `What you know about the user's music taste: ${content}`,
      });
    } catch (e) {
      console.log(e);
    }
  },
  {
    name: "read_taste",
    description: "Learn about what the user likes.",
    schema: z.object(),
  },
);

export const readTasteForUpdate = tool(
  async ({ newTasteInfo }) => {
    console.log("console.log - agent called readTasteForUpdate tool");
    console.log("");
    if (newTasteInfo.includes("read_taste_for_update")) {
      return "This is not new taste info";
    }
    try {
      const content = readFileSync(
        resolve(dirName, tasteMdRelativePath),
        "utf-8",
      );
      console.log("CONTENT:");
      console.log(content);
      hasReadTaste = true;
      return JSON.stringify({
        status: 200,
        statusText: "OK",
        result: `Summarize the following: ${content} ${newTasteInfo}`,
      });
    } catch (e) {
      console.log(e);
    }
  },
  {
    name: "read_taste_for_update",
    description: "Learn about what the user likes.",
    schema: z.object({
      newTasteInfo: z
        .string()
        .describe(
          "The new information you received regarding the user's taste.",
        ),
    }),
  },
);

export const updateTaste = tool(
  async ({ newTasteSummary }) => {
    console.log("console.log - agent called updateTaste tool");
    console.log(newTasteSummary);
    console.log(JSON.stringify(newTasteSummary));
    console.log("Has read taste: ", hasReadTaste);
    if (hasReadTaste) {
      console.log(
        "Returning: Re-plan where you use the read_taste_for_update tool first",
      );
      return JSON.stringify({
        status: 422,
        statusText: "Unprocessable Content",
        result:
          "Your call was well formed, but you need to use the read_taste_for_update tool first.",
      });
    }
    try {
      writeFileSync(
        resolve(dirName, tasteMdRelativePath),
        JSON.stringify(newTasteSummary),
        "utf-8",
      );
      const content = readFileSync(
        resolve(dirName, tasteMdRelativePath),
        "utf-8",
      );
      console.log("new taste summary: ", content);
      hasReadTaste = false;
      return JSON.stringify({
        status: 200,
        statusText: "OK",
        result: "Taste updated successfully.",
      });
    } catch (e) {
      console.log(e);
    }
  },
  {
    name: "update_taste",
    description: "Update what you know about the user's taste.",
    schema: z.object({
      newTasteSummary: z
        .string()
        .describe("The summary you've created about the user's taste."),
    }),
  },
);