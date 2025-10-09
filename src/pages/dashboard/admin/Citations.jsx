import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Network, FileText, Eye, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/supabase/client";
import Toast from "@/components/Toast";

const CitationsPage = () => {
  const [citations, setCitations] = useState([]);
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState({ message: '', type: 'success', visible: false });

  const showToast = (message, type = 'success') => {
    setToast({ message, type, visible: true });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch all papers
    const { data: papersData, error: papersError } = await supabase
      .from("research_papers")
      .select("*")
      .order("uploaded_at", { ascending: false });

    if (papersError) {
      showToast("Error fetching papers: " + papersError.message, 'error');
      setLoading(false);
      return;
    }

    setPapers(papersData || []);

    // Fetch all citations with paper details
    const { data: citationsData, error: citationsError } = await supabase
      .from("citations")
      .select(`
        *,
        citing_paper:citing_paper_id(id, title, authors, year_published),
        cited_paper:cited_paper_id(id, title, authors, year_published)
      `)
      .order("created_at", { ascending: false });

    if (citationsError) {
      showToast("Error fetching citations: " + citationsError.message, 'error');
    } else {
      setCitations(citationsData || []);
    }

    setLoading(false);
  };

  const getCitationsForPaper = (paperId) => {
    const citing = citations.filter(c => c.citing_paper_id === paperId);
    const citedBy = citations.filter(c => c.cited_paper_id === paperId);
    return { citing, citedBy };
  };

  const viewPaperCitations = (paper) => {
    setSelectedPaper(paper);
  };

  const filteredPapers = papers.filter(paper => 
    paper.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    paper.authors.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">🔗 Citation Network</h1>
            <p className="text-gray-600">View and analyze paper citations</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">{citations.length}</div>
            <div className="text-sm text-gray-600">Total Citations</div>
          </div>
        </div>
      </div>

      {toast.visible && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(t => ({ ...t, visible: false }))}
        />
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Papers</p>
                <p className="text-2xl font-bold text-gray-900">{papers.length}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Papers with Citations</p>
                <p className="text-2xl font-bold text-gray-900">
                  {papers.filter(p => getCitationsForPaper(p.id).citing.length > 0).length}
                </p>
              </div>
              <Network className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Citations/Paper</p>
                <p className="text-2xl font-bold text-gray-900">
                  {papers.length > 0 ? (citations.length / papers.length).toFixed(1) : 0}
                </p>
              </div>
              <Network className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center">
            <Search className="w-5 h-5 mr-2" />
            Search Papers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <input
            type="text"
            placeholder="Search by title or author..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </CardContent>
      </Card>

      {/* Papers List with Citations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Papers & Citations</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : filteredPapers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No papers found</div>
          ) : (
            <div className="space-y-4">
              {filteredPapers.map((paper) => {
                const { citing, citedBy } = getCitationsForPaper(paper.id);
                return (
                  <div key={paper.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{paper.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {paper.authors} ({paper.year_published})
                        </p>
                        <div className="flex gap-4 text-sm">
                          <span className="text-blue-600 font-medium">
                            📚 Cites: {citing.length} papers
                          </span>
                          <span className="text-green-600 font-medium">
                            📖 Cited by: {citedBy.length} papers
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewPaperCitations(paper)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <a href={paper.file_url} target="_blank" rel="noopener noreferrer">
                            <FileText className="w-4 h-4 mr-1" />
                            PDF
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Citation Details Modal */}
      {selectedPaper && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">
                  Citation Details: {selectedPaper.title}
                </CardTitle>
                <Button variant="ghost" onClick={() => setSelectedPaper(null)}>
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Paper Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Authors: {selectedPaper.authors}</p>
                <p className="text-sm text-gray-600 mb-1">Year: {selectedPaper.year_published}</p>
                <p className="text-sm text-gray-600">Category: {selectedPaper.category}</p>
              </div>

              {/* Papers this one cites */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="text-blue-600 mr-2">📚</span>
                  This paper cites ({getCitationsForPaper(selectedPaper.id).citing.length}):
                </h3>
                {getCitationsForPaper(selectedPaper.id).citing.length === 0 ? (
                  <p className="text-gray-500 text-sm">No citations found in this paper</p>
                ) : (
                  <div className="space-y-2">
                    {getCitationsForPaper(selectedPaper.id).citing.map((citation) => (
                      <div key={citation.id} className="bg-blue-50 p-3 rounded border border-blue-200">
                        <p className="font-medium text-gray-900">{citation.cited_paper?.title}</p>
                        <p className="text-sm text-gray-600">
                          {citation.cited_paper?.authors} ({citation.cited_paper?.year_published})
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Papers that cite this one */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="text-green-600 mr-2">📖</span>
                  Cited by ({getCitationsForPaper(selectedPaper.id).citedBy.length}):
                </h3>
                {getCitationsForPaper(selectedPaper.id).citedBy.length === 0 ? (
                  <p className="text-gray-500 text-sm">No papers cite this one yet</p>
                ) : (
                  <div className="space-y-2">
                    {getCitationsForPaper(selectedPaper.id).citedBy.map((citation) => (
                      <div key={citation.id} className="bg-green-50 p-3 rounded border border-green-200">
                        <p className="font-medium text-gray-900">{citation.citing_paper?.title}</p>
                        <p className="text-sm text-gray-600">
                          {citation.citing_paper?.authors} ({citation.citing_paper?.year_published})
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CitationsPage;
