import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReportStore } from '../../../store/useReportStore';
import { checkIsOutOfTolerance, formatDimension } from '../../../lib/calculations';
import { ZoomIn, ZoomOut, Maximize, Trash2, Copy, FlipHorizontal, FlipVertical, Files, Hand, MousePointer2, ChevronUp, ChevronDown, RotateCw, Download, Share2, X, PanelBottom, PanelRight, Monitor } from "lucide-react";
import { Rnd } from "react-rnd";
import { PDFDownloadLink, pdf } from '@react-pdf/renderer';
import { ReportPDF } from './pdf/ReportPDF';
import { SnagSheetPDF } from './pdf/SnagSheetPDF';

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
        element.classList.add('bg-orange-500/20');
        setTimeout(() => element.classList.remove('bg-orange-500/20'), 2000);
      }
    }, 300);
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
  const activeProject = useReportStore((state) => state.activeProject);
  const navigate = useNavigate();

  const handleClick = (e) => {
    e.stopPropagation();
    
    if (row.projectId && activeProject && row.projectId !== activeProject.id) {
      navigate(`/editor/${btoa(row.projectId)}`);
    }
    
    setActiveInputTab('Data');
    
    setTimeout(() => {
      const element = document.getElementById(`input-row-${row.id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('bg-orange-500/20');
        setTimeout(() => element.classList.remove('bg-orange-500/20'), 2000);
      }
    }, 300);
  };
  const rowStyle = {
    fontFamily: row.fontFamily || activeProject?.settings?.fontFamily || 'Helvetica',
    fontWeight: (row.isBold ?? activeProject?.settings?.isBold) ? 'bold' : 'normal',
    fontStyle: (row.isItalic ?? activeProject?.settings?.isItalic) ? 'italic' : 'normal',
    textAlign: row.textAlign || activeProject?.settings?.textAlign || 'center',
  };

  return (
    <tr 
      className={`${className || ''} cursor-pointer hover:bg-orange-500/20 transition-colors h-[26px]`}
      onClick={handleClick}
      style={rowStyle}
    >
      {children}
    </tr>
  );
};

export const PreviewPane = ({ onClose }) => {
  const activeProject = useReportStore((state) => state.activeProject);
  const projects = useReportStore((state) => state.projects);
  const previewMode = useReportStore((state) => state.previewMode || 'report');
  const updateActiveProject = useReportStore((state) => state.updateActiveProject);
  const updateProjectSettings = useReportStore((state) => state.updateProjectSettings);
  const previewLayout = useReportStore((state) => state.previewLayout);
  const setPreviewLayout = useReportStore((state) => state.setPreviewLayout);
  const [zoomScale, setZoomScale] = useState(0.8); // Start slightly zoomed out to fit better
  const containerRef = useRef(null);
  const [isDraggingOverStamp, setIsDraggingOverStamp] = useState(false);
  const [isDraggingOverGodrejStamp, setIsDraggingOverGodrejStamp] = useState(false);
  const [isDraggingOverGodrejStamp2, setIsDraggingOverGodrejStamp2] = useState(false);
  const [isDraggingOverLogo, setIsDraggingOverLogo] = useState(false);
  
  // Snag sheet stamp drag states
  const [isDraggingOverSnagSupplierStamp, setIsDraggingOverSnagSupplierStamp] = useState(false);
  const [isDraggingOverSnagGodrejQcStamp, setIsDraggingOverSnagGodrejQcStamp] = useState(false);
  const [isDraggingOverSnagGodrejDesignStamp, setIsDraggingOverSnagGodrejDesignStamp] = useState(false);
  
  const [selectedImage, setSelectedImage] = useState(null);

  const logoInputRef = useRef(null);
  const supplierStampInputRef = useRef(null);
  const godrejStampInputRef = useRef(null);
  const godrejStampInputRef2 = useRef(null);
  
  const snagSupplierStampInputRef = useRef(null);
  const snagGodrejQcStampInputRef = useRef(null);
  const snagGodrejDesignStampInputRef = useRef(null);

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
          const origWidth = img.width;
          const origHeight = img.height;
          
          // Display size logic for the Draggable component
          const maxDispW = type === 'logo' ? 200 : 150;
          const maxDispH = type === 'logo' ? 80 : 150;
          const dispRatio = Math.min(maxDispW / origWidth, maxDispH / origHeight);
          let dispWidth = origWidth;
          let dispHeight = origHeight;
          if (dispRatio < 1) { dispWidth *= dispRatio; dispHeight *= dispRatio; }

          // Storage size logic (keep it high quality so it's clear on PDF!)
          const maxCompW = 1200;
          const maxCompH = 1200;
          const compRatio = Math.min(maxCompW / origWidth, maxCompH / origHeight);
          let compWidth = origWidth;
          let compHeight = origHeight;
          if (compRatio < 1) { compWidth *= compRatio; compHeight *= compRatio; }
          
          const configMap = {
            logo: { settingKey: 'logoTransform', urlKey: 'logoUrl', inSettings: true },
            supplierStamp: { settingKey: 'stampTransform', urlKey: 'supplierStampUrl', inSettings: false },
            godrejStamp: { settingKey: 'godrejStampTransform', urlKey: 'godrejStampUrl', inSettings: false },
            godrejStamp2: { settingKey: 'godrejStampTransform2', urlKey: 'godrejStampUrl2', inSettings: false },
            snagSupplierStamp: { settingKey: 'snagSupplierStampTransform', urlKey: 'snagSupplierStampUrl', inSettings: false },
            snagGodrejQcStamp: { settingKey: 'snagGodrejQcStampTransform', urlKey: 'snagGodrejQcStampUrl', inSettings: false },
            snagGodrejDesignStamp: { settingKey: 'snagGodrejDesignStampTransform', urlKey: 'snagGodrejDesignStampUrl', inSettings: false }
          };
          
          const config = configMap[type];
          if (config) {
            // High-quality canvas compression
            const canvas = document.createElement('canvas');
            canvas.width = compWidth;
            canvas.height = compHeight;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, compWidth, compHeight);
            
            // Generate clear image data URL
            const compressedUrl = canvas.toDataURL('image/png');

            updateProjectSettings(config.settingKey, { width: dispWidth, height: dispHeight, x: 0, y: 0 });
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
  const [zoomInputValue, setZoomInputValue] = useState("80%");
  const zoomInputFocused = useRef(false);

  useEffect(() => {
    if (!zoomInputFocused.current) {
      setZoomInputValue(`${Math.round(zoomScale * 100)}%`);
    }
  }, [zoomScale]);

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

  const handleFullScreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable fullscreen mode: ${err.message}`);
        });
      }
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

  const flipImageVertically = (url, callback) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.translate(0, img.height);
      ctx.scale(1, -1);
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
      const doc = previewMode === 'snagsheet' 
        ? <SnagSheetPDF activeProject={activeProject} allProjects={projects} />
        : <ReportPDF project={activeProject} />;
      const asPdf = pdf(doc);
      const blob = await asPdf.toBlob();
      
      const fileNameSuffix = previewMode === 'snagsheet' ? 'Snack_Sheet' : 'Inspection_Report';
      const file = new File([blob], `${activeProject.projectName?.replace(/\s+/g, '_') || 'Report'}_${fileNameSuffix}.pdf`, {
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
  
  let validRows = [];

  if (previewMode === 'snagsheet') {
    let projectComponents = [];
    if (activeProject.type === 'snagsheet' && activeProject.linkedComponentIds) {
      projectComponents = projects.filter(p => activeProject.linkedComponentIds.includes(p.id));
    } else {
      projectComponents = projects.filter(p => p.projectName === activeProject.projectName && p.type !== 'snagsheet');
    }
    projectComponents.forEach(comp => {
      const outOfTolRows = comp.rows.filter(row => 
        (row.drawingSize || row.toleranceVal || row.instrument || row.places) &&
        row.observations.some(obs => checkIsOutOfTolerance(row.calculatedTolerance, obs))
      );
  
      if (outOfTolRows.length > 0) {
        outOfTolRows.forEach((r, idx) => {
          validRows.push({
            type: 'data_row',
            ...r,
            isFirstOfComponent: idx === 0,
            componentName: comp.componentsName || 'Untitled Component',
            jobCount: r.observations.length,
            projectId: comp.id
          });
        });
      }
    });
  } else {
    validRows = activeProject.rows.filter(row => 
      row.drawingSize || row.toleranceVal || row.instrument || row.places || row.observations.some(obs => obs && obs.trim() !== '')
    );
  }

  const maxJobCount = previewMode === 'snagsheet' && validRows.length > 0 
    ? Math.max(...validRows.map(r => r.jobCount || 1))
    : activeProject.rows[0]?.observations.length || 1;
  const colSpanForId = maxJobCount > 1 ? maxJobCount : 1;

  if (validRows.length > 0) {
    pages.push(validRows.slice(currentIndex, currentIndex + FIRST_PAGE_ROWS));
    currentIndex += FIRST_PAGE_ROWS;
  }
  
  while (currentIndex < validRows.length) {
    pages.push(validRows.slice(currentIndex, currentIndex + OTHER_PAGE_ROWS));
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

  // Snag Sheet stamp handlers
  const handleDropSnagSupplierStamp = (e) => {
    e.preventDefault();
    setIsDraggingOverSnagSupplierStamp(false);
    handleImageUpload(e.dataTransfer.files?.[0], 'snagSupplierStamp');
  };

  const [isExporting, setIsExporting] = useState(false);

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      const doc = previewMode === 'snagsheet' ? <SnagSheetPDF activeProject={activeProject} allProjects={projects} /> : <ReportPDF project={activeProject} />;
      const asPdf = pdf();
      asPdf.updateContainer(doc);
      const blob = await asPdf.toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeProject.projectName?.replace(/\s+/g, '_')}_${previewMode === 'snagsheet' ? 'Snag_Sheet' : 'Inspection_Report'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Check console for details.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDropSnagGodrejQcStamp = (e) => {
    e.preventDefault();
    setIsDraggingOverSnagGodrejQcStamp(false);
    handleImageUpload(e.dataTransfer.files?.[0], 'snagGodrejQcStamp');
  };

  const handleDropSnagGodrejDesignStamp = (e) => {
    e.preventDefault();
    setIsDraggingOverSnagGodrejDesignStamp(false);
    handleImageUpload(e.dataTransfer.files?.[0], 'snagGodrejDesignStamp');
  };



  return (
    <>
      <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
      <div id="preview-pane-section" className="flex flex-col w-full h-full bg-[#1e1e1e]">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#2b2b2b] shrink-0 bg-[#1e1e1e] overflow-x-auto hide-scrollbar gap-4">
          <div className="text-sm font-semibold text-zinc-300 whitespace-nowrap">
            Preview: {previewMode === 'snagsheet' ? 'Snack Sheet' : 'Inspection Report'}
          </div>
          
          {/* Toolbar Items (Horizontal) */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-md p-1 shrink-0">
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
                <span className="text-[11px] text-zinc-400 font-medium whitespace-nowrap">/ {pages.length}</span>
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

            <div className="h-4 w-px bg-zinc-700 mx-1 shrink-0"></div>

            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-md p-1 shrink-0">
              <button onClick={() => scrollToPage(1)} className="p-1 hover:bg-zinc-800 rounded transition-colors text-zinc-300 hover:text-zinc-100" title="First Page">
                <RotateCw size={16} />
              </button>
              <button onClick={handleFullScreen} className="p-1 hover:bg-zinc-800 rounded transition-colors text-zinc-300 hover:text-zinc-100" title="Full Screen">
                <Maximize size={16} />
              </button>
              <div className="w-px h-3 bg-zinc-700 mx-1"></div>
              <button onClick={() => setZoomScale(p => Math.max(0.3, p - 0.1))} className="p-1 hover:bg-zinc-800 rounded transition-colors text-zinc-300 hover:text-zinc-100" title="Zoom Out">
                <ZoomOut size={16} />
              </button>
              <input 
                value={zoomInputValue}
                onFocus={() => { zoomInputFocused.current = true; }}
                onChange={(e) => {
                  setZoomInputValue(e.target.value);
                  let val = parseInt(e.target.value.replace(/\D/g, ''));
                  if (!isNaN(val)) {
                    val = Math.max(10, Math.min(500, val));
                    setZoomScale(val / 100);
                  }
                }}
                onBlur={() => {
                  zoomInputFocused.current = false;
                  let val = parseInt(zoomInputValue.replace(/\D/g, ''));
                  if (isNaN(val)) val = Math.round(zoomScale * 100);
                  val = Math.max(30, Math.min(250, val));
                  setZoomScale(val / 100);
                  setZoomInputValue(`${val}%`);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.target.blur();
                }}
                className="w-12 px-1 py-0.5 bg-transparent hover:bg-zinc-800 focus:bg-zinc-950 rounded border border-transparent focus:border-zinc-700 text-[11px] font-mono text-center text-blue-400 outline-none transition-colors"
              />
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

          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-md p-1 mr-2">
                <button 
                  onClick={() => setPreviewLayout('bottom')} 
                  className={`p-1 rounded transition-colors ${previewLayout === 'bottom' ? 'bg-[#007acc] text-white' : 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`} 
                  title="Split Horizontal"
                >
                  <PanelBottom size={16} />
                </button>
                <button 
                  onClick={() => setPreviewLayout('right')} 
                  className={`p-1 rounded transition-colors ${previewLayout === 'right' ? 'bg-[#007acc] text-white' : 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`} 
                  title="Split Vertical"
                >
                  <PanelRight size={16} />
                </button>
                <button 
                  onClick={() => setPreviewLayout('full')} 
                  className={`p-1 rounded transition-colors ${previewLayout === 'full' ? 'bg-[#007acc] text-white' : 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`} 
                  title="Full Screen Preview"
                >
                  <Monitor size={16} />
                </button>
              </div>

              <button onClick={handleShare} className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 px-3 py-1.5 rounded text-sm font-medium border border-[#2b2b2b] hover:bg-[#2b2b2b] cursor-pointer transition-colors whitespace-nowrap shrink-0">
                <Share2 size={16} />
                Share
              </button>
              <button 
                onClick={handleExportPdf}
                disabled={isExporting}
                className={`flex items-center gap-2 px-6 py-1.5 rounded text-sm font-medium cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                  isExporting ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed' : 'bg-[#007acc] hover:bg-[#005999] text-white'
                }`}
              >
                <Download size={16} />
                {isExporting ? 'Exporting...' : 'Export PDF'}
              </button>
              {onClose && (
                <>
                  <div className="h-4 w-px bg-zinc-700 mx-1"></div>
                  <button 
                    onClick={onClose} 
                    className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded transition-colors"
                    title="Close Preview"
                  >
                    <X size={18} />
                  </button>
                </>
              )}
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
              {previewMode === 'snagsheet' ? (
                <div className="border border-black mb-1 text-[12px] font-bold">
                   <div className="flex border-b border-black text-center justify-center p-1 text-[14px]">
                      <InteractiveField tabName="Form" fieldId="input-field-supplierName">Supplier Name : {activeProject.supplierName || 'PRECITECH ENGINEERING WORKS'}</InteractiveField>
                   </div>
                   <div className="flex border-b border-black">
                      <div className="w-3/4 flex justify-center items-center border-r border-black p-1">
                         SNAG SHEET
                      </div>
                      <div className="w-1/4 p-1 flex items-center">
                         Page no. {pageIndex + 1} of {pages.length}
                      </div>
                   </div>
                   <div className="flex border-b border-black">
                      <div className="w-1/2 border-r border-black p-1">
                         <InteractiveField tabName="Form" fieldId="input-field-drgNo">Drawing no. :- {activeProject.drgNo}</InteractiveField>
                      </div>
                      <div className="w-1/2 p-1 flex gap-2">
                         <InteractiveField tabName="Form" fieldId="input-field-snagSheetNo">Snag sheet no. :- {activeProject.snagSheetNo || 'PEW-269'}</InteractiveField>
                         <InteractiveField tabName="Form" fieldId="input-field-date">Date:- {activeProject.date}</InteractiveField>
                      </div>
                   </div>
                   <div className="flex border-b border-black">
                      <div className="w-1/2 border-r border-black p-1">
                         <InteractiveField tabName="Form" fieldId="input-field-toolDescription">Tool Description :- {activeProject.toolDescription || 'WELDING FIXTURE'}</InteractiveField>
                      </div>
                      <div className="w-1/2 p-1">
                         <InteractiveField tabName="Form" fieldId="input-field-projectName">Project :- {activeProject.projectName}</InteractiveField>
                      </div>
                   </div>
                   <div className="flex">
                      <div className="w-1/2 border-r border-black p-1">
                         <InteractiveField tabName="Form" fieldId="input-field-itemCodeNo">Item code no. :- {activeProject.itemCodeNo || ''}</InteractiveField>
                      </div>
                      <div className="w-1/2 p-1">
                         <InteractiveField tabName="Form" fieldId="input-field-poNo">PO no. :- {activeProject.poNo}</InteractiveField>
                      </div>
                   </div>
                </div>
              ) : pageIndex === 0 ? (
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
                    <div className="w-1/2 p-2 flex flex-col justify-center items-end pr-8 text-right font-bold">
                      <div className="text-lg tracking-wider">{previewMode === 'snagsheet' ? 'SNACK SHEET' : 'INSPECTION REPORT'}</div>
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
                      <InteractiveField tabName="Form" fieldId="input-field-componentsName">Components name: <span className="font-bold">{previewMode === 'snagsheet' ? 'MULTIPLE' : activeProject.componentsName}</span></InteractiveField>
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
                    <div className="w-1/2 p-2 flex flex-col justify-center items-end pr-8 text-right font-bold">
                      <div className="text-lg tracking-wider">{previewMode === 'snagsheet' ? 'SNACK SHEET' : 'INSPECTION REPORT'}</div>
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
                    <InteractiveField tabName="Form" fieldId="input-field-componentsName" className="w-1/2 p-1">Comp name: {previewMode === 'snagsheet' ? 'MULTIPLE' : activeProject.componentsName}</InteractiveField>
                    <InteractiveField tabName="Form" fieldId="input-field-drgNo" className="w-1/4 p-1">Drg. No: {activeProject.drgNo}</InteractiveField>
                    <InteractiveField tabName="Form" fieldId="input-field-revNo" className="w-1/4 p-1">Rev No.: {activeProject.revNo}</InteractiveField>
                  </div>
                </div>
              )}

              {/* Main Data Table */}
              {previewMode === 'snagsheet' ? (
                <table className="w-full border-collapse border border-black text-center table-fixed text-[12px]">
                   <thead>
                      <tr className="bg-white">
                         <th className="border border-black p-1 font-bold" style={{ width: '25%' }}>Description & Item no.</th>
                         <th className="border border-black p-1 font-bold" style={{ width: '10%' }}>Ballon<br/>no.</th>
                         <th className="border border-black p-1 font-bold" style={{ width: '20%' }}>Dimension with<br/>tolerance</th>
                         <th className="border border-black p-1 font-bold" style={{ width: '20%' }}>Observed dimension</th>
                         <th className="border border-black p-1 font-bold" style={{ width: '25%' }}>Remarks / Recommendations By Godrej Design</th>
                      </tr>
                   </thead>
                   <tbody>
                      {pageRows.length === 0 ? (
                         <tr className="bg-white">
                            <td colSpan={5} className="border border-black p-4 text-center">
                               No snags found in this project.
                            </td>
                         </tr>
                      ) : pageRows.map((row) => (
                         <InteractiveRow key={row.id} row={row}>
                            <td className="border border-black p-1 text-left px-2">{row.isFirstOfComponent ? row.componentName : ''}</td>
                            <td className="border border-black p-1">{row.srNo}</td>
                            <td className="border border-black p-1">
                               {formatDimension(row, true)}
                            </td>
                            <td className="border border-black p-1">
                               {row.observations.filter(o => o !== undefined && o !== '' && checkIsOutOfTolerance(row.calculatedTolerance, o)).join(' / ')}
                            </td>
                            <td className="border border-black p-1"></td>
                         </InteractiveRow>
                      ))}
                      {Array.from({ length: Math.max(0, (pageIndex === 0 ? FIRST_PAGE_ROWS : OTHER_PAGE_ROWS) - pageRows.length) }).map((_, i) => (
                         <tr key={`empty-${i}`} className="h-[28px]">
                            <td className="border border-black p-1"></td>
                            <td className="border border-black p-1"></td>
                            <td className="border border-black p-1"></td>
                            <td className="border border-black p-1"></td>
                            <td className="border border-black p-1"></td>
                         </tr>
                      ))}
                   </tbody>
                </table>
              ) : (
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
                  {pageRows.length === 0 ? (
                    <tr className="bg-white">
                      <td colSpan={5 + colSpanForId} className="border border-black p-4 text-center">
                        No out-of-tolerance values found in this project.
                      </td>
                    </tr>
                  ) : pageRows.map((row) => {
                    if (row.type === 'component_header') {
                      return (
                        <tr key={row.id} className="bg-[#fff7ed]">
                          <td colSpan={5 + colSpanForId} className="border border-black p-1 font-bold text-left px-4">
                            Component: {row.name}
                          </td>
                        </tr>
                      );
                    }
                    return (
                      <InteractiveRow key={row.id} row={row}>
                        <td className="border border-black p-1">{row.srNo}</td>
                        <td className="border border-black p-1 break-words">
                          {(row.places || row.drawingSizeSymbol || row.drawingSize) ? formatDimension(row, false) : '-'}
                        </td>
                        <td className="border border-black p-1">
                          {row.calculatedTolerance !== '-' ? row.calculatedTolerance : row.toleranceVal || '-'}
                        </td>
                        
                        {/* Observations / Jobs */}
                        {Array.from({ length: colSpanForId }).map((_, idx) => {
                          const obs = row.observations[idx];
                          const isOutOfTol = obs !== undefined && obs !== '' ? checkIsOutOfTolerance(row.calculatedTolerance, obs) : false;
                          return (
                            <td key={idx} className={`border border-black p-1 ${isOutOfTol ? 'font-bold text-red-600 underline' : ''}`}>
                              {obs !== undefined && obs !== '' ? obs : '-'}
                            </td>
                          );
                        })}

                        <td className="border border-black p-1">{row.instrument || '-'}</td>
                        <td className="border border-black p-1">{row.instrumentNo || '-'}</td>
                      </InteractiveRow>
                    );
                  })}
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
              )}
              </div>

              {/* Footer Section */}
              {previewMode === 'snagsheet' ? (
                <div className="grid grid-cols-3 mt-12 mb-4 h-[120px] font-bold text-[12px] text-center px-4 gap-4">
                   {/* Sign & Stamp of Supplier */}
                   <div 
                     className={`relative flex flex-col justify-end items-center group border border-transparent ${!activeProject.snagSupplierStampUrl ? 'cursor-pointer hover:border-dashed hover:border-gray-400' : ''} ${isDraggingOverSnagSupplierStamp ? 'bg-orange-500/20' : ''}`}
                     onDragOver={e => { e.preventDefault(); setIsDraggingOverSnagSupplierStamp(true); }}
                     onDragLeave={e => { e.preventDefault(); setIsDraggingOverSnagSupplierStamp(false); }}
                     onDrop={handleDropSnagSupplierStamp}
                     onClick={() => !activeProject.snagSupplierStampUrl && snagSupplierStampInputRef.current?.click()}
                   >
                     <input type="file" accept="image/*" ref={snagSupplierStampInputRef} className="hidden" onChange={(e) => handleImageUpload(e.target.files?.[0], 'snagSupplierStamp')} />
                     
                     {activeProject.snagSupplierStampUrl ? (
                       <Rnd
                          size={{ width: settings.snagSupplierStampTransform?.width || 120, height: settings.snagSupplierStampTransform?.height || 80 }}
                          position={{ x: settings.snagSupplierStampTransform?.x || 0, y: settings.snagSupplierStampTransform?.y || 0 }}
                          onDragStop={(e, d) => updateProjectSettings('snagSupplierStampTransform', { ...(settings.snagSupplierStampTransform || {}), x: d.x, y: d.y })}
                          onResizeStop={(e, dir, ref, delta, pos) => updateProjectSettings('snagSupplierStampTransform', { width: parseInt(ref.style.width, 10), height: parseInt(ref.style.height, 10), ...pos })}
                          lockAspectRatio={true}
                          scale={zoomScale}
                          className={`border border-dashed flex items-center justify-center z-10 absolute top-0 ${selectedImage === 'snagSupplierStamp' ? 'border-blue-500' : 'border-transparent hover:border-blue-400'}`}
                          onClick={(e) => { e.stopPropagation(); setSelectedImage('snagSupplierStamp'); }}
                       >
                         <img src={activeProject.snagSupplierStampUrl} alt="Supplier Stamp" className="w-full h-full opacity-80 pointer-events-none" />
                         {selectedImage === 'snagSupplierStamp' && (
                           <div 
                             className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-md border border-gray-200 flex gap-1 p-1 z-50 pointer-events-auto" 
                             onClick={e => e.stopPropagation()} 
                             onPointerDown={e => e.stopPropagation()}
                             onMouseDown={e => e.stopPropagation()}
                             onTouchStart={e => e.stopPropagation()}
                           >
                             <button title="Copy Image" className="p-1 hover:bg-gray-100 rounded text-gray-700" onClick={() => copyImageToClipboard(activeProject.snagSupplierStampUrl)}><Copy size={16} /></button>
                             <button title="Duplicate to Godrej QC" className="p-1 hover:bg-gray-100 rounded text-gray-700" onClick={() => {
                               updateProjectSettings('snagGodrejQcStampTransform', { width: 120, height: 80, x: 0, y: 0 });
                               updateActiveProject({ snagGodrejQcStampUrl: activeProject.snagSupplierStampUrl });
                             }}><Files size={16} /></button>
                             <button title="Flip Horizontal" className="p-1 hover:bg-gray-100 rounded text-gray-700" onClick={() => flipImageHorizontally(activeProject.snagSupplierStampUrl, (url) => updateActiveProject({ snagSupplierStampUrl: url }))}><FlipHorizontal size={16} /></button>
                             <button title="Flip Vertical" className="p-1 hover:bg-gray-100 rounded text-gray-700" onClick={() => flipImageVertically(activeProject.snagSupplierStampUrl, (url) => updateActiveProject({ snagSupplierStampUrl: url }))}><FlipVertical size={16} /></button>
                             <button title="Delete" className="p-1 hover:bg-gray-100 rounded text-red-600" onClick={() => updateActiveProject({ snagSupplierStampUrl: null })}><Trash2 size={16} /></button>
                           </div>
                         )}
                       </Rnd>
                     ) : (
                       <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                         <span className="text-[10px] text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">Click or drag stamp here</span>
                       </div>
                     )}
                     <div className="mb-2 z-0 pointer-events-none">Sign & Stamp of Supplier</div>
                   </div>

                   {/* Sign of Godrej QC */}
                   <div 
                     className={`relative flex flex-col justify-end items-center group border border-transparent ${!activeProject.snagGodrejQcStampUrl ? 'cursor-pointer hover:border-dashed hover:border-gray-400' : ''} ${isDraggingOverSnagGodrejQcStamp ? 'bg-orange-500/20' : ''}`}
                     onDragOver={e => { e.preventDefault(); setIsDraggingOverSnagGodrejQcStamp(true); }}
                     onDragLeave={e => { e.preventDefault(); setIsDraggingOverSnagGodrejQcStamp(false); }}
                     onDrop={handleDropSnagGodrejQcStamp}
                     onClick={() => !activeProject.snagGodrejQcStampUrl && snagGodrejQcStampInputRef.current?.click()}
                   >
                     <input type="file" accept="image/*" ref={snagGodrejQcStampInputRef} className="hidden" onChange={(e) => handleImageUpload(e.target.files?.[0], 'snagGodrejQcStamp')} />
                     
                     {activeProject.snagGodrejQcStampUrl ? (
                       <Rnd
                          size={{ width: settings.snagGodrejQcStampTransform?.width || 120, height: settings.snagGodrejQcStampTransform?.height || 80 }}
                          position={{ x: settings.snagGodrejQcStampTransform?.x || 0, y: settings.snagGodrejQcStampTransform?.y || 0 }}
                          onDragStop={(e, d) => updateProjectSettings('snagGodrejQcStampTransform', { ...(settings.snagGodrejQcStampTransform || {}), x: d.x, y: d.y })}
                          onResizeStop={(e, dir, ref, delta, pos) => updateProjectSettings('snagGodrejQcStampTransform', { width: parseInt(ref.style.width, 10), height: parseInt(ref.style.height, 10), ...pos })}
                          lockAspectRatio={true}
                          scale={zoomScale}
                          className={`border border-dashed flex items-center justify-center z-10 absolute top-0 ${selectedImage === 'snagGodrejQcStamp' ? 'border-blue-500' : 'border-transparent hover:border-blue-400'}`}
                          onClick={(e) => { e.stopPropagation(); setSelectedImage('snagGodrejQcStamp'); }}
                       >
                         <img src={activeProject.snagGodrejQcStampUrl} alt="Godrej QC Stamp" className="w-full h-full opacity-80 pointer-events-none" />
                         {selectedImage === 'snagGodrejQcStamp' && (
                           <div 
                             className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-md border border-gray-200 flex gap-1 p-1 z-50 pointer-events-auto" 
                             onClick={e => e.stopPropagation()} 
                             onPointerDown={e => e.stopPropagation()}
                             onMouseDown={e => e.stopPropagation()}
                             onTouchStart={e => e.stopPropagation()}
                           >
                             <button title="Copy Image" className="p-1 hover:bg-gray-100 rounded text-gray-700" onClick={() => copyImageToClipboard(activeProject.snagGodrejQcStampUrl)}><Copy size={16} /></button>
                             <button title="Duplicate to Godrej Design" className="p-1 hover:bg-gray-100 rounded text-gray-700" onClick={() => {
                               updateProjectSettings('snagGodrejDesignStampTransform', { width: 120, height: 80, x: 0, y: 0 });
                               updateActiveProject({ snagGodrejDesignStampUrl: activeProject.snagGodrejQcStampUrl });
                             }}><Files size={16} /></button>
                             <button title="Flip Horizontal" className="p-1 hover:bg-gray-100 rounded text-gray-700" onClick={() => flipImageHorizontally(activeProject.snagGodrejQcStampUrl, (url) => updateActiveProject({ snagGodrejQcStampUrl: url }))}><FlipHorizontal size={16} /></button>
                             <button title="Flip Vertical" className="p-1 hover:bg-gray-100 rounded text-gray-700" onClick={() => flipImageVertically(activeProject.snagGodrejQcStampUrl, (url) => updateActiveProject({ snagGodrejQcStampUrl: url }))}><FlipVertical size={16} /></button>
                             <button title="Delete" className="p-1 hover:bg-gray-100 rounded text-red-600" onClick={() => updateActiveProject({ snagGodrejQcStampUrl: null })}><Trash2 size={16} /></button>
                           </div>
                         )}
                       </Rnd>
                     ) : (
                       <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                         <span className="text-[10px] text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">Click or drag stamp here</span>
                       </div>
                     )}
                     <div className="mb-2 z-0 pointer-events-none">Sign of Godrej QC</div>
                   </div>

                   {/* Sign of Godrej Design */}
                   <div 
                     className={`relative flex flex-col justify-end items-center group border border-transparent ${!activeProject.snagGodrejDesignStampUrl ? 'cursor-pointer hover:border-dashed hover:border-gray-400' : ''} ${isDraggingOverSnagGodrejDesignStamp ? 'bg-orange-500/20' : ''}`}
                     onDragOver={e => { e.preventDefault(); setIsDraggingOverSnagGodrejDesignStamp(true); }}
                     onDragLeave={e => { e.preventDefault(); setIsDraggingOverSnagGodrejDesignStamp(false); }}
                     onDrop={handleDropSnagGodrejDesignStamp}
                     onClick={() => !activeProject.snagGodrejDesignStampUrl && snagGodrejDesignStampInputRef.current?.click()}
                   >
                     <input type="file" accept="image/*" ref={snagGodrejDesignStampInputRef} className="hidden" onChange={(e) => handleImageUpload(e.target.files?.[0], 'snagGodrejDesignStamp')} />
                     
                     {activeProject.snagGodrejDesignStampUrl ? (
                       <Rnd
                          size={{ width: settings.snagGodrejDesignStampTransform?.width || 120, height: settings.snagGodrejDesignStampTransform?.height || 80 }}
                          position={{ x: settings.snagGodrejDesignStampTransform?.x || 0, y: settings.snagGodrejDesignStampTransform?.y || 0 }}
                          onDragStop={(e, d) => updateProjectSettings('snagGodrejDesignStampTransform', { ...(settings.snagGodrejDesignStampTransform || {}), x: d.x, y: d.y })}
                          onResizeStop={(e, dir, ref, delta, pos) => updateProjectSettings('snagGodrejDesignStampTransform', { width: parseInt(ref.style.width, 10), height: parseInt(ref.style.height, 10), ...pos })}
                          lockAspectRatio={true}
                          scale={zoomScale}
                          className={`border border-dashed flex items-center justify-center z-10 absolute top-0 ${selectedImage === 'snagGodrejDesignStamp' ? 'border-blue-500' : 'border-transparent hover:border-blue-400'}`}
                          onClick={(e) => { e.stopPropagation(); setSelectedImage('snagGodrejDesignStamp'); }}
                       >
                         <img src={activeProject.snagGodrejDesignStampUrl} alt="Godrej Design Stamp" className="w-full h-full opacity-80 pointer-events-none" />
                         {selectedImage === 'snagGodrejDesignStamp' && (
                           <div 
                             className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-md border border-gray-200 flex gap-1 p-1 z-50 pointer-events-auto" 
                             onClick={e => e.stopPropagation()} 
                             onPointerDown={e => e.stopPropagation()}
                             onMouseDown={e => e.stopPropagation()}
                             onTouchStart={e => e.stopPropagation()}
                           >
                             <button title="Copy Image" className="p-1 hover:bg-gray-100 rounded text-gray-700" onClick={() => copyImageToClipboard(activeProject.snagGodrejDesignStampUrl)}><Copy size={16} /></button>
                             <button title="Duplicate to Godrej QC" className="p-1 hover:bg-gray-100 rounded text-gray-700" onClick={() => {
                               updateProjectSettings('snagGodrejQcStampTransform', { width: 120, height: 80, x: 0, y: 0 });
                               updateActiveProject({ snagGodrejQcStampUrl: activeProject.snagGodrejDesignStampUrl });
                             }}><Files size={16} /></button>
                             <button title="Flip Horizontal" className="p-1 hover:bg-gray-100 rounded text-gray-700" onClick={() => flipImageHorizontally(activeProject.snagGodrejDesignStampUrl, (url) => updateActiveProject({ snagGodrejDesignStampUrl: url }))}><FlipHorizontal size={16} /></button>
                             <button title="Flip Vertical" className="p-1 hover:bg-gray-100 rounded text-gray-700" onClick={() => flipImageVertically(activeProject.snagGodrejDesignStampUrl, (url) => updateActiveProject({ snagGodrejDesignStampUrl: url }))}><FlipVertical size={16} /></button>
                             <button title="Delete" className="p-1 hover:bg-gray-100 rounded text-red-600" onClick={() => updateActiveProject({ snagGodrejDesignStampUrl: null })}><Trash2 size={16} /></button>
                           </div>
                         )}
                       </Rnd>
                     ) : (
                       <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                         <span className="text-[10px] text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">Click or drag stamp here</span>
                       </div>
                     )}
                     <div className="mb-2 z-0 pointer-events-none">Sign of Godrej Design</div>
                    </div>
                </div>
              ) : (
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
                            onTouchStart={e => e.stopPropagation()}
                          >
                            <button title="Copy Image" className="p-1 hover:bg-gray-100 rounded text-gray-700" onClick={() => copyImageToClipboard(activeProject.supplierStampUrl)}><Copy size={16} /></button>
                            <button title="Duplicate to Godrej" className="p-1 hover:bg-gray-100 rounded text-gray-700" onClick={() => {
                              updateProjectSettings('godrejStampTransform', { width: 120, height: 120, x: 0, y: 0 });
                              updateActiveProject({ godrejStampUrl: activeProject.supplierStampUrl });
                            }}><Files size={16} /></button>
                            <button title="Flip Horizontal" className="p-1 hover:bg-gray-100 rounded text-gray-700" onClick={() => flipImageHorizontally(activeProject.supplierStampUrl, (url) => updateActiveProject({ supplierStampUrl: url }))}><FlipHorizontal size={16} /></button>
                            <button title="Flip Vertical" className="p-1 hover:bg-gray-100 rounded text-gray-700" onClick={() => flipImageVertically(activeProject.supplierStampUrl, (url) => updateActiveProject({ supplierStampUrl: url }))}><FlipVertical size={16} /></button>
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
                                onTouchStart={e => e.stopPropagation()}
                              >
                                <button title="Copy Image" className="p-1 hover:bg-gray-100 rounded text-gray-700" onClick={() => copyImageToClipboard(activeProject.godrejStampUrl)}><Copy size={16} /></button>
                                <button title="Duplicate to Right" className="p-1 hover:bg-gray-100 rounded text-gray-700" onClick={() => {
                                  updateProjectSettings('godrejStampTransform2', { width: 120, height: 120, x: 0, y: 0 });
                                  updateActiveProject({ godrejStampUrl2: activeProject.godrejStampUrl });
                                }}><Files size={16} /></button>
                                <button title="Flip Horizontal" className="p-1 hover:bg-gray-100 rounded text-gray-700" onClick={() => flipImageHorizontally(activeProject.godrejStampUrl, (url) => updateActiveProject({ godrejStampUrl: url }))}><FlipHorizontal size={16} /></button>
                                <button title="Flip Vertical" className="p-1 hover:bg-gray-100 rounded text-gray-700" onClick={() => flipImageVertically(activeProject.godrejStampUrl, (url) => updateActiveProject({ godrejStampUrl: url }))}><FlipVertical size={16} /></button>
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
                                onTouchStart={e => e.stopPropagation()}
                              >
                                <button title="Copy Image" className="p-1 hover:bg-gray-100 rounded text-gray-700" onClick={() => copyImageToClipboard(activeProject.godrejStampUrl2)}><Copy size={16} /></button>
                                <button title="Duplicate to Left" className="p-1 hover:bg-gray-100 rounded text-gray-700" onClick={() => {
                                  updateProjectSettings('godrejStampTransform', { width: 120, height: 120, x: 0, y: 0 });
                                  updateActiveProject({ godrejStampUrl: activeProject.godrejStampUrl2 });
                                }}><Files size={16} /></button>
                                <button title="Flip Horizontal" className="p-1 hover:bg-gray-100 rounded text-gray-700" onClick={() => flipImageHorizontally(activeProject.godrejStampUrl2, (url) => updateActiveProject({ godrejStampUrl2: url }))}><FlipHorizontal size={16} /></button>
                                <button title="Flip Vertical" className="p-1 hover:bg-gray-100 rounded text-gray-700" onClick={() => flipImageVertically(activeProject.godrejStampUrl2, (url) => updateActiveProject({ godrejStampUrl2: url }))}><FlipVertical size={16} /></button>
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
              )}
            </div>
          ))}
          </div>
        </div>
      </div>
      </div>
    </>
  );
};
