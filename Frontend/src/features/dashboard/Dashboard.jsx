import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReportStore } from '../../store/useReportStore';
import { PlusCircle, FileText, Clock, Folder } from 'lucide-react';

export const Dashboard = () => {
  const [projectName, setProjectName] = useState('');
  const [customer, setCustomer] = useState('');
  const [componentsName, setComponentsName] = useState('');
  
  const createProject = useReportStore((state) => state.createProject);
  const projects = useReportStore((state) => state.projects);
  const navigate = useNavigate();

  const handleCreate = (e) => {
    e.preventDefault();
    if (!projectName.trim()) return;
    const id = createProject(projectName, customer, componentsName);
    navigate(`/editor/${id}`);
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Create New Project Section */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 h-fit">
        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
          <PlusCircle className="text-blue-500" />
          Create New Project
        </h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Project Name (XYZ Company)</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. HONEYWELL SM WAVE 2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Customer</label>
            <input
              type="text"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. GODREJ AEROSPACE"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Components Name</label>
            <input
              type="text"
              value={componentsName}
              onChange={(e) => setComponentsName(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. 01A BACKUP 1"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Start Project
          </button>
        </form>
      </div>

      {/* Projects Section */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
          <Folder className="text-slate-500" />
          All Projects
        </h2>
        <div className="space-y-3">
          {projects.length === 0 ? (
            <p className="text-slate-500 italic">No projects found.</p>
          ) : (
            Object.entries(
              projects.reduce((acc, project) => {
                if (!acc[project.projectName]) {
                  acc[project.projectName] = [];
                }
                acc[project.projectName].push(project);
                return acc;
              }, {})
            ).map(([folderName, groupProjects]) => (
              <div key={folderName} className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center gap-3">
                  <Folder className="text-blue-500 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-slate-900">{folderName}</h3>
                    <p className="text-xs text-slate-500">{groupProjects[0].customer || 'No Customer'}</p>
                  </div>
                </div>
                <div className="divide-y divide-slate-100">
                  {groupProjects.map((component) => (
                    <button
                      key={component.id}
                      onClick={() => navigate(`/editor/${component.id}`)}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 flex items-center justify-between group transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="text-slate-400 group-hover:text-blue-500 flex-shrink-0" size={16} />
                        <span className="text-sm font-medium text-slate-700 group-hover:text-blue-700">
                          {component.componentsName || 'Unnamed Component'}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">{component.date}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
