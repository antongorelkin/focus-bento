import React from "react";
import { useState } from "react";
import { supabase } from "../utils/supabaseClient";
import {
	Target,
	Mail,
	Lock,
	AlertCircle,
	Sparkles,
	Eye,
	EyeOff,
} from "lucide-react";

export default function Auth() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [isSignUp, setIsSignUp] = useState(false);

	const [serverError, setServerError] = useState<string | null>(null);
	const [errors, setErrors] = useState<{
		email?: string;
		password?: string;
		confirmPassword?: string;
	}>({});
	const [loading, setLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);

	const validateForm = (): boolean => {
		const tempErrors: typeof errors = {};
		let isValid = true;
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!email.trim()) {
			tempErrors.email = "Email обязателен для заполнения";
			isValid = false;
		} else if (!emailRegex.test(email)) {
			tempErrors.email = "Введите корректный email";
			isValid = false;
		}

		if (!password) {
			tempErrors.password = "Пароль обязателен";
			isValid = false;
		} else if (password.length < 6) {
			tempErrors.password = "Пароль должен быть не менее 6 символов";
			isValid = false;
		}

		if (isSignUp && password !== confirmPassword) {
			tempErrors.confirmPassword = "Пароли не совпадают";
			isValid = false;
		}

		setErrors(tempErrors);
		return isValid;
	};

	const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setServerError(null);
		setErrors({});

		if (!validateForm()) return;
		setLoading(true);

		try {
			if (isSignUp) {
				const { data, error: signUpError } = await supabase.auth.signUp({
					email: email.trim(),
					password,
				});

				if (signUpError) throw signUpError;

				if (data?.user?.identities && data.user.identities.length === 0) {
					setServerError(
						"Пользователь с таким email уже зарегистрирован. Пожалуйста, войдите.",
					);
					setLoading(false);
					return;
				}

				if (data?.user) {
					const { error: profileError } = await supabase
						.from("user_profile")
						.insert([{ id: data.user.id, xp: 0, level: 1 }]);

					if (profileError) {
						console.error(
							"Ошибка инициализации профиля геймификации:",
							profileError,
						);
					}
				}

				alert("Регистрация прошла успешно! Теперь вы можете войти в систему.");
				setIsSignUp(false);
				setPassword("");
				setConfirmPassword("");
			} else {
				const { error: signInError } = await supabase.auth.signInWithPassword({
					email: email.trim(),
					password,
				});
				if (signInError) throw signInError;
			}
		} catch (err: any) {
			if (
				err.message?.includes("Invalid login credentials") ||
				err.status === 400
			) {
				setServerError(
					"Неверный email или пароль. Пожалуйста, попробуйте снова.",
				);
			} else if (
				err.status === 422 ||
				err.message?.includes("already registered")
			) {
				setServerError("Пользователь с таким email уже зарегистрирован");
			} else {
				setServerError(err.message || "Ошибка авторизации");
			}
		} finally {
			setLoading(false);
		}
	};
	const toggleMode = (e: React.MouseEvent<HTMLAnchorElement>) => {
		e.preventDefault();
		setIsSignUp(!isSignUp);
		setServerError(null);
		setErrors({});
		setPassword("");
		setConfirmPassword("");
	};

	return (
		<div className="min-h-screen w-full flex items-center justify-center bg-slate-900 p-4 font-sans selection:bg-violet-500 selection:text-white">
			<div className="bg-slate-950 rounded-3xl p-8 shadow-2xl border border-slate-800/80 w-full max-w-md flex flex-col gap-6 animate-fade-in">
				<div className="flex flex-col items-center text-center gap-2">
					<div className="w-12 h-12 bg-violet-600/10 rounded-2xl flex items-center justify-center text-violet-400 shadow-md border border-violet-500/20">
						<Target className="w-6 h-6 animate-pulse" />
					</div>
					<h2 className="text-2xl font-black text-white tracking-tight mt-2">
						FocusBento<span className="text-violet-500">.</span>
					</h2>
					<p className="text-xs text-slate-400 max-w-65 font-medium leading-relaxed">
						{isSignUp
							? "Создайте аккаунт, чтобы превратить ваши задачи в игровой опыт"
							: "Войдите, чтобы открыть интерактивную ИИ Канбан-доску"}
					</p>
				</div>

				<form onSubmit={handleAuth} className="flex flex-col gap-4.5">
					<div className="flex flex-col gap-1.5">
						<label
							htmlFor="email"
							className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">
							Email адрес
						</label>
						<div className="relative flex items-center">
							<Mail className="absolute left-3.5 w-4 h-4 text-slate-500 pointer-events-none" />
							<input
								type="email"
								id="email"
								placeholder="you@example.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className={`w-full pl-10.5 pr-4 py-3 bg-slate-900 border rounded-xl text-sm focus:outline-none transition-all font-medium text-slate-200 ${
									errors.email
										? "border-rose-500/50 bg-rose-950/10 focus:border-rose-500"
										: "border-slate-800 focus:border-violet-500 focus:bg-slate-900/60"
								}`}
							/>
						</div>
						{errors.email && (
							<span className="text-[11px] text-rose-400 pl-1 font-medium">
								{errors.email}
							</span>
						)}
					</div>

					<div className="flex flex-col gap-1.5">
						<label
							htmlFor="password"
							className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">
							Пароль
						</label>
						<div className="relative flex items-center">
							<Lock className="absolute left-3.5 w-4 h-4 text-slate-500 pointer-events-none" />
							<input
								type={showPassword ? "text" : "password"}
								id="password"
								placeholder="••••••••"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className={`w-full pl-10.5 pr-10 py-3 bg-slate-900 border rounded-xl text-sm focus:outline-none transition-all font-medium text-slate-200 ${
									errors.password
										? "border-rose-500/50 bg-rose-950/10 focus:border-rose-500"
										: "border-slate-800 focus:border-violet-500 focus:bg-slate-900/60"
								}`}
							/>
							<button
								type="button"
								onClick={() => setShowPassword(!showPassword)}
								className="absolute right-3.5 text-slate-500 hover:text-slate-400 transition-colors cursor-pointer">
								{showPassword ? (
									<EyeOff className="w-4 h-4" />
								) : (
									<Eye className="w-4 h-4" />
								)}
							</button>
						</div>
						{errors.password && (
							<span className="text-[11px] text-rose-400 pl-1 font-medium">
								{errors.password}
							</span>
						)}
					</div>

					{isSignUp && (
						<div className="flex flex-col gap-1.5 transition-all">
							<label
								htmlFor="confirmPassword"
								className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">
								Подтвердите пароль
							</label>
							<div className="relative flex items-center">
								<Lock className="absolute left-3.5 w-4 h-4 text-slate-500 pointer-events-none" />
								<input
									type={showPassword ? "text" : "password"}
									id="confirmPassword"
									placeholder="••••••••"
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									className={`w-full pl-10.5 pr-4 py-3 bg-slate-900 border rounded-xl text-sm focus:outline-none transition-all font-medium text-slate-200 ${
										errors.confirmPassword
											? "border-rose-500/50 bg-rose-950/10 focus:border-rose-500"
											: "border-slate-800 focus:border-violet-500 focus:bg-slate-900/60"
									}`}
								/>
							</div>
							{errors.confirmPassword && (
								<span className="text-[11px] text-rose-400 pl-1 font-medium">
									{errors.confirmPassword}
								</span>
							)}
						</div>
					)}

					{serverError && (
						<div className="flex items-center gap-2.5 p-3.5 bg-rose-950/20 border border-rose-900/50 rounded-xl text-xs text-rose-400 font-semibold">
							<AlertCircle className="w-4 h-4 shrink-0" />
							<span>{serverError}</span>
						</div>
					)}

					<button
						type="submit"
						disabled={loading}
						className="w-full mt-2 py-3 bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-violet-600/10 hover:-translate-y-0.5 active:translate-y-0 disabled:from-slate-800 disabled:to-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2">
						{loading ? (
							<span className="animate-pulse">Синхронизация профиля...</span>
						) : (
							<>
								<Sparkles className="w-4 h-4" />
								<span>{isSignUp ? "Создать аккаунт" : "Войти в систему"}</span>
							</>
						)}
					</button>
				</form>

				<div className="text-center border-t border-slate-900 pt-4">
					<a
						href="#"
						onClick={toggleMode}
						className="text-xs font-bold text-violet-400 hover:text-violet-300 transition-colors">
						{isSignUp
							? "Уже зарегистрированы? Войти"
							: "Впервые у нас? Создать аккаунт"}
					</a>
				</div>
			</div>
		</div>
	);
}
