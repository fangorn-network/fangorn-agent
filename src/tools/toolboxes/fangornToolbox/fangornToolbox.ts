import { DynamicStructuredTool, tool } from "@langchain/core/tools";
import { z } from "zod";
import { Hex } from "viem";
import { FangornX402Middleware } from "@fangorn-network/fetch";
import fs from "fs";
import { Toolbox } from "../../types.js";
import { fangornMiddlewareConfig, fangornToolboxConfig } from "../../../config.js";

export class FangornToolbox implements Toolbox {
    
  private fangornClient: FangornX402Middleware;
  public name: string = "fangorn_toolbox";

	dataContextProvider: (() => any) | null = null;

  static async init(): Promise<FangornToolbox> {

    const fangornClient = await FangornX402Middleware.create(
        fangornMiddlewareConfig
    )

    return new FangornToolbox(fangornClient);
  }

  constructor(fangornClient: FangornX402Middleware) {
    this.fangornClient = fangornClient;
  }

	public setDataContextProvider(dataContextProvider: () => any) {

		this.dataContextProvider = dataContextProvider;

	}

	private getData(): any {
    if (!this.dataContextProvider) {
      throw new Error("No data provider set");
    }
    return this.dataContextProvider();
  }

  public getToolboxAsTool(): DynamicStructuredTool {
    const fangornAgentToolboxTool = tool(
      async () => {
        console.log("console.log - agent called fangornAgentToolboxTool tool");

        return JSON.stringify({
          status: 200,
          statusText: "OK",
          result:
            "x402Fangorn tools are now available. You now have access to: fangorn_fetch. Re-plan and use them to complete the task.",
        });
      },
      {
        name: this.name,
        description:
          "Activates the Fangorn toolbox, which provides tools for purchasing and decrypting files. Call this whenever the user wants to buy or decrypt a resource. Once called, you will gain access to the fangorn_fetch tool.",
        schema: z.object({}),
      },
    );
    return fangornAgentToolboxTool;
  }

  public getTools(): DynamicStructuredTool[] {
    const fangornFetch = tool(
      async ({ owner, schemaName, tag }) => {
        console.log(
          `console.log - Agent called fangornFetch tool with args: owner: ${owner}, file tag: ${tag}, and schemaName: ${schemaName}`,
        );

				const dataContext = this.getData()
				console.log(`dataContext: ${JSON.stringify(dataContext)}`)

        const hexId = owner as Hex;

        const result = await this.fangornClient.fetchResource({
            privateKey: fangornMiddlewareConfig.privateKey,
            owner: hexId,
            schemaName,
            tag,
            baseUrl: fangornToolboxConfig.resourceServerUrl
        });

        console.log(`result: ${JSON.stringify(result, null, 2)}`)

        if (result.success) {
          const dataContents = result.data!;
          fs.mkdirSync('./Downloads', { recursive: true });
          fs.writeFileSync(`./Downloads/${tag}`, dataContents, "binary");
          return JSON.stringify({
            status: 200,
            statusText: "OK",
            result: `Notify the user that the request file has been downloaded to Downloads/${tag}.`,
          });
        } else {
          return JSON.stringify({
            status: 500,
            result:
              "Notify the user that when you went to fetch the file, something went wrong.",
          });
        }
      },
      {
        name: "fangorn_fetch",
        description:
          "Purchases and decrypts a file from the Fangorn network. Use this when the user wants to obtain a specific encrypted file. You must first inspect the ManifestState data to extract the three required parameters. To find them: 'owner' comes from the 'owner' field inside the PricingResource (field.price.owner) on the encrypted field the user wants. 'schemaName' comes from the 'schema_name' field on the top-level ManifestState object. 'tag' comes from the 'tag' field on the FileEntry that contains the encrypted field.",
        schema: z.object({
          owner: z
            .string()
            .describe("The address of the resource owner. Found at field.price.owner on the encrypted field the user wants to purchase."),
          schemaName: z
            .string()
            .describe("The name of the schema this manifest belongs to. Found at manifestState.schema_name."),
          tag: z
            .string()
            .describe("The file identifier. Found at fileEntry.tag on the FileEntry containing the target encrypted field."),
        }),
      },
    );

    return [fangornFetch];
  }
}