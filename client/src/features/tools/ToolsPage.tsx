import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '../../store/appStore'
import * as api from '../../api/client'

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export function ToolsPage() {
  const showToast = useAppStore((s) => s.showToast)
  const setToolsHasFiles = useAppStore((s) => s.setToolsHasFiles)
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync file count to global store for navigation guard
  useEffect(() => {
    setToolsHasFiles(files.length > 0)
    return () => setToolsHasFiles(false)
  }, [files.length, setToolsHasFiles])


  function addValidFiles(incomingFiles: FileList | File[]) {
    const newFiles = Array.from(incomingFiles)
    const validFiles = newFiles.filter(f => f.type.startsWith('image/'))
    if (validFiles.length !== newFiles.length) {
      showToast('Beberapa file diabaikan karena bukan gambar', true)
    }
    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles])
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      addValidFiles(e.target.files)
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addValidFiles(e.dataTransfer.files)
    }
  }

  function removeFile(index: number) {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  function handleItemDragStart(e: React.DragEvent, index: number) {
    e.stopPropagation()
    setDraggedIndex(index)
  }

  function handleItemDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
  }

  function handleItemDrop(e: React.DragEvent, targetIndex: number) {
    e.preventDefault()
    e.stopPropagation()
    if (draggedIndex === null || draggedIndex === targetIndex) return

    setFiles(prev => {
      const updated = [...prev]
      const [movedItem] = updated.splice(draggedIndex, 1)
      updated.splice(targetIndex, 0, movedItem)
      return updated
    })
    setDraggedIndex(null)
  }

  async function handleConvert() {
    if (files.length === 0) return
    setLoading(true)
    try {
      const blob = await api.convertImageToPdf(files)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Images_to_PDF_${new Date().getTime()}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      showToast('Berhasil mengonversi dan mengunduh PDF!')
      setFiles([])
    } catch (err: any) {
      showToast(err.message, true)
    } finally {
      setLoading(false)
    }
  }

  const totalSize = files.reduce((acc, f) => acc + f.size, 0)

  return (
    <section id="tab-tools" className="tab-panel active">
      <div style={{ padding: '16px 32px', width: '100%' }}>
        {/* Page Header */}
        <div className="page-header" style={{ marginBottom: 24 }}>
          <div>
            <h2 className="page-title">Alat & Utilitas</h2>
            <p className="hint" style={{ margin: 0 }}>Gunakan alat ini untuk mempermudah pekerjaan laporan PKL Anda.</p>
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          type="file"
          multiple
          accept="image/*"
          style={{ display: 'none' }}
          ref={fileInputRef}
          onChange={handleFileSelect}
        />

        {/* Tool Header Card */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(66, 133, 244, 0.12)',
              color: '#4285F4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>picture_as_pdf</span>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, color: 'var(--fg-primary)' }}>Image to PDF Converter</h3>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--fg-secondary)', marginTop: 2 }}>
                Gabungkan foto menjadi file PDF A4 rapi secara cepat.
              </p>
            </div>
          </div>

          {files.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--fg-secondary)', fontWeight: 500 }}>
                {files.length} foto ({formatFileSize(totalSize)})
              </span>
              <button
                className="btn btn-outline-danger"
                onClick={() => setFiles([])}
                style={{ borderRadius: 100 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete_sweep</span>
                <span>Kosongkan</span>
              </button>
            </div>
          )}
        </div>

        {/* Drop Zone Area */}
        <div
          className={`drive-drop-zone ${isDragging ? 'dragging' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            border: isDragging ? '2px dashed #4285F4' : '2px dashed var(--border)',
            borderRadius: 24,
            padding: files.length > 0 ? '28px 20px' : '56px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            background: isDragging ? 'rgba(66, 133, 244, 0.08)' : 'var(--bg-surface)',
            boxShadow: isDragging ? '0 0 0 4px rgba(66, 133, 244, 0.15)' : 'none',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            marginBottom: 24,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: isDragging ? '#4285F4' : 'var(--bg-elevated)',
            color: isDragging ? '#ffffff' : '#4285F4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 14,
            transition: 'all 0.2s ease'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 28 }}>
              {isDragging ? 'cloud_upload' : 'drive_folder_upload'}
            </span>
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--fg-primary)', marginBottom: 4 }}>
            {isDragging ? 'Lepaskan foto di sini' : 'Tarik & Lepas foto ke sini, atau Klik untuk Memilih'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--fg-secondary)', maxWidth: 420 }}>
            Mendukung format JPG, PNG, WEBP (Bisa memilih banyak foto sekaligus)
          </div>
        </div>

        {/* Selected Photos Preview Grid */}
        {files.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 14
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#4285F4' }}>grid_view</span>
                <span>Urutan Halaman PDF ({files.length} Foto)</span>
              </div>
              <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
                Tarik foto untuk menggeser posisi halaman
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: 14
            }}>
              {files.map((file, i) => (
                <div
                  key={`${file.name}-${i}`}
                  draggable
                  onDragStart={(e) => handleItemDragStart(e, i)}
                  onDragOver={handleItemDragOver}
                  onDrop={(e) => handleItemDrop(e, i)}
                  style={{
                    borderRadius: 14,
                    overflow: 'hidden',
                    background: 'var(--bg-surface)',
                    border: draggedIndex === i ? '2px solid #4285F4' : '1px solid var(--border)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    opacity: draggedIndex === i ? 0.4 : 1,
                    cursor: 'grab',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  {/* Thumbnail Container */}
                  <div style={{ position: 'relative', width: '100%', height: 130, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${i}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                    />
                    
                    {/* Page Number Badge */}
                    <div style={{
                      position: 'absolute',
                      top: 6,
                      left: 6,
                      background: 'rgba(0,0,0,0.7)',
                      backdropFilter: 'blur(4px)',
                      color: '#ffffff',
                      borderRadius: 100,
                      padding: '2px 8px',
                      fontSize: 11,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      <span>Hal {i + 1}</span>
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFile(i) }}
                      title="Hapus foto ini"
                      style={{
                        position: 'absolute',
                        top: 6,
                        right: 6,
                        background: 'rgba(0,0,0,0.7)',
                        backdropFilter: 'blur(4px)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '50%',
                        width: 26,
                        height: 26,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                    </button>
                  </div>

                  {/* Card Footer */}
                  <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8, flexGrow: 1 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#EA4335', flexShrink: 0 }}>
                      image
                    </span>
                    
                    <div style={{ overflow: 'hidden', flexGrow: 1 }}>
                      <div style={{
                        fontSize: 12,
                        fontWeight: 500,
                        color: 'var(--fg-primary)',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap'
                      }} title={file.name}>
                        {file.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 1 }}>
                        {formatFileSize(file.size)}
                      </div>
                    </div>

                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--fg-muted)', cursor: 'grab' }}>
                      drag_indicator
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ALWAYS VISIBLE CONVERT BUTTON */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginTop: 8 }}>
          <button
            className="btn btn-primary"
            disabled={files.length === 0 || loading}
            onClick={handleConvert}
            style={{
              width: '100%',
              borderRadius: 100,
              padding: '14px 24px',
              fontSize: 15,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              background: files.length === 0 ? 'var(--bg-elevated)' : 'var(--primary)',
              color: files.length === 0 ? 'var(--fg-muted)' : 'var(--primary-fg)',
              boxShadow: files.length > 0 ? '0 4px 12px rgba(0, 0, 0, 0.2)' : 'none',
              cursor: files.length === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            <span className="material-symbols-outlined">{loading ? 'hourglass_empty' : 'picture_as_pdf'}</span>
            <span>
              {loading 
                ? 'Sedang Mengonversi PDF...' 
                : files.length > 0 
                  ? `Konversi ${files.length} Foto ke PDF & Unduh` 
                  : 'Konversi ke PDF & Unduh'}
            </span>
          </button>

          {files.length === 0 && (
            <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
              Pilih atau tarik foto terlebih dahulu untuk mengaktifkan tombol konversi
            </span>
          )}
        </div>
      </div>
    </section>
  )
}
