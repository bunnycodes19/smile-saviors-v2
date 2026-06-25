import React from 'react';
import { getDisplayNumber, type NumberingSystem } from '../utils/toothNumbering';

interface ToothCondition {
  id: string;
  toothNumber: string;
  surface: string | null;
  conditionCode: string;
  status: string;
  notes: string | null;
}

interface DentalChartProps {
  conditions: ToothCondition[];
  selectedTooth: string | null;
  selectedSurface: string | null;
  onSurfaceClick: (toothNumber: string, surface: string | null) => void;
  numberingSystem: NumberingSystem;
}

const CONDITION_COLORS: Record<string, string> = {
  healthy: 'rgba(255, 255, 255, 0.1)',
  caries: '#ef4444', // Red
  filling: '#3b82f6', // Blue
  crown: '#f59e0b', // Amber
  rct: '#8b5cf6', // Purple
  missing: '#4b5563', // Grey
  extraction: '#dc2626', // Dark Red
  implant: '#06b6d4', // Cyan
  fracture: '#f97316', // Orange
  sealant: '#14b8a6', // Teal
  veneer: '#ec4899', // Pink
};

// FDI Number lists for rendering
const UPPER_TEETH = [
  '18', '17', '16', '15', '14', '13', '12', '11',
  '21', '22', '23', '24', '25', '26', '27', '28'
];

const LOWER_TEETH = [
  '48', '47', '46', '45', '44', '43', '42', '41',
  '31', '32', '33', '34', '35', '36', '37', '38'
];

