import { useState, useEffect } from "react";
import { supabase } from "./utils/supabaseClient";
import type { Session } from "@supabase/supabase-js";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";

function App() {
	const [session, setSession] = useState<Session | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		supabase.auth.getSession().then(({ data: { session } }) => {
			setSession(session);
			setLoading(false);
		});
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setSession(session);
		});
		return () => subscription.unsubscribe();
	}, []);

	if (loading) {
		return (
			<div className="min-h-screen w-full flex items-center bg-slate-900 justify-center text-slate-400 font-sans">
				Загрузка авторизации...
			</div>
		);
	}

	return !session ? <Auth /> : <Dashboard session={session} />;
}

export default App;
