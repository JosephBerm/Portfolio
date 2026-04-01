export default function LoadingIsBusy() {
	return (
		<div className="absolute top-[calc(50%-32px)] left-[calc(50%-32px)] w-16 h-16 rounded-full [perspective:800px]">
			<div className="absolute box-border w-full h-full rounded-full border-b-[3px] border-green animate-[rotate-one_1s_linear_infinite]" />
			<div className="absolute box-border w-full h-full rounded-full border-r-[3px] border-green animate-[rotate-two_1s_linear_infinite]" />
			<div className="absolute box-border w-full h-full rounded-full border-t-[3px] border-green animate-[rotate-three_1s_linear_infinite]" />
		</div>
	)
}
