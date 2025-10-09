import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Link } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/supabase/client";
import Toast from "@/components/Toast";

const ManualCitationsPage = () => {
  const [papers, setPapers] = useState([]);
  const [citations, setCitations] = useState([]);
  const [selectedCiting, setSelectedCiting] = useState("");
  const [selectedCited, setSelectedCited] = useState("");
  const [toast, setToast] = useState({ message: '', type: 'success', visible: false });

  const showToast = (message, type = 'success') => {
    setToast({ message, type, visible: true });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Fetch papers
    const { data: papersData } = await supabase
      .from("research_papers")
      .select("*")
      .order("title");
    setPapers(papersData || []);

    // Fetch citations
    const { data: citationsData } = await supabase
      .from("citations")
      .select(`
        *,
        citing_paper:citing_paper_id(id, title, authors),
        cited_paper:cited_paper_id(id, title, authors)
      `);
    setCitations(citationsData || []);
  };

  const addCitation = async () => {
    if (!selectedCiting || !selectedCited) {
      showToast("Please select both papers", 'error');
      return;
    }

    if (selectedCiting === selectedCited) {
      showToast("A paper cannot cite itself", 'error');
      return;
    }

    // Check if citation already exists
    const exists = citations.some(
      c => c.citing_paper_id === selectedCiting && c.cited_paper_id === selectedCited
    );

    if (exists) {
      showToast("This citation already exists", 'warning');
      return;
    }

    const { error } = await supabase
      .from("citations")
      .insert([{
        citing_paper_id: selectedCiting,
        cited_paper_id: selectedCited
      }]);

    if (error) {
      showToast("Error adding citation: " + error.message, 'error');
    } else {
      showToast("Citation added successfully!", 'success');
      setSelectedCiting("");
      setSelectedCited("");
      fetchData();
    }
  };

  const deleteCitation = async (citationId) => {
    if (!confirm("Delete this citation?")) return;

    const { error } = await supabase
      .from("citations")
      .delete()
      .eq("id", citationId);

    if (error) {
      showToast("Error deleting citation: " + error.message, 'error');
    } else {
      showToast("Citation deleted", 'success');
      fetchData();
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">🔗 Manual Citation Manager</h1>
        <p className="text-gray-600">Add and manage citations manually (for testing)</p>
      </div>

      {toast.visible && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(t => ({ ...t, visible: false }))}
        />
      )}

      {/* Add Citation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            Add New Citation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">This paper (citing):</label>
              <select
                value={selectedCiting}
                onChange={(e) => setSelectedCiting(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">-- Select Paper --</option>
                {papers.map(paper => (
                  <option key={paper.id} value={paper.id}>
                    {paper.title} ({paper.year_published})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Cites this paper (cited):</label>
              <select
                value={selectedCited}
                onChange={(e) => setSelectedCited(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">-- Select Paper --</option>
                {papers.map(paper => (
                  <option key={paper.id} value={paper.id}>
                    {paper.title} ({paper.year_published})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button onClick={addCitation} className="w-full md:w-auto">
            <Link className="w-4 h-4 mr-2" />
            Add Citation
          </Button>

          {selectedCiting && selectedCited && selectedCiting !== selectedCited && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>Preview:</strong> "
                {papers.find(p => p.id === selectedCiting)?.title}" 
                <span className="mx-2">→ cites →</span>
                "{papers.find(p => p.id === selectedCited)?.title}"
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Existing Citations */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Citations ({citations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {citations.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No citations yet. Add one above!</p>
          ) : (
            <div className="space-y-3">
              {citations.map(citation => (
                <div key={citation.id} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg border">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 mb-1">
                      {citation.citing_paper?.title}
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      by {citation.citing_paper?.authors}
                    </p>
                    <div className="flex items-center text-sm text-blue-600">
                      <span>→ cites →</span>
                      <span className="ml-2 font-medium">{citation.cited_paper?.title}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteCitation(citation.id)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
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
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{papers.length}</div>
              <div className="text-sm text-gray-600">Total Papers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{citations.length}</div>
              <div className="text-sm text-gray-600">Total Citations</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {papers.filter(p => citations.some(c => c.citing_paper_id === p.id)).length}
              </div>
              <div className="text-sm text-gray-600">Papers with Citations</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {papers.length > 0 ? (citations.length / papers.length).toFixed(1) : 0}
              </div>
              <div className="text-sm text-gray-600">Avg Citations/Paper</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManualCitationsPage;
