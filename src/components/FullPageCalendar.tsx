import React, { useState, useMemo } from "react";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  FileText, 
  Mail, 
  User, 
  DollarSign, 
  SlidersHorizontal,
  Clock, 
  Sparkles, 
  Filter, 
  Inbox, 
  X, 
  Info,
  CalendarDays,
  CalendarRange,
  Zap,
  CheckCircle2,
  AlertCircle,
  HelpCircle
} from "lucide-react";

interface ServiceSchedule {
  id: string;
  clientCompany?: string;
  clientName?: string;
  clientEmail?: string;
  frequency: "weekly" | "biweekly" | "monthly" | "yearly";
  nextRunDate?: string;
  status?: "active" | "paused";
  documentData?: any;
}

interface FullPageCalendarProps {
  recurringSchedules: ServiceSchedule[];
  fetchRecurringSchedules: () => Promise<void>;
  handleShowAlert: (msg: string) => void;
}

// Visual theme configurations for each month (all 12 months)
const MONTHS_THEMES: Record<number, { name: string; bg: string; text: string; bgLight: string; border: string; accent: string }> = {
  0: { name: "January", bg: "bg-blue-600", text: "text-blue-700", bgLight: "bg-blue-50/50", border: "border-blue-200", accent: "#2563eb" },
  1: { name: "February", bg: "bg-pink-500", text: "text-pink-700", bgLight: "bg-pink-50/50", border: "border-pink-200", accent: "#ec4899" },
  2: { name: "March", bg: "bg-indigo-500", text: "text-indigo-700", bgLight: "bg-indigo-50/40", border: "border-indigo-200", accent: "#6366f1" },
  3: { name: "April", bg: "bg-rose-500", text: "text-rose-700", bgLight: "bg-rose-50/50", border: "border-rose-200", accent: "#f43f5e" },
  4: { name: "May", bg: "bg-teal-500", text: "text-teal-700", bgLight: "bg-teal-50/50", border: "border-teal-200", accent: "#14b8a6" },
  5: { name: "June", bg: "bg-amber-500", text: "text-amber-700", bgLight: "bg-amber-50/55", border: "border-amber-200", accent: "#f59e0b" },
  6: { name: "July", bg: "bg-sky-500", text: "text-sky-700", bgLight: "bg-sky-50/50", border: "border-sky-200", accent: "#0ea5e9" },
  7: { name: "August", bg: "bg-orange-500", text: "text-orange-700", bgLight: "bg-orange-50/50", border: "border-orange-200", accent: "#f97316" },
  8: { name: "September", bg: "bg-emerald-600", text: "text-emerald-700", bgLight: "bg-emerald-50/50", border: "border-emerald-250", accent: "#059669" },
  9: { name: "October", bg: "bg-violet-600", text: "text-violet-700", bgLight: "bg-violet-50/40", border: "border-violet-200", accent: "#7c3aed" },
  10: { name: "November", bg: "bg-fuchsia-600", text: "text-fuchsia-100", bgLight: "bg-fuchsia-50/50", border: "border-fuchsia-200", accent: "#c026d3" },
  11: { name: "December", bg: "bg-cyan-600", text: "text-cyan-700", bgLight: "bg-cyan-50/50", border: "border-cyan-200", accent: "#0891b2" },
};

