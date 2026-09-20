export const calculateTolerance = (drawingSize, toleranceVal) => {
  if (!drawingSize || !toleranceVal) return '-';

  // Extract base numeric value from drawing size (e.g. if it has 'Φ' or other text before it)
  // Let's assume for now drawingSize is mostly numeric for calculation purposes,
  // or we strip out non-numeric leading chars.
  const baseValMatch = drawingSize.match(/[-+]?[0-9]*\.?[0-9]+/);
  if (!baseValMatch) return '-';

  const base = parseFloat(baseValMatch[0]);
  const tol = parseFloat(toleranceVal);

  if (isNaN(base) || isNaN(tol)) return '-';

  let min, max;

  if (drawingSize.includes('±')) {
    min = base - tol;
    max = base + tol;
    return `${min.toFixed(3)}/${max.toFixed(3)}`;
  } else if (drawingSize.includes('%')) {
    const percentage = (base * tol) / 100;
    min = base - percentage;
    max = base + percentage;
    return `${min.toFixed(3)}/${max.toFixed(3)}`;
  } else if (drawingSize.includes('+') && !drawingSize.includes('±')) {
    min = base;
    max = base + tol;
    return `${min.toFixed(3)}/${max.toFixed(3)}`;
  } else if (drawingSize.includes('-') && !drawingSize.includes('±') && base > 0) {
    min = base - tol;
    max = base;
    return `${min.toFixed(3)}/${max.toFixed(3)}`;
  }
  
  // Default to symmetric if no symbol is found but a tolerance is provided
  min = base - tol;
  max = base + tol;
  return `${min.toFixed(3)}/${max.toFixed(3)}`;
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
