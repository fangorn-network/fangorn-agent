"use client";

import { PrivyProvider } from "@privy-io/react-auth";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
			<PrivyProvider
				appId="cmnxrwbjl00aa0dlart5xkemq"
				config={{
					// Create embedded wallets for users who don't have a wallet
					embeddedWallets: {
						ethereum: {
							createOnLogin: 'users-without-wallets'
						}
					},
					fundingMethodConfig: {
						moonpay: {
							useSandbox: true, // false for production
						}
					}
				}}
			>
      {children}
    </PrivyProvider>
  );
}