import { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from './ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  X, 
  MessageSquare,
  Check,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../supabase/client';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const StudentPDFViewer = ({ 
  fileUrl, 
  fileName, 
  projectId,
  chapterNumber,
  onClose 
}) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Annotation states
  const [annotations, setAnnotations] = useState([]);
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);
  
  // Refs
  const pageRef = useRef(null);

  // Available highlight colors
  const colors = [
    { name: 'yellow', bg: 'bg-yellow-200', border: 'border-yellow-400' },
    { name: 'green', bg: 'bg-green-200', border: 'border-green-400' },
    { name: 'pink', bg: 'bg-pink-200', border: 'border-pink-400' },
    { name: 'blue', bg: 'bg-blue-200', border: 'border-blue-400' },
    { name: 'orange', bg: 'bg-orange-200', border: 'border-orange-400' }
  ];

  useEffect(() => {
    if (projectId && chapterNumber) {
      loadAnnotations();
    }
  }, [projectId, chapterNumber, pageNumber]);

  // Load annotations from database (all advisers' annotations)
  const loadAnnotations = async () => {
    try {
      // First, get annotations
      const { data: annotationsData, error: annotationsError } = await supabase
        .from('chapter_annotations')
        .select('*')
        .eq('project_id', projectId)
        .eq('chapter_number', chapterNumber)
        .eq('page_number', pageNumber)
        .order('created_at', { ascending: true });

      if (annotationsError) throw annotationsError;

      // Then get adviser info for each annotation
      if (annotationsData && annotationsData.length > 0) {
        const adviserIds = [...new Set(annotationsData.map(a => a.adviser_id))];
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, firstName, lastName, email')
          .in('id', adviserIds);

        if (!usersError && usersData) {
          // Merge adviser info with annotations
          const enrichedAnnotations = annotationsData.map(annotation => {
            const adviser = usersData.find(u => u.id === annotation.adviser_id);
            return {
              ...annotation,
              users: adviser || null
            };
          });
          setAnnotations(enrichedAnnotations);
        } else {
          setAnnotations(annotationsData);
        }
      } else {
        setAnnotations([]);
      }
    } catch (err) {
      console.error('Error loading annotations:', err);
      setAnnotations([]);
    }
  };

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  }

  function onDocumentLoadError(error) {
    console.error('Error loading PDF:', error);
    setError('Failed to load PDF. Please try again.');
    setLoading(false);
  }

  const goToPrevPage = () => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
    setSelectedAnnotation(null);
  };

  const goToNextPage = () => {
    setPageNumber((prev) => Math.min(prev + 1, numPages || 1));
    setSelectedAnnotation(null);
  };

  const zoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 2.5));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.6));
  };

  // Get color class
  const getColorClass = (colorName) => {
    const color = colors.find(c => c.name === colorName);
    return color?.bg || 'bg-yellow-200';
  };

  // Format adviser name
  const getAdviserName = (annotation) => {
    if (annotation.users) {
      return `${annotation.users.firstName || ''} ${annotation.users.lastName || ''}`.trim() || annotation.users.email;
    }
    return 'Adviser';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full h-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 truncate">
              {fileName || `Chapter ${chapterNumber}`}
            </h2>
            <p className="text-xs text-blue-600 font-medium mt-1">
              <MessageSquare className="w-3 h-3 inline mr-1" />
              Viewing adviser feedback and annotations
            </p>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={zoomOut}
              disabled={scale <= 0.6}
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
              disabled={scale >= 2.5}
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

        {/* Main Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* PDF Viewer */}
          <div className="flex-1 overflow-auto bg-gray-100 p-4 relative">
            {loading && !error && (
              <div className="flex items-center justify-center py-12">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-4 text-gray-600">Loading PDF...</span>
              </div>
            )}
            {error && (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="text-red-600 text-center">
                  <p className="font-semibold mb-2">Error Loading PDF</p>
                  <p className="text-sm text-gray-600">{error}</p>
                </div>
              </div>
            )}
            {!error && (
              <div className="flex justify-center">
                <div 
                  ref={pageRef}
                  className="relative"
                >
                  <Document
                    file={fileUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    loading={null}
                    className="shadow-lg"
                  >
                    <Page
                      pageNumber={pageNumber}
                      scale={scale}
                      renderTextLayer={true}
                      renderAnnotationLayer={false}
                      className="shadow-2xl"
                    />
                  </Document>

                  {/* Render existing annotations as overlays (read-only) */}
                  {annotations.map((annotation) => (
                    <div
                      key={annotation.id}
                      className={`absolute ${getColorClass(annotation.highlight_color)} opacity-40 hover:opacity-60 cursor-pointer border-2 ${colors.find(c => c.name === annotation.highlight_color)?.border || 'border-yellow-400'}`}
                      style={{
                        left: `${annotation.position_data.x}px`,
                        top: `${annotation.position_data.y}px`,
                        width: `${annotation.position_data.width}px`,
                        height: `${annotation.position_data.height}px`,
                        pointerEvents: 'auto'
                      }}
                      onClick={() => setSelectedAnnotation(annotation)}
                      title="Click to view comment"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Annotations Sidebar */}
          <div className="w-80 bg-gray-50 border-l overflow-y-auto">
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                Adviser Feedback ({annotations.length})
              </h3>

              {annotations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No feedback yet</p>
                  <p className="text-xs mt-1">Your adviser hasn't added any comments on this page</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {annotations.map((annotation) => (
                    <div
                      key={annotation.id}
                      className={`p-3 bg-white rounded-lg border-2 cursor-pointer transition-all ${
                        selectedAnnotation?.id === annotation.id
                          ? 'border-blue-500 shadow-md'
                          : 'border-gray-200 hover:border-gray-300'
                      } ${annotation.resolved ? 'opacity-60' : ''}`}
                      onClick={() => setSelectedAnnotation(annotation)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded ${getColorClass(annotation.highlight_color)} border`} />
                          <span className="text-xs text-gray-600">
                            {getAdviserName(annotation)}
                          </span>
                        </div>
                        {annotation.resolved && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Resolved
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-900 font-medium mb-1 line-clamp-2">
                        "{annotation.highlight_text}"
                      </p>
                      {annotation.comment && (
                        <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-100">
                          <p className="text-xs text-gray-700">
                            <strong>Feedback:</strong> {annotation.comment}
                          </p>
                        </div>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(annotation.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
      </div>
    </div>
  );
};

export default StudentPDFViewer;
