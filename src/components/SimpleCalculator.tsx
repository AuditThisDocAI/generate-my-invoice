import React, { useState } from 'react';

export default function SimpleCalculator() {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForNewValue, setWaitingForNewValue] = useState(false);
  const [memory, setMemory] = useState<number>(0);

  const handleDigit = (digit: string) => {
    if (waitingForNewValue) {
      setDisplay(digit);
      setWaitingForNewValue(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  };

  const handleOperator = (op: string) => {
    const inputValue = parseFloat(display);
    
    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operator) {
      const result = calculate(previousValue, inputValue, operator);
      setDisplay(String(result));
      setPreviousValue(result);
    }
    
    setOperator(op);
    setWaitingForNewValue(true);
  };

  const calculate = (a: number, b: number, op: string) => {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return a / b;
      default: return b;
    }
  };

  const handleEqual = () => {
    const inputValue = parseFloat(display);
    if (operator && previousValue !== null) {
      const result = calculate(previousValue, inputValue, operator);
      setDisplay(String(result));
      setPreviousValue(null);
      setOperator(null);
      setWaitingForNewValue(true);
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperator(null);
    setWaitingForNewValue(false);
  };

  const handleMemoryAdd = () => {
    setMemory(memory + parseFloat(display));
    setWaitingForNewValue(true);
  };

  const handleMemorySubtract = () => {
    setMemory(memory - parseFloat(display));
    setWaitingForNewValue(true);
  };

  const handleMemoryRecall = () => {
    setDisplay(String(memory));
    setWaitingForNewValue(true);
  };

  const handleMemoryClear = () => {
    setMemory(0);
  };

  return (
    <div className="w-full max-w-sm mx-auto bg-zinc-900 p-6 rounded-3xl shadow-xl space-y-4 font-mono select-none">
      <div className="bg-zinc-800 p-4 rounded-2xl flex justify-between items-center h-20 shadow-inner relative overflow-hidden">
        <span className="text-zinc-500 font-bold text-xs absolute top-2 left-3">{memory !== 0 ? 'M' : ''}</span>
        <span className="text-4xl font-light text-white truncate px-2 w-full text-right">{display}</span>
      </div>
      <div className="grid grid-cols-4 gap-3">
        <button onClick={handleMemoryClear} className="bg-zinc-600 hover:bg-zinc-500 active:scale-95 text-white font-bold py-2 rounded-xl transition-all shadow-xs text-sm">MC</button>
        <button onClick={handleMemoryRecall} className="bg-zinc-600 hover:bg-zinc-500 active:scale-95 text-white font-bold py-2 rounded-xl transition-all shadow-xs text-sm">MR</button>
        <button onClick={handleMemorySubtract} className="bg-zinc-600 hover:bg-zinc-500 active:scale-95 text-white font-bold py-2 rounded-xl transition-all shadow-xs text-sm">M-</button>
        <button onClick={handleMemoryAdd} className="bg-zinc-600 hover:bg-zinc-500 active:scale-95 text-white font-bold py-2 rounded-xl transition-all shadow-xs text-sm">M+</button>

        <button onClick={handleClear} className="col-span-2 bg-rose-500 hover:bg-rose-400 active:scale-95 text-white font-bold py-3 rounded-xl transition-all shadow-xs">C</button>
        <button onClick={() => handleOperator('/')} className="bg-amber-500 hover:bg-amber-400 active:scale-95 text-white font-bold py-3 rounded-xl transition-all shadow-xs text-xl">÷</button>
        <button onClick={() => handleOperator('*')} className="bg-amber-500 hover:bg-amber-400 active:scale-95 text-white font-bold py-3 rounded-xl transition-all shadow-xs text-xl">×</button>
        
        <button onClick={() => handleDigit('7')} className="bg-zinc-700 hover:bg-zinc-600 active:scale-95 text-white font-medium py-3 rounded-xl transition-all shadow-xs text-xl">7</button>
        <button onClick={() => handleDigit('8')} className="bg-zinc-700 hover:bg-zinc-600 active:scale-95 text-white font-medium py-3 rounded-xl transition-all shadow-xs text-xl">8</button>
        <button onClick={() => handleDigit('9')} className="bg-zinc-700 hover:bg-zinc-600 active:scale-95 text-white font-medium py-3 rounded-xl transition-all shadow-xs text-xl">9</button>
        <button onClick={() => handleOperator('-')} className="bg-amber-500 hover:bg-amber-400 active:scale-95 text-white font-bold py-3 rounded-xl transition-all shadow-xs text-xl">−</button>
        
        <button onClick={() => handleDigit('4')} className="bg-zinc-700 hover:bg-zinc-600 active:scale-95 text-white font-medium py-3 rounded-xl transition-all shadow-xs text-xl">4</button>
        <button onClick={() => handleDigit('5')} className="bg-zinc-700 hover:bg-zinc-600 active:scale-95 text-white font-medium py-3 rounded-xl transition-all shadow-xs text-xl">5</button>
        <button onClick={() => handleDigit('6')} className="bg-zinc-700 hover:bg-zinc-600 active:scale-95 text-white font-medium py-3 rounded-xl transition-all shadow-xs text-xl">6</button>
        <button onClick={() => handleOperator('+')} className="bg-amber-500 hover:bg-amber-400 active:scale-95 text-white font-bold py-3 rounded-xl transition-all shadow-xs text-xl">+</button>
        
        <button onClick={() => handleDigit('1')} className="bg-zinc-700 hover:bg-zinc-600 active:scale-95 text-white font-medium py-3 rounded-xl transition-all shadow-xs text-xl">1</button>
        <button onClick={() => handleDigit('2')} className="bg-zinc-700 hover:bg-zinc-600 active:scale-95 text-white font-medium py-3 rounded-xl transition-all shadow-xs text-xl">2</button>
        <button onClick={() => handleDigit('3')} className="bg-zinc-700 hover:bg-zinc-600 active:scale-95 text-white font-medium py-3 rounded-xl transition-all shadow-xs text-xl">3</button>
        <button onClick={handleEqual} className="row-span-2 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-white font-bold rounded-xl transition-all shadow-xs text-xl">=</button>
        
        <button onClick={() => handleDigit('0')} className="col-span-2 bg-zinc-700 hover:bg-zinc-600 active:scale-95 text-white font-medium py-3 rounded-xl transition-all shadow-xs text-xl">0</button>
        <button onClick={() => handleDigit('.')} className="bg-zinc-700 hover:bg-zinc-600 active:scale-95 text-white font-bold py-3 rounded-xl transition-all shadow-xs text-xl">.</button>
      </div>
    </div>
  );
}
