import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useReportStore } from '../../../store/useReportStore';
import { checkIsOutOfTolerance } from '../../../lib/calculations';
import { ZoomIn, ZoomOut, Maximize, Trash2, Copy, FlipHorizontal, Files, Hand, MousePointer2, ChevronUp, ChevronDown, RotateCw } from "lucide-react";
import { Rnd } from "react-rnd";

export const PreviewPane = () => {
  const activeProject = useReportStore((state) => state.activeProject);
  const updateActiveProject = useReportStore((state) => state.updateActiveProject);
  const updateProjectSettings = useReportStore((state) => state.updateProjectSettings);
  const [zoomScale, setZoomScale] = useState(0.8); // Start slightly zoomed out to fit better
  const containerRef = useRef(null);
  const [isDraggingOverStamp, setIsDraggingOverStamp] = useState(false);
  const [isDraggingOverGodrejStamp, setIsDraggingOverGodrejStamp] = useState(false);
  const [isDraggingOverLogo, setIsDraggingOverLogo] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const [activeTool, setActiveTool] = useState('select'); // 'select' or 'pan'
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [scrollStart, setScrollStart] = useState({ left: 0, top: 0 });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageInputValue, setPageInputValue] = useState("1");

  useEffect(() => {
    setPageInputValue(currentPage.toString());
  }, [currentPage]);

  const scrollToPage = (pageNum) => {
    if (pageNum < 1) pageNum = 1;
    const els = document.querySelectorAll('.pdf-page-container');
    if (pageNum > els.length) pageNum = els.length;
    if (pageNum < 1) return;
    
    const el = document.getElementById(`page-${pageNum}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setCurrentPage(pageNum);
    }
  };

  const handleScroll = (e) => {
    const container = containerRef.current;
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const pageElements = document.querySelectorAll('.pdf-page-container');
    
    let closestPage = 1;
    let minDistance = Infinity;

    pageElements.forEach((el, index) => {
      const rect = el.getBoundingClientRect();
      const distance = Math.abs(rect.top - containerRect.top);
      if (distance < minDistance) {
        minDistance = distance;
        closestPage = index + 1;
      }
    });

    if (closestPage !== currentPage) {
      setCurrentPage(closestPage);
    }
  };

  const handleMouseDown = (e) => {
    if (activeTool === 'pan') {
      setIsPanning(true);
      setPanStart({ x: e.pageX, y: e.pageY });
      if (containerRef.current) {
        setScrollStart({ 
          left: containerRef.current.scrollLeft, 
          top: containerRef.current.scrollTop 
        });
      }
    } else {
      setSelectedImage(null);
    }
  };

  const handleMouseMove = (e) => {
    if (!isPanning || activeTool !== 'pan' || !containerRef.current) return;
    e.preventDefault();
    const dx = e.pageX - panStart.x;
    const dy = e.pageY - panStart.y;
    containerRef.current.scrollLeft = scrollStart.left - dx;
    containerRef.current.scrollTop = scrollStart.top - dy;
  };

  const handleMouseUpOrLeave = () => {
    if (isPanning) setIsPanning(false);
  };

  const flipImageHorizontally = (url, callback) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.translate(img.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0);
      callback(canvas.toDataURL());
    };
    img.src = url;
  };

  const copyImageToClipboard = async (url) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
    } catch (err) {
      console.error('Failed to copy image: ', err);
    }
  };

  const zoomScaleRef = useRef(zoomScale);
  const pendingScrollRef = useRef(null);
  const contentRef = useRef(null);
  const [contentHeight, setContentHeight] = useState(0);

  // Keep ref in sync for event listeners
  useLayoutEffect(() => {
    zoomScaleRef.current = zoomScale;
  }, [zoomScale]);

  // Apply scroll adjustments after re-render when zooming
  useLayoutEffect(() => {
    if (pendingScrollRef.current && containerRef.current) {
      containerRef.current.scrollLeft = pendingScrollRef.current.left;
      containerRef.current.scrollTop = pendingScrollRef.current.top;
      pendingScrollRef.current = null;
    }
  }, [zoomScale]);

  useEffect(() => {
    if (contentRef.current) {
      const ro = new ResizeObserver((entries) => {
        for (let entry of entries) {
          setContentHeight(entry.contentRect.height);
        }
      });
      ro.observe(contentRef.current);
      return () => ro.disconnect();
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const currentZoom = zoomScaleRef.current;
        
        let newZoom = currentZoom;
        if (e.deltaY < 0) {
          newZoom = Math.min(2.5, currentZoom + 0.1);
        } else if (e.deltaY > 0) {
          newZoom = Math.max(0.3, currentZoom - 0.1);
        }

        if (newZoom !== currentZoom) {
          const rect = container.getBoundingClientRect();
          
          // Find pointer coords relative to the scrolling container's top-left
          const pointerX = e.clientX - rect.left;
          const pointerY = e.clientY - rect.top;

          // Current point on the unscaled canvas
          const canvasX = (pointerX + container.scrollLeft) / currentZoom;
          const canvasY = (pointerY + container.scrollTop) / currentZoom;

          // New scroll position to keep that canvas point under the pointer
          const newScrollLeft = canvasX * newZoom - pointerX;
          const newScrollTop = canvasY * newZoom - pointerY;

          pendingScrollRef.current = { left: newScrollLeft, top: newScrollTop };
          setZoomScale(newZoom);
        }
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

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

  const handleDragOverStamp = (e) => {
    e.preventDefault();
    setIsDraggingOverStamp(true);
  };

  const handleDragLeaveStamp = (e) => {
    e.preventDefault();
    setIsDraggingOverStamp(false);
  };

  const handleDropStamp = (e) => {
    e.preventDefault();
    setIsDraggingOverStamp(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateActiveProject({ supplierStampUrl: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOverLogo = (e) => {
    e.preventDefault();
    setIsDraggingOverLogo(true);
  };

  const handleDragLeaveLogo = (e) => {
    e.preventDefault();
    setIsDraggingOverLogo(false);
  };

  const handleDropLogo = (e) => {
    e.preventDefault();
    setIsDraggingOverLogo(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateProjectSettings('logoUrl', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOverGodrejStamp = (e) => {
    e.preventDefault();
    setIsDraggingOverGodrejStamp(true);
  };

  const handleDragLeaveGodrejStamp = (e) => {
    e.preventDefault();
    setIsDraggingOverGodrejStamp(false);
  };

  const handleDropGodrejStamp = (e) => {
    e.preventDefault();
    setIsDraggingOverGodrejStamp(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateActiveProject({ godrejStampUrl: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };



  return (
    <>
      <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
      <div 
        className={`relative flex flex-col h-full w-full bg-slate-200 overflow-auto hide-scrollbar ${activeTool === 'pan' ? `select-none ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}` : ''}`} 
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        ref={containerRef} 
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onScroll={handleScroll}
      >
      {/* Vertical Toolbar Overlay */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none">
        <div className="flex flex-col items-center gap-2 bg-slate-800/95 backdrop-blur-sm text-slate-200 p-2 rounded-xl shadow-2xl border border-slate-700/50 pointer-events-auto">
          {/* Page Info */}
          <div className="flex flex-col items-center gap-1 mb-1">
            <input 
              value={pageInputValue}
              onChange={(e) => setPageInputValue(e.target.value)}
              onBlur={(e) => {
                let p = parseInt(e.target.value);
                if (isNaN(p) || p < 1) p = 1;
                setPageInputValue(p.toString());
                scrollToPage(p);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.target.blur();
              }}
              className="w-8 px-1 py-1 bg-slate-900 rounded border border-slate-700 text-xs text-center text-white outline-none focus:border-blue-500 transition-colors"
            />
            <div className="text-[11px] text-slate-400 font-medium">{pages.length}</div>
          </div>
          
          <button 
            onClick={() => scrollToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className={`p-2 rounded-lg transition-colors ${currentPage <= 1 ? 'text-slate-600' : 'hover:bg-slate-700 text-slate-300 hover:text-white'}`} 
            title="Previous Page"
          >
            <ChevronUp size={20} />
          </button>
          <button 
            onClick={() => scrollToPage(currentPage + 1)}
            disabled={currentPage >= pages.length}
            className={`p-2 rounded-lg transition-colors ${currentPage >= pages.length ? 'text-slate-600' : 'hover:bg-slate-700 text-slate-300 hover:text-white'}`} 
            title="Next Page"
          >
            <ChevronDown size={20} />
          </button>
          
          <div className="w-8 h-px bg-slate-700/80 my-1"></div>
          
          <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-300 hover:text-white" title="Rotate">
            <RotateCw size={18} />
          </button>
          <button onClick={() => setZoomScale(1)} className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-300 hover:text-white" title="Fit to Page">
            <Maximize size={18} />
          </button>
          
          <button onClick={() => setZoomScale(p => Math.min(2.5, p + 0.1))} className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-300 hover:text-white" title="Zoom In">
            <ZoomIn size={18} />
          </button>
          <button onClick={() => setZoomScale(p => Math.max(0.3, p - 0.1))} className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-300 hover:text-white" title="Zoom Out">
            <ZoomOut size={18} />
          </button>
          
          <div className="text-[10px] font-medium text-slate-400 mb-1">{Math.round(zoomScale * 100)}%</div>
          
          <div className="w-8 h-px bg-slate-700/80 my-1"></div>

          <button 
            onClick={() => setActiveTool('select')} 
            className={`p-2 rounded-lg transition-colors ${activeTool === 'select' ? 'bg-blue-600 text-white' : 'hover:bg-slate-700 text-slate-300'}`} 
            title="Select Tool"
          >
            <MousePointer2 size={18} />
          </button>
          <button 
            onClick={() => setActiveTool('pan')} 
            className={`p-2 rounded-lg transition-colors ${activeTool === 'pan' ? 'bg-blue-600 text-white' : 'hover:bg-slate-700 text-slate-300'}`} 
            title="Pan Tool"
          >
            <Hand size={18} />
          </button>
        </div>
      </div>

      <div 
        className="shrink-0"
        style={{
          width: `${794 * zoomScale + 64}px`, // Add space for padding
          height: contentHeight ? `${contentHeight * zoomScale + 64}px` : 'auto',
          marginLeft: `max(32px, calc(50% - ${(794 * zoomScale) / 2}px))`,
          paddingTop: '32px',
          paddingBottom: '32px'
        }}
      >
        <div 
          ref={contentRef}
          className="flex flex-col gap-8 shrink-0 origin-top-left"
          style={{ transform: `scale(${zoomScale})`, width: '794px', pointerEvents: activeTool === 'pan' ? 'none' : 'auto' }}
        >
          {pages.map((pageRows, pageIndex) => (
            <div 
              key={pageIndex}
              id={`page-${pageIndex + 1}`}
              className="bg-white w-[794px] shadow-2xl p-6 leading-tight text-black flex flex-col relative pdf-page-container"
              style={{ ...dynamicStyle, minHeight: '1123px' }}
            >
              {/* Header Section */}
              {pageIndex === 0 ? (
                <div className="border border-black mb-1 text-[10px]">
                  {/* Row 1: Logo and Title */}
                  <div className="flex border-b border-black">
                    <div 
                      className={`w-1/2 p-2 border-r border-black flex items-center justify-center transition-colors relative overflow-hidden ${isDraggingOverLogo ? 'bg-blue-100/50' : ''}`}
                      onDragOver={handleDragOverLogo}
                      onDragLeave={handleDragLeaveLogo}
                      onDrop={handleDropLogo}
                    >
                      {settings.logoUrl ? (
                        <Rnd
                          size={{ width: settings.logoTransform?.width || 150, height: settings.logoTransform?.height || 48 }}
                          position={{ x: settings.logoTransform?.x || 0, y: settings.logoTransform?.y || 0 }}
                          onDragStop={(e, d) => {
                            updateProjectSettings('logoTransform', { ...(settings.logoTransform || {}), x: d.x, y: d.y });
                          }}
                          onResizeStop={(e, direction, ref, delta, position) => {
                            updateProjectSettings('logoTransform', {
                              width: parseInt(ref.style.width, 10),
                              height: parseInt(ref.style.height, 10),
                              ...position,
                            });
                          }}
                          bounds="parent"
                          scale={zoomScale}
                          className={`border border-dashed transition-colors flex items-center justify-center z-10 ${selectedImage === 'logo' ? 'border-blue-500' : 'border-transparent hover:border-blue-400'}`}
                          onClick={(e) => { e.stopPropagation(); setSelectedImage('logo'); }}
                        >
                          <img src={settings.logoUrl} alt="Company Logo" className="w-full h-full pointer-events-none" />
                          
                          {selectedImage === 'logo' && (
                            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-md border border-gray-200 flex gap-1 p-1 z-50 pointer-events-auto" onClick={e => e.stopPropagation()}>
                              <button title="Copy Image" className="p-1 hover:bg-gray-100 rounded text-gray-700" onClick={() => copyImageToClipboard(settings.logoUrl)}><Copy size={16} /></button>
                              <button title="Duplicate (Disabled for Logo)" className="p-1 hover:bg-gray-100 rounded text-gray-300 cursor-not-allowed"><Files size={16} /></button>
                              <button title="Flip Horizontal" className="p-1 hover:bg-gray-100 rounded text-gray-700" onClick={() => flipImageHorizontally(settings.logoUrl, (url) => updateProjectSettings('logoUrl', url))}><FlipHorizontal size={16} /></button>
                              <button title="Delete" className="p-1 hover:bg-gray-100 rounded text-red-600" onClick={() => updateProjectSettings('logoUrl', null)}><Trash2 size={16} /></button>
                            </div>
                          )}
                        </Rnd>
                      ) : (
                        <h1 className="text-xl font-bold text-blue-700 italic pointer-events-none">Godrej AEROSPACE</h1>
                      )}
                    </div>
                    <div className="w-1/3 p-2 flex flex-col justify-center items-start pl-8 font-bold">
                      <div className="text-lg tracking-wider">INSPECTION REPORT</div>
                      <div className="text-[12px]">Format No.QC16/FM/35</div>
                      <div className="text-[12px]">Rev-01 & 11/10/2011</div>
                    </div>
                  </div>

                  {/* Grid for metadata */}
                  <div className="grid grid-cols-2 divide-x divide-black">
                    {/* Left Column */}
                    <div className="flex flex-col divide-y divide-black">
                      <div className="grid grid-cols-[65%_35%] divide-x divide-black">
                        <div className="p-1">Project: <span className="font-bold">{activeProject.projectName}</span></div>
                        <div className="p-1">Project no: {activeProject.projectNo}</div>
                      </div>
                      <div className="p-1">Production order no.: {activeProject.productionOrderNo}</div>
                      <div className="p-1">Customer: <span className="font-bold">{activeProject.customer}</span></div>
                      <div className="p-1">Assly / sub-assly: {activeProject.asslySubAssly}</div>
                      <div className="p-1">Inspection stage: {activeProject.inspectionStage}</div>
                      <div className="p-1">Raw material used: {activeProject.rawMaterialUsed}</div>
                      <div className="p-1">Raw mtrl. Idn/Ctrl. No: {activeProject.rawMtrlIdnCtrlNo}</div>
                      <div className="p-1">Raw mtrl. In Drg. {activeProject.rawMtrlInDrg}</div>
                      <div className="p-1">R .V. no: {activeProject.rvNo}</div>
                    </div>
                    
                    {/* Right Column */}
                    <div className="flex flex-col divide-y divide-black">
                      <div className="grid grid-cols-2 divide-x divide-black">
                        <div className="p-1">Date: {activeProject.date}</div>
                        <div className="p-1">Page no.: {pageIndex + 1} of {pages.length}</div>
                      </div>
                      <div className="p-1">Components name: <span className="font-bold">{activeProject.componentsName}</span></div>
                      <div className="grid grid-cols-[65%_35%] divide-x divide-black">
                        <div className="p-1 px-2 whitespace-nowrap">Drg. No: {activeProject.drgNo}</div>
                        <div className="p-1 px-2 whitespace-nowrap">Rev No.: {activeProject.revNo}</div>
                      </div>
                      <div className="p-1">Inspection report no: {activeProject.inspectionReportNo}</div>
                      <div className="p-1">QA Plan No: {activeProject.qaPlanNo}</div>
                      <div className="p-1">P. O. No: {activeProject.poNo}</div>
                      <div className="p-1">Quantity: {activeProject.quantity}</div>
                      <div className="p-1">Identification nos.: {activeProject.identificationNos}</div>
                      <div className="p-1">Supplier Name: {activeProject.supplierName || 'PRECITECH ENGINEERING WORKS'}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border border-black mb-1 text-[10px]">
                  {/* Row 1: Logo and Title */}
                  <div className="flex border-b border-black">
                    <div 
                      className={`w-1/3 p-2 border-r border-black flex items-center justify-center transition-colors relative overflow-hidden ${isDraggingOverLogo ? 'bg-blue-100/50' : ''}`}
                      onDragOver={handleDragOverLogo}
                      onDragLeave={handleDragLeaveLogo}
                      onDrop={handleDropLogo}
                    >
                      {settings.logoUrl ? (
                        <Rnd
                          size={{ width: settings.logoTransform?.width || 150, height: settings.logoTransform?.height || 48 }}
                          position={{ x: settings.logoTransform?.x || 0, y: settings.logoTransform?.y || 0 }}
                          onDragStop={(e, d) => {
                            updateProjectSettings('logoTransform', { ...(settings.logoTransform || {}), x: d.x, y: d.y });
                          }}
                          onResizeStop={(e, direction, ref, delta, position) => {
                            updateProjectSettings('logoTransform', {
                              width: parseInt(ref.style.width, 10),
                              height: parseInt(ref.style.height, 10),
                              ...position,
                            });
                          }}
                          bounds="parent"
                          scale={zoomScale}
                          className="border border-transparent hover:border-blue-400 border-dashed transition-colors flex items-center justify-center"
                        >
                          <img src={settings.logoUrl} alt="Company Logo" className="w-full h-full object-contain pointer-events-none" />
                        </Rnd>
                      ) : (
                        <h1 className="text-xl font-bold text-blue-700 italic pointer-events-none">Godrej AEROSPACE</h1>
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
                    <th className="border border-black p-1 w-40 font-semibold" rowSpan={2}>DRAWING SIZE</th>
                    <th className="border border-black p-1 w-36 font-semibold" rowSpan={2}>TOLERANCE</th>
                    <th className="border border-black p-1 font-semibold" colSpan={colSpanForId}>COMPONENT IDENTIFICATION</th>
                    <th className="border border-black p-1 w-34 font-semibold" rowSpan={2}>Inst. Used</th>
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
                
                <div className="grid grid-cols-[1.2fr_1fr_1fr] h-[150px]">
                  {/* Column 1 */}
                  <div 
                    className={`border-r border-black relative flex flex-col ${isDraggingOverStamp ? 'bg-blue-100/50' : ''}`}
                    onDragOver={handleDragOverStamp}
                    onDragLeave={handleDragLeaveStamp}
                    onDrop={handleDropStamp}
                  >
                    <div className="border-b border-black p-1 font-bold pointer-events-none z-0 h-[30px] flex items-center">
                      Supplier:
                    </div>
                    {activeProject.supplierStampUrl && (
                      <Rnd
                          size={{ width: settings.stampTransform?.width || 120, height: settings.stampTransform?.height || 120 }}
                          position={{ x: settings.stampTransform?.x || 0, y: settings.stampTransform?.y || 0 }}
                          onDragStop={(e, d) => {
                            updateProjectSettings('stampTransform', { ...(settings.stampTransform || {}), x: d.x, y: d.y });
                          }}
                          onResizeStop={(e, direction, ref, delta, position) => {
                            updateProjectSettings('stampTransform', {
                              width: parseInt(ref.style.width, 10),
                              height: parseInt(ref.style.height, 10),
                              ...position,
                            });
                          }}
                          bounds="parent"
                          scale={zoomScale}
                          className={`border border-dashed transition-colors flex items-center justify-center z-10 ${selectedImage === 'supplierStamp' ? 'border-blue-500' : 'border-transparent hover:border-blue-400'}`}
                          onClick={(e) => { e.stopPropagation(); setSelectedImage('supplierStamp'); }}
                      >
                        <img src={activeProject.supplierStampUrl} alt="Stamp" className="w-full h-full opacity-80 pointer-events-none" />
                        
                        {selectedImage === 'supplierStamp' && (
                          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-md border border-gray-200 flex gap-1 p-1 z-50 pointer-events-auto" onClick={e => e.stopPropagation()}>
                            <button title="Copy Image" className="p-1 hover:bg-gray-100 rounded text-gray-700" onClick={() => copyImageToClipboard(activeProject.supplierStampUrl)}><Copy size={16} /></button>
                            <button title="Duplicate to Godrej" className="p-1 hover:bg-gray-100 rounded text-gray-700" onClick={() => updateActiveProject({ godrejStampUrl: activeProject.supplierStampUrl })}><Files size={16} /></button>
                            <button title="Flip Horizontal" className="p-1 hover:bg-gray-100 rounded text-gray-700" onClick={() => flipImageHorizontally(activeProject.supplierStampUrl, (url) => updateActiveProject({ supplierStampUrl: url }))}><FlipHorizontal size={16} /></button>
                            <button title="Delete" className="p-1 hover:bg-gray-100 rounded text-red-600" onClick={() => updateActiveProject({ supplierStampUrl: null })}><Trash2 size={16} /></button>
                          </div>
                        )}
                      </Rnd>
                    )}
                    <div className="flex-1 p-1 flex flex-col justify-end">
                      <div className="flex justify-between w-full px-4 font-bold pointer-events-none z-0">
                        <span>Inspected By</span>
                        <span>Verified By</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Column 2 & 3 wrapper */}
                  <div className="col-span-2 flex flex-col">
                    {/* Top row of col 2 & 3 */}
                    <div className="border-b border-black p-1 text-center font-bold flex flex-col items-center justify-center h-[30px]">
                      GODREJ & BOYCE MFG. CO. LTD.
                    </div>
                    {/* Bottom row of col 2 & 3 */}
                    <div 
                      className={`grid grid-cols-[1fr_1fr] flex-1 relative ${isDraggingOverGodrejStamp ? 'bg-blue-100/50' : ''}`}
                      onDragOver={handleDragOverGodrejStamp}
                      onDragLeave={handleDragLeaveGodrejStamp}
                      onDrop={handleDropGodrejStamp}
                    >
                      {activeProject.godrejStampUrl && (
                        <Rnd
                            size={{ width: settings.godrejStampTransform?.width || 120, height: settings.godrejStampTransform?.height || 120 }}
                            position={{ x: settings.godrejStampTransform?.x || 0, y: settings.godrejStampTransform?.y || 0 }}
                            onDragStop={(e, d) => {
                              updateProjectSettings('godrejStampTransform', { ...(settings.godrejStampTransform || {}), x: d.x, y: d.y });
                            }}
                            onResizeStop={(e, direction, ref, delta, position) => {
                              updateProjectSettings('godrejStampTransform', {
                                width: parseInt(ref.style.width, 10),
                                height: parseInt(ref.style.height, 10),
                                ...position,
                              });
                            }}
                            bounds="parent"
                            scale={zoomScale}
                            className={`border border-dashed transition-colors flex items-center justify-center z-10 ${selectedImage === 'godrejStamp' ? 'border-blue-500' : 'border-transparent hover:border-blue-400'}`}
                            onClick={(e) => { e.stopPropagation(); setSelectedImage('godrejStamp'); }}
                        >
                          <img src={activeProject.godrejStampUrl} alt="Godrej Stamp" className="w-full h-full opacity-80 pointer-events-none" />
                          
                          {selectedImage === 'godrejStamp' && (
                            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-md border border-gray-200 flex gap-1 p-1 z-50 pointer-events-auto" onClick={e => e.stopPropagation()}>
                              <button title="Copy Image" className="p-1 hover:bg-gray-100 rounded text-gray-700" onClick={() => copyImageToClipboard(activeProject.godrejStampUrl)}><Copy size={16} /></button>
                              <button title="Duplicate to Supplier" className="p-1 hover:bg-gray-100 rounded text-gray-700" onClick={() => updateActiveProject({ supplierStampUrl: activeProject.godrejStampUrl })}><Files size={16} /></button>
                              <button title="Flip Horizontal" className="p-1 hover:bg-gray-100 rounded text-gray-700" onClick={() => flipImageHorizontally(activeProject.godrejStampUrl, (url) => updateActiveProject({ godrejStampUrl: url }))}><FlipHorizontal size={16} /></button>
                              <button title="Delete" className="p-1 hover:bg-gray-100 rounded text-red-600" onClick={() => updateActiveProject({ godrejStampUrl: null })}><Trash2 size={16} /></button>
                            </div>
                          )}
                        </Rnd>
                      )}
                      <div className="border-r border-black p-1 flex items-end justify-between px-4 font-bold pointer-events-none z-0">
                        <span>Inspected By</span>
                        <span>Verified By</span>
                      </div>
                      <div className="p-1 flex items-end justify-center font-bold pointer-events-none z-0">
                        <span>Designer</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          </div>
        </div>
      </div>
    </>
  );
};
