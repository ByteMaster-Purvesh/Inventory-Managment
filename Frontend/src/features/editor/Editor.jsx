import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReportStore } from '../../store/useReportStore';
import { InputPane } from './components/InputPane';
import { PreviewPane } from './components/PreviewPane';
import { FileText, ChevronRight, LayoutDashboard, Settings, User, Search, Folder, History, Plus } from 'lucide-react';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';

export const Editor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const setActiveProject = useReportStore((state) => state.setActiveProject);
  const activeProject = useReportStore((state) => state.activeProject);
  const projects = useReportStore((state) => state.projects);
  const createProject = useReportStore((state) => state.createProject);

  useEffect(() => {
    setActiveProject(id);
  }, [id, setActiveProject]);

  if (!activeProject) {
    return <div className="p-8 text-center text-zinc-500 bg-[#1e1e1e] h-screen">Loading project...</div>;
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#181818] text-[#cccccc]">
      
      {/* Main Workspace (Postman/IDE Style) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Activity Bar (Far Left - IDE Style) */}
        <div className="w-12 bg-[#181818] border-r border-[#2b2b2b] flex flex-col items-center py-2 shrink-0 z-10">
          <div className="flex flex-col gap-4">
            <button className="p-2 text-zinc-500 hover:text-zinc-100 transition-colors" title="Dashboard" onClick={() => navigate('/')}>
              <LayoutDashboard size={20} />
            </button>
            <button className="p-2 text-zinc-100 border-l-2 border-orange-500 -ml-0.5" title="Collections/Projects">
              <Folder size={20} />
            </button>
            <button className="p-2 text-zinc-500 hover:text-zinc-100 transition-colors" title="Search">
              <Search size={20} />
            </button>
            <button className="p-2 text-zinc-500 hover:text-zinc-100 transition-colors" title="History">
              <History size={20} />
            </button>
          </div>
          <div className="mt-auto flex flex-col gap-4 mb-2">
            <button className="p-2 text-zinc-500 hover:text-zinc-100 transition-colors" title="Settings">
              <Settings size={20} />
            </button>
            <button className="p-2 text-zinc-500 hover:text-zinc-100 transition-colors" title="Account">
              <User size={20} />
            </button>
          </div>
        </div>

        <PanelGroup orientation="horizontal" className="flex-1">
          {/* Left Pane - Ongoing Projects (Explorer/Collections) */}
          <Panel defaultSize={20} minSize={10} className="border-r border-[#2b2b2b] bg-[#1e1e1e] flex flex-col h-full">
          <div className="p-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider flex justify-between items-center">
            <span>Projects</span>
            <button 
              className="text-zinc-400 hover:text-zinc-100 transition-colors p-1 hover:bg-[#2a2d2e] rounded border border-zinc-600 hover:border-zinc-400" 
              onClick={() => {
                const newId = createProject('New Project', '', '');
                navigate(`/editor/${newId}`);
              }}
              title="Create New Project"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto hide-scrollbar py-1">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => navigate(`/editor/${project.id}`)}
                className={`w-full text-left px-4 py-1.5 text-sm flex items-center justify-between group transition-colors ${
                  project.id === activeProject.id 
                    ? 'bg-[#37373d] text-zinc-100' 
                    : 'text-zinc-400 hover:bg-[#2a2d2e] hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <FileText size={14} className={project.id === activeProject.id ? 'text-orange-500' : 'text-zinc-500'} />
                  <span className="truncate">{project.projectName}</span>
                </div>
              </button>
            ))}
          </div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-[#2b2b2b] hover:bg-orange-500 transition-colors focus:bg-orange-500 cursor-col-resize relative flex items-center justify-center shrink-0 group z-10">
            <div className="h-8 w-1 rounded-full bg-zinc-600 group-hover:bg-zinc-300 transition-colors"></div>
          </PanelResizeHandle>

          {/* Center Pane - Editor & Preview */}
          <Panel defaultSize={60} minSize={30} className="flex flex-col min-w-0 bg-[#1e1e1e] h-full">
          
          {/* Editor Tabs Bar */}
          <div className="h-9 flex bg-[#181818] shrink-0 overflow-x-auto">
            <div className="flex items-center px-4 py-2 bg-[#1e1e1e] border-t-2 border-orange-500 text-sm text-zinc-100 gap-2 min-w-max cursor-pointer">
              <span className="text-orange-500 text-xs font-bold mr-1">REPORT</span>
              {activeProject.projectName}
              <button className="ml-2 text-zinc-500 hover:text-zinc-300 rounded-sm hover:bg-zinc-700/50 p-0.5">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.64645 4.64645C4.84171 4.45118 5.15829 4.45118 5.35355 4.64645L8 7.29289L10.6464 4.64645C10.8417 4.45118 11.1583 4.45118 11.3536 4.64645C11.5488 4.84171 11.5488 5.15829 11.3536 5.35355L8.70711 8L11.3536 10.6464C11.5488 10.8417 11.5488 11.1583 11.3536 11.3536C11.1583 11.5488 10.8417 11.5488 10.6464 11.3536L8 8.70711L5.35355 11.3536C5.15829 11.5488 4.84171 11.5488 4.64645 11.3536C4.45118 11.1583 4.45118 10.8417 4.64645 10.6464L7.29289 8L4.64645 5.35355C4.45118 5.15829 4.45118 4.84171 4.64645 4.64645Z" fill="currentColor"/></svg>
              </button>
            </div>
            {/* Fake inactive tab for realism */}
            <div className="flex items-center px-4 py-2 text-sm text-zinc-500 gap-2 min-w-max cursor-pointer hover:bg-[#1e1e1e] border-t-2 border-transparent border-r border-[#2b2b2b]">
              <span className="text-zinc-600 text-xs font-bold mr-1">JSON</span>
              config.json
            </div>
          </div>

          {/* Action Bar (URL bar equivalent in Postman) */}
          <div className="px-4 py-2 border-b border-[#2b2b2b] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs font-semibold px-2 py-1 bg-zinc-800 rounded text-zinc-300 border border-[#2b2b2b]">WORKSPACE</span>
              <div className="text-sm font-medium text-zinc-300 truncate">{activeProject.customer || 'Unnamed Customer'}</div>
            </div>
          </div>
          
          <PanelGroup orientation="vertical" className="flex-1 h-full">
            <Panel defaultSize={67} minSize={20} className="flex flex-col overflow-hidden h-full">
              <InputPane />
            </Panel>
            
            <PanelResizeHandle className="h-1 bg-[#2b2b2b] hover:bg-orange-500 transition-colors focus:bg-orange-500 cursor-row-resize relative flex items-center justify-center shrink-0 group">
              <div className="w-8 h-1 rounded-full bg-zinc-600 group-hover:bg-zinc-300 transition-colors"></div>
            </PanelResizeHandle>
            
            <Panel defaultSize={33} minSize={20} className="flex flex-col overflow-hidden relative bg-[#1e1e1e] h-full">
              <PreviewPane />
            </Panel>
          </PanelGroup>
          </Panel>

          <PanelResizeHandle className="w-1 bg-[#2b2b2b] hover:bg-orange-500 transition-colors focus:bg-orange-500 cursor-col-resize relative flex items-center justify-center shrink-0 group hidden xl:flex z-10">
            <div className="h-8 w-1 rounded-full bg-zinc-600 group-hover:bg-zinc-300 transition-colors"></div>
          </PanelResizeHandle>

          {/* Right Pane - Summary (Contextual Right Sidebar) */}
          <Panel defaultSize={20} minSize={10} className="border-l border-[#2b2b2b] bg-[#1e1e1e] flex flex-col hidden xl:flex h-full">
          <div className="p-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-[#2b2b2b]">
            Context
          </div>
          <div className="p-4 space-y-6">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-zinc-500 mb-2 font-semibold">Metadata</div>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-zinc-500">Customer</div>
                  <div className="text-sm text-zinc-200 mt-0.5">{activeProject.customer || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500">Component</div>
                  <div className="text-sm text-zinc-200 mt-0.5">{activeProject.componentsName || 'N/A'}</div>
                </div>
              </div>
            </div>
            
            <div className="w-full h-px bg-[#2b2b2b]"></div>

            <div>
              <div className="text-[11px] uppercase tracking-wider text-zinc-500 mb-2 font-semibold">Stats</div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="text-xs text-zinc-500">Total Rows</div>
                  <div className="text-sm text-zinc-200 font-mono bg-zinc-800 px-2 py-0.5 rounded">{activeProject.rows?.length || 0}</div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-xs text-zinc-500">Last Updated</div>
                  <div className="text-xs text-zinc-400">{activeProject.date}</div>
                </div>
              </div>
            </div>
          </div>
        </Panel>
        </PanelGroup>

      </div>
      
      {/* Bottom Navbar / Status Bar */}
      <div className="h-6 bg-[#007acc] text-white flex items-center px-3 justify-between shrink-0 text-[11px] font-medium">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 cursor-pointer hover:bg-white/20 px-1 rounded transition-colors"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 0L0 5L8 10L16 5L8 0ZM8 11L2.5 7.5L0 9L8 14L16 9L13.5 7.5L8 11Z" fill="currentColor"/></svg> master*</span>
          <span className="cursor-pointer hover:bg-white/20 px-1 rounded transition-colors">⟳ 0 ↓ 2</span>
          <span className="flex items-center gap-1 cursor-pointer hover:bg-white/20 px-1 rounded transition-colors">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 13A6 6 0 1 1 8 2a6 6 0 0 1 0 12zM7 4h2v5H7V4zm0 6h2v2H7v-2z" fill="currentColor"/></svg>
            0
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-1"><path d="M7 2h2v7H7V2zm0 8h2v2H7v-2zM8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0-1A6 6 0 1 0 8 2a6 6 0 0 0 0 12z" fill="currentColor"/></svg>
            0
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="cursor-pointer hover:bg-white/20 px-1 rounded transition-colors">Ln 1, Col 1</span>
          <span className="cursor-pointer hover:bg-white/20 px-1 rounded transition-colors">Spaces: 2</span>
          <span className="cursor-pointer hover:bg-white/20 px-1 rounded transition-colors">UTF-8</span>
          <span className="cursor-pointer hover:bg-white/20 px-1 rounded transition-colors">CRLF</span>
          <span className="cursor-pointer hover:bg-white/20 px-1 rounded transition-colors">{activeProject.rows?.length || 0} items</span>
          <span className="cursor-pointer hover:bg-white/20 px-1 rounded transition-colors">Prettier</span>
        </div>
      </div>
    </div>
  );
};
