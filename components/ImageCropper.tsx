'use client'

import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { getCroppedImageFile } from '@/lib/cropImage'

type Area = { x: number; y: number; width: number; height: number }

export default function ImageCropper({
  file,
  aspect = 4 / 3,
  onConfirm,
  onCancel,
}: {
  file: File
  aspect?: number
  onConfirm: (croppedFile: File) => void
  onCancel: () => void
}) {
  const [imageSrc] = useState(() => URL.createObjectURL(file))
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [processing, setProcessing] = useState(false)

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return
    setProcessing(true)
    try {
      const croppedFile = await getCroppedImageFile(imageSrc, croppedAreaPixels, file.name)
      onConfirm(croppedFile)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl overflow-hidden w-full max-w-lg flex flex-col">
        <div className="relative w-full" style={{ height: '360px' }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="p-4 flex flex-col gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Zoom</label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <p className="text-xs text-gray-400">
            Déplace et zoome pour centrer le plat au mieux dans le cadre.
          </p>

          <div className="flex gap-2">
            <button
              onClick={handleConfirm}
              disabled={processing}
              className="flex-1 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {processing ? 'Traitement...' : 'Valider le recadrage'}
            </button>
            <button
              onClick={onCancel}
              className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
