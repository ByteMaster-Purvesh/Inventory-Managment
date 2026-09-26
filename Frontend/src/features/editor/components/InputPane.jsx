import React, { useState, useRef, useEffect } from 'react';
import { useReportStore } from '../../../store/useReportStore';
import { calculateTolerance } from '../../../lib/calculations';
import { Trash2, GripVertical, Plus, Type, Bold, Italic, AlignLeft, AlignCenter, AlignRight, Image as ImageIcon, Settings2, Columns, Copy, Download, Eye } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { ReportPDF } from './pdf/ReportPDF';

const SYMBOLS = ['±', '+', '-', 'Ø', '°', '▼', '⊥', 'X', '▱', '⌯', '∥', '$'];
const FONTS = ['Helvetica', 'Times-Roman', 'Courier', 'Arial', 'Calibri', 'Verdana', 'Tahoma', 'Trebuchet MS', 'Georgia', 'Palatino Linotype', 'Book Antiqua', 'Comic Sans MS', 'Impact', 'Lucida Console', 'Lucida Sans Unicode', 'Arial Black', 'Arial Narrow', 'MS Sans Serif', 'MS Serif', 'System', 'Terminal', 'Courier New'];
const SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 24];

const InstrumentCombobox = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const options = ["D VERNIER", "CMM", "PIN GAUGE", "SURFACE COMPARATOR", "VISUAL", "BOLT", "R GAUGE"];
  
  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={value || ''}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="e.g. D VERNIER"
          className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 pr-8 text-sm focus:outline-none focus:border-orange-500 text-zinc-200"
        />
        <div 
          className="absolute inset-y-0 right-0 flex items-center px-2 cursor-pointer text-zinc-500 hover:text-zinc-300"
          onClick={() => setIsOpen(!isOpen)}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </div>
      </div>
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded shadow-xl max-h-48 overflow-y-auto hide-scrollbar">
          {options.filter(opt => opt.toLowerCase().includes((value||'').toLowerCase())).map(opt => (
            <div 
              key={opt}
              onClick={() => {
                onChange(opt);
                setIsOpen(false);
              }}
              className="px-3 py-2 text-sm text-zinc-300 hover:bg-orange-500 hover:text-white cursor-pointer transition-colors"
            >
              {opt}
            </div>
          ))}
          {options.filter(opt => opt.toLowerCase().includes((value||'').toLowerCase())).length === 0 && (
            <div className="px-3 py-2 text-sm text-zinc-500 italic">No matches...</div>
          )}
        </div>
      )}
    </div>
  );
};