export default function FullPageCalendar({ 
  recurringSchedules, 
  fetchRecurringSchedules, 
  handleShowAlert 
}: FullPageCalendarProps) {
  const [viewMode, setViewMode] = useState<"monthly_grid" | "multi_month_board" | "linear_forecast">("monthly_grid");
  const [targetYear, setTargetYear] = useState<number>(2026);
  const [targetMonth, setTargetMonth] = useState<number>(5); // Default to June (0-indexed 5)
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedForecast, setSelectedForecast] = useState<any | null>(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState<boolean>(false);
  const [isSimulatingTrigger, setIsSimulatingTrigger] = useState<boolean>(false);

  // Today reference
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Set initial year and month to current date if possible
  React.useEffect(() => {
    const now = new Date();
    setTargetYear(now.getFullYear());
    setTargetMonth(now.getMonth());
  }, []);

  // Fast helper to compute sum total amount for documents
  const getScheduleValue = (sched: ServiceSchedule) => {
    const docData = sched.documentData || {};
    const items = docData.items || [];
    return items.reduce((acc: number, it: any) => acc + (it.rate || 0) * (it.quantity || 0), 0) || 0;
  };

  // Generate 12-month projections safely for recurring schedules
  const allProjections = useMemo(() => {
    const list: any[] = [];
    if (!recurringSchedules || recurringSchedules.length === 0) return list;

    // Start of projection: dynamic start of current year up to end of next year for broad foresight
    const startProj = new Date(targetYear - 1, 0, 1);
    const endProj = new Date(targetYear + 1, 11, 31);

    for (const sched of recurringSchedules) {
      let runDate = new Date(sched.nextRunDate || new Date());
      if (isNaN(runDate.getTime())) {
        runDate = new Date();
      }
      runDate.setHours(0, 0, 0, 0);

      const freq = sched.frequency || "monthly";
      let count = 0;
      
      // Limit iterations to prevent heavy compute
      while (count < 100) {
        if (runDate > endProj) {
          break;
        }

        if (runDate >= startProj) {
          list.push({
            id: `${sched.id}-${runDate.getTime()}-${count}`,
            date: new Date(runDate),
            dateStr: runDate.toISOString().split("T")[0],
            monthIdx: runDate.getMonth(),
            year: runDate.getFullYear(),
            dayOfMonth: runDate.getDate(),
            schedule: sched,
            estimatedValue: getScheduleValue(sched)
          });
        }

        // Advance date
        if (freq === "weekly") {
          runDate.setDate(runDate.getDate() + 7);
        } else if (freq === "biweekly") {
          runDate.setDate(runDate.getDate() + 14);
        } else if (freq === "monthly") {
          runDate.setMonth(runDate.getMonth() + 1);
        } else if (freq === "yearly") {
          runDate.setFullYear(runDate.getFullYear() + 1);
        } else {
          runDate.setDate(runDate.getDate() + 30);
        }
        count++;
      }
    }

    return list.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [recurringSchedules, targetYear]);

  // Highlighted filter list based on search terms
  const filteredProjections = useMemo(() => {
    return allProjections.filter(p => {
      const q = searchQuery.toLowerCase();
      if (!q) return true;
      const comp = (p.schedule.clientCompany || "").toLowerCase();
      const n = (p.schedule.clientName || "").toLowerCase();
      const em = (p.schedule.clientEmail || "").toLowerCase();
      const f = (p.schedule.frequency || "").toLowerCase();
      return comp.includes(q) || n.includes(q) || em.includes(q) || f.includes(q);
    });
  }, [allProjections, searchQuery]);

  // Compute stats for current year/month
  const statistics = useMemo(() => {
    // Current selected Month stats
    const currentMonthProjs = filteredProjections.filter(p => p.monthIdx === targetMonth && p.year === targetYear);
    const totalCurrentMonthValue = currentMonthProjs.reduce((acc, p) => acc + (p.estimatedValue || 0), 0);
    const totalActiveCurrentMonth = currentMonthProjs.filter(p => p.schedule.status !== "paused").length;
    const totalPausedCurrentMonth = currentMonthProjs.filter(p => p.schedule.status === "paused").length;

    // Upcoming year totals
    const futureProjs = filteredProjections.filter(p => p.date >= today);
    const next12MonthsProjs = filteredProjections.filter(p => p.date >= today && p.date <= new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000));
    const annualProjectedValue = next12MonthsProjs.reduce((acc, p) => acc + (p.estimatedValue || 0), 0);

    return {
      currentMonthCount: currentMonthProjs.length,
      currentMonthValue: totalCurrentMonthValue,
      currentMonthActive: totalActiveCurrentMonth,
      currentMonthPaused: totalPausedCurrentMonth,
      annualProjectedValue,
      totalForecastCount: futureProjs.length
    };
  }, [filteredProjections, targetMonth, targetYear, today]);

  // Calendar dates representation logic with complete grid elements for target Month & Year
  const currentMonthGrid = useMemo(() => {
    // Determine target month start
    const firstDay = new Date(targetYear, targetMonth, 1);
    const startingDayOfWeek = firstDay.getDay(); // 0 is Sunday, 1 is Monday ...

    // Last day of target month
    const lastDayCurrent = new Date(targetYear, targetMonth + 1, 0);
    const totalDaysCurrentMonth = lastDayCurrent.getDate();

    const days: { date: Date; dateStr: string; isCurrentMonth: boolean; monthIdx: number; year: number }[] = [];

    // 1. Padding from previous month
    const prevMonthEnd = new Date(targetYear, targetMonth, 0);
    const totalDaysPrevMonth = prevMonthEnd.getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const day = totalDaysPrevMonth - i;
      const d = new Date(targetYear, targetMonth - 1, day);
      days.push({
        date: d,
        dateStr: d.toISOString().split("T")[0],
        isCurrentMonth: false,
        monthIdx: d.getMonth(),
        year: d.getFullYear()
      });
    }

    // 2. Current Month days
    for (let i = 1; i <= totalDaysCurrentMonth; i++) {
      const d = new Date(targetYear, targetMonth, i);
      days.push({
        date: d,
        dateStr: d.toISOString().split("T")[0],
        isCurrentMonth: true,
        monthIdx: targetMonth,
        year: targetYear
      });
    }

    // 3. Padding from next month to make perfectly balanced 6 rows of 7 days (42 cells always, avoids fluctuating layouts!)
    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      const d = new Date(targetYear, targetMonth + 1, i);
      days.push({
        date: d,
        dateStr: d.toISOString().split("T")[0],
        isCurrentMonth: false,
        monthIdx: d.getMonth(),
        year: d.getFullYear()
      });
    }

    return days;
  }, [targetMonth, targetYear]);

  // Multi-Month Board layout: generates months sequence for simpler viewing
  const multiMonthSequence = useMemo(() => {
    const list = [];
    // Generate 6 consecutive months starting from targetMonth
    for (let i = 0; i < 6; i++) {
      let m = targetMonth + i;
      let y = targetYear;
      if (m > 11) {
        m = m % 12;
        y = targetYear + Math.floor((targetMonth + i) / 12);
      }
      
      // Calculate month days grid
      const monthFirstDay = new Date(y, m, 1);
      const startDayOfWeek = monthFirstDay.getDay();
      const monthLastDay = new Date(y, m + 1, 0);
      const totalDays = monthLastDay.getDate();

      const days = [];
      // Prep blank padding cells
      for (let p = 0; p < startDayOfWeek; p++) {
        days.push(null);
      }
      // Actual days
      for (let d = 1; d <= totalDays; d++) {
        days.push(new Date(y, m, d));
      }

      list.push({
        monthIdx: m,
        year: y,
        theme: MONTHS_THEMES[m] || MONTHS_THEMES[0],
        days
      });
    }
    return list;
  }, [targetMonth, targetYear]);

  // Linear groups for dispatch list view
  const linearForecastGroups = useMemo(() => {
    const groups: Record<string, any[]> = {};
    const futureProjs = filteredProjections.filter(p => p.date >= today);

    for (const p of futureProjs) {
      const key = `${p.year}-${String(p.monthIdx).padStart(2, "0")}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(p);
    }

    return Object.keys(groups).sort().map(key => {
      const [year, monthStr] = key.split("-");
      const monthIdx = parseInt(monthStr, 10);
      return {
        key,
        year: parseInt(year, 10),
        monthIdx,
        theme: MONTHS_THEMES[monthIdx] || MONTHS_THEMES[0],
        dispatches: groups[key]
      };
    });
  }, [filteredProjections, today]);

  // Adjust Month handler
  const handlePrevMonth = () => {
    if (targetMonth === 0) {
      setTargetMonth(11);
      setTargetYear(prev => prev - 1);
    } else {
      setTargetMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (targetMonth === 11) {
      setTargetMonth(0);
      setTargetYear(prev => prev + 1);
    } else {
      setTargetMonth(prev => prev + 1);
    }
  };

  // Switch Specific Status Live Handler
  const toggleDispatchStatus = async (schedId: string, currentStatus: string) => {
    setIsTogglingStatus(true);
    try {
      const res = await fetch(`/api/recurring/${schedId}/toggle`, {
        method: "PATCH"
      });
      if (res.ok) {
        handleShowAlert(
          currentStatus !== "paused" 
            ? "🛑 Automated repeating billing paused successfully!" 
            : "⚡ Automated repeating billing resumed active dispatch!"
        );
        
        await fetchRecurringSchedules();
        
        // Refresh selected forecast modal state inline
        if (selectedForecast && selectedForecast.schedule.id === schedId) {
          setSelectedForecast(prev => {
            if (!prev) return null;
            return {
              ...prev,
              schedule: {
                ...prev.schedule,
                status: prev.schedule.status === "paused" ? "active" : "paused"
              }
            };
          });
        }
      } else {
        handleShowAlert("❌ Failed modifying recurring status");
      }
    } catch (err) {
      handleShowAlert("❌ Connection error editing schedule status.");
    } finally {
      setIsTogglingStatus(false);
    }
  };

  // Simulate instant forecast execution trigger
  const runSimulatedDispatchNow = async (sched: ServiceSchedule, dateStr: string) => {
    setIsSimulatingTrigger(true);
    try {
      const res = await fetch(`/api/recurring/${sched.id}/trigger`, {
        method: "POST"
      });
      if (res.ok) {
        handleShowAlert(`🚀 Simulation Succeeded: Created fresh recurring invoice on behalf of "${sched.clientCompany}" mapped to target run ${dateStr}!`);
        await fetchRecurringSchedules();
        setSelectedForecast(null);
      } else {
        const errorData = await res.json();
        handleShowAlert(`❌ Simulation trigger failed: ${errorData.error || "Server issue"}`);
      }
    } catch (err) {
      handleShowAlert("❌ Network error attempting repeat projection.");
    } finally {
      setIsSimulatingTrigger(false);
    }
  };

  const selectedTheme = MONTHS_THEMES[targetMonth] || MONTHS_THEMES[0];
  const daysOfWeekHeader = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const daysOfWeekShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div id="full-page-invoice-dispatch-calendar" className="min-h-screen bg-slate-50/70 p-4 md:p-8 space-y-6 font-sans">
      
      {/* Upper Brand Jumbotron & Controls */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-2xs flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-150 rounded-full text-indigo-700">
            <CalendarIcon className="w-3.5 h-3.5" />
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider font-mono">Foresight Operations Center</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-950 tracking-tight flex items-center gap-2">
            Automated Dispatch Forecast Calendar
          </h1>
          <p className="text-zinc-500 text-xs sm:text-[13px] leading-relaxed">
            Observe, toggle, and trigger pending electronic invoices in a centralized operational layout. Highlighting adjacent and changing months ensures absolute visibility for long-term cash flow planning.
          </p>
        </div>

        {/* View selection controls */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="bg-zinc-100 p-1.5 rounded-2xl flex gap-1 border border-zinc-200">
            <button
              onClick={() => setViewMode("monthly_grid")}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${viewMode === "monthly_grid" ? "bg-white text-zinc-950 shadow-xs border border-zinc-200" : "text-zinc-500 hover:text-zinc-805"}`}
            >
              <CalendarDays className="w-4 h-4 text-indigo-600" />
              <span>Monthly Planner</span>
            </button>
            <button
              onClick={() => setViewMode("multi_month_board")}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${viewMode === "multi_month_board" ? "bg-white text-zinc-950 shadow-xs border border-zinc-200" : "text-zinc-500 hover:text-zinc-805"}`}
            >
              <CalendarRange className="w-4 h-4 text-violet-600" />
              <span>Multi-Month Board</span>
            </button>
            <button
              onClick={() => setViewMode("linear_forecast")}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${viewMode === "linear_forecast" ? "bg-white text-zinc-950 shadow-xs border border-zinc-200" : "text-zinc-500 hover:text-zinc-805"}`}
            >
              <SlidersHorizontal className="w-4 h-4 text-rose-500" />
              <span>Timeline view</span>
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Indicator Blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Stat block 1 */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-4.5 flex items-center justify-between shadow-2xs">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider block font-mono">Current Month Runs ({selectedTheme.name})</span>
            <p className="text-2xl font-black text-zinc-950 tracking-tight leading-none">
              {statistics.currentMonthCount} <span className="text-xs text-zinc-400 font-normal">items</span>
            </p>
            <div className="flex gap-2 text-[10px] font-bold mt-1">
              <span className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded-md border border-emerald-100">{statistics.currentMonthActive} active</span>
              <span className="text-amber-700 bg-amber-50 px-1 py-0.5 rounded-md border border-amber-100">{statistics.currentMonthPaused} paused</span>
            </div>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-700 rounded-2xl shrink-0">
            <CalendarIcon className="w-6 h-6" />
          </div>
        </div>

        {/* Stat block 2 */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-4.5 flex items-center justify-between shadow-2xs">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider block font-mono">Current Month Value ({selectedTheme.name})</span>
            <p className="text-2xl font-black text-zinc-950 tracking-tight leading-none">
              ${statistics.currentMonthValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-indigo-600 font-extrabold flex items-center gap-0.5 pt-1">
              <Sparkles className="w-3.5 h-3.5" /> High-volume automated pipeline
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Stat block 3 */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-4.5 flex items-center justify-between shadow-2xs">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider block font-mono">365-Day Projected Value</span>
            <p className="text-2xl font-black text-zinc-950 tracking-tight leading-none">
              ${statistics.annualProjectedValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-zinc-500 font-medium">Predicted rolling pipeline earnings</p>
          </div>
          <div className="p-3 bg-violet-50 text-violet-700 rounded-2xl shrink-0">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Stat block 4 */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-4.5 flex items-center justify-between shadow-2xs">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider block font-mono">Continuous Forecasts</span>
            <p className="text-2xl font-black text-emerald-800 tracking-tight leading-none">
              {statistics.totalForecastCount} <span className="text-xs text-zinc-400 font-normal">predicted iterations</span>
            </p>
            <p className="text-[10px] text-zinc-500 font-medium font-sans">Active billing cron configurations</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-700 rounded-2xl shrink-0">
            <Zap className="w-6 h-6 animate-pulse" />
          </div>
        </div>

      </div>

      {/* Main search and date jumping controls */}
      <div className="bg-white border border-zinc-250 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4.5 shadow-2xs">
        
        {/* Left side: month selector in grid view */}
        <div className="flex items-center gap-2 scrollbar-none">
          <button
            onClick={handlePrevMonth}
            className="p-2 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-xl transition-all cursor-pointer text-zinc-700 hover:text-zinc-950 active:scale-95"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-sm font-black text-zinc-950 tracking-tight px-3 py-1 font-sans min-w-[130px] text-center bg-zinc-50 border border-zinc-200 rounded-xl leading-relaxed uppercase">
            {selectedTheme.name} {targetYear}
          </span>

          <button
            onClick={handleNextMonth}
            className="p-2 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-xl transition-all cursor-pointer text-zinc-700 hover:text-zinc-950 active:scale-95"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Quick jump drop downs */}
          <div className="hidden sm:flex items-center gap-1.5 ml-2 pl-3 border-l border-zinc-200">
            <select
              value={targetMonth}
              onChange={(e) => setTargetMonth(parseInt(e.target.value, 10))}
              className="px-2.5 py-1 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-700 font-bold focus:outline-hidden focus:border-indigo-400"
            >
              {Object.keys(MONTHS_THEMES).map(k => (
                <option key={k} value={k}>{MONTHS_THEMES[parseInt(k, 10)].name}</option>
              ))}
            </select>
            
            <select
              value={targetYear}
              onChange={(e) => setTargetYear(parseInt(e.target.value, 10))}
              className="px-2.5 py-1 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-700 font-bold focus:outline-hidden focus:border-indigo-400"
            >
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
              <option value="2028">2028</option>
            </select>
          </div>
        </div>

        {/* Right side search bar */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-zinc-400" />
          </span>
          <input
            type="text"
            placeholder="Search by company, client name, email or cycle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-9 pr-4 py-2.5 text-xs font-medium text-zinc-900 bg-zinc-50 border border-zinc-200 hover:border-zinc-300 rounded-xl placeholder-zinc-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-650"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────── */}
      {/* SECTION 1: DETAILED MONTHLY GRID PLANNER                 */}
      {/* ──────────────────────────────────────────────────────── */}
      {viewMode === "monthly_grid" && (
        <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-xs">
          
          {/* Day name column labels */}
          <div className="grid grid-cols-7 border-b border-zinc-150 bg-zinc-50/50">
            {daysOfWeekHeader.map((d, index) => (
              <div key={index} className="py-3 text-center border-r border-zinc-150/60 last:border-r-0">
                <span className="hidden md:inline text-[10px] font-black uppercase tracking-wider text-zinc-500 font-mono">
                  {d}
                </span>
                <span className="md:hidden text-[9.5px] font-black uppercase tracking-wider text-zinc-500 font-mono">
                  {daysOfWeekShort[index]}
                </span>
              </div>
            ))}
          </div>

          {/* Actual grid slots (42 unified cells to prevent layout redraw) */}
          <div className="grid grid-cols-7 bg-zinc-100/40 gap-px">
            {currentMonthGrid.map((cell, idx) => {
              const cellTheme = MONTHS_THEMES[cell.monthIdx] || MONTHS_THEMES[0];
              const isToday = cell.dateStr === today.toISOString().split("T")[0];
              const inSelectedMonth = cell.isCurrentMonth;
              
              // Filter projections matching this cell's layout
              const cellProjections = filteredProjections.filter(p => p.dateStr === cell.dateStr);
              const hasItems = cellProjections.length > 0;
              const hasActiveItems = cellProjections.some(p => p.schedule.status !== "paused");

              return (
                <div 
                  key={idx}
                  className={`min-h-[105px] sm:min-h-[140px] p-2 bg-white flex flex-col justify-between transition-all relative group/cell hover:bg-zinc-50/70 border-r border-b border-zinc-150/50 ${
                    !inSelectedMonth 
                      ? "opacity-45 bg-zinc-50/40 text-slate-400" 
                      : "text-zinc-950"
                  } ${isToday ? "ring-2 ring-indigo-600 ring-inset bg-indigo-50/5 hover:bg-indigo-50/15" : ""}`}
                >
                  
                  {/* Day header indicator */}
                  <div className="flex items-center justify-between mb-1">
                    <span 
                      className={`text-xs font-black font-mono tracking-tight px-1.5 py-0.5 rounded-md ${
                        isToday 
                          ? "bg-indigo-600 text-white" 
                          : inSelectedMonth
                            ? "text-zinc-850"
                            : "text-zinc-400 bg-zinc-100/60"
                      }`}
                    >
                      {cell.date.getDate()}
                    </span>
                    
                    {/* Month Label Badge on month boundary changes: EXTREMELY CLEAR HIGHLIGHTING of different months! */}
                    {!inSelectedMonth && (
                      <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 tracking-wider rounded-md ${cellTheme.bgLight} ${cellTheme.text} border ${cellTheme.border} font-mono`}>
                        {cellTheme.name.slice(0, 3)}
                      </span>
                    )}

                    {isToday && (
                      <span className="text-[7.5px] font-black uppercase bg-indigo-100 text-indigo-700 px-1 py-0.5 rounded font-mono">
                        TODAY
                      </span>
                    )}
                  </div>

                  {/* Cell list of upcoming recurring dispatches */}
                  <div className="flex-1 space-y-1 overflow-y-auto max-h-[85px] sm:max-h-[100px] scrollbar-none pt-1">
                    {cellProjections.map((p, pIdx) => {
                      const isPaused = p.schedule.status === "paused";
                      return (
                        <div
                          key={p.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedForecast(p);
                          }}
                          className={`text-[9.5px] sm:text-[10px] leading-tight p-1.5 rounded-lg border text-left cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between space-y-0.5 relative overflow-hidden ${
                            isPaused 
                              ? "bg-amber-50/40 border-amber-200/65 text-amber-900/80 saturate-75"
                              : "bg-emerald-50/50 hover:bg-emerald-50 border-emerald-250 text-emerald-950"
                          }`}
                        >
                          {/* Accent left column strip */}
                          <div className={`absolute top-0 bottom-0 left-0 w-1 ${
                            isPaused ? "bg-amber-400" : "bg-emerald-500"
                          }`}></div>

                          <div className="pl-1.5">
                            <p className="font-extrabold truncate max-w-[150px]">
                              {p.schedule.clientCompany || "Unnamed Client"}
                            </p>
                            <div className="flex items-center justify-between mt-0.5 flex-wrap gap-0.5 text-[8.5px] font-mono text-zinc-500">
                              <span>
                                {p.schedule.frequency}
                              </span>
                              <span className="font-extrabold text-neutral-900">
                                ${p.estimatedValue.toFixed(0)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Empty cell spacer click listener to clear or inform */}
                  {!hasItems && (
                    <div className="flex-1 cursor-default text-[9.5px] text-zinc-350 flex items-center justify-center font-mono opacity-0 group-hover/cell:opacity-100 transition-opacity">
                      No dispatches
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick instructions / Legend bar */}
          <div className="bg-zinc-50 border-t border-zinc-200 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-zinc-500 font-bold">
            <div className="flex flex-wrap gap-x-4 gap-y-2 items-center">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-indigo-600"></span> Today Indicator
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-emerald-100 border border-emerald-300"></span> Active Automated Forecast
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-amber-55 border border-amber-200"></span> Paused Schedule Forecast
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-[9px] font-extrabold uppercase px-1 py-0.5 bg-sky-50 border border-sky-150 text-sky-700 rounded font-mono">Jul</span> Padded Adjacent Month Marker
              </span>
            </div>
            <span>Double click or click any dispatch card to trigger audit overrides, resume schedules, or force instant invoice creation.</span>
          </div>

        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* SECTION 2: MULTI-MONTH INTERACTIVE PLANNER BOARD         */}
      {/* ──────────────────────────────────────────────────────── */}
      {viewMode === "multi_month_board" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {multiMonthSequence.map(({ monthIdx, year, theme, days }) => {
            // Find all dispatches projected for this specific month
            const monthDispatches = filteredProjections.filter(p => p.monthIdx === monthIdx && p.year === year);
            const activeDispatches = monthDispatches.filter(p => p.schedule.status !== "paused");
            const pausedDispatches = monthDispatches.filter(p => p.schedule.status === "paused");
            const projectedSum = monthDispatches.reduce((acc, p) => acc + (p.estimatedValue || 0), 0);

            return (
              <div 
                key={`${year}-${monthIdx}`}
                className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-2xs flex flex-col hover:border-zinc-300 hover:shadow-xs transition-all relative"
              >
                {/* Accent top boundary banner line of target month */}
                <div className={`h-2 ${theme.bg}`}></div>

                {/* Header overview area */}
                <div className="p-4 bg-zinc-50/50 border-b border-zinc-150 flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm text-zinc-950 uppercase tracking-tight flex items-center gap-2">
                      {theme.name} <span className="text-zinc-650 font-normal">{year}</span>
                    </h3>
                    <p className="text-[10px] text-zinc-550 font-mono mt-0.5 font-bold">
                      {activeDispatches.length} active dispatches | {pausedDispatches.length} paused
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2.5 py-1 text-[11px] font-black font-mono leading-none rounded-xl ${theme.bgLight} ${theme.text} border ${theme.border}`}>
                      ${projectedSum.toFixed(0)}
                    </span>
                  </div>
                </div>

                {/* Miniature Month Grid Body */}
                <div className="p-4 flex-1">
                  <div className="grid grid-cols-7 gap-1 text-center mb-1 pb-1.5 border-b border-zinc-100">
                    {daysOfWeekShort.map((lbl, idx) => (
                      <span key={idx} className="text-[8.5px] font-black text-zinc-400 uppercase tracking-wider block font-mono">
                        {lbl.slice(0, 1)}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {days.map((day, idx) => {
                      if (!day) {
                        return <div key={`empty-${idx}`} className="h-6 sm:h-8 rounded bg-zinc-50/30"></div>;
                      }

                      const dateStr = day.toISOString().split("T")[0];
                      const isToday = dateStr === today.toISOString().split("T")[0];
                      
                      // Filter dispatches for this day
                      const dayProjs = monthDispatches.filter(p => p.dateStr === dateStr);
                      const hasDayProjs = dayProjs.length > 0;
                      const hasActiveDayProjs = dayProjs.some(p => p.schedule.status !== "paused");

                      return (
                        <div 
                          key={idx}
                          onClick={() => {
                            if (hasDayProjs) {
                              setSelectedForecast(dayProjs[0]);
                            }
                          }}
                          className={`h-6 sm:h-8 rounded-lg flex flex-col justify-center items-center text-[10px] font-bold font-mono transition-all relative ${
                            isToday
                              ? "bg-indigo-650 text-white font-extrabold shadow-sm ring-1 ring-indigo-500 scale-[1.05]"
                              : hasDayProjs
                                ? hasActiveDayProjs
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 hover:scale-[1.03] cursor-pointer"
                                  : "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 hover:scale-[1.03] cursor-pointer"
                                : "bg-white border border-zinc-150/45 hover:bg-zinc-50 hover:text-zinc-900 text-zinc-505"
                          }`}
                          title={hasDayProjs ? `${dayProjs.length} recurring billing dispatches scheduled` : undefined}
                        >
                          <span>{day.getDate()}</span>
                          
                          {/* Miniature Dot Indicator */}
                          {hasDayProjs && !isToday && (
                            <span className={`absolute bottom-0.5 w-1 h-1 rounded-full ${
                              hasActiveDayProjs ? "bg-emerald-650 animate-pulse" : "bg-amber-400"
                            }`}></span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom specific dispatches previews list inside month card */}
                {monthDispatches.length > 0 ? (
                  <div className="border-t border-zinc-150 px-4 py-3 bg-zinc-50/45 max-h-[170px] overflow-y-auto scrollbar-none gap-2 space-y-1.5">
                    {monthDispatches.slice(0, 4).map((p) => {
                      const isPaused = p.schedule.status === "paused";
                      return (
                        <div
                          key={p.id}
                          onClick={() => setSelectedForecast(p)}
                          className={`flex items-center justify-between text-[10px] p-2 rounded-xl border cursor-pointer hover:bg-white transition-all ${
                            isPaused 
                              ? "bg-amber-50/30 border-amber-150 text-amber-805/80" 
                              : "bg-white border-zinc-200 hover:border-indigo-400"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isPaused ? "bg-amber-400" : "bg-emerald-500 animate-pulse"}`}></span>
                            <span className="font-extrabold text-zinc-900 truncate max-w-[120px]">
                              {p.schedule.clientCompany || "Unnamed Client"}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 font-mono shrink-0">
                            <span className="text-[9px] bg-zinc-100 px-1 py-0.5 rounded text-zinc-500 font-bold">
                              {p.date.getDate()}rd
                            </span>
                            <span className="font-black text-zinc-900">
                              ${p.estimatedValue.toFixed(0)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {monthDispatches.length > 4 && (
                      <div className="text-center">
                        <button
                          onClick={() => {
                            setTargetMonth(monthIdx);
                            setTargetYear(year);
                            setViewMode("monthly_grid");
                          }}
                          className="text-[9.5px] font-mono text-indigo-650 hover:text-indigo-805 font-black uppercase text-center"
                        >
                          + {monthDispatches.length - 4} more dispatches. View grid →
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="border-t border-zinc-150 px-4 py-6.5 text-center bg-zinc-50/30 text-[10px] text-zinc-400 font-mono">
                    No predicted dispatches
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* SECTION 3: LINEAR RUN OCCURRENCES FORECAST VIEW         */}
      {/* ──────────────────────────────────────────────────────── */}
      {viewMode === "linear_forecast" && (
        <div className="bg-white border border-zinc-250 rounded-3xl overflow-hidden shadow-xs">
          
          <div className="px-5 py-4 border-b border-zinc-200 bg-zinc-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-black text-zinc-900 uppercase tracking-widest font-mono">12-Month Chronological Run Forecaster</h3>
              <p className="text-[10.5px] text-zinc-500">Continuous cron iteration projection mapped by month timeline</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-zinc-650">
                Future timeline items found: <span className="font-extrabold font-mono text-indigo-700">{filteredProjections.filter(p => p.date >= today).length} occurrences</span>
              </span>
            </div>
          </div>

          <div className="p-5 md:p-6.5 space-y-8 max-h-[700px] overflow-y-auto">
            {linearForecastGroups.length === 0 ? (
              <div className="text-center py-16 text-zinc-500">
                <Inbox className="w-10 h-10 text-zinc-300 mx-auto stroke-[1.5] mb-2 animate-bounce" />
                <p className="text-xs font-bold font-mono">No matching forecasted pipeline items.</p>
                <p className="text-[10px] text-zinc-400 mt-1">Refine your search parameters or check repeating active schedules.</p>
              </div>
            ) : (
              linearForecastGroups.map((group) => (
                <div key={group.key} className="space-y-3.5">
                  <div className="flex items-center gap-3">
                    <span className={`px-3.5 py-1 text-xs font-black uppercase tracking-widest rounded-xl ${group.theme.bgLight} ${group.theme.text} border ${group.theme.border} leading-none font-mono flex items-center gap-1.5`}>
                      <span className={`w-2 h-2 rounded-full ${group.theme.bg} leading-none`}></span>
                      {group.theme.name} {group.year}
                    </span>
                    <div className="flex-1 h-px bg-zinc-200"></div>
                    <span className="text-[10px] font-mono font-bold text-zinc-500 pr-2">
                      {group.dispatches.length} dispatch{group.dispatches.length > 1 ? "es" : ""} projected
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pl-1">
                    {group.dispatches.map((disp) => {
                      const isPaused = disp.schedule.status === "paused";
                      return (
                        <div
                          key={disp.id}
                          onClick={() => setSelectedForecast(disp)}
                          className={`bg-white hover:bg-slate-50/40 border transition-all duration-180 rounded-2xl p-4.5 cursor-pointer flex flex-col justify-between space-y-4 relative overflow-hidden ${
                            isPaused 
                              ? "opacity-80 bg-zinc-50 border-zinc-205 text-zinc-500 saturate-[0.6]" 
                              : "border-zinc-200 hover:border-indigo-400/80 shadow-2xs hover:shadow-xs hover:scale-[1.01]"
                          }`}
                        >
                          {/* Top colored strip */}
                          <div className={`absolute top-0 bottom-0 left-0 w-1 transition-colors ${
                            isPaused ? "bg-amber-400" : "bg-emerald-500 group-hover:bg-indigo-500"
                          }`}></div>

                          <div className="pl-1.5 flex justify-between items-start gap-4">
                            <div className="space-y-1.5">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className={`text-[9px] font-mono font-black border px-2 py-0.5 rounded-lg leading-tight ${
                                  isPaused 
                                    ? "bg-amber-50 text-amber-800 border-amber-200" 
                                    : "bg-emerald-50 text-emerald-800 border-emerald-200"
                                }`}>
                                  {disp.dateStr}
                                </span>
                                <span className="text-[8.5px] font-mono tracking-wider font-extrabold uppercase text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded">
                                  {disp.schedule.frequency}
                                </span>
                              </div>
                              <h4 className="font-extrabold text-zinc-950 text-sm tracking-tight truncate max-w-[190px]">
                                {disp.schedule.clientCompany || "Unnamed Client"}
                              </h4>
                              <p className="text-[10.5px] font-medium text-zinc-500 font-mono flex items-center gap-1">
                                <User className="w-3 w-3" /> {disp.schedule.clientName}
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="text-sm font-black text-neutral-900 tracking-tight font-mono">
                                ${disp.estimatedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                              {isPaused ? (
                                <span className="text-[8px] font-black uppercase text-amber-700 bg-amber-50 px-1 py-0.5 rounded border border-amber-200">Paused</span>
                              ) : (
                                <span className="text-[8.5px] text-emerald-600 font-extrabold font-mono uppercase bg-emerald-50 px-1 py-0.5 rounded">Active 🚀</span>
                              )}
                            </div>
                          </div>

                          <div className="pl-1.5 pt-2.5 border-t border-dashed border-zinc-150 flex items-center justify-between text-[10px] text-zinc-550 font-sans font-medium">
                            <span className="truncate max-w-[160px] flex items-center gap-1">
                              <Mail className="w-3.5 h-3.5 text-zinc-400" />
                              {disp.schedule.clientEmail}
                            </span>
                            <span className="text-indigo-650 font-extrabold flex items-center gap-0.5 hover:translate-x-0.5 transition-transform">
                              Audit Settings <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* CORNERSTONE OVERLAY MODAL: PROJECTED DETAIL DRAWER        */}
      {/* ──────────────────────────────────────────────────────── */}
      {selectedForecast && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs no-print animate-fadeIn">
          <div className="bg-white border border-zinc-200 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col font-sans">
            
            {/* Header banner */}
            <div className="bg-zinc-50 px-5.5 py-4.5 border-b border-zinc-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <div>
                  <h4 className="font-sans font-black text-xs text-zinc-950 tracking-wider uppercase leading-tight">
                    Foresight Dispatch Inspector
                  </h4>
                  <p className="text-[10px] text-zinc-500 font-mono">ID: {selectedForecast.schedule.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedForecast(null)}
                className="p-1 px-1.5 text-zinc-400 hover:text-zinc-700 bg-zinc-100 hover:bg-zinc-200 transition-all rounded-lg cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Modal Body Info blocks */}
            <div className="p-5.5 space-y-5 flex-1 max-h-[480px] overflow-y-auto">
              
              {/* Highlight Month dispatch forecast */}
              <div className="bg-indigo-50/20 border border-indigo-100 rounded-2xl p-4 text-center space-y-1">
                <span className="block text-[10px] font-black uppercase text-indigo-800 tracking-widest font-mono">Projected Automated Fire Date</span>
                <p className="text-xl font-black text-zinc-950 leading-tight">{selectedForecast.dateStr}</p>
                
                {selectedForecast.schedule.status === "paused" ? (
                  <div className="inline-flex items-center gap-1 font-mono text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md font-extrabold">
                    <AlertCircle className="w-3 w-3" /> Automated Email Dispatch Disabled
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-bold">
                    <CheckCircle2 className="w-3 w-3 text-emerald-500" /> Active cron schedule. Safe for automatic dispatch.
                  </div>
                )}
              </div>

              {/* Client specs card */}
              <div className="border border-zinc-200 rounded-2xl p-4 bg-zinc-50/40 space-y-3.5 text-xs">
                <h5 className="font-black text-[10px] uppercase text-zinc-400 tracking-wider font-mono">Target Client Specifications</h5>
                
                <div id="calendar-client-details-card" className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-0.5">
                    <span className="text-zinc-500 font-bold block text-[10px]">Client Company</span>
                    <span className="font-extrabold text-zinc-950 text-xs sm:text-[13px]">{selectedForecast.schedule.clientCompany || "Not specified"}</span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-zinc-500 font-bold block text-[10px]">Primary Contact</span>
                    <span className="font-extrabold text-zinc-950 text-xs sm:text-[13px]">{selectedForecast.schedule.clientName || "Not specified"}</span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-zinc-500 font-bold block text-[10px]">Target Notification Email</span>
                    <span className="font-mono text-zinc-700 font-bold block truncate">{selectedForecast.schedule.clientEmail || "Not specified"}</span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-zinc-500 font-bold block text-[10px]">Schedules cycle</span>
                    <span className="font-sans text-xs bg-zinc-150 px-2 py-0.5 rounded font-black text-indigo-700 uppercase tracking-widest inline-block">{selectedForecast.schedule.frequency}</span>
                  </div>
                </div>
              </div>

              {/* Invoice lines summary */}
              <div className="border border-zinc-205 rounded-2xl p-4 bg-white space-y-3">
                <div className="flex justify-between items-center">
                  <h5 className="font-black text-[10px] uppercase text-zinc-400 tracking-wider font-mono">Invoice document draft mockup</h5>
                  <span className="font-extrabold font-mono text-xs text-zinc-900 bg-zinc-50 border px-2 py-0.5 rounded">
                    Total: ${selectedForecast.estimatedValue.toFixed(2)}
                  </span>
                </div>

                {selectedForecast.schedule.documentData?.items?.length > 0 ? (
                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                    {selectedForecast.schedule.documentData.items.map((it: any, iidx: number) => (
                      <div key={iidx} className="flex justify-between items-center text-[10.5px] font-medium py-1.5 border-b border-zinc-100 last:border-b-0">
                        <div className="text-zinc-800">
                          <p className="font-extrabold">{it.name || "Default invoice service"}</p>
                          <p className="text-[9px] text-zinc-500">{it.description || "Billable catalog service line"}</p>
                        </div>
                        <div className="text-right font-mono text-zinc-900 font-black">
                          {it.quantity || 1} x ${it.rate || 0}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-[10.5px] text-zinc-500 bg-zinc-50/50 rounded-xl">
                    No item lists inside document template hierarchy.
                  </div>
                )}
              </div>

              {/* Critical warnings and auto-dispatch logic details */}
              <div className="bg-amber-50/20 border border-amber-150 rounded-2xl p-4 text-[11px] leading-relaxed text-zinc-600 flex gap-2.5 items-start">
                <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <p>
                  <strong>Dispatcher logic:</strong> Active schedules run automatically in production. When triggered, the system formats current drafts, logs the transaction permanently to persistent databases, and sends an alert email to <strong>{selectedForecast.schedule.clientEmail || "blank email"}</strong> instantly.
                </p>
              </div>

            </div>

            {/* Footer action overrides */}
            <div className="bg-zinc-50 px-5.5 py-4 border-t border-zinc-200 flex flex-col sm:flex-row gap-2.5 justify-end">
              
              {/* Toggle Pause Switch button */}
              <button
                type="button"
                disabled={isTogglingStatus}
                onClick={() => toggleDispatchStatus(selectedForecast.schedule.id, selectedForecast.schedule.status || "active")}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 select-none ${
                  selectedForecast.schedule.status === "paused" 
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                    : "bg-amber-500 hover:bg-amber-600 text-white"
                }`}
              >
                {selectedForecast.schedule.status === "paused" ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Resume Automatic cron</span>
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4" />
                    <span>Pause Automatic cron</span>
                  </>
                )}
              </button>

              {/* Instant invoice generation trigger simulation */}
              <button
                type="button"
                disabled={isSimulatingTrigger}
                onClick={() => runSimulatedDispatchNow(selectedForecast.schedule, selectedForecast.dateStr)}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 focus:outline-hidden"
              >
                <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>{isSimulatingTrigger ? "Triggering..." : "Simulate Run/Trigger Now"}</span>
              </button>
              
              <button
                type="button"
                onClick={() => setSelectedForecast(null)}
                className="px-4 py-2.5 bg-zinc-200 hover:bg-zinc-350 text-zinc-700 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
