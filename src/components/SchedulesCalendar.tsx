import React, { useState, useMemo } from "react";
import { 
  Calendar as CalendarIcon, 
  List, 
  Search, 
  FileText, 
  Mail, 
  ArrowUpRight, 
  Clock, 
  Sparkles, 
  ChevronRight, 
  User, 
  DollarSign,
  TrendingUp,
  Inbox,
  X
} from "lucide-react";

interface SchedulesCalendarProps {
  recurringSchedules: any[];
}

export default function SchedulesCalendar({ recurringSchedules }: SchedulesCalendarProps) {
  const [viewType, setViewType] = useState<"agenda" | "calendar">("agenda");
  const [filterQuery, setFilterQuery] = useState("");
  const [selectedDispatch, setSelectedDispatch] = useState<any | null>(null);

  // Reference date is today
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const maxDate = useMemo(() => {
    return new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  }, [today]);

  // Compute all upcoming dispatches for the next 30 days
  const upcomingDispatches = useMemo(() => {
    const list: any[] = [];
    if (!recurringSchedules || recurringSchedules.length === 0) return list;

    for (const sched of recurringSchedules) {
      let nextDate = new Date(sched.nextRunDate || new Date());
      if (isNaN(nextDate.getTime())) {
        nextDate = new Date();
      }
      nextDate.setHours(0, 0, 0, 0);

      const freq = sched.frequency || "monthly";
      let count = 0;
      
      // Safety cap of iterations
      while (count < 50) {
        // If nextDate is below today, advance it first so we don't list past things
        if (nextDate < today) {
          if (freq === "weekly") {
            nextDate.setDate(nextDate.getDate() + 7);
          } else if (freq === "biweekly") {
            nextDate.setDate(nextDate.getDate() + 14);
          } else if (freq === "monthly") {
            nextDate.setMonth(nextDate.getMonth() + 1);
          } else if (freq === "yearly") {
            nextDate.setFullYear(nextDate.getFullYear() + 1);
          } else {
            nextDate.setDate(nextDate.getDate() + 30);
          }
          count++;
          continue;
        }

        if (nextDate >= today && nextDate <= maxDate) {
          list.push({
            id: `${sched.id}-${nextDate.getTime()}-${count}`,
            date: new Date(nextDate),
            dateStr: nextDate.toISOString().split("T")[0],
            schedule: sched,
            instanceIndex: count
          });
        }

        if (nextDate > maxDate) {
          break;
        }

        // Advance nextDate according to frequency for successive cycles in the 30-day window
        if (freq === "weekly") {
          nextDate.setDate(nextDate.getDate() + 7);
        } else if (freq === "biweekly") {
          nextDate.setDate(nextDate.getDate() + 14);
        } else if (freq === "monthly") {
          nextDate.setMonth(nextDate.getMonth() + 1);
        } else if (freq === "yearly") {
          nextDate.setFullYear(nextDate.getFullYear() + 1);
        } else {
          nextDate.setDate(nextDate.getDate() + 30);
        }
        count++;
      }
    }

    // Sort chronologically
    return list.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [recurringSchedules, today, maxDate]);

  // Filtered dispatches based on search text
  const filteredDispatches = useMemo(() => {
    return upcomingDispatches.filter(disp => {
      const q = filterQuery.toLowerCase();
      const company = (disp.schedule.clientCompany || "").toLowerCase();
      const name = (disp.schedule.clientName || "").toLowerCase();
      const email = (disp.schedule.clientEmail || "").toLowerCase();
      return company.includes(q) || name.includes(q) || email.includes(q);
    });
  }, [upcomingDispatches, filterQuery]);

  // Calendar dates representation: we create dates starting from today for the next 30 days group
  const calendarDays = useMemo(() => {
    const days: Date[] = [];
    // Start from the beginning of the week that includes "today" to make a neat grid
    const startDay = new Date(today);
    const dayOfWeek = startDay.getDay(); // 0 is Sunday, 1 is Monday ...
    startDay.setDate(startDay.getDate() - dayOfWeek); // Go back to Sunday

    // Show 35 days (5 weeks) of grid cells
    for (let i = 0; i < 35; i++) {
      const cellDate = new Date(startDay);
      cellDate.setDate(startDay.getDate() + i);
      days.push(cellDate);
    }
    return days;
  }, [today]);

  const daysLabels = ["S", "M", "T", "W", "T", "F", "S"];

  // Helper helper to format countdown nicely
  const getCountdownLabel = (target: Date) => {
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today ⚡";
    if (diffDays === 1) return "Tomorrow ⏱️";
    return `In ${diffDays} days 📆`;
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl md:rounded-3xl p-4 sm:p-5.5 space-y-5.5 shadow-xs font-sans">
      
      {/* Tab/View selection and metadata */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-4">
        <div>
          <h3 className="text-sm font-black text-neutral-900 tracking-tight flex items-center gap-2 uppercase">
            <span className="p-1 px-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs leading-none">30 Days</span>
            Pipeline Dispatch Visualizer
          </h3>
          <p className="text-[10.5px] text-zinc-500 font-medium font-sans mt-0.5">
            Realtime foresight scheduling projections for automated client email dispatches
          </p>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="bg-zinc-100 p-1 rounded-xl flex gap-1 border border-zinc-150">
            <button
              onClick={() => setViewType("agenda")}
              className={`px-3 py-1 rounded-lg text-[10.5px] font-bold flex items-center gap-1 transition-all ${viewType === "agenda" ? "bg-white text-zinc-950 shadow-xs border border-zinc-200" : "text-zinc-500 hover:text-zinc-800"}`}
            >
              <List className="w-3.5 h-3.5" /> Agenda
            </button>
            <button
              onClick={() => setViewType("calendar")}
              className={`px-3 py-1 rounded-lg text-[10.5px] font-bold flex items-center gap-1 transition-all ${viewType === "calendar" ? "bg-white text-zinc-950 shadow-xs border border-zinc-200" : "text-zinc-500 hover:text-zinc-800"}`}
            >
              <CalendarIcon className="w-3.5 h-3.5" /> Calendar
            </button>
          </div>
        </div>
      </div>

      {/* Filter and stats row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-0.5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by client or recipient email..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold text-zinc-650 tracking-tight font-sans">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
            <span>Total projected dispatches: <strong className="text-zinc-900">{filteredDispatches.length}</strong></span>
          </div>
        </div>
      </div>

      {/* Agenda/List Timeline Mode */}
      {viewType === "agenda" && (
        <div className="space-y-3">
          {filteredDispatches.length === 0 ? (
            <div className="border border-zinc-150 border-dashed rounded-2xl p-8 text-center text-zinc-500 bg-zinc-50/50">
              <Inbox className="w-7 h-7 mx-auto text-zinc-300 stroke-[1.5] mb-2" />
              <p className="text-xs font-bold text-zinc-700 leading-normal">
                No scheduled dispatches match your filter
              </p>
              <p className="text-[10px] text-zinc-500 mt-1">
                Make sure you have registered repeating cycles with next run Dates within the coming 30 days.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredDispatches.map((dispatch) => {
                const totalAmt = dispatch.schedule.documentData.items?.reduce(
                  (acc: number, it: any) => acc + (it.rate || 0) * (it.quantity || 0),
                  0
                ) || 0;
                const isPaused = dispatch.schedule.status === "paused";
                
                return (
                  <div 
                    key={dispatch.id}
                    onClick={() => setSelectedDispatch(dispatch)}
                    className={`group bg-white hover:bg-slate-50/40 border border-zinc-200 hover:border-indigo-400/80 rounded-xl sm:rounded-2xl p-4 shadow-2xs transition-all duration-205 cursor-pointer flex flex-col justify-between space-y-3 relative overflow-hidden ${
                      isPaused ? "opacity-80 bg-zinc-50/45" : ""
                    }`}
                  >
                    {/* Visual accent left column */}
                    <div className={`absolute top-0 bottom-0 left-0 w-1 transition-colors ${
                      isPaused ? "bg-zinc-300 group-hover:bg-amber-400" : "bg-emerald-400 group-hover:bg-indigo-500"
                    }`}></div>

                    <div className="pl-1.5 flex justify-between items-start gap-2.5">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[9.5px] font-mono tracking-wide font-black text-indigo-700 bg-indigo-50 border border-indigo-100/60 px-2 py-0.5 rounded-lg leading-tight">
                            {dispatch.dateStr}
                          </span>
                          {isPaused ? (
                            <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded leading-tight font-mono">
                              Paused 🛑
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded leading-tight font-mono">
                              {getCountdownLabel(dispatch.date)}
                            </span>
                          )}
                        </div>
                        <h4 className="font-extrabold text-zinc-950 text-xs sm:text-[13px] tracking-tight truncate max-w-[200px]">
                          {dispatch.schedule.clientCompany || "Unnamed Client"}
                        </h4>
                        <p className="text-[10.5px] font-medium text-zinc-500 font-mono flex items-center gap-1">
                          <User className="w-3 h-3 scale-90" /> {dispatch.schedule.clientName}
                        </p>
                      </div>

                      <div className="text-right space-y-1">
                        <span className="inline-flex text-[8.5px] font-bold uppercase tracking-wider text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded-md font-mono">
                          {dispatch.schedule.frequency}
                        </span>
                        <p className="text-xs sm:text-sm font-black text-neutral-900 tracking-tight font-mono pt-1">
                          {dispatch.schedule.documentData.currency || "$"}
                          {totalAmt.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="pl-1.5 pt-2 border-t border-dashed border-zinc-150 flex items-center justify-between text-[10px] text-zinc-500 font-sans font-medium">
                      <span className="truncate max-w-[170px] flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-zinc-400" />
                        {dispatch.schedule.clientEmail}
                      </span>
                      <span className="text-indigo-650 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                        Audit & Review <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Grid Calendar Mode */}
      {viewType === "calendar" && (
        <div className="border border-zinc-200 rounded-2xl p-4.5 bg-zinc-50/40">
          
          {/* Header grid */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1.5 pb-2 border-b border-zinc-200">
            {daysLabels.map((lbl, idx) => (
              <span key={idx} className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block py-0.5 font-mono">
                {lbl}
              </span>
            ))}
          </div>

          {/* Days cells */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {calendarDays.map((cellDate, idx) => {
              const dateStr = cellDate.toISOString().split("T")[0];
              const isToday = cellDate.getTime() === today.getTime();
              const isPast = cellDate < today;
              const isUpcomingLimit = cellDate > maxDate;
              
              // Find all scheduled dispatches on this date cells
              const dayDispatches = filteredDispatches.filter(d => d.dateStr === dateStr);
              const hasEvents = dayDispatches.length > 0;

              return (
                <div 
                  key={idx}
                  onClick={() => {
                    if (hasEvents) {
                      setSelectedDispatch(dayDispatches[0]);
                    }
                  }}
                  className={`min-h-[50px] sm:min-h-[64px] p-1.5 border rounded-xl flex flex-col justify-between transition-all ${
                    isToday
                      ? "bg-indigo-50/20 border-indigo-500/80 ring-1 ring-indigo-500"
                      : isPast || isUpcomingLimit
                        ? "bg-zinc-100 text-zinc-350 border-zinc-150 border-dashed"
                        : hasEvents
                          ? "bg-emerald-50/45 hover:bg-emerald-50/70 border-emerald-300 hover:border-emerald-400 scale-[1.01] hover:shadow-xs cursor-pointer"
                          : "bg-white hover:bg-zinc-100/55 border-zinc-200"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className={`text-[10px] font-bold font-mono tracking-tighter ${
                      isToday 
                        ? "text-indigo-650 bg-indigo-105/95 px-1 rounded-sm font-extrabold" 
                        : isPast || isUpcomingLimit
                          ? "text-zinc-400"
                          : dayDispatches.length > 0
                            ? "text-emerald-700 font-extrabold"
                            : "text-zinc-500"
                    }`}>
                      {cellDate.getDate()}
                    </span>
                    
                    {dayDispatches.length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse md:hidden"></span>
                    )}
                  </div>

                  {/* Desktop Event Indicators */}
                  {dayDispatches.length > 0 && (
                    <div className="hidden md:block select-none mt-1">
                      <div className="text-[8px] bg-emerald-100/90 text-emerald-950 font-black tracking-tight leading-none px-1 py-0.5 rounded-sm border border-emerald-200/40 truncate max-w-full">
                        {dayDispatches.length} Dispatch{dayDispatches.length > 1 ? "es" : ""}
                      </div>
                      <div className="text-[7.5px] text-zinc-550 font-bold font-mono mt-0.5 truncate leading-tight">
                        {dayDispatches[0].schedule.clientCompany}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 items-center text-[10px] font-bold text-zinc-500 border-t border-zinc-150 pt-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Today
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Scheduled Dispatches
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-zinc-100 border border-zinc-200 border-dashed rounded w-5 h-2"></span> Out of Scope (&gt; 30d)
            </span>
          </div>

        </div>
      )}

      {/* Pop-up Info Modal Detail for specific highlighted Dispatch */}
      {selectedDispatch && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs no-print animate-fadeIn">
          <div className="bg-white border border-zinc-200 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col">
            
            {/* Header */}
            <div className="bg-zinc-50 px-4.5 py-4 border-b border-zinc-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4.5 h-4.5 text-indigo-600" />
                <h4 className="font-sans font-black text-xs text-zinc-950 tracking-wide uppercase">
                  Recurring Billing Forecast
                </h4>
              </div>
              <button 
                onClick={() => setSelectedDispatch(null)}
                className="w-7 h-7 rounded-full hover:bg-zinc-200 text-zinc-500 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Inner Content details of selected scheduled dispatch */}
            <div className="p-5.5 space-y-4">
              
              <div className="bg-indigo-50/30 border border-indigo-100 rounded-xl p-3.5 space-y-1 text-center relative overflow-hidden">
                <span className="block text-[10.5px] font-black uppercase text-indigo-800 tracking-wider font-mono">Projected Fire Event</span>
                <p className="text-lg font-black text-zinc-900 leading-none">{selectedDispatch.dateStr}</p>
                {selectedDispatch.schedule.status === "paused" ? (
                  <p className="text-xs text-amber-700 font-extrabold font-mono">⚠️ Automated Email Dispatch Disabled</p>
                ) : (
                  <p className="text-xs text-emerald-700 font-bold font-mono">{getCountdownLabel(selectedDispatch.date)}</p>
                )}
              </div>

              {/* Client specifications */}
              <div className="space-y-2 text-xs">
                <h5 className="font-bold text-zinc-500 uppercase text-[9.5px] tracking-wider block border-b border-zinc-100 pb-1">Recipient Metadata</h5>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div>
                    <span className="text-zinc-500 block text-[10px]">Client Company:</span>
                    <strong className="text-zinc-900">{selectedDispatch.schedule.clientCompany || "Unspecified Org"}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">Primary Contact:</span>
                    <strong className="text-zinc-900">{selectedDispatch.schedule.clientName || "Unknown Contact"}</strong>
                  </div>
                  <div className="col-span-2">
                    <span className="text-zinc-500 block text-[10px]">Mailing Dispatch Address:</span>
                    <strong className="text-zinc-900 font-mono">{selectedDispatch.schedule.clientEmail}</strong>
                  </div>
                </div>
              </div>

              {/* Invoice lines and stats */}
              <div className="space-y-2 text-xs">
                <h5 className="font-bold text-zinc-500 uppercase text-[9.5px] tracking-wider block border-b border-zinc-100 pb-1">Invoice Configuration Items</h5>
                <div className="bg-zinc-50 p-2.5 rounded-lg border border-zinc-150 space-y-1.5 font-mono text-[11px] max-h-36 overflow-y-auto">
                  {selectedDispatch.schedule.documentData.items?.length > 0 ? (
                    selectedDispatch.schedule.documentData.items.map((it: any, i: number) => (
                      <div key={i} className="flex justify-between text-zinc-700">
                        <span>{it.description || "Invoiced product"} x{it.quantity || 1}</span>
                        <span className="font-bold">
                          {selectedDispatch.schedule.documentData.currency || "$"}
                          {((it.rate || 0) * (it.quantity || 0)).toFixed(2)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] text-zinc-500 italic">No line items in simulated document draft</p>
                  )}
                </div>
              </div>

              {/* Total Summary box */}
              <div className="bg-zinc-900 text-white rounded-xl p-3.5 flex justify-between items-center font-mono">
                <div className="text-zinc-400 font-bold text-[10.5px]">
                  <span>FREQUENCY: {selectedDispatch.schedule.frequency.toUpperCase()}</span>
                  <span className="block text-[8px] uppercase font-sans font-medium mt-0.5 text-zinc-500">Auto-Generates and Emails Client</span>
                </div>
                <div className="text-right">
                  <span className="block text-[9px] text-zinc-400 font-bold">TOTAL ESTIMATE:</span>
                  <strong className="text-base font-black text-indigo-400">
                    {selectedDispatch.schedule.documentData.currency || "$"}
                    {(selectedDispatch.schedule.documentData.items?.reduce((a: number, it: any) => a + (it.rate || 0) * (it.quantity || 0), 0) || 0).toFixed(2)}
                  </strong>
                </div>
              </div>

            </div>

            {/* Footer buttons */}
            <div className="bg-zinc-50 px-4.5 py-3 border-t border-zinc-200 flex justify-end gap-2">
              <button
                onClick={() => setSelectedDispatch(null)}
                className="bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-800 font-bold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
              >
                Close View
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
