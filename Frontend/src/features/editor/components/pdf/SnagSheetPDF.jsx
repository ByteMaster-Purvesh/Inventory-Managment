import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { checkIsOutOfTolerance, formatDimension } from '../../../../lib/calculations';

const styles = StyleSheet.create({
  page: {
    padding: 18,
    fontSize: 9,
    fontFamily: 'Helvetica',
    flexDirection: 'column',
  },
  row: { flexDirection: 'row' },
  tableRow: { flexDirection: 'row', height: 20 },
  col: { flexDirection: 'column' },
  border: { border: '1pt solid #000' },
  borderB: { borderBottom: '1pt solid #000' },
  borderR: { borderRight: '1pt solid #000' },
  borderL: { borderLeft: '1pt solid #000' },
  p1: { padding: 3 },
  bold: { fontWeight: 'bold', fontFamily: 'Helvetica-Bold' },
  italic: { fontStyle: 'italic' },
  textCenter: { textAlign: 'center' },
  exceedingValue: { fontWeight: 'bold', fontFamily: 'Helvetica-Bold', color: 'red', textDecoration: 'underline' },
  
  // Table
  table: {
    width: '100%',
    borderLeft: '1pt solid #000',
    borderTop: '1pt solid #000',
    marginTop: 2,
  },
  th: {
    borderBottom: '1pt solid #000',
    borderRight: '1pt solid #000',
    padding: 3,
    backgroundColor: '#f8fafc',
    textAlign: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
  },
  td: {
    borderBottom: '1pt solid #000',
    borderRight: '1pt solid #000',
    padding: 3,
    textAlign: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  compHeader: {
    borderBottom: '1pt solid #000',
    borderRight: '1pt solid #000',
    padding: 3,
    backgroundColor: '#fff7ed', // slight orange tint
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
  },

  // Specific Columns
  colSrNo: { width: '8%' },
  colDrawing: { width: '26%' },
  colTol: { width: '16%' },
  colInst: { width: '16%' },
  colInstNo: { width: '10%' },
});

export const SnagSheetPDF = ({ activeProject, allProjects }) => {
  if (!activeProject || !allProjects) return null;

  // Scale pixels (from UI) to pt (for PDF)
  const scale = (val) => (val || 0) * 0.6691;

  // Find all components in the same project group
  const projectComponents = allProjects.filter(p => p.projectName === activeProject.projectName);

  const settings = activeProject.settings || { fontFamily: 'Helvetica', fontSize: 9 };
  const FIRST_PAGE_ROWS = 22;
  const OTHER_PAGE_ROWS = 27;

  // We will build a unified list of rows to render.
  // A row can be a "component_header" or a "data_row".
  const unifiedRows = [];
  
  projectComponents.forEach(comp => {
    const outOfTolRows = comp.rows.filter(row => 
      (row.drawingSize || row.toleranceVal || row.instrument || row.places) &&
      row.observations.some(obs => checkIsOutOfTolerance(row.calculatedTolerance, obs))
    );

    if (outOfTolRows.length > 0) {
      outOfTolRows.forEach((r, idx) => {
        unifiedRows.push({
          type: 'data_row',
          ...r,
          isFirstOfComponent: idx === 0,
          componentName: comp.componentsName || 'Untitled Component',
          jobCount: r.observations.length
        });
      });
    }
  });

  const pages = [];
  let currentIndex = 0;
  
  if (unifiedRows.length > 0) {
    pages.push(unifiedRows.slice(currentIndex, currentIndex + FIRST_PAGE_ROWS));
    currentIndex += FIRST_PAGE_ROWS;
  }
  
  while (currentIndex < unifiedRows.length) {
    pages.push(unifiedRows.slice(currentIndex, currentIndex + OTHER_PAGE_ROWS));
    currentIndex += OTHER_PAGE_ROWS;
  }
  
  if (pages.length === 0) pages.push([]);

  // Base PDF on activeProject for headers/footers
  const project = activeProject; 

  return (
    <Document>
      {pages.map((pageRows, pageIndex) => (
        <Page key={pageIndex} size="A4" orientation="portrait" style={styles.page}>
            {/* Header */}
            <View style={[styles.border, { marginBottom: 2, fontSize: 10, fontWeight: 'bold', fontFamily: 'Helvetica-Bold' }]}>
               <View style={[styles.borderB, styles.p1, { justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={{ fontSize: 12 }}>Supplier Name : {project.supplierName || 'PRECITECH ENGINEERING WORKS'}</Text>
               </View>
               <View style={[styles.row, styles.borderB]}>
                  <View style={[{ width: '75%', justifyContent: 'center', alignItems: 'center' }, styles.borderR, styles.p1]}>
                     <Text>SNAG SHEET</Text>
                  </View>
                  <View style={[{ width: '25%' }, styles.p1]}>
                     <Text>Page no. {pageIndex + 1} of {pages.length}</Text>
                  </View>
               </View>
               <View style={[styles.row, styles.borderB]}>
                  <View style={[{ width: '50%' }, styles.borderR, styles.p1]}>
                     <Text>Drawing no. :- {project.drgNo}</Text>
                  </View>
                  <View style={[{ width: '50%' }, styles.p1]}>
                     <Text>Snag sheet no. :- {project.snagSheetNo || 'PEW-269'} Date:- {project.date}</Text>
                  </View>
               </View>
               <View style={[styles.row, styles.borderB]}>
                  <View style={[{ width: '50%' }, styles.borderR, styles.p1]}>
                     <Text>Tool Description :- {project.toolDescription || 'WELDING FIXTURE'}</Text>
                  </View>
                  <View style={[{ width: '50%' }, styles.p1]}>
                     <Text>Project :- {project.projectName}</Text>
                  </View>
               </View>
               <View style={styles.row}>
                  <View style={[{ width: '50%' }, styles.borderR, styles.p1]}>
                     <Text>Item code no. :- {project.itemCodeNo || ''}</Text>
                  </View>
                  <View style={[{ width: '50%' }, styles.p1]}>
                     <Text>PO no. :- {project.poNo}</Text>
                  </View>
               </View>
            </View>

          {/* Table */}
          <View style={styles.table}>
            {/* Header */}
            <View style={styles.row}>
              <View style={[styles.th, { width: '25%' }]}><Text>Description & Item no.</Text></View>
              <View style={[styles.th, { width: '10%' }]}><Text>Ballon{"\n"}no.</Text></View>
              <View style={[styles.th, { width: '20%' }]}><Text>Dimension with{"\n"}tolerance</Text></View>
              <View style={[styles.th, { width: '20%' }]}><Text>Observed dimension</Text></View>
              <View style={[styles.th, { width: '25%' }]}><Text>Remarks / Recommendations By Godrej Design</Text></View>
            </View>

            {/* Rows */}
            {pageRows.length === 0 ? (
               <View style={styles.tableRow}>
                 <View style={[styles.td, { width: '100%' }]}><Text>No snags found in this project.</Text></View>
               </View>
            ) : pageRows.map(row => (
                <View key={row.id} style={styles.tableRow}>
                  <View style={[styles.td, { width: '25%', textAlign: 'left', paddingLeft: 6 }]}><Text>{row.isFirstOfComponent ? row.componentName : ''}</Text></View>
                  <View style={[styles.td, { width: '10%' }]}><Text>{row.srNo}</Text></View>
                  <View style={[styles.td, { width: '20%' }]}><Text>{formatDimension(row, true)}</Text></View>
                  <View style={[styles.td, { width: '20%' }]}><Text>{row.observations.filter(o => o !== undefined && o !== '' && checkIsOutOfTolerance(row.calculatedTolerance, o)).join(' / ')}</Text></View>
                  <View style={[styles.td, { width: '25%' }]}><Text></Text></View>
                </View>
            ))}

            {/* Empty Rows Padding */}
            {Array.from({ length: Math.max(0, (pageIndex === 0 ? FIRST_PAGE_ROWS : OTHER_PAGE_ROWS) - pageRows.length) }).map((_, i) => (
              <View key={`empty-${i}`} style={styles.tableRow}>
                <View style={[styles.td, { width: '25%' }]}><Text>{"\u00A0"}</Text></View>
                <View style={[styles.td, { width: '10%' }]}><Text>{"\u00A0"}</Text></View>
                <View style={[styles.td, { width: '20%' }]}><Text>{"\u00A0"}</Text></View>
                <View style={[styles.td, { width: '20%' }]}><Text>{"\u00A0"}</Text></View>
                <View style={[styles.td, { width: '25%' }]}><Text>{"\u00A0"}</Text></View>
              </View>
            ))}
          </View>

          {/* Footer */}
          <View wrap={false} style={[styles.row, { marginTop: 24, paddingHorizontal: 12, fontSize: 10, fontWeight: 'bold', fontFamily: 'Helvetica-Bold' }]}>
            <View style={{ width: '33.33%', alignItems: 'center', justifyContent: 'flex-end', minHeight: 60 }}>
              {project.snagSupplierStampUrl && (
                <Image src={project.snagSupplierStampUrl} style={{ width: scale(settings.snagSupplierStampTransform?.width || 120), height: scale(settings.snagSupplierStampTransform?.height || 80), marginBottom: 8 }} />
              )}
              <Text>Sign & Stamp of Supplier</Text>
            </View>
            <View style={{ width: '33.33%', alignItems: 'center', justifyContent: 'flex-end', minHeight: 60 }}>
              {project.snagGodrejQcStampUrl && (
                <Image src={project.snagGodrejQcStampUrl} style={{ width: scale(settings.snagGodrejQcStampTransform?.width || 120), height: scale(settings.snagGodrejQcStampTransform?.height || 80), marginBottom: 8 }} />
              )}
              <Text>Sign of Godrej QC</Text>
            </View>
            <View style={{ width: '33.33%', alignItems: 'center', justifyContent: 'flex-end', minHeight: 60 }}>
              {project.snagGodrejDesignStampUrl && (
                <Image src={project.snagGodrejDesignStampUrl} style={{ width: scale(settings.snagGodrejDesignStampTransform?.width || 120), height: scale(settings.snagGodrejDesignStampTransform?.height || 80), marginBottom: 8 }} />
              )}
              <Text>Sign of Godrej Design</Text>
            </View>
          </View>
        </Page>
      ))}


    </Document>
  );
};
