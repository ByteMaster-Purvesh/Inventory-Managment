import { create } from 'zustand';
import { calculateTolerance } from '../lib/calculations';

// Mock DB (localStorage)
const saveToLocalStorage = (projects) => {
  try {
    localStorage.setItem('projects', JSON.stringify(projects));
  } catch (error) {
    console.error('Failed to save projects to localStorage. This is likely due to images being too large:', error);
    alert('Failed to save your changes. Your images might be too large. Try uploading smaller images.');
  }
};

const loadFromLocalStorage = () => {
  const data = localStorage.getItem('projects');
  return data ? JSON.parse(data) : [];
};

export const useReportStore = create((set, get) => ({
  projects: loadFromLocalStorage(),
  activeProject: null,
  activeRowId: null,
  activeInputTab: 'Home',

  setActiveInputTab: (tab) => set({ activeInputTab: tab }),
  setActiveRow: (id) => set({ activeRowId: id }),

  createProject: (projectName, customer, componentsName) => {
    const newProject = {
      id: Date.now().toString(),
      projectName,
      customer,
      componentsName,
      date: new Date().toLocaleDateString('en-GB'), // DD/MM/YYYY
      projectNo: '',
      productionOrderNo: '',
      drgNo: '',
      revNo: '0',
      inspectionReportNo: '',
      asslySubAssly: '',
      qaPlanNo: '',
      inspectionStage: 'FINAL',
      poNo: '',
      rawMaterialUsed: '',
      quantity: '',
      rawMtrlIdnCtrlNo: '',
      identificationNos: '',
      rawMtrlInDrg: '',
      supplierName: '',
      rvNo: '',
      remarks: '',
      designerRemarks: '',
      supplierStampUrl: null,
      godrejStampUrl: null,
      godrejStampUrl2: null,
      rows: [], // Holds the tabular data
      settings: {
        fontFamily: 'Helvetica',
        fontSize: 11,
        isBold: false,
        isItalic: false,
        textAlign: 'left',
        logoUrl: null, // Base64 image
        logoTransform: { width: 150, height: 48, x: 0, y: 0 },
        stampTransform: { width: 120, height: 120, x: 0, y: 0 },
        godrejStampTransform: { width: 120, height: 120, x: 0, y: 0 },
        godrejStampTransform2: { width: 120, height: 120, x: 0, y: 0 },
      },
    };
    
    set((state) => {
      const updatedProjects = [newProject, ...state.projects].slice(0, 5); // Keep last 5
      saveToLocalStorage(updatedProjects);
      return { projects: updatedProjects, activeProject: newProject };
    });
    return newProject.id;
  },

  setActiveProject: (id) => {
    set((state) => ({
      activeProject: state.projects.find((p) => p.id === id) || null,
    }));
  },

  updateActiveProject: (updates) => {
    set((state) => {
      if (!state.activeProject) return state;
      const updatedProject = { ...state.activeProject, ...updates };
      const updatedProjects = state.projects.map((p) => 
        p.id === updatedProject.id ? updatedProject : p
      );
      saveToLocalStorage(updatedProjects);
      return { activeProject: updatedProject, projects: updatedProjects };
    });
  },

  updateProjectSettings: (field, value) => {
    set((state) => {
      if (!state.activeProject) return state;
      // Ensure settings exists for older projects
      const currentSettings = state.activeProject.settings || {
        fontFamily: 'Helvetica', fontSize: 11, isBold: false, isItalic: false, textAlign: 'left', logoUrl: null,
        logoTransform: { width: 150, height: 48, x: 0, y: 0 },
        stampTransform: { width: 120, height: 120, x: 0, y: 0 },
        godrejStampTransform: { width: 120, height: 120, x: 0, y: 0 },
        godrejStampTransform2: { width: 120, height: 120, x: 0, y: 0 }
      };
      const updatedSettings = { ...currentSettings, [field]: value };
      const updatedProject = { ...state.activeProject, settings: updatedSettings };
      const updatedProjects = state.projects.map((p) => 
        p.id === updatedProject.id ? updatedProject : p
      );
      saveToLocalStorage(updatedProjects);
      return { activeProject: updatedProject, projects: updatedProjects };
    });
  },

  addRow: () => {
    set((state) => {
      if (!state.activeProject) return state;
      const newRow = {
        id: Date.now().toString(),
        srNo: (state.activeProject.rows.length + 1).toString().padStart(2, '0'),
        drawingSize: '',
        drawingSizeSymbol: '', // ±, +, -, %, None
        toleranceVal: '',
        calculatedTolerance: '', // [min, max] or specific string
        observations: [''], // Array for multiple jobs/components
        instrument: '',
        instrumentNo: ''
      };
      const updatedProject = {
        ...state.activeProject,
        rows: [...state.activeProject.rows, newRow]
      };
      // Keep localStorage in sync
      const updatedProjects = state.projects.map((p) => p.id === updatedProject.id ? updatedProject : p);
      saveToLocalStorage(updatedProjects);
      return { activeProject: updatedProject, projects: updatedProjects, activeRowId: newRow.id };
    });
  },

  deleteRow: (rowId) => {
    set((state) => {
      if (!state.activeProject) return state;
      const updatedRows = state.activeProject.rows
        .filter(row => row.id !== rowId)
        .map((row, index) => ({
          ...row,
          srNo: (index + 1).toString().padStart(2, '0')
        }));
      const updatedProject = { ...state.activeProject, rows: updatedRows };
      const updatedProjects = state.projects.map((p) => p.id === updatedProject.id ? updatedProject : p);
      saveToLocalStorage(updatedProjects);
      
      return { 
        activeProject: updatedProject, 
        projects: updatedProjects,
        activeRowId: state.activeRowId === rowId ? null : state.activeRowId
      };
    });
  },

  deleteAllRows: () => {
    set((state) => {
      if (!state.activeProject) return state;
      const updatedProject = { ...state.activeProject, rows: [] };
      const updatedProjects = state.projects.map((p) => p.id === updatedProject.id ? updatedProject : p);
      saveToLocalStorage(updatedProjects);
      return { 
        activeProject: updatedProject, 
        projects: updatedProjects,
        activeRowId: null
      };
    });
  },

  reorderRows: (sourceIndex, destinationIndex) => {
    set((state) => {
      if (!state.activeProject) return state;
      const newRows = Array.from(state.activeProject.rows);
      const [movedRow] = newRows.splice(sourceIndex, 1);
      newRows.splice(destinationIndex, 0, movedRow);
      
      // Update serial numbers
      const updatedRows = newRows.map((row, index) => ({
        ...row,
        srNo: (index + 1).toString().padStart(2, '0')
      }));

      const updatedProject = { ...state.activeProject, rows: updatedRows };
      const updatedProjects = state.projects.map((p) => p.id === updatedProject.id ? updatedProject : p);
      saveToLocalStorage(updatedProjects);

      return { activeProject: updatedProject, projects: updatedProjects };
    });
  },

  updateRow: (rowId, field, value) => {
    set((state) => {
      if (!state.activeProject) return state;
      
      const updatedRows = state.activeProject.rows.map((row) => {
        if (row.id !== rowId) return row;
        
        let updatedRow = { ...row, [field]: value };
        
        // If drawing size or tolerance values change, recalculate the tolerance string
        if (field === 'drawingSize' || field === 'toleranceVal') {
           updatedRow.calculatedTolerance = calculateTolerance(
             updatedRow.drawingSize, 
             updatedRow.toleranceVal
           );
        }
        
        return updatedRow;
      });

      const updatedProject = { ...state.activeProject, rows: updatedRows };
      const updatedProjects = state.projects.map((p) => p.id === updatedProject.id ? updatedProject : p);
      saveToLocalStorage(updatedProjects);

      return { activeProject: updatedProject, projects: updatedProjects };
    });
  },

  updateObservation: (rowId, index, value) => {
    set((state) => {
      if (!state.activeProject) return state;
      const updatedRows = state.activeProject.rows.map((row) => {
        if (row.id !== rowId) return row;
        const newObs = [...row.observations];
        newObs[index] = value;
        return { ...row, observations: newObs };
      });
      const updatedProject = { ...state.activeProject, rows: updatedRows };
      return { activeProject: updatedProject };
    });
  },

  addObservationColumn: () => {
    set((state) => {
      if (!state.activeProject) return state;
      const updatedRows = state.activeProject.rows.map(row => ({
        ...row,
        observations: [...row.observations, '']
      }));
      const updatedProject = { ...state.activeProject, rows: updatedRows };
      return { activeProject: updatedProject };
    });
  },
  
  removeObservationColumn: () => {
    set((state) => {
      if (!state.activeProject) return state;
      const updatedRows = state.activeProject.rows.map(row => ({
        ...row,
        observations: row.observations.length > 1 ? row.observations.slice(0, -1) : row.observations
      }));
      const updatedProject = { ...state.activeProject, rows: updatedRows };
      return { activeProject: updatedProject };
    });
  }

}));
