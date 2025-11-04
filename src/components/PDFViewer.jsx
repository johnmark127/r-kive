import { useState, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, Download, X, ZoomIn, ZoomOut } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure worker - using unpkg CDN for reliability
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PDFViewer = ({ fileUrl, fileName, onClose }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNotice, setShowNotice] = useState(true);

  // Memoize options to prevent unnecessary reloads
  const options = useMemo(
    () => ({
      cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
      cMapPacked: true,
    }),
    []
  );

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  }

  function onDocumentLoadError(error) {
    console.error('Error loading PDF:', error);
    setError('Failed to load PDF. Please try downloading instead.');
    setLoading(false);
  }

  const goToPrevPage = () => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber((prev) => Math.min(prev + 1, numPages || 1));
  };

  const zoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 3.0));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.5));
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName || 'research-paper.pdf';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full h-full max-w-6xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 truncate">
              {fileName || 'Research Paper'}
            </h2>
            <p className="text-xs text-red-600 font-medium mt-1">
              ⚠️ School Property - Viewing Only | No Download or Copying Permitted
            </p>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={zoomOut}
              disabled={scale <= 0.5}
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium text-gray-700 min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={zoomIn}
              disabled={scale >= 3.0}
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <div className="w-px h-6 bg-gray-300 mx-2" />
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              title="Close"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Copyright Notice Banner - Collapsible */}
        {showNotice && (
          <div className="bg-red-50 border-b border-red-200 px-4 py-2 flex items-center justify-between">
            <p className="text-xs text-red-800 flex-1">
              <span className="font-semibold">📋 INSTITUTIONAL PROPERTY:</span> This document is provided for educational purposes only. 
              Unauthorized downloading, copying, reproduction, or distribution is strictly prohibited and may result in disciplinary action.
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNotice(false)}
              className="ml-2 h-6 w-6 p-0 hover:bg-red-100 flex-shrink-0"
              title="Dismiss notice"
            >
              <X className="w-3 h-3 text-red-600" />
            </Button>
          </div>
        )}

        {/* PDF Viewer */}
        <div 
          className="flex-1 overflow-auto bg-gray-100 p-4 select-none"
          onContextMenu={(e) => e.preventDefault()}
        >
          <div className="flex justify-center relative">
            {loading && !error && (
              <div className="flex items-center justify-center py-12">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-4 text-gray-600">Loading PDF...</span>
              </div>
            )}
            {error && (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="text-red-600 mb-4 text-center">
                  <p className="font-semibold mb-2">Error Loading PDF</p>
                  <p className="text-sm text-gray-600">{error}</p>
                </div>
                <Button onClick={handleDownload} className="mt-4">
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF Instead
                </Button>
              </div>
            )}
            {!error && (
              <div className="relative">
                {/* Watermark overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                  <div className="transform -rotate-45 opacity-10 select-none text-center">
                    <p className="text-gray-800 font-bold text-5xl whitespace-nowrap mb-2">
                      R-KIVE RESEARCH
                    </p>
                    <p className="text-gray-700 font-semibold text-2xl whitespace-nowrap">
                      SCHOOL PROPERTY - DO NOT COPY
                    </p>
                  </div>
                </div>
                
                <Document
                  file={fileUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  loading={null}
                  className="shadow-lg relative z-0"
                  options={options}
                >
                  <Page
                    pageNumber={pageNumber}
                    scale={scale}
                    renderTextLayer={false}
                    renderAnnotationLayer={true}
                    className="shadow-2xl"
                  />
                </Document>
              </div>
            )}
          </div>
        </div>

        {/* Footer - Page Navigation */}
        <div className="flex items-center justify-center gap-4 p-4 border-t bg-gray-50">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          <span className="text-sm font-medium text-gray-700">
            Page {pageNumber} of {numPages || '...'}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextPage}
            disabled={pageNumber >= (numPages || 1)}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* Footer Copyright Notice */}
        <div className="bg-gray-800 text-white px-4 py-2 text-center">
          <p className="text-xs">
            © R-Kive Research Repository | This material is protected under institutional copyright. 
            For academic viewing only. Any unauthorized use, reproduction, or distribution is prohibited.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;
