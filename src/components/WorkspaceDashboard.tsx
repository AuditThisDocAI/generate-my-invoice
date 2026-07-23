import React, { useState } from "react";
import {
  LayoutDashboard,
  Settings2,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  ArrowUp,
  ArrowDown,
  Mail,
  TrendingUp,
  Coins,
  AlertCircle,
  Briefcase,
  Calendar as CalendarIcon,
  ChevronUp,
  ChevronDown,
  Sliders,
  X,
  Filter,
  Copy,
  FileText,
  Check,
  Zap,
} from "lucide-react";
import { SavedHistory, DebtorRecord } from "../types";

interface WorkspaceDashboardProps {
  history: SavedHistory[];
  debtors: DebtorRecord[];
  setDebtors: React.Dispatch<React.SetStateAction<DebtorRecord[]>>;
  dashboardTasks: Array<{
    id: string;
    title: string;
    dueDate: string;
    priority: "low" | "medium" | "high";
    completed: boolean;
    category?: string;
  }>;
  setDashboardTasks: React.Dispatch<React.SetStateAction<Array<{
    id: string;
    title: string;
    dueDate: string;
    priority: "low" | "medium" | "high";
    completed: boolean;
    category?: string;
  }>>>;
  dashboardConfig: {
    layout: "bento" | "single";
    widgetOrder: string[];
    visibleWidgets: { [key: string]: boolean };
    recentInvoicesCount: number;
    recentInvoicesType: "all" | "invoice" | "quote";
    debtorsFilter: "all" | "overdue" | "high_amount";
    debtorsSort: "dueDate" | "amount";
    tasksFilter: "all" | "high" | "pending";
  };
  setDashboardConfig: React.Dispatch<React.SetStateAction<any>>;
  setActiveDoc: (doc: any) => void;
  setLogoPreviewUrl: (url: string | null) => void;
  setActiveDocCloudId: (id: string | null) => void;
  setLoadedHistoryItemId: (id: string | null) => void;
  setWorkspaceViewMode: (mode: "editor" | "dashboard") => void;
  handleShowAlert: (msg: string) => void;
  duplicateHistoryItem: (record: any) => void;
  calculateSavedDocTotals: (doc: any) => { grandTotal: number; subtotal: number };
}

