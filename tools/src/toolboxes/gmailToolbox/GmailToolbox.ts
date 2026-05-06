import { DynamicStructuredTool, tool } from "langchain";
import {
  FangornAgentToolConfig,
  GmailToolConfig,
  Toolbox,
} from "agent-types";
import { z } from "zod";
import { google } from "googleapis";
import { encodeEmail } from "./utils.js";
import { getToolsByName } from "../utils.js";

export class GmailToolbox implements Toolbox {
  public name = "gmail_toolbox";

  private gmailClient;

  private agentSignoff;

  static async init(config: FangornAgentToolConfig): Promise<GmailToolbox> {
    return new GmailToolbox(config.gmailConfig);
  }

  constructor(gmailToolConfig: GmailToolConfig) {
    const auth = new google.auth.OAuth2(
      gmailToolConfig.gmailClientId,
      gmailToolConfig.gmailClientSecret,
      gmailToolConfig.gmailRefreshToken,
    );

    auth.setCredentials({ refresh_token: gmailToolConfig.gmailRefreshToken });
    this.agentSignoff = gmailToolConfig.agentSignoff;

    this.gmailClient = google.gmail({ version: "v1", auth });
  }

  getToolsByName(toolNames: string[]): Map<String, DynamicStructuredTool> {
    const matchingToolMap = getToolsByName(this.getTools(), toolNames);
    return matchingToolMap;
  }

  getTools(): DynamicStructuredTool[] {
    const sendEmail = tool(
      async ({ recipient, subject, message }) => {
        console.log("console.log - agent called fangornAgentToolboxTool tool");

        const res = await this.gmailClient.users.messages.send({
          userId: "me",
          requestBody: {
            raw: encodeEmail(recipient, subject, message, this.agentSignoff),
          },
        });

        console.log(`res: ${JSON.stringify(res, null, 2)}`);

        return JSON.stringify({
          status: 200,
          statusText: "OK",
          result:
            "The email has been sent successfully! Please notify the user.",
        });
      },
      {
        name: "send_email",
        description:
          "Send an email to a specific email address with a message and subject",
        schema: z.object({
          recipient: z.string().describe("Who to send the email to"),
          subject: z
            .string()
            .describe(
              "The subject of the email. If no subject is provided, create your own.",
            ),
          message: z
            .string()
            .describe("The message to be sent to the recipient."),
        }),
      },
    );

    return [sendEmail];
  }

  public getToolboxAsTool(): DynamicStructuredTool {
    const gmailToolboxTool = tool(
      async () => {
        console.log("console.log - agent called gmailToolboxTool tool");

        return JSON.stringify({
          status: 200,
          statusText: "OK",
          result:
            "Gmail tools are now available. You now have access to: send_email. Re-plan and use them to complete the task.",
        });
      },
      {
        name: this.name,
        description:
          "Access email tools for sending emails. Call this first before attempting any email related tasks.",
        schema: z.object({}),
      },
    );
    return gmailToolboxTool;
  }
}
