import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useReportStore } from '../../../store/useReportStore';
import { checkIsOutOfTolerance } from '../../../lib/calculations';
import { ZoomIn, ZoomOut, Maximize, Trash2, Copy, FlipHorizontal, Files, Hand, MousePointer2, ChevronUp, ChevronDown, RotateCw, Download, Share2 } from "lucide-react";
import { Rnd } from "react-rnd";
import { PDFDownloadLink, pdf } from '@react-pdf/renderer';
import { ReportPDF } from './pdf/ReportPDF';

const InteractiveField = ({ tabName, fieldId, children, className = "p-1" }) => {
  const setActiveInputTab = useReportStore((state) => state.setActiveInputTab);
  const handleClick = (e) => {
    e.stopPropagation();
    setActiveInputTab(tabName);
    setTimeout(() => {
      const element = document.getElementById(fieldId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
      }
    }, 100);
  };
  return (
    <div 
      className={`${className} cursor-pointer hover:bg-orange-500/20 hover:outline hover:outline-1 hover:outline-orange-500 transition-all`}
      onClick={handleClick}
    >
      {children}
    </div>
  );
};

const InteractiveRow = ({ row, children, className }) => {
  const setActiveInputTab = useReportStore((state) => state.setActiveInputTab);
  const handleClick = (e) => {
    e.stopPropagation();
    setActiveInputTab('Data');
    setTimeout(() => {
      const element = document.getElementById(`input-row-${row.id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };
  return (
    <tr 
      className={`${className || ''} cursor-pointer hover:bg-orange-500/20 transition-colors h-[26px]`}
      onClick={handleClick}
    >
      {children}
    </tr>
  );
};

export const PreviewPane = () => {
  const activeProject = useReportStore((state) => state.activeProject);
  const updateActiveProject = useReportStore((state) => state.updateActiveProject);
  const updateProjectSettings = useReportStore((state) => state.updateProjectSettings);
  const [zoomScale, setZoomScale] = useState(0.8); // Start slightly zoomed out to fit better
  const containerRef = useRef(null);
  const [isDraggingOverStamp, setIsDraggingOverStamp] = useState(false);
  const [isDraggingOverGodrejStamp, setIsDraggingOverGodrejStamp] = useState(false);
  const [isDraggingOverGodrejStamp2, setIsDraggingOverGodrejStamp2] = useState(false);
  const [isDraggingOverLogo, setIsDraggingOverLogo] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const logoInputRef = useRef(null);
  const supplierStampInputRef = useRef(null);
  const godrejStampInputRef = useRef(null);
  const godrejStampInputRef2 = useRef(null);

  const [activeTool, setActiveTool] = useState('select'); // 'select' or 'pan'
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [scrollStart, setScrollStart] = useState({ left: 0, top: 0 });

  const handleImageUpload = (file, type) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const url = reader.result;
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          
          const maxW = type === 'logo' ? 200 : 150;
          const maxH = type === 'logo' ? 80 : 150;
          const ratio = Math.min(maxW / width, maxH / height);
          if (ratio < 1) { width *= ratio; height *= ratio; }
          
          const configMap = {
            logo: { settingKey: 'logoTransform', urlKey: 'logoUrl', inSettings: true },
            supplierStamp: { settingKey: 'stampTransform', urlKey: 'supplierStampUrl', inSettings: false },
            godrejStamp: { settingKey: 'godrejStampTransform', urlKey: 'godrejStampUrl', inSettings: false },
            godrejStamp2: { settingKey: 'godrejStampTransform2', urlKey: 'godrejStampUrl2', inSettings: false }
          };
          
          const config = configMap[type];
          if (config) {
            // Compress the image before saving to state/localStorage
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            const compressedUrl = canvas.toDataURL('image/png');

            updateProjectSettings(config.settingKey, { width, height, x: 0, y: 0 });
            if (config.inSettings) {
              updateProjectSettings(config.urlKey, compressedUrl);
            } else {
              updateActiveProject({ [config.urlKey]: compressedUrl });
            }
          }
        };
        img.src = url;
      };
      reader.readAsDataURL(file);
    }
  };

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

  const handleShare = async () => {
    try {
      const doc = <ReportPDF project={activeProject} />;
      const asPdf = pdf(doc);
      const blob = await asPdf.toBlob();
      
      const file = new File([blob], `${activeProject.projectName?.replace(/\s+/g, '_') || 'Report'}_Inspection_Report.pdf`, {
        type: 'application/pdf',
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Inspection Report',
          text: 'Please find the attached inspection report.',
          files: [file],
        });
      } else {
        alert("Sharing files is not supported on this browser.");
      }
    } catch (err) {
      console.error(err);
      alert("Error sharing the report");
    }
  };

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

  // Chunk rows to simulate A4 pages. Using physical limits calculated from PDF.
  const FIRST_PAGE_ROWS = 22;
  const OTHER_PAGE_ROWS = 27;
  const pages = [];
  let currentIndex = 0;
  
  if (activeProject.rows.length > 0) {
    pages.push(activeProject.rows.slice(currentIndex, currentIndex + FIRST_PAGE_ROWS));
    currentIndex += FIRST_PAGE_ROWS;
  }
  
  while (currentIndex < activeProject.rows.length) {
    pages.push(activeProject.rows.slice(currentIndex, currentIndex + OTHER_PAGE_ROWS));
    currentIndex += OTHER_PAGE_ROWS;
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
    handleImageUpload(e.dataTransfer.files?.[0], 'supplierStamp');
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
    handleImageUpload(e.dataTransfer.files?.[0], 'logo');
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
    handleImageUpload(e.dataTransfer.files?.[0], 'godrejStamp');
  };

  const handleDragOverGodrejStamp2 = (e) => {
    e.preventDefault();
    setIsDraggingOverGodrejStamp2(true);
  };

  const handleDragLeaveGodrejStamp2 = (e) => {
    e.preventDefault();
    setIsDraggingOverGodrejStamp2(false);
  };

  const handleDropGodrejStamp2 = (e) => {
    e.preventDefault();
    setIsDraggingOverGodrejStamp2(false);
    handleImageUpload(e.dataTransfer.files?.[0], 'godrejStamp2');
  };



  return (
    <>
      <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
      <div className="flex flex-col w-full h-full bg-[#1e1e1e]">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#2b2b2b] shrink-0 bg-[#1e1e1e]">
          <div className="text-sm font-semibold text-zinc-300">Preview</div>
          
          {/* Toolbar Items (Horizontal) */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-md p-1">
              <button 
                onClick={() => scrollToPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className={`p-1 rounded transition-colors ${currentPage <= 1 ? 'text-zinc-600' : 'hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100'}`} 
                title="Previous Page"
              >
                <ChevronUp size={16} />
              </button>
              <div className="flex items-center gap-1 px-1">
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
                  className="w-8 px-1 py-0.5 bg-zinc-950 rounded border border-zinc-700 text-[11px] text-center text-zinc-100 outline-none focus:border-orange-500 transition-colors"
                />
                <span className="text-[11px] text-zinc-400 font-medium">/ {pages.length}</span>
              </div>
              <button 
                onClick={() => scrollToPage(currentPage + 1)}
                disabled={currentPage >= pages.length}
                className={`p-1 rounded transition-colors ${currentPage >= pages.length ? 'text-zinc-600' : 'hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100'}`} 
                title="Next Page"
              >
                <ChevronDown size={16} />
              </button>
            </div>

            <div className="h-4 w-px bg-zinc-700 mx-1"></div>

            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-md p-1">
              <button className="p-1 hover:bg-zinc-800 rounded transition-colors text-zinc-300 hover:text-zinc-100" title="Rotate">
                <RotateCw size={16} />
              </button>
              <button onClick={() => setZoomScale(1)} className="p-1 hover:bg-zinc-800 rounded transition-colors text-zinc-300 hover:text-zinc-100" title="Fit to Page">
                <Maximize size={16} />
              </button>
              <div className="w-px h-3 bg-zinc-700 mx-1"></div>
              <button onClick={() => setZoomScale(p => Math.max(0.3, p - 0.1))} className="p-1 hover:bg-zinc-800 rounded transition-colors text-zinc-300 hover:text-zinc-100" title="Zoom Out">
                <ZoomOut size={16} />
              </button>
              <div className="text-[10px] font-mono text-zinc-400 w-10 text-center">{Math.round(zoomScale * 100)}%</div>
              <button onClick={() => setZoomScale(p => Math.min(2.5, p + 0.1))} className="p-1 hover:bg-zinc-800 rounded transition-colors text-zinc-300 hover:text-zinc-100" title="Zoom In">
                <ZoomIn size={16} />
              </button>
            </div>

            <div className="h-4 w-px bg-zinc-700 mx-1"></div>

            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-md p-1">
              <button 
                onClick={() => setActiveTool('select')} 
                className={`p-1 rounded transition-colors ${activeTool === 'select' ? 'bg-orange-600 text-zinc-100' : 'hover:bg-zinc-800 text-zinc-300'}`} 
                title="Select Tool"
              >
                <MousePointer2 size={16} />
              </button>
              <button 
                onClick={() => setActiveTool('pan')} 
                className={`p-1 rounded transition-colors ${activeTool === 'pan' ? 'bg-orange-600 text-zinc-100' : 'hover:bg-zinc-800 text-zinc-300'}`} 
                title="Pan Tool"
              >
                <Hand size={16} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex gap-4 text-[10px] text-green-500 font-mono">
              <span>Status: 200 OK</span>
              <span className="text-zinc-400">Time: <span className="text-green-500">23ms</span></span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleShare} className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 px-3 py-1.5 rounded text-sm font-medium border border-[#2b2b2b] hover:bg-[#2b2b2b] transition-colors">
                <Share2 size={16} />
                Share
              </button>
              <PDFDownloadLink 
                document={<ReportPDF project={activeProject} />} 
                fileName={`${activeProject.projectName?.replace(/\s+/g, '_')}_Inspection_Report.pdf`}
                className="flex items-center gap-2 bg-[#007acc] hover:bg-[#005999] text-white px-6 py-1.5 rounded text-sm font-medium transition-colors"
              >
                {({ loading }) => (
                  <>
                    <Download size={16} />
                    {loading ? 'Exporting...' : 'Export PDF'}
                  </>
                )}
              </PDFDownloadLink>
            </div>
          </div>
        </div>

      <div 
        className={`relative flex flex-col flex-1 w-full bg-slate-200 overflow-auto hide-scrollbar ${activeTool === 'pan' ? `select-none ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}` : ''}`} 
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        ref={containerRef} 
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onScroll={handleScroll}
      >

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
              <div className="shrink-0">
              {/* Header Section */}
              {pageIndex === 0 ? (
                <div className="border border-black mb-1 text-[10px]">
                  {/* Row 1: Logo and Title */}
                  <div className="flex border-b border-black h-[65px]">
                    <div 
                      className={`w-1/2 p-2 border-r border-black flex items-center justify-center transition-colors relative group ${!settings.logoUrl ? 'cursor-pointer hover:bg-slate-100' : ''} ${isDraggingOverLogo ? 'bg-orange-500/20' : ''}`}
                      onDragOver={handleDragOverLogo}
                      onDragLeave={handleDragLeaveLogo}
                      onDrop={handleDropLogo}
                      onClick={() => !settings.logoUrl && logoInputRef.current?.click()}
                    >
                      <input 
                        type="file" 
                        accept="image/*" 
                        ref={logoInputRef}
                        className="hidden" 
                        onChange={(e) => handleImageUpload(e.target.files?.[0], 'logo')}
                      />
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
                          lockAspectRatio={true}
                          scale={zoomScale}
                          className={`border border-dashed transition-colors flex items-center justify-center z-10 ${selectedImage === 'logo' ? 'border-blue-500' : 'border-transparent hover:border-blue-400'}`}
                          onClick={(e) => { e.stopPropagation(); setSelectedImage('logo'); }}
                        >
                          <img src={settings.logoUrl} alt="Company Logo" className="w-full h-full pointer-events-none" />
                          
                          {selectedImage === 'logo' && (
                            <div 
                              className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-md border border-gray-200 flex gap-1 p-1 z-50 pointer-events-auto" 
                              onClick={e => e.stopPropagation()} 
                              onPointerDown={e => e.stopPropagation()} 
                              onMouseDown={e => e.stopPropagation()}
                            >
                              <button title="Copy Image" className="p-1 hover:bg-gray-100 rounded text-gray-700" onClick={() => copyImageToClipboard(settings.logoUrl)}><Copy size={16} /></button>
                              <button title="Duplicate to Supplier Stamp" className="p-1 hover:bg-gray-100 rounded text-gray-700" onClick={() => {
                                updateProjectSettings('stampTransform', { width: 120, height: 120, x: 0, y: 0 });
                                updateActiveProject({ supplierStampUrl: settings.logoUrl });
                              }}><Files size={16} /></button>
                              <button title="Flip Horizontal" className="p-1 hover:bg-gray-100 rounded text-gray-700" onClick={() => flipImageHorizontally(settings.logoUrl, (url) => updateProjectSettings('logoUrl', url))}><FlipHorizontal size={16} /></button>
                              <button title="Delete" className="p-1 hover:bg-gray-100 rounded text-red-600" onClick={() => updateProjectSettings('logoUrl', null)}><Trash2 size={16} /></button>
                            </div>
                          )}
                        </Rnd>
                      ) : (
                        <div className="flex flex-col items-center justify-center pointer-events-none">
                          <h1 className="text-xl font-bold text-blue-700 italic">Godrej AEROSPACE</h1>
                          <span className="text-[10px] text-zinc-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Click or drag logo here</span>
                        </div>
                      )}
                    </div>
                    <div className="w-1/2 p-2 flex flex-col justify-center items-start pl-8 font-bold">
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
                        <InteractiveField tabName="Form" fieldId="input-field-projectName">Project: <span className="font-bold">{activeProject.projectName}</span></InteractiveField>
                        <InteractiveField tabName="Form" fieldId="input-field-projectNo">Project no: {activeProject.projectNo}</InteractiveField>
                      </div>
                      <InteractiveField tabName="Form" fieldId="input-field-productionOrderNo">Production order no.: {activeProject.productionOrderNo}</InteractiveField>
                      <InteractiveField tabName="Form" fieldId="input-field-customer">Customer: <span className="font-bold">{activeProject.customer}</span></InteractiveField>
                      <InteractiveField tabName="Form" fieldId="input-field-asslySubAssly">Assly / sub-assly: {activeProject.asslySubAssly}</InteractiveField>
                      <InteractiveField tabName="Form" fieldId="input-field-inspectionStage">Inspection stage: {activeProject.inspectionStage}</InteractiveField>
                      <InteractiveField tabName="Form" fieldId="input-field-rawMaterialUsed">Raw material used: {activeProject.rawMaterialUsed}</InteractiveField>
                      <InteractiveField tabName="Form" fieldId="input-field-rawMtrlIdnCtrlNo">Raw mtrl. Idn/Ctrl. No: {activeProject.rawMtrlIdnCtrlNo}</InteractiveField>
                      <InteractiveField tabName="Form" fieldId="input-field-rawMtrlInDrg">Raw mtrl. In Drg. {activeProject.rawMtrlInDrg}</InteractiveField>
                      <InteractiveField tabName="Form" fieldId="input-field-rvNo">R .V. no: {activeProject.rvNo}</InteractiveField>
                    </div>
                    
                    {/* Right Column */}
                    <div className="flex flex-col divide-y divide-black">
                      <div className="grid grid-cols-2 divide-x divide-black">
                        <InteractiveField tabName="Form" fieldId="input-field-date">Date: {activeProject.date}</InteractiveField>
                        <div className="p-1">Page no.: {pageIndex + 1} of {pages.length}</div>
                      </div>
                      <InteractiveField tabName="Form" fieldId="input-field-componentsName">Components name: <span className="font-bold">{activeProject.componentsName}</span></InteractiveField>
                      <div className="grid grid-cols-[65%_35%] divide-x divide-black">
                        <InteractiveField tabName="Form" fieldId="input-field-drgNo" className="p-1 px-2 whitespace-nowrap">Drg. No: {activeProject.drgNo}</InteractiveField>
                        <InteractiveField tabName="Form" fieldId="input-field-revNo" className="p-1 px-2 whitespace-nowrap">Rev No.: {activeProject.revNo}</InteractiveField>
                      </div>
                      <InteractiveField tabName="Form" fieldId="input-field-inspectionReportNo">Inspection report no: {activeProject.inspectionReportNo}</InteractiveField>
                      <InteractiveField tabName="Form" fieldId="input-field-qaPlanNo">QA Plan No: {activeProject.qaPlanNo}</InteractiveField>
                      <InteractiveField tabName="Form" fieldId="input-field-poNo">P. O. No: {activeProject.poNo}</InteractiveField>
                      <InteractiveField tabName="Form" fieldId="input-field-quantity">Quantity: {activeProject.quantity}</InteractiveField>
                      <InteractiveField tabName="Form" fieldId="input-field-identificationNos">Identification nos.: {activeProject.identificationNos}</InteractiveField>
                      <InteractiveField tabName="Form" fieldId="input-field-supplierName">Supplier Name: {activeProject.supplierName || 'PRECITECH ENGINEERING WORKS'}</InteractiveField>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border border-black mb-1 text-[10px]">
                  {/* Row 1: Logo and Title */}
                  <div className="flex border-b border-black h-[65px]">
                    <div 
                      className={`w-1/2 p-2 border-r border-black flex items-center justify-center transition-colors relative group ${!settings.logoUrl ? 'cursor-pointer hover:bg-slate-100' : ''}`}
                      onClick={() => !settings.logoUrl && logoInputRef.current?.click()}
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
                          lockAspectRatio={true}
                          scale={zoomScale}
                          className={`border border-dashed transition-colors flex items-center justify-center z-10 ${selectedImage === 'logo' ? 'border-blue-500' : 'border-transparent hover:border-blue-400'}`}
                          onClick={(e) => { e.stopPropagation(); setSelectedImage('logo'); }}
                        >
                          <img src={settings.logoUrl} alt="Company Logo" className="w-full h-full pointer-events-none" />
                          
                          {selectedImage === 'logo' && (
                            <div 
                              className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-md border border-gray-200 flex gap-1 p-1 z-50 pointer-events-auto" 
                              onClick={e => e.stopPropagation()} 
                              onPointerDown={e => e.stopPropagation()} 
                              onMouseDown={e => e.stopPropagation()}
                            >
                              <button title="Copy Image" className="p-1 hover:bg-gray-100 rounded text-gray-700" onClick={() => copyImageToClipboard(settings.logoUrl)}><Copy size={16} /></button>
                              <button title="Duplicate to Supplier Stamp" className="p-1 hover:bg-gray-100 rounded text-gray-700" onClick={() => {
                                updateProjectSettings('stampTransform', { width: 120, height: 120, x: 0, y: 0 });
                                updateActiveProject({ supplierStampUrl: settings.logoUrl });
                              }}><Files size={16} /></button>
                              <button title="Flip Horizontal" className="p-1 hover:bg-gray-100 rounded text-gray-700" onClick={() => flipImageHorizontally(settings.logoUrl, (url) => updateProjectSettings('logoUrl', url))}><FlipHorizontal size={16} /></button>
                              <button title="Delete" className="p-1 hover:bg-gray-100 rounded text-red-600" onClick={() => updateProjectSettings('logoUrl', null)}><Trash2 size={16} /></button>
                            </div>
                          )}
                        </Rnd>
                      ) : (
                        <div className="flex flex-col items-center justify-center pointer-events-none">
                          <h1 className="text-[12px] font-bold text-blue-700 italic">Godrej AEROSPACE</h1>
                        </div>
                      )}
                    </div>
                    <div className="w-1/2 p-2 flex flex-col justify-center items-start pl-8 font-bold">
                      <div className="text-lg tracking-wider">INSPECTION REPORT</div>
                      <div className="text-[12px]">Format No.QC16/FM/35</div>
                      <div className="text-[12px]">Rev-01 & 11/10/2011</div>
                    </div>
                  </div>
                  {/* Simplified Metadata */}
                  <div className="flex divide-x divide-black border-b border-black">
                    <InteractiveField tabName="Form" fieldId="input-field-projectName" className="w-1/3 p-1">Project: <span className="font-bold">{activeProject.projectName}</span></InteractiveField>
                    <InteractiveField tabName="Form" fieldId="input-field-date" className="w-1/3 p-1">Date: {activeProject.date}</InteractiveField>
                    <div className="w-1/3 p-1">Page no.: {pageIndex + 1} of {pages.length}</div>
                  </div>
                  <div className="flex divide-x divide-black">
                    <InteractiveField tabName="Form" fieldId="input-field-componentsName" className="w-1/2 p-1">Comp name: {activeProject.componentsName}</InteractiveField>
                    <InteractiveField tabName="Form" fieldId="input-field-drgNo" className="w-1/4 p-1">Drg. No: {activeProject.drgNo}</InteractiveField>
                    <InteractiveField tabName="Form" fieldId="input-field-revNo" className="w-1/4 p-1">Rev No.: {activeProject.revNo}</InteractiveField>
                  </div>
                </div>
              )}

              {/* Main Data Table */}
              <table className="w-full border-collapse border border-black text-center table-fixed text-[10px]">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="border border-black p-1 font-semibold" style={{ width: '8%' }} rowSpan={2}>SR.<br/>NO.</th>
                    <th className="border border-black p-1 font-semibold" style={{ width: '26%' }} rowSpan={2}>DRAWING SIZE</th>
                    <th className="border border-black p-1 font-semibold" style={{ width: '16%' }} rowSpan={2}>TOLERANCE</th>
                    <th className="border border-black p-1 font-semibold" style={{ width: '24%' }} colSpan={colSpanForId}>COMPONENT IDENTIFICATION</th>
                    <th className="border border-black p-1 font-semibold" style={{ width: '16%' }} rowSpan={2}>Inst. Used</th>
                    <th className="border border-black p-1 font-semibold" style={{ width: '10%' }} rowSpan={2}>Inst.<br/>No</th>
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
                    <InteractiveRow key={row.id} row={row}>
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
                    </InteractiveRow>
                  ))}
                  {/* Empty rows to fill the page */}
                  {Array.from({ length: Math.max(0, (pageIndex === 0 ? FIRST_PAGE_ROWS : OTHER_PAGE_ROWS) - pageRows.length) }).map((_, i) => (
                    <tr key={`empty-${i}`} className="h-[28px]">
                      <td className="border border-black p-1" style={{ width: '8%' }}></td>
                      <td className="border border-black p-1" style={{ width: '26%' }}></td>
                      <td className="border border-black p-1" style={{ width: '16%' }}></td>
                      {Array.from({ length: colSpanForId }).map((_, j) => (
                        <td key={j} className="border border-black p-1" style={{ width: `${24 / colSpanForId}%` }}></td>
                      ))}
                      <td className="border border-black p-1" style={{ width: '16%' }}></td>
                      <td className="border border-black p-1" style={{ width: '10%' }}></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>

              {/* Footer Section */}
              <div className="border border-black border-t-0 flex flex-col text-[10px]">
                <div className="border-b border-black p-1 h-[30px]">
                  Remarks : {activeProject.remarks}
                </div>
                <div className="border-b border-black p-1 h-[30px]">
                  Remarks(Designer) : {activeProject.designerRemarks}
                </div>
                
                <div className="grid grid-cols-[1.2fr_1fr_1fr] h-[120px]">
                  {/* Column 1 */}
                  <div 
                    className={`border-r border-black relative flex flex-col group ${!activeProject.supplierStampUrl ? 'cursor-pointer hover:bg-slate-100' : ''} ${isDraggingOverStamp ? 'bg-orange-500/20' : ''}`}
                    onDragOver={handleDragOverStamp}
                    onDragLeave={handleDragLeaveStamp}
                    onDrop={handleDropStamp}
                    onClick={() => !activeProject.supplierStampUrl && supplierStampInputRef.current?.click()}
                  >
                    <input 
                      type="file" 
                      accept="image/*" 
                      ref={supplierStampInputRef}
                      className="hidden" 
                      onChange={(e) => handleImageUpload(e.target.files?.[0], 'supplierStamp')}
                    />
                    <div className="border-b border-black p-1 font-bold pointer-events-none z-0 h-[24px] flex items-center">
                      Supplier:
                    </div>
                    {activeProject.supplierStampUrl ? (
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
                          lockAspectRatio={true}
                          scale={zoomScale}
                          className={`border border-dashed transition-colors flex items-center justify-center z-10 ${selectedImage === 'supplierStamp' ? 'border-blue-500' : 'border-transparent hover:border-blue-400'}`}
                          onClick={(e) => { e.stopPropagation(); setSelectedImage('supplierStamp'); }}
                      >
                        <img src={activeProject.supplierStampUrl} alt="Stamp" className="w-full h-full opacity-80 pointer-events-none" />
                        
                        {selectedImage === 'supplierStamp' && (
                          <div 
                            className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-md border border-gray-200 flex gap-1 p-1 z-50 pointer-events-auto" 
                            onClick={e => e.stopPropagation()}
                            onPointerDown={e => e.stopPropagation()} 
                            onMouseDown={e => e.stopPropagation()}
                          >
                            <button title="Copy Image" className="p-1 hover:bg-gray-100 rounded text-gray-700" onClick={() => copyImageToClipboard(activeProject.supplierStampUrl)}><Copy size={16} /></button>
                            <button title="Duplicate to Godrej" className="p-1 hover:bg-gray-100 rounded text-gray-700" onClick={() => {
                              updateProjectSettings('godrejStampTransform', { width: 120, height: 120, x: 0, y: 0 });
                              updateActiveProject({ godrejStampUrl: activeProject.supplierStampUrl });
                            }}><Files size={16} /></button>
                            <button title="Flip Horizontal" className="p-1 hover:bg-gray-100 rounded text-gray-700" onClick={() => flipImageHorizontally(activeProject.supplierStampUrl, (url) => updateActiveProject({ supplierStampUrl: url }))}><FlipHorizontal size={16} /></button>
                            <button title="Delete" className="p-1 hover:bg-gray-100 rounded text-red-600" onClick={() => updateActiveProject({ supplierStampUrl: null })}><Trash2 size={16} /></button>
                          </div>
                        )}
                      </Rnd>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-[10px] text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity mt-8">Click or drag stamp here</span>
                      </div>
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
                    <div className="border-b border-black p-1 text-center font-bold flex flex-col items-center justify-center h-[24px]">
                      GODREJ & BOYCE MFG. CO. LTD.
                    </div>
                    {/* Bottom row of col 2 & 3 */}
                    <div className="grid grid-cols-[1fr_1fr] flex-1 relative">
                      
                      {/* Left Side: Inspected By / Verified By */}
                      <div 
                        className={`border-r border-black relative flex flex-col group ${!activeProject.godrejStampUrl ? 'cursor-pointer hover:bg-slate-100' : ''} ${isDraggingOverGodrejStamp ? 'bg-orange-500/20' : ''}`}
                        onDragOver={handleDragOverGodrejStamp}
                        onDragLeave={handleDragLeaveGodrejStamp}
                        onDrop={handleDropGodrejStamp}
                        onClick={() => !activeProject.godrejStampUrl && godrejStampInputRef.current?.click()}
                      >
                        <input 
                          type="file" 
                          accept="image/*" 
                          ref={godrejStampInputRef}
                          className="hidden" 
                          onChange={(e) => handleImageUpload(e.target.files?.[0], 'godrejStamp')}
                        />
                        {activeProject.godrejStampUrl ? (
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
                              lockAspectRatio={true}
                              scale={zoomScale}
                              className={`border border-dashed transition-colors flex items-center justify-center z-10 ${selectedImage === 'godrejStamp' ? 'border-blue-500' : 'border-transparent hover:border-blue-400'}`}
                              onClick={(e) => { e.stopPropagation(); setSelectedImage('godrejStamp'); }}
                          >
                            <img src={activeProject.godrejStampUrl} alt="Godrej Stamp" className="w-full h-full opacity-80 pointer-events-none" />
                            
                            {selectedImage === 'godrejStamp' && (
                              <div 
                                className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-md border border-gray-200 flex gap-1 p-1 z-50 pointer-events-auto" 
                                onClick={e => e.stopPropagation()}
                                onPointerDown={e => e.stopPropagation()} 
                                onMouseDown={e => e.stopPropagation()}
                              >
                                <button title="Copy Image" className="p-1 hover:bg-gray-100 rounded text-gray-700" onClick={() => copyImageToClipboard(activeProject.godrejStampUrl)}><Copy size={16} /></button>
                                <button title="Duplicate to Right" className="p-1 hover:bg-gray-100 rounded text-gray-700" onClick={() => {
                                  updateProjectSettings('godrejStampTransform2', { width: 120, height: 120, x: 0, y: 0 });
                                  updateActiveProject({ godrejStampUrl2: activeProject.godrejStampUrl });
                                }}><Files size={16} /></button>
                                <button title="Flip Horizontal" className="p-1 hover:bg-gray-100 rounded text-gray-700" onClick={() => flipImageHorizontally(activeProject.godrejStampUrl, (url) => updateActiveProject({ godrejStampUrl: url }))}><FlipHorizontal size={16} /></button>
                                <button title="Delete" className="p-1 hover:bg-gray-100 rounded text-red-600" onClick={() => updateActiveProject({ godrejStampUrl: null })}><Trash2 size={16} /></button>
                              </div>
                            )}
                          </Rnd>
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-[10px] text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">Click or drag stamp here</span>
                          </div>
                        )}
                        <div className="flex-1"></div>
                        <div className="p-1 flex items-end justify-between px-4 font-bold pointer-events-none z-0">
                          <span>Inspected By</span>
                          <span>Verified By</span>
                        </div>
                      </div>

                      {/* Right Side: Designer */}
                      <div 
                        className={`relative flex flex-col group ${!activeProject.godrejStampUrl2 ? 'cursor-pointer hover:bg-slate-100' : ''} ${isDraggingOverGodrejStamp2 ? 'bg-orange-500/20' : ''}`}
                        onDragOver={handleDragOverGodrejStamp2}
                        onDragLeave={handleDragLeaveGodrejStamp2}
                        onDrop={handleDropGodrejStamp2}
                        onClick={() => !activeProject.godrejStampUrl2 && godrejStampInputRef2.current?.click()}
                      >
                        <input 
                          type="file" 
                          accept="image/*" 
                          ref={godrejStampInputRef2}
                          className="hidden" 
                          onChange={(e) => handleImageUpload(e.target.files?.[0], 'godrejStamp2')}
                        />
                        {activeProject.godrejStampUrl2 ? (
                          <Rnd
                              size={{ width: settings.godrejStampTransform2?.width || 120, height: settings.godrejStampTransform2?.height || 120 }}
                              position={{ x: settings.godrejStampTransform2?.x || 0, y: settings.godrejStampTransform2?.y || 0 }}
                              onDragStop={(e, d) => {
                                updateProjectSettings('godrejStampTransform2', { ...(settings.godrejStampTransform2 || {}), x: d.x, y: d.y });
                              }}
                              onResizeStop={(e, direction, ref, delta, position) => {
                                updateProjectSettings('godrejStampTransform2', {
                                  width: parseInt(ref.style.width, 10),
                                  height: parseInt(ref.style.height, 10),
                                  ...position,
                                });
                              }}
                              lockAspectRatio={true}
                              scale={zoomScale}
                              className={`border border-dashed transition-colors flex items-center justify-center z-10 ${selectedImage === 'godrejStamp2' ? 'border-blue-500' : 'border-transparent hover:border-blue-400'}`}
                              onClick={(e) => { e.stopPropagation(); setSelectedImage('godrejStamp2'); }}
                          >
                            <img src={activeProject.godrejStampUrl2} alt="Godrej Stamp 2" className="w-full h-full opacity-80 pointer-events-none" />
                            
                            {selectedImage === 'godrejStamp2' && (
                              <div 
                                className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-md border border-gray-200 flex gap-1 p-1 z-50 pointer-events-auto" 
                                onClick={e => e.stopPropagation()}
                                onPointerDown={e => e.stopPropagation()} 
                                onMouseDown={e => e.stopPropagation()}
                              >
                                <button title="Copy Image" className="p-1 hover:bg-gray-100 rounded text-gray-700" onClick={() => copyImageToClipboard(activeProject.godrejStampUrl2)}><Copy size={16} /></button>
                                <button title="Duplicate to Left" className="p-1 hover:bg-gray-100 rounded text-gray-700" onClick={() => {
                                  updateProjectSettings('godrejStampTransform', { width: 120, height: 120, x: 0, y: 0 });
                                  updateActiveProject({ godrejStampUrl: activeProject.godrejStampUrl2 });
                                }}><Files size={16} /></button>
                                <button title="Flip Horizontal" className="p-1 hover:bg-gray-100 rounded text-gray-700" onClick={() => flipImageHorizontally(activeProject.godrejStampUrl2, (url) => updateActiveProject({ godrejStampUrl2: url }))}><FlipHorizontal size={16} /></button>
                                <button title="Delete" className="p-1 hover:bg-gray-100 rounded text-red-600" onClick={() => updateActiveProject({ godrejStampUrl2: null })}><Trash2 size={16} /></button>
                              </div>
                            )}
                          </Rnd>
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-[10px] text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">Click or drag stamp here</span>
                          </div>
                        )}
                        <div className="flex-1"></div>
                        <div className="p-1 flex items-end justify-center font-bold pointer-events-none z-0">
                          <span>Designer</span>
                        </div>
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
      </div>
    </>
  );
};
