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
  Trash2,
  Check,
  Highlighter,
  Save
} from 'lucide-react';
import { supabase } from '../supabase/client';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const AdviserPDFAnnotator = ({ 
  fileUrl, 
  fileName, 
  projectId,
  chapterNumber,
  adviserId,
  onClose 
}) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Annotation states
  const [annotations, setAnnotations] = useState([]);
  const [selectedText, setSelectedText] = useState(null);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [highlightColor, setHighlightColor] = useState('yellow');
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);
  const [savingAnnotation, setSavingAnnotation] = useState(false);
  
  // Refs
  const textLayerRef = useRef(null);
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
    if (projectId && chapterNumber && adviserId) {
      loadAnnotations();
    }
  }, [projectId, chapterNumber, pageNumber]);

  // Load annotations from database
  const loadAnnotations = async () => {
    try {
      const { data, error } = await supabase
        .from('chapter_annotations')
        .select('*')
        .eq('project_id', projectId)
        .eq('chapter_number', chapterNumber)
        .eq('page_number', pageNumber)
        .eq('adviser_id', adviserId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setAnnotations(data || []);
    } catch (err) {
      console.error('Error loading annotations:', err);
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
    setShowCommentBox(false);
    setSelectedText(null);
  };

  const goToNextPage = () => {
    setPageNumber((prev) => Math.min(prev + 1, numPages || 1));
    setShowCommentBox(false);
    setSelectedText(null);
  };

  const zoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 2.5));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.6));
  };

  // Handle text selection in PDF
  const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    
    if (text && text.length > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const pageRect = pageRef.current?.getBoundingClientRect();
      
      if (pageRect) {
        const relativeX = rect.left - pageRect.left;
        const relativeY = rect.top - pageRect.top;
        
        setSelectedText({
          text,
          position: {
            x: relativeX,
            y: relativeY,
            width: rect.width,
            height: rect.height,
            pageX: rect.left,
            pageY: rect.top
          },
          range
        });
        setShowCommentBox(true);
        setCommentText('');
      }
    }
  };

  // Save annotation to database
  const saveAnnotation = async () => {
    if (!selectedText || !selectedText.text) {
      alert('Please select text to highlight');
      return;
    }

    setSavingAnnotation(true);
    try {
      const annotationData = {
        project_id: projectId,
        chapter_number: chapterNumber,
        adviser_id: adviserId,
        page_number: pageNumber,
        highlight_text: selectedText.text,
        highlight_color: highlightColor,
        position_data: {
          x: selectedText.position.x,
          y: selectedText.position.y,
          width: selectedText.position.width,
          height: selectedText.position.height
        },
        comment: commentText.trim() || null
      };

      const { data, error } = await supabase
        .from('chapter_annotations')
        .insert([annotationData])
        .select()
        .single();

      if (error) throw error;

      // Add to local state
      setAnnotations(prev => [...prev, data]);
      
      // Automatically update chapter status and feedback to indicate annotations were added
      const chapterStatusKey = `chapter_${chapterNumber}_status`;
      const chapterFeedbackKey = `chapter_${chapterNumber}_feedback`;
      
      // Get current feedback to check if we need to update it
      const { data: projectData } = await supabase
        .from('research_projects')
        .select(chapterFeedbackKey)
        .eq('id', projectId)
        .single();
      
      const currentFeedback = projectData?.[chapterFeedbackKey];
      const updateData = { [chapterStatusKey]: 'Needs Revision' };
      
      // If no feedback exists yet, add a message about annotations
      if (!currentFeedback || currentFeedback.trim() === '') {
        updateData[chapterFeedbackKey] = 'Please review the PDF annotations for detailed feedback on your chapter.';
      }
      
      const { error: statusError } = await supabase
        .from('research_projects')
        .update(updateData)
        .eq('id', projectId);

      if (statusError) {
        console.warn('Could not update chapter status/feedback:', statusError);
      } else {
        console.log(`Chapter ${chapterNumber} status and feedback updated`);
      }
      
      // Clear selection
      setSelectedText(null);
      setShowCommentBox(false);
      setCommentText('');
      window.getSelection()?.removeAllRanges();
      
      alert('Annotation saved successfully! Chapter status updated to "Needs Revision".');
    } catch (err) {
      console.error('Error saving annotation:', err);
      alert('Failed to save annotation. Please try again.');
    } finally {
      setSavingAnnotation(false);
    }
  };

  // Delete annotation
  const deleteAnnotation = async (annotationId) => {
    if (!confirm('Are you sure you want to delete this annotation?')) return;

    try {
      const { error } = await supabase
        .from('chapter_annotations')
        .delete()
        .eq('id', annotationId);

      if (error) throw error;

      setAnnotations(prev => prev.filter(a => a.id !== annotationId));
      setSelectedAnnotation(null);
      alert('Annotation deleted successfully!');
    } catch (err) {
      console.error('Error deleting annotation:', err);
      alert('Failed to delete annotation.');
    }
  };

  // Mark annotation as resolved
  const toggleResolveAnnotation = async (annotation) => {
    try {
      const { error } = await supabase
        .from('chapter_annotations')
        .update({
          resolved: !annotation.resolved,
          resolved_at: !annotation.resolved ? new Date().toISOString() : null,
          resolved_by: !annotation.resolved ? adviserId : null
        })
        .eq('id', annotation.id);

      if (error) throw error;

      setAnnotations(prev =>
        prev.map(a =>
          a.id === annotation.id
            ? { ...a, resolved: !a.resolved }
            : a
        )
      );
    } catch (err) {
      console.error('Error updating annotation:', err);
      alert('Failed to update annotation status.');
    }
  };

  // Get color class
  const getColorClass = (colorName) => {
    const color = colors.find(c => c.name === colorName);
    return color?.bg || 'bg-yellow-200';
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
              <Highlighter className="w-3 h-3 inline mr-1" />
              Select text to highlight and add comments
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
                  onMouseUp={handleTextSelection}
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

                  {/* Render existing annotations as overlays */}
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
                      title={annotation.comment || 'Click to view'}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Comment Box for new highlights */}
            {showCommentBox && selectedText && (
              <div 
                className="absolute bg-white rounded-lg shadow-xl border-2 border-blue-500 p-4 z-50"
                style={{
                  left: `${Math.min(selectedText.position.pageX, window.innerWidth - 350)}px`,
                  top: `${selectedText.position.pageY + selectedText.position.height + 10}px`,
                  width: '320px'
                }}
              >
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-700 mb-1">Selected Text:</p>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded max-h-20 overflow-y-auto">
                    "{selectedText.text}"
                  </p>
                </div>

                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-700 mb-2">Highlight Color:</p>
                  <div className="flex gap-2">
                    {colors.map((color) => (
                      <button
                        key={color.name}
                        className={`w-8 h-8 rounded border-2 ${color.bg} ${highlightColor === color.name ? color.border + ' ring-2 ring-offset-1 ring-blue-500' : 'border-gray-300'}`}
                        onClick={() => setHighlightColor(color.name)}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-700 mb-1">Comment (optional):</p>
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add your feedback or comment..."
                    className="w-full p-2 border border-gray-300 rounded text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={saveAnnotation}
                    disabled={savingAnnotation}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Save className="w-3 h-3 mr-1" />
                    {savingAnnotation ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowCommentBox(false);
                      setSelectedText(null);
                      setCommentText('');
                      window.getSelection()?.removeAllRanges();
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Annotations Sidebar */}
          <div className="w-80 bg-gray-50 border-l overflow-y-auto">
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                Annotations ({annotations.length})
              </h3>

              {annotations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Highlighter className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No annotations yet</p>
                  <p className="text-xs mt-1">Select text to add highlights</p>
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
                        <div className={`w-4 h-4 rounded ${getColorClass(annotation.highlight_color)} border`} />
                        {annotation.resolved && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                            Resolved
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-900 font-medium mb-1 line-clamp-2">
                        "{annotation.highlight_text}"
                      </p>
                      {annotation.comment && (
                        <p className="text-xs text-gray-600 mt-1 bg-gray-50 p-2 rounded">
                          {annotation.comment}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleResolveAnnotation(annotation);
                          }}
                          className="text-xs h-7 px-2"
                        >
                          <Check className="w-3 h-3 mr-1" />
                          {annotation.resolved ? 'Unresolve' : 'Resolve'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteAnnotation(annotation.id);
                          }}
                          className="text-xs h-7 px-2 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      </div>
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

export default AdviserPDFAnnotator;
