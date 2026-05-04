import { DynamicStructuredTool } from "@langchain/core/tools";
import { Hex } from "viem";

export interface Toolbox {
  name: string;
  getTools(): DynamicStructuredTool[];
  getToolboxAsTool(): DynamicStructuredTool;
  getToolsByName(toolNames: string[]): Map<String, DynamicStructuredTool>;
}

export interface AsyncFactory<T> {
  init(config?: FangornAgentToolConfig): Promise<T>;
}

export async function initializeToolbox(
  factory: AsyncFactory<Toolbox>,
	config?: FangornAgentToolConfig
): Promise<Toolbox> {
  return factory.init(config);
}

export interface DataContext {
  excludeIds?: string[];
}

export interface FangornAgentToolConfig {
	gmailConfig: GmailToolConfig
	mcpServerConfig: McpServerConfig
	agent0SdkToolConfig: Agent0SdkToolConfig
	fangornToolConfig: FangornToolConfig
	useTasteTools: boolean
}

export interface FangornToolConfig {
	enabled: boolean
	walletClient: any
	config: any
	usdcContractAddress: Hex
	usdcDomainName: string
	facilitatorAddress: Hex
	resourceServerUrl: string
	domain: string
}

export interface McpServerConfig {
	enabled: boolean
	mcpServerUrls: string[]
}

export interface Agent0SdkToolConfig {
	enabled: boolean
	pinataJwt: string
	chainConfig: any
	key: Hex
};

export interface GmailToolConfig {
	enabled: boolean
	gmailClientId: string
	gmailClientSecret: string
	gmailRefreshToken: string
	agentSignoff: string
}
