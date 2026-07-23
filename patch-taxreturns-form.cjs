const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const anchor = `</button>
                          </div>`;

const formHtml = `</button>
                          </div>
                          
                          {showTaxReturnForm && (
                            <div className="bg-zinc-50 rounded-2xl border border-zinc-200 p-6 shadow-inner animate-fadeIn">
                              <h4 className="font-bold text-zinc-900 mb-4">Log New Tax Return</h4>
                              <form 
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                                onSubmit={(e: any) => {
                                  e.preventDefault();
                                  const fd = new FormData(e.target);
                                  const year = parseInt(fd.get('year') as string);
                                  const category = fd.get('category') as string;
                                  const totalIncome = parseFloat(fd.get('totalIncome') as string);
                                  const totalTax = parseFloat(fd.get('totalTax') as string);
                                  const status = fd.get('status') as any;
                                  
                                  if (!year || !category || isNaN(totalIncome) || isNaN(totalTax)) {
                                    handleShowAlert("❌ Please fill in all required fields correctly.");
                                    return;
                                  }
                                  
                                  setTaxReturns(prev => [...prev, {
                                    id: "tr_" + Date.now(),
                                    year,
                                    dateFiled: new Date().toISOString().split('T')[0],
                                    status,
                                    category,
                                    totalIncome,
                                    totalTax,
                                    notes: ""
                                  }]);
                                  setShowTaxReturnForm(false);
                                  handleShowAlert("✅ Tax return logged successfully.");
                                }}
                              >
                                <div>
                                  <label className="block text-xs font-bold text-zinc-500 mb-1">Tax Year</label>
                                  <input name="year" type="number" required defaultValue={new Date().getFullYear()} className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
                                </div>
                                <div>
                                  <label className="block text-xs font-bold text-zinc-500 mb-1">Category</label>
                                  <select name="category" required className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
                                    <option value="Personal">Personal</option>
                                    <option value="Business">Business</option>
                                    <option value="Capital Gains">Capital Gains</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs font-bold text-zinc-500 mb-1">Total Income ($)</label>
                                  <input name="totalIncome" type="number" step="0.01" required defaultValue="0" className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
                                </div>
                                <div>
                                  <label className="block text-xs font-bold text-zinc-500 mb-1">Total Tax Paid/Owed ($)</label>
                                  <input name="totalTax" type="number" step="0.01" required defaultValue="0" className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
                                </div>
                                <div>
                                  <label className="block text-xs font-bold text-zinc-500 mb-1">Status</label>
                                  <select name="status" required className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
                                    <option value="filed">Filed</option>
                                    <option value="pending">Pending</option>
                                    <option value="accepted">Accepted</option>
                                    <option value="rejected">Rejected</option>
                                  </select>
                                </div>
                                <div className="flex items-end justify-end space-x-2 md:col-span-2 lg:col-span-1">
                                  <button type="button" onClick={() => setShowTaxReturnForm(false)} className="px-4 py-2 text-sm font-bold text-zinc-500 hover:text-zinc-800 transition-colors">Cancel</button>
                                  <button type="submit" className="px-4 py-2 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">Save Return</button>
                                </div>
                              </form>
                            </div>
                          )}`;

const lines = code.split('\n');
const idx = lines.findIndex(l => l.includes('+ Log Return')) + 2;

code = lines.slice(0, idx).join('\n') + '\n' + formHtml.replace('</button>\n                          </div>', '') + '\n' + lines.slice(idx).join('\n');

fs.writeFileSync('src/App.tsx', code);
console.log("Patched form");
