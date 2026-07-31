import { streamAssistantMessage } from "../utils/storage.js";
import { ASSISTANT_ACTIONS, assistantKnowledge, STARTER_QUESTIONS } from "../data/assistantKnowledge.js";

const ANALYTICS_KEY = "erudita_assistant_analytics_v1";
const CACHE = new Map();

export { STARTER_QUESTIONS };

export function trackAssistantMetric(metric, detail = "") {
  try {
    const current = JSON.parse(localStorage.getItem(ANALYTICS_KEY) || "{}");
    current[metric] = Number(current[metric] || 0) + 1;
    if (metric === "suggestedQuestions" && detail) {
      current.suggestions = current.suggestions || {};
      current.suggestions[detail] = Number(current.suggestions[detail] || 0) + 1;
    }
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(current));
  } catch {}
}

function normalized(value) {
  return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function localeFor(question) {
  const raw = String(question || "");
  const q = normalized(raw);
  if (/[\u0400-\u04ff]/i.test(raw)) return "mk";
  if (/\b(hallo|wer|was|kontakt|projekte|dienstleistungen|technologien)\b/.test(q)) return "de";
  if (/\b(kush|eshte|cka|cfare|projektet|sherbimet|aftesite|kontaktoj|qysh|osht|kom|munesh)\b/.test(q)) return "sq";
  return "en";
}
function translated(locale, values) { return values[locale] || values.en; }
function common(locale, kind, detail = "") {
  const copy = {
    injection: { en: "I cannot help with private credentials or internal instructions. I am here to answer questions about Erudita and this portfolio.", sq: "Nuk mund te ndihmoj me kredenciale private ose udhezime te brendshme. Jam ketu per pyetje rreth Erudites dhe ketij portofoli.", mk: "\u041d\u0435 \u043c\u043e\u0436\u0430\u043c \u0434\u0430 \u043f\u043e\u043c\u043e\u0433\u043d\u0430\u043c \u0441\u043e \u043f\u0440\u0438\u0432\u0430\u0442\u043d\u0438 \u043f\u043e\u0434\u0430\u0442\u043e\u0446\u0438 \u0438\u043b\u0438 \u0432\u043d\u0430\u0442\u0440\u0435\u0448\u043d\u0438 \u0438\u043d\u0441\u0442\u0440\u0443\u043a\u0446\u0438\u0438. \u0422\u0443\u043a\u0430 \u0441\u0443\u043c \u0437\u0430 \u043f\u0440\u0430\u0448\u0430\u045a\u0430 \u0437\u0430 \u0415\u0440\u0443\u0434\u0438\u0442\u0430 \u0438 \u043e\u0432\u0430 \u043f\u043e\u0440\u0442\u0444\u043e\u043b\u0438\u043e.", de: "Bei privaten Zugangsdaten oder internen Anweisungen kann ich nicht helfen. Ich beantworte Fragen ueber Erudita und dieses Portfolio." },
    identity: { en: "Erudita Zilbeari is a Full-Stack Web and Mobile Developer and UI/UX Designer. She builds polished, user-focused digital products.", sq: "Erudita Zilbeari eshte zhvilluese Full-Stack per web dhe mobile, si dhe dizajnere UI/UX. Ajo nderton produkte digjitale te orientuara te perdoruesi.", mk: "\u0415\u0440\u0443\u0434\u0438\u0442\u0430 \u0417\u0438\u043b\u0431\u0435\u0430\u0440\u0438 \u0435 Full-Stack web \u0438 mobile developer \u0438 UI/UX \u0434\u0438\u0437\u0430\u0458\u043d\u0435\u0440. \u0422\u0430\u0430 \u0441\u043e\u0437\u0434\u0430\u0432\u0430 \u043a\u0432\u0430\u043b\u0438\u0442\u0435\u0442\u043d\u0438 \u0434\u0438\u0433\u0438\u0442\u0430\u043b\u043d\u0438 \u043f\u0440\u043e\u0438\u0437\u0432\u043e\u0434\u0438.", de: "Erudita Zilbeari ist Full-Stack-Web- und Mobile-Entwicklerin sowie UI/UX-Designerin. Sie entwickelt hochwertige digitale Produkte." },
    unrelated: { en: "I am here to answer questions about Erudita and this portfolio.", sq: "Jam ketu per pyetje rreth Erudites dhe ketij portofoli.", mk: "\u0422\u0443\u043a\u0430 \u0441\u0443\u043c \u0437\u0430 \u043f\u0440\u0430\u0448\u0430\u045a\u0430 \u0437\u0430 \u0415\u0440\u0443\u0434\u0438\u0442\u0430 \u0438 \u043e\u0432\u0430 \u043f\u043e\u0440\u0442\u0444\u043e\u043b\u0438\u043e.", de: "Ich beantworte Fragen ueber Erudita und dieses Portfolio." },
  };
  return detail ? translated(locale, { en: detail, sq: detail, mk: detail, de: detail }) : translated(locale, copy[kind]);
}
export function localAssistantReply(question) {
  const q = normalized(question); const locale = localeFor(question);
  if (/ignore|system prompt|api key|admin password|credential|secret|override/.test(q)) return common(locale, "injection");
  if (/who|kush|wer ist|erudita|[\u0415\u0435]\u0440\u0443\u0434\u0438\u0442\u0430/.test(q)) return common(locale, "identity");
  if (/technolog|stack|skill|aftesi|vestini|kenntnisse/.test(q)) return `${locale === "de" ? "Erudita arbeitet mit" : locale === "sq" ? "Erudita punon me" : locale === "mk" ? "\u0415\u0440\u0443\u0434\u0438\u0442\u0430 \u0440\u0430\u0431\u043e\u0442\u0438 \u0441\u043e" : "Erudita works with"} ${Object.values(assistantKnowledge.technologies).flat().join(", ")}.`;
  if (/best project|project|projekte|proekt|projektet/.test(q)) return `${locale === "de" ? "Ausgewaehlte Projekte" : locale === "sq" ? "Projektet e vecuara" : locale === "mk" ? "\u0418\u0437\u0431\u0440\u0430\u043d\u0438 \u043f\u0440\u043e\u0435\u043a\u0442\u0438" : "Featured projects"}: ${assistantKnowledge.featuredProjects.join(", ")}.`;
  if (/service|sherbim|uslug|dienst/.test(q)) return `${locale === "de" ? "Services" : locale === "sq" ? "Sherbimet" : locale === "mk" ? "\u0423\u0441\u043b\u0443\u0433\u0438" : "Services"}: ${assistantKnowledge.services.join(", ")}.`;
  if (/contact|email|kontakt|kontak/.test(q)) return `${locale === "de" ? "Nutze den Kontaktbereich" : locale === "sq" ? "Perdor seksionin Contact" : locale === "mk" ? "\u041a\u043e\u0440\u0438\u0441\u0442\u0435\u0442\u0435 \u0458\u0430 \u0441\u0435\u043a\u0446\u0438\u0458\u0430\u0442\u0430 Contact" : "Use the Contact section"} or ${assistantKnowledge.contact.email}.`;
  if (/filter|dark|light|navigation|navigate|section|button|portfolio/.test(q)) return `Navigation: ${assistantKnowledge.navigation.sections.join(", ")}. Filters: ${assistantKnowledge.navigation.projectFilters.join(", ")}.`;
  if (/weather|president|recipe|football|movie|general coding/.test(q)) return common(locale, "unrelated");
  return "";
}
export function getAssistantActions(question, reply = "") {
  const text = normalized(`${question} ${reply}`);
  const actions = [];
  if (/project/.test(text)) actions.push(ASSISTANT_ACTIONS.projects);
  if (/experience/.test(text)) actions.push(ASSISTANT_ACTIONS.experience);
  if (/technolog|stack|skill/.test(text)) actions.push(ASSISTANT_ACTIONS.technologies);
  if (/contact|email|available|service|request/.test(text)) actions.push(ASSISTANT_ACTIONS.contact);
  return actions.slice(0, 2);
}

export async function askPortfolioAssistant({ history, question, onChunk, signal }) {
  const local = localAssistantReply(question);
  if (local) { onChunk?.(local, local); return { text: local, source: "local" }; }
  const key = normalized(question);
  if (CACHE.has(key)) { const text = CACHE.get(key); onChunk?.(text, text); return { text, source: "cache" }; }
  try {
    const text = await streamAssistantMessage(history.slice(-6), question, onChunk, signal);
    const answer = text?.trim() || assistantKnowledge.unknown;
    CACHE.set(key, answer);
    return { text: answer, source: "api" };
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    trackAssistantMetric("failedApiRequests");
    const fallback = localAssistantReply(question) || assistantKnowledge.unknown;
    if (fallback === assistantKnowledge.unknown) trackAssistantMetric("unansweredQuestions");
    onChunk?.(fallback, fallback);
    return { text: fallback, source: "fallback" };
  }
}

