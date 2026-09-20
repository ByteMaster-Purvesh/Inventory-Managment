import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { checkIsOutOfTolerance } from '../../../../lib/calculations';

// Define styles for the PDF
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 9,
    fontFamily: 'Helvetica',
  },
  section: {
    marginBottom: 10,
  },
  borderBox: {
    border: '1pt solid #000',
  },
  row: {
    flexDirection: 'row',
  },
  borderBottom: {
    borderBottom: '1pt solid #000',
  },
  borderRight: {
    borderRight: '1pt solid #000',
  },
  p2: {
    padding: 4,
  },
  headerMain: {
    flexDirection: 'row',
    borderBottom: '1pt solid #000',
  },
  logoBox: {
    width: '33%',
    padding: 8,
    borderRight: '1pt solid #000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 16,
    fontWeight: 'bold',
    fontStyle: 'italic',
    color: '#1d4ed8', // approximation of blue-700
  },
  titleBox: {
    width: '67%',
    padding: 8,
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bold: {
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
  },
  
  // Table styles
  table: {
    width: '100%',
    border: '1pt solid #000',
    borderBottom: 0,
    borderRight: 0,
    marginTop: 10,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableColHeader: {
    borderBottom: '1pt solid #000',
    borderRight: '1pt solid #000',
    padding: 4,
    backgroundColor: '#f8fafc',
    textAlign: 'center',
    justifyContent: 'center',
  },
  tableCol: {
    borderBottom: '1pt solid #000',
    borderRight: '1pt solid #000',
    padding: 4,
    textAlign: 'center',
    justifyContent: 'center',
  },
  
  // Specific Column Widths
  colSrNo: { width: '8%' },
  colDrawing: { width: '22%' },
  colTol: { width: '12%' },
  colInst: { width: '12%' },
  colInstNo: { width: '10%' },
  
  // Footer
  footerRow: {
    borderBottom: '1pt solid #000',
    borderLeft: '1pt solid #000',
    borderRight: '1pt solid #000',
    padding: 4,
    minHeight: 40,
  },
  signatureBox: {
    flexDirection: 'row',
    borderBottom: '1pt solid #000',
    borderLeft: '1pt solid #000',
    borderRight: '1pt solid #000',
    minHeight: 60,
  },
  sigCol: {
    flex: 1,
    borderRight: '1pt solid #000',
    padding: 4,
    justifyContent: 'space-between',
  },
  sigColLast: {
    flex: 1,
    padding: 4,
    justifyContent: 'flex-end',
    alignItems: 'center',
  }
});

