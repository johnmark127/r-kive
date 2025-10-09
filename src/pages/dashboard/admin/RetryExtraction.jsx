import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/supabase/client";
import Toast from "@/components/Toast";

const RetryCitationExtraction = () => {
  const [papers, setPapers] = useState([]);
  const [processing, setProcessing] = useState({});
  const [toast, setToast] = useState({ message: '', type: 'success', visible: false });

  const showToast = (message, type = 'success') => {
    setToast({ message, type, visible: true });
  };

  useEffect(() => {
    fetchPapers();
  }, []);

  const fetchPapers = async () => {
    const { data } = await supabase
      .from("research_papers")
      .select("*")
      .or("citations_extracted.is.false,extraction_status.eq.pending,extraction_status.is.null")
      .order("uploaded_at", { ascending: false });
    setPapers(data || []);
  };

  const retryExtraction = async (paper) => {
    setProcessing({ ...processing, [paper.id]: true });
    showToast("Processing citation extraction...", 'info');

    try {
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      // Call the edge function to re-process citations
      const response = await fetch("https://obbkwgawvlzyuljitqgl.functions.supabase.co/create_citation_tree", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken && { "Authorization": `Bearer ${accessToken}` })
        },
        body: JSON.stringify({
          title: paper.title,
          authors: paper.authors,
          year_published: paper.year_published,
          abstract: paper.abstract,
          category: paper.category,
          file_url: paper.file_url,
          uploaded_by: paper.uploaded_by,
          paper_id: paper.id, // Pass existing paper ID to update instead of insert
          retry: true
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        showToast(result.message || `Found ${result.citation_count} citation(s)!`, 'success');
        fetchPapers();
      } else {
        showToast(`Error: ${result.message || 'Failed to extract citations'}`, 'error');
      }
    } catch (error) {
      showToast(`Error: ${error.message}`, 'error');
    } finally {
      setProcessing({ ...processing, [paper.id]: false });
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">🔄 Retry Citation Extraction</h1>
            <p className="text-gray-600">Re-process papers that failed or are pending</p>
          </div>
          <Button onClick={fetchPapers} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {toast.visible && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(t => ({ ...t, visible: false }))}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Papers Ready for Retry ({papers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {papers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              All papers have been processed! ✅
            </div>
          ) : (
            <div className="space-y-3">
              {papers.map((paper) => (
                <div key={paper.id} className="p-4 border rounded-lg bg-white hover:bg-gray-50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {paper.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {paper.authors} ({paper.year_published})
                      </p>
                      <div className="flex gap-2">
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                          Status: {paper.extraction_status || 'pending'}
                        </span>
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                          {paper.category}
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={() => retryExtraction(paper)}
                      disabled={processing[paper.id]}
                      className="flex-shrink-0"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {processing[paper.id] ? "Processing..." : "Retry Extraction"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RetryCitationExtraction;
