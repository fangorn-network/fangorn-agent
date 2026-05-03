import { tool } from "langchain";
import { fangornMiddlewareConfig, fangornToolboxConfig } from "../../config.js";
import { Hex } from "viem";
import { FangornX402Middleware } from "@fangorn-network/fetch";
import fs from "fs";
import { z } from "zod"

const fangornClient = await FangornX402Middleware.create({
  walletClient: fangornMiddlewareConfig.walletClient,
  config: fangornMiddlewareConfig.config,
  usdcContractAddress: fangornMiddlewareConfig.usdcContractAddress,
  usdcDomainName: fangornMiddlewareConfig.usdcDomainName,
  facilitatorAddress: fangornMiddlewareConfig.facilitatorAddress,
  domain: fangornMiddlewareConfig.domain,
});

export const x402fFetch = tool(
  async ({ owner, schemaName, name }) => {
    console.log(
      `console.log - Agent called x402fFetch tool with args: owner: ${owner}, file name: ${name}, and schemaName: ${schemaName}`,
    );
    const hexId = owner as Hex;
    const result = await fangornClient.fetchResource({
      owner: hexId,
      schemaName,
      name,
      baseUrl: fangornToolboxConfig.resourceServerUrl,
    });
    if (result.success) {
      console.log("Fetch was successful");
      const dataContents = result.data!;
      fs.mkdirSync("./Downloads", { recursive: true });
      fs.writeFileSync(`./Downloads/${name}`, dataContents, "binary");
      return JSON.stringify({
        status: 200,
        statusText: "OK",
        result: `Notify the user that the requested file has been downloaded to Downloads/${name}. No further tool calls are required.`,
      });
    } else {
      console.log("Fetch failed");
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
        .describe(
          "The address of the resource owner. Found at field.price.owner on the encrypted field the user wants to purchase.",
        ),
      schemaName: z
        .string()
        .describe(
          "The name of the schema this manifest belongs to. Found at manifestState.schema_name.",
        ),
      name: z
        .string()
        .describe(
          "The file identifier. Found at fileEntry.tag on the FileEntry containing the target encrypted field.",
        ),
    }),
  },
);
