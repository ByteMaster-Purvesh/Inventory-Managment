export const calculateTolerance = (drawingSize, toleranceVal, drawingSizeSymbol, toleranceVal2, drawingSizeSymbol2) => {
  if (!drawingSize) return '-';

  // Extract base numeric value from drawing size (e.g. if it has 'Φ' or other text before it)
  // Let's assume for now drawingSize is mostly numeric for calculation purposes,
  // or we strip out non-numeric leading chars.
  const baseValMatch = drawingSize.match(/[-+]?[0-9]*\.?[0-9]+/);
  if (!baseValMatch) return '-';

  const base = parseFloat(baseValMatch[0]);
  const formatVal = (val) => parseFloat(val.toFixed(3));

  let min, max;

  // Handle second tolerance if provided
  if (toleranceVal && toleranceVal2) {
    const t1 = parseFloat(toleranceVal);
    const t2 = parseFloat(toleranceVal2);
    if (isNaN(t1) || isNaN(t2)) return '-';

    let v1 = base;
    if (drawingSizeSymbol === '+') v1 = base + t1;
    else if (drawingSizeSymbol === '-') v1 = base - t1;
    else if (drawingSizeSymbol === '±') v1 = base + t1;
    else v1 = base + t1;
    
    let v2 = base;
    if (drawingSizeSymbol2 === '+') v2 = base + t2;
    else if (drawingSizeSymbol2 === '-') v2 = base - t2;
    else if (drawingSizeSymbol2 === '±') v2 = base + t2;
    else v2 = base + t2;

    min = Math.min(v1, v2);
    max = Math.max(v1, v2);
    return `${formatVal(min)}/${formatVal(max)}`;
  }

  // Handle comma-separated tolerance values (e.g., "-0.005,-0.014")
  if (typeof toleranceVal === 'string' && toleranceVal.includes(',')) {
    const parts = toleranceVal.split(',').map(v => parseFloat(v.trim()));
    if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      const val1 = base + parts[0];
      const val2 = base + parts[1];
      min = Math.min(val1, val2);
      max = Math.max(val1, val2);
      return `${formatVal(min)}/${formatVal(max)}`;
    }
  }

  if (!toleranceVal) return '-';
  const tol = parseFloat(toleranceVal);

  if (isNaN(base) || isNaN(tol)) return '-';

  const symbol = drawingSizeSymbol || '';

  if (symbol.includes('±')) {
    min = base - tol;
    max = base + tol;
    return `${formatVal(min)}/${formatVal(max)}`;
  } else if (symbol.includes('%')) {
    const percentage = (base * tol) / 100;
    min = base - percentage;
    max = base + percentage;
    return `${formatVal(min)}/${formatVal(max)}`;
  } else if (symbol.includes('+-')) {
    min = base - tol;
    max = base + tol;
    return `${formatVal(min)}/${formatVal(max)}`;
  } else if (symbol.includes('+')) {
    min = base;
    max = base + tol;
    return `${formatVal(min)}/${formatVal(max)}`;
  } else if (symbol.includes('-') && base > 0) {
    min = base - tol;
    max = base;
    return `${formatVal(min)}/${formatVal(max)}`;
  }
  
  // Default to symmetric if no symbol is found but a tolerance is provided
  min = base - tol;
  max = base + tol;
  return `${formatVal(min)}/${formatVal(max)}`;
};

export const checkIsOutOfTolerance = (calculatedTolerance, observation) => {
  if (!calculatedTolerance || calculatedTolerance === '-' || !observation) return false;
  const parts = calculatedTolerance.split('/');
  if (parts.length !== 2) return false;

  const min = parseFloat(parts[0]);
  const max = parseFloat(parts[1]);
  const obs = parseFloat(observation);

  if (isNaN(min) || isNaN(max) || isNaN(obs)) return false;

  return obs < min || obs > max;
};

export const formatDimension = (row) => {
  const drawingSize = row.drawingSize || '';
  
  let sizePart = drawingSize;
  let keywordPart = '';
  
  const KNOWN_KEYWORDS = ['TYPE', 'TYP.', 'TYP', 'PCD', 'MAX.', 'MAX', 'MIN.', 'MIN', 'REF.', 'REF', 'BSC', 'BASIC'];
  const upperSize = drawingSize.toUpperCase();
  
  for (const kw of KNOWN_KEYWORDS) {
    if (upperSize.endsWith(' ' + kw)) {
       sizePart = drawingSize.substring(0, drawingSize.length - kw.length - 1).trim();
       keywordPart = drawingSize.substring(drawingSize.length - kw.length);
       break;
    }
  }

  let result = '';
  
  if (row.places) {
    result += `${row.places} X `;
  }
  
  result += sizePart;

  if (row.drawingSizeSymbol) {
    result += ` ${row.drawingSizeSymbol}`;
  }

  if (row.toleranceVal) {
    result += ` ${row.toleranceVal}`;
  }
  
  if (row.drawingSizeSymbol2 || row.toleranceVal2) {
    result += ` ${row.drawingSizeSymbol2 || ''} ${row.toleranceVal2 || ''}`.trimEnd();
  }

  if (keywordPart) {
    result += ` ${keywordPart}`;
  }

  return result.trim().replace(/\s+/g, ' ');
};