export const WorkspaceDashboard: React.FC<WorkspaceDashboardProps> = ({
  history,
  debtors,
  setDebtors,
  dashboardTasks,
  setDashboardTasks,
  dashboardConfig,
  setDashboardConfig,
  setActiveDoc,
  setLogoPreviewUrl,
  setActiveDocCloudId,
  setLoadedHistoryItemId,
  setWorkspaceViewMode,
  handleShowAlert,
  duplicateHistoryItem,
  calculateSavedDocTotals,
}) => {
  const [isCustomizing, setIsCustomizing] = useState(false);

  // Inline Task Creation States
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"low" | "medium" | "high">("medium");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState("");

  // Inline Debtor Creation States
  const [showAddDebtorForm, setShowAddDebtorForm] = useState(false);
  const [newDebtorName, setNewDebtorName] = useState("");
  const [newDebtorAmount, setNewDebtorAmount] = useState("");
  const [newDebtorDueDate, setNewDebtorDueDate] = useState("");
  const [newDebtorNotes, setNewDebtorNotes] = useState("");

  // --- STATS CALCULATIONS ---
  const invoiceHistory = history.filter((h) => h.documentData?.documentType === "invoice");
  const totalInvoiced = invoiceHistory.reduce((sum, item) => {
    return sum + calculateSavedDocTotals(item.documentData).grandTotal;
  }, 0);

  const outstandingReceivables = debtors
    .filter((d) => d.status === "unpaid" || d.status === "overdue")
    .reduce((sum, d) => sum + Number(d.amount || 0), 0);

  const completedTasks = dashboardTasks.filter((t) => t.completed).length;
  const totalTasks = dashboardTasks.length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const earliestPendingTask = [...dashboardTasks]
    .filter((t) => !t.completed)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

  const nextTaskDue = earliestPendingTask
    ? `${earliestPendingTask.title} (${new Date(earliestPendingTask.dueDate).toLocaleDateString()})`
    : "No tasks pending";

  // --- ACTIONS ---
  const handleToggleTask = (taskId: string) => {
    setDashboardTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
    handleShowAlert("🎯 Task status updated successfully!");
  };

  const handleDeleteTask = (taskId: string) => {
    setDashboardTasks((prev) => prev.filter((t) => t.id !== taskId));
    handleShowAlert("🗑️ Task deleted from dashboard.");
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask = {
      id: "dash-task-" + Date.now(),
      title: newTaskTitle.trim(),
      dueDate: newTaskDueDate || new Date(Date.now() + 86400000).toISOString().split("T")[0],
      priority: newTaskPriority,
      completed: false,
      category: newTaskCategory.trim() || "General",
    };

    setDashboardTasks((prev) => [newTask, ...prev]);
    setNewTaskTitle("");
    setNewTaskDueDate("");
    setNewTaskCategory("");
    handleShowAlert("✅ New upcoming task scheduled successfully!");
  };

  const handleAddDebtor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDebtorName.trim() || !newDebtorAmount.trim()) return;

    const amountNum = parseFloat(newDebtorAmount);
    if (isNaN(amountNum)) return;

    const newRecord: DebtorRecord = {
      id: "dash-debt-" + Date.now(),
      clientName: newDebtorName.trim(),
      clientCompany: newDebtorName.trim(),
      amount: amountNum,
      currency: "$",
      dueDate: newDebtorDueDate || new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
      status: "unpaid",
      notes: newDebtorNotes.trim(),
    };

    setDebtors((prev) => [newRecord, ...prev]);
    setNewDebtorName("");
    setNewDebtorAmount("");
    setNewDebtorDueDate("");
    setNewDebtorNotes("");
    setShowAddDebtorForm(false);
    handleShowAlert("✅ Outstanding debtor account added to ledger!");
  };

  const handleSendNudge = (debtorName: string, amount: number) => {
    handleShowAlert(`✉️ Dispatched professional payment reminder to ${debtorName} for $${amount.toFixed(2)}.`);
  };

  const handleMarkDebtorPaid = (debtorId: string) => {
    setDebtors((prev) =>
      prev.map((d) => (d.id === debtorId ? { ...d, status: "paid" } : d))
    );
    handleShowAlert("💵 Marked debtor account as fully PAID!");
  };

  // --- FILTERS & SORTS FOR WIDGETS ---
  const filteredHistory = history
    .filter((record) => {
      const type = record.documentData?.documentType;
      if (dashboardConfig.recentInvoicesType === "all") return true;
      return type === dashboardConfig.recentInvoicesType;
    })
    .slice(0, dashboardConfig.recentInvoicesCount);

  const filteredDebtors = debtors
    .filter((d) => {
      if (dashboardConfig.debtorsFilter === "all") return d.status !== "paid";
      if (dashboardConfig.debtorsFilter === "overdue") {
        return d.status === "overdue" || (d.status === "unpaid" && new Date(d.dueDate).getTime() < Date.now());
      }
      if (dashboardConfig.debtorsFilter === "high_amount") return d.status !== "paid" && d.amount >= 1000;
      return d.status !== "paid";
    })
    .sort((a, b) => {
      if (dashboardConfig.debtorsSort === "amount") return b.amount - a.amount;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

  const filteredTasks = dashboardTasks
    .filter((t) => {
      if (dashboardConfig.tasksFilter === "all") return true;
      if (dashboardConfig.tasksFilter === "high") return t.priority === "high";
      if (dashboardConfig.tasksFilter === "pending") return !t.completed;
      return true;
    });

  return (
    <div className="space-y-6">
      {/* 1. QUICK STATS DECK */}
      {dashboardConfig.visibleWidgets.quick_stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-zinc-200 p-5 rounded-3xl flex flex-col justify-between shadow-2xs hover:shadow-sm transition-all group">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest font-mono">
                // TOTAL INVOICED
              </span>
              <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-black text-zinc-900 tracking-tight font-display">
                ${totalInvoiced.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <p className="text-[10px] text-zinc-500 mt-1 font-medium">
                Accumulated from {invoiceHistory.length} finalized invoice drafts
              </p>
            </div>
          </div>

          <div className="bg-white border border-zinc-200 p-5 rounded-3xl flex flex-col justify-between shadow-2xs hover:shadow-sm transition-all group">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest font-mono">
                // ACTIVE RECEIVABLES
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Coins className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-black text-zinc-900 tracking-tight font-display">
                ${outstandingReceivables.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <p className="text-[10px] text-zinc-500 mt-1 font-medium">
                Outstanding funds currently owed by clients
              </p>
            </div>
          </div>

          <div className="bg-white border border-zinc-200 p-5 rounded-3xl flex flex-col justify-between shadow-2xs hover:shadow-sm transition-all group">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest font-mono">
                // TASK PROGRESS
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-black text-zinc-900 tracking-tight font-display">
                {taskCompletionRate}%
              </span>
              <p className="text-[10px] text-zinc-500 mt-1 font-medium">
                {completedTasks} completed / {totalTasks} overall scheduled tasks
              </p>
            </div>
          </div>

          <div className="bg-white border border-zinc-200 p-5 rounded-3xl flex flex-col justify-between shadow-2xs hover:shadow-sm transition-all group">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest font-mono">
                // NEXT DUE TASK
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-xs font-bold text-zinc-800 line-clamp-1">
                {nextTaskDue}
              </span>
              <p className="text-[10px] text-zinc-500 mt-1 font-medium">
                Earliest scheduled deadline in workspace queue
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. CONFIGURATION BUTTON & PANEL */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-zinc-50 p-4 rounded-2xl border border-zinc-200">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-violet-600" />
          <span className="text-xs font-bold text-zinc-600">
            Customize widget visibility, sort order, limits, and display priority sequence.
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsCustomizing(!isCustomizing)}
          className="w-full sm:w-auto px-4 py-2 bg-white hover:bg-zinc-100 border border-zinc-250 hover:border-zinc-350 text-zinc-800 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer select-none"
        >
          <Settings2 className="w-4 h-4 text-zinc-650" />
          <span>{isCustomizing ? "Close Dashboard Customizer" : "Customize Dashboard Widgets"}</span>
        </button>
      </div>

      {isCustomizing && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm space-y-6 animate-fadeIn">
          <div className="flex justify-between items-center border-b border-zinc-150 pb-3">
            <h4 className="text-xs font-black text-zinc-900 uppercase tracking-widest font-mono flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-violet-600" />
              <span>Configure Widgets & Grid Layout</span>
            </h4>
            <button
              onClick={() => setIsCustomizing(false)}
              className="text-zinc-450 hover:text-zinc-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
            {/* Widget Visibility */}
            <div className="space-y-3 bg-zinc-50 p-4 rounded-2xl border border-zinc-150">
              <h5 className="text-xs font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-600"></span>
                <span>Show / Hide Widgets</span>
              </h5>
              <div className="space-y-2.5 pt-1">
                {Object.keys(dashboardConfig.visibleWidgets).map((key) => (
                  <label key={key} className="flex items-center gap-2.5 text-xs font-bold text-zinc-650 hover:text-zinc-950 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={dashboardConfig.visibleWidgets[key]}
                      onChange={(e) => {
                        setDashboardConfig((prev: any) => ({
                          ...prev,
                          visibleWidgets: {
                            ...prev.visibleWidgets,
                            [key]: e.target.checked,
                          },
                        }));
                      }}
                      className="rounded border-zinc-300 text-violet-600 focus:ring-violet-500 cursor-pointer h-4 w-4"
                    />
                    <span className="capitalize">{key.replace("_", " ")}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Widget Priority Ordering */}
            <div className="space-y-3 bg-zinc-50 p-4 rounded-2xl border border-zinc-150">
              <h5 className="text-xs font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                <span>Widget Render Order</span>
              </h5>
              <div className="space-y-2 pt-1">
                {dashboardConfig.widgetOrder.map((widgetId, index) => (
                  <div key={widgetId} className="flex items-center justify-between bg-white border border-zinc-200 p-2.5 rounded-xl text-xs font-bold text-zinc-750">
                    <span className="capitalize">{widgetId.replace("_", " ")}</span>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => {
                          const nextOrder = [...dashboardConfig.widgetOrder];
                          const temp = nextOrder[index];
                          nextOrder[index] = nextOrder[index - 1];
                          nextOrder[index - 1] = temp;
                          setDashboardConfig((prev: any) => ({ ...prev, widgetOrder: nextOrder }));
                        }}
                        className="p-1 rounded bg-zinc-100 hover:bg-zinc-200 disabled:opacity-35 transition-all cursor-pointer"
                        title="Move Up"
                      >
                        <ChevronUp className="w-3.5 h-3.5 text-zinc-600" />
                      </button>
                      <button
                        type="button"
                        disabled={index === dashboardConfig.widgetOrder.length - 1}
                        onClick={() => {
                          const nextOrder = [...dashboardConfig.widgetOrder];
                          const temp = nextOrder[index];
                          nextOrder[index] = nextOrder[index + 1];
                          nextOrder[index + 1] = temp;
                          setDashboardConfig((prev: any) => ({ ...prev, widgetOrder: nextOrder }));
                        }}
                        className="p-1 rounded bg-zinc-100 hover:bg-zinc-200 disabled:opacity-35 transition-all cursor-pointer"
                        title="Move Down"
                      >
                        <ChevronDown className="w-3.5 h-3.5 text-zinc-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* General Widget Layout & Filters */}
            <div className="space-y-4 bg-zinc-50 p-4 rounded-2xl border border-zinc-150">
              <div>
                <h5 className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                  <span>Grid Layout Style</span>
                </h5>
                <div className="flex gap-2">
                  {(["bento", "single"] as const).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setDashboardConfig((prev: any) => ({ ...prev, layout: l }))}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold capitalize cursor-pointer transition-all border ${
                        dashboardConfig.layout === l
                          ? "bg-violet-600 border-violet-700 text-white shadow-xs"
                          : "bg-white border-zinc-200 text-zinc-650 hover:bg-zinc-50"
                      }`}
                    >
                      {l === "bento" ? "Bento (2 Cols)" : "Full Stack (1 Col)"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h5 className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                  <span>Recent Document Count Limit</span>
                </h5>
                <select
                  value={dashboardConfig.recentInvoicesCount}
                  onChange={(e) =>
                    setDashboardConfig((prev: any) => ({ ...prev, recentInvoicesCount: Number(e.target.value) }))
                  }
                  className="w-full text-xs font-bold p-2 bg-white rounded-lg border border-zinc-200 focus:outline-none focus:border-violet-500"
                >
                  <option value={3}>3 Documents</option>
                  <option value={5}>5 Documents</option>
                  <option value={10}>10 Documents</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. WIDGET GRID (BENTO OR SINGLE COLUMN) */}
      <div
        className={
          dashboardConfig.layout === "bento"
            ? "grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
            : "flex flex-col gap-6"
        }
      >
        {dashboardConfig.widgetOrder
          .filter((widgetId) => dashboardConfig.visibleWidgets[widgetId])
          .map((widgetId) => {
            if (widgetId === "recent_invoices") {
              const spanClass = dashboardConfig.layout === "bento" ? "lg:col-span-12" : "";
              return (
                <div
                  key="widget_recent_invoices"
                  className={`${spanClass} bg-white border border-zinc-200 rounded-3xl p-5 md:p-6 shadow-xs flex flex-col justify-between`}
                >
                  {/* Widget Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-100 pb-4 mb-4 gap-3">
                    <div>
                      <h4 className="text-sm font-black text-zinc-900 font-display flex items-center gap-2 uppercase tracking-tight">
                        <FileText className="w-4 h-4 text-violet-500" />
                        <span>Recent Invoices & Quotes ({filteredHistory.length})</span>
                      </h4>
                      <p className="text-[11px] text-zinc-450 font-medium">
                        Quick view of newly saved invoices, receipts and quotes.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={dashboardConfig.recentInvoicesType}
                        onChange={(e) =>
                          setDashboardConfig((prev: any) => ({
                            ...prev,
                            recentInvoicesType: e.target.value as any,
                          }))
                        }
                        className="text-xs font-bold p-1.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none text-zinc-700"
                      >
                        <option value="all">All Documents</option>
                        <option value="invoice">Invoices Only</option>
                        <option value="quote">Quotes Only</option>
                      </select>
                    </div>
                  </div>

                  {/* Widget Body */}
                  {filteredHistory.length === 0 ? (
                    <div className="text-center py-12 text-zinc-500 space-y-3 font-sans">
                      <FileText className="w-10 h-10 text-zinc-300 mx-auto" />
                      <p className="text-xs font-bold text-zinc-650">No documents match the chosen filters.</p>
                      <button
                        onClick={() => setWorkspaceViewMode("editor")}
                        className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer inline-flex items-center gap-1 select-none"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create Document Now</span>
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse font-sans text-xs">
                        <thead>
                          <tr className="border-b border-zinc-150 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                            <th className="py-2.5">Doc # / Client</th>
                            <th className="py-2.5">Issue Date</th>
                            <th className="py-2.5">Total Amount</th>
                            <th className="py-2.5">Status</th>
                            <th className="py-2.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                          {filteredHistory.map((item) => {
                            const doc = item.documentData;
                            const totals = calculateSavedDocTotals(doc);
                            const isQuote = doc.documentType === "quote";

                            return (
                              <tr key={item.id} className="hover:bg-zinc-50/50 transition-colors">
                                <td className="py-3">
                                  <div className="font-bold text-zinc-800">
                                    #{doc.documentNumber || "Draft"}
                                  </div>
                                  <div className="text-[10px] text-zinc-500 font-medium">
                                    {doc.clientCompany || doc.clientName || "Unnamed Client"}
                                  </div>
                                </td>
                                <td className="py-3 text-zinc-600 font-medium">
                                  {doc.issueDate || "N/A"}
                                </td>
                                <td className="py-3 font-bold font-mono text-zinc-900">
                                  {doc.currency || "$"}
                                  {totals.grandTotal.toFixed(2)}
                                </td>
                                <td className="py-3">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                                      isQuote
                                        ? "bg-amber-50 text-amber-700 border-amber-100"
                                        : doc.amountPaid && doc.amountPaid >= totals.grandTotal
                                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                          : "bg-blue-50 text-blue-700 border-blue-100"
                                    }`}
                                  >
                                    {isQuote ? "Quote" : doc.status || "Draft"}
                                  </span>
                                </td>
                                <td className="py-3 text-right">
                                  <div className="flex justify-end gap-2">
                                    <button
                                      onClick={() => {
                                        setActiveDoc({ ...doc });
                                        setLogoPreviewUrl(doc.logoUrl || null);
                                        setActiveDocCloudId(item.id.startsWith("AS-") ? null : item.id);
                                        setLoadedHistoryItemId(item.id);
                                        setWorkspaceViewMode("editor");
                                        handleShowAlert(`♻️ Loaded #${doc.documentNumber} into Document Editor!`);
                                      }}
                                      className="px-2.5 py-1 bg-zinc-50 hover:bg-zinc-850 hover:text-white text-zinc-750 font-bold rounded-lg transition-all shadow-2xs border border-zinc-200 cursor-pointer"
                                      title="Load in Editor"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => duplicateHistoryItem(item)}
                                      className="p-1 text-violet-650 hover:bg-violet-50 rounded-lg border border-transparent hover:border-violet-100 transition-all cursor-pointer"
                                      title="Duplicate draft"
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            }

            if (widgetId === "overdue_debtors") {
              const spanClass = dashboardConfig.layout === "bento" ? "lg:col-span-6" : "";
              return (
                <div
                  key="widget_overdue_debtors"
                  className={`${spanClass} bg-white border border-zinc-200 rounded-3xl p-5 md:p-6 shadow-xs flex flex-col justify-between`}
                >
                  {/* Widget Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-100 pb-4 mb-4 gap-3">
                    <div>
                      <h4 className="text-sm font-black text-zinc-900 font-display flex items-center gap-2 uppercase tracking-tight">
                        <Coins className="w-4 h-4 text-rose-500" />
                        <span>Client Debtors & Receivables</span>
                      </h4>
                      <p className="text-[11px] text-zinc-450 font-medium">
                        Ledger of outstanding customer invoices.
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <select
                        value={dashboardConfig.debtorsFilter}
                        onChange={(e) =>
                          setDashboardConfig((prev: any) => ({
                            ...prev,
                            debtorsFilter: e.target.value as any,
                          }))
                        }
                        className="text-[10px] font-bold p-1 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-650 focus:outline-none"
                      >
                        <option value="all">Active Debtors</option>
                        <option value="overdue">Overdue Only</option>
                        <option value="high_amount">Owed &gt;= $1k</option>
                      </select>

                      <button
                        onClick={() => setShowAddDebtorForm(!showAddDebtorForm)}
                        className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-650 rounded-lg border border-rose-100 transition-all cursor-pointer"
                        title="Add Custom Debtor"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Add Custom Debtor Inline Form */}
                  {showAddDebtorForm && (
                    <form onSubmit={handleAddDebtor} className="bg-zinc-50 p-3.5 rounded-2xl border border-zinc-150 mb-4 space-y-3 font-sans">
                      <div className="flex justify-between items-center border-b border-zinc-100 pb-1.5">
                        <span className="text-[11px] font-bold text-zinc-700 uppercase">New Ledger Entry</span>
                        <button type="button" onClick={() => setShowAddDebtorForm(false)} className="text-zinc-400 hover:text-zinc-600">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="col-span-2">
                          <label className="text-[9px] font-bold text-zinc-450 uppercase block mb-0.5">Client Name</label>
                          <input
                            type="text"
                            required
                            placeholder="Acme Corporation"
                            value={newDebtorName}
                            onChange={(e) => setNewDebtorName(e.target.value)}
                            className="w-full p-2 bg-white rounded-lg border border-zinc-200 font-bold focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-zinc-450 uppercase block mb-0.5">Amount Owed ($)</label>
                          <input
                            type="number"
                            required
                            step="0.01"
                            placeholder="1250.00"
                            value={newDebtorAmount}
                            onChange={(e) => setNewDebtorAmount(e.target.value)}
                            className="w-full p-2 bg-white rounded-lg border border-zinc-200 font-bold focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-zinc-450 uppercase block mb-0.5">Payment Due</label>
                          <input
                            type="date"
                            value={newDebtorDueDate}
                            onChange={(e) => setNewDebtorDueDate(e.target.value)}
                            className="w-full p-2 bg-white rounded-lg border border-zinc-200 font-bold focus:outline-none"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer select-none"
                      >
                        Add Debtor Account
                      </button>
                    </form>
                  )}

                  {/* Widget Body */}
                  {filteredDebtors.length === 0 ? (
                    <div className="text-center py-12 text-zinc-500 font-sans space-y-1">
                      <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                      <p className="text-xs font-bold text-zinc-700">Perfect Ledger Balance!</p>
                      <p className="text-[11px] text-zinc-450">No outstanding customer debts are registered.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 font-sans">
                      {filteredDebtors.map((d) => {
                        const isOverdue = new Date(d.dueDate).getTime() < Date.now();
                        const daysOverdue = Math.max(
                          0,
                          Math.floor((Date.now() - new Date(d.dueDate).getTime()) / 86400000)
                        );

                        return (
                          <div
                            key={d.id}
                            className="bg-zinc-50/70 border border-zinc-150 p-3 rounded-2xl flex items-center justify-between hover:border-zinc-300 transition-all hover:bg-zinc-50"
                          >
                            <div className="space-y-0.5">
                              <span className="font-bold text-zinc-900 text-xs flex items-center gap-1.5">
                                {d.clientName}
                                {isOverdue && (
                                  <span className="bg-rose-50 text-rose-700 border border-rose-100 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                                    Overdue {daysOverdue}d
                                  </span>
                                )}
                              </span>
                              <div className="text-[10px] text-zinc-500 font-semibold">
                                Due: {new Date(d.dueDate).toLocaleDateString()} • {d.notes || "No tags"}
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="font-black text-xs font-mono text-rose-600">
                                {d.currency || "$"}
                                {Number(d.amount).toFixed(2)}
                              </span>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleSendNudge(d.clientName, d.amount)}
                                  className="p-1 bg-white hover:bg-rose-50 border border-zinc-200 hover:border-rose-200 text-rose-600 rounded-lg transition-colors cursor-pointer"
                                  title="Send Email Nudge"
                                >
                                  <Mail className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleMarkDebtorPaid(d.id)}
                                  className="p-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-lg transition-colors cursor-pointer"
                                  title="Mark Paid"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            if (widgetId === "upcoming_tasks") {
              const spanClass = dashboardConfig.layout === "bento" ? "lg:col-span-6" : "";
              return (
                <div
                  key="widget_upcoming_tasks"
                  className={`${spanClass} bg-white border border-zinc-200 rounded-3xl p-5 md:p-6 shadow-xs flex flex-col justify-between`}
                >
                  {/* Widget Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-100 pb-4 mb-4 gap-3">
                    <div>
                      <h4 className="text-sm font-black text-zinc-900 font-display flex items-center gap-2 uppercase tracking-tight">
                        <Briefcase className="w-4 h-4 text-emerald-500" />
                        <span>Upcoming Business Tasks ({filteredTasks.length})</span>
                      </h4>
                      <p className="text-[11px] text-zinc-450 font-medium">
                        Checklist of admin operations, filing dates and compliance.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={dashboardConfig.tasksFilter}
                        onChange={(e) =>
                          setDashboardConfig((prev: any) => ({
                            ...prev,
                            tasksFilter: e.target.value as any,
                          }))
                        }
                        className="text-[10px] font-bold p-1 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-650 focus:outline-none"
                      >
                        <option value="all">All Tasks</option>
                        <option value="high">High Priority</option>
                        <option value="pending">Pending Only</option>
                      </select>
                    </div>
                  </div>

                  {/* Quick Inline Add Task Form */}
                  <form onSubmit={handleAddTask} className="bg-zinc-50 p-3 rounded-2xl border border-zinc-150 mb-4 space-y-2.5 font-sans">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Add quick task title..."
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        className="flex-1 text-xs p-2 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-violet-500 font-medium"
                      />
                      <button
                        type="submit"
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-2xs transition-colors cursor-pointer select-none shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex gap-2 items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1">
                        <span className="text-zinc-500">Priority:</span>
                        {(["low", "medium", "high"] as const).map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setNewTaskPriority(p)}
                            className={`px-2 py-0.5 rounded capitalize font-bold border transition-all ${
                              newTaskPriority === p
                                ? p === "high"
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : p === "medium"
                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                    : "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-100"
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-zinc-500">Due:</span>
                        <input
                          type="date"
                          value={newTaskDueDate}
                          onChange={(e) => setNewTaskDueDate(e.target.value)}
                          className="p-1 bg-white border border-zinc-200 rounded font-medium focus:outline-none text-[10px]"
                        />
                      </div>
                    </div>
                  </form>

                  {/* Widget Body */}
                  {filteredTasks.length === 0 ? (
                    <div className="text-center py-10 text-zinc-500 font-sans space-y-1">
                      <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                      <p className="text-xs font-bold text-zinc-700 font-display">All Clean!</p>
                      <p className="text-[11px] text-zinc-450">There are no matching pending checklist tasks.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 font-sans">
                      {filteredTasks.map((t) => (
                        <div
                          key={t.id}
                          className={`bg-zinc-50/70 border border-zinc-150 p-3 rounded-2xl flex items-center justify-between hover:border-zinc-300 transition-all ${
                            t.completed ? "opacity-60 bg-zinc-100/30" : ""
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => handleToggleTask(t.id)}
                              className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                                t.completed
                                  ? "bg-emerald-500 border-emerald-600 text-white"
                                  : "border-zinc-300 hover:border-violet-500 bg-white text-transparent"
                              }`}
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </button>

                            <div className="space-y-0.5">
                              <p className={`text-xs font-bold text-zinc-900 leading-snug ${t.completed ? "line-through text-zinc-550" : ""}`}>
                                {t.title}
                              </p>
                              <div className="flex items-center gap-2 text-[9.5px] text-zinc-500 font-semibold flex-wrap">
                                <span className="flex items-center gap-0.5">
                                  <CalendarIcon className="w-3 h-3 text-zinc-400" />
                                  {new Date(t.dueDate).toLocaleDateString()}
                                </span>
                                {t.category && (
                                  <span className="bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded text-zinc-600 font-mono">
                                    {t.category.toUpperCase()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`px-1.5 py-0.5 text-[8.5px] font-black rounded border uppercase tracking-wider ${
                                t.priority === "high"
                                  ? "bg-rose-50 text-rose-700 border-rose-100"
                                  : t.priority === "medium"
                                    ? "bg-amber-50 text-amber-700 border-amber-100"
                                    : "bg-blue-50 text-blue-700 border-blue-100"
                              }`}
                            >
                              {t.priority}
                            </span>

                            <button
                              onClick={() => handleDeleteTask(t.id)}
                              className="p-1 hover:bg-rose-50 border border-transparent hover:border-rose-150 text-rose-600 rounded-lg transition-all cursor-pointer"
                              title="Delete Task"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return null;
          })}
      </div>
    </div>
  );
};
