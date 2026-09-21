import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReportStore } from '../../store/useReportStore';
import { PlusCircle, FileText, Clock } from 'lucide-react';

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

      {/* Recent Projects Section */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
          <Clock className="text-slate-500" />
          Recent Projects
        </h2>
        <div className="space-y-3">
          {projects.length === 0 ? (
            <p className="text-slate-500 italic">No recent projects found.</p>
          ) : (
            projects.map((project) => (
              <button
                key={project.id}
                onClick={() => navigate(`/editor/${project.id}`)}
                className="w-full text-left p-4 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50 flex items-start gap-4 transition-all"
              >
                <FileText className="text-slate-400 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-slate-900">{project.projectName}</h3>
                  <p className="text-sm text-slate-500">
                    {project.customer} • {project.date}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
