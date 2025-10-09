import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, FileText, CheckCircle, XCircle, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/supabase/client";

const CitationDebugPage = () => {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPapers();
  }, []);

  const fetchPapers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("research_papers")
      .select("*")
      .order("uploaded_at", { ascending: false });
    setPapers(data || []);
    setLoading(false);
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'completed_with_citations':
      case 'completed_no_citations':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed_no_text':
      case 'failed_error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'processing':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      'pending': 'Pending',
      'processing': 'Processing',
      'completed_with_citations': 'Completed (Citations Found)',
      'completed_no_citations': 'Completed (No Citations)',
      'failed_no_text': 'Failed (No Text Extracted)',
      'failed_error': 'Failed (Error)'
    };
    return labels[status] || status || 'Unknown';
  };

  const getStatusColor = (status) => {
    if (status?.includes('completed')) return 'bg-green-50 border-green-200';
    if (status?.includes('failed')) return 'bg-red-50 border-red-200';
    if (status === 'processing') return 'bg-yellow-50 border-yellow-200';
    return 'bg-gray-50 border-gray-200';
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">🔍 Citation Extraction Debug</h1>
            <p className="text-gray-600">View PDF extraction status and debug information</p>
          </div>
          <Button onClick={fetchPapers} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Extraction Status Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : papers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No papers uploaded yet</div>
          ) : (
            <div className="space-y-3">
              {papers.map((paper) => (
                <div key={paper.id} className={`p-4 rounded-lg border ${getStatusColor(paper.extraction_status)}`}>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getStatusIcon(paper.extraction_status)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1 truncate">
                        {paper.title}
                      </h3>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Authors: {paper.authors} ({paper.year_published})</p>
                        <p>Uploaded: {new Date(paper.uploaded_at).toLocaleString()}</p>
                        {paper.abstract && (
                          <p>Abstract length: {paper.abstract.length} chars</p>
                        )}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getStatusLabel(paper.extraction_status)}
                        </span>
                        
                        {paper.citations_extracted && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✓ Extracted
                          </span>
                        )}
                        
                        {paper.citations_extracted_at && (
                          <span className="text-xs text-gray-500">
                            Extracted: {new Date(paper.citations_extracted_at).toLocaleString()}
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                        >
                          <a href={paper.file_url} target="_blank" rel="noopener noreferrer">
                            <FileText className="w-3 h-3 mr-1" />
                            View PDF
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Debug Info */}
                  {(paper.extraction_status?.includes('failed') || !paper.citations_extracted) && (
                    <div className="mt-3 pt-3 border-t border-gray-300">
                      <details className="text-sm">
                        <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
                          Debug Information
                        </summary>
                        <div className="mt-2 p-3 bg-white rounded border space-y-1 text-xs font-mono">
                          <p><strong>ID:</strong> {paper.id}</p>
                          <p><strong>Status:</strong> {paper.extraction_status || 'null'}</p>
                          <p><strong>Citations Extracted:</strong> {paper.citations_extracted ? 'true' : 'false'}</p>
                          <p><strong>File URL:</strong> <a href={paper.file_url} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">{paper.file_url}</a></p>
                          
                          {paper.extraction_status?.includes('failed') && (
                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                              <p className="text-red-800 font-semibold">Possible Issues:</p>
                              <ul className="list-disc list-inside text-red-700 mt-1">
                                {paper.extraction_status === 'failed_no_text' && (
                                  <>
                                    <li>PDF might be scanned images (not text-based)</li>
                                    <li>PDF might have complex formatting</li>
                                    <li>Try re-uploading or use a different PDF</li>
                                  </>
                                )}
                                {paper.extraction_status === 'failed_error' && (
                                  <>
                                    <li>Error during PDF processing</li>
                                    <li>Check Supabase function logs</li>
                                    <li>PDF might be corrupted</li>
                                  </>
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{papers.length}</div>
              <div className="text-sm text-gray-600">Total Papers</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {papers.filter(p => p.citations_extracted).length}
              </div>
              <div className="text-sm text-gray-600">Successfully Extracted</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {papers.filter(p => p.extraction_status?.includes('failed')).length}
              </div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {papers.filter(p => p.extraction_status === 'pending' || p.extraction_status === 'processing').length}
              </div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CitationDebugPage;
