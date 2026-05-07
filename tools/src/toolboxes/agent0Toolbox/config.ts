import { Hex } from "viem";

export interface Agent0SdkToolConfig {
  enabled: boolean;
  pinataJwt: string;
  chainConfig: any;
  key: Hex;
}