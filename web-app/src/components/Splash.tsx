import { FangornLogo } from "../../public/svg/fangorn-logo"

export default function Splash() {
	return (
		<div className="flex-1 flex flex-col items-center justify-center">
			<style>{`
									@keyframes fangornPulse {
										0%, 100% { opacity: 0.4; transform: scale(1); }
										50% { opacity: 1; transform: scale(1.08); }
									}
									@keyframes fangornSpin {
										from { transform: rotate(0deg); }
										to { transform: rotate(360deg); }
									}
									@keyframes fangornFadeIn {
										from { opacity: 0; transform: translateY(8px); }
										to { opacity: 1; transform: translateY(0); }
									}
								`}</style>
			<div
				style={{
					width: 80,
					height: 80,
					borderRadius: '50%',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					padding: 16,
					backgroundColor: 'var(--color-black)',
					border: '1px solid var(--border)',
					animation: 'fangornPulse 2s ease-in-out infinite',
					position: 'relative',
				}}
			>
				<div
					style={{
						position: 'absolute',
						inset: -6,
						borderRadius: '50%',
						border: '1px solid transparent',
						borderTopColor: 'var(--text-secondary)',
						animation: 'fangornSpin 2s linear infinite',
						opacity: 0.4,
					}}
				/>
				<FangornLogo />
			</div>
			<p
				style={{
					marginTop: 24,
					fontSize: 14,
					color: 'var(--text-secondary)',
					fontFamily: 'var(--font-body)',
					animation: 'fangornFadeIn 0.6s ease-out 0.3s both',
				}}
			>
				Waking the forest...
			</p>
		</div>
	)


}