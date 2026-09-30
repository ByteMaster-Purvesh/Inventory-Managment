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
  previewMode: 'report',

  setPreviewMode: (mode) => set({ previewMode: mode }),
  setActiveInputTab: (tab) => set({ activeInputTab: tab }),
  setActiveRow: (id) => set({ activeRowId: id }),

  createProject: (projectName, customer, componentsName) => {
    const newProject = {
      id: Date.now().toString(),
      projectName,
      customer,
      componentsName,
      type: 'inspection',
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
      customTables: [], // Array of custom tables created by the user
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
      const updatedProjects = [...state.projects, newProject];
      saveToLocalStorage(updatedProjects);
      return { projects: updatedProjects, activeProject: newProject };
    });
    return newProject.id;
  },

  createSnagSheetProject: (projectName, customer, componentsName, linkedComponentIds) => {
    const newProject = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      projectName,
      customer,
      componentsName,
      type: 'snagsheet',
      linkedComponentIds,
      date: new Date().toLocaleDateString('en-GB'),
      snagSheetNo: '',
      toolDescription: '',
      itemCodeNo: '',
      poNo: '',
      drgNo: '',
      supplierName: '',
      rows: [],
      customTables: [],
      settings: {
        fontFamily: 'Helvetica',
        fontSize: 11,
        isBold: false,
        isItalic: false,
        textAlign: 'left',
        logoUrl: null,
        logoTransform: { width: 150, height: 48, x: 0, y: 0 },
        stampTransform: { width: 120, height: 120, x: 0, y: 0 },
        godrejStampTransform: { width: 120, height: 120, x: 0, y: 0 },
        godrejStampTransform2: { width: 120, height: 120, x: 0, y: 0 },
      },
    };
    
    set((state) => {
      const updatedProjects = [...state.projects, newProject];
      saveToLocalStorage(updatedProjects);
      return { projects: updatedProjects, activeProject: newProject, previewMode: 'snagsheet', activeInputTab: 'Form' };
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

  deleteProjectGroup: (projectName) => {
    set((state) => {
      const updatedProjects = state.projects.filter(p => 
        !(p.projectName === projectName || p.projectName.startsWith(projectName + '/'))
      );
      saveToLocalStorage(updatedProjects);
      
      let newActive = state.activeProject;
      if (state.activeProject && (state.activeProject.projectName === projectName || state.activeProject.projectName.startsWith(projectName + '/'))) {
        newActive = updatedProjects.length > 0 ? updatedProjects[0] : null;
      }
      
      return { projects: updatedProjects, activeProject: newActive };
    });
  },

  renameProjectGroup: (oldName, newName) => {
    set((state) => {
      const updatedProjects = state.projects.map((p) => {
        if (p.projectName === oldName || p.projectName.startsWith(oldName + '/')) {
          const newProjectName = newName + p.projectName.slice(oldName.length);
          return { ...p, projectName: newProjectName };
        }
        return p;
      });
      saveToLocalStorage(updatedProjects);
      
      let newActive = state.activeProject;
      if (state.activeProject && (state.activeProject.projectName === oldName || state.activeProject.projectName.startsWith(oldName + '/'))) {
        newActive = { ...state.activeProject, projectName: newName + state.activeProject.projectName.slice(oldName.length) };
      }
      
      return { projects: updatedProjects, activeProject: newActive };
    });
  },

  deleteProject: (id) => {
    set((state) => {
      const updatedProjects = state.projects.filter(p => p.id !== id);
      saveToLocalStorage(updatedProjects);
      
      let newActive = state.activeProject;
      if (state.activeProject && state.activeProject.id === id) {
        newActive = updatedProjects.length > 0 ? updatedProjects[0] : null;
      }
      
      return { projects: updatedProjects, activeProject: newActive };
    });
  },

  renameProjectComponent: (id, newName) => {
    set((state) => {
      const updatedProjects = state.projects.map((p) => {
        if (p.id === id) {
          return { ...p, componentsName: newName };
        }
        return p;
      });
      saveToLocalStorage(updatedProjects);
      
      let newActive = state.activeProject;
      if (state.activeProject && state.activeProject.id === id) {
        newActive = { ...state.activeProject, componentsName: newName };
      }
      
      return { projects: updatedProjects, activeProject: newActive };
    });
  },

  moveProjectComponent: (id, newProjectName) => {
    set((state) => {
      const targetGroup = state.projects.find(p => p.projectName === newProjectName);
      const newCustomer = targetGroup ? targetGroup.customer : '';

      const updatedProjects = state.projects.map((p) => {
        if (p.id === id) {
          return { ...p, projectName: newProjectName, customer: newCustomer };
        }
        return p;
      });
      saveToLocalStorage(updatedProjects);

      let newActive = state.activeProject;
      if (state.activeProject && state.activeProject.id === id) {
        newActive = { ...state.activeProject, projectName: newProjectName, customer: newCustomer };
      }

      return { projects: updatedProjects, activeProject: newActive };
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
        places: '',
        observations: Array(state.activeProject.rows.length > 0 ? state.activeProject.rows[0].observations.length : 1).fill(''), // Array for multiple jobs/components
        instrument: '',
        instrumentNo: '',
        isBold: state.activeProject.settings?.isBold || false,
        isItalic: state.activeProject.settings?.isItalic || false,
        textAlign: state.activeProject.settings?.textAlign || 'left',
        fontFamily: state.activeProject.settings?.fontFamily || 'Helvetica',
        fontSize: state.activeProject.settings?.fontSize || 11
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
        if (field === 'drawingSize' || field === 'toleranceVal' || field === 'drawingSizeSymbol' || field === 'toleranceVal2' || field === 'drawingSizeSymbol2') {
           updatedRow.calculatedTolerance = calculateTolerance(
             updatedRow.drawingSize, 
             updatedRow.toleranceVal,
             updatedRow.drawingSizeSymbol,
             updatedRow.toleranceVal2,
             updatedRow.drawingSizeSymbol2
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
      const updatedProjects = state.projects.map((p) => p.id === updatedProject.id ? updatedProject : p);
      saveToLocalStorage(updatedProjects);
      return { activeProject: updatedProject, projects: updatedProjects };
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
      const updatedProjects = state.projects.map((p) => p.id === updatedProject.id ? updatedProject : p);
      saveToLocalStorage(updatedProjects);
      return { activeProject: updatedProject, projects: updatedProjects };
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
      const updatedProjects = state.projects.map((p) => p.id === updatedProject.id ? updatedProject : p);
      saveToLocalStorage(updatedProjects);
      return { activeProject: updatedProject, projects: updatedProjects };
    });
  },

  addCustomTable: (rows, cols) => {
    set((state) => {
      if (!state.activeProject) return state;
      const newTable = {
        id: Date.now().toString(),
        rows,
        cols,
        data: Array.from({ length: rows }, () => Array(cols).fill(''))
      };
      const updatedProject = {
        ...state.activeProject,
        customTables: [...(state.activeProject.customTables || []), newTable]
      };
      const updatedProjects = state.projects.map((p) => p.id === updatedProject.id ? updatedProject : p);
      saveToLocalStorage(updatedProjects);
      return { activeProject: updatedProject, projects: updatedProjects };
    });
  },

  updateCustomTable: (tableId, rowIndex, colIndex, value) => {
    set((state) => {
      if (!state.activeProject) return state;
      const updatedTables = (state.activeProject.customTables || []).map(table => {
        if (table.id !== tableId) return table;
        const newData = [...table.data];
        const newRow = [...newData[rowIndex]];
        newRow[colIndex] = value;
        newData[rowIndex] = newRow;
        return { ...table, data: newData };
      });
      const updatedProject = { ...state.activeProject, customTables: updatedTables };
      const updatedProjects = state.projects.map((p) => p.id === updatedProject.id ? updatedProject : p);
      saveToLocalStorage(updatedProjects);
      return { activeProject: updatedProject, projects: updatedProjects };
    });
  },

  updateCustomTableSize: (tableId, newRows, newCols) => {
    set((state) => {
      if (!state.activeProject) return state;
      const updatedTables = (state.activeProject.customTables || []).map(table => {
        if (table.id !== tableId) return table;
        
        let newData = [...table.data];
        // adjust rows
        if (newRows > table.rows) {
          for (let i = table.rows; i < newRows; i++) {
            newData.push(Array(newCols).fill(''));
          }
        } else if (newRows < table.rows) {
          newData = newData.slice(0, newRows);
        }

        // adjust cols for all rows
        if (newCols !== table.cols) {
          newData = newData.map(row => {
            let r = [...row];
            if (newCols > table.cols) {
              for (let i = table.cols; i < newCols; i++) r.push('');
            } else {
              r = r.slice(0, newCols);
            }
            return r;
          });
        }

        return { ...table, rows: newRows, cols: newCols, data: newData };
      });
      const updatedProject = { ...state.activeProject, customTables: updatedTables };
      const updatedProjects = state.projects.map((p) => p.id === updatedProject.id ? updatedProject : p);
      saveToLocalStorage(updatedProjects);
      return { activeProject: updatedProject, projects: updatedProjects };
    });
  },

  deleteCustomTable: (tableId) => {
    set((state) => {
      if (!state.activeProject) return state;
      const updatedTables = (state.activeProject.customTables || []).filter(t => t.id !== tableId);
      const updatedProject = { ...state.activeProject, customTables: updatedTables };
      const updatedProjects = state.projects.map((p) => p.id === updatedProject.id ? updatedProject : p);
      saveToLocalStorage(updatedProjects);
      return { activeProject: updatedProject, projects: updatedProjects };
    });
  }

}));
