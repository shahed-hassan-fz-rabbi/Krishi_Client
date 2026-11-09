"use client";

import { useCallback, useEffect, useRef, useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  BarChart3,
  Bot,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CloudRain,
  Database,
  Edit2,
  FileText,
  Info,
  Layers,
  LayoutGrid,
  Leaf,
  ListTodo,
  MapPin,
  Mic,
  MicOff,
  Moon,
  Pause,
  Play,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  Sprout,
  Square,
  Sun,
  Tractor,
  Trash2,
  User,
  Volume2,
  Wheat,
  X,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext.js";
import { useLocation } from "@/contexts/LocationContext.js";
import { useTheme } from "@/contexts/ThemeContext.js";
import { useVoiceInput } from "@/hooks/useVoiceInput.js";
import { useVoiceOutput } from "@/hooks/useVoiceOutput.js";
import { useLang } from "@/lib/i18n/LanguageContext.js";
import {
  sendAssistantMessage,
  fetchAssistantConversation,
  renameAssistantConversation,
  deleteAssistantConversation,
  fetchFarms,
} from "@/services/api.js";

const CROPS = [
  { id: "all", nameEn: "All Crops", nameBn: "সকল ফসল" },
  { id: "monsoon_aman", nameEn: "T. Aman Rice", nameBn: "রোপা আমন ধান" },
  { id: "boro_rice", nameEn: "Boro Rice", nameBn: "বোরো ধান" },
  { id: "aus_rice", nameEn: "Aus Rice", nameBn: "আউশ ধান" },
  { id: "mustard", nameEn: "Mustard", nameBn: "সরিষা" },
];

function AssistantContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlConversationId = searchParams.get("id");
  const urlFarmId = searchParams.get("farmId");

  const { locale, setLocale, t } = useLang();
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const { selectedDistrict, setSelectedDistrict, districts } = useLocation();

  const isBn = locale === "bn";
  const isDark = theme === "dark";

  const [selectedCrop, setSelectedCrop] = useState("all");
  const [farmsList, setFarmsList] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState(urlFarmId || "");
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [conversationTitle, setConversationTitle] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitleValue, setNewTitleValue] = useState("");
  const [isGuestSession, setIsGuestSession] = useState(false);
  const [expandedDetails, setExpandedDetails] = useState({});

  useEffect(() => {
    if (urlFarmId) {
      setSelectedFarmId(urlFarmId);
    }
  }, [urlFarmId]);

  useEffect(() => {
    if (!isAuthenticated) return;
    async function loadFarms() {
      try {
        const res = await fetchFarms();
        if (res.success && res.data?.farms) {
          setFarmsList(res.data.farms);
        }
      } catch (err) {
        console.error("Failed to load user farms:", err);
      }
    }
    loadFarms();
  }, [isAuthenticated]);

  const activeFarm = farmsList.find((f) => f._id === selectedFarmId) || null;

  useEffect(() => {
    if (activeFarm) {
      if (activeFarm.location?.districtCode) {
        setSelectedDistrict(activeFarm.location.districtCode);
      }
      if (activeFarm.crop?.cropCode) {
        setSelectedCrop(activeFarm.crop.cropCode);
      }
    }
  }, [activeFarm, setSelectedDistrict]);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Voice Input (STT) Hook
  const handleFinalTranscript = useCallback((finalText) => {
    if (!finalText) return;
    setInputValue((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return finalText;
      return `${trimmed} ${finalText}`;
    });
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  }, []);

  const {
    isSupported: isVoiceSupported,
    isListening,
    lang: voiceLang,
    setLang: setVoiceLang,
    interimTranscript,
    errorCode: voiceErrorCode,
    errorDetails: voiceErrorDetails,
    startListening,
    stopListening,
    toggleListening,
    clearError: clearVoiceError,
  } = useVoiceInput({
    initialLang: isBn ? "bn-BD" : "en-US",
    onFinalTranscript: handleFinalTranscript,
  });

  useEffect(() => {
    setVoiceLang(isBn ? "bn-BD" : "en-US");
  }, [isBn, setVoiceLang]);

  // Voice Output (TTS) Hook
  const {
    isSupported: isTtsSupported,
    isSpeaking: isTtsSpeaking,
    isPaused: isTtsPaused,
    currentId: ttsCurrentId,
    error: ttsError,
    speak: speakTts,
    pause: pauseTts,
    resume: resumeTts,
    stop: stopTts,
    clearError: clearTtsError,
  } = useVoiceOutput();

  const [ttsTargetId, setTtsTargetId] = useState(null);

  const handleSpeakMessage = (msg) => {
    setTtsTargetId(msg.id);
    speakTts({
      text: msg.text,
      lang: isBn ? "bn-BD" : "en-US",
      messageId: msg.id,
    });
  };

  // Scroll to bottom on messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Load existing conversation when URL id changes
  useEffect(() => {
    if (!urlConversationId) {
      if (conversationId && !isGuestSession) {
        setConversationId(null);
        setConversationTitle("");
        setMessages([]);
      }
      return;
    }

    let isMounted = true;
    async function loadSavedConversation() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetchAssistantConversation(urlConversationId);
        if (!isMounted) return;

        if (res.success && res.data?.conversation) {
          const conv = res.data.conversation;
          setConversationId(conv._id);
          setConversationTitle(conv.title || "");
          if (conv.district) setSelectedDistrict(conv.district);
          if (conv.crop) setSelectedCrop(conv.crop);

          const formattedMessages = (conv.messages || []).map((m) => ({
            id: m._id || `msg-${Math.random()}`,
            sender: m.role,
            text: m.content,
            sources: m.sources || [],
            dataDate: m.dataDate || null,
            dataQuality: m.dataQuality || null,
            provenance: m.provenance || [],
            limitations: m.limitations || [],
            timestamp: m.timestamp
              ? new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          }));

          setMessages(formattedMessages);
        } else {
          setError(
            res.error?.message ||
              (isBn ? "আলোচনাটি লোড করা যায়নি।" : "Failed to load conversation.")
          );
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Failed to load conversation");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadSavedConversation();

    return () => {
      isMounted = false;
    };
  }, [urlConversationId, isBn, setSelectedDistrict]);

  // Handle New Conversation
  const handleNewConversation = useCallback(() => {
    stopTts();
    if (isListening) stopListening();
    setConversationId(null);
    setConversationTitle("");
    setMessages([]);
    setError(null);
    setIsGuestSession(false);
    router.replace("/assistant");
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  }, [stopTts, isListening, stopListening, router]);

  // Listen for global custom events from Sidebar
  useEffect(() => {
    const handleGlobalNewChat = () => handleNewConversation();
    const handleGlobalChatDeleted = (e) => {
      if (e.detail?.id === conversationId) {
        handleNewConversation();
      }
    };

    window.addEventListener("krishi:new-chat", handleGlobalNewChat);
    window.addEventListener("krishi:chat-deleted", handleGlobalChatDeleted);

    return () => {
      window.removeEventListener("krishi:new-chat", handleGlobalNewChat);
      window.removeEventListener("krishi:chat-deleted", handleGlobalChatDeleted);
    };
  }, [handleNewConversation, conversationId]);

  // Send message handler
  const handleSendMessage = useCallback(
    async (textOverride = null) => {
      const textToSend = typeof textOverride === "string" ? textOverride : inputValue;
      if (!textToSend || !textToSend.trim() || isLoading) return;

      if (isListening) stopListening();
      stopTts();

      const userText = textToSend.trim();
      const userMessage = {
        id: `user-${Date.now()}`,
        sender: "user",
        text: userText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInputValue("");
      setIsLoading(true);
      setError(null);

      try {
        const res = await sendAssistantMessage({
          message: userText,
          district: selectedDistrict,
          crop: selectedCrop === "all" ? null : selectedCrop,
          farmId: selectedFarmId || null,
          conversationId,
        });

        if (!res.success) {
          throw new Error(res.error?.message || "Failed to get AI response");
        }

        const data = res.data;
        if (data.conversationId) {
          setConversationId(data.conversationId);
          if (data.title && !conversationTitle) {
            setConversationTitle(data.title);
          }
          if (isAuthenticated && !urlConversationId) {
            router.replace(`/assistant?id=${data.conversationId}`);
            window.dispatchEvent(new CustomEvent("krishi:chat-updated"));
          }
        }

        if (data.isGuest) {
          setIsGuestSession(true);
        }

        const assistantMessage = {
          id: `assistant-${Date.now()}`,
          sender: "assistant",
          text: data.answer,
          sources: data.sources || [],
          dataDate: data.dataDate || null,
          dataQuality: data.dataQuality || null,
          provenance: data.provenance || [],
          limitations: data.limitations || [],
          conversationId: data.conversationId,
          isGuest: data.isGuest,
          guestNotice: data.guestNotice,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        console.error("[AssistantPage] Send failed:", err);
        setError(
          err.message ||
            (isBn
              ? "বার্তা পাঠাতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।"
              : "An error occurred while sending message. Please try again.")
        );
      } finally {
        setIsLoading(false);
      }
    },
    [
      inputValue,
      isLoading,
      selectedDistrict,
      selectedCrop,
      selectedFarmId,
      conversationId,
      conversationTitle,
      isAuthenticated,
      urlConversationId,
      router,
      isBn,
      isListening,
      stopListening,
      stopTts,
    ]
  );

  const toggleDetails = (messageId) => {
    setExpandedDetails((prev) => ({
      ...prev,
      [messageId]: !prev[messageId],
    }));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Inline rename conversation
  const handleRenameSubmit = async (e) => {
    e.preventDefault();
    if (!newTitleValue.trim() || !conversationId) {
      setIsRenaming(false);
      return;
    }
    try {
      const res = await renameAssistantConversation(conversationId, newTitleValue.trim());
      if (res.success) {
        setConversationTitle(newTitleValue.trim());
        window.dispatchEvent(new CustomEvent("krishi:chat-updated"));
      }
    } catch (err) {
      console.error("Rename failed:", err);
    } finally {
      setIsRenaming(false);
    }
  };

  // District display label
  const districtLabel = selectedDistrict === "chattogram" ? "Chattogram" : "Cumilla";
  const districtLabelBn = selectedDistrict === "chattogram" ? "চট্টগ্রাম" : "কুমিল্লা";

  // 6 Curated Cards
  const QUICK_QUESTIONS = [
    {
      id: "rainfall",
      title: "Rainfall Insights",
      subtitle: `${districtLabel}-য় সাম্প্রতিক ও ঐতিহাসিক বৃষ্টিপাতের ধারা কেমন?`,
      query: `${districtLabelBn}-য় সাম্প্রতিক ও ঐতিহাসিক বৃষ্টিপাতের ধারা কেমন?`,
      icon: CloudRain,
      iconColor: "text-sky-600 dark:text-sky-400",
      bgColor: "bg-sky-50 dark:bg-sky-950/60 border border-sky-100 dark:border-sky-900/40",
    },
    {
      id: "moisture",
      title: "Soil Moisture",
      subtitle: `${districtLabelBn}র মাটির আর্দ্রতা পরিস্থিতি কেমন?`,
      query: `${districtLabelBn}র মাটির আর্দ্রতা পরিস্থিতি কেমন?`,
      icon: Sprout,
      iconColor: "text-emerald-700 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/40",
    },
    {
      id: "aman-mustard",
      title: "Aman-Mustard Rotation",
      subtitle: "আমন ধানের পর সরিষা কখন লাগানো ভালো?",
      query: "আমন ধানের পর সরিষা কখন লাগানো ভালো?",
      icon: Wheat,
      iconColor: "text-amber-700 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-900/40",
    },
    {
      id: "handoff",
      title: "Handoff Planner",
      subtitle: "আমন কাটার পর সরিষা বপনের সম্ভাব্য শুকনা সময় দেখাও",
      query: "আমন কাটার পর সরিষা বপনের সম্ভাব্য শুকনা সময় দেখাও",
      icon: Calendar,
      iconColor: "text-rose-600 dark:text-rose-400",
      bgColor: "bg-rose-50 dark:bg-rose-950/60 border border-rose-100 dark:border-rose-900/40",
    },
    {
      id: "vegetation",
      title: "Vegetation Health",
      subtitle: "আমার এলাকার NDVI বা উদ্ভিদ স্বাস্থ্য সম্পর্কে বলো",
      query: "আমার এলাকার NDVI বা উদ্ভিদ স্বাস্থ্য সম্পর্কে বলো",
      icon: Leaf,
      iconColor: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/40",
    },
    {
      id: "boro-aus",
      title: "Boro-Aus Transition",
      subtitle: "বোরো থেকে আউশ ফসলের ঐতিহাসিক ফলাফল কী?",
      query: "বোরো থেকে আউশ ফসলের ঐতিহাসিক ফলাফল কী?",
      icon: Layers,
      iconColor: "text-teal-700 dark:text-teal-400",
      bgColor: "bg-teal-50 dark:bg-teal-950/60 border border-teal-100 dark:border-teal-900/40",
    },
  ];

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Top Bar: Language | Theme | Account / Guest Status */}
      <div className="flex items-center justify-between pb-1">
        {/* Left: Active Conversation Title or Breadcrumb */}
        <div className="flex items-center gap-2 min-w-0">
          {conversationTitle && (
            <div className="flex items-center gap-2 min-w-0">
              {isRenaming ? (
                <form onSubmit={handleRenameSubmit} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newTitleValue}
                    onChange={(e) => setNewTitleValue(e.target.value)}
                    autoFocus
                    className="rounded-lg border border-emerald bg-surface px-2.5 py-1 text-xs text-content focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-2 py-1 rounded bg-emerald text-white text-xs font-medium cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsRenaming(false)}
                    className="p-1 rounded text-muted hover:text-content text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xs font-semibold text-content truncate max-w-[200px] sm:max-w-xs">
                    {conversationTitle}
                  </span>
                  {isAuthenticated && (
                    <button
                      type="button"
                      onClick={() => {
                        setNewTitleValue(conversationTitle);
                        setIsRenaming(true);
                      }}
                      title="Rename conversation"
                      aria-label="Rename conversation"
                      className="p-1 rounded text-muted hover:text-emerald transition-colors cursor-pointer"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Language Switcher */}
          <div className="inline-flex items-center p-0.5 rounded-lg border border-line bg-surface text-xs font-medium shadow-2xs">
            <button
              type="button"
              onClick={() => setLocale("bn")}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                isBn ? "bg-emerald text-white font-semibold shadow-2xs" : "text-muted hover:text-content"
              }`}
            >
              বাংলা
            </button>
            <button
              type="button"
              onClick={() => setLocale("en")}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                !isBn ? "bg-emerald text-white font-semibold shadow-2xs" : "text-muted hover:text-content"
              }`}
            >
              English
            </button>
          </div>

          {/* Theme Switcher */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface text-muted hover:text-content transition-colors shadow-2xs cursor-pointer"
          >
            {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
          </button>

          {/* User / Guest Status */}
          {isAuthenticated && user ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-line bg-surface text-xs font-medium text-content shadow-2xs">
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald text-white text-[10px] font-bold">
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <span className="truncate max-w-[100px]">{user.name}</span>
            </div>
          ) : (
            <Link
              href="/login"
              title="Click to sign in and save your conversations permanently"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-line bg-surface hover:bg-surface-hover text-xs font-medium text-muted hover:text-emerald transition-colors shadow-2xs"
            >
              <User className="h-3.5 w-3.5 text-muted" />
              <span>Guest (Sign In)</span>
            </Link>
          )}
        </div>
      </div>

      {/* Main Page Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl border border-line bg-surface shadow-2xs">
        {/* Left: Sparkle Icon + Title + NASA Grounded Badge + Subtitle */}
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 shadow-2xs">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-content tracking-tight">
                Krishi Mama AI Assistant
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald text-white shadow-2xs">
                NASA Grounded
              </span>
            </div>
            <p className="text-xs text-muted mt-0.5 max-w-2xl leading-relaxed">
              Ask farm-related questions and get evidence-based answers from NASA climate data and official agricultural guidance (BAMIS / BRRI / DAE).
            </p>
          </div>
        </div>

        {/* Right: District Dropdown + Crop Dropdown + Farm Dropdown + New Chat Button */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 self-start md:self-center">
          {/* Farm selector (if user has registered farms) */}
          {isAuthenticated && farmsList.length > 0 ? (
            <div className="relative">
              <Tractor className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-emerald" />
              <select
                value={selectedFarmId}
                onChange={(e) => setSelectedFarmId(e.target.value)}
                aria-label="Select farm"
                className="appearance-none rounded-xl border border-line bg-surface-2 dark:bg-surface pl-8 pr-7 py-2 text-xs font-medium text-content hover:border-emerald/40 focus:outline-none focus:ring-1 focus:ring-emerald cursor-pointer shadow-2xs max-w-[160px] truncate"
              >
                <option value="">{isBn ? "সব খামার (সাধারণ)" : "All Farms (General)"}</option>
                {farmsList.map((f) => (
                  <option key={f._id} value={f._id}>
                    {f.farmName}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
            </div>
          ) : null}

          {/* District selector */}
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-emerald" />
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              aria-label="Select district"
              className="appearance-none rounded-xl border border-line bg-surface-2 dark:bg-surface pl-8 pr-7 py-2 text-xs font-medium text-content hover:border-emerald/40 focus:outline-none focus:ring-1 focus:ring-emerald cursor-pointer shadow-2xs"
            >
              {districts.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.nameEn}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
          </div>

          {/* Crop selector */}
          <div className="relative">
            <Sprout className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-emerald" />
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              aria-label="Select crop"
              className="appearance-none rounded-xl border border-line bg-surface-2 dark:bg-surface pl-8 pr-7 py-2 text-xs font-medium text-content hover:border-emerald/40 focus:outline-none focus:ring-1 focus:ring-emerald cursor-pointer shadow-2xs"
            >
              {CROPS.map((c) => (
                <option key={c.id} value={c.id}>
                  {isBn ? c.nameBn : c.nameEn}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
          </div>

          {/* New Chat Button */}
          <button
            type="button"
            onClick={handleNewConversation}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald hover:bg-emerald/90 text-white px-3.5 py-2 text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Chat</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Chat Area & Right Sidebar */}
      <div className="flex flex-col xl:flex-row gap-5 items-start w-full">
        {/* Left Column: Chat Area */}
        <div className="flex-1 min-w-0 w-full flex flex-col rounded-3xl border border-line bg-surface p-4 sm:p-5 shadow-xs min-h-[620px] max-h-[85vh]">
          {/* Farm-Aware Context Banner */}
          {activeFarm ? (
            <div className="mb-3.5 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 dark:bg-emerald-950/30 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  <Tractor className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-content truncate">{activeFarm.farmName}</span>
                    <span className="rounded-md bg-emerald-600/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:text-emerald-300">
                      {activeFarm.crop?.cropName || activeFarm.crop?.cropCode}
                    </span>
                    {activeFarm.crop?.variety ? (
                      <span className="text-[11px] text-content-muted">({activeFarm.crop.variety})</span>
                    ) : null}
                  </div>
                  <p className="text-[11px] text-content-muted mt-0.5 truncate">
                    {activeFarm.location?.upazila}, {activeFarm.location?.district} • {isBn ? "প্রশ্নগুলো এই খামারের বাস্তব উপাত্তের ভিত্তিতে উত্তর দেওয়া হবে" : "AI will answer grounded in this farm's records"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFarmId("")}
                className="text-xs text-emerald-700 dark:text-emerald-300 hover:underline shrink-0 font-medium cursor-pointer"
              >
                {isBn ? "ফিল্টার সরান" : "Clear Filter"}
              </button>
            </div>
          ) : null}

          {/* Scrollable Chat / Empty State Container */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-4">
            {messages.length === 0 ? (
              /* EMPTY STATE: Clean SaaS Hero Card + Try Asking About */
              <div className="flex flex-col gap-5">
                {/* Hero Card with Crisp Brand Typography & Badges */}
                <div className="relative overflow-hidden rounded-2xl border border-line bg-surface-2/60 dark:bg-surface-2/30 p-6 sm:p-8 text-center shadow-2xs">
                  {/* Centered Content */}
                  <div className="relative z-10 flex flex-col items-center max-w-xl mx-auto py-1">
                    {/* Logo Emblem */}
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface border border-line shadow-xs p-2 mb-3">
                      <Image
                        src="/images/logo.png"
                        alt="Krishi Mama Logo"
                        width={44}
                        height={44}
                        className="object-contain"
                      />
                    </div>

                    <h2 className="text-xl sm:text-2xl font-bold text-content tracking-tight">
                      How can I help your farm today?
                    </h2>
                    <p className="text-sm font-medium text-muted mt-1">
                      আপনার কৃষি-সম্পর্কিত যেকোনো প্রশ্ন করুন
                    </p>

                    {/* 3 Clean Trust Badges */}
                    <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface border border-line text-xs font-medium text-content shadow-2xs">
                        <BarChart3 className="h-3.5 w-3.5 text-emerald" />
                        <span>NASA Climate Evidence</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface border border-line text-xs font-medium text-content shadow-2xs">
                        <Sprout className="h-3.5 w-3.5 text-emerald" />
                        <span>Official Guidance</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface border border-line text-xs font-medium text-content shadow-2xs">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald" />
                        <span>Transparent & Grounded</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Farm-Aware Specific Quick Prompts (if active farm selected) */}
                {activeFarm ? (
                  <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-4 shadow-2xs">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider mb-2.5">
                      <Tractor className="h-4 w-4 text-emerald" />
                      <span>
                        {isBn
                          ? `"${activeFarm.farmName}" সংক্রান্ত গুরুত্বপূর্ণ প্রশ্নসমূহ`
                          : `Specific Questions for "${activeFarm.farmName}"`}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {[
                        {
                          title: isBn ? "বকেয়া ও আসন্ন কৃষি কাজ" : "Due & Upcoming Tasks",
                          query: isBn
                            ? "আমার খামারে কী কী কৃষি কাজ বাকি আছে?"
                            : "What farming tasks are due for this farm?",
                          icon: ListTodo,
                          color: "text-amber-600 bg-amber-500/15",
                        },
                        {
                          title: isBn ? "বর্তমান বৃদ্ধির পর্যায় ও দিন" : "Current Crop Stage",
                          query: isBn
                            ? "আমার ফসল এখন কোন বৃদ্ধি পর্যায়ে রয়েছে?"
                            : "What growth stage is my crop currently in?",
                          icon: Sprout,
                          color: "text-emerald-600 bg-emerald-500/15",
                        },
                        {
                          title: isBn ? "মাটির আর্দ্রতা ও স্যাটেলাইট ডেটা" : "Soil Moisture & Satellites",
                          query: isBn
                            ? "আমার খামারের পরিবেশ ও মাটির আর্দ্রতা কেমন?"
                            : "What are the latest satellite soil and greenness readings?",
                          icon: Droplets,
                          color: "text-blue-600 bg-blue-500/15",
                        },
                        {
                          title: isBn ? "বর্তমান পর্যায়ের সরকারি নির্দেশিকা" : "Official Stage Advisory",
                          query: isBn
                            ? "বর্তমান বৃদ্ধির পর্যায়ের জন্য সরকারি নির্দেশিকা কী?"
                            : "What official guidance exists for the current stage?",
                          icon: FileText,
                          color: "text-purple-600 bg-purple-500/15",
                        },
                      ].map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSendMessage(item.query)}
                          className="flex items-center justify-between gap-3 p-3 rounded-xl border border-emerald-500/20 bg-surface hover:bg-surface-hover hover:border-emerald-500/40 transition-all text-left group cursor-pointer shadow-2xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${item.color}`}>
                              <item.icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-content group-hover:text-emerald transition-colors">
                                {item.title}
                              </p>
                              <p className="text-[11px] text-muted truncate mt-0.5">{item.query}</p>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted group-hover:text-emerald group-hover:translate-x-0.5 transition-all shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* "Try asking about" Section */}
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-muted uppercase tracking-wider mb-3 px-1">
                    <LayoutGrid className="h-3.5 w-3.5 text-emerald" />
                    <span>Try asking about</span>
                  </div>

                  {/* 6 Cards in 3 Columns Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {QUICK_QUESTIONS.map((q) => {
                      const IconComponent = q.icon;
                      return (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => handleSendMessage(q.query)}
                          className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-line bg-surface hover:border-emerald/50 hover:bg-surface-hover hover:shadow-2xs transition-all text-left group cursor-pointer"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${q.bgColor} ${q.iconColor} transition-transform group-hover:scale-105`}>
                              <IconComponent className="h-4.5 w-4.5" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-content group-hover:text-emerald transition-colors">
                                {q.title}
                              </div>
                              <div className="text-xs text-muted truncate mt-0.5 max-w-[180px] sm:max-w-[200px]">
                                {q.subtitle}
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted group-hover:text-emerald group-hover:translate-x-0.5 transition-all shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              /* ACTIVE CHAT: Message Bubbles */
              <div className="space-y-4">
                {messages.map((msg) => {
                  const isUser = msg.sender === "user";
                  const detailsOpen = Boolean(expandedDetails[msg.id]);

                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 max-w-3xl ${isUser ? "ml-auto justify-end" : "mr-auto justify-start"}`}
                    >
                      {!isUser && (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald border border-emerald-200 dark:border-emerald-800 mt-1 shadow-2xs">
                          <Bot className="h-4 w-4" />
                        </div>
                      )}

                      <div
                        className={`flex flex-col rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                          isUser
                            ? "bg-emerald text-white rounded-tr-sm shadow-2xs"
                            : "bg-surface border border-line text-content rounded-tl-sm shadow-2xs"
                        }`}
                      >
                        {/* Assistant Message Header / TTS Controls */}
                        {!isUser && (
                          <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-line/40">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald">
                              <Bot className="h-3.5 w-3.5" />
                              <span>{isBn ? "কৃষি মামা পরামর্শ" : "Krishi Mama Advisory"}</span>
                            </div>

                            {/* TTS Controls */}
                            <div className="flex items-center gap-1">
                              {ttsCurrentId === msg.id && (isTtsSpeaking || isTtsPaused) ? (
                                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald/10 border border-emerald/20 text-xs">
                                  <button
                                    type="button"
                                    onClick={isTtsPaused ? resumeTts : pauseTts}
                                    title={isTtsPaused ? t("assistant.ttsResume") : t("assistant.ttsPause")}
                                    aria-label={isTtsPaused ? t("assistant.ttsResume") : t("assistant.ttsPause")}
                                    className="p-1 rounded text-emerald hover:bg-emerald/20 transition-colors cursor-pointer"
                                  >
                                    {isTtsPaused ? (
                                      <Play className="h-3 w-3 fill-current" />
                                    ) : (
                                      <Pause className="h-3 w-3 fill-current" />
                                    )}
                                  </button>
                                  <span className="text-[11px] font-medium text-emerald">
                                    {isTtsPaused ? t("assistant.ttsPaused") : t("assistant.ttsPlaying")}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={stopTts}
                                    title={t("assistant.ttsStop")}
                                    aria-label={t("assistant.ttsStop")}
                                    className="p-1 rounded text-muted hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                                  >
                                    <Square className="h-3 w-3 fill-current" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleSpeakMessage(msg)}
                                  disabled={!isTtsSupported}
                                  title={!isTtsSupported ? t("assistant.ttsUnsupported") : t("assistant.ttsListen")}
                                  aria-label={t("assistant.ttsListen")}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium transition-all ${
                                    !isTtsSupported
                                      ? "text-muted opacity-40 cursor-not-allowed"
                                      : "text-muted hover:text-emerald hover:bg-surface-hover cursor-pointer"
                                  }`}
                                >
                                  <Volume2 className="h-3.5 w-3.5" />
                                  <span>{t("assistant.ttsListen")}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* TTS Error Alert */}
                        {!isUser && ttsError && ttsTargetId === msg.id && (
                          <div className="mb-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-1.5">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                            <div className="flex-1">
                              {ttsError === "VOICE_UNAVAILABLE_BN"
                                ? t("assistant.ttsVoiceUnavailableBn")
                                : ttsError === "VOICE_UNAVAILABLE_EN"
                                ? t("assistant.ttsVoiceUnavailableEn")
                                : t("assistant.ttsError")}
                            </div>
                            <button
                              type="button"
                              onClick={clearTtsError}
                              className="p-0.5 rounded text-muted hover:text-content hover:bg-amber-200/50 cursor-pointer"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        )}

                        {/* Message Text */}
                        <div className="whitespace-pre-line text-sm leading-relaxed">{msg.text}</div>

                        {/* Metadata Footer */}
                        {!isUser && (
                          <div className="mt-3 pt-2.5 border-t border-line/60">
                            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
                              {msg.dataDate && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-hover border border-line">
                                  <Calendar className="h-3 w-3 text-emerald" />
                                  <span>{msg.dataDate}</span>
                                  <span className="text-[10px] text-muted/70">
                                    ({isBn ? "ঐতিহাসিক রেকর্ড" : "Historical Observation"})
                                  </span>
                                </span>
                              )}

                              {msg.sources && msg.sources.length > 0 && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-hover border border-line">
                                  <Database className="h-3 w-3 text-emerald" />
                                  <span className="truncate max-w-[200px]">{msg.sources.join(", ")}</span>
                                </span>
                              )}

                              {msg.dataQuality && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald/10 text-emerald font-medium border border-emerald/20">
                                  <ShieldCheck className="h-3 w-3" />
                                  <span>{msg.dataQuality}</span>
                                </span>
                              )}

                              {(msg.limitations?.length > 0 || msg.provenance?.length > 0) && (
                                <button
                                  type="button"
                                  onClick={() => toggleDetails(msg.id)}
                                  className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-surface-hover hover:bg-line text-[11px] font-medium text-emerald transition-colors ml-auto cursor-pointer"
                                >
                                  <span>{isBn ? "বিজ্ঞানের ভিত্তি ও সীমাবদ্ধতা" : "Scientific Context"}</span>
                                  {detailsOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                </button>
                              )}
                            </div>

                            {detailsOpen && (
                              <div className="mt-2.5 rounded-lg bg-surface-hover/70 p-2.5 text-xs text-muted border border-line space-y-1.5">
                                {msg.provenance && msg.provenance.length > 0 && (
                                  <div>
                                    <span className="font-semibold text-content">
                                      {isBn ? "উৎস পরিচিতি:" : "Provenance:"}
                                    </span>{" "}
                                    {msg.provenance.join(" • ")}
                                  </div>
                                )}
                                {msg.limitations && msg.limitations.length > 0 && (
                                  <div className="text-[11px] text-amber-700 dark:text-amber-400">
                                    <span className="font-semibold">
                                      {isBn ? "বৈজ্ঞানিক সীমাবদ্ধতা:" : "Limitations:"}
                                    </span>{" "}
                                    {msg.limitations.join(" • ")}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        <div className={`text-[10px] mt-1.5 ${isUser ? "text-white/70 text-right" : "text-muted text-left"}`}>
                          {msg.timestamp}
                        </div>
                      </div>

                      {isUser && (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface border border-line text-content mt-1 shadow-2xs">
                          <User className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex gap-3 mr-auto items-center">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald border border-emerald-200 dark:border-emerald-800">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-surface border border-line px-4 py-3 shadow-2xs">
                  <span className="text-xs text-muted">{isBn ? "নাসা উপাত্ত বিশ্লেষণ হচ্ছে..." : "Analyzing NASA data..."}</span>
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald animate-bounce [animation-delay:-0.3s]" />
                    <span className="h-2 w-2 rounded-full bg-emerald animate-bounce [animation-delay:-0.15s]" />
                    <span className="h-2 w-2 rounded-full bg-emerald animate-bounce" />
                  </div>
                </div>
              </div>
            )}

            {/* Error Banner */}
            {error && (
              <div className="rounded-xl border border-rose-300 bg-rose-50/80 dark:bg-rose-950/20 dark:border-rose-900 p-3 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                <div className="flex-1">
                  <div className="font-semibold">{isBn ? "বার্তা পাঠাতে ব্যর্থ হয়েছে" : "Request Failed"}</div>
                  <div className="mt-0.5">{error}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  className="px-2.5 py-1 bg-rose-600 text-white rounded-md hover:bg-rose-700 transition-colors shrink-0 text-xs font-medium cursor-pointer"
                >
                  {isBn ? "পুনরায় চেষ্টা" : "Retry"}
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Guest Notice Callout */}
          {!isAuthenticated && messages.length > 0 && (
            <div className="mt-2 px-3 py-2 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/70 dark:bg-amber-950/20 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between gap-2">
              <span className="truncate">
                {isBn
                  ? "অতিথি মোড: এই আলোচনাটি সাময়িক। সংরক্ষণ করতে লগইন করুন।"
                  : "Guest mode: this conversation is temporary. Sign in to save permanently."}
              </span>
              <Link
                href="/login"
                className="font-semibold text-emerald hover:underline shrink-0"
              >
                {isBn ? "লগইন" : "Sign In"}
              </Link>
            </div>
          )}

          {/* Voice Input Alert */}
          {voiceErrorCode && (
            <div className="mt-2 p-2.5 rounded-xl border border-amber-300 bg-amber-50/90 dark:bg-amber-950/20 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div className="flex-1">
                <div className="font-semibold">
                  {voiceErrorCode === "PERMISSION_DENIED"
                    ? isBn ? "মাইক্রোফোন ব্যবহারের অনুমতি মেলেনি" : "Microphone Access Denied"
                    : voiceErrorCode === "UNSUPPORTED"
                    ? isBn ? "ব্রাউজারে ভয়েস সমর্থিত নয়" : "Browser Not Supported"
                    : voiceErrorCode === "NO_SPEECH"
                    ? isBn ? "কোনো কথা শনাক্ত করা যায়নি" : "No Speech Detected"
                    : isBn ? "ভয়েস ইনপুট ত্রুটি" : "Voice Input Error"}
                </div>
                <div className="mt-0.5 text-content-muted leading-relaxed">
                  {voiceErrorCode === "PERMISSION_DENIED"
                    ? t("assistant.voicePermissionDenied")
                    : voiceErrorCode === "UNSUPPORTED"
                    ? t("assistant.voiceUnsupported")
                    : voiceErrorCode === "NO_SPEECH"
                    ? t("assistant.voiceNoSpeech")
                    : voiceErrorDetails || "Voice error occurred."}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {voiceErrorCode === "NO_SPEECH" && isVoiceSupported && (
                  <button
                    type="button"
                    onClick={startListening}
                    className="px-2 py-1 text-xs font-medium rounded-md bg-amber-600 hover:bg-amber-700 text-white transition-colors cursor-pointer"
                  >
                    {isBn ? "আবার বলুন" : "Retry"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={clearVoiceError}
                  className="p-1 rounded-md text-muted hover:text-content hover:bg-surface-hover cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Message Composer Area */}
          <div className="pt-3 mt-3 border-t border-line">
            {/* Active Listening / Interim Transcription Banner */}
            {isListening && (
              <div className="mb-2 p-2.5 rounded-xl border border-emerald/30 bg-emerald/5 dark:bg-emerald-950/30 flex items-center justify-between gap-3 animate-in fade-in duration-150">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="relative flex h-3 w-3 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-emerald dark:text-emerald-300 flex items-center gap-1.5">
                      <span>{t("assistant.listening")}</span>
                      <span className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-emerald/10 text-emerald-700 dark:text-emerald-300">
                        {voiceLang === "bn-BD" ? "বাংলা (bn-BD)" : "English (en-US)"}
                      </span>
                    </div>
                    <div className="text-xs text-content truncate mt-0.5">
                      {interimTranscript ? `“${interimTranscript}”` : t("assistant.voiceInterimPlaceholder")}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setVoiceLang(voiceLang === "bn-BD" ? "en-US" : "bn-BD")}
                    className="px-2 py-1 text-[11px] font-medium rounded-lg border border-line bg-surface hover:bg-surface-hover text-content transition-colors cursor-pointer"
                  >
                    {voiceLang === "bn-BD" ? "EN" : "বাং"}
                  </button>
                  <button
                    type="button"
                    onClick={stopListening}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Square className="h-3 w-3 fill-current" />
                    <span>{t("assistant.listeningStop")}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Input form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="relative flex items-center gap-2 p-1.5 rounded-2xl border border-line bg-surface-2 dark:bg-surface focus-within:border-emerald focus-within:ring-1 focus-within:ring-emerald transition-all shadow-2xs"
            >
              {/* Mic Button */}
              <button
                type="button"
                onClick={isVoiceSupported ? toggleListening : undefined}
                disabled={!isVoiceSupported || isLoading}
                title={
                  !isVoiceSupported
                    ? t("assistant.voiceUnsupported")
                    : isListening
                    ? t("assistant.voiceInputStop")
                    : t("assistant.voiceInputStart")
                }
                aria-label={
                  !isVoiceSupported
                    ? t("assistant.voiceUnsupported")
                    : isListening
                    ? t("assistant.voiceInputStop")
                    : t("assistant.voiceInputStart")
                }
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all cursor-pointer ${
                  !isVoiceSupported
                    ? "text-muted opacity-40 cursor-not-allowed"
                    : isListening
                    ? "bg-rose-600 text-white shadow-md ring-2 ring-rose-400/50 animate-pulse"
                    : "text-muted hover:text-emerald hover:bg-surface"
                }`}
              >
                {isListening ? (
                  <Square className="h-4 w-4 fill-current" />
                ) : !isVoiceSupported ? (
                  <MicOff className="h-4.5 w-4.5" />
                ) : (
                  <Mic className="h-4.5 w-4.5" />
                )}
              </button>

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isBn
                    ? "কৃষি মামাকে প্রশ্ন করুন... (যেমন: আমন ধানের পর সরিষা কখন লাগাবো?)"
                    : 'Ask Krishi Mama anything... (e.g., "আমন ধানের পর সরিষা কখন লাগাবো?")'
                }
                rows={1}
                maxLength={1000}
                className="flex-1 resize-none bg-transparent py-1.5 px-1 text-sm text-content placeholder:text-muted focus:outline-none min-h-[36px] max-h-28 leading-relaxed"
              />

              {/* Character Counter */}
              <span className="text-[11px] text-muted pr-1 shrink-0 hidden sm:inline">
                {inputValue.length} / 1000
              </span>

              {/* Round Send Button */}
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                aria-label={isBn ? "বার্তা পাঠান" : "Send message"}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all ${
                  inputValue.trim() && !isLoading
                    ? "bg-emerald text-white hover:bg-emerald/90 shadow-2xs cursor-pointer scale-100"
                    : "bg-surface-hover text-muted cursor-not-allowed opacity-50"
                }`}
              >
                <Send className="h-4 w-4" />
              </button>
            </form>

            {/* Bottom Sub-bar: Clean Lucide icons (No Emojis) */}
            <div className="flex flex-wrap items-center justify-between text-[11px] text-muted px-1.5 pt-2 gap-2">
              <span className="flex items-center gap-1.5">
                <span>Enter to send, Shift+Enter for new line</span>
              </span>

              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1 hover:text-content transition-colors">
                  <Database className="h-3 w-3 text-emerald" />
                  <span>NASA Data</span>
                </span>
                <span className="inline-flex items-center gap-1 hover:text-content transition-colors">
                  <Sprout className="h-3 w-3 text-emerald" />
                  <span>BAMIS / BRRI / DAE</span>
                </span>
                <span className="inline-flex items-center gap-1 hover:text-content transition-colors">
                  <Info className="h-3 w-3 text-emerald" />
                  <span>Evidence & Limitations</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sidebar Reference Cards */}
        <div className="hidden xl:flex xl:w-80 xl:flex-col gap-4 shrink-0">
          {/* Card 1: Data & Guidance */}
          <div className="rounded-2xl border border-line bg-surface p-4 shadow-xs">
            <div className="flex items-center gap-3 pb-3 border-b border-line/60">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0B3D91] text-white shadow-2xs p-1">
                <div className="relative flex items-center justify-center w-full h-full">
                  <span className="text-[11px] font-black tracking-wider leading-none">NASA</span>
                  <div className="absolute inset-0 border border-red-500/70 rounded-full scale-90 rotate-45 pointer-events-none" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-content leading-tight">Data & Guidance</h3>
                <p className="text-[11px] text-muted">Sources used in answers</p>
              </div>
            </div>

            <div className="mt-3.5 space-y-3">
              <div className="flex items-start gap-2.5">
                <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald text-white mt-0.5">
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </div>
                <div>
                  <div className="text-xs font-bold text-content">NASA POWER (Climate)</div>
                  <div className="text-[11px] text-muted mt-0.5">Rainfall, temperature, humidity, radiation</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald text-white mt-0.5">
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </div>
                <div>
                  <div className="text-xs font-bold text-content">BAMIS / BRRI</div>
                  <div className="text-[11px] text-muted mt-0.5">Crop calendar, variety and management</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald text-white mt-0.5">
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </div>
                <div>
                  <div className="text-xs font-bold text-content">DAE (Agricultural Extension)</div>
                  <div className="text-[11px] text-muted mt-0.5">Field practices and advisories</div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Important to Know */}
          <div className="rounded-2xl border border-line bg-surface overflow-hidden shadow-xs flex flex-col">
            <div className="p-4 pb-3">
              <div className="flex items-center gap-2 mb-2.5">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <Info className="h-3 w-3" />
                </div>
                <h3 className="text-sm font-bold text-content">Important to Know</h3>
              </div>

              <ul className="space-y-2 text-xs text-muted leading-relaxed pl-1">
                <li className="flex items-start gap-1.5">
                  <span className="text-muted leading-tight">•</span>
                  <span>এটি ঐতিহাসিক জলবায়ু তথ্যের ভিত্তিতে বিশ্লেষণ, ভবিষ্যৎ আবহাওয়ার পূর্বাভাস নয়।</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-muted leading-tight">•</span>
                  <span>কৃষি সিদ্ধান্ত নেওয়ার আগে স্থানীয় কৃষি কর্মকর্তার পরামর্শ নিন।</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-muted leading-tight">•</span>
                  <span>উল্লেখিত সীমাবদ্ধতা ও তথ্যের উৎস উত্তরের সঙ্গে দেওয়া হবে।</span>
                </li>
              </ul>
            </div>

            {/* Bottom Crop Thumbnail Image from /images/hero.jpeg */}
            <div className="relative w-full h-28 border-t border-line/60 overflow-hidden">
              <Image
                src="/images/hero.jpeg"
                alt="Agricultural Paddy Field"
                fill
                className="object-cover object-center"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AssistantPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-96 w-full items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-muted">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald border-t-transparent" />
            <span>Loading AI Assistant...</span>
          </div>
        </div>
      }
    >
      <AssistantContent />
    </Suspense>
  );
}
