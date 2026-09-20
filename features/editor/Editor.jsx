import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useReportStore } from '../../store/useReportStore';
import { InputPane } from './components/InputPane';
import { PreviewPane } from './components/PreviewPane';
import { Download } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ReportPDF } from './components/pdf/ReportPDF';

export const Editor = () => {
  const { id } = useParams();
  const setActiveProject = useReportStore((state) => state.setActiveProject);
  const activeProject = useReportStore((state) => state.activeProject);

  useEffect(() => {
    setActiveProject(id);
  }, [id, setActiveProject]);

  if (!activeProject) {
    return <div className="p-8 text-center text-slate-500">Loading project...</div>;
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Editor Toolbar */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-lg font-bold text-slate-800">{activeProject.projectName}</h1>
          <p className="text-xs text-slate-500">Editing Inspection Report</p>
        </div>
        <div className="flex gap-2">
          <PDFDownloadLink 
            document={<ReportPDF project={activeProject} />} 
            fileName={`${activeProject.projectName.replace(/\s+/g, '_')}_Inspection_Report.pdf`}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            {({ loading }) => (
              <>
                <Download size={16} />
                {loading ? 'Generating...' : 'Export PDF'}
              </>
            )}
          </PDFDownloadLink>
        </div>
      </div>

      {/* Main Workspace (Postman Style) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane - Inputs */}
        <div className="w-1/2 border-r border-slate-200 bg-slate-50 flex flex-col overflow-hidden">
          <InputPane />
        </div>

        {/* Right Pane - Live Preview */}
        <div className="w-1/2 bg-slate-200 flex flex-col overflow-hidden relative">
          <div className="absolute top-0 w-full p-2 bg-slate-800/80 text-white text-xs font-semibold text-center shadow-sm z-10">
            LIVE PDF PREVIEW
          </div>
          <div className="flex-1 overflow-auto p-8 flex justify-center">
            <PreviewPane />
          </div>
        </div>
      </div>
    </div>
  );
};
