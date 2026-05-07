import { FangornConfig } from "@fangorn-network/sdk";

import { vi } from "vitest";

const useMcp = true;
const useGmail = true;
const useAgent0 = true;
const useFangornTools = true;
const useTasteTools = true;
const pinataJwt = "jwt";
const key =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const chainConfig = FangornConfig.ArbitrumSepolia;

export const agent0SdkToolConfig: FangornToolboxConfig = {
  enabled: useAgent0,
  pinataJwt,
  chainConfig,
  key,
};

const gmailClientId = "clientId";
const gmailClientSecret = "clientSecret";
const gmailRefreshToken = "refreshToken";
const agentSignoff = "agentSignoff";

export const gmailConfig: FangornToolboxConfig = {
  enabled: useGmail,
  gmailClientId,
  gmailClientSecret,
  gmailRefreshToken,
  agentSignoff,
};

const mcpServerUrls = ["https://mcp.fangorn.network/mcp"];

export const mcpServerConfig: FangornToolboxConfig = {
  mcpServerUrls,
};

const usdcContractAddress = "0x123123123";
const usdcDomainName = "domainName";
const facilitatorAddress = "0x1231231234";
const resourceServerUrl = "https://resource-server.network";
const domain = "localhost";

const mockWalletClient = {
  account: {
    address: "0x951f9e73FA32A83246782edb659ae1669C035BdF",
    type: "local",
  },
  chain: { id: 1, name: "mainnet" },
  sendTransaction: vi.fn().mockResolvedValue("0xMockedHash"),
  signMessage: vi.fn().mockResolvedValue("0xMockedResult"),
  signTypedData: vi.fn().mockResolvedValue("0xMockedSig"),
  transport: { type: "http" },
};

export const fangornToolConfig: FangornToolboxConfig = {
  walletClient: mockWalletClient as any,
  config: chainConfig,
  usdcContractAddress,
  usdcDomainName,
  facilitatorAddress,
  resourceServerUrl,
  domain,
};

export const fangornAgentToolConfig: FangornToolboxConfig = {
  gmailConfig,
  agent0SdkToolConfig,
  fangornToolConfig,
  mcpServerConfig,
  useTasteTools,
};

import { FangornToolboxConfig, ToolboxEntry } from "@fangorn-network/agent-types";

import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// CommonJS
export const toolboxDir = join(__dirname, "..", "toolboxes");

const fangornToolboxEntry: ToolboxEntry = {
  "id": "fangornToolbox",
  "enabled": true,
  "fields": {...fangornToolConfig}
}

const fangornMcpEntry: ToolboxEntry = {
  "id": "mcpToolbox",
  "enabled": true,
  "fields": {...mcpServerConfig}
}


export const toolboxEntries: ToolboxEntry[] = [fangornToolboxEntry, fangornMcpEntry]
