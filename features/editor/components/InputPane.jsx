import React from 'react';
import { useReportStore } from '../../../store/useReportStore';
import { Plus, Copy, Trash2, Columns, Settings2 } from 'lucide-react';

const SYMBOLS = ['±', '+', '-', '%', 'Φ', '⟂', '//', '∠', '◎', '◯', '⌗', '°', 'X', '▽'];

export const InputPane = () => {
  const activeProject = useReportStore((state) => state.activeProject);
  const activeRowId = useReportStore((state) => state.activeRowId);
  const addRow = useReportStore((state) => state.addRow);
  const setActiveRow = useReportStore((state) => state.setActiveRow);
  const deleteRow = useReportStore((state) => state.deleteRow);
  const deleteAllRows = useReportStore((state) => state.deleteAllRows);
  const updateRow = useReportStore((state) => state.updateRow);
  const updateObservation = useReportStore((state) => state.updateObservation);
  const addObservationColumn = useReportStore((state) => state.addObservationColumn);
  const removeObservationColumn = useReportStore((state) => state.removeObservationColumn);

  if (!activeProject) return null;

  const handleSelectAll = (rowId, value, count) => {
    // Fill all observations for this row with the same value
    for (let i = 0; i < count; i++) {
      updateObservation(rowId, i, value);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 bg-white border-b border-slate-200 flex justify-between items-center shrink-0">
        <h2 className="font-semibold text-slate-700 flex items-center gap-2">
          <Settings2 size={18} />
          Report Data Entry
        </h2>
        <div className="flex gap-2">
          <button 
            onClick={addRow}
            className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Add Row
          </button>
        </div>
      </div>

      {/* Top Toolbar (Ribbon) */}
      <div className="bg-slate-50 border-b border-slate-200 p-2 shrink-0 flex flex-wrap items-center gap-4">
        {/* Clear All Rows Button */}
        <button
          onClick={() => {
            if (window.confirm("Are you sure you want to clear all rows?")) {
              deleteAllRows();
            }
          }}
          className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium transition-colors text-red-600 hover:bg-red-100 bg-white border border-red-200 shadow-sm"
          title="Clear All Rows"
        >
          <Trash2 size={16} />
          Clear All
        </button>

        <div className="w-px h-6 bg-slate-300"></div>

        {/* Symbols Grid */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 mr-2 uppercase tracking-wider">Symbols:</span>
          <div className="flex flex-wrap gap-1">
            {SYMBOLS.map(sym => (
              <button
                key={sym}
                onClick={() => {
                  if (activeRowId) {
                    const row = activeProject.rows.find(r => r.id === activeRowId);
                    if (row) {
                      updateRow(activeRowId, 'drawingSize', (row.drawingSize || '') + sym);
                    }
                  }
                }}
                disabled={!activeRowId}
                className={`w-7 h-7 flex items-center justify-center text-sm rounded border ${
                  activeRowId 
                    ? 'bg-white border-slate-300 hover:border-blue-500 hover:bg-blue-50 text-slate-700 shadow-sm' 
                    : 'bg-transparent border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
                title={`Insert ${sym}`}
              >
                {sym}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {activeProject.rows.length === 0 ? (
          <div className="text-center text-slate-500 mt-10">
            No rows added yet. Click "Add Row" to start.
          </div>
        ) : (
          activeProject.rows.map((row, index) => (
            <div 
              key={row.id} 
              onClick={() => setActiveRow(row.id)}
              className={`bg-white p-4 rounded-lg shadow-sm border transition-all space-y-4 cursor-pointer ${
                activeRowId === row.id 
                  ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50/10' 
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${activeRowId === row.id ? 'text-blue-600' : 'text-slate-400'}`}>SR NO. {row.srNo}</span>
                  {activeRowId === row.id && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium ml-2">Active</span>}
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteRow(row.id); }}
                  className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors"
                  title="Delete this row"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Drawing Size */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">DRAWING SIZE</label>
                  <div className="flex">
                    <input
                      type="text"
                      value={row.drawingSize}
                      onChange={(e) => updateRow(row.id, 'drawingSize', e.target.value)}
                      placeholder="e.g. ± 30"
                      className="flex-1 border border-slate-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Tolerance */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">TOLERANCE (Input)</label>
                  <input
                    type="text"
                    value={row.toleranceVal}
                    onChange={(e) => updateRow(row.id, 'toleranceVal', e.target.value)}
                    placeholder="e.g. 0.2"
                    className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                  />
                  <div className="text-[10px] text-slate-400 text-right mt-1">
                    Calc: {row.calculatedTolerance || '-'}
                  </div>
                </div>

                {/* Instrument */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">INST. USED</label>
                  <input
                    type="text"
                    list="instruments"
                    value={row.instrument}
                    onChange={(e) => updateRow(row.id, 'instrument', e.target.value)}
                    placeholder="e.g. D VERNIER"
                    className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                  />
                  <datalist id="instruments">
                    <option value="D VERNIER" />
                    <option value="CMM" />
                    <option value="PIN GAUGE" />
                    <option value="SURFACE COMPARATOR" />
                    <option value="VISUAL" />
                    <option value="BOLT" />
                    <option value="R GAUGE" />
                  </datalist>
                </div>
              </div>

              {/* Component Identification (Observations) */}
              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-4">
                    <label className="text-xs font-medium text-slate-700">OBSERVATIONS (JOBS)</label>
                    <div className="flex gap-1 border-l border-slate-200 pl-4">
                      <button 
                        onClick={removeObservationColumn}
                        className="p-1 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded flex items-center text-xs"
                        title="Remove Job/Piece Column"
                      >
                        <Columns size={12} className="mr-1" /> -
                      </button>
                      <button 
                        onClick={addObservationColumn}
                        className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded flex items-center text-xs"
                        title="Add Job/Piece Column"
                      >
                        <Columns size={12} className="mr-1" /> +
                      </button>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleSelectAll(row.id, row.observations[0], row.observations.length)}
                    className="text-[10px] flex items-center gap-1 text-blue-600 hover:text-blue-800"
                    title="Apply first value to all jobs in this row"
                  >
                    <Copy size={12} /> Select All
                  </button>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {row.observations.map((obs, idx) => (
                    <div key={idx} className="flex-1 min-w-[80px]">
                      <div className="text-[10px] text-slate-400 mb-1 text-center">Job {idx + 1}</div>
                      <input
                        type="text"
                        value={obs}
                        onChange={(e) => updateObservation(row.id, idx, e.target.value)}
                        className="w-full text-center border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
};
