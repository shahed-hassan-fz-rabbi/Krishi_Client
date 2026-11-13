"use client";
import { PrivateAccess } from "@/components/auth/PrivateAccess.js";
import { BRAND_LOGO_SRC } from "@/lib/branding.js";

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
  Copy,
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

  const { locale, t } = useLang();
  const { theme } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const { selectedDistrict, setSelectedDistrict, districts } = useLocation();
  const userKey = user?._id || user?.id || null;

  const isBn = locale === "bn";
  const isDark = theme === "dark";

  const [selectedCrop, setSelectedCrop] = useState("all");
  const [farmLoadResult, setFarmLoadResult] = useState(null);
  const [farmReloadCount, setFarmReloadCount] = useState(0);
  const farmRequestKey = `${userKey || "guest"}:${farmReloadCount}`;
  const loadedFarmUserRef = useRef(user?._id || user?.id || null);
  const [farmSelection, setFarmSelection] = useState({ queryFarmId: urlFarmId, farmId: urlFarmId || "" });
  const selectedFarmId = farmSelection.queryFarmId === urlFarmId
    ? farmSelection.farmId
    : urlFarmId || "";
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
  const [copiedId, setCopiedId] = useState(null);
  const [failedPrompt, setFailedPrompt] = useState("");

  const handleCopyMessage = (msgId, text) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(msgId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleFarmSelection = (farmId) => {
    const nextFarmId = farmId || "";
    if (nextFarmId === selectedFarmId) return;
    // Farm context is fixed for a saved conversation. Start a fresh thread when switching.
    handleNewConversation(nextFarmId);
    setFarmSelection({ queryFarmId: urlFarmId, farmId });
    const selectedFarm = farmsList.find((farm) => farm._id === farmId);
    if (selectedFarm?.location?.districtCode) {
      setSelectedDistrict(selectedFarm.location.districtCode);
    }
    if (selectedFarm?.crop?.cropCode) {
      setSelectedCrop(selectedFarm.crop.cropCode);
    }
  };

  useEffect(() => {
    let isMounted = true;
    if (loadedFarmUserRef.current !== userKey) {
      loadedFarmUserRef.current = userKey;
      setFarmSelection({ queryFarmId: urlFarmId, farmId: urlFarmId || "" });
    }
    if (!isAuthenticated) {
      return () => { isMounted = false; };
    }
    async function loadFarms() {
      try {
        const res = await fetchFarms();
        if (!isMounted) return;
        if (res.success && Array.isArray(res.data?.farms)) {
          setFarmLoadResult({ requestKey: farmRequestKey, farms: res.data.farms, error: false });
          const queryFarm = res.data.farms.find((farm) => farm._id === urlFarmId);
          if (urlFarmId && !queryFarm) {
            setFarmSelection({ queryFarmId: urlFarmId, farmId: "" });
            router.replace("/assistant");
          }
          if (queryFarm?.location?.districtCode) {
            setSelectedDistrict(queryFarm.location.districtCode);
          }
          if (queryFarm?.crop?.cropCode) {
            setSelectedCrop(queryFarm.crop.cropCode);
          }
        } else {
          setFarmLoadResult({ requestKey: farmRequestKey, farms: [], error: true });
        }
      } catch (err) {
        if (!isMounted) return;
        setFarmLoadResult({ requestKey: farmRequestKey, farms: [], error: true });
        console.error("Failed to load user farms:", err);
      }
    }
    loadFarms();
    return () => { isMounted = false; };
  }, [isAuthenticated, userKey, urlFarmId, farmRequestKey, router, setSelectedDistrict]);

  const farmResultIsCurrent = farmLoadResult?.requestKey === farmRequestKey;
  const farmsList = isAuthenticated && farmResultIsCurrent ? farmLoadResult.farms : [];
  const farmsLoadError = isAuthenticated && farmResultIsCurrent && farmLoadResult.error;
  const isFarmsLoading = isAuthenticated && !farmResultIsCurrent;

  const activeFarm = farmsList.find((f) => f._id === selectedFarmId) || null;

  const messagesEndRef = useRef(null);
  const chatScrollContainerRef = useRef(null);
  const loadedConvIdRef = useRef(null);
  const textareaRef = useRef(null);
  const sendInFlightRef = useRef(false);
  const conversationStateRef = useRef({ conversationId, isGuestSession });
  useEffect(() => {
    conversationStateRef.current = { conversationId, isGuestSession };
  }, [conversationId, isGuestSession]);

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
  }, [setInputValue]);

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

  // Smooth contained scrolling without window jumping
  const scrollToBottom = useCallback((smooth = true) => {
    const container = chatScrollContainerRef.current;
    if (!container) return;
    requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
    });
  }, []);

  const messagesCount = messages.length;
  useEffect(() => {
    if (messagesCount > 0 || isLoading) {
      scrollToBottom(true);
    }
  }, [messagesCount, isLoading, scrollToBottom]);

  // Load existing conversation when URL id changes
  useEffect(() => {
    let isMounted = true;
    if (!urlConversationId) {
      const previousState = conversationStateRef.current;
      if (previousState.conversationId && !previousState.isGuestSession) {
        Promise.resolve().then(() => {
          if (!isMounted) return;
          setConversationId(null);
          setConversationTitle("");
          setMessages([]);
        });
      }
      loadedConvIdRef.current = null;
      return () => {
        isMounted = false;
      };
    }

    // Skip redundant network fetch if this conversation is already active in memory
    if (
      loadedConvIdRef.current === urlConversationId ||
      (conversationStateRef.current.conversationId === urlConversationId && messagesCount > 0)
    ) {
      loadedConvIdRef.current = urlConversationId;
      return () => {
        isMounted = false;
      };
    }

    async function loadSavedConversation() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetchAssistantConversation(urlConversationId);
        if (!isMounted) return;

        if (res.success && res.data?.conversation) {
          const conv = res.data.conversation;
          loadedConvIdRef.current = conv._id;
          setConversationId(conv._id);
          setConversationTitle(conv.title || "");
          setFailedPrompt("");
          const savedFarmId = conv.farmId?.toString?.() || conv.farmId || "";
          setFarmSelection({ queryFarmId: urlFarmId, farmId: savedFarmId });
          const savedFarm = farmsList.find((farm) => farm._id === savedFarmId);
          if (savedFarm?.location?.districtCode) setSelectedDistrict(savedFarm.location.districtCode);
          else if (conv.district) setSelectedDistrict(conv.district);
          if (savedFarm?.crop?.cropCode) setSelectedCrop(savedFarm.crop.cropCode);
          else if (conv.crop) setSelectedCrop(conv.crop);

          const formattedMessages = (conv.messages || []).map((m) => ({
            id: m._id || `msg-${Math.random()}`,
            sender: m.role,
            text: m.content,
            sources: m.sources || [],
            dataDate: m.dataDate || null,
            observationDate: m.observationDate || null,
            observationLocation: m.observationLocation || null,
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

    Promise.resolve().then(() => {
      if (isMounted) loadSavedConversation();
    });

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlConversationId]);

  // Handle New Conversation
  const handleNewConversation = useCallback((requestedFarmId) => {
    const preserveFarmId = requestedFarmId || "";
    stopTts();
    if (isListening) stopListening();
    loadedConvIdRef.current = null;
    setConversationId(null);
    setConversationTitle("");
    setMessages([]);
    setError(null);
    setFailedPrompt("");
    setIsGuestSession(false);
    router.replace(preserveFarmId
      ? `/assistant?farmId=${encodeURIComponent(preserveFarmId)}`
      : "/assistant");
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  }, [stopTts, isListening, stopListening, router, setConversationId, setConversationTitle, setMessages, setError, setFailedPrompt, setIsGuestSession]);

  // Listen for global custom events from Sidebar
  useEffect(() => {
    const handleGlobalNewChat = () => handleNewConversation(selectedFarmId);
    const handleGlobalChatDeleted = (e) => {
      if (e.detail?.id === conversationId) {
        handleNewConversation(selectedFarmId);
      }
    };

    window.addEventListener("krishi:new-chat", handleGlobalNewChat);
    window.addEventListener("krishi:chat-deleted", handleGlobalChatDeleted);

    return () => {
      window.removeEventListener("krishi:new-chat", handleGlobalNewChat);
      window.removeEventListener("krishi:chat-deleted", handleGlobalChatDeleted);
    };
  }, [handleNewConversation, conversationId, selectedFarmId]);

  // Send message handler
  const handleSendMessage = useCallback(
    async (textOverride = null, { retry = false } = {}) => {
      const textToSend = typeof textOverride === "string" ? textOverride : inputValue;
      if (!textToSend || !textToSend.trim() || isLoading || sendInFlightRef.current) return;

      sendInFlightRef.current = true;

      if (isListening) stopListening();
      stopTts();

      const userText = textToSend.trim();
      if (!retry) {
        const userMessage = {
          id: `user-${Date.now()}`,
          sender: "user",
          text: userText,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, userMessage]);
        setInputValue("");
      }
      setIsLoading(true);
      setError(null);
      setFailedPrompt("");

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
          loadedConvIdRef.current = data.conversationId;
          if (data.title && !conversationTitle) {
            setConversationTitle(data.title);
          }
          if (isAuthenticated && !urlConversationId) {
            const farmQuery = selectedFarmId ? `&farmId=${encodeURIComponent(selectedFarmId)}` : "";
            window.history.replaceState(null, "", `/assistant?id=${data.conversationId}${farmQuery}`);
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
          observationDate: data.observationDate || null,
          observationLocation: data.observationLocation || null,
          dataQuality: data.dataQuality || null,
          provenance: data.provenance || [],
          limitations: data.limitations || [],
          conversationId: data.conversationId,
          isGuest: data.isGuest,
          guestNotice: data.guestNotice,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setFailedPrompt("");
      } catch (err) {
        console.error("[AssistantPage] Send failed:", err);
        setFailedPrompt(userText);
        setError(
          err.message ||
            (isBn
              ? "বার্তা পাঠাতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।"
              : "An error occurred while sending message. Please try again.")
        );
      } finally {
        sendInFlightRef.current = false;
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
      isBn,
      isListening,
      stopListening,
      stopTts,
      setMessages,
      setInputValue,
      setIsLoading,
      setError,
      setFailedPrompt,
      setConversationId,
      setConversationTitle,
      setIsGuestSession,
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
      title: isBn ? "বৃষ্টিপাতের তথ্য" : "Rainfall Insights",
      subtitle: isBn
        ? `${districtLabelBn}-য় সাম্প্রতিক ও ঐতিহাসিক বৃষ্টিপাতের ধারা কেমন?`
        : `Recent and historical rainfall patterns in ${districtLabel}`,
      query: isBn
        ? `${districtLabelBn}-এ সাম্প্রতিক ও ঐতিহাসিক বৃষ্টিপাতের ধারা কেমন?`
        : `What recent and historical rainfall observations are available for ${districtLabel}?`,
      icon: CloudRain,
      iconColor: "text-sky-600 dark:text-sky-400",
      bgColor: "bg-sky-50 dark:bg-sky-950/60 border border-sky-100 dark:border-sky-900/40",
    },
    {
      id: "moisture",
      title: isBn ? "মাটির আর্দ্রতা" : "Soil Moisture",
      subtitle: isBn
        ? `${districtLabelBn}-র মাটির আর্দ্রতা পরিস্থিতি কেমন?`
        : `Current soil moisture conditions in ${districtLabel}`,
      query: isBn
        ? `${districtLabelBn}-এর মাটির উপরিভাগের আর্দ্রতার বৈধ পর্যবেক্ষণ কী আছে?`
        : `What valid surface soil-moisture observation is available for ${districtLabel}?`,
      icon: Sprout,
      iconColor: "text-emerald-700 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/40",
    },
    {
      id: "aman-mustard",
      title: isBn ? "আমন-সরিষা চাষচক্র" : "Aman-Mustard Rotation",
      subtitle: isBn
        ? "আমন ধানের পর সরিষা কখন লাগানো ভালো?"
        : "Best timing for mustard sowing after Aman harvest",
      query: isBn
        ? "আমন ধানের পর সরিষা কখন লাগানো ভালো?"
        : "What official planting window is listed for mustard after Aman rice?",
      icon: Wheat,
      iconColor: "text-amber-700 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-900/40",
    },
    {
      id: "handoff",
      title: isBn ? "ফসল পরিবর্তনের সময়" : "Handoff Planner",
      subtitle: isBn
        ? "আমন কাটার পর সরিষা বপনের সম্ভাব্য শুকনা সময়"
        : "Optimal dry weather windows for crop transition",
      query: isBn
        ? "আমন কাটার পর সরিষা বপনের সম্ভাব্য শুকনা সময় দেখাও"
        : "Show the possible dry window for sowing mustard after Aman harvest.",
      icon: Calendar,
      iconColor: "text-rose-600 dark:text-rose-400",
      bgColor: "bg-rose-50 dark:bg-rose-950/60 border border-rose-100 dark:border-rose-900/40",
    },
    {
      id: "vegetation",
      title: isBn ? "গাছপালার সবুজত্ব (NDVI)" : "Vegetation Health",
      subtitle: isBn
        ? "আমার এলাকার NDVI বা ফসল স্বাস্থ্য কেমন?"
        : "NDVI greenness and vegetation health in your area",
      query: isBn
        ? "আমার এলাকার মোডিস NDVI/EVI পর্যবেক্ষণ কী আছে?"
        : `What MODIS NDVI/EVI observations are available for ${districtLabel}?`,
      icon: Leaf,
      iconColor: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/40",
    },
    {
      id: "boro-aus",
      title: isBn ? "বোরো-আউশ রূপান্তর" : "Boro-Aus Transition",
      subtitle: isBn
        ? "বোরো থেকে আউশ ফসলের ঐতিহাসিক ফলাফল কী?"
        : "Historical outcomes for Boro to Aus transition",
      query: isBn
        ? "বোরো থেকে আউশ ফসলের ঐতিহাসিক ফলাফল কী?"
        : "What does the historical record show about the Boro-to-Aus transition?",
      icon: Layers,
      iconColor: "text-teal-700 dark:text-teal-400",
      bgColor: "bg-teal-50 dark:bg-teal-950/60 border border-teal-100 dark:border-teal-900/40",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1200px] flex flex-col h-[calc(100dvh-8rem)] sm:h-[calc(100dvh-8.5rem)] overflow-hidden">
      {/* Sleek, Compact Top Toolbar: Ultra-Compact Single-Row Toolbar */}
      {conversationTitle && (
      <div className="shrink-0 mb-3 w-full flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-4 shadow-xs sm:px-6">
        {/* Left: Sparkle Icon + Title + Grounded Badge + Conversation Title */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            {conversationTitle ? (
              isRenaming ? (
                <form onSubmit={handleRenameSubmit} className="inline-flex items-center gap-1.5 ml-1">
                  <input
                    type="text"
                    value={newTitleValue}
                    onChange={(e) => setNewTitleValue(e.target.value)}
                    autoFocus
                    className="rounded-md border border-emerald bg-surface px-2 py-0.5 text-xs text-content focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-2 py-0.5 rounded bg-emerald text-white text-[11px] font-medium cursor-pointer"
                  >
                    {t("assistant.save")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsRenaming(false)}
                    className="p-0.5 rounded text-muted hover:text-content text-[11px] cursor-pointer"
                  >
                    {t("assistant.cancel")}
                  </button>
                </form>
              ) : (
                <span className="inline-flex items-center gap-1 ml-0.5 px-2 py-0.5 rounded-full bg-surface-2 border border-line text-[11px] font-medium text-content max-w-[100px] sm:max-w-[140px] truncate">
                  <span className="truncate">{conversationTitle}</span>
                  {isAuthenticated && (
                    <button
                      type="button"
                      onClick={() => {
                        setNewTitleValue(conversationTitle);
                        setIsRenaming(true);
                      }}
                      title={t("assistant.renameChat")}
                      aria-label={t("assistant.renameChat")}
                      className="text-muted hover:text-emerald transition-colors cursor-pointer shrink-0"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                  )}
                </span>
              )
            ) : null}
          </div>
        </div>


      </div>
      )}



      {/* Main Grid: Left Chat Area & Right Sidebar */}
      <div className="flex-1 min-h-0 flex flex-col w-full overflow-hidden">
        {/* Left Column: Full-Height Chat Area with Contained Scroll */}
        <div className="flex-1 min-w-0 w-full h-full flex flex-col rounded-3xl border border-line/70 bg-surface shadow-xs overflow-hidden transition-all duration-200">
          <header className="flex shrink-0 items-center gap-3 border-b border-line px-4 py-3 sm:px-6">
            <Image src={BRAND_LOGO_SRC} alt="" width={40} height={40} className="h-10 w-10 shrink-0 rounded-xl object-contain" />
            <h1 className="text-lg font-semibold tracking-tight text-content sm:text-xl">{t("assistant.title")}</h1>
          </header>
          {/* Farm-Aware Context Banner */}
          {activeFarm ? (
            <div className="shrink-0 p-3 sm:p-4 pb-0">
              <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 dark:bg-emerald-950/30 p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                    <Tractor className="h-4 w-4" />
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
                  onClick={() => handleFarmSelection("")}
                  className="text-xs text-emerald-700 dark:text-emerald-300 hover:underline shrink-0 font-medium cursor-pointer"
                >
                  {isBn ? "ফিল্টার সরান" : "Clear Filter"}
                </button>
              </div>
            </div>
          ) : null}

          {/* Scrollable Chat / Empty State Container */}
          <div
            ref={chatScrollContainerRef}
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain km-smooth-scroll scroll-smooth p-4 sm:p-5 lg:p-6 space-y-4"
            aria-live="polite"
            aria-relevant="additions text"
          >
            {messages.length === 0 ? (
              /* EMPTY STATE: Clean SaaS Hero Card + Try Asking About */
              <div className="flex flex-col gap-5">
                {/* Hero Card with Crisp Brand Typography & Badges */}
                <div className="relative overflow-hidden rounded-3xl border border-line/70 bg-gradient-to-b from-surface-2/50 to-surface-2/15 dark:from-surface-2/25 dark:to-surface/10 p-6 sm:p-8 text-center shadow-2xs backdrop-blur-xs transition-all duration-300">
                  {/* Centered Content */}
                  <div className="relative z-10 flex flex-col items-center max-w-xl mx-auto py-1">
                    {/* Logo Emblem */}
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface border border-line shadow-xs mb-3">
                      <Image
                        src={BRAND_LOGO_SRC}
                        alt="Krishi Mama Logo"
                        width={48}
                        height={48}
                        unoptimized
                        className="h-12 w-12 object-contain brightness-110 saturate-125"
                      />
                    </div>

                    <h2 className="text-xl sm:text-2xl font-bold text-content tracking-tight">
                      {t("assistant.homePrompt")}
                    </h2>
                    <p className="text-sm font-medium text-muted mt-1">
                      {t("assistant.homePromptSubtitle")}
                    </p>

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
                    <span>{isBn ? "প্রশ্ন করার কিছু উদাহরণ" : "Try asking about"}</span>
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
                          className="flex items-center justify-between gap-3 p-3.5 rounded-2xl border border-line/70 bg-surface hover:border-emerald/40 hover:bg-surface-2/50 hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200 ease-out text-left group cursor-pointer"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${q.bgColor} ${q.iconColor} transition-transform duration-200 group-hover:scale-105 shadow-2xs`}>
                              <IconComponent className="h-4.5 w-4.5" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-content group-hover:text-emerald transition-colors duration-150">
                                {q.title}
                              </div>
                              <div className="text-xs text-muted truncate mt-0.5 max-w-[180px] sm:max-w-[200px]">
                                {q.subtitle}
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted group-hover:text-emerald group-hover:translate-x-0.5 transition-all duration-150 shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              /* ACTIVE CHAT: Message Bubbles */
              <div className="space-y-6">
                {messages.map((msg) => {
                  const isUser = msg.sender === "user";
                  const detailsOpen = Boolean(expandedDetails[msg.id]);

                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 max-w-[92%] lg:max-w-[85%] ${isUser ? "ml-auto justify-end" : "mr-auto justify-start"}`}
                    >
                      {!isUser && (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald border border-emerald-200 dark:border-emerald-800 mt-1 shadow-2xs">
                          <Bot className="h-4 w-4" />
                        </div>
                      )}

                      <div
                        className={`min-w-0 max-w-full flex flex-col rounded-2xl px-5 py-4 text-sm leading-7 sm:px-6 ${
                          isUser
                            ? "bg-forest text-white rounded-tr-md shadow-xs"
                            : "bg-surface border border-line text-content rounded-tl-md shadow-xs"
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

                              {/* Copy response button */}
                              <button
                                type="button"
                                onClick={() => handleCopyMessage(msg.id, msg.text)}
                                title={copiedId === msg.id ? (isBn ? "কপি হয়েছে" : "Copied!") : (isBn ? "কপি করুন" : "Copy text")}
                                aria-label={copiedId === msg.id ? "Copied" : "Copy text"}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium text-muted hover:text-emerald hover:bg-surface-hover transition-colors cursor-pointer"
                              >
                                {copiedId === msg.id ? (
                                  <>
                                    <Check className="h-3 w-3 text-emerald" />
                                    <span>{isBn ? "কপি হয়েছে" : "Copied"}</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3 w-3" />
                                    <span>{isBn ? "কপি" : "Copy"}</span>
                                  </>
                                )}
                              </button>
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
                        <div className="whitespace-pre-line text-sm leading-relaxed [overflow-wrap:anywhere]">{msg.text}</div>

                        {/* Metadata Footer */}
                        {!isUser && (
                          <div className="mt-3 pt-2.5 border-t border-line/60">
                            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
                              {msg.observationDate && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-hover border border-line">
                                  <Calendar className="h-3 w-3 text-emerald" />
                                  <span>{isBn ? "পর্যবেক্ষণ" : "Observed"}: {msg.observationDate}</span>
                                </span>
                              )}

                              {msg.observationLocation && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-hover border border-line">
                                  <MapPin className="h-3 w-3 text-emerald" />
                                  <span>{msg.observationLocation}</span>
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
                                  <span>{isBn ? "উত্তরের ভিত্তি" : "Response basis"}: {msg.dataQuality}</span>
                                </span>
                              )}

                              {(msg.limitations?.length > 0 || msg.provenance?.length > 0) && (
                                <button
                                  type="button"
                                  onClick={() => toggleDetails(msg.id)}
                                  className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-surface-hover hover:bg-line text-[11px] font-medium text-emerald transition-colors ml-auto cursor-pointer"
                                >
                                  <span>{isBn ? "তথ্যসূত্র ও সীমাবদ্ধতা" : "Sources & limitations"}</span>
                                  {detailsOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                </button>
                              )}
                            </div>

                            {detailsOpen && (
                              <div className="mt-2.5 rounded-lg bg-surface-hover/70 p-2.5 text-xs text-muted border border-line space-y-1.5">
                                {msg.provenance && msg.provenance.length > 0 && (
                                  <div className="[overflow-wrap:anywhere]">
                                    <span className="font-semibold text-content">
                                      {isBn ? "উৎস পরিচিতি:" : "Provenance:"}
                                    </span>{" "}
                                    {msg.provenance.join(" • ")}
                                  </div>
                                )}
                                {msg.limitations && msg.limitations.length > 0 && (
                                  <div className="text-[11px] text-amber-700 dark:text-amber-400 [overflow-wrap:anywhere]">
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

            {/* Loading Indicator with Fixed Height and Smooth Pulse (No layout jumps) */}
            {isLoading && (
              <div className="flex gap-3 mr-auto items-center animate-in fade-in duration-200">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald border border-emerald-200 dark:border-emerald-800">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-2.5 rounded-2xl bg-surface border border-line px-4 py-2.5 shadow-2xs h-10">
                  <span className="text-xs text-muted font-medium">
                    {isBn ? "নাসা উপাত্ত বিশ্লেষণ হচ্ছে..." : "Analyzing NASA data..."}
                  </span>
                  <div className="flex items-center gap-1.5 h-3">
                    <span className="h-2 w-2 rounded-full bg-emerald animate-pulse" />
                    <span className="h-2 w-2 rounded-full bg-emerald animate-pulse [animation-delay:150ms]" />
                    <span className="h-2 w-2 rounded-full bg-emerald animate-pulse [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}

            {/* Error Banner */}
            {error && (
              <div role="alert" className="rounded-xl border border-rose-300 bg-rose-50/80 dark:bg-rose-950/20 dark:border-rose-900 p-3 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                <div className="flex-1">
                  <div className="font-semibold">{isBn ? "বার্তা পাঠাতে ব্যর্থ হয়েছে" : "Request Failed"}</div>
                  <div className="mt-0.5">{error}</div>
                </div>
                {failedPrompt ? <button
                  type="button"
                  onClick={() => handleSendMessage(failedPrompt, { retry: true })}
                  className="px-2.5 py-1 bg-rose-600 text-white rounded-md hover:bg-rose-700 transition-colors shrink-0 text-xs font-medium cursor-pointer"
                >
                  {isBn ? "পুনরায় চেষ্টা" : "Retry"}
                </button> : null}
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
          <div className="sticky bottom-0 bg-surface/95 backdrop-blur-md pt-3 mt-3 border-t border-line/80 z-10">
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

        {/* Right: Farm, District, Crop Dropdowns + Dedicated EN/BN Switcher + New Chat Button */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {/* Farm selector (if user has registered farms) */}
          {isAuthenticated && farmsList.length > 0 ? (
            <div className="relative">
              <Tractor className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-emerald" />
              <select
                value={selectedFarmId}
                onChange={(e) => handleFarmSelection(e.target.value)}
                disabled={isLoading}
                aria-label={t("assistant.selectFarm")}
                className="appearance-none rounded-xl border border-line/70 bg-surface-2/60 dark:bg-surface-2/40 pl-6.5 pr-5 h-10 text-xs font-medium text-content hover:border-emerald/40 hover:bg-surface focus:outline-none focus:ring-2 focus:ring-emerald/20 focus:border-emerald transition-all duration-150 cursor-pointer shadow-2xs max-w-[180px] sm:max-w-[240px] truncate"
              >
                <option value="">{t("assistant.allFarmsGeneral")}</option>
                {farmsList.map((f) => (
                  <option key={f._id} value={f._id}>
                    {f.farmName}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted" />
            </div>
          ) : null}
          {isAuthenticated && isFarmsLoading ? (
            <span role="status" className="text-[11px] text-content-muted">{isBn ? "খামার লোড হচ্ছে…" : "Loading farms…"}</span>
          ) : null}
          {isAuthenticated && farmsLoadError ? (
            <button type="button" onClick={() => setFarmReloadCount((count) => count + 1)} className="text-[11px] text-rose-700 dark:text-rose-300 underline">
              {isBn ? "খামার লোড হয়নি · আবার চেষ্টা" : "Farms unavailable · Retry"}
            </button>
          ) : null}
          {isAuthenticated && !isFarmsLoading && !farmsLoadError && farmsList.length === 0 ? (
            <span role="status" className="text-[11px] text-content-muted">{isBn ? "কোনো সংরক্ষিত খামার নেই" : "No saved farms"}</span>
          ) : null}

          {/* Crop selector */}
          <div className="relative">
            <Sprout className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-emerald" />
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              disabled={isLoading}
              aria-label={t("assistant.selectCrop")}
              className="appearance-none rounded-xl border border-line/70 bg-surface-2/60 dark:bg-surface-2/40 pl-6.5 pr-5 h-10 text-xs font-medium text-content hover:border-emerald/40 hover:bg-surface focus:outline-none focus:ring-2 focus:ring-emerald/20 focus:border-emerald transition-all duration-150 cursor-pointer shadow-2xs max-w-[160px] sm:max-w-[200px]"
            >
              {CROPS.map((c) => (
                <option key={c.id} value={c.id}>
                  {isBn ? c.nameBn : c.nameEn}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted" />
          </div>


          {/* New Chat Button */}
          <button
            type="button"
            onClick={() => handleNewConversation(selectedFarmId)}
            className="inline-flex items-center gap-1 rounded-xl bg-forest hover:bg-forest/90 active:scale-[0.98] text-white px-2.5 sm:px-3 h-10 text-xs font-semibold shadow-xs hover:shadow-km-sm transition-all duration-150 cursor-pointer ring-1 ring-white/10 shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="inline">{t("assistant.newChat")}</span>
          </button>
        </div>
            {/* Input form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              aria-busy={isLoading}
              className="relative flex items-end gap-2 p-2.5 rounded-3xl border border-line bg-surface dark:bg-surface focus-within:border-emerald focus-within:ring-2 focus-within:ring-emerald/15 focus-within:bg-surface transition-all duration-200 shadow-2xs hover:border-line"
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
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200 cursor-pointer ${
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

              {/* Textarea: Clean input with localized placeholder */}
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t("assistant.composerPlaceholder")}
                aria-label={t("assistant.composerPlaceholder")}
                rows={1}
                className="flex-1 resize-none bg-transparent py-2 px-2 text-sm text-content focus:outline-none min-h-[44px] max-h-36 leading-relaxed placeholder:text-muted/60"
              />

              {/* Round Send Button */}
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                aria-label={isBn ? "বার্তা পাঠান" : "Send message"}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-200 ${
                  inputValue.trim() && !isLoading
                    ? "bg-emerald text-white hover:bg-emerald/90 active:scale-95 shadow-2xs cursor-pointer scale-100"
                    : "bg-surface-hover text-muted cursor-not-allowed opacity-40 scale-95"
                }`}
              >
                <Send className="h-4 w-4" />
              </button>
            </form>

          </div>
        </div>

      </div>
    </div>
  );
}

function AssistantPage() {
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

export default function ProtectedAssistantPage() {
  return <PrivateAccess><AssistantPage /></PrivateAccess>;
}
