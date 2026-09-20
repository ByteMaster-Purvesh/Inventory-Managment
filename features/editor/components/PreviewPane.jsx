import React from 'react';
import { useReportStore } from '../../../store/useReportStore';
import { checkIsOutOfTolerance } from '../../../lib/calculations';

export const PreviewPane = () => {
  const activeProject = useReportStore((state) => state.activeProject);

  if (!activeProject) return null;

  const jobCount = activeProject.rows[0]?.observations.length || 1;
  const colSpanForId = jobCount > 1 ? jobCount : 1;

  return (
    <div className="bg-white w-[800px] shadow-2xl p-8 text-[11px] leading-tight text-black font-sans shrink-0 self-start origin-top mt-10">
      
      {/* Header Section */}
      <div className="border border-black mb-1">
        <div className="flex border-b border-black">
          <div className="w-1/3 p-2 border-r border-black flex items-center justify-center">
            {/* Logo placeholder */}
            <h1 className="text-xl font-bold text-blue-700 italic">Godrej AEROSPACE</h1>
          </div>
          <div className="w-2/3 p-2 flex flex-col justify-center">
            <h2 className="text-lg font-bold">INSPECTION REPORT</h2>
            <p className="font-semibold">Format No. QC16/FM/35</p>
            <p>Rev-01 & 11/10/2011</p>
          </div>
        </div>

        <div className="grid grid-cols-3 border-b border-black">
          <div className="p-1 border-r border-black col-span-1 border-b sm:border-b-0">
            Project: <span className="font-bold">{activeProject.projectName}</span>
          </div>
          <div className="p-1 border-r border-black border-b sm:border-b-0">
            Project no: 
          </div>
          <div className="p-1 flex justify-between">
            <span>Date: {activeProject.date}</span>
            <span>Page no.: 1 of 1</span>
          </div>
        </div>

        <div className="flex border-b border-black">
          <div className="w-1/3 p-1 border-r border-black">
            Customer: <span className="font-bold">{activeProject.customer}</span>
          </div>
          <div className="w-2/3 p-1 flex justify-between">
            <span>Components name: <span className="font-bold">{activeProject.componentsName}</span></span>
            <span>Rev No.: 0</span>
          </div>
        </div>
      </div>

      {/* Main Data Table */}
      <table className="w-full border-collapse border border-black text-center">
        <thead>
          <tr className="bg-slate-50">
            <th className="border border-black p-1 w-8 font-semibold" rowSpan={2}>SR. NO.</th>
            <th className="border border-black p-1 w-32 font-semibold" rowSpan={2}>DRAWING SIZE</th>
            <th className="border border-black p-1 w-24 font-semibold" rowSpan={2}>TOLERANCE</th>
            <th className="border border-black p-1 font-semibold" colSpan={colSpanForId}>COMPONENT IDENTIFICATION</th>
            <th className="border border-black p-1 w-24 font-semibold" rowSpan={2}>Inst. Used</th>
            <th className="border border-black p-1 w-12 font-semibold" rowSpan={2}>Inst. No</th>
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
          {activeProject.rows.map((row) => (
            <tr key={row.id}>
              <td className="border border-black p-1">{row.srNo}</td>
              <td className="border border-black p-1 whitespace-nowrap">
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
          {activeProject.rows.length === 0 && (
            <tr>
              <td colSpan={5 + colSpanForId} className="border border-black p-4 text-slate-400">
                No data available. Add rows in the editor.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Footer Section */}
      <div className="border border-black border-t-0 p-2 min-h-[60px]">
        Remarks : 
      </div>
      <div className="border border-black border-t-0 p-2 min-h-[40px]">
        Remarks(Designer) :
      </div>
      <div className="border border-black border-t-0 grid grid-cols-4 min-h-[80px]">
        <div className="border-r border-black p-2 flex flex-col justify-between">
          <span>Supplier:</span>
          <span className="font-bold self-center mt-2">XYZ & CO. LTD.</span>
        </div>
        <div className="border-r border-black p-2 flex flex-col justify-end text-center">
          <span>Inspected By</span>
        </div>
        <div className="border-r border-black p-2 flex flex-col justify-end text-center">
          <span>Verified By</span>
        </div>
        <div className="p-2 flex flex-col justify-end text-center">
          <span>Designer</span>
        </div>
      </div>

    </div>
  );
};
