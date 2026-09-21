import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { checkIsOutOfTolerance } from '../../../../lib/calculations';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 9,
    fontFamily: 'Helvetica',
    flexDirection: 'column',
  },
  row: { flexDirection: 'row' },
  col: { flexDirection: 'column' },
  border: { border: '1pt solid #000' },
  borderB: { borderBottom: '1pt solid #000' },
  borderR: { borderRight: '1pt solid #000' },
  borderL: { borderLeft: '1pt solid #000' },
  p1: { padding: 4 },
  bold: { fontWeight: 'bold', fontFamily: 'Helvetica-Bold' },
  italic: { fontStyle: 'italic' },
  textCenter: { textAlign: 'center' },
  
  // Table
  table: {
    width: '100%',
    borderLeft: '1pt solid #000',
    borderTop: '1pt solid #000',
    marginTop: 4,
    flexGrow: 1, // Let table fill space
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
  },

  // Specific Columns
  colSrNo: { width: '8%' },
  colDrawing: { width: '26%' },
  colTol: { width: '16%' },
  colInst: { width: '16%' },
  colInstNo: { width: '10%' },
});

export const ReportPDF = ({ project }) => {
  if (!project) return null;

  // Scale pixels (from UI) to pt (for PDF)
  // Assuming UI width is 794px and PDF A4 width is 595.28pt. Ratio is ~0.75
  const scale = (val) => (val || 0) * 0.75;

  const jobCount = project.rows[0]?.observations.length || 1;
  const obsWidth = `${24 / jobCount}%`; 

  const settings = project.settings || { fontFamily: 'Helvetica', fontSize: 9 };
  const ROWS_PER_PAGE = 30;
  
  const pages = [];
  for (let i = 0; i < project.rows.length; i += ROWS_PER_PAGE) {
    pages.push(project.rows.slice(i, i + ROWS_PER_PAGE));
  }
  if (pages.length === 0) pages.push([]);

  return (
    <Document>
      {pages.map((pageRows, pageIndex) => (
        <Page key={pageIndex} size="A4" orientation="portrait" style={styles.page}>
          
          {/* Header */}
          <View style={[styles.border, { marginBottom: 2, fontSize: 8 }]}>
            {pageIndex === 0 ? (
              // Dense Header
              <View style={styles.col}>
                {/* Row 1: Logo & Title */}
                <View style={[styles.row, styles.borderB]}>
                  <View style={[{ width: '33%', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }, styles.borderR, styles.p1]}>
                    {settings.logoUrl ? (
                      <Image 
                        src={settings.logoUrl} 
                        style={{ 
                          position: 'absolute',
                          left: scale(settings.logoTransform?.x),
                          top: scale(settings.logoTransform?.y),
                          width: scale(settings.logoTransform?.width || 150),
                          height: scale(settings.logoTransform?.height || 48),
                          objectFit: 'contain' 
                        }} 
                      />
                    ) : (
                      <Text style={[styles.bold, styles.italic, { color: '#1d4ed8', fontSize: 14 }]}>Godrej AEROSPACE</Text>
                    )}
                  </View>
                  <View style={[{ width: '67%', justifyContent: 'center', paddingLeft: 30 }, styles.p1]}>
                    <Text style={[styles.bold, { fontSize: 14, letterSpacing: 1 }]}>INSPECTION REPORT</Text>
                    <Text style={{ fontSize: 9, fontWeight: 'bold' }}>Format No.QC16/FM/35</Text>
                    <Text style={{ fontSize: 9 }}>Rev-01 & 11/10/2011</Text>
                  </View>
                </View>
                
                {/* Grid */}
                <View style={styles.row}>
                  {/* Left Col */}
                  <View style={[{ width: '50%' }, styles.col, styles.borderR]}>
                    <View style={[styles.row, styles.borderB]}>
                      <View style={[{ width: '65%' }, styles.borderR, styles.p1]}><Text>Project: <Text style={styles.bold}>{project.projectName}</Text></Text></View>
                      <View style={[{ width: '35%' }, styles.p1]}><Text>Project no: {project.projectNo}</Text></View>
                    </View>
                    <View style={[styles.borderB, styles.p1]}><Text>Production order no.: {project.productionOrderNo}</Text></View>
                    <View style={[styles.borderB, styles.p1]}><Text>Customer: <Text style={styles.bold}>{project.customer}</Text></Text></View>
                    <View style={[styles.borderB, styles.p1]}><Text>Assly / sub-assly: {project.asslySubAssly}</Text></View>
                    <View style={[styles.borderB, styles.p1]}><Text>Inspection stage: {project.inspectionStage}</Text></View>
                    <View style={[styles.borderB, styles.p1]}><Text>Raw material used: {project.rawMaterialUsed}</Text></View>
                    <View style={[styles.borderB, styles.p1]}><Text>Raw mtrl. Idn/Ctrl. No: {project.rawMtrlIdnCtrlNo}</Text></View>
                    <View style={[styles.borderB, styles.p1]}><Text>Raw mtrl. In Drg. {project.rawMtrlInDrg}</Text></View>
                    <View style={styles.p1}><Text>R .V. no: {project.rvNo}</Text></View>
                  </View>
                  
                  {/* Right Col */}
                  <View style={[{ width: '50%' }, styles.col]}>
                    <View style={[styles.row, styles.borderB]}>
                      <View style={[{ width: '50%' }, styles.borderR, styles.p1]}><Text>Date: {project.date}</Text></View>
                      <View style={[{ width: '50%' }, styles.p1]}><Text>Page no.: {pageIndex + 1} of {pages.length}</Text></View>
                    </View>
                    <View style={[styles.borderB, styles.p1]}><Text>Components name: <Text style={styles.bold}>{project.componentsName}</Text></Text></View>
                    <View style={[styles.row, styles.borderB]}>
                      <View style={[{ width: '65%' }, styles.borderR, styles.p1]}><Text>Drg. No: {project.drgNo}</Text></View>
                      <View style={[{ width: '35%' }, styles.p1]}><Text>Rev No.: {project.revNo}</Text></View>
                    </View>
                    <View style={[styles.borderB, styles.p1]}><Text>Inspection report no: {project.inspectionReportNo}</Text></View>
                    <View style={[styles.borderB, styles.p1]}><Text>QA Plan No: {project.qaPlanNo}</Text></View>
                    <View style={[styles.borderB, styles.p1]}><Text>P. O. No: {project.poNo}</Text></View>
                    <View style={[styles.borderB, styles.p1]}><Text>Quantity: {project.quantity}</Text></View>
                    <View style={[styles.borderB, styles.p1]}><Text>Identification nos.: {project.identificationNos}</Text></View>
                    <View style={styles.p1}><Text>Supplier Name: {project.supplierName || 'PRECITECH ENGINEERING WORKS'}</Text></View>
                  </View>
                </View>
              </View>
            ) : (
              // Simple Header
              <View style={styles.col}>
                {/* Row 1: Logo & Title */}
                <View style={[styles.row, styles.borderB]}>
                  <View style={[{ width: '33%', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }, styles.borderR, styles.p1]}>
                    {settings.logoUrl ? (
                      <Image 
                        src={settings.logoUrl} 
                        style={{ 
                          position: 'absolute',
                          left: scale(settings.logoTransform?.x),
                          top: scale(settings.logoTransform?.y),
                          width: scale(settings.logoTransform?.width || 150),
                          height: scale(settings.logoTransform?.height || 48),
                          objectFit: 'contain' 
                        }} 
                      />
                    ) : (
                      <Text style={[styles.bold, styles.italic, { color: '#1d4ed8', fontSize: 14 }]}>Godrej AEROSPACE</Text>
                    )}
                  </View>
                  <View style={[{ width: '67%', justifyContent: 'center', paddingLeft: 30 }, styles.p1]}>
                    <Text style={[styles.bold, { fontSize: 14, letterSpacing: 1 }]}>INSPECTION REPORT</Text>
                    <Text style={[styles.italic, { fontSize: 9 }]}>Common continuation sheet</Text>
                  </View>
                </View>
                {/* Sub row */}
                <View style={[styles.row, styles.borderB]}>
                  <View style={[{ width: '33%' }, styles.borderR, styles.p1]}><Text>Project: <Text style={styles.bold}>{project.projectName}</Text></Text></View>
                  <View style={[{ width: '33%' }, styles.borderR, styles.p1]}><Text>Date: {project.date}</Text></View>
                  <View style={[{ width: '34%' }, styles.p1]}><Text>Page no.: {pageIndex + 1} of {pages.length}</Text></View>
                </View>
                <View style={styles.row}>
                  <View style={[{ width: '50%' }, styles.borderR, styles.p1]}><Text>Comp name: {project.componentsName}</Text></View>
                  <View style={[{ width: '25%' }, styles.borderR, styles.p1]}><Text>Drg. No: {project.drgNo}</Text></View>
                  <View style={[{ width: '25%' }, styles.p1]}><Text>Rev No.: {project.revNo}</Text></View>
                </View>
              </View>
            )}
          </View>

          {/* Table */}
          <View style={styles.table}>
            {/* Header */}
            <View style={styles.row}>
              <View style={[styles.th, styles.colSrNo]}><Text>SR. NO.</Text></View>
              <View style={[styles.th, styles.colDrawing]}><Text>DRAWING SIZE</Text></View>
              <View style={[styles.th, styles.colTol]}><Text>TOLERANCE</Text></View>
              <View style={[styles.col, { width: '24%' }]}>
                <View style={[styles.th, { width: '100%', borderRight: 0 }]}><Text>COMPONENT IDENTIFICATION</Text></View>
                <View style={styles.row}>
                  {Array.from({ length: jobCount }).map((_, i) => (
                    <View key={`job-${i}`} style={[styles.th, { width: `${100 / jobCount}%`, borderBottom: 0, borderRight: i === jobCount - 1 ? 0 : '1pt solid #000' }]}>
                      <Text>0{i + 1}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View style={[styles.th, styles.borderL, styles.colInst]}><Text>Inst. Used</Text></View>
              <View style={[styles.th, styles.colInstNo]}><Text>Inst. No</Text></View>
            </View>

            {/* Rows */}
            {pageRows.map(row => (
              <View key={row.id} style={styles.row}>
                <View style={[styles.td, styles.colSrNo]}><Text>{row.srNo}</Text></View>
                <View style={[styles.td, styles.colDrawing]}><Text>{row.drawingSizeSymbol} {row.drawingSize}</Text></View>
                <View style={[styles.td, styles.colTol]}><Text>{row.calculatedTolerance !== '-' ? row.calculatedTolerance : row.toleranceVal || '-'}</Text></View>
                {row.observations.map((obs, idx) => {
                  const isOutOfTol = checkIsOutOfTolerance(row.calculatedTolerance, obs);
                  return (
                    <View key={`obs-${idx}`} style={[styles.td, { width: obsWidth }]}>
                      <Text style={isOutOfTol ? styles.bold : {}}>{obs || '-'}</Text>
                    </View>
                  );
                })}
                <View style={[styles.td, styles.colInst]}><Text>{row.instrument || '-'}</Text></View>
                <View style={[styles.td, styles.colInstNo]}><Text>{row.instrumentNo || ''}</Text></View>
              </View>
            ))}

            {/* Empty Rows Padding */}
            {Array.from({ length: Math.max(0, ROWS_PER_PAGE - pageRows.length) }).map((_, i) => (
              <View key={`empty-${i}`} style={styles.row}>
                <View style={[styles.td, styles.colSrNo, { height: 20 }]}><Text></Text></View>
                <View style={[styles.td, styles.colDrawing]}><Text></Text></View>
                <View style={[styles.td, styles.colTol]}><Text></Text></View>
                {Array.from({ length: jobCount }).map((_, j) => (
                  <View key={`empty-obs-${j}`} style={[styles.td, { width: obsWidth }]}><Text></Text></View>
                ))}
                <View style={[styles.td, styles.colInst]}><Text></Text></View>
                <View style={[styles.td, styles.colInstNo]}><Text></Text></View>
              </View>
            ))}
          </View>

          {/* Footer */}
          <View style={[styles.col, styles.border, { borderTop: 0, fontSize: 8 }]}>
            <View style={[styles.borderB, styles.p1, { minHeight: 25 }]}><Text>Remarks : {project.remarks}</Text></View>
            <View style={[styles.borderB, styles.p1, { minHeight: 25 }]}><Text>Remarks(Designer) : {project.designerRemarks}</Text></View>
            <View style={[styles.row, { height: 75 }]}>
              {/* Column 1 */}
              <View style={[{ flex: 1.2, overflow: 'hidden', position: 'relative' }, styles.borderR, styles.col]}>
                <View style={[styles.borderB, styles.p1, { justifyContent: 'center', height: 22 }]}>
                  <Text style={styles.bold}>Supplier:</Text>
                </View>
                <View style={{ flex: 1, justifyContent: 'flex-end', paddingBottom: 4 }}>
                {project.supplierStampUrl && (
                   <Image 
                     src={project.supplierStampUrl} 
                     style={{ 
                       position: 'absolute', 
                       left: scale(settings.stampTransform?.x),
                       top: scale(settings.stampTransform?.y),
                       width: scale(settings.stampTransform?.width || 120),
                       height: scale(settings.stampTransform?.height || 120),
                       opacity: 0.8,
                       zIndex: 10
                     }} 
                   />
                )}
                  <View style={[styles.row, styles.p1, { justifyContent: 'space-between', paddingHorizontal: 15 }]}>
                    <Text style={styles.bold}>Inspected By</Text>
                    <Text style={styles.bold}>Verified By</Text>
                  </View>
                </View>
              </View>
              {/* Column 2 & 3 wrapper */}
              <View style={[{ flex: 3.8 }, styles.col]}>
                {/* Top row of col 2 & 3 */}
                <View style={[styles.borderB, styles.p1, { justifyContent: 'center', alignItems: 'center', height: 22 }]}>
                  <Text style={styles.bold}>GODREJ & BOYCE MFG. CO. LTD.</Text>
                </View>
                {/* Bottom row of col 2 & 3 */}
                <View style={[styles.row, { flex: 1, position: 'relative' }]}>
                  {project.godrejStampUrl && (
                    <Image 
                      src={project.godrejStampUrl} 
                      style={{ 
                        position: 'absolute', 
                        left: scale(settings.godrejStampTransform?.x),
                        top: scale(settings.godrejStampTransform?.y),
                        width: scale(settings.godrejStampTransform?.width || 120),
                        height: scale(settings.godrejStampTransform?.height || 120),
                        opacity: 0.8,
                        zIndex: 10
                      }} 
                    />
                  )}
                  <View style={[{ flex: 2.8 }, styles.borderR, styles.col]}>
                    <View style={[{ flex: 1 }]}></View>
                    <View style={[styles.row, styles.p1, { justifyContent: 'space-between', paddingHorizontal: 15 }]}>
                      <Text style={styles.bold}>Inspected By</Text>
                      <Text style={styles.bold}>Verified By</Text>
                    </View>
                  </View>
                  <View style={[{ flex: 1 }, styles.col]}>
                    <View style={[{ flex: 1 }]}></View>
                    <View style={[styles.p1, { alignItems: 'center' }]}>
                      <Text style={styles.bold}>Designer</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </Page>
      ))}
    </Document>
  );
};
