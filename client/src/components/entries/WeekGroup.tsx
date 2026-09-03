import { useState, useMemo } from 'react'
import { weekRangeLabelClient } from '../../utils/format'
import { EntryItem } from './EntryItem'
import type { Entry } from '../../types/index'

export function WeekGroup({ wKey, weekNumber, entries, isTrash, entriesViewMode, selectedEntries, onToggleSelect, onSelectAllWeek, onEdit, onDelete, onRestore }: {
  wKey: string
  weekNumber?: number
  entries: Entry[]
  isTrash: boolean
  entriesViewMode: string
  selectedEntries: string[]
  onToggleSelect: (id: string) => void
  onSelectAllWeek: (ids: string[]) => void
  onEdit: (entry: Entry) => void
  onDelete: (id: string, force?: boolean) => void
  onRestore: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)

  const weekEntryIds = useMemo(() => entries.map(e => e.id), [entries])
  const selectedInWeek = useMemo(() => weekEntryIds.filter(id => selectedEntries.includes(id)).length, [weekEntryIds, selectedEntries])
  const allSelected = selectedInWeek === entries.length && entries.length > 0

  return (
    <div className={`week-group-item ${expanded ? 'expanded' : ''}`}>
      <div className="week-group-header" onClick={() => setExpanded(!expanded)}>
        <div className="week-group-info">
          <div className="week-title-row">
            <span className="material-symbols-outlined week-icon">date_range</span>
            <span className="week-title-text">Minggu ke-{weekNumber || 1} ({weekRangeLabelClient(wKey, entries)})</span>
          </div>
          <div className="week-subtitle">
            <span className="material-symbols-outlined" style={{ fontSize: 14, marginRight: 4, verticalAlign: 'middle' }}>event_note</span>
            {entries.length} catatan harian
            <span className={`week-selected-badge ${selectedInWeek > 0 ? 'active' : ''}`}>
              • {selectedInWeek} dipilih
            </span>
          </div>
        </div>
        <button type="button" className="btn-expand-arrow week-arrow" title="Buka / Tutup Minggu">
          <span className="material-symbols-outlined arrow-icon">expand_more</span>
        </button>
      </div>
      {!isTrash && (() => {
        const isFirstSelected = entries.length > 0 && selectedEntries.includes(entries[0].id)
        const isListMode = entriesViewMode === 'list'
        
        let actionStateClass = 'state-collapsed'
        if (expanded) {
          if (isListMode && isFirstSelected) {
            actionStateClass = 'state-expanded-first-selected'
          } else {
            actionStateClass = 'state-expanded-normal'
          }
        }

        return (
          <div className={`week-footer-actions ${actionStateClass}`} onClick={(e) => e.stopPropagation()}>
          <button
            className={`week-footer-btn ${allSelected ? 'active' : ''}`}
            onClick={() => onSelectAllWeek(weekEntryIds)}
            title={allSelected ? 'Batal Pilih Semua' : 'Pilih Semua Minggu Ini'}
          >
            <span className="material-symbols-outlined">{allSelected ? 'deselect' : 'select_all'}</span>
            <span className="btn-label-desktop">{allSelected ? 'Batal Pilih' : 'Pilih Semua'}</span>
          </button>
          <button
            className="week-footer-btn"
            onClick={() => window.open(`/api/export/week/${wKey}/pdf`, '_blank')}
            title="Pratinjau Jurnal Mingguan"
          >
            <span className="material-symbols-outlined">visibility</span>
            <span className="btn-label-desktop">Pratinjau</span>
          </button>
          <button
            className="week-footer-btn"
            onClick={() => window.open(`/api/export/week/${wKey}/zip`, '_blank')}
            title="Unduh Jurnal Mingguan (ZIP)"
          >
            <span className="material-symbols-outlined">download</span>
            <span className="btn-label-desktop">Unduh</span>
          </button>
        </div>
        )
      })()}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateRows: expanded ? '1fr' : '0fr', 
          transition: 'grid-template-rows 0.35s cubic-bezier(0.4, 0, 0.2, 1)' 
        }}
      >
        <div style={{ overflow: 'hidden' }}>
          <div className={`week-group-body ${entriesViewMode === 'grid' ? 'entries-grid-mode' : ''}`}>
            {entries.map(entry => (
              <EntryItem
                key={entry.id}
                entry={entry}
                isTrash={isTrash}
                isSelected={selectedEntries.includes(entry.id)}
                onToggleSelect={() => onToggleSelect(entry.id)}
                onEdit={() => onEdit(entry)}
                onDelete={(force) => onDelete(entry.id, force)}
                onRestore={() => onRestore(entry.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
