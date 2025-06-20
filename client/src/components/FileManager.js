"use client"

import { useState, useEffect, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, Download, Trash2, Share2, File, ImageIcon, FileText, Archive } from "lucide-react"
import axios from "axios"
import toast from "react-hot-toast"

export default function FileManager() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [shareModal, setShareModal] = useState({ isOpen: false, link: "" })

  useEffect(() => {
    loadFiles()
  }, [])

  const loadFiles = async () => {
    try {
      const response = await axios.get("/files")
      setFiles(response.data.data.files)
    } catch (error) {
      toast.error("Failed to load files")
    } finally {
      setLoading(false)
    }
  }

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return

    setUploading(true)
    const formData = new FormData()

    acceptedFiles.forEach((file) => {
      formData.append("files", file)
    })

    try {
      const response = await axios.post("/files/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      toast.success(response.data.message)
      loadFiles()
    } catch (error) {
      const message = error.response?.data?.error || "Upload failed"
      toast.error(message)
    } finally {
      setUploading(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 5,
    maxSize: 50 * 1024 * 1024, // 50MB
  })

  const downloadFile = async (filename) => {
    try {
      const response = await axios.get(`/files/download/${filename}`, {
        responseType: "blob",
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", filename.split("-").slice(2).join("-"))
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      toast.error("Download failed")
    }
  }

  const deleteFile = async (filename) => {
    if (!window.confirm("Are you sure you want to delete this file?")) return

    try {
      await axios.delete(`/files/${filename}`)
      toast.success("File deleted successfully")
      loadFiles()
    } catch (error) {
      toast.error("Delete failed")
    }
  }

  const shareFile = async (filename) => {
    try {
      const response = await axios.post(`/files/share/${filename}`)
      setShareModal({
        isOpen: true,
        link: response.data.data.shareLink,
      })
    } catch (error) {
      toast.error("Share failed")
    }
  }

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareModal.link)
    toast.success("Share link copied to clipboard!")
    setShareModal({ isOpen: false, link: "" })
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileIcon = (filename) => {
    const ext = filename.split(".").pop().toLowerCase()

    if (["jpg", "jpeg", "png", "gif", "bmp", "svg"].includes(ext)) {
      return <ImageIcon className="h-8 w-8 text-blue-500" />
    } else if (["txt", "doc", "docx", "pdf"].includes(ext)) {
      return <FileText className="h-8 w-8 text-green-500" />
    } else if (["zip", "rar", "7z"].includes(ext)) {
      return <Archive className="h-8 w-8 text-orange-500" />
    } else {
      return <File className="h-8 w-8 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        {uploading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-2"></div>
            <p className="text-lg text-gray-600">Uploading files...</p>
          </div>
        ) : (
          <>
            <p className="text-lg text-gray-600 mb-2">
              {isDragActive ? "Drop the files here..." : "Drag & drop files here, or click to select"}
            </p>
            <p className="text-sm text-gray-500">Maximum 5 files, 50MB each</p>
          </>
        )}
      </div>

      {/* Files Grid */}
      {files.length === 0 ? (
        <div className="text-center py-12">
          <File className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg text-gray-600">No files uploaded yet</p>
          <p className="text-sm text-gray-500">Upload your first file to get started</p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {files.map((file, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">{getFileIcon(file.originalName)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{file.originalName}</p>
                  <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                  <p className="text-xs text-gray-400">{new Date(file.uploadDate).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => downloadFile(file.filename)}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </button>
                <button
                  onClick={() => shareFile(file.filename)}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Share2 className="h-3 w-3 mr-1" />
                  Share
                </button>
                <button
                  onClick={() => deleteFile(file.filename)}
                  className="inline-flex items-center justify-center px-3 py-2 border border-red-300 shadow-sm text-xs font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Share Modal */}
      {shareModal.isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Share File</h3>
              <p className="text-sm text-gray-600 mb-4">Copy this link to share the file:</p>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={shareModal.link}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
                <button
                  onClick={copyShareLink}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Copy
                </button>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setShareModal({ isOpen: false, link: "" })}
                  className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
