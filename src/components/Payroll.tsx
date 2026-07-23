import React, { useState } from "react";
import { Plus, Users, Calculator, FileText, Download, ShieldCheck, History, AlertTriangle, TrendingUp, Settings, Upload } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface Employee {
  id: string;
  name: string;
  role: string;
  salary: number;
  payeRate?: number;
  uifRate?: number;
}

interface PayStubRecord {
  id: string;
  runId: string;
  date: string;
  employeeName: string;
  role: string;
  gross: number;
  paye: number;
  uif: number;
  sdl: number;
  net: number;
  status: "pending" | "distributed" | "paid";
  hasDiscrepancy?: boolean;
}

interface PayrollRun {
  id: string;
  date: string;
  totalSalary: number;
  totalPAYE: number;
  totalUIF: number;
  totalSDL: number;
  employeeCount: number;
}

interface PayrollProps {
  onShowAlert?: (msg: string) => void;
}

export default function Payroll({ onShowAlert }: PayrollProps) {
  const [employees, setEmployees] = useState<Employee[]>([
    { id: "1", name: "John Doe", role: "Software Engineer", salary: 35000, payeRate: 18, uifRate: 1 },
    { id: "2", name: "Jane Smith", role: "Marketing Manager", salary: 28000, payeRate: 18, uifRate: 1 },
    { id: "3", name: "Alice Anomalous", role: "Contractor", salary: 25000, payeRate: 15, uifRate: 0.5 }
  ]);
  
  const [newEmpName, setNewEmpName] = useState("");
  const [newEmpRole, setNewEmpRole] = useState("");
  const [newEmpSalary, setNewEmpSalary] = useState("");
  
  const [auditLog, setAuditLog] = useState<PayrollRun[]>([]);
  const [payslipHistory, setPayslipHistory] = useState<PayStubRecord[]>([]);
  const [historySearch, setHistorySearch] = useState("");
  const [historyFilter, setHistoryFilter] = useState<"all" | "pending" | "distributed" | "paid">("all");
  const [selectedPayslip, setSelectedPayslip] = useState<Employee | null>(null);

  const [taxSettings, setTaxSettings] = useState({ payeRate: 18, uifRate: 1 });

  const handleAddEmployee = () => {
    if (!newEmpName || !newEmpRole || !newEmpSalary) {
      if (onShowAlert) onShowAlert("Please fill in all employee fields.");
      return;
    }
    const emp: Employee = {
      id: Date.now().toString(),
      name: newEmpName,
      role: newEmpRole,
      salary: parseFloat(newEmpSalary)
    };
    setEmployees([...employees, emp]);
    setNewEmpName("");
    setNewEmpRole("");
    setNewEmpSalary("");
    if (onShowAlert) onShowAlert(`Added employee ${emp.name}`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split('\n').filter(line => line.trim() !== '');
      if (lines.length < 2) {
        if (onShowAlert) onShowAlert("CSV must contain headers and at least one row.");
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const nameIdx = headers.findIndex(h => h.includes('name'));
      const roleIdx = headers.findIndex(h => h.includes('role'));
      const hoursIdx = headers.findIndex(h => h.includes('hours'));
      const rateIdx = headers.findIndex(h => h.includes('rate'));

      if (nameIdx === -1 || hoursIdx === -1 || rateIdx === -1) {
        if (onShowAlert) onShowAlert("CSV must contain 'Name', 'Hours', and 'Rate' columns.");
        return;
      }

      const newEmployees: Employee[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim());
        if (cols.length < Math.max(nameIdx, hoursIdx, rateIdx) + 1) continue;

        const name = cols[nameIdx];
        const role = roleIdx !== -1 ? cols[roleIdx] : "Employee";
        const hours = parseFloat(cols[hoursIdx]);
        const rate = parseFloat(cols[rateIdx]);

        if (name && !isNaN(hours) && !isNaN(rate)) {
          newEmployees.push({
            id: Math.random().toString(36).substring(2, 9),
            name,
            role,
            salary: hours * rate
          });
        }
      }

      if (newEmployees.length > 0) {
        setEmployees(prev => [...prev, ...newEmployees]);
        if (onShowAlert) onShowAlert(`Successfully imported ${newEmployees.length} employees.`);
      } else {
        if (onShowAlert) onShowAlert("No valid employee rows found in CSV.");
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // reset
  };

  const handleRemoveEmployee = (id: string) => {
    setEmployees(employees.filter(e => e.id !== id));
  };

  const calculatePAYE = (emp: Employee) => {
    const rate = emp.payeRate !== undefined ? emp.payeRate : taxSettings.payeRate;
    return emp.salary * (rate / 100);
  };

  const calculateUIF = (emp: Employee) => {
    const rate = emp.uifRate !== undefined ? emp.uifRate : taxSettings.uifRate;
    return emp.salary * (rate / 100);
  };

  const calculateSDL = (emp: Employee) => {
    return emp.salary * 0.01;
  };

  const runPayroll = () => {
    if (employees.length === 0) {
      if (onShowAlert) onShowAlert("No employees to run payroll for.");
      return;
    }
    
    let totalSal = 0;
    let totalPAYE = 0;
    let totalUIF = 0;
    let totalSDL = 0;

    employees.forEach(emp => {
      totalSal += emp.salary;
      totalPAYE += calculatePAYE(emp);
      totalUIF += calculateUIF(emp);
      totalSDL += calculateSDL(emp);
    });

    const newRunId = Date.now().toString();
    const newRun: PayrollRun = {
      id: newRunId,
      date: new Date().toISOString().split("T")[0],
      totalSalary: totalSal,
      totalPAYE,
      totalUIF,
      totalSDL,
      employeeCount: employees.length
    };

    const newStubs: PayStubRecord[] = employees.map(emp => {
      const paye = calculatePAYE(emp);
      const uif = calculateUIF(emp);
      const sdl = calculateSDL(emp);
      const isDiscrepant = (emp.payeRate !== undefined && emp.payeRate !== taxSettings.payeRate) || 
                           (emp.uifRate !== undefined && emp.uifRate !== taxSettings.uifRate);
                           
      return {
        id: Math.random().toString(36).substring(2, 9),
        runId: newRunId,
        date: newRun.date,
        employeeName: emp.name,
        role: emp.role,
        gross: emp.salary,
        paye: paye,
        uif: uif,
        sdl: sdl,
        net: emp.salary - paye - uif,
        status: "pending" as const,
        hasDiscrepancy: isDiscrepant
      };
    });

    setPayslipHistory([...newStubs, ...payslipHistory]);
    setAuditLog([newRun, ...auditLog]);
    if (onShowAlert) onShowAlert("Payroll run completed & recorded in AI Audit Log.");
  };

  const downloadPDF = async () => {
    const input = document.getElementById("payslip-content");
    if (!input || !selectedPayslip) return;
    
    try {
      if(onShowAlert) onShowAlert("Generating PDF...");
      const canvas = await html2canvas(input, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Payslip_${selectedPayslip.name.replace(/\s+/g, "_")}.pdf`);
      if(onShowAlert) onShowAlert("PDF generated successfully.");
    } catch(err) {
      console.error(err);
      if(onShowAlert) onShowAlert("Failed to generate PDF.");
    }
  };

  const stubsWithDiscrepancy = payslipHistory.map(stub => {
    const actualPayeRate = (stub.paye / stub.gross) * 100;
    const actualUifRate = (stub.uif / stub.gross) * 100;
    const isDiscrepant = Math.abs(actualPayeRate - taxSettings.payeRate) > 0.01 || 
                         Math.abs(actualUifRate - taxSettings.uifRate) > 0.01;
    return { ...stub, hasDiscrepancy: isDiscrepant };
  });

  const filteredStubs = stubsWithDiscrepancy.filter(stub => {
    const matchesSearch = stub.employeeName.toLowerCase().includes(historySearch.toLowerCase()) || stub.id.includes(historySearch);
    const matchesFilter = historyFilter === "all" || stub.status === historyFilter;
    return matchesSearch && matchesFilter;
  });

  const discrepanciesCount = stubsWithDiscrepancy.filter(stub => stub.hasDiscrepancy).length;

  return (
    <div className="max-w-6xl mx-auto w-full animate-fadeIn space-y-6">
      
      {/* Header */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 md:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center border-b border-zinc-100 pb-4 mb-6">
          <div>
            <h2 className="text-xl font-black text-zinc-900 font-sans tracking-tight uppercase flex items-center gap-2">
              <Users className="w-6 h-6 text-emerald-600" />
              Payroll Management
            </h2>
            <p className="text-xs text-zinc-500 mt-1 font-medium max-w-xl">
              Add employees, run monthly payroll, generate SA-compliant payslips with PAYE and UIF placeholders, and track runs via the AI Audit Log.
            </p>
          </div>
          <button
            onClick={runPayroll}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs tracking-wide transition-all shadow-md flex items-center gap-2 uppercase"
          >
            <Calculator className="w-4 h-4" />
            Run Monthly Payroll
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Employee Roster */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-800 uppercase tracking-tight flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                Employee Roster
              </h3>
              <div className="relative">
                <input 
                  type="file" 
                  accept=".csv" 
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  title="Upload CSV (Name, Role, Hours, Rate)"
                />
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors border border-zinc-200">
                  <Upload className="w-3.5 h-3.5" />
                  Bulk Import
                </button>
              </div>
            </div>
            
            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input 
                  type="text" 
                  placeholder="Employee Name"
                  value={newEmpName}
                  onChange={e => setNewEmpName(e.target.value)}
                  className="px-3 py-2 border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                />
                <input 
                  type="text" 
                  placeholder="Role"
                  value={newEmpRole}
                  onChange={e => setNewEmpRole(e.target.value)}
                  className="px-3 py-2 border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                />
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    placeholder="Monthly Gross (ZAR)"
                    value={newEmpSalary}
                    onChange={e => setNewEmpSalary(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500"
                  />
                  <button 
                    onClick={handleAddEmployee}
                    className="px-3 py-2 bg-zinc-900 hover:bg-black text-white rounded-xl transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {employees.length === 0 ? (
                <div className="text-center py-6 bg-white border border-dashed border-zinc-200 rounded-2xl">
                  <p className="text-xs text-zinc-500 font-medium">No employees added yet.</p>
                </div>
              ) : (
                employees.map(emp => (
                  <div key={emp.id} className="bg-white border border-zinc-200 p-3 rounded-xl flex items-center justify-between shadow-sm">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-800">{emp.name}</h4>
                      <p className="text-[10px] text-zinc-500">{emp.role}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md">
                        R {emp.salary.toFixed(2)}
                      </span>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => setSelectedPayslip(emp)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="View Payslip"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleRemoveEmployee(emp.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Remove Employee"
                        >
                          <Plus className="w-4 h-4 rotate-45" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* AI Audit Log */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-800 uppercase tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              AI Audit Log
            </h3>
            
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-inner min-h-[300px]">
              {auditLog.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-50 space-y-2">
                  <History className="w-8 h-8 text-zinc-500" />
                  <p className="text-xs text-zinc-400 font-mono text-center">No payroll runs audited yet.<br/>Run payroll to generate a log.</p>
                </div>
              ) : (
                <div className="space-y-3 font-mono">
                  {auditLog.map(run => (
                    <div key={run.id} className="border-l-2 border-emerald-500 pl-3 py-1 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-zinc-400">
                        <span>Run ID: {run.id}</span>
                        <span>{run.date}</span>
                      </div>
                      <p className="text-xs text-zinc-200 font-bold">
                        Processed {run.employeeCount} employee(s)
                      </p>
                      <div className="grid grid-cols-4 gap-2 mt-1">
                        <div className="bg-zinc-800 p-1.5 rounded text-[9px] text-zinc-300">
                          <span className="block text-zinc-500 mb-0.5">Gross Pay</span>
                          R {run.totalSalary.toFixed(2)}
                        </div>
                        <div className="bg-zinc-800 p-1.5 rounded text-[9px] text-zinc-300">
                          <span className="block text-zinc-500 mb-0.5">PAYE</span>
                          R {run.totalPAYE.toFixed(2)}
                        </div>
                        <div className="bg-zinc-800 p-1.5 rounded text-[9px] text-zinc-300">
                          <span className="block text-zinc-500 mb-0.5">UIF</span>
                          R {run.totalUIF.toFixed(2)}
                        </div>
                        <div className="bg-zinc-800 p-1.5 rounded text-[9px] text-zinc-300">
                          <span className="block text-zinc-500 mb-0.5">SDL</span>
                          R {run.totalSDL.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>

      {/* Payroll Audit History */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 md:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-zinc-100 pb-4 mb-6 gap-4">
          <div>
            <h2 className="text-xl font-black text-zinc-900 font-sans tracking-tight uppercase flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-600" />
              Payroll Audit History
              {discrepanciesCount > 0 && (
                <span className="ml-2 flex items-center gap-1 bg-rose-100 text-rose-700 text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wider">
                  <AlertTriangle className="w-3 h-3" />
                  {discrepanciesCount} Discrepanc{discrepanciesCount === 1 ? 'y' : 'ies'}
                </span>
              )}
            </h2>
            <p className="text-xs text-zinc-500 mt-1 font-medium">Search and filter generated pay stubs, track distribution status.</p>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <input 
              type="text" 
              placeholder="Search employee or ID..." 
              value={historySearch}
              onChange={e => setHistorySearch(e.target.value)}
              className="flex-1 md:w-48 px-3 py-2 border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500"
            />
            <select 
              value={historyFilter}
              onChange={e => setHistoryFilter(e.target.value as any)}
              className="px-3 py-2 border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 bg-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="distributed">Distributed</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </div>

        {/* Audit Threshold Settings */}
        <div className="mb-6 border border-zinc-200 rounded-2xl p-5 bg-white shadow-sm flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-zinc-800 uppercase tracking-tight flex items-center gap-2">
              <Settings className="w-4 h-4 text-zinc-500" />
              Audit Threshold Settings
            </h3>
            <p className="text-[10px] text-zinc-500 font-medium">Define the standard percentage ranges used for detecting deviations in historical pay stubs.</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-zinc-50 px-3 py-2 rounded-xl border border-zinc-100">
              <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">PAYE Baseline (%)</label>
              <input 
                type="number" 
                value={taxSettings.payeRate} 
                onChange={e => setTaxSettings({...taxSettings, payeRate: parseFloat(e.target.value) || 0})}
                className="w-14 px-1 py-0.5 border border-zinc-200 rounded text-xs font-mono font-bold focus:outline-none focus:border-indigo-500 bg-white"
              />
            </div>
            <div className="flex items-center gap-2 bg-zinc-50 px-3 py-2 rounded-xl border border-zinc-100">
              <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">UIF Baseline (%)</label>
              <input 
                type="number" 
                value={taxSettings.uifRate} 
                onChange={e => setTaxSettings({...taxSettings, uifRate: parseFloat(e.target.value) || 0})}
                className="w-14 px-1 py-0.5 border border-zinc-200 rounded text-xs font-mono font-bold focus:outline-none focus:border-indigo-500 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Tax Contribution Trends Chart */}
        {auditLog.length > 0 ? (
          <div className="mb-8 border border-zinc-200 rounded-2xl p-6 bg-zinc-50/50 shadow-sm">
            <h3 className="text-sm font-bold text-zinc-800 uppercase tracking-tight flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              UIF/PAYE Contribution Trends
            </h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={auditLog.slice().reverse().map((run) => ({
                    name: run.date,
                    PAYE: run.totalPAYE,
                    UIF: run.totalUIF,
                    SDL: run.totalSDL,
                  }))}
                  margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                >
                  <Line type="monotone" dataKey="PAYE" stroke="#EF4444" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="UIF" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="SDL" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
                  <CartesianGrid stroke="#E4E4E7" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" stroke="#A1A1AA" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#A1A1AA" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `R${val}`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: "12px", border: "1px solid #E4E4E7", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                    formatter={(val: number) => [`R${val.toFixed(2)}`, undefined]}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500">
                <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px]">ID / Date</th>
                <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px]">Employee</th>
                <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px] text-right">Gross (ZAR)</th>
                <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px] text-right">Net (ZAR)</th>
                <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px] text-center">Status</th>
                <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredStubs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-500 font-medium">
                    No pay stubs found.
                  </td>
                </tr>
              ) : (
                filteredStubs.map(stub => (
                  <tr key={stub.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-mono text-zinc-900 font-bold flex items-center gap-1">
                        {stub.id.toUpperCase()}
                        {stub.hasDiscrepancy && (
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" title="Calculation discrepancy detected" />
                        )}
                      </div>
                      <div className="text-[10px] text-zinc-500">{stub.date}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-zinc-800">{stub.employeeName}</div>
                      <div className="text-[10px] text-zinc-500">{stub.role}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-zinc-600 font-semibold">
                      {stub.gross.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-700 font-bold">
                      {stub.net.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        stub.status === "paid" ? "bg-emerald-100 text-emerald-700" :
                        stub.status === "distributed" ? "bg-indigo-100 text-indigo-700" :
                        "bg-amber-100 text-amber-700"
                      }`}>
                        {stub.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center space-x-1">
                      <button 
                        onClick={() => {
                          const updated = payslipHistory.map(s => s.id === stub.id ? { ...s, status: "distributed" as const } : s);
                          setPayslipHistory(updated);
                        }}
                        disabled={stub.status !== "pending"}
                        className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${stub.status === "pending" ? "bg-indigo-50 text-indigo-700 hover:bg-indigo-100" : "bg-zinc-100 text-zinc-400 cursor-not-allowed"}`}
                      >
                        Distribute
                      </button>
                      <button 
                        onClick={() => {
                          const updated = payslipHistory.map(s => s.id === stub.id ? { ...s, status: "paid" as const } : s);
                          setPayslipHistory(updated);
                        }}
                        disabled={stub.status === "paid"}
                        className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${stub.status !== "paid" ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-zinc-100 text-zinc-400 cursor-not-allowed"}`}
                      >
                        Mark Paid
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SA-Compliant Payslip Modal */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg border border-zinc-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
              <h3 className="font-bold text-zinc-900 flex items-center gap-2 uppercase tracking-wider text-xs">
                <FileText className="w-4 h-4 text-emerald-600" />
                SA-Compliant Payslip
              </h3>
              <button
                onClick={() => setSelectedPayslip(null)}
                className="text-zinc-400 hover:text-zinc-600 transition-colors p-1"
              >
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>
            <div className="p-6 md:p-8 overflow-y-auto space-y-6" id="payslip-content">
              
              <div className="text-center space-y-1">
                <h2 className="text-xl font-black text-zinc-900 tracking-tight">PAYSLIP</h2>
                <p className="text-xs text-zinc-500 font-mono">Date: {new Date().toISOString().split("T")[0]}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-zinc-500 font-bold mb-0.5 uppercase text-[9px]">Employee Details</p>
                  <p className="font-bold text-zinc-800">{selectedPayslip.name}</p>
                  <p className="text-zinc-600">{selectedPayslip.role}</p>
                </div>
                <div className="text-right">
                  <p className="text-zinc-500 font-bold mb-0.5 uppercase text-[9px]">Employer</p>
                  <p className="font-bold text-zinc-800">Your Company (Pty) Ltd</p>
                  <p className="text-zinc-600">Company Reg: 2026/000123/07</p>
                </div>
              </div>

              <div className="border border-zinc-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-zinc-50 border-b border-zinc-200">
                    <tr>
                      <th className="px-4 py-2 font-bold text-zinc-600 uppercase text-[10px]">Description</th>
                      <th className="px-4 py-2 font-bold text-zinc-600 uppercase text-[10px] text-right">Amount (ZAR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    <tr>
                      <td className="px-4 py-3 font-semibold text-zinc-800">Basic Salary (Gross)</td>
                      <td className="px-4 py-3 font-mono font-bold text-zinc-900 text-right">
                        R {selectedPayslip.salary.toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-rose-600">PAYE Deduction</td>
                      <td className="px-4 py-3 font-mono font-bold text-rose-600 text-right">
                        -R {calculatePAYE(selectedPayslip).toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-rose-600">UIF Deduction</td>
                      <td className="px-4 py-3 font-mono font-bold text-rose-600 text-right">
                        -R {calculateUIF(selectedPayslip).toFixed(2)}
                      </td>
                    </tr>
                    <tr className="bg-amber-50/30">
                      <td className="px-4 py-3 font-semibold text-amber-700">SDL (Employer Contribution 1%)</td>
                      <td className="px-4 py-3 font-mono font-bold text-amber-700 text-right">
                        R {calculateSDL(selectedPayslip).toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-zinc-50 border-t border-zinc-200">
                    <tr>
                      <th className="px-4 py-3 font-black text-zinc-900 uppercase">Net Pay</th>
                      <th className="px-4 py-3 font-mono font-black text-emerald-700 text-right text-sm">
                        R {(selectedPayslip.salary - calculatePAYE(selectedPayslip) - calculateUIF(selectedPayslip)).toFixed(2)}
                      </th>
                    </tr>
                  </tfoot>
                </table>
              </div>
              
              <div className="flex justify-center pt-2" data-html2canvas-ignore="true">
                <button
                  onClick={downloadPDF}
                  className="px-6 py-2.5 bg-zinc-900 hover:bg-black text-white rounded-xl font-bold text-xs tracking-wide transition-all shadow-md flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
