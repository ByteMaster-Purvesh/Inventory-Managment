import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReportStore } from '../../store/useReportStore';
import { InputPane } from './components/InputPane';
import { PreviewPane } from './components/PreviewPane';
import { FileText, ChevronRight, ChevronDown, LayoutDashboard, Settings, User, Search, Folder, History, Plus, FilePlus, FolderPlus, RotateCw, List } from 'lucide-react';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';

export const Editor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const setActiveProject = useReportStore((state) => state.setActiveProject);
  const activeProject = useReportStore((state) => state.activeProject);
  const projects = useReportStore((state) => state.projects);
  const createProject = useReportStore((state) => state.createProject);
  const deleteProjectGroup = useReportStore((state) => state.deleteProjectGroup);
  const renameProjectGroup = useReportStore((state) => state.renameProjectGroup);
  const deleteProject = useReportStore((state) => state.deleteProject);
  const renameProjectComponent = useReportStore((state) => state.renameProjectComponent);
  const moveProjectComponent = useReportStore((state) => state.moveProjectComponent);

  const [contextMenu, setContextMenu] = React.useState(null);
  const [editingFolder, setEditingFolder] = React.useState(null);
  const [editValue, setEditValue] = React.useState('');

  const [fileContextMenu, setFileContextMenu] = React.useState(null);
  const [editingFile, setEditingFile] = React.useState(null);
  const [editFileValue, setEditFileValue] = React.useState('');

  const [dragOverFolder, setDragOverFolder] = React.useState(null);
  const [selectedFiles, setSelectedFiles] = React.useState([]);
  const [selectedFolders, setSelectedFolders] = React.useState([]);
  const [collapsedFolders, setCollapsedFolders] = React.useState({});

  const [openTabs, setOpenTabs] = React.useState([]);
  const [draggedTab, setDraggedTab] = React.useState(null);

  const [activeSidebarTab, setActiveSidebarTab] = React.useState('projects');
  const [searchQuery, setSearchQuery] = React.useState('');

  const contextMenuRef = React.useRef(null);
  const fileContextMenuRef = React.useRef(null);
  const previewPanelRef = React.useRef(null);

  React.useEffect(() => {
    if (contextMenu && contextMenuRef.current) {
      const rect = contextMenuRef.current.getBoundingClientRect();
      let newTop = contextMenu.y;
      let newLeft = contextMenu.x;
      if (rect.bottom > window.innerHeight - 8) newTop = window.innerHeight - rect.height - 8;
      if (rect.right > window.innerWidth - 8) newLeft = window.innerWidth - rect.width - 8;
      contextMenuRef.current.style.top = `${Math.max(8, newTop)}px`;
      contextMenuRef.current.style.left = `${Math.max(8, newLeft)}px`;
    }
  }, [contextMenu]);

  React.useEffect(() => {
    if (fileContextMenu && fileContextMenuRef.current) {
      const rect = fileContextMenuRef.current.getBoundingClientRect();
      let newTop = fileContextMenu.y;
      let newLeft = fileContextMenu.x;
      if (rect.bottom > window.innerHeight - 8) newTop = window.innerHeight - rect.height - 8;
      if (rect.right > window.innerWidth - 8) newLeft = window.innerWidth - rect.width - 8;
      fileContextMenuRef.current.style.top = `${Math.max(8, newTop)}px`;
      fileContextMenuRef.current.style.left = `${Math.max(8, newLeft)}px`;
    }
  }, [fileContextMenu]);

  React.useEffect(() => {
    if (activeProject) {
      setOpenTabs((prev) => {
        if (prev.includes(activeProject.id)) return prev;
        return [...prev, activeProject.id];
      });
    }
  }, [activeProject]);

  React.useEffect(() => {
    const handleClick = () => {
      setContextMenu(null);
      setFileContextMenu(null);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleContextMenu = (e, folderName, customer) => {
    e.preventDefault();
    if (!selectedFolders.includes(folderName)) {
      setSelectedFolders([folderName]);
      setSelectedFiles([]);
    }
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      folderName,
      customer
    });
  };

  const handleRenameSubmit = (oldFullPath) => {
    if (editValue.trim()) {
      const parentPath = oldFullPath.includes('/') ? oldFullPath.substring(0, oldFullPath.lastIndexOf('/')) : '';
      const newFullPath = parentPath ? `${parentPath}/${editValue.trim()}` : editValue.trim();
      
      if (newFullPath !== oldFullPath) {
        renameProjectGroup(oldFullPath, newFullPath);
      }
    }
    setEditingFolder(null);
  };

  const handleRenameFileSubmit = (id) => {
    if (editFileValue.trim()) {
      renameProjectComponent(id, editFileValue.trim());
    }
    setEditingFile(null);
  };

  const expandAncestors = (path) => {
    if (!path) return;
    const parts = path.split('/');
    let current = '';
    setCollapsedFolders(prev => {
      const nextState = { ...prev };
      parts.forEach(part => {
        current = current ? `${current}/${part}` : part;
        nextState[current] = false;
      });
      return nextState;
    });
  };

  const handleNewFolder = (targetPath = '') => {
    let baseName = targetPath ? `${targetPath}/New Folder` : 'New Project';
    let newName = baseName;
    let count = 1;
    const existingFolders = new Set(projects.map(p => p.projectName));
    while (existingFolders.has(newName)) {
      newName = `${baseName} ${count}`;
      count++;
    }
    
    // Inherit customer if creating a sub-folder
    let customer = 'New Customer';
    if (targetPath) {
      const parentP = projects.find(p => p.projectName === targetPath || p.projectName.startsWith(targetPath + '/'));
      if (parentP) customer = parentP.customer;
    }
    
    const newId = createProject(newName, customer, 'New Component');
    expandAncestors(newName);
    navigate(`/editor/${newId}`);
    setEditingFolder(newName);
    setEditValue(newName.split('/').pop());
  };

  const handleNewFile = (targetFolderName, targetCustomer) => {
    let baseName = 'New Component';
    let newName = baseName;
    let count = 1;
    const existingFilesInFolder = projects.filter(p => p.projectName === targetFolderName).map(p => p.componentsName);
    while (existingFilesInFolder.includes(newName)) {
      newName = `${baseName} ${count}`;
      count++;
    }
    const newId = createProject(targetFolderName, targetCustomer, newName);
    expandAncestors(targetFolderName);
    setSelectedFiles([newId]);
    setSelectedFolders([]);
    navigate(`/editor/${newId}`);
    setEditingFile(newId);
    setEditFileValue(newName);
  };

  const handleFolderClick = (e, folderName) => {
    if (e.ctrlKey || e.metaKey) {
      setSelectedFolders(prev => prev.includes(folderName) ? prev.filter(f => f !== folderName) : [...prev, folderName]);
      setSelectedFiles([]);
    } else {
      setSelectedFolders([folderName]);
      setSelectedFiles([]);
      setCollapsedFolders(prev => ({ ...prev, [folderName]: !prev[folderName] }));
    }
  };

  const handleFileClick = (e, projectId) => {
    if (e.ctrlKey || e.metaKey) {
      setSelectedFiles(prev => prev.includes(projectId) ? prev.filter(id => id !== projectId) : [...prev, projectId]);
      setSelectedFolders([]);
    } else {
      setSelectedFiles([projectId]);
      setSelectedFolders([]);
      navigate(`/editor/${projectId}`);
    }
  };

  useEffect(() => {
    setActiveProject(id);
  }, [id, setActiveProject]);



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
            <button 
              className={`p-2 transition-colors ${activeSidebarTab === 'projects' ? 'text-zinc-100 border-l-2 border-orange-500 -ml-0.5' : 'text-zinc-500 hover:text-zinc-100'}`}
              title="Collections/Projects"
              onClick={() => setActiveSidebarTab('projects')}
            >
              <Folder size={20} />
            </button>
            <button 
              className={`p-2 transition-colors ${activeSidebarTab === 'search' ? 'text-zinc-100 border-l-2 border-orange-500 -ml-0.5' : 'text-zinc-500 hover:text-zinc-100'}`}
              title="Search"
              onClick={() => setActiveSidebarTab('search')}
            >
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
          {/* Left Pane */}
          <Panel defaultSize={20} minSize={10} className="border-r border-[#2b2b2b] bg-[#1e1e1e] flex flex-col h-full">
            {activeSidebarTab === 'projects' ? (
              <>
                <div className="p-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider flex justify-between items-center group">
                  <span>Projects</span>
            <div className="flex items-center gap-1">
              <button 
                className="text-zinc-400 hover:text-zinc-100 transition-colors p-1 hover:bg-[#2a2d2e] rounded" 
                onClick={() => {
                  let pName = 'New Project';
                  let pCust = '';
                  if (selectedFolders.length > 0) {
                    pName = selectedFolders[0];
                    const p = projects.find(p => p.projectName === pName);
                    pCust = p ? p.customer : '';
                  } else if (selectedFiles.length > 0) {
                    const p = projects.find(p => p.id === selectedFiles[0]);
                    if (p) {
                      pName = p.projectName;
                      pCust = p.customer;
                    }
                  } else if (activeProject) {
                    pName = activeProject.projectName;
                    pCust = activeProject.customer;
                  }
                  handleNewFile(pName, pCust);
                }}
                title="New File (Component)"
              >
                <FilePlus size={15} />
              </button>
              <button 
                className="text-zinc-400 hover:text-zinc-100 transition-colors p-1 hover:bg-[#2a2d2e] rounded" 
                onClick={() => {
                  let targetPath = '';
                  if (selectedFolders.length > 0) {
                    targetPath = selectedFolders[0];
                  }
                  handleNewFolder(targetPath);
                }}
                title="New Folder (Project)"
              >
                <FolderPlus size={15} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto hide-scrollbar py-1">
            {(() => {
              // Build Tree
              const root = { name: 'root', fullPath: '', children: {}, projects: [] };
              projects.forEach(p => {
                const parts = (p.projectName || 'Untitled Project').split('/');
                let current = root;
                let pathAcc = [];
                parts.forEach(part => {
                  pathAcc.push(part);
                  const pPath = pathAcc.join('/');
                  if (!current.children[part]) {
                    current.children[part] = { name: part, fullPath: pPath, children: {}, projects: [] };
                  }
                  current = current.children[part];
                });
                current.projects.push(p);
              });

              // Recursive Render Function
              const renderNode = (node, level = 0) => {
                const { name: folderName, fullPath, children, projects: nodeProjects } = node;
                // Check if any active project is inside this folder (for styling)
                const isActiveFolder = activeProject && (activeProject.projectName === fullPath || activeProject.projectName.startsWith(fullPath + '/'));
                
                return (
                  <div key={fullPath} className="mb-1" style={{ marginLeft: level > 0 ? 12 : 0 }}>
                    <div 
                      className={`border border-transparent transition-colors ${dragOverFolder === fullPath ? 'border-orange-500/50 bg-orange-500/10' : ''}`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (dragOverFolder !== fullPath) setDragOverFolder(fullPath);
                      }}
                      onDragLeave={() => {
                        if (dragOverFolder === fullPath) setDragOverFolder(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOverFolder(null);
                        try {
                          const data = e.dataTransfer.getData('application/json');
                          if (data) {
                            const draggedIds = JSON.parse(data);
                            draggedIds.forEach(id => moveProjectComponent(id, fullPath));
                          }
                        } catch {
                          const draggedId = e.dataTransfer.getData('text/plain');
                          if (draggedId) moveProjectComponent(draggedId, fullPath);
                        }
                      }}
                    >
                      <div 
                        onClick={(e) => handleFolderClick(e, fullPath)}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          setEditingFolder(fullPath);
                          setEditValue(folderName);
                        }}
                        onContextMenu={(e) => {
                          const cust = (nodeProjects[0]?.customer) || ''; // or search children
                          handleContextMenu(e, fullPath, cust);
                        }}
                        className={`w-full text-left px-2 py-1.5 text-sm flex items-center gap-1 cursor-pointer transition-colors ${
                          selectedFolders.includes(fullPath) ? 'bg-[#37373d] text-zinc-100' : 'text-zinc-300 hover:bg-[#2a2d2e]'
                        }`}
                      >
                        {collapsedFolders[fullPath] ? (
                          <ChevronRight size={14} className="text-zinc-500 shrink-0" />
                        ) : (
                          <ChevronDown size={14} className="text-zinc-500 shrink-0" />
                        )}
                        <Folder size={14} className={isActiveFolder ? 'text-orange-500 shrink-0' : 'text-zinc-500 shrink-0'} />
                        {editingFolder === fullPath ? (
                            <input 
                              type="text"
                              autoFocus
                              ref={(input) => input && input.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                              onFocus={(e) => e.target.select()}
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              onBlur={() => handleRenameSubmit(fullPath)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleRenameSubmit(fullPath);
                                if (e.key === 'Escape') setEditingFolder(null);
                              }}
                              className="bg-[#3c3c3c] text-zinc-100 border border-orange-500 outline-none px-1 text-sm flex-1 truncate ml-1"
                              onClick={e => e.stopPropagation()}
                            />
                        ) : (
                          <span className={`truncate font-medium ml-1 ${isActiveFolder ? 'text-zinc-100' : ''}`}>{folderName}</span>
                        )}
                      </div>
                      {!collapsedFolders[fullPath] && (
                        <div className="flex flex-col">
                          {/* Render Sub-folders */}
                        {Object.values(children).map(child => renderNode(child, level + 1))}
                        
                        {/* Render Components in this folder */}
                        {nodeProjects.map((project) => (
                          <button
                            key={project.id}
                            draggable
                            onDragStart={(e) => {
                              const dragIds = selectedFiles.includes(project.id) ? selectedFiles : [project.id];
                              e.dataTransfer.setData('application/json', JSON.stringify(dragIds));
                            }}
                            onClick={(e) => handleFileClick(e, project.id)}
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              setEditingFile(project.id);
                              setEditFileValue(project.componentsName || 'Untitled Component');
                            }}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (!selectedFiles.includes(project.id)) {
                                setSelectedFiles([project.id]);
                                setSelectedFolders([]);
                              }
                              setFileContextMenu({
                                x: e.clientX,
                                y: e.clientY,
                                projectId: project.id,
                                currentName: project.componentsName,
                                folderName: project.projectName,
                                customer: project.customer
                              });
                            }}
                            className={`w-full text-left pl-8 pr-4 py-1 text-sm flex items-center justify-between group transition-colors ${
                              selectedFiles.includes(project.id) || (activeProject && project.id === activeProject.id && selectedFiles.length === 0)
                                ? 'bg-[#37373d] text-zinc-100' 
                                : 'text-zinc-400 hover:bg-[#2a2d2e] hover:text-zinc-200'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <FileText size={13} className={project.id === activeProject?.id ? 'text-zinc-100' : 'text-zinc-500 group-hover:text-zinc-300'} />
                              {editingFile === project.id ? (
                                <input 
                                  type="text"
                                  autoFocus
                                  ref={(input) => input && input.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                                  onFocus={(e) => e.target.select()}
                                  value={editFileValue}
                                  onChange={e => setEditFileValue(e.target.value)}
                                  onBlur={() => handleRenameFileSubmit(project.id)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') handleRenameFileSubmit(project.id);
                                    if (e.key === 'Escape') setEditingFile(null);
                                  }}
                                  className="bg-[#3c3c3c] text-zinc-100 border border-orange-500 outline-none px-1 text-sm flex-1 truncate"
                                  onClick={e => e.stopPropagation()}
                                />
                              ) : (
                                <span className="truncate">{project.componentsName || 'Untitled Component'}</span>
                              )}
                            </div>
                          </button>
                        ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              };

              return Object.values(root.children).map(child => renderNode(child, 0));
            })()}
          </div>
          </>
            ) : (
              <>
                <div className="p-3 text-xs font-semibold text-zinc-300 flex justify-between items-center group">
                  <span>Code Search</span>
                  <div className="flex gap-2">
                    <RotateCw size={14} className="text-zinc-400 hover:text-zinc-100 cursor-pointer" />
                    <List size={14} className="text-zinc-400 hover:text-zinc-100 cursor-pointer" />
                    <Plus size={14} className="text-zinc-400 hover:text-zinc-100 cursor-pointer" />
                  </div>
                </div>
                <div className="px-3 pb-2 flex flex-col gap-1">
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Search"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full bg-[#3c3c3c] text-[#cccccc] pl-2 pr-16 py-1 text-sm border border-transparent focus:border-[#007fd4] outline-none rounded-sm"
                    />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] text-zinc-400 font-mono font-bold tracking-wider">
                      <span className="cursor-pointer hover:text-zinc-100">Aa</span>
                      <span className="cursor-pointer hover:text-zinc-100">ab</span>
                      <span className="cursor-pointer hover:text-zinc-100">.*</span>
                    </div>
                  </div>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Replace"
                      className="w-full bg-[#3c3c3c] text-[#cccccc] pl-2 pr-8 py-1 text-sm border border-transparent focus:border-[#007fd4] outline-none rounded-sm"
                    />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center text-[10px] text-zinc-400 font-mono font-bold">
                      <span className="cursor-pointer hover:text-zinc-100 tracking-wider">AB</span>
                    </div>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 text-sm">
                  {(() => {
                    if (!searchQuery) return null;
                    const query = searchQuery.toLowerCase();
                    const filteredProjects = projects.filter(p => 
                      (p.projectName && p.projectName.toLowerCase().includes(query)) ||
                      (p.componentsName && p.componentsName.toLowerCase().includes(query))
                    );
                    
                    if (filteredProjects.length === 0) {
                      return <div className="text-zinc-500 px-2 py-1">No results found.</div>;
                    }

                    const uniqueFolders = new Set(filteredProjects.map(p => p.projectName));
                    const numFiles = filteredProjects.length;
                    const numFolders = uniqueFolders.size;

                    return (
                      <div className="flex flex-col gap-1">
                        <div className="text-xs text-zinc-400 px-2 mb-2">
                          {numFiles} results in {numFolders} folders - <span className="text-[#007fd4] cursor-pointer hover:underline">Open in editor</span>
                        </div>
                        {filteredProjects.map(project => (
                          <div 
                            key={project.id}
                            onClick={(e) => handleFileClick(e, project.id)}
                            className="w-full text-left px-2 py-1.5 text-sm flex flex-col group transition-colors text-zinc-300 hover:bg-[#2a2d2e] cursor-pointer rounded-sm"
                          >
                            <div className="flex items-center gap-2">
                              <FileText size={13} className="text-[#007fd4]" />
                              <span className="truncate">{project.componentsName || 'Untitled'}</span>
                            </div>
                            <div className="text-[10px] text-zinc-500 pl-5 truncate">
                              {project.projectName}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </>
            )}
          </Panel>

          <PanelResizeHandle className="w-1 bg-[#2b2b2b] hover:bg-orange-500 transition-colors focus:bg-orange-500 cursor-col-resize relative flex items-center justify-center shrink-0 group z-10">
            <div className="h-8 w-1 rounded-full bg-zinc-600 group-hover:bg-zinc-300 transition-colors"></div>
          </PanelResizeHandle>

          {/* Center Pane - Editor & Preview */}
          <Panel defaultSize={60} minSize={30} className="flex flex-col min-w-0 bg-[#1e1e1e] h-full">
          {!activeProject ? (
            <div className="flex-1 flex items-center justify-center text-zinc-500">
              <div className="text-center">
                <div className="text-6xl mb-4 opacity-50">📁</div>
                <h2 className="text-xl font-semibold text-zinc-300 mb-2">No Active Project</h2>
                <p>Select a project from the sidebar or create a new one.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Editor Tabs Bar */}
              <div className="h-9 flex bg-[#181818] shrink-0 overflow-x-auto">
                {openTabs.map(tabId => {
                  const proj = projects.find(p => p.id === tabId);
                  if (!proj) return null;
                  const isActive = activeProject.id === tabId;
                  
                  return (
                    <div 
                      key={tabId}
                      draggable
                      onDragStart={(e) => {
                        setDraggedTab(tabId);
                        e.dataTransfer.setData('text/plain', tabId);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault(); // allow drop
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const droppedTabId = e.dataTransfer.getData('text/plain');
                        if (!droppedTabId || droppedTabId === tabId) return;
                        setOpenTabs(prev => {
                          const newTabs = [...prev];
                          const dragIdx = newTabs.indexOf(droppedTabId);
                          const dropIdx = newTabs.indexOf(tabId);
                          if (dragIdx === -1 || dropIdx === -1) return prev;
                          newTabs.splice(dragIdx, 1);
                          newTabs.splice(dropIdx, 0, droppedTabId);
                          return newTabs;
                        });
                      }}
                      onClick={() => navigate(`/editor/${tabId}`)}
                      className={`flex items-center px-4 py-2 text-sm gap-2 min-w-max cursor-pointer border-t-2 ${
                        isActive 
                          ? 'bg-[#1e1e1e] border-orange-500 text-zinc-100' 
                          : 'bg-[#181818] border-transparent text-zinc-500 hover:bg-[#1e1e1e] border-r border-[#2b2b2b]'
                      }`}
                    >
                      {proj.componentsName || 'Untitled Component'}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          const newTabs = openTabs.filter(id => id !== tabId);
                          setOpenTabs(newTabs);
                          if (isActive) {
                            const nextTab = newTabs[newTabs.length - 1];
                            if (nextTab) {
                              navigate(`/editor/${nextTab}`);
                            } else {
                              navigate('/');
                            }
                          }
                        }}
                        className={`ml-2 rounded-sm p-0.5 ${isActive ? 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/50' : 'text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800'}`}
                      >
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.64645 4.64645C4.84171 4.45118 5.15829 4.45118 5.35355 4.64645L8 7.29289L10.6464 4.64645C10.8417 4.45118 11.1583 4.45118 11.3536 4.64645C11.5488 4.84171 11.5488 5.15829 11.3536 5.35355L8.70711 8L11.3536 10.6464C11.5488 10.8417 11.5488 11.1583 11.3536 11.3536C11.1583 11.5488 10.8417 11.5488 10.6464 11.3536L8 8.70711L5.35355 11.3536C5.15829 11.5488 4.84171 11.5488 4.64645 11.3536C4.45118 11.1583 4.45118 10.8417 4.64645 10.6464L7.29289 8L4.64645 5.35355C4.45118 5.15829 4.45118 4.84171 4.64645 4.64645Z" fill="currentColor"/></svg>
                      </button>
                    </div>
                  );
                })}
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
                  <InputPane onLivePreviewClick={() => {
                    if (previewPanelRef.current) {
                      previewPanelRef.current.resize(70);
                      setTimeout(() => {
                        const previewSection = document.getElementById('preview-pane-section');
                        if (previewSection) {
                          previewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }, 100);
                    }
                  }} />
                </Panel>
                
                <PanelResizeHandle className="h-1 bg-[#2b2b2b] hover:bg-orange-500 transition-colors focus:bg-orange-500 cursor-row-resize relative flex items-center justify-center shrink-0 group">
                  <div className="w-8 h-1 rounded-full bg-zinc-600 group-hover:bg-zinc-300 transition-colors"></div>
                </PanelResizeHandle>
                
                <Panel ref={previewPanelRef} defaultSize={33} minSize={20} className="flex flex-col overflow-hidden relative bg-[#1e1e1e] h-full">
                  <PreviewPane />
                </Panel>
              </PanelGroup>
            </>
          )}
          </Panel>

          <PanelResizeHandle className="w-1 bg-[#2b2b2b] hover:bg-orange-500 transition-colors focus:bg-orange-500 cursor-col-resize relative flex items-center justify-center shrink-0 group hidden xl:flex z-10">
            <div className="h-8 w-1 rounded-full bg-zinc-600 group-hover:bg-zinc-300 transition-colors"></div>
          </PanelResizeHandle>

          {/* Right Pane - Summary (Contextual Right Sidebar) */}
          {activeProject && (
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
          )}
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
          <span className="cursor-pointer hover:bg-white/20 px-1 rounded transition-colors">{activeProject?.rows?.length || 0} items</span>
          <span className="cursor-pointer hover:bg-white/20 px-1 rounded transition-colors">Prettier</span>
        </div>
      </div>

      {/* Context Menu Popup */}
      {contextMenu && (
        <div 
          ref={contextMenuRef}
          className="fixed z-50 bg-[#252526] border border-[#454545] shadow-2xl rounded-md min-w-[280px] py-1.5 text-[13px] text-[#cccccc] font-sans"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="hover:bg-[#0060c0] hover:text-white px-6 py-1 cursor-default flex justify-between group"
               onClick={() => {
                 handleNewFile(contextMenu.folderName, contextMenu.customer);
                 setContextMenu(null);
               }}>
            <span>New File...</span>
          </div>
          <div className="hover:bg-[#0060c0] hover:text-white px-6 py-1 cursor-default flex justify-between group"
               onClick={() => {
                 handleNewFolder(contextMenu.folderName);
                 setContextMenu(null);
               }}>
            <span>New Folder...</span>
          </div>

          <div className="h-px bg-[#333] my-1 mx-2"></div>

          <div className="hover:bg-[#0060c0] hover:text-white px-6 py-1 cursor-default flex justify-between group">
            <span>Share</span>
            <span className="text-zinc-500 group-hover:text-zinc-300">›</span>
          </div>

          <div className="h-px bg-[#333] my-1 mx-2"></div>

          <div className="hover:bg-[#0060c0] hover:text-white px-6 py-1 cursor-default flex justify-between group">
            <span>Cut</span>
            <span className="text-zinc-500 group-hover:text-zinc-300">Ctrl+X</span>
          </div>
          <div className="hover:bg-[#0060c0] hover:text-white px-6 py-1 cursor-default flex justify-between group">
            <span>Copy</span>
            <span className="text-zinc-500 group-hover:text-zinc-300">Ctrl+C</span>
          </div>
          <div className="hover:bg-[#0060c0] hover:text-white px-6 py-1 cursor-default flex justify-between text-zinc-500">
            <span>Paste</span>
            <span>Ctrl+V</span>
          </div>

          <div className="h-px bg-[#333] my-1 mx-2"></div>
          <div className="hover:bg-[#0060c0] hover:text-white px-6 py-1 cursor-default flex justify-between group"
               onClick={() => {
                 setEditValue(contextMenu.folderName);
                 setEditingFolder(contextMenu.folderName);
                 setContextMenu(null);
               }}>
            <span>Rename...</span>
            <span className="text-zinc-500 group-hover:text-zinc-300">F2</span>
          </div>
          <div className="hover:bg-[#0060c0] hover:text-white px-6 py-1 cursor-default flex justify-between group"
               onClick={() => {
                 const targets = selectedFolders.length > 0 ? selectedFolders : [contextMenu.folderName];
                 if(window.confirm(`Are you sure you want to delete ${targets.length} project(s) and all their components?`)) {
                   targets.forEach(f => deleteProjectGroup(f));
                   if (projects.length <= targets.length) {
                     navigate('/');
                   }
                 }
                 setContextMenu(null);
                 setSelectedFolders([]);
               }}>
            <span>Delete</span>
            <span className="text-zinc-500 group-hover:text-zinc-300">Delete</span>
          </div>
        </div>
      )}
      {/* File Context Menu */}
      {fileContextMenu && (
        <div 
          ref={fileContextMenuRef}
          className="fixed bg-[#252526] border border-[#454545] shadow-2xl rounded-md py-1.5 z-50 text-zinc-300 text-sm min-w-[160px]"
          style={{ top: fileContextMenu.y, left: fileContextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            className="w-full text-left px-4 py-1.5 hover:bg-[#04395e] hover:text-white transition-colors"
            onClick={() => {
              handleNewFile(fileContextMenu.folderName, fileContextMenu.customer);
              setFileContextMenu(null);
            }}
          >
            New File...
          </button>
          <button 
            className="w-full text-left px-4 py-1.5 hover:bg-[#04395e] hover:text-white transition-colors"
            onClick={() => {
              handleNewFolder();
              setFileContextMenu(null);
            }}
          >
            New Folder...
          </button>
          <div className="h-px bg-[#3c3c3c] my-1"></div>
          <button 
            className="w-full text-left px-4 py-1.5 hover:bg-[#04395e] hover:text-white transition-colors"
            onClick={() => {
              setEditingFile(fileContextMenu.projectId);
              setEditFileValue(fileContextMenu.currentName || 'Untitled Component');
              setFileContextMenu(null);
            }}
          >
            Rename...
          </button>
          <div className="h-px bg-[#3c3c3c] my-1"></div>
          <button 
            className="w-full text-left px-4 py-1.5 hover:bg-[#04395e] hover:text-white transition-colors"
            onClick={() => {
              const targets = selectedFiles.length > 0 ? selectedFiles : [fileContextMenu.projectId];
              if (window.confirm(`Are you sure you want to delete ${targets.length} component(s)?`)) {
                targets.forEach(id => deleteProject(id));
              }
              setFileContextMenu(null);
              setSelectedFiles([]);
            }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
};
