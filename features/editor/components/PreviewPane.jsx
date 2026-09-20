import React, { useState, useEffect, useRef } from 'react';
import { useReportStore } from '../../../store/useReportStore';
import { checkIsOutOfTolerance } from '../../../lib/calculations';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';

export const PreviewPane = () => {
  const activeProject = useReportStore((state) => state.activeProject);
  const [zoomScale, setZoomScale] = useState(0.8); // Start slightly zoomed out to fit better
  const containerRef = useRef(null);

  if (!activeProject) return null;

  const jobCount = activeProject.rows[0]?.observations.length || 1;
  const colSpanForId = jobCount > 1 ? jobCount : 1;

  const settings = activeProject.settings || {
    fontFamily: 'Helvetica', fontSize: 11, isBold: false, isItalic: false, textAlign: 'left', logoUrl: null
  };

  const dynamicStyle = {
    fontFamily: settings.fontFamily === 'Times-Roman' ? '"Times New Roman", Times, serif' : 
                settings.fontFamily === 'Courier' ? '"Courier New", Courier, monospace' : 'Arial, Helvetica, sans-serif',
    fontSize: `${settings.fontSize}px`,
    fontWeight: settings.isBold ? 'bold' : 'normal',
    fontStyle: settings.isItalic ? 'italic' : 'normal',
    textAlign: settings.textAlign,
  };

  // Chunk rows to simulate A4 pages. A4 portrait (794x1123) fits approx 30 rows comfortably.
  const ROWS_PER_PAGE = 30;
  const pages = [];
  for (let i = 0; i < activeProject.rows.length; i += ROWS_PER_PAGE) {
    pages.push(activeProject.rows.slice(i, i + ROWS_PER_PAGE));
  }
  if (pages.length === 0) pages.push([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        setZoomScale(prev => {
          const newScale = prev - (e.deltaY * 0.001);
          return Math.min(Math.max(0.3, newScale), 2.5);
        });
      }
    };

    // Use native event listener for preventDefault on wheel
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  return (
    <div className="relative flex flex-col h-full w-full bg-slate-200 overflow-auto" ref={containerRef}>
      {/* Zoom Controls Overlay */}
      <div className="sticky top-4 right-8 z-10 flex items-center justify-end gap-2 pr-4 pt-4 pointer-events-none">
        <div className="flex items-center gap-1 bg-white p-1 rounded-lg shadow-md border border-slate-200 pointer-events-auto">
          <button onClick={() => setZoomScale(p => Math.max(0.3, p - 0.1))} className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors" title="Zoom Out">
            <ZoomOut size={18} />
          </button>
          <span className="text-sm font-medium w-12 text-center text-slate-700">{Math.round(zoomScale * 100)}%</span>
          <button onClick={() => setZoomScale(p => Math.min(2.5, p + 0.1))} className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors" title="Zoom In">
            <ZoomIn size={18} />
          </button>
          <div className="w-px h-4 bg-slate-300 mx-1"></div>
          <button onClick={() => setZoomScale(0.8)} className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors" title="Reset Zoom">
            <Maximize size={18} />
          </button>
        </div>
      </div>

      <div className="flex justify-center min-w-max p-8">
        <div 
          className="flex flex-col gap-8 pb-10 origin-top shrink-0"
          style={{ transform: `scale(${zoomScale})` }}
        >
          {pages.map((pageRows, pageIndex) => (
            <div 
              key={pageIndex}
              className="bg-white w-[794px] shadow-2xl p-6 leading-tight text-black flex flex-col relative"
              style={{ ...dynamicStyle, minHeight: '1123px' }}
            >
              {/* Header Section */}
              {pageIndex === 0 ? (
                <div className="border border-black mb-1 text-[10px]">
                  {/* Row 1: Logo and Title */}
                  <div className="flex border-b border-black">
                    <div className="w-1/3 p-2 border-r border-black flex items-center justify-center">
                      {settings.logoUrl ? (
                        <img src={settings.logoUrl} alt="Company Logo" className="max-w-full max-h-12 object-contain" />
                      ) : (
                        <h1 className="text-xl font-bold text-blue-700 italic">Godrej AEROSPACE</h1>
                      )}
                    </div>
                    <div className="w-2/3 p-2 flex flex-col justify-center">
                      <h2 className="text-lg font-bold">INSPECTION REPORT</h2>
                      <p className="font-semibold">Format No.QC16/FM/35</p>
                      <p>Rev-01 & 11/10/2011</p>
                    </div>
                  </div>

                  {/* Grid for metadata */}
                  <div className="grid grid-cols-2 divide-x divide-black">
                    {/* Left Column */}
                    <div className="flex flex-col divide-y divide-black">
                      <div className="grid grid-cols-2 divide-x divide-black">
                        <div className="p-1">Project: <span className="font-bold">{activeProject.projectName}</span></div>
                        <div className="p-1">Project no: {activeProject.projectNo}</div>
                      </div>
                      <div className="p-1">Production order no.: {activeProject.productionOrderNo}</div>
                      <div className="p-1">Customer: <span className="font-bold">{activeProject.customer}</span></div>
                      <div className="p-1">Assly / sub-assly: {activeProject.asslySubAssly}</div>
                      <div className="p-1">Inspection stage: {activeProject.inspectionStage}</div>
                      <div className="p-1">Raw material used: {activeProject.rawMaterialUsed}</div>
                      <div className="p-1">Raw mtrl. Idn/Ctrl. No: {activeProject.rawMtrlIdnCtrlNo}</div>
                      <div className="p-1 flex gap-2">Raw mtrl. In Drg. <span className="font-bold">{activeProject.rawMtrlInDrg}</span></div>
                      <div className="p-1">R.V. no: {activeProject.rvNo}</div>
                    </div>
                    
                    {/* Right Column */}
                    <div className="flex flex-col divide-y divide-black">
                      <div className="grid grid-cols-2 divide-x divide-black">
                        <div className="p-1">Date: {activeProject.date}</div>
                        <div className="p-1">Page no.: {pageIndex + 1} of {pages.length}</div>
                      </div>
                      <div className="grid grid-cols-[1fr_auto_auto] divide-x divide-black">
                        <div className="p-1">Components name: <span className="font-bold">{activeProject.componentsName}</span></div>
                        <div className="p-1 px-2 whitespace-nowrap">Drg. No: {activeProject.drgNo}</div>
                        <div className="p-1 px-2 whitespace-nowrap">Rev No.: {activeProject.revNo}</div>
                      </div>
                      <div className="p-1">Inspection report no: {activeProject.inspectionReportNo}</div>
                      <div className="p-1">QA Plan No: {activeProject.qaPlanNo}</div>
                      <div className="p-1">P. O. No : {activeProject.poNo}</div>
                      <div className="p-1">Quantity: {activeProject.quantity}</div>
                      <div className="p-1">Identification nos.: {activeProject.identificationNos}</div>
                      <div className="p-1">Supplier Name: {activeProject.supplierName || 'PRECITECH ENGINEERING WORKS'}</div>
                      <div className="p-1 min-h-[22px]"></div> {/* Empty block for balance */}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border border-black mb-1 text-[10px]">
                  {/* Row 1: Logo and Title */}
                  <div className="flex border-b border-black">
                    <div className="w-1/3 p-2 border-r border-black flex items-center justify-center">
                      {settings.logoUrl ? (
                        <img src={settings.logoUrl} alt="Company Logo" className="max-w-full max-h-12 object-contain" />
                      ) : (
                        <h1 className="text-xl font-bold text-blue-700 italic">Godrej AEROSPACE</h1>
                      )}
                    </div>
                    <div className="w-2/3 p-2 flex flex-col justify-center">
                      <h2 className="text-lg font-bold">INSPECTION REPORT</h2>
                      <p className="italic">Common continuation sheet</p>
                    </div>
                  </div>
                  {/* Simplified Metadata */}
                  <div className="grid grid-cols-3 divide-x divide-black border-b border-black">
                    <div className="p-1">Project: <span className="font-bold">{activeProject.projectName}</span></div>
                    <div className="p-1">Date: {activeProject.date}</div>
                    <div className="p-1">Page no.: {pageIndex + 1} of {pages.length}</div>
                  </div>
                  <div className="grid grid-cols-[1fr_auto_auto] divide-x divide-black">
                    <div className="p-1">Comp name: {activeProject.componentsName}</div>
                    <div className="p-1 px-2">Drg. No: {activeProject.drgNo}</div>
                    <div className="p-1 px-2">Rev No.: {activeProject.revNo}</div>
                  </div>
                </div>
              )}

              {/* Main Data Table */}
              <table className="w-full border-collapse border border-black text-center table-fixed text-[10px] flex-grow">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="border border-black p-1 w-8 font-semibold" rowSpan={2}>SR.<br/>NO.</th>
                    <th className="border border-black p-1 w-28 font-semibold" rowSpan={2}>DRAWING SIZE</th>
                    <th className="border border-black p-1 w-16 font-semibold" rowSpan={2}>TOLERANCE</th>
                    <th className="border border-black p-1 font-semibold" colSpan={colSpanForId}>COMPONENT IDENTIFICATION</th>
                    <th className="border border-black p-1 w-16 font-semibold" rowSpan={2}>Inst. Used</th>
                    <th className="border border-black p-1 w-10 font-semibold" rowSpan={2}>Inst.<br/>No</th>
                  </tr>
                  {/* Subheader for Jobs */}
                  <tr>
                    {Array.from({ length: colSpanForId }).map((_, i) => (
                      <th key={i} className="border border-black p-1 font-semibold bg-slate-50">
                        0{i + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((row) => (
                    <tr key={row.id}>
                      <td className="border border-black p-1">{row.srNo}</td>
                      <td className="border border-black p-1 break-words">
                        {row.drawingSizeSymbol} {row.drawingSize}
                      </td>
                      <td className="border border-black p-1">
                        {row.calculatedTolerance !== '-' ? row.calculatedTolerance : row.toleranceVal || '-'}
                      </td>
                      
                      {/* Observations / Jobs */}
                      {row.observations.map((obs, idx) => {
                        const isOutOfTol = checkIsOutOfTolerance(row.calculatedTolerance, obs);
                        return (
                          <td key={idx} className={`border border-black p-1 ${isOutOfTol ? 'font-bold' : ''}`}>
                            {obs || '-'}
                          </td>
                        );
                      })}

                      <td className="border border-black p-1">{row.instrument || '-'}</td>
                      <td className="border border-black p-1">{row.instrumentNo || ''}</td>
                    </tr>
                  ))}
                  {/* Empty rows to fill the page */}
                  {Array.from({ length: Math.max(0, ROWS_PER_PAGE - pageRows.length) }).map((_, i) => (
                    <tr key={`empty-${i}`}>
                      <td className="border border-black p-1 h-[26px]"></td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1"></td>
                      {Array.from({ length: colSpanForId }).map((_, j) => (
                        <td key={j} className="border border-black p-1"></td>
                      ))}
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1"></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Footer Section */}
              <div className="border border-black border-t-0 flex flex-col text-[10px]">
                <div className="border-b border-black p-1 h-[40px]">
                  Remarks : {activeProject.remarks}
                </div>
                <div className="border-b border-black p-1 h-[40px]">
                  Remarks(Designer) : {activeProject.designerRemarks}
                </div>
                
                <div className="flex h-[80px]">
                  <div className="flex-[2] border-r border-black p-1 flex flex-col relative">
                    <span className="absolute top-1 left-1">Supplier:</span>
                    {activeProject.supplierStampUrl && (
                      <img src={activeProject.supplierStampUrl} alt="Stamp" className="absolute top-1 left-12 max-h-[60px] opacity-80" />
                    )}
                    <span className="font-bold self-center mt-auto mb-1">GODREJ & BOYCE MFG. CO. LTD.</span>
                  </div>
                  <div className="flex-1 border-r border-black p-1 flex flex-col justify-end items-center">
                    <span className="mb-1 font-bold">Inspected By</span>
                  </div>
                  <div className="flex-1 border-r border-black p-1 flex flex-col justify-end items-center">
                    <span className="mb-1 font-bold">Verified By</span>
                  </div>
                  <div className="flex-1 border-r border-black p-1 flex flex-col justify-end items-center">
                    <span className="mb-1 font-bold">Inspected By</span>
                  </div>
                  <div className="flex-1 border-r border-black p-1 flex flex-col justify-end items-center">
                    <span className="mb-1 font-bold">Verified By</span>
                  </div>
                  <div className="flex-1 p-1 flex flex-col justify-end items-center">
                    <span className="mb-1 font-bold">Designer</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