export const InputPane = ({ onLivePreviewClick }) => {
  const activeTab = useReportStore((state) => state.activeInputTab);
  const setActiveTab = useReportStore((state) => state.setActiveInputTab);
  const fileInputRef = useRef(null);
  const [draggedRowIndex, setDraggedRowIndex] = useState(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

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
  const updateProjectSettings = useReportStore((state) => state.updateProjectSettings);
  const reorderRows = useReportStore((state) => state.reorderRows);
  const updateActiveProject = useReportStore((state) => state.updateActiveProject);

  if (!activeProject) return null;

  const settings = activeProject.settings || {
    fontFamily: 'Helvetica', fontSize: 11, isBold: false, isItalic: false, textAlign: 'left', logoUrl: null
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateProjectSettings('logoUrl', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectAll = (rowId, value, count) => {
    // Fill all observations for this row with the same value
    for (let i = 0; i < count; i++) {
      updateObservation(rowId, i, value);
    }
  };

  const handleLivePreview = () => {
    if (onLivePreviewClick) {
      onLivePreviewClick();
    } else {
      const previewPane = document.getElementById('preview-pane-section');
      if (previewPane) {
        previewPane.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex justify-between items-center shrink-0">
        <h2 className="font-semibold text-zinc-200 flex items-center gap-2">
          <Settings2 size={18} />
          Report Data Entry
        </h2>
        <div className="flex gap-2">
          <button 
            onClick={addRow}
            className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Add Row
          </button>
          <button 
            onClick={handleLivePreview}
            className={`flex items-center justify-center gap-2 bg-[#007acc] hover:bg-[#005999] text-white px-3 py-1.5 rounded text-sm font-medium transition-colors w-[145px]`}
          >
            <Eye size={16} />
            Live Preview
          </button>
        </div>
      </div>

      {/* Top Toolbar (Ribbon) */}
      <div className="bg-zinc-800 border-b border-zinc-800 shrink-0 flex flex-col">
        {/* Ribbon Tabs */}
        <div className="flex gap-1 px-2 pt-2 border-b border-zinc-800">
          {['Home', 'Insert', 'Data', 'Form'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 text-sm font-medium rounded-t-md transition-colors ${
                activeTab === tab ? 'bg-zinc-900 text-orange-500 border-t border-l border-r border-zinc-800' : 'text-zinc-300 hover:bg-zinc-700'
              }`}
              style={{ marginBottom: activeTab === tab ? '-1px' : '0' }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Ribbon Content */}
        <div className="bg-zinc-900 p-2 flex flex-wrap items-center gap-4 min-h-[60px] shadow-sm">
          {activeTab === 'Home' && (
            <>
              {/* Font Controls */}
              <div className="flex items-center gap-2 pr-4 border-r border-zinc-800">
                <select 
                  value={settings.fontFamily} 
                  onChange={(e) => updateProjectSettings('fontFamily', e.target.value)}
                  className="border border-zinc-700 rounded px-2 py-1 text-sm focus:outline-none bg-zinc-900"
                >
                  {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                <select 
                  value={settings.fontSize} 
                  onChange={(e) => updateProjectSettings('fontSize', parseInt(e.target.value))}
                  className="border border-zinc-700 rounded px-2 py-1 text-sm focus:outline-none w-16 bg-zinc-900"
                >
                  {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Style Controls */}
              <div className="flex items-center gap-1 pr-4 border-r border-zinc-800">
                <button 
                  onClick={() => updateProjectSettings('isBold', !settings.isBold)}
                  className={`p-1.5 rounded transition-colors ${settings.isBold ? 'bg-orange-500/20 text-orange-500' : 'text-zinc-200 hover:bg-zinc-800'}`}
                  title="Bold"
                >
                  <Bold size={16} />
                </button>
                <button 
                  onClick={() => updateProjectSettings('isItalic', !settings.isItalic)}
                  className={`p-1.5 rounded transition-colors ${settings.isItalic ? 'bg-orange-500/20 text-orange-500' : 'text-zinc-200 hover:bg-zinc-800'}`}
                  title="Italic"
                >
                  <Italic size={16} />
                </button>
              </div>

              {/* Alignment Controls */}
              <div className="flex items-center gap-1">
                {[
                  { id: 'left', icon: <AlignLeft size={16} />, title: 'Align Left' },
                  { id: 'center', icon: <AlignCenter size={16} />, title: 'Align Center' },
                  { id: 'right', icon: <AlignRight size={16} />, title: 'Align Right' },
                ].map(align => (
                  <button 
                    key={align.id}
                    onClick={() => updateProjectSettings('textAlign', align.id)}
                    className={`p-1.5 rounded transition-colors ${settings.textAlign === align.id ? 'bg-orange-500/20 text-orange-500' : 'text-zinc-200 hover:bg-zinc-800'}`}
                    title={align.title}
                  >
                    {align.icon}
                  </button>
                ))}
              </div>
            </>
          )}

          {activeTab === 'Insert' && (
            <>
              {/* Symbols Grid */}
              <div className="flex items-center gap-2 pr-4 border-r border-zinc-800">
                <span className="text-xs font-semibold text-zinc-400 mr-2 uppercase tracking-wider">Symbols:</span>
                <div className="flex flex-wrap gap-1 max-w-[320px]">
                  {SYMBOLS.map(sym => (
                    <button
                      key={sym}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        if (activeRowId) {
                          const row = activeProject.rows.find(r => r.id === activeRowId);
                          if (row) {
                            updateRow(activeRowId, 'drawingSize', (row.drawingSize || '') + ' ' + sym + ' ');
                            setTimeout(() => {
                              document.getElementById(`drawing-size-${activeRowId}`)?.focus();
                            }, 0);
                          }
                        }
                      }}
                      disabled={!activeRowId}
                      className={`w-7 h-7 flex items-center justify-center text-sm rounded border ${
                        activeRowId 
                          ? 'bg-zinc-900 border-zinc-700 hover:border-orange-500 hover:bg-orange-500/10 text-zinc-200 shadow-sm' 
                          : 'bg-transparent border-zinc-800 text-zinc-500 cursor-not-allowed'
                      }`}
                      title={`Insert ${sym}`}
                    >
                      {sym}
                    </button>
                  ))}
                </div>
              </div>

              {/* Image Upload */}
              <div className="flex items-center gap-3 pl-2">
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef}
                  onChange={handleLogoUpload}
                  className="hidden" 
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium transition-colors text-zinc-200 hover:bg-zinc-800 border border-zinc-800 shadow-sm"
                >
                  <ImageIcon size={16} />
                  Upload Logo
                </button>
                {settings.logoUrl && (
                  <button
                    onClick={() => updateProjectSettings('logoUrl', null)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
            </>
          )}

          {activeTab === 'Data' && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-300 font-medium">Clear Data:</span>
                <button 
                  onClick={() => {
                    if (confirm('Are you sure you want to delete all rows?')) {
                      deleteAllRows();
                    }
                  }}
                  className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-zinc-100 border border-zinc-700 px-3 py-1.5 rounded transition-colors shadow-sm"
                >
                  <Trash2 size={16} />
                  <span className="text-sm font-medium">Delete All Rows</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'Form' && (
            <div className="grid grid-cols-4 gap-4 w-full">
              {[
                { key: 'projectName', label: 'Project Name' },
                { key: 'customer', label: 'Customer' },
                { key: 'componentsName', label: 'Components Name' },
                { key: 'date', label: 'Date' },
                { key: 'projectNo', label: 'Project No' },
                { key: 'productionOrderNo', label: 'Production Order No' },
                { key: 'drgNo', label: 'Drg No' },
                { key: 'revNo', label: 'Rev No' },
                { key: 'inspectionReportNo', label: 'Inspection Report No' },
                { key: 'asslySubAssly', label: 'Assly/Sub-assly' },
                { key: 'qaPlanNo', label: 'QA Plan No' },
                { key: 'inspectionStage', label: 'Inspection Stage' },
                { key: 'poNo', label: 'P.O. No' },
                { key: 'rawMaterialUsed', label: 'Raw Material' },
                { key: 'quantity', label: 'Quantity' },
                { key: 'rawMtrlIdnCtrlNo', label: 'Raw Mtrl Idn/Ctrl No' },
                { key: 'identificationNos', label: 'Identification Nos' },
                { key: 'rawMtrlInDrg', label: 'Raw Mtrl In Drg' },
                { key: 'supplierName', label: 'Supplier Name' },
                { key: 'rvNo', label: 'R.V. no' },
                { key: 'remarks', label: 'Remarks' },
                { key: 'designerRemarks', label: 'Designer Remarks' },
              ].map(field => (
                <div key={field.key} className="flex flex-col gap-1">
                  <label className="text-xs text-zinc-400 font-medium">{field.label}</label>
                  <input
                    id={`input-field-${field.key}`}
                    type="text"
                    value={activeProject[field.key] || ''}
                    onChange={(e) => updateActiveProject({ [field.key]: e.target.value })}
                    className="border border-zinc-700 rounded px-2 py-1 text-sm w-full transition-all duration-300 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              ))}
              <div className="flex flex-col gap-1 col-span-2">
                <label className="text-xs text-zinc-400 font-medium">Supplier Stamp Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        updateActiveProject({ supplierStampUrl: reader.result });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="text-sm"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4">
        {activeProject.rows.length === 0 ? (
          <div className="text-center text-zinc-400 mt-10">
            No rows added yet. Click "Add Row" to start.
          </div>
        ) : (
          activeProject.rows.map((row, index) => (
            <div 
              id={`input-row-${row.id}`}
              key={row.id} 
              draggable
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', index.toString());
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              }}
              onDrop={(e) => {
                e.preventDefault();
                const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
                if (!isNaN(sourceIndex) && sourceIndex !== index) {
                  reorderRows(sourceIndex, index);
                }
              }}
              onClick={() => setActiveRow(row.id)}
              className={`bg-zinc-900 p-4 rounded-lg shadow-sm border transition-all space-y-4 cursor-pointer ${
                activeRowId === row.id 
                  ? 'border-orange-500 bg-orange-500/10' 
                  : 'border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="text-zinc-600 cursor-grab active:cursor-grabbing hover:text-zinc-400 transition-colors" title="Drag to reorder">
                    <GripVertical size={18} />
                  </div>
                  <span className={`font-bold ${activeRowId === row.id ? 'text-orange-500' : 'text-zinc-500'}`}>SR NO. {row.srNo}</span>
                  {activeRowId === row.id && <span className="text-[10px] bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full font-medium ml-2">Active</span>}
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteRow(row.id); }}
                  className="text-zinc-500 hover:text-zinc-300 p-1 rounded hover:bg-zinc-800 transition-colors"
                  title="Delete this row"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Drawing Size */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-400">DRAWING SIZE</label>
                  <div className="flex">
                    <input
                      id={`drawing-size-${row.id}`}
                      type="text"
                      value={row.drawingSize}
                      onChange={(e) => updateRow(row.id, 'drawingSize', e.target.value)}
                      placeholder="e.g. ± 30"
                      className="flex-1 border border-zinc-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-orange-500 bg-transparent text-zinc-200"
                    />
                  </div>
                </div>

                {/* Tolerance */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-400">TOLERANCE (Input)</label>
                  <input
                    type="text"
                    value={row.toleranceVal}
                    onChange={(e) => updateRow(row.id, 'toleranceVal', e.target.value)}
                    placeholder="e.g. 0.2"
                    className="w-full border border-zinc-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-orange-500 bg-transparent text-zinc-200"
                  />
                  <div className="text-[10px] text-zinc-500 text-right mt-1">
                    Calc: {row.calculatedTolerance || '-'}
                  </div>
                </div>

                {/* Places */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-400">PLACES</label>
                  <input
                    type="text"
                    value={row.places || ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      updateRow(row.id, 'places', val);
                    }}
                    placeholder="e.g. 1"
                    className="w-full border border-zinc-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-orange-500 bg-transparent text-zinc-200"
                  />
                </div>

                {/* Instrument */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-400">INST. USED</label>
                  <InstrumentCombobox 
                    value={row.instrument} 
                    onChange={(val) => updateRow(row.id, 'instrument', val)} 
                  />
                </div>
              </div>

              {/* Component Identification (Observations) */}
              <div className="bg-zinc-950/50 p-3 rounded border border-zinc-800">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-4">
                    <label className="text-xs font-medium text-zinc-200">OBSERVATIONS (JOBS)</label>
                    <div className="flex gap-1 border-l border-zinc-800 pl-4">
                      <button 
                        onClick={removeObservationColumn}
                        className="p-1 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded flex items-center text-xs"
                        title="Remove Job/Piece Column"
                      >
                        <Columns size={12} className="mr-1" /> -
                      </button>
                      <button 
                        onClick={addObservationColumn}
                        className="p-1 text-zinc-400 hover:text-orange-500 hover:bg-orange-500/10 rounded flex items-center text-xs"
                        title="Add Job/Piece Column"
                      >
                        <Columns size={12} className="mr-1" /> +
                      </button>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleSelectAll(row.id, row.observations[0], row.observations.length)}
                    className="text-[10px] flex items-center gap-1 text-orange-500 hover:text-orange-400"
                    title="Apply first value to all jobs in this row"
                  >
                    <Copy size={12} /> Select All
                  </button>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {row.observations.map((obs, idx) => (
                    <div key={idx} className="flex-1 min-w-[80px]">
                      <div className="text-[10px] text-zinc-500 mb-1 text-center">Job {idx + 1}</div>
                      <input
                        type="text"
                        value={obs}
                        onChange={(e) => updateObservation(row.id, idx, e.target.value)}
                        className="w-full text-center border border-zinc-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-orange-500"
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