export const ReportPDF = ({ project }) => {
  if (!project) return null;

  const jobCount = project.rows[0]?.observations.length || 1;
  const obsWidth = `${36 / jobCount}%`; // Distribute remaining 36% width among observations

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        
        {/* Header Section */}
        <View style={styles.borderBox}>
          <View style={styles.headerMain}>
            <View style={styles.logoBox}>
              <Text style={styles.logoText}>Godrej AEROSPACE</Text>
            </View>
            <View style={styles.titleBox}>
              <Text style={styles.title}>INSPECTION REPORT</Text>
              <Text style={styles.bold}>Format No. QC16/FM/35</Text>
              <Text>Rev-01 & 11/10/2011</Text>
            </View>
          </View>

          <View style={[styles.row, styles.borderBottom]}>
            <View style={[{ width: '33%' }, styles.borderRight, styles.p2]}>
              <Text>Project: <Text style={styles.bold}>{project.projectName}</Text></Text>
            </View>
            <View style={[{ width: '33%' }, styles.borderRight, styles.p2]}>
              <Text>Project no: </Text>
            </View>
            <View style={[{ width: '34%', flexDirection: 'row', justifyContent: 'space-between' }, styles.p2]}>
              <Text>Date: {project.date}</Text>
              <Text>Page no.: 1 of 1</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={[{ width: '33%' }, styles.borderRight, styles.p2]}>
              <Text>Customer: <Text style={styles.bold}>{project.customer}</Text></Text>
            </View>
            <View style={[{ width: '67%', flexDirection: 'row', justifyContent: 'space-between' }, styles.p2]}>
              <Text>Components name: <Text style={styles.bold}>{project.componentsName}</Text></Text>
              <Text>Rev No.: 0</Text>
            </View>
          </View>
        </View>

        {/* Main Table */}
        <View style={styles.table}>
          {/* Table Header Row 1 */}
          <View style={styles.tableRow}>
            <View style={[styles.tableColHeader, styles.colSrNo]}><Text>SR. NO.</Text></View>
            <View style={[styles.tableColHeader, styles.colDrawing]}><Text>DRAWING SIZE</Text></View>
            <View style={[styles.tableColHeader, styles.colTol]}><Text>TOLERANCE</Text></View>
            <View style={[styles.tableColHeader, { width: '36%' }]}><Text>COMPONENT IDENTIFICATION</Text></View>
            <View style={[styles.tableColHeader, styles.colInst]}><Text>Inst. Used</Text></View>
            <View style={[styles.tableColHeader, styles.colInstNo]}><Text>Inst. No</Text></View>
          </View>

          {/* Table Header Row 2 (Jobs) */}
          <View style={styles.tableRow}>
            <View style={[styles.tableColHeader, styles.colSrNo]}><Text></Text></View>
            <View style={[styles.tableColHeader, styles.colDrawing]}><Text></Text></View>
            <View style={[styles.tableColHeader, styles.colTol]}><Text></Text></View>
            {/* Render job headers */}
            {Array.from({ length: jobCount }).map((_, i) => (
              <View key={`job-head-${i}`} style={[styles.tableColHeader, { width: obsWidth }]}>
                <Text>0{i + 1}</Text>
              </View>
            ))}
            <View style={[styles.tableColHeader, styles.colInst]}><Text></Text></View>
            <View style={[styles.tableColHeader, styles.colInstNo]}><Text></Text></View>
          </View>

          {/* Table Body */}
          {project.rows.map((row) => (
            <View key={row.id} style={styles.tableRow}>
              <View style={[styles.tableCol, styles.colSrNo]}><Text>{row.srNo}</Text></View>
              <View style={[styles.tableCol, styles.colDrawing]}><Text>{row.drawingSize}</Text></View>
              <View style={[styles.tableCol, styles.colTol]}><Text>{row.calculatedTolerance !== '-' ? row.calculatedTolerance : row.toleranceVal || '-'}</Text></View>
              
              {/* Observations */}
              {row.observations.map((obs, idx) => {
                const isOutOfTol = checkIsOutOfTolerance(row.calculatedTolerance, obs);
                return (
                  <View key={`obs-${row.id}-${idx}`} style={[styles.tableCol, { width: obsWidth }]}>
                    <Text style={isOutOfTol ? styles.bold : {}}>{obs || '-'}</Text>
                  </View>
                );
              })}
              
              <View style={[styles.tableCol, styles.colInst]}><Text>{row.instrument || '-'}</Text></View>
              <View style={[styles.tableCol, styles.colInstNo]}><Text>{row.instrumentNo || ''}</Text></View>
            </View>
          ))}
          
          {project.rows.length === 0 && (
            <View style={styles.tableRow}>
              <View style={[styles.tableCol, { width: '100%' }]}><Text>No data available.</Text></View>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={[styles.footerRow, { marginTop: -1, borderTop: 0 }]}>
          <Text>Remarks : </Text>
        </View>
        <View style={styles.footerRow}>
          <Text>Remarks(Designer) :</Text>
        </View>
        
        <View style={styles.signatureBox}>
          <View style={styles.sigCol}>
            <Text>Supplier:</Text>
            <Text style={[styles.bold, { alignSelf: 'center', marginTop: 10 }]}>XYZ & CO. LTD.</Text>
          </View>
          <View style={[styles.sigCol, { alignItems: 'center', justifyContent: 'flex-end' }]}>
            <Text>Inspected By</Text>
          </View>
          <View style={[styles.sigCol, { alignItems: 'center', justifyContent: 'flex-end' }]}>
            <Text>Verified By</Text>
          </View>
          <View style={styles.sigColLast}>
            <Text>Designer</Text>
          </View>
        </View>

      </Page>
    </Document>
  );
};
