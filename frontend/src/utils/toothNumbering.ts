export type NumberingSystem = 'fdi' | 'universal' | 'palmer';

// Internal canonical format is always FDI string (e.g. "11"-"48")
export interface ToothMapping {
  fdi: string;
  universal: string;
  palmer: string;
  name: string;
}

// Complete map of 32 permanent teeth
export const TOOTH_MAP: ToothMapping[] = [
  // Upper Right Quadrant (Q1)
  { fdi: '18', universal: '1', palmer: 'UR8', name: 'Upper Right Third Molar' },
  { fdi: '17', universal: '2', palmer: 'UR7', name: 'Upper Right Second Molar' },
  { fdi: '16', universal: '3', palmer: 'UR6', name: 'Upper Right First Molar' },
  { fdi: '15', universal: '4', palmer: 'UR5', name: 'Upper Right Second Premolar' },
  { fdi: '14', universal: '5', palmer: 'UR4', name: 'Upper Right First Premolar' },
  { fdi: '13', universal: '6', palmer: 'UR3', name: 'Upper Right Canine' },
  { fdi: '12', universal: '7', palmer: 'UR2', name: 'Upper Right Lateral Incisor' },
  { fdi: '11', universal: '8', palmer: 'UR1', name: 'Upper Right Central Incisor' },

  // Upper Left Quadrant (Q2)
  { fdi: '21', universal: '9', palmer: 'UL1', name: 'Upper Left Central Incisor' },
  { fdi: '22', universal: '10', palmer: 'UL2', name: 'Upper Left Lateral Incisor' },
  { fdi: '23', universal: '11', palmer: 'UL3', name: 'Upper Left Canine' },
  { fdi: '24', universal: '12', palmer: 'UL4', name: 'Upper Left First Premolar' },
  { fdi: '25', universal: '13', palmer: 'UL5', name: 'Upper Left Second Premolar' },
  { fdi: '26', universal: '14', palmer: 'UL6', name: 'Upper Left First Molar' },
  { fdi: '27', universal: '15', palmer: 'UL7', name: 'Upper Left Second Molar' },
  { fdi: '28', universal: '16', palmer: 'UL8', name: 'Upper Left Third Molar' },

  // Lower Left Quadrant (Q3)
  { fdi: '38', universal: '17', palmer: 'LL8', name: 'Lower Left Third Molar' },
  { fdi: '37', universal: '18', palmer: 'LL7', name: 'Lower Left Second Molar' },
  { fdi: '36', universal: '19', palmer: 'LL6', name: 'Lower Left First Molar' },
  { fdi: '35', universal: '20', palmer: 'LL5', name: 'Lower Left Second Premolar' },
  { fdi: '34', universal: '21', palmer: 'LL4', name: 'Lower Left First Premolar' },
  { fdi: '33', universal: '22', palmer: 'LL3', name: 'Lower Left Canine' },
  { fdi: '32', universal: '23', palmer: 'LL2', name: 'Lower Left Lateral Incisor' },
  { fdi: '31', universal: '24', palmer: 'LL1', name: 'Lower Left Central Incisor' },

  // Lower Right Quadrant (Q4)
  { fdi: '41', universal: '25', palmer: 'LR1', name: 'Lower Right Central Incisor' },
  { fdi: '42', universal: '26', palmer: 'LR2', name: 'Lower Right Lateral Incisor' },
  { fdi: '43', universal: '27', palmer: 'LR3', name: 'Lower Right Canine' },
  { fdi: '44', universal: '28', palmer: 'LR4', name: 'Lower Right First Premolar' },
  { fdi: '45', universal: '29', palmer: 'LR5', name: 'Lower Right Second Premolar' },
  { fdi: '46', universal: '30', palmer: 'LR6', name: 'Lower Right First Molar' },
  { fdi: '47', universal: '31', palmer: 'LR7', name: 'Lower Right Second Molar' },
  { fdi: '48', universal: '32', palmer: 'LR8', name: 'Lower Right Third Molar' }
];

export function convertNumber(numStr: string, fromSystem: NumberingSystem, toSystem: NumberingSystem): string {
  const match = TOOTH_MAP.find(m => m[fromSystem] === numStr);
  if (!match) return numStr;
  return match[toSystem];
}

export function getDisplayNumber(fdiNum: string, system: NumberingSystem = 'fdi'): string {
  const match = TOOTH_MAP.find(m => m.fdi === fdiNum);
  if (!match) return fdiNum;
  
  if (system === 'palmer') {
    // Show Palmer notation with simple text representation
    // e.g. UR1 -> [1, UL2 -> 2], etc.
    const quad = match.palmer.substring(0, 2);
    const num = match.palmer.substring(2);
    switch (quad) {
      case 'UR': return `${num}┘`;
      case 'UL': return `└${num}`;
      case 'LL': return `┌${num}`;
      case 'LR': return `${num}┐`;
      default: return match.palmer;
    }
  }
  
  return match[system];
}
