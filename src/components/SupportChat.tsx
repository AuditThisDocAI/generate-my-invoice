import React, { useState, useEffect, useRef } from "react";
import { 
  MessageSquare, 
  X, 
  Send, 
  Sparkles, 
  User, 
  Headphones, 
  Layers,
  Image as ImageIcon,
  Mic,
  Square,
  Play,
  Volume2,
  FileText,
  BadgeAlert,
  Workflow,
  Plus
} from "lucide-react";

export interface SupportMessage {
  id: string;
  sender: "user" | "admin" | "aria";
  senderName: string;
  text: string;
  image?: string; // Optional attached screenshot in base64
  voiceNote?: string; // Optional voice note audio in base64
  timestamp: string;
  userEmail: string;
}

interface SupportChatProps {
  userProfile: any; // UserProfile or null
  isUnlocked: boolean;
  onUpdateDoc: (doc: any) => void;
  onTriggerPDF?: () => void;
  onTriggerPNG?: () => void;
  checkAICredits?: () => boolean;
  deductAICredits?: (amount?: number) => void;
}

// Simple helper to strip document payload blocks from public text display
function cleanTextDisplay(text: string): string {
  if (!text) return "";
  return text.replace(/\[GEN_DOC_JSON_START\][\s\S]*?\[GEN_DOC_JSON_END\]/g, "").trim();
}

// Format double-asterisk bold terms to strong tags so they stand out in larger text
function renderFormattedText(text: string) {
  const cleaned = cleanTextDisplay(text);
  if (!cleaned) return null;
  const parts = cleaned.split(/\*\*([\s\S]*?)\*\*/g);
  return (
    <span>
      {parts.map((part, index) => {
        if (index % 2 === 1) {
          return <strong key={index} className="font-extrabold text-zinc-950">{part}</strong>;
        }
        return part;
      })}
    </span>
  );
}

