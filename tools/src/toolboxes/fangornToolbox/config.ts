import { Hex } from "viem";

export interface FangornToolConfig {
  enabled: boolean;
  walletClient: any;
  config: any;
  usdcContractAddress: Hex;
  usdcDomainName: string;
  facilitatorAddress: Hex;
  resourceServerUrl: string;
  domain: string;
}