 "use client";
  import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
  import { Button } from "@/components/ui/button";
  import { Upload, FileText, Calendar, User, Tag, File, Trash2, Eye } from "lucide-react";
  import { useState, useEffect } from "react";
  import Toast from "@/components/Toast";
  import { supabase } from "@/supabase/client";
  import { sendNotificationToStudents } from "../../../utils/sendNotificationToStudents";
  import * as pdfjsLib from 'pdfjs-dist';
  import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Set PDF.js worker - use the bundled worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

const UploadPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    authors: "",
    yearPublished: "",
    abstract: "",
    category: "",
    file: null,
  });

  // Toast state
  const [toast, setToast] = useState({ message: '', type: 'success', visible: false });

  // Helper to show toast
  const showToast = (message, type = 'success') => {
    setToast({ message, type, visible: true });
  };
  const [recentUploads, setRecentUploads] = useState([]);
  const [uploading, setUploading] = useState(false);

  const categories = [
    "Database expert",
    "website",
    "mobile app",
  "cai (E-Learning/Computer-Aided Instruction Systems)",
    "software/hardware",
  ];

  useEffect(() => {
    fetchRecentUploads();
  }, []);

  // Fetch the latest 5 uploads from the database
  const fetchRecentUploads = async () => {
    const { data, error } = await supabase
      .from("research_papers")
      .select("*")
      .order("uploaded_at", { ascending: false })
      .limit(5);
    if (data) setRecentUploads(data);
  };

  //handleDelete
  const handleDelete = async (paperId) => {
    if (!window.confirm("Are you sure you want to delete this paper?")) return;
    // Fetch paper title before deleting
    const { data: paperData } = await supabase
      .from("research_papers")
      .select("title")
      .eq("id", paperId)
      .single();

    const { error } = await supabase.from("research_papers").delete().eq("id", paperId);
    if (error) {
      showToast("Failed to delete paper: " + error.message, 'error');
    } else {
      // Get current user ID from Supabase Auth
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      // Log activity
      await supabase.from("activities").insert([
        {
          user_id: userId,
          type: "delete re",
          description: `Deleted research paper: ${paperData?.title || paperId}`,
          timestamp: new Date().toISOString(),
          target_id: paperId,
          meta: {
            title: paperData?.title || null,
          },
        },
      ]);
      showToast("Paper deleted successfully.", 'success');
      fetchRecentUploads();
    }
  };

  // Auto-categorize based on title
  const categorizeTitle = (title) => {
    const categoryKeywords = {
      "Database expert": [
        'database', 'db', 'sql', 'mysql', 'postgresql', 'mongodb', 'data storage',
        'data management', 'data warehouse', 'data mining', 'data analysis'
      ],
      "website": [
        'web', 'website', 'web-based', 'online', 'web application', 'web app',
        'repository', 'portal', 'system', 'management system', 'information system'
      ],
      "mobile app": [
        'mobile', 'android', 'ios', 'app', 'application', 'smartphone',
        'phone', 'mobile application', 'mobile-based'
      ],
  "cai (E-Learning/Computer-Aided Instruction Systems)": [
        'e-learning', 'elearning', 'learning', 'education', 'teaching',
        'instruction', 'tutorial', 'course', 'training', 'cai', 'computer aided',
        'educational', 'academic'
      ],
      "software/hardware": [
        'software', 'hardware', 'system', 'application', 'program',
        'computer', 'device', 'equipment', 'technology', 'tech'
      ]
    };
    const titleLower = title.toLowerCase();
    const categoryScores = {};
    Object.keys(categoryKeywords).forEach(category => {
      categoryScores[category] = 0;
      categoryKeywords[category].forEach(keyword => {
        if (titleLower.includes(keyword.toLowerCase())) {
          categoryScores[category]++;
        }
      });
    });
    const maxScore = Math.max(...Object.values(categoryScores));
    if (maxScore > 0) {
      // Return the first category with the max score
      return Object.keys(categoryScores).find(cat => categoryScores[cat] === maxScore);
    } else if (titleLower.includes('repository')) {
      return 'website';
    } else {
      return '';
    }
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    // If the title changes, auto-categorize
    if (name === 'title') {
      const autoCategory = categorizeTitle(value);
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        category: autoCategory,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: files ? files[0] : value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    // 1. Validate PDF
    if (!formData.file || formData.file.type !== "application/pdf") {
      showToast("Please select a valid PDF file.", 'warning');
      setUploading(false);
      return;
    }

    // 1.5 Extract text from PDF using PDF.js
    let extractedPdfText = "";
    try {
      showToast("Extracting text from PDF...", 'info');
      const arrayBuffer = await formData.file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      console.log(`PDF loaded: ${pdf.numPages} pages`);
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        // Join with spaces and normalize spacing
        const pageText = textContent.items.map(item => item.str).join(' ');
        // Normalize: replace multiple spaces with single space
        const normalizedPageText = pageText.replace(/\s+/g, ' ').trim();
        extractedPdfText += normalizedPageText + ' ';
        console.log(`Page ${i} text:`, normalizedPageText);
      }
      
      extractedPdfText = extractedPdfText.trim();
      console.log(`Extracted ${extractedPdfText.length} characters from PDF`);
      console.log(`Full extracted text:`, extractedPdfText);
    } catch (pdfError) {
      console.error("PDF text extraction failed:", pdfError);
      showToast("Warning: Could not extract text from PDF. Citation detection may not work.", 'warning');
    }

    // 2. Upload to Supabase Storage
    const filename = `${Date.now()}_${formData.file.name}`;
    const { error: uploadError } = await supabase
      .storage
      .from("research-papers")
      .upload(filename, formData.file);

    if (uploadError) {
      showToast("Failed to upload file: " + uploadError.message, 'error');
      setUploading(false);
      return;
    }

    // 3. Get public URL
    const { data: urlData } = supabase
      .storage
      .from("research-papers")
      .getPublicUrl(filename);
    const fileUrl = urlData.publicUrl;
      console.log('Calling sendNotificationToStudents');
      // Notify all students about the new paper upload
    // 4. Get current user ID from Supabase Auth
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    if (!userId) {
      showToast("You must be signed in to upload a research paper.", 'error');
      setUploading(false);
      return;
    }


    // 5. Call Edge Function for citation logic and paper insertion (with Authorization header)
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      const edgeRes = await fetch("https://obbkwgawvlzyuljitqgl.functions.supabase.co/create_citation_tree", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken && { "Authorization": `Bearer ${accessToken}` })
        },
        body: JSON.stringify({
          title: formData.title,
          authors: formData.authors,
          year_published: parseInt(formData.yearPublished),
          abstract: formData.abstract,
          category: formData.category,
          file_url: fileUrl,
          uploaded_by: userId,
          extracted_text: extractedPdfText // Send extracted text from client
        })
      });
      
      console.log('Sent to Edge Function:', {
        title: formData.title,
        extracted_text_length: extractedPdfText.length,
        extracted_text_preview: extractedPdfText.substring(0, 100)
      });
      const edgeResult = await edgeRes.json();
      if (edgeRes.ok && edgeResult.success) {
        // 6. Log activity in activities table using the paper ID from the edge function
        await supabase.from("activities").insert([
          {
            user_id: userId,
            type: "upload",
            description: `Uploaded new research paper: ${formData.title}`,
            timestamp: new Date().toISOString(),
            target_id: edgeResult.paper_id,
            meta: {
              title: formData.title,
              authors: formData.authors,
              year_published: formData.yearPublished,
            },
          },
        ]);

        // Call notification function after successful upload and activity log
        await sendNotificationToStudents(
          "New paper uploaded",
          `A new research paper titled '${formData.title}' has been uploaded. Check it out!`
        );
        
        // Show success message with citation count or warning
        if (edgeResult.warning) {
          showToast(`Research paper uploaded! ⚠️ ${edgeResult.warning}`, 'warning');
        } else if (edgeResult.message) {
          showToast(edgeResult.message, 'success');
        } else {
          showToast(`Research paper uploaded! Citations created: ${edgeResult.citation_count}`, 'success');
        }
      } else {
        showToast("Failed to upload paper: " + (edgeResult.message || "Unknown error"), 'error');
        setUploading(false);
        return;
      }
    } catch (err) {
      showToast("Failed to upload paper: " + err.message, 'error');
      setUploading(false);
      return;
    }

    setUploading(false);
    setFormData({
      title: "",
      authors: "",
      yearPublished: "",
      abstract: "",
      category: "",
      file: null,
    });
    e.target.reset();
    fetchRecentUploads();
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
  {/* Auth status removed */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Upload Research Papers</h1>
            <p className="text-gray-600">Upload and manage research papers for students</p>
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

      {/* Upload Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center">
            <Upload className="w-5 h-5 mr-2" />
            Upload New Research Paper
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Title */}
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium text-gray-700 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter research paper title"
                />
              </div>
              {/* Authors */}
              <div className="space-y-2">
                <label htmlFor="authors" className="text-sm font-medium text-gray-700 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Authors
                </label>
                <input
                  type="text"
                  id="authors"
                  name="authors"
                  value={formData.authors}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter authors (comma-separated)"
                />
              </div>
              {/* Year */}
              <div className="space-y-2">
                <label htmlFor="yearPublished" className="text-sm font-medium text-gray-700 flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Year Published
                </label>
                <input
                  type="number"
                  id="yearPublished"
                  name="yearPublished"
                  value={formData.yearPublished}
                  onChange={handleInputChange}
                  min="1900"
                  max="2100"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 2024"
                />
              </div>
              {/* Category */}
              <div className="space-y-2">
                <label htmlFor="category" className="text-sm font-medium text-gray-700 flex items-center">
                  <Tag className="w-4 h-4 mr-2" />
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- Select Category --</option>
                  {categories.map((category, index) => (
                    <option key={index} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {/* Abstract */}
            <div className="space-y-2">
              <label htmlFor="abstract" className="text-sm font-medium text-gray-700">
                Abstract
              </label>
              <textarea
                id="abstract"
                name="abstract"
                value={formData.abstract}
                onChange={handleInputChange}
                rows={6}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Enter the research paper abstract..."
              />
            </div>
            {/* File Upload */}
            <div className="space-y-2">
              <label htmlFor="file" className="text-sm font-medium text-gray-700 flex items-center">
                <File className="w-4 h-4 mr-2" />
                Upload PDF
              </label>
              <input
                type="file"
                id="file"
                name="file"
                onChange={handleInputChange}
                accept=".pdf"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            <Button type="submit" className="w-full md:w-auto bg-blue-600 hover:bg-blue-700" disabled={uploading}>
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? "Uploading..." : "Upload Research Paper"}
            </Button>
          </form>
        </CardContent>
      </Card>
      {/* Recently Uploaded Papers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Recently Uploaded Papers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Title</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Authors</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Year</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Upload Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentUploads.map((paper) => (
                  <tr key={paper.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-medium text-gray-900 max-w-xs truncate">{paper.title}</div>
                    </td>
                    <td className="py-4 px-4 text-gray-600 max-w-xs truncate">{paper.authors}</td>
                    <td className="py-4 px-4 text-gray-600">{paper.year_published}</td>
                    <td className="py-4 px-4 text-gray-600">
                      {paper.uploaded_at
                        ? new Date(paper.uploaded_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : ""}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <a href={paper.file_url} target="_blank" rel="noopener noreferrer">
                            <Eye className="w-4 h-4" />
                          </a>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                          title="Delete"
                          onClick={() => handleDelete(paper.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {recentUploads.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-gray-400 text-center py-6">
                      No uploads yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default UploadPage;