export default function SupportChat({ 
  userProfile, 
  isUnlocked, 
  onUpdateDoc,
  onTriggerPDF,
  onTriggerPNG,
  checkAICredits,
  deductAICredits
}: SupportChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedVoiceNote, setSelectedVoiceNote] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Voice Recording parameters
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (file.type.startsWith("image/")) {
          setSelectedImage(result);
          setSelectedVoiceNote(null);
        } else if (file.type.startsWith("audio/")) {
          setSelectedVoiceNote(result);
          setSelectedImage(null);
        } else {
          if (/\.(mp3|wav|m4a|webm|ogg)$/i.test(file.name)) {
            setSelectedVoiceNote(result);
            setSelectedImage(null);
          } else {
            setSelectedImage(result);
            setSelectedVoiceNote(null);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const currentUserEmail = userProfile?.email || "guest@auditthisdoc.ai";
  const currentUserName = userProfile?.email ? userProfile.email.split("@")[0] : "Guest User";

  const isActuallyUnlocked = isUnlocked || 
    currentUserEmail.toLowerCase() === "brigittalombard09@gmail.com" || 
    currentUserEmail.toLowerCase() === "info@seolab.co.za";

  const isSoloPlan = userProfile?.paymentTier === "starter";
  const [tokensLeft, setTokensLeft] = useState<number>(() => {
    const saved = localStorage.getItem(`gmi_tokens_left_${currentUserEmail}`);
    return saved ? parseInt(saved, 10) : 1000;
  });

  useEffect(() => {
    if (currentUserEmail) {
      const saved = localStorage.getItem(`gmi_tokens_left_${currentUserEmail}`);
      setTokensLeft(saved ? parseInt(saved, 10) : 1000);
    }
  }, [currentUserEmail, userProfile?.paymentTier]);

  // Load messages from localStorage on mount and when currentUserEmail changes
  useEffect(() => {
    loadMessages();
  }, [currentUserEmail]);

  const loadMessages = () => {
    const raw = localStorage.getItem("gmi_support_chat_messages");
    if (raw) {
      try {
        const allMsgs: SupportMessage[] = JSON.parse(raw);
        // Filter messages for this user
        const safeMsgs = Array.isArray(allMsgs) ? allMsgs : [];
        const filtered = safeMsgs.filter(m => m.userEmail.toLowerCase() === currentUserEmail.toLowerCase());
        
        setMessages(filtered);
      } catch (e) {
        console.error("Failed to parse support messages:", e);
      }
    } else {
      setMessages([]);
    }
  };

  // Listen to cross-tab or storage changes to catch admin replies in real-time
  useEffect(() => {
    const handleStorageChange = () => {
      loadMessages();
    };

    window.addEventListener("storage", handleStorageChange);
    const interval = setInterval(loadMessages, 3000); // Check every 3 seconds for local updates

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [currentUserEmail, currentUserName]);

  // Scroll to bottom when messages open or change
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
      setUnreadCount(0);
    } else {
      // If closed and new messages arrive (e.g. from admin) count them as unread
      const raw = localStorage.getItem("gmi_support_chat_messages");
      if (raw) {
        try {
          const allMsgs: SupportMessage[] = JSON.parse(raw);
          const safeMsgs = Array.isArray(allMsgs) ? allMsgs : [];
          const filtered = safeMsgs.filter(m => m.userEmail.toLowerCase() === currentUserEmail.toLowerCase());
          if (filtered.length > messages.length) {
            const added = filtered.slice(messages.length);
            const adminOrAriaReplies = added.filter(m => m.sender !== "user");
            if (adminOrAriaReplies.length > 0) {
              setUnreadCount(prev => prev + adminOrAriaReplies.length);
            }
          }
        } catch (e) {}
      }
    }
  }, [messages.length, isOpen]);

  // Voice note Recorder logic
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const options = { mimeType: "audio/webm" };
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, options);
      } catch (err) {
        recorder = new MediaRecorder(stream);
      }

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = () => {
          setSelectedVoiceNote(reader.result as string);
        };
        reader.readAsDataURL(audioBlob);

        // stop the audio track recorder to clear hardware indicator lights
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error("Microphone device permissions blocker:", err);
      alert("🎙️ Failed to access microphone. Please check permissions in your browser or make sure your development connection is secure!");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Trigger base64 file selection helper supporting both images and voice files
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (file.type.startsWith("image/")) {
          setSelectedImage(result);
          setSelectedVoiceNote(null);
        } else if (file.type.startsWith("audio/")) {
          setSelectedVoiceNote(result);
          setSelectedImage(null);
        } else {
          // Fallback guess by file name
          if (/\.(mp3|wav|m4a|webm|ogg)$/i.test(file.name)) {
            setSelectedVoiceNote(result);
            setSelectedImage(null);
          } else {
            setSelectedImage(result);
            setSelectedVoiceNote(null);
          }
        }
      };
      reader.readAsDataURL(file);
    }
    // Reset file value to allow uploading same file again if desired
    e.target.value = "";
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !selectedImage && !selectedVoiceNote) return;
    
    if (checkAICredits && !checkAICredits()) return;

    if (isSoloPlan && tokensLeft <= 0) {
      alert("⚠️ Solo AI Limit Reached: Your 1,000 drafting tokens for the Solo plan have been exhausted. Please upgrade to the Pro plan ($199/yr) for unlimited AI drafting and auditing!");
      return;
    }

    const textLower = inputText.toLowerCase();
    let alertReason = "";
    let needsAttention = false;

    if (/refund|chargeback|money\s*back|reimburse/i.test(textLower)) {
      alertReason = "Refund / Chargeback Assistance Requested";
      needsAttention = true;
    } else if (/account|profile|subscription|settings|credentials|password|login|signin|reset|register/i.test(textLower)) {
      alertReason = "Account Support / Access Authorization Issue";
      needsAttention = true;
    } else if (/payout|pay|eft|statement|stripe|capitec|receipt|verification|credits|billing|card|limit/i.test(textLower)) {
      alertReason = "Payment Support & Upgrade Settle Alert";
      needsAttention = true;
    } else if (/support|error|fail|broken|help|trouble|cannot|cant|doesn't|doesnt|bug|assist/i.test(textLower)) {
      alertReason = "Technical Assistance or General Helpdesk Alert";
      needsAttention = true;
    }

    const defaultVoiceText = "Recorded voice message description sent to Aria. 🎙️";
    const userMsg: SupportMessage & { userUid?: string; needsAdminAttention?: boolean; alertReason?: string } = {
      id: "msg-user-" + Date.now(),
      sender: "user",
      senderName: currentUserName,
      text: inputText || (selectedVoiceNote ? defaultVoiceText : "Attached screenshot for invoice replication."),
      image: selectedImage || undefined,
      voiceNote: selectedVoiceNote || undefined,
      timestamp: new Date().toISOString(),
      userEmail: currentUserEmail,
      userUid: userProfile?.uid || "GUEST-ID-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
      needsAdminAttention: needsAttention,
      alertReason: alertReason || undefined
    };

    // Save user message to database
    const raw = localStorage.getItem("gmi_support_chat_messages");
    let allMsgs: any[] = [];
    if (raw) {
      try { 
        allMsgs = JSON.parse(raw); 
        if (!Array.isArray(allMsgs)) allMsgs = [];
      } catch (err) {}
    }
    allMsgs.push(userMsg);
    localStorage.setItem("gmi_support_chat_messages", JSON.stringify(allMsgs));
    setMessages(prev => [...prev, userMsg as any]);
    
    const sentText = inputText;
    const sentImage = selectedImage;
    const sentVoice = selectedVoiceNote;
    
    setInputText("");
    setSelectedImage(null);
    setSelectedVoiceNote(null);
    setIsLoading(true);

    // Call server API for generative AI response from Aria
    try {
      // Keep only last 10 messages for context
      const chatContextHistory = messages.filter(m => m.sender !== "admin").slice(-10);

      const resp = await fetch("/api/ai/aria-support-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: sentText || (sentVoice ? "Please analyze this recorded voice request for invoice details." : "Here is a screenshot layout I want to import."),
          history: chatContextHistory,
          isUnlocked: isActuallyUnlocked,
          email: currentUserEmail,
          image: sentImage,
          voiceNote: sentVoice
        })
      });

      if (resp.ok) {
        const data = await resp.json();
        if (deductAICredits) deductAICredits(5);
        const ariaMsgText = data.text || "";

        // Check for instant generated document JSON payload
        if (ariaMsgText.includes("[GEN_DOC_JSON_START]")) {
          const sIdx = ariaMsgText.indexOf("[GEN_DOC_JSON_START]");
          const eIdx = ariaMsgText.indexOf("[GEN_DOC_JSON_END]");
          if (eIdx > sIdx) {
            const rawJson = ariaMsgText.substring(sIdx + "[GEN_DOC_JSON_START]".length, eIdx).trim();
            try {
              const docPayload = JSON.parse(rawJson);
              if (docPayload && typeof docPayload === "object") {
                // Instantly synchronize into active workspace
                onUpdateDoc(docPayload);
              }
            } catch (err) {
              console.error("Failed to parsed synchronized document:", err);
            }
          }
        }

        // Subtract tokens for Solo plan
        if (isSoloPlan) {
          const wordsUsed = (sentText ? sentText.split(/\s+/).length : 20) + (ariaMsgText ? ariaMsgText.split(/\s+/).length : 50);
          const tokensToSubtract = Math.max(5, Math.ceil(wordsUsed * 1.3));
          setTokensLeft(prev => {
            const nextTokens = Math.max(0, prev - tokensToSubtract);
            localStorage.setItem(`gmi_tokens_left_${currentUserEmail}`, nextTokens.toString());
            return nextTokens;
          });
        }

        const ariaMsg: SupportMessage = {
          id: "msg-aria-" + Date.now(),
          sender: "aria",
          senderName: "Aria",
          text: ariaMsgText,
          timestamp: new Date().toISOString(),
          userEmail: currentUserEmail
        };

        const updatedRaw = localStorage.getItem("gmi_support_chat_messages");
        let currentAll: SupportMessage[] = [];
        if (updatedRaw) {
          try { 
            currentAll = JSON.parse(updatedRaw); 
            if (!Array.isArray(currentAll)) currentAll = [];
          } catch (err) {}
        }
        currentAll.push(ariaMsg);
        localStorage.setItem("gmi_support_chat_messages", JSON.stringify(currentAll));
        setMessages(prev => [...prev, ariaMsg]);
      } else {
        throw new Error('Server returned ' + resp.status);
      }
    } catch (err) {
      console.error("Support chat error:", err);
      const ariaErrorMsg: SupportMessage = {
        id: "msg-aria-" + Date.now(),
        sender: "aria",
        senderName: "Aria",
        text: "I had a tiny connection hiccup! 🌸 My servers are currently under heavy load or syncing. Please try sending your message again in a moment.",
        timestamp: new Date().toISOString(),
        userEmail: currentUserEmail
      };
      setMessages(prev => [...prev, ariaErrorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-12 z-50 no-print font-sans">
      {/* Floating Action Button with support icon and name label */}
      <button
        id="support-chat-button"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Chat with Aria"
        className="group bg-gradient-to-r from-violet-600 to-indigo-650 text-white rounded-full w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer border border-violet-400/20 relative"
      >
        <span className="relative flex h-5 w-5 items-center justify-center shrink-0">
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 bg-red-500 text-white text-[9px] font-black rounded-full items-center justify-center border border-white leading-none shadow-sm animate-bounce">
              {unreadCount}
            </span>
          )}
          <MessageSquare className="w-5 h-5 shrink-0 group-hover:rotate-12 transition-transform" />
        </span>
      </button>

      {/* Chat window viewport */}
      {isOpen && (
        <div 
          id="support-chat-window" 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`absolute bottom-16 right-0 w-[340px] sm:w-[380px] max-w-[calc(100vw-2rem)] h-[440px] sm:h-[480px] max-h-[calc(100vh-120px)] bg-white border rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-scaleUp z-50 transition-all ${
            isDragging ? "border-violet-500 ring-2 ring-violet-500/20" : "border-zinc-200"
          }`}
        >
          {isDragging && (
            <div className="absolute inset-0 bg-violet-600/90 text-white flex flex-col items-center justify-center space-y-2.5 z-50 pointer-events-none animate-fadeIn">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center animate-bounce">
                <Plus className="w-6 h-6 text-zinc-900" />
              </div>
              <p className="font-extrabold text-sm uppercase tracking-wider">Drop Image or Audio File Here</p>
              <p className="text-[10px] text-violet-200 uppercase font-mono font-bold">Aria will analyze it contextually</p>
            </div>
          )}
          
          {/* Header */}
          <div className="bg-white text-zinc-900 px-5 py-4 flex items-center justify-between border-b border-zinc-200 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center text-white shrink-0 relative">
                <Workflow className="w-4 h-4 text-white animate-pulse" />
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border border-zinc-950"></span>
              </div>
              <div>
                <h3 className="font-extrabold text-xs uppercase tracking-wide text-violet-600 flex items-center gap-1">
                  Aria
                </h3>
                <p className="text-[10px] text-zinc-900 font-medium font-mono uppercase tracking-wider">Audit This Doc Assistant</p>
              </div>
            </div>
            <button
              id="support-chat-close"
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-900 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Current user context banner */}
          <div className="bg-zinc-100 border-b border-zinc-200 px-4 py-2 flex items-center justify-between text-[9.5px] text-zinc-900 shrink-0 font-mono font-bold font-sans">
            <span className="truncate max-w-[150px]">👤 {currentUserEmail}</span>
            <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase font-sans font-bold ${
              userProfile?.paymentTier === "starter"
                ? "bg-amber-200 text-amber-900 animate-pulse"
                : isActuallyUnlocked
                ? "bg-violet-200 text-violet-900 animate-pulse"
                : "bg-zinc-300 text-zinc-900"
            }`}>
              {userProfile?.paymentTier === "starter"
                ? `👑 Solo (${tokensLeft.toLocaleString()} tokens)`
                : isActuallyUnlocked
                ? "👑 Premium Pro"
                : "🆓 Free Tier"}
            </span>
          </div>

          {/* Messages scroll content container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/50">
            {messages.map((msg) => {
              const isAdmin = msg.sender === "admin";
              const isAria = msg.sender === "aria";
              
              return (
                <div 
                  key={msg.id} 
                  className={`flex gap-2 max-w-[88%] ${msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 self-start text-[10px] uppercase font-black ${
                    isAdmin ? "bg-amber-200 text-amber-900" :
                    isAria ? "bg-violet-200 text-violet-900 overflow-hidden" :
                    "bg-zinc-300 text-zinc-900"
                  }`}>
                    {isAdmin ? "AD" : isAria ? <span className="text-[16px] leading-[0px] translate-y-[2px]">👩🏼‍🏫</span> : "ME"}
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    <span className="block text-[8.5px] font-mono text-zinc-900 px-0.5 font-bold">
                      {msg.senderName} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div className={`px-3 py-2.5 rounded-2xl text-[13.5px] sm:text-[14px] leading-relaxed font-bold ${
                      msg.sender === "user" 
                        ? "bg-zinc-200 text-zinc-900 rounded-tr-none shadow-xs" 
                        : isAdmin 
                        ? "bg-amber-100 border border-amber-200 text-zinc-900 rounded-tl-none shadow-xs"
                        : "bg-white border border-zinc-300 text-zinc-900 rounded-tl-none shadow-sm"
                    }`}>
                      <p className="whitespace-pre-wrap">{renderFormattedText(msg.text)}</p>
                      
                      {/* Received Voice note playback */}
                      {msg.voiceNote && (
                        <div className="mt-2 p-1.5 bg-zinc-800/10 dark:bg-zinc-100/10 rounded-xl flex flex-col gap-1.5">
                          <div className="flex items-center gap-1.5 text-[8.5px] font-bold text-zinc-550">
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>Voice message playback</span>
                          </div>
                          <audio 
                            src={msg.voiceNote} 
                            controls 
                            className="w-full h-7 rounded-md focus:outline-none" 
                          />
                        </div>
                      )}

                      {/* Attached/received screenshot display */}
                      {msg.image && (
                        <div className="mt-2.5 rounded-lg overflow-hidden border border-zinc-350 bg-zinc-200">
                          <img 
                            src={msg.image} 
                            alt="Screenshot template specification" 
                            className="w-full max-h-48 object-contain cursor-pointer hover:opacity-90 active:scale-[99%] transition-transform" 
                            onClick={() => window.open(msg.image, "_blank")}
                          />
                        </div>
                      )}


                    </div>
                  </div>
                </div>
              );
            })}
            {isLoading && (
              <div className="flex gap-2 max-w-[200px] mr-auto animate-pulse">
                <div className="w-6 h-6 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-violet-500 animate-spin" />
                </div>
                <div className="bg-zinc-100 border border-zinc-200 p-2.5 rounded-2xl text-[10.5px] text-zinc-900 font-semibold rounded-tl-none">
                  Aria is thinking...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Active voice note recorder visualization bar */}
          {isRecording && (
            <div className="px-3.5 py-2.5 bg-rose-50 border-t border-rose-200 flex items-center justify-between shrink-0 animate-pulse">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping"></span>
                <span className="text-[10px] font-black text-rose-800 uppercase tracking-wide">
                  🎙️ Recording Voice Message ({formatRecordingTime(recordingTime)})
                </span>
              </div>
              <button
                type="button"
                onClick={stopRecording}
                className="px-2.5 py-1 text-[8.5px] font-black uppercase text-rose-800 bg-white border border-rose-300 hover:bg-rose-100 rounded-lg cursor-pointer flex items-center gap-1"
              >
                <Square className="w-3 h-3 text-rose-700 fill-rose-700" />
                <span>Stop</span>
              </button>
            </div>
          )}

          {/* Active voice note attachment preview bar */}
          {selectedVoiceNote && !isRecording && (
            <div className="px-3.5 py-2.5 bg-zinc-100 border-t border-zinc-200 flex items-center justify-between shrink-0 animate-scaleUp">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-violet-700">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-zinc-700">Voice Note Attached!</span>
                  <span className="block text-[8px] text-zinc-550">Ready to transcribe and match</span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedVoiceNote(null)} 
                title="Remove image attachment"
                className="p-1 rounded-full bg-zinc-200 hover:bg-rose-100 hover:text-rose-600 text-zinc-700 cursor-pointer transition-all active:scale-95"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Active file upload preview bar */}
          {selectedImage && (
            <div className="px-3.5 py-2.5 bg-zinc-100 border-t border-zinc-200 flex items-center justify-between shrink-0 animate-scaleUp">
              <div className="flex items-center gap-2">
                <img 
                  src={selectedImage} 
                  alt="Screenshot preview" 
                  className="w-9 h-9 rounded-lg border border-zinc-300 object-cover" 
                />
                <div>
                  <span className="block text-[10px] font-bold text-zinc-700">Screenshot Attached!</span>
                  <span className="block text-[8px] text-zinc-500">Ready to replicate invoice style</span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedImage(null)} 
                title="Remove image attachment"
                className="p-1 rounded-full bg-zinc-200 hover:bg-zinc-350 text-zinc-700 cursor-pointer transition-all active:scale-95"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Input Sender Form Footer with file attachments option */}
          <form 
            onSubmit={handleSendMessage} 
            className="p-3 border-t border-zinc-200 bg-white flex gap-1.5 items-center shrink-0"
          >
            {/* Hidden native input file */}
            <input 
              type="file"
              accept="image/*,audio/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            
            {/* Screenshot attachment button */}
            <button
              type="button"
              disabled={isRecording}
              onClick={() => fileInputRef.current?.click()}
              title="Attach invoice screenshot template"
              className="p-2 border border-zinc-250 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 transition-all rounded-xl shrink-0 cursor-pointer flex items-center justify-center disabled:opacity-40"
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            {/* Voice Notes Recorder Trigger Button */}
            {!isRecording ? (
              <button
                type="button"
                onClick={startRecording}
                title="Record voice note description for Aria"
                className="p-2 border border-zinc-250 text-violet-600 hover:bg-violet-50 transition-all rounded-xl shrink-0 cursor-pointer flex items-center justify-center"
              >
                <Mic className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecording}
                title="Stop recording"
                className="p-2 border border-rose-300 bg-rose-550 text-zinc-900 rounded-xl shrink-0 cursor-pointer flex items-center justify-center animate-pulse"
              >
                <Square className="w-4 h-4 shrink-0" />
              </button>
            )}

            <input
              type="text"
              value={inputText}
              disabled={isRecording}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                isRecording 
                  ? "Speaking voice instructions..." 
                  : selectedVoiceNote 
                  ? "Voice note attached! Click send..."
                  : selectedImage 
                  ? "Describe requirements..." 
                  : "Ask Aria or describe your document..."
              }
              className="flex-1 px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all text-zinc-800 font-medium"
            />
            
            <button
              type="submit"
              disabled={(!inputText.trim() && !selectedImage && !selectedVoiceNote) || isLoading || isRecording}
              className="px-3 py-2 bg-violet-600 text-white hover:bg-violet-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer rounded-xl shrink-0 flex items-center justify-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              <span className="text-xs font-bold">Send</span>
            </button>
          </form>

        </div>
      )}
    </div>
  );
}
