import { useState, useEffect } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../utils/supabaseClient";
import { addXpToUser, getUserProfile } from "../services/profileService";
import type { UserProfile } from "../services/profileService";
import type { Task } from "../types";
import { TaskForm } from "../components/dashboard/TaskForm";
import {
	createTask,
	deleteTask,
	getUserTasks,
	updateTaskStatus,
} from "../services/taskService";
import { DashboardHeader } from "../components/dashboard/DashboardHeader";
import { decomposeTaskWithAI } from "../services/aiService";
import { createMultipleTasks } from "../services/taskService";

interface DashboardProps {
	session: Session;
}

export default function Dashboard({ session }: DashboardProps) {
	const [profile, setProfile] = useState<UserProfile | null>(null);
	const [_loading, setLoading] = useState(true);
	const [tasks, setTasks] = useState<Task[]>([]);
	const [isCreating, setIsCreating] = useState(false);
	const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
	const [selectedTaskTime, setSelectedTaskTime] = useState<number | null>(null);
	const [decomposingTaskId, setDecomposingTaskId] = useState<string | null>(
		null,
	);

	const columns: {
		id: Task["status"];
		title: string;
		border: string;
		text: string;
	}[] = [
		{
			id: "todo",
			title: "План 🎯",
			border: "border-t-2 border-t-rose-500",
			text: "text-rose-400",
		},
		{
			id: "in_progress",
			title: "В работе ⚡",
			border: "border-t-2 border-t-amber-500",
			text: "text-amber-400",
		},
		{
			id: "done",
			title: "Готово 🎉",
			border: "border-t-2 border-t-emerald-500",
			text: "text-emerald-400",
		},
	];

	const getPriorityStyle = (priority: string) => {
		switch (priority) {
			case "high":
				return "bg-rose-500/10 text-rose-400 border-rose-500//20";
			case "medium":
				return "bg-amber-500/10 text-amber-400 border-amber-500/20";
			default:
				return "bg-blue-500/10 text-blue-400 border-blue-500/20";
		}
	};

	useEffect(() => {
		const loadDashboardData = async () => {
			try {
				setLoading(true);

				const [userProfile, userTasks] = await Promise.all([
					getUserProfile(session.user.id),
					getUserTasks(session.user.id),
				]);

				setProfile(userProfile);
				setTasks(userTasks);
			} catch (error) {
				console.error("Ошибка загрузки данных дашборда:", error);
			} finally {
				setLoading(false);
			}
		};

		loadDashboardData();
	}, [session.user.id]);

	useEffect(() => {
		const doneTasks = tasks.filter((task) => task.status === "done");
		if (doneTasks.length === 0) return;

		const timers: ReturnType<typeof setTimeout>[] = [];

		doneTasks.forEach((task) => {
			const fiveMinutes = 5 * 60 * 100;

			const timer = setTimeout(() => {
				handleDeleteTask(
					{ stopPropagation: () => {} } as React.MouseEvent,
					task.id,
				);
			}, fiveMinutes);

			timers.push(timer);
		});

		return () => {
			timers.forEach((timer) => clearInterval(timer));
		};
	}, [tasks]);

	const generateUUID = () => {
		return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
			const r = (Math.random() * 16) | 0;
			const v = c === "x" ? r : (r & 0x3) | 0x8;
			return v.toString(16);
		});
	};

	const handleDeleteTask = async (e: React.MouseEvent, taskId: string) => {
		e.stopPropagation();

		setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));

		try {
			await deleteTask(taskId);
		} catch (error) {
			console.error("Не удалось удалить задачу из базы:", error);
			alert("Ошибка сети: не удалось удалить задачу на сервере.");
			const { getUserTasks } = await import("../services/taskService");
			const refreshedTasks = await getUserTasks(session.user.id);
			setTasks(refreshedTasks);
		}
	};

	const handleDecomposeTask = async (e: React.MouseEvent, parentTask: Task) => {
		e.stopPropagation();

		try {
			setDecomposingTaskId(parentTask.id);

			const subTasksData = await decomposeTaskWithAI(
				parentTask.title,
				parentTask.category,
			);

			const packedTasks = subTasksData.map((subTask) => ({
				id: generateUUID(),
				user_id: session.user.id,
				status: "todo",
				title: subTask.title,
				category: parentTask.category,
				priority: parentTask.priority,
				estimated_time: subTask.estimated_time,
			}));
			const savedSubTasks = await createMultipleTasks(packedTasks);

			setTasks((prevTasks) => [...savedSubTasks, ...prevTasks]);
		} catch (error) {
			alert("Не удалось разбить задачу через ИИ. Проверь баланс или сеть.");
		} finally {
			setDecomposingTaskId(null);
		}
	};

	const handleAddTaskToBase = async (taskData: {
		title: string;
		category: string;
		priority: string;
		estimated_time: number;
	}) => {
		try {
			const generatedId = generateUUID();
			const savedTask = await createTask({
				id: generatedId,
				user_id: session.user.id,
				status: "todo",
				title: taskData.title,
				category: taskData.category,
				priority: taskData.priority,
				estimated_time: taskData.estimated_time,
			});

			setTasks([savedTask, ...tasks]);
			setIsCreating(false);
		} catch (error) {
			console.error("Ошибка добавления:", error);
			alert("Не удалось сохранить задачу в базу данных.");
		}
	};

	const handleDragStart = (e: React.DragEvent, taskId: string) => {
		setDraggedTaskId(taskId);
		e.dataTransfer.setData("text/plain", taskId);
		e.dataTransfer.effectAllowed = "move";
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = "move";
	};

	const handleDrop = async (
		e: React.DragEvent,
		targetStatus: Task["status"],
	) => {
		e.preventDefault();

		const taskId = draggedTaskId || e.dataTransfer.getData("text/plain");
		if (!taskId) {
			setDraggedTaskId(null);
			return;
		}

		const taskToUpdate = tasks.find((t) => t.id === taskId);
		if (!taskToUpdate) {
			setDraggedTaskId(null);
			return;
		}

		if (taskToUpdate.status === targetStatus) {
			setDraggedTaskId(null);
			return;
		}

		const currentStatusBeforeUpdate = taskToUpdate.status;
		setTasks((prevTasks) =>
			prevTasks.map((task) =>
				task.id === taskId ? { ...task, status: targetStatus } : task,
			),
		);

		setDraggedTaskId(null);

		try {
			await updateTaskStatus(taskId, targetStatus);

			if (profile) {
				let xpReward = 15;
				if (taskToUpdate.priority === "high") xpReward = 30;
				if (taskToUpdate.priority === "medium") xpReward = 20;

				let finalXpChange = 0;

				if (targetStatus === "done" && currentStatusBeforeUpdate !== "done") {
					finalXpChange = xpReward;
				} else if (
					currentStatusBeforeUpdate === "done" &&
					targetStatus !== "done"
				) {
					finalXpChange = -xpReward;
				}

				if (finalXpChange !== 0) {
					const updateProfile = await addXpToUser(
						session.user.id,
						profile.xp,
						profile.level,
						finalXpChange,
					);
					setProfile(updateProfile);
				}
			}
		} catch (error) {
			console.error("Не удалось обновить статус в базе:", error);
			alert("Ошибка сети: Изменения не сохранились в облаке.");
			setTasks((prevTasks) =>
				prevTasks.map((task) =>
					task.id === taskId
						? { ...task, status: currentStatusBeforeUpdate }
						: task,
				),
			);
		}
	};

	return (
		<div className="min-h-screen w-full bg-slate-900 flex p-4 md:flex-row flex-col font-sans selection:bg-violet-500 selection:text-white">
			<aside className="w-full md:w-64 bg-slate-950 rounded-3xl p-6 border border-slate-800/60 shadow-xl flex flex-col gap-5 justify-between">
				<div className="flex flex-col gap-4">
					<div className="flex items-center gap-3">
						<div className="w-11 h-11 rounded-2xl bg-violet-600/10 text-violet-400 font-black flex items-center justify-center text-lg border border-violet-500/20 shadow-sm shadow-violet-500/5">
							{profile ? profile.level : 1}
						</div>
						<div className="flex flex-col min-w-0 flex-1">
							<span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
								Уровень
							</span>
							<span
								className="text-xs font-bold text-slate-300 truncate"
								title={session.user.email}>
								{session.user.email}
							</span>
						</div>
					</div>
					<div className="flex flex-col gap-2 mt-1 bg-slate-900/40 border border-slate-800/40 rounded-2xl p-3">
						<div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
							<span>Опыт (XP)</span>
							<span className="text-violet-400">
								{profile ? profile.xp % 100 : 0} / 100 XP
							</span>
						</div>
						<div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
							<div
								className="h-full bg-linear-to-r from-violet-600 via-indigo-500 to-fuchsia-500 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(139,92,246,0.3)]"
								style={{ width: `${profile ? profile.xp % 100 : 0}%` }}></div>
						</div>
					</div>
				</div>

				<button
					onClick={() => supabase.auth.signOut()}
					className="w-full py-2.5 bg-slate-900 hover:bg-rose-950/30 hover:text-rose-400 border border-slate-800/80 text-slate-400 font-bold text-xs rounded-xl transition-all cursor-pointer text-center">
					Выйти из системы
				</button>
			</aside>

			<main className="flex-1 bg-slate-950 rounded-3xl border border-slate-800/60 shadow-xl p-6 flex flex-col gap-6 text-slate-100">
				<div className="grid grid-cols-1 xl:grid-cols-4 gap-4 items-stretch">
					<div className="xl:col-span-4">
						<DashboardHeader
							tasks={tasks}
							selectedTaskTime={selectedTaskTime}
							profile={profile}
							userId={session.user.id}
							setProfile={setProfile}
						/>
					</div>
				</div>
				<div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mt-2">
					{columns.map((column) => (
						<div
							key={column.id}
							onDragOver={handleDragOver}
							onDrop={(e) => handleDrop(e, column.id)}
							className={`bg-slate-900/30 border border-slate-800/50 rounded-2xl p-4 flex flex-col min-h-112.5 ${column.border}`}>
							<div className="flex justify-between items-center mb-4 px-1">
								<span
									className={`font-bold text-xs uppercase tracking-wider ${column.text}`}>
									{column.title}
								</span>
								<span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-90 border border-slate-800 px-2 py-0.5 rounded-md">
									{tasks.filter((t) => t.status === column.id).length}
								</span>
							</div>
							{column.id === "todo" && (
								<div className="mb-3">
									{!isCreating ? (
										<button
											onClick={() => setIsCreating(true)}
											className="w-full py-2 bg-slate-950/40 hover:bg-slate-900/60 border border-dashed border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5">
											<span>+</span> Добавить задачу
										</button>
									) : (
										<TaskForm
											onCancel={() => setIsCreating(false)}
											onAddTask={handleAddTaskToBase}
										/>
									)}
								</div>
							)}
							<div className="flex flex-col gap-3 flex-1">
								{tasks
									.filter((task) => task.status === column.id)
									.map((task) => (
										<div
											key={task.id}
											draggable
											onDragStart={(e) => handleDragStart(e, task.id)}
											onDragEnd={() => setDraggedTaskId(null)}
											onClick={() => setSelectedTaskTime(task.estimated_time)}
											className={`p-4 bg-slate-950 border rounded-xl hover:border-slate-700/80 transition-all duration-200 cursor-grab active:cursor-grabbing group shadow-sm flex flex-col justify-between min-h-30 ${
												selectedTaskTime === task.estimated_time
													? "border-amber-500/40 shadow-md shadow-amber-500/2"
													: "border-slate-800/80"
											} ${draggedTaskId === task.id ? "opacity-20 border-violet-500/50 scale-95" : ""}`}>
											<div>
												<div className="flex justify-between items-center mb-2">
													<span className="text-[9px] font-extrabold uppercase tracking-wide text-slate-400 px-2 py-0.5 bg-slate-900 rounded-md border border-slate-800">
														{task.category}
													</span>
													<span className="text-[10px] text-slate-500 font-bold font-mono">
														⏱️ {task.estimated_time} м
													</span>
												</div>
												<h3 className="font-semibold text-xs text-slate-200 group-hover:text-whit transition duration-150 leading-snug">
													{task.title}
												</h3>
												{column.id === "todo" && (
													<button
														onClick={(e) => handleDecomposeTask(e, task)}
														disabled={decomposingTaskId !== null}
														className="mt-2.5 w-full py-1.5 bg-violet-600/10 hover:bg-violet-600 border border-violet-500/20 hover:border-violet-500 text-violet-400 hover:text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1">
														<span>🪄</span>{" "}
														{decomposingTaskId === task.id
															? "Магия ИИ..."
															: "Разбить через ИИ"}
													</button>
												)}
											</div>
											<div className="mt-4 flex justify-between items-center">
												<span
													className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${getPriorityStyle(task.priority)}`}>
													{task.priority}
												</span>
												<span className="text-[9px] text-slate-600 font-mono font-bold">
													{new Date(task.created_at).toLocaleDateString(
														"ru-RU",
													)}
												</span>
												<button
													onClick={(e) => handleDeleteTask(e, task.id)}
													className="text-slate-600 hover:text-rose-400 transition-colors duration-150 cursor-pointer p-0.5 rounded-md hover:bg-rose-500/10 text-[11px]">
													🗑️
												</button>
											</div>
										</div>
									))}
							</div>
						</div>
					))}
				</div>
			</main>
		</div>
	);
}
