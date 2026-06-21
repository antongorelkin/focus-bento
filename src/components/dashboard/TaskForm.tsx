import React, { useState } from "react";

interface TaskFormProps {
	onAddTask: (taskData: {
		title: string;
		category: string;
		priority: string;
		estimated_time: number;
	}) => void;
	onCancel: () => void;
}

export function TaskForm({ onAddTask, onCancel }: TaskFormProps) {
	const [title, setTitle] = useState("");
	const [category, setCategory] = useState("Разработка");
	const [priority, setPriority] = useState("medium");
	const [time, setTime] = useState(30);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!title.trim()) return;

		onAddTask({
			title: title.trim(),
			category,
			priority,
			estimated_time: Number(time),
		});

		setTitle("");
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex flex-col gap-2.5 shadow-md animation-fade-in">
			<input
				type="text"
				placeholder="Название задачи..."
				value={title}
				onChange={(e) => setTitle(e.target.value)}
				required
				autoFocus
				className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-violet-500/50 transition-all"
			/>

			<div className="grid grid-cols-2 gap-2">
				<div className="flex flex-col gap-1">
					<label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
						Категория
					</label>
					<select
						value={category}
						onChange={(e) => setCategory(e.target.value)}
						className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-[11px] text-slate-300 focus:outline-hidden cursor-pointer">
						<option value="Разработка">Разработка</option>
						<option value="Дизайн">Дизайн</option>
						<option value="Финансы">Финансы</option>
						<option value="Учеба">Учеба</option>
						<option value="Спорт">Спорт</option>
					</select>
				</div>
				<div className="flex flex-col gap-1">
					<label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
						Приоритет
					</label>
					<select
						value={priority}
						onChange={(e) => setPriority(e.target.value)}
						className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-[11px] text-slate-300 focus:outline-hidden cursor-pointer">
						<option value="low">Low 🟢</option>
						<option value="medium">Medium 🟡</option>
						<option value="high">High 🔴</option>
					</select>
				</div>
			</div>
			<div className="flex flex-col gap-1">
				<label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
					Время (минуты)
				</label>
				<input
					type="number"
					min="5"
					max="480"
					step="5"
					value={time}
					onChange={(e) => setTime(Number(e.target.value))}
					className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-[11px] text-slate-300 focus:outline-hidden cursor-pointer"
				/>
			</div>

			<div className="flex gap-2 mt-1 justify-end">
				<button
					type="button"
					onClick={onCancel}
					className="px-2.5 py-1 text-slate-500 hover:text-slate-300 font-bold text-[11px] transition-all cursor-pointer">
					Отмена
				</button>
				<button
					type="submit"
					className="px-3 py-1 bg-violet-600 hover:bg-violet-700 border border-violet-500/20 text-white font-bold text-[11px] rounded-lg transition-all shadow-md cursor-pointer">
					Создать
				</button>
			</div>
		</form>
	);
}