export const DentalChart: React.FC<DentalChartProps> = ({
  conditions,
  selectedTooth,
  selectedSurface,
  onSurfaceClick,
  numberingSystem
}) => {
  
  // Helper to determine color of a tooth surface
  const getSurfaceColor = (toothNum: string, surface: string) => {
    // 1. Check for whole-tooth conditions first
    const wholeCondition = conditions.find(c => c.toothNumber === toothNum && !c.surface);
    if (wholeCondition && CONDITION_COLORS[wholeCondition.conditionCode]) {
      return CONDITION_COLORS[wholeCondition.conditionCode];
    }

    // 2. Check for surface-specific condition
    const surfaceCondition = conditions.find(c => c.toothNumber === toothNum && c.surface === surface);
    if (surfaceCondition && CONDITION_COLORS[surfaceCondition.conditionCode]) {
      return CONDITION_COLORS[surfaceCondition.conditionCode];
    }

    // Default color (Healthy / Untreated)
    return 'rgba(255, 255, 255, 0.08)';
  };

  const isWholeToothAffected = (toothNum: string) => {
    const wholeCondition = conditions.find(c => c.toothNumber === toothNum && !c.surface);
    return !!wholeCondition && ['missing', 'extraction', 'implant', 'crown', 'rct'].includes(wholeCondition.conditionCode);
  };

  const renderTooth = (toothNum: string) => {
    const isSelected = selectedTooth === toothNum;
    const wholeAffected = isWholeToothAffected(toothNum);
    const displayName = getDisplayNumber(toothNum, numberingSystem);

    return (
      <div 
        key={toothNum} 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: '6px',
          padding: '8px',
          borderRadius: 'var(--radius-md)',
          background: isSelected ? 'rgba(6, 182, 212, 0.08)' : 'transparent',
          border: isSelected ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid transparent',
          transition: 'all 0.2s ease',
          cursor: 'pointer'
        }}
      >
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
          {displayName}
        </span>
        
        {/* SVG representation of 5-surface tooth (cross layout) */}
        <svg 
          width="46" 
          height="46" 
          viewBox="0 0 40 40"
          style={{ overflow: 'visible' }}
        >
          {wholeAffected ? (
            // Whole tooth highlighted (e.g. missing/implant/crown)
            <rect 
              x="0" y="0" width="40" height="40" rx="4"
              fill={getSurfaceColor(toothNum, 'buccal')} 
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="1.5"
              onClick={() => onSurfaceClick(toothNum, null)}
            />
          ) : (
            // 5 surfaces: Buccal (top), Lingual (bottom), Mesial (left/right depending on quadrant), Distal, Occlusal (center)
            <>
              {/* Buccal (Top) */}
              <polygon 
                points="0,0 40,0 28,12 12,12" 
                fill={getSurfaceColor(toothNum, 'buccal')}
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="1"
                onClick={(e) => { e.stopPropagation(); onSurfaceClick(toothNum, 'buccal'); }}
                style={{ cursor: 'pointer', transition: 'fill 0.2s' }}
              />
              {/* Lingual (Bottom) */}
              <polygon 
                points="12,28 28,28 40,40 0,40" 
                fill={getSurfaceColor(toothNum, 'lingual')}
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="1"
                onClick={(e) => { e.stopPropagation(); onSurfaceClick(toothNum, 'lingual'); }}
                style={{ cursor: 'pointer', transition: 'fill 0.2s' }}
              />
              {/* Mesial (Left/Right depending on side. We'll use absolute Left/Right for simplicity) */}
              {/* Left Surface */}
              <polygon 
                points="0,0 12,12 12,28 0,40" 
                fill={getSurfaceColor(toothNum, 'mesial')}
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="1"
                onClick={(e) => { e.stopPropagation(); onSurfaceClick(toothNum, 'mesial'); }}
                style={{ cursor: 'pointer', transition: 'fill 0.2s' }}
              />
              {/* Right Surface */}
              <polygon 
                points="40,0 28,12 28,28 40,40" 
                fill={getSurfaceColor(toothNum, 'distal')}
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="1"
                onClick={(e) => { e.stopPropagation(); onSurfaceClick(toothNum, 'distal'); }}
                style={{ cursor: 'pointer', transition: 'fill 0.2s' }}
              />
              {/* Occlusal (Center) */}
              <rect 
                x="12" y="12" width="16" height="16" 
                fill={getSurfaceColor(toothNum, 'occlusal')}
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="1"
                onClick={(e) => { e.stopPropagation(); onSurfaceClick(toothNum, 'occlusal'); }}
                style={{ cursor: 'pointer', transition: 'fill 0.2s' }}
              />
            </>
          )}

          {/* Selection border indicator */}
          {isSelected && !selectedSurface && (
            <rect 
              x="-3" y="-3" width="46" height="46" rx="6"
              fill="none" 
              stroke="var(--color-primary)" 
              strokeWidth="2" 
              strokeDasharray="4 2"
            />
          )}

          {/* Active selection dot for specific surface */}
          {isSelected && selectedSurface && (
            (() => {
              let dotX = 20;
              let dotY = 20;
              if (selectedSurface === 'buccal') dotY = 6;
              if (selectedSurface === 'lingual') dotY = 34;
              if (selectedSurface === 'mesial') dotX = 6;
              if (selectedSurface === 'distal') dotX = 34;
              return (
                <circle cx={dotX} cy={dotY} r="3" fill="#ffffff" stroke="var(--color-primary)" strokeWidth="1" />
              );
            })()
          )}
        </svg>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', overflowX: 'auto', padding: '10px 0' }}>
      
      {/* Maxillary / Upper Arch */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>
          Maxillary Arch (Upper Right - Upper Left)
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', minWidth: '780px', gap: '4px' }}>
          {UPPER_TEETH.map(renderTooth)}
        </div>
      </div>

      <hr style={{ borderColor: 'rgba(255,255,255,0.05)', margin: '10px 0' }} />

      {/* Mandibular / Lower Arch */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', minWidth: '780px', gap: '4px' }}>
          {LOWER_TEETH.map(renderTooth)}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', marginTop: '6px' }}>
          Mandibular Arch (Lower Right - Lower Left)
        </div>
      </div>
    </div>
  );
};
