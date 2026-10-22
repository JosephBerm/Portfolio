/** Ambient gradient orbs that create depth behind the glassmorphic cards.
 *  Uses CSS @keyframes float (defined in globals.css) for compositor-thread animation. */
export default function BackgroundEffects() {
	return (
		<div className="fixed inset-0 pointer-events-none" aria-hidden="true">
			{/* Blue orb — top-left */}
			<div className="absolute -top-[20%] -left-[15%] w-[350px] h-[350px] rounded-full bg-card-2 opacity-20 blur-[120px] animate-[float_10s_ease-in-out_infinite] motion-reduce:animate-none" />

			{/* Purple orb — bottom-right */}
			<div className="absolute -bottom-[15%] -right-[10%] w-[300px] h-[300px] rounded-full bg-card-3 opacity-25 blur-[120px] animate-[float_12s_ease-in-out_infinite_reverse] motion-reduce:animate-none" />

			{/* Green accent orb — center, very subtle */}
			<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] rounded-full bg-green opacity-[0.06] blur-[100px] animate-[float_14s_ease-in-out_infinite] motion-reduce:animate-none" />
		</div>
	)
}
