import { DynamicStructuredTool, tool } from "@langchain/core/tools";
import { z } from "zod";
import { Hex } from "viem";
import { FangornX402Middleware } from "@fangorn-network/fetch";
import fs from "fs";
import { Toolbox } from "../../types.js";
import { fangornMiddlewareConfig, fangornToolboxConfig } from "../../../config.js";

export class FangornToolbox implements Toolbox {
    
  private fangornClient: FangornX402Middleware;
  public name: string = "x402f_toolbox";

	dataContextProvider: (() => any) | null = null;

  static async init(): Promise<FangornToolbox> {


    const fangornClient = await FangornX402Middleware.create({
			walletClient: fangornMiddlewareConfig.walletClient,
			config: fangornMiddlewareConfig.config,
			usdcContractAddress: fangornMiddlewareConfig.usdcContractAddress,
			usdcDomainName: fangornMiddlewareConfig.usdcDomainName,
			facilitatorAddress: fangornMiddlewareConfig.facilitatorAddress,
			domain: fangornMiddlewareConfig.domain
		})

    return new FangornToolbox(fangornClient);
  }

  constructor(fangornClient: FangornX402Middleware) {
    this.fangornClient = fangornClient;
  }

	public setDataContextProvider(dataContextProvider: () => any) {

		this.dataContextProvider = dataContextProvider;

	}

	getToolsByName(toolNames: string[]): Map<String, DynamicStructuredTool> {
		const matchingToolMap = new Map(
			this.getTools()
			.filter((tool) => toolNames.includes(tool.name))
			.map(tool => [tool.name, tool])
		)
		return matchingToolMap
	}

	// Unused for now, but keeping here for the future
	private getData(): any {
    if (!this.dataContextProvider) {
      throw new Error("No data provider set");
    }
    return this.dataContextProvider();
  }

  public getToolboxAsTool(): DynamicStructuredTool {
    const x402fToolboxTool = tool(
      async () => {
        console.log("console.log - agent called x402fToolboxTool tool");

        return JSON.stringify({
          status: 200,
          statusText: "OK",
          result:
            "x402f tools are now available. You now have access to: x402f_fetch. Re-plan and use them to complete the task.",
        });
      },
      {
        name: this.name,
        description:
          "Activates the x402f toolbox, which provides tools for purchasing and decrypting files. Call this whenever the user wants to buy or decrypt a resource. Once called, you will gain access to the x402f_fetch tool.",
        schema: z.object({}),
      },
    );
    return x402fToolboxTool;
  }

  public getTools(): DynamicStructuredTool[] {
    const x402fFetch = tool(
      async ({ owner, schemaName, name }) => {
        console.log(
          `console.log - Agent called x402fFetch tool with args: owner: ${owner}, file name: ${name}, and schemaName: ${schemaName}`,
        );

        const hexId = owner as Hex;

        const result = await this.fangornClient.fetchResource({
            owner: hexId,
            schemaName,
            name,
            baseUrl: fangornToolboxConfig.resourceServerUrl
        });

        if (result.success) {
					console.log("Fetch was successful")
          const dataContents = result.data!;
          fs.mkdirSync('./Downloads', { recursive: true });
          fs.writeFileSync(`./Downloads/${name}`, dataContents, "binary");
          return JSON.stringify({
            status: 200,
            statusText: "OK",
            result: `Notify the user that the requested file has been downloaded to Downloads/${name}. No further tool calls are required.`,
          });
        } else {
					console.log("Fetch failed")
          return JSON.stringify({
            status: 500,
            result:
              "Notify the user that when you went to fetch the file, something went wrong.",
          });
        }
      },
      {
        name: "x402f_fetch",
        description:
          "Purchases and decrypts a files using x402 and x402f. Use this when the user wants to obtain a specific encrypted file. You must first inspect the ManifestState data to extract the three required parameters. To find them: 'owner' comes from the 'owner' field inside the PricingResource (field.price.owner) on the encrypted field the user wants. 'schemaName' comes from the 'schema_name' field on the top-level ManifestState object. 'name' comes from the 'name' field on the FileEntry that contains the encrypted field.",
        schema: z.object({
          owner: z
            .string()
            .describe("The address of the resource owner. Found at field.price.owner on the encrypted field the user wants to purchase."),
          schemaName: z
            .string()
            .describe("The name of the schema this manifest belongs to. Found at manifestState.schema_name."),
          name: z
            .string()
            .describe("The file identifier. Found at fileEntry.tag on the FileEntry containing the target encrypted field."),
        }),
      },
    );

    return [x402fFetch];
  }
}