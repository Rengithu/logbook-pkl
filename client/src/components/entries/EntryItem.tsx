import { useState } from 'react'
import { formatTanggalIndo } from '../../utils/format'
import { getHoliday } from '../../utils/holidays'
import type { Entry } from '../../types/index'

export function EntryItem({ entry, isTrash, isSelected, onToggleSelect, onEdit, onDelete, onRestore }: {
  entry: Entry
  isTrash: boolean
  isSelected: boolean
  onToggleSelect: () => void
  onEdit: () => void
  onDelete: (force?: boolean) => void
  onRestore: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const hol = getHoliday(entry.tanggal)

  return (
    <div className={`entry-item ${isSelected ? 'selected' : ''} ${expanded ? 'expanded' : ''}`} data-id={entry.id}>
      <div className="entry-header-row" onClick={(e) => {
        if ((e.target as HTMLElement).closest('.icon-actions-group') || (e.target as HTMLElement).closest('.btn-expand-arrow')) return
        if ((e.target as HTMLElement).closest('.btn-expand-arrow')) {
          setExpanded(!expanded)
          return
        }
        onToggleSelect()
      }}>
        <div className="entry-date-group">
          <span className="material-symbols-outlined entry-date-icon">event</span>
          <span className="entry-date-text">{entry.hari}, {formatTanggalIndo(entry.tanggal)}</span>
          {hol && (
            <span className="badge" style={{
              background: hol.type === 'bali' ? 'rgba(254,128,25,0.15)' : 'var(--danger-bg)',
              color: hol.type === 'bali' ? 'var(--accent-orange)' : 'var(--danger)',
              borderColor: hol.type === 'bali' ? 'rgba(254,128,25,0.3)' : 'var(--danger-border)',
              fontSize: 11, marginLeft: 6
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 13, verticalAlign: 'middle' }}>
                {hol.type === 'bali' ? 'temple_hindu' : 'celebration'}
              </span> {hol.name}
            </span>
          )}
        </div>
        <div className="entry-header-right">
          {isTrash && (
            <>
              <button type="button" className="btn-icon" onClick={(e) => { e.stopPropagation(); onRestore() }} title="Pulihkan Catatan">
                <span className="material-symbols-outlined">restore_from_trash</span>
              </button>
              <button type="button" className="btn-icon btn-icon-danger" onClick={(e) => { e.stopPropagation(); onDelete(true) }} title="Hapus Permanen">
                <span className="material-symbols-outlined">delete_forever</span>
              </button>
            </>
          )}
          <button type="button" className="btn-expand-arrow" title="Buka / Tutup Detail" onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}>
            <span className="material-symbols-outlined arrow-icon">expand_more</span>
          </button>
        </div>
      </div>
      <div className="entry-expand-body">
        <div className="entry-job">{entry.kegiatan}</div>
        {entry.photos && entry.photos.length > 0 && (
          <div className="entry-photos-preview">
            {entry.photos.map((p: string) => (
              <img key={p} src={`/uploads/${p}`} alt="Foto" title="Dokumentasi" loading="lazy" />
            ))}
          </div>
        )}
        <div className="entry-actions-row">
          {isTrash ? (
            <div className="icon-actions-group" style={{ marginLeft: 'auto' }}>
              <button className="btn-icon" onClick={onRestore} title="Pulihkan Catatan">
                <span className="material-symbols-outlined">restore_from_trash</span>
              </button>
              <div className="icon-divider" />
              <button className="btn-icon btn-icon-danger" onClick={() => onDelete(true)} title="Hapus Permanen">
                <span className="material-symbols-outlined">delete_forever</span>
              </button>
            </div>
          ) : (
            <div className="icon-actions-group" style={{ marginLeft: 'auto' }}>
              <button className="btn-icon" onClick={() => window.open(`/api/export/day/${entry.id}/pdf`, '_blank')} title="Pratinjau Dokumen">
                <span className="material-symbols-outlined">visibility</span>
              </button>
              <div className="icon-divider" />
              <button className="btn-icon" onClick={async () => {
                try {
                  const res = await fetch(`/api/export/day/${entry.id}/pdf`)
                  if (!res.ok) throw new Error('Gagal mengunduh')
                  const blob = await res.blob()
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `Catatan_Harian_${entry.tanggal}_${entry.hari || 'Hari'}.pdf`
                  a.click()
                  URL.revokeObjectURL(url)
                } catch (e: any) {
                  alert(e.message)
                }
              }} title="Unduh Catatan">
                <span className="material-symbols-outlined">download</span>
              </button>
              <div className="icon-divider" />
              <button className="btn-icon" onClick={onEdit} title="Edit Catatan">
                <span className="material-symbols-outlined">edit</span>
              </button>
              <div className="icon-divider" />
              <button className="btn-icon btn-icon-danger" onClick={() => onDelete()} title="Hapus Catatan">
                <span className="material-symbols-outlined">delete</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
  