import React, { useState } from "react";
import { generateFocusAdvice } from "../../services/aiService";
import { PamodoroTimer } from "./PamodoroTimer";
import type { Task } from "../../types";
import type { UserProfile } from "../../services/profileService";
interface DashboardHeaderProps {
	tasks: Task[];
	selectedTaskTime: number | null;
	profile: UserProfile | null;
	userId: string;
	setProfile: (profile: UserProfile | null) => void;
}

export function DashboardHeader({
	tasks,
	selectedTaskTime,
	profile,
	userId,
	setProfile,
}: DashboardHeaderProps) {
	const [aiAdvice, setAiAdvice] = useState<string>(
		"Нажми кнопку справа, чтобы ИИ проанализировал твои задачи и выдал фокус-совет! 🧠",
	);
	const [aiLoading, setAiLoading] = useState(false);

	const handleGetAiAdvice = async () => {
		try {
			setAiLoading(true);
			const advice = await generateFocusAdvice(tasks);
			setAiAdvice(advice);
		} catch (error) {
			console.error(error);
		} finally {
			setAiLoading(false);
		}
	};

	return (
		<div className="grid grid-cols-1 xl:grid-cols-4 gap-4 items-stretch w-full">
			<div className="xl:col-span-1 bg-slate-900/40 border border-slate-800/60 rounded-2xl p-5 flex flex-col justify-center">
				<h1 className="text-xl font-black text-white tracking-tight">
					🎯 Мой фокус-центр
				</h1>
				<p className="text-[11px] font-medium text-slate-400 leading-relaxed mt-1">
					Прогресс авторизации, игровой профиль и ИИ синхронизированы.
				</p>
			</div>

			<div className="xl:col-span-2 bg-slate-950 border border-violet-500/20 shadow-lg shadow-violet-500/5 rounded-2xl p-5 flex flex-row justify-between items-center gap-4">
				<div className="flex gap-3 items-start min-w-0 flex-1">
					<div className="w-10 h-10 rounded-xl bg-violet-600/10 text-violet-400 border border-violet-500/20 flex items-center justify-center text-lg shrink-0 animate-pulse">
						🧠
					</div>
					<div className="flex flex-col gap-0.5 min-w-0 flex-1">
						<span className="text-[9px] font-black text-violet-400 uppercase tracking-widest">
							FocusAI Совет дня
						</span>
						<p className="text-xs text-slate-300 leading-relaxed pr-2 font-medium wrap-break-word">
							{aiLoading ? "ИИ анализирует твою доску фокуса..." : aiAdvice}
						</p>
					</div>
				</div>
				<button
					onClick={handleGetAiAdvice}
					disabled={aiLoading}
					className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-900 border border-violet-500/30 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm hover:shadow-violet-500/10 shrink-0 select-none whitespace-nowrap disabled:cursor-not-allowed">
					{aiLoading ? "Думает..." : "Получить совет"}
				</button>
			</div>
			<PamodoroTimer
				activeTime={selectedTaskTime}
				onTimerComplete={async () => {
					if (profile) {
						const { addXpToUser } =
							await import("../../services/profileService");
						const updatedProfile = await addXpToUser(
							userId,
							profile.xp,
							profile.level,
							10,
						);
						setProfile(updatedProfile);
					}
				}}
			/>
		</div>
	);
}
