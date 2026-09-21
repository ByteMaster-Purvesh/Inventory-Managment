import re

file_path = r'c:\Users\Purushottam\Desktop\VVrapIT-Freelance\2. PreciTech Works\Version\version 1\Frontend\src\features\editor\components\PreviewPane.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

components_code = """
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
      className={`${className} cursor-pointer hover:bg-orange-500/20 hover:outline hover:outline-1 hover:outline-orange-500 transition-all rounded`}
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
      className={`${className || ''} cursor-pointer hover:bg-orange-500/20 transition-colors`}
      onClick={handleClick}
    >
      {children}
    </tr>
  );
};
"""

if 'const InteractiveField' not in content:
    content = content.replace('export const PreviewPane = () => {', components_code + '\nexport const PreviewPane = () => {')

replacements = {
    '<div className="p-1">Project: <span className="font-bold">{activeProject.projectName}</span></div>': 
    '<InteractiveField tabName="Home" fieldId="input-field-projectName">Project: <span className="font-bold">{activeProject.projectName}</span></InteractiveField>',

    '<div className="p-1">Project no: {activeProject.projectNo}</div>':
    '<InteractiveField tabName="Home" fieldId="input-field-projectNo">Project no: {activeProject.projectNo}</InteractiveField>',

    '<div className="p-1">Production order no.: {activeProject.productionOrderNo}</div>':
    '<InteractiveField tabName="Home" fieldId="input-field-productionOrderNo">Production order no.: {activeProject.productionOrderNo}</InteractiveField>',

    '<div className="p-1">Customer: <span className="font-bold">{activeProject.customer}</span></div>':
    '<InteractiveField tabName="Home" fieldId="input-field-customer">Customer: <span className="font-bold">{activeProject.customer}</span></InteractiveField>',

    '<div className="p-1">Assly / sub-assly: {activeProject.asslySubAssly}</div>':
    '<InteractiveField tabName="Home" fieldId="input-field-asslySubAssly">Assly / sub-assly: {activeProject.asslySubAssly}</InteractiveField>',

    '<div className="p-1">Inspection stage: {activeProject.inspectionStage}</div>':
    '<InteractiveField tabName="Home" fieldId="input-field-inspectionStage">Inspection stage: {activeProject.inspectionStage}</InteractiveField>',

    '<div className="p-1">Raw material used: {activeProject.rawMaterialUsed}</div>':
    '<InteractiveField tabName="Home" fieldId="input-field-rawMaterialUsed">Raw material used: {activeProject.rawMaterialUsed}</InteractiveField>',

    '<div className="p-1">Raw mtrl. Idn/Ctrl. No: {activeProject.rawMtrlIdnCtrlNo}</div>':
    '<InteractiveField tabName="Home" fieldId="input-field-rawMtrlIdnCtrlNo">Raw mtrl. Idn/Ctrl. No: {activeProject.rawMtrlIdnCtrlNo}</InteractiveField>',

    '<div className="p-1">Raw mtrl. In Drg. {activeProject.rawMtrlInDrg}</div>':
    '<InteractiveField tabName="Home" fieldId="input-field-rawMtrlInDrg">Raw mtrl. In Drg. {activeProject.rawMtrlInDrg}</InteractiveField>',

    '<div className="p-1">R .V. no: {activeProject.rvNo}</div>':
    '<InteractiveField tabName="Home" fieldId="input-field-rvNo">R .V. no: {activeProject.rvNo}</InteractiveField>',

    '<div className="p-1">Date: {activeProject.date}</div>':
    '<InteractiveField tabName="Home" fieldId="input-field-date">Date: {activeProject.date}</InteractiveField>',

    '<div className="p-1">Components name: <span className="font-bold">{activeProject.componentsName}</span></div>':
    '<InteractiveField tabName="Home" fieldId="input-field-componentsName">Components name: <span className="font-bold">{activeProject.componentsName}</span></InteractiveField>',

    '<div className="p-1 px-2 whitespace-nowrap">Drg. No: {activeProject.drgNo}</div>':
    '<InteractiveField tabName="Home" fieldId="input-field-drgNo" className="p-1 px-2 whitespace-nowrap">Drg. No: {activeProject.drgNo}</InteractiveField>',

    '<div className="p-1 px-2 whitespace-nowrap">Rev No.: {activeProject.revNo}</div>':
    '<InteractiveField tabName="Home" fieldId="input-field-revNo" className="p-1 px-2 whitespace-nowrap">Rev No.: {activeProject.revNo}</InteractiveField>',

    '<div className="p-1 px-2">Drg. No: {activeProject.drgNo}</div>':
    '<InteractiveField tabName="Home" fieldId="input-field-drgNo" className="p-1 px-2">Drg. No: {activeProject.drgNo}</InteractiveField>',

    '<div className="p-1 px-2">Rev No.: {activeProject.revNo}</div>':
    '<InteractiveField tabName="Home" fieldId="input-field-revNo" className="p-1 px-2">Rev No.: {activeProject.revNo}</InteractiveField>',

    '<div className="p-1">Inspection report no: {activeProject.inspectionReportNo}</div>':
    '<InteractiveField tabName="Home" fieldId="input-field-inspectionReportNo">Inspection report no: {activeProject.inspectionReportNo}</InteractiveField>',

    '<div className="p-1">QA Plan No: {activeProject.qaPlanNo}</div>':
    '<InteractiveField tabName="Home" fieldId="input-field-qaPlanNo">QA Plan No: {activeProject.qaPlanNo}</InteractiveField>',

    '<div className="p-1">P. O. No: {activeProject.poNo}</div>':
    '<InteractiveField tabName="Home" fieldId="input-field-poNo">P. O. No: {activeProject.poNo}</InteractiveField>',

    '<div className="p-1">Quantity: {activeProject.quantity}</div>':
    '<InteractiveField tabName="Home" fieldId="input-field-quantity">Quantity: {activeProject.quantity}</InteractiveField>',

    '<div className="p-1">Identification nos.: {activeProject.identificationNos}</div>':
    '<InteractiveField tabName="Home" fieldId="input-field-identificationNos">Identification nos.: {activeProject.identificationNos}</InteractiveField>',

    '<div className="p-1">Supplier Name: {activeProject.supplierName || \'PRECITECH ENGINEERING WORKS\'}</div>':
    '<InteractiveField tabName="Home" fieldId="input-field-supplierName">Supplier Name: {activeProject.supplierName || \'PRECITECH ENGINEERING WORKS\'}</InteractiveField>',

    '<div className="p-1">Comp name: {activeProject.componentsName}</div>':
    '<InteractiveField tabName="Home" fieldId="input-field-componentsName">Comp name: {activeProject.componentsName}</InteractiveField>',
}

for old, new in replacements.items():
    content = content.replace(old, new)

# Row replace: `<tr key={row.id}>` -> `<InteractiveRow key={row.id} row={row}>`
content = content.replace('<tr key={row.id}>', '<InteractiveRow key={row.id} row={row}>')
# Carefully replace the closing tag for rows
content = content.replace('</tr>\\n                  ))}','</InteractiveRow>\\n                  ))}')
# And for the other occurrences
content = content.replace('</tr>\n                  ))}', '</InteractiveRow>\n                  ))}')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated PreviewPane.jsx')
