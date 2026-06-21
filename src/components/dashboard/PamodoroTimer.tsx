import { useEffect, useState } from "react";

interface PamodoroTimerProps {
	activeTime: number | null;
	onTimerComplete: () => void;
}

export function PamodoroTimer({
	activeTime,
	onTimerComplete,
}: PamodoroTimerProps) {
	const initialMinutes = activeTime ? activeTime : 25;
	const [secondsLeft, setSecondsLeft] = useState(initialMinutes * 60);
	const [isActive, setIsActive] = useState(false);

	useEffect(() => {
		if (activeTime) {
			setSecondsLeft(activeTime * 60);
			setIsActive(false);
		}
	}, [activeTime]);

	useEffect(() => {
		let interval: ReturnType<typeof setInterval> | null = null;

		if (isActive && secondsLeft > 0) {
			interval = setInterval(() => {
				setSecondsLeft((prev) => prev - 1);
			}, 1000);
		} else if (secondsLeft === 0 && isActive) {
			setIsActive(false);
			onTimerComplete();
			alert(
				"🎯 Сессия фокуса завершена! Отличная работа, тебе начислен бонусный опыт.",
			);
			setSecondsLeft(initialMinutes * 60);
		}

		return () => {
			if (interval) clearInterval(interval);
		};
	}, [isActive, secondsLeft, initialMinutes, onTimerComplete]);

	const formatTime = (totalSeconds: number) => {
		const mins = Math.floor(totalSeconds / 60);
		const secs = totalSeconds % 60;
		return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
	};

	const toggleTimer = () => setIsActive(!isActive);

	const resetTimer = () => {
		setIsActive(false);
		setSecondsLeft(initialMinutes * 60);
	};

	return (
		<div className="xl:col-span- bg-slate-950 border border-amber-500/20 shadow-lg shadow=amber-500/5 rounded-2xl p-5 flex flex-col  justify-between gap-3 transition-all duration-300">
			<div className="w-full text-center space-y-1">
				<span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block select-none">
					Таймер фокусировки
				</span>
				<div className="text-4xl font-black font-mono tracking-wider text-amber-400 bg-clip-text drop-shadow-[0_0_10px_rgba(245,158,11,0.2)]">
					{formatTime(secondsLeft)}
				</div>
			</div>

			<div className="grid grid-cols-2 gap-2 w-full mt-4">
				<button
					onClick={toggleTimer}
					className={`flex py-2 text-xs font-black items-center justify-center rounded-xl transition-all cursor-pointer select-none text-center border ${
						isActive
							? "bg-amber-600/10 border-amber-500/30 text-amber-400 hover:bg-amber-600/20"
							: "bg-amber-500 hover:bg-amber-600 border-amber-400/20 text-slate-950"
					}`}>
					{isActive ? "Пауза" : "Старт"}
				</button>
				<button
					onClick={resetTimer}
					className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 font-bold text-xs rounded-xl transition-all cursor-pointer">
					🔄
				</button>
			</div>
		</div>
	);
}
