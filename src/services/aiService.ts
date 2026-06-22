import OpenAI from 'openai';
import type { Task } from '../types';


const aiClient = new OpenAI({
  apiKey: import.meta.env.VITE_AI_API_KEY,
  dangerouslyAllowBrowser: true,
  baseURL: 'https://api.proxyapi.ru/openai/v1'
});

export async function generateFocusAdvice (tasks: Task[]): Promise<string> {
  if (tasks.length === 0) {
    return "Твоя доска фокуса пока пуста. Добавь пару задач в 'План', чтобы ИИ-ассистент помог оптимизировать твой день! ⚡";
  }

  const tasksSummary = tasks
    .map(t => `- [${t.status.toUpperCase()}] ${t.title} (${t.category}, приоритет: ${t.priority}, время: ${t.estimated_time} мин)`)
    .join("\n")

  try {
    const response = await aiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: "Ты — ИИ-коуч по продуктивности в приложении FocusBento. Твоя задача — проанализировать список задач пользователя и дать ОДИН ОЧЕНЬ КОРОТКИЙ, емкий и мотивирующий совет по продуктивности на день (максимум 2-3 sentences). Используй бодрый, технологичный тон и эмодзи. Не пиши банальности. Сфокусируйся на оптимизации времени или порядке выполнения задач."
        },
        {
          role: 'user',
          content: `Вот мой текущий список задач на Канбан-доске:\n${tasksSummary}\n\nДай мне фокус-совет на основе этих данных.`
        }
      ],
      temperature: 0.7,
      max_tokens: 150
    });
    return response.choices?.[0].message?.content || "Не удалось сгенерировать совет.";
  } catch (error: any) {
    console.error("Ошибка ИИ-сервиса:", error);
    return "🤖 ИИ-мозг временно перезагружается. Проверь баланс в личном кабинете реселлера или настройки API-ключа.";
  }
}

export async function decomposeTaskWithAI (taskTitle: string, taskCategory: string): Promise<{ title: string; estimated_time: number }[]> {
  try {
    const response = await aiClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Ты — эксперт по тайм-менеджменту в приложении FocusBento. Твоя задача — разбить крупную задачу на 3-4 конкретных, маленьких подзадачи. 
					Ответ ты должен вернуть СТРОГО в формате JSON-массива объектов, без какого-либо лишнего текста, разметки markdown или пояснений. 
					Каждый объект должен содержать поля:
					- "title": короткое понятное название подзадачи на русском языке (до 50 символов)
					- "estimated_time": время на выполнение в минутах (число от 15 до 60).
					
					Пример ответа:
					[
						{"title": "Изучить документацию API", "estimated_time": 30},
						{"title": "Написать базовые методы fetch", "estimated_time": 45}
					]`
        },
        {
          role: "user",
          content: `Разбей на подзадачи следующую цель: "${taskTitle}" (Категория: ${taskCategory})`
        }
      ],
      temperature: 0.5,
      max_tokens: 300
    });
    const rawContent = response.choices[0]?.message.content || "[]";
    const cleanJson = rawContent.replace(/```json|```/g, "").trim()
    return JSON.parse(cleanJson)
  } catch (error) {
    console.error("Ошибка декомпозиции ИИ:", error);
    throw new Error("Не удалось разбить задачу через ИИ.")
  }
}