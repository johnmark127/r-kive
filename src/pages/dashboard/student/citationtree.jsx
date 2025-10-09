"use client"

import { useState, useEffect, useRef } from "react"
import { supabase } from "@/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ZoomIn, ZoomOut, RotateCcw, Share2, BookOpen, Users, Calendar } from "lucide-react"
import { useLocation } from "react-router-dom"
import * as d3 from "d3"

export default function CitationTreePage() {
  const location = useLocation()
  const [selectedPaper, setSelectedPaper] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [citationCounts, setCitationCounts] = useState({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [hoveredPaper, setHoveredPaper] = useState(null)
  const [yearFilter, setYearFilter] = useState("all")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const svgRef = useRef(null)
  const containerRef = useRef(null)
  const zoomRef = useRef(null)

  // Dynamic citation tree data
  const [citationData, setCitationData] = useState(null)
  
  // Semantic similarity features
  const [semanticSimilarities, setSemanticSimilarities] = useState({})
  const [showSimilarityLines, setShowSimilarityLines] = useState(true)
  const [similarityThreshold, setSimilarityThreshold] = useState(0.6)
  const [relatedPapers, setRelatedPapers] = useState([])
  const [showSemanticFilters, setShowSemanticFilters] = useState(false)
  
  // Export and sharing features
  const [isExporting, setIsExporting] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  
  // Bookmarking features
  const [bookmarkedPapers, setBookmarkedPapers] = useState(new Set())
  const [user, setUser] = useState(null)
  
  // Enhanced paper details
  const [detailedPaperInfo, setDetailedPaperInfo] = useState(null)
  const [showPaperDetails, setShowPaperDetails] = useState(false)

  // Check if a paper was passed via navigation state
  useEffect(() => {
    if (location.state && location.state.selectedPaper) {
      setSelectedPaper(location.state.selectedPaper)
      // Clear the navigation state to prevent reselection on subsequent renders
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  // Get logged-in user and fetch bookmarks
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        const { data, error } = await supabase
          .from("bookmarks")
          .select("paper_id")
          .eq("user_id", user.id)
        if (!error && data) {
          setBookmarkedPapers(new Set(data.map((b) => b.paper_id)))
        }
      }
    }
    getUser()
  }, [])

  // Calculate semantic similarity between papers
  const calculateSemanticSimilarity = (paper1, paper2) => {
    if (!paper1 || !paper2) return 0;
    
    // Combine title, abstract, and keywords for analysis
    const text1 = `${paper1.title || ''} ${paper1.abstract || ''} ${paper1.category || ''}`.toLowerCase();
    const text2 = `${paper2.title || ''} ${paper2.abstract || ''} ${paper2.category || ''}`.toLowerCase();
    
    // Simple keyword-based similarity (can be enhanced with more sophisticated NLP)
    const words1 = new Set(text1.split(/\s+/).filter(word => word.length > 3));
    const words2 = new Set(text2.split(/\s+/).filter(word => word.length > 3));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    const jaccardSimilarity = intersection.size / union.size;
    
    // Category bonus
    const categoryBonus = (paper1.category === paper2.category) ? 0.2 : 0;
    
    // Year proximity bonus (papers from similar years might be more related)
    const yearDiff = Math.abs((paper1.year_published || 0) - (paper2.year_published || 0));
    const yearBonus = Math.max(0, (10 - yearDiff) * 0.01);
    
    return Math.min(1, jaccardSimilarity + categoryBonus + yearBonus);
  };

  // Fetch semantically related papers
  const fetchSemanticallySimilarPapers = async (mainPaper) => {
    try {
      const { data: allPapers, error } = await supabase
        .from('research_papers')
        .select('id, title, authors, year_published, abstract, category')
        .neq('id', mainPaper.id)
        .limit(50); // Limit for performance
      
      if (error || !allPapers) return [];
      
      const similarities = {};
      const related = [];
      
      allPapers.forEach(paper => {
        const similarity = calculateSemanticSimilarity(mainPaper, paper);
        if (similarity >= similarityThreshold) {
          similarities[paper.id] = similarity;
          related.push({ ...paper, similarity });
        }
      });
      
      setSemanticSimilarities(similarities);
      return related.sort((a, b) => b.similarity - a.similarity).slice(0, 10);
    } catch (error) {
      console.error('Error fetching semantically similar papers:', error);
      return [];
    }
  };

  // Bookmarking functions
  const addBookmark = async (paperId, paperTitle) => {
    if (!user) {
      alert("You must be logged in to bookmark papers.")
      return
    }
    if (bookmarkedPapers.has(paperId)) return

    const { error } = await supabase.from("bookmarks").insert([
      {
        user_id: user.id,
        paper_id: paperId,
      },
    ])

    if (!error) {
      setBookmarkedPapers(new Set([...bookmarkedPapers, paperId]))
      alert(`"${paperTitle}" has been bookmarked!`)
    } else {
      alert("Failed to add bookmark.")
    }
  }

  const removeBookmark = async (paperId, paperTitle) => {
    if (!user) return
    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("user_id", user.id)
      .eq("paper_id", paperId)
    if (!error) {
      const updated = new Set(bookmarkedPapers)
      updated.delete(paperId)
      setBookmarkedPapers(updated)
      alert(`Bookmark removed for "${paperTitle}".`)
    } else {
      alert("Failed to remove bookmark.")
    }
  }

  // Export functions
  const exportAsImage = async () => {
    setIsExporting(true)
    try {
      const svg = svgRef.current
      const svgData = new XMLSerializer().serializeToString(svg)
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      canvas.width = svg.clientWidth || 800
      canvas.height = svg.clientHeight || 600
      
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(svgBlob)
      
      img.onload = () => {
        ctx.fillStyle = '#f3f4f6'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)
        
        canvas.toBlob((blob) => {
          const link = document.createElement('a')
          link.download = `citation-tree-${selectedPaper?.title?.substring(0, 30) || 'export'}.png`
          link.href = URL.createObjectURL(blob)
          link.click()
        })
        URL.revokeObjectURL(url)
      }
      img.src = url
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export image')
    }
    setIsExporting(false)
  }

  const shareNetwork = () => {
    if (navigator.share && selectedPaper) {
      navigator.share({
        title: `Citation Network: ${selectedPaper.title}`,
        text: `Explore the citation network for "${selectedPaper.title}" by ${selectedPaper.authors}`,
        url: window.location.href
      })
    } else {
      // Fallback to clipboard
      const shareText = `Check out this citation network for "${selectedPaper?.title}" by ${selectedPaper?.authors}: ${window.location.href}`
      navigator.clipboard.writeText(shareText).then(() => {
        alert('Citation network link copied to clipboard!')
      })
    }
  }

  const exportCitationData = () => {
    if (!citationData) return
    
    const exportData = {
      mainPaper: {
        title: citationData.name,
        authors: citationData.author,
        year: citationData.year,
        citations: citationData.citations
      },
      directCitations: citationData.children || [],
      semanticRelated: citationData.semanticRelated || [],
      exportDate: new Date().toISOString(),
      similarityThreshold: similarityThreshold
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const link = document.createElement('a')
    link.download = `citation-data-${selectedPaper?.title?.substring(0, 30) || 'export'}.json`
    link.href = URL.createObjectURL(blob)
    link.click()
  }

  // Fetch detailed paper information
  const fetchPaperDetails = async (paperId) => {
    try {
      const { data, error } = await supabase
        .from('research_papers')
        .select('*')
        .eq('id', paperId)
        .single()
      
      if (!error && data) {
        // Get citation count
        const { count } = await supabase
          .from('citations')
          .select('*', { count: 'exact', head: true })
          .eq('cited_paper_id', paperId)
        
        const paperWithDetails = { ...data, citationCount: count || 0 }
        setDetailedPaperInfo(paperWithDetails)
        // Don't automatically set as selected paper - just show modal for viewing
        setShowPaperDetails(true)
      }
    } catch (error) {
      console.error('Error fetching paper details:', error)
    }
  }

  // Fetch citation tree for selected paper
  useEffect(() => {
    const fetchCitationTree = async () => {
      if (!selectedPaper) {
        setCitationData(null)
        setRelatedPapers([])
        setSemanticSimilarities({})
        return
      }
      // Fetch direct citations (papers cited BY this paper)
      const { data: citations, error: citationsError } = await supabase
        .from("citations")
        .select("cited_paper_id")
        .eq("citing_paper_id", selectedPaper.id)
      console.log('CITATIONS QUERY:', citations, citationsError)
      if (citationsError) {
        setCitationData(null)
        return
      }
      const citedPaperIds = citations.map((c) => c.cited_paper_id)
      let citedPapers = []
      const childCounts = {};
      let mainPaperCitedCount = 0;
      // Debug: log selectedPaper.id
      console.log('Selected Paper ID for incoming citation count:', selectedPaper.id);
      // Fetch how many times the main paper is cited by others
      const { count: mainCount, error: mainCountError } = await supabase
        .from('citations')
        .select('*', { count: 'exact', head: true })
        .eq('cited_paper_id', selectedPaper.id)
      console.log('Main paper incoming citation count:', mainCount, 'Error:', mainCountError);
      mainPaperCitedCount = mainCountError ? 0 : mainCount;

      // Patch: update selectedPaper to include citations count
      if (selectedPaper && selectedPaper.citations !== mainPaperCitedCount) {
        setSelectedPaper({ ...selectedPaper, citations: mainPaperCitedCount })
      }

      if (citedPaperIds.length > 0) {
        const { data: papers, error: papersError } = await supabase
          .from("research_papers")
          .select("id, title, authors, year_published, views")
          .in("id", citedPaperIds)
        console.log('CITED PAPERS QUERY:', papers, papersError)
        if (!papersError) citedPapers = papers

        // Fetch citation counts for each cited paper (children)
        if (citedPapers.length > 0) {
          await Promise.all(
            citedPapers.map(async (paper) => {
              const { count, error: countError } = await supabase
                .from('citations')
                .select('*', { count: 'exact', head: true })
                .eq('cited_paper_id', paper.id)
              childCounts[paper.id] = countError ? 0 : count
            })
          )
        }
      }
      // Fetch semantically similar papers
      const similarPapers = await fetchSemanticallySimilarPapers(selectedPaper);
      setRelatedPapers(similarPapers);
      
      setCitationData({
        id: selectedPaper.id,
        name: selectedPaper.title,
        author: selectedPaper.authors,
        year: selectedPaper.year_published,
        citations: mainPaperCitedCount,
        isMain: true,
        children: citedPapers.map((p) => ({
          id: p.id,
          name: p.title,
          author: p.authors,
          year: p.year_published,
          citations: childCounts[p.id] !== undefined ? childCounts[p.id] : 0,
        })),
        semanticRelated: similarPapers.slice(0, 5).map((p) => ({
          id: p.id,
          name: p.title,
          author: p.authors,
          year: p.year_published,
          citations: 0, // We could fetch this if needed
          similarity: p.similarity,
          isSemanticRelated: true
        }))
      })
    }
    fetchCitationTree()
    // eslint-disable-next-line
  }, [selectedPaper, similarityThreshold])

  useEffect(() => {
    if (containerRef.current && citationData) {
      renderCitationTree()
    }
    // eslint-disable-next-line
  }, [citationData])

  // Search research papers from Supabase and fetch citation counts
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      setCitationCounts({})
      return
    }
    setLoading(true)
    setError(null)
    const fetchPapers = async () => {
      const { data, error } = await supabase
        .from("research_papers")
        .select("id, title, authors, year_published, abstract, category, file_url, uploaded_by, uploaded_at, views")
        .ilike("title", `%${searchQuery}%`)
        .limit(10)
      if (error) {
        setError("Error fetching papers")
        setSearchResults([])
        setCitationCounts({})
      } else {
        setSearchResults(data)
        // Fetch citation counts for each paper
        const counts = {}
        await Promise.all(
          data.map(async (paper) => {
            const { count, error: countError } = await supabase
              .from('citations')
              .select('*', { count: 'exact', head: true })
              .eq('cited_paper_id', paper.id)
            counts[paper.id] = countError ? 0 : count
          })
        )
        setCitationCounts(counts)
      }
      setLoading(false)
    }
    const delayDebounce = setTimeout(fetchPapers, 400)
    return () => clearTimeout(delayDebounce)
  }, [searchQuery])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsModalOpen(false)
        setSelectedPaper(null)
        setHoveredPaper(null)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const renderCitationTree = () => {
    d3.select(svgRef.current).selectAll("*").remove()
    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    if (!citationData) return
    
    // Include semantic related papers in nodes
    const nodes = [
      {
        id: citationData.id,
        name: citationData.name,
        author: citationData.author,
        year: citationData.year,
        citations: citationData.citations,
        isMain: true,
        x: width / 2,
        y: height / 2,
      },
      ...(citationData.children || []).map((child) => ({
        id: child.id,
        name: child.name,
        author: child.author,
        year: child.year,
        citations: child.citations,
        isMain: false,
        isCitation: true,
        x: 60 + Math.random() * (width - 120),
        y: 60 + Math.random() * (height - 120),
      })),
      ...(citationData.semanticRelated || []).map((related) => ({
        id: related.id,
        name: related.name,
        author: related.author,
        year: related.year,
        citations: related.citations,
        similarity: related.similarity,
        isMain: false,
        isSemanticRelated: true,
        x: 60 + Math.random() * (width - 120),
        y: 60 + Math.random() * (height - 120),
      })),
    ]

    // Citation links (solid lines)
    const citationLinks = (citationData.children || []).map((child) => ({
      source: citationData.id,
      target: child.id,
      type: 'citation'
    }))
    
    // Semantic similarity links (dashed lines)
    const semanticLinks = showSimilarityLines ? (citationData.semanticRelated || []).map((related) => ({
      source: citationData.id,
      target: related.id,
      type: 'semantic',
      similarity: related.similarity
    })) : []
    
    const allLinks = [...citationLinks, ...semanticLinks]

    const svg = d3
      .select(svgRef.current)
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", `0 0 ${width} ${height}`)

    // Add a background rectangle for better contrast
    svg.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "#f3f4f6") // Tailwind gray-100
    const g = svg.append("g")

    const zoom = d3
      .zoom()
      .scaleExtent([0.3, 3])
      .on("zoom", (event) => g.attr("transform", event.transform))
    svg.call(zoom)
    zoomRef.current = zoom

    const link = g
      .selectAll(".link")
      .data(allLinks)
      .enter()
      .append("line")
      .attr("class", "link")
      .attr("stroke", (d) => d.type === 'semantic' ? "#10b981" : "#d1d5db")
      .attr("stroke-width", (d) => d.type === 'semantic' ? 2 : 1)
      .attr("stroke-dasharray", (d) => d.type === 'semantic' ? "5,5" : "none")
      .attr("opacity", (d) => d.type === 'semantic' ? 0.8 : 0.6)
      .attr("x1", (d) => nodes.find((n) => n.id === d.source).x)
      .attr("y1", (d) => nodes.find((n) => n.id === d.source).y)
      .attr("x2", (d) => nodes.find((n) => n.id === d.target).x)
      .attr("y2", (d) => nodes.find((n) => n.id === d.target).y)

    const node = g
      .selectAll(".node")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", (d) => `translate(${d.x},${d.y})`)
      .style("cursor", "pointer")

    // Add drag behavior for interactive pull effect
    const drag = d3.drag()
      .on("start", function (event, d) {
        d3.select(this).raise().select("circle").attr("stroke", "#6366f1").attr("stroke-width", 4)
      })
      .on("drag", function (event, d) {
        d.x = event.x
        d.y = event.y
        d3.select(this).attr("transform", `translate(${d.x},${d.y})`)
        // Update links
        g.selectAll(".link")
          .filter(linkData => linkData.source === d.id || linkData.target === d.id)
          .attr("x1", linkData => nodes.find(n => n.id === linkData.source).x)
          .attr("y1", linkData => nodes.find(n => n.id === linkData.source).y)
          .attr("x2", linkData => nodes.find(n => n.id === linkData.target).x)
          .attr("y2", linkData => nodes.find(n => n.id === linkData.target).y)
      })
      .on("end", function (event, d) {
        d3.select(this).select("circle").attr("stroke", d.isMain ? "#374151" : "#3b82f6").attr("stroke-width", d.isMain ? 0 : 2)
      })
    node.call(drag)

    node
      .append("circle")
      .attr("r", (d) => (d.isMain ? 12 : 8))
      .attr("fill", (d) => {
        if (d.isMain) return "#374151"
        if (d.isSemanticRelated) return "#dcfce7" // Light green for semantic
        return "white" // Citation nodes
      })
      .attr("stroke", (d) => {
        if (d.isMain) return "#374151"
        if (d.isSemanticRelated) return "#10b981" // Green for semantic
        return "#3b82f6" // Blue for citation
      })
      .attr("stroke-width", (d) => (d.isMain ? 0 : 2))

    node
      .append("text")
      .attr("dy", 25)
      .attr("text-anchor", "middle")
      .text((d) => d.name)
      .style("font-size", "12px")
      .style("font-family", "system-ui, -apple-system, sans-serif")
      .style("fill", "#374151")
      .style("font-weight", (d) => (d.isMain ? "600" : "400"))

  // Removed axis labels for 'MORE CITATIONS' and 'MORE RECENTLY PUBLISHED'

    node
      .on("mouseover", function (event, d) {
        setHoveredPaper(d)

        // Highlight connected links
        link
          .transition()
          .duration(200)
          .attr("stroke", (linkData) => {
            return linkData.source === d.id || linkData.target === d.id ? "#3b82f6" : "#d1d5db"
          })
          .attr("stroke-width", (linkData) => {
            return linkData.source === d.id || linkData.target === d.id ? 2 : 1
          })
          .attr("opacity", (linkData) => {
            return linkData.source === d.id || linkData.target === d.id ? 1 : 0.3
          })

        // Highlight connected nodes
        node
          .selectAll("circle")
          .transition()
          .duration(200)
          .attr("opacity", (nodeData) => {
            if (nodeData.id === d.id) return 1
            const isConnected = links.some(
              (link) =>
                (link.source === d.id && link.target === nodeData.id) ||
                (link.target === d.id && link.source === nodeData.id),
            )
            return isConnected ? 1 : 0.4
          })

        // Enhanced hover effect for current node
        if (!d.isMain) {
          d3.select(this).select("circle").transition().duration(200).attr("fill", "#dbeafe").attr("r", 10)
        }

        // Show tooltip-like effect
        d3.select(this).select("text").transition().duration(200).style("font-weight", "600").style("font-size", "13px")
      })
      .on("mouseout", function (event, d) {
        setHoveredPaper(null)

        // Reset all links
        link.transition().duration(300).attr("stroke", "#d1d5db").attr("stroke-width", 1).attr("opacity", 0.6)

        // Reset all nodes
        node.selectAll("circle").transition().duration(300).attr("opacity", 1)

        // Reset current node
        if (!d.isMain) {
          d3.select(this).select("circle").transition().duration(300).attr("fill", "white").attr("r", 8)
        }

        // Reset text
        d3.select(this)
          .select("text")
          .transition()
          .duration(300)
          .style("font-weight", d.isMain ? "600" : "400")
          .style("font-size", "12px")
      })
      .on("click", (event, d) => {
        event.stopPropagation()

        // Animate the clicked node
        d3.select(event.currentTarget)
          .select("circle")
          .transition()
          .duration(150)
          .attr("r", d.isMain ? 15 : 12)
          .transition()
          .duration(150)
          .attr("r", d.isMain ? 12 : 8)

        // Fetch detailed information and show modal for any clicked node
        fetchPaperDetails(d.id)
        setIsModalOpen(true)
      })
  }

  const handleZoomIn = () => {
    if (zoomRef.current && svgRef.current) {
      d3.select(svgRef.current).transition().duration(250).call(zoomRef.current.scaleBy, 1.2)
    }
  }

  const handleZoomOut = () => {
    if (zoomRef.current && svgRef.current) {
      d3.select(svgRef.current).transition().duration(250).call(zoomRef.current.scaleBy, 0.8)
    }
  }

  const handleReset = () => {
    if (zoomRef.current && svgRef.current && containerRef.current) {
      const width = containerRef.current.clientWidth
      const height = containerRef.current.clientHeight
      const initialScale = 0.9
      const initialTranslate = [(width * (1 - initialScale)) / 2, (height * (1 - initialScale)) / 2]
      d3.select(svgRef.current)
        .transition()
        .duration(500)
        .call(
          zoomRef.current.transform,
          d3.zoomIdentity.translate(initialTranslate[0], initialTranslate[1]).scale(initialScale),
        )
    }
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">Citation Network</h1>
            <p className="text-gray-600">Academic literature mapping</p>
          </div>
          <div className="flex items-center space-x-2">
            {selectedPaper && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowExportModal(true)}
                  className="whitespace-nowrap"
                >
                  <Share2 className="w-4 h-4 mr-1" />
                  Export & Share
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (bookmarkedPapers.has(selectedPaper.id)) {
                      removeBookmark(selectedPaper.id, selectedPaper.title)
                    } else {
                      addBookmark(selectedPaper.id, selectedPaper.title)
                    }
                  }}
                  className={bookmarkedPapers.has(selectedPaper.id) ? "bg-blue-50 text-blue-600" : ""}
                >
                  <BookOpen className="w-4 h-4 mr-1" />
                  {bookmarkedPapers.has(selectedPaper.id) ? "Bookmarked" : "Bookmark"}
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSemanticFilters(!showSemanticFilters)}
              className="whitespace-nowrap"
            >
              Semantic Filters
            </Button>
            <div className="relative">
              <input
                type="text"
                placeholder="Search papers..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setSelectedPaper(null)
                }}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-96"
                autoComplete="on"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              {loading && (
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">Loading...</div>
              )}
              {error && (
                <div className="absolute left-2 top-full mt-1 text-xs text-red-500">{error}</div>
              )}
              {searchResults.length > 0 && (
                <ul className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 max-h-60 overflow-y-auto">
                  {searchResults.map((paper) => (
                    <li
                      key={paper.id}
                      className="px-4 py-2 text-xs text-gray-800 hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer rounded-lg mx-1 my-1"
                      style={{ fontSize: '0.85rem', fontWeight: 500, letterSpacing: '0.01em' }}
                      onClick={() => {
                        setSelectedPaper(paper)
                        setSearchQuery("")
                        setSearchResults([])
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <span>{paper.title}</span>
                        <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded text-gray-600 text-[11px]">
                          {citationCounts[paper.id] !== undefined ? `${citationCounts[paper.id]} citations` : '...'}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Semantic Similarity Controls */}
      {showSemanticFilters && (
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <h3 className="font-semibold text-gray-900 mb-3">Semantic Similarity Controls</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Similarity Threshold: {(similarityThreshold * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0.3"
                max="0.9"
                step="0.1"
                value={similarityThreshold}
                onChange={(e) => setSimilarityThreshold(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showSimilarityLines"
                checked={showSimilarityLines}
                onChange={(e) => setShowSimilarityLines(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="showSimilarityLines" className="text-sm text-gray-700">
                Show similarity connections
              </label>
            </div>
            <div className="text-sm text-gray-600">
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-blue-600"></div>
                <span>Direct Citations</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-100 rounded-full border-2 border-green-500"></div>
                <span>Semantically Related</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="h-[700px] bg-white rounded-lg shadow-sm border relative">
            {/* Zoom/Reset controls in top right of graph area */}
            {selectedPaper && (
              <div className="absolute top-4 right-4 z-20 flex space-x-2">
                <Button onClick={handleZoomOut} variant="outline" size="sm">
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <Button onClick={handleZoomIn} variant="outline" size="sm">
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button onClick={handleReset} variant="outline" size="sm">
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            )}
            {hoveredPaper && (
              <div className="absolute top-4 left-4 bg-white border border-gray-200 rounded-lg p-3 shadow-lg z-10 max-w-xs">
                <h4 className="font-semibold text-sm text-gray-900 mb-1">{hoveredPaper.name}</h4>
                <p className="text-xs text-gray-600 mb-2">{hoveredPaper.citations} citations</p>
                <p className="text-xs text-gray-500">Click to view details</p>
              </div>
            )}

            {/* Empty state when no paper is selected */}
            {!selectedPaper && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-4 max-w-md mx-auto px-6">
                  <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-gray-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-gray-900">
                      No Paper Selected
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Search and select a research paper from the search bar above to explore its citation network and see connected academic literature.
                    </p>
                  </div>
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span>Start by searching for a paper</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={containerRef} className="w-full h-full relative">
              <svg ref={svgRef} className="w-full h-full"></svg>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Paper Details</h3>
              {selectedPaper && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (bookmarkedPapers.has(selectedPaper.id)) {
                      removeBookmark(selectedPaper.id, selectedPaper.title)
                    } else {
                      addBookmark(selectedPaper.id, selectedPaper.title)
                    }
                  }}
                  className={bookmarkedPapers.has(selectedPaper.id) ? "bg-blue-50 text-blue-600" : ""}
                >
                  {bookmarkedPapers.has(selectedPaper.id) ? "Bookmarked" : "Bookmark"}
                </Button>
              )}
            </div>
            
            {selectedPaper ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">{selectedPaper.title}</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      <span>{selectedPaper.authors}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>{selectedPaper.year_published}</span>
                    </div>
                    <div className="flex items-center">
                      <BookOpen className="w-4 h-4 mr-2" />
                      <span>{selectedPaper.category || 'No category'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    {(selectedPaper.citations || 0).toLocaleString()} citations
                  </Badge>
                  {selectedPaper.similarity && (
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      {(selectedPaper.similarity * 100).toFixed(0)}% similar
                    </Badge>
                  )}
                </div>
                
                {detailedPaperInfo && showPaperDetails && detailedPaperInfo.id === selectedPaper.id && (
                  <div className="pt-4 border-t">
                    <h5 className="font-medium text-gray-900 mb-2">Abstract</h5>
                    <p className="text-sm text-gray-700 leading-relaxed mb-3">
                      {detailedPaperInfo.abstract || 'No abstract available.'}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                      <div>
                        <span className="font-medium">Views:</span> {detailedPaperInfo.views || 0}
                      </div>
                      <div>
                        <span className="font-medium">Citations:</span> {detailedPaperInfo.citationCount}
                      </div>
                      <div>
                        <span className="font-medium">Uploaded:</span> {detailedPaperInfo.uploaded_at ? new Date(detailedPaperInfo.uploaded_at).toLocaleDateString() : 'Unknown'}
                      </div>
                      <div>
                        <span className="font-medium">File Size:</span> {detailedPaperInfo.file_size ? `${(detailedPaperInfo.file_size / 1024 / 1024).toFixed(1)} MB` : 'Unknown'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <BookOpen className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">No Paper Selected</h4>
                <p className="text-sm text-gray-600">
                  Search and select a research paper to explore its citation network and details.
                </p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h4 className="font-semibold text-gray-900 mb-4">Semantically Related Papers</h4>
            <div className="space-y-3">
              {!selectedPaper ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-2">
                    <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">
                    Related papers will appear here when you select a research paper
                  </p>
                </div>
              ) : relatedPapers.length > 0 ? (
                relatedPapers.slice(0, 5).map((paper, index) => (
                  <div
                    key={index}
                    className="p-3 border rounded-lg transition-all cursor-pointer border-green-200 hover:bg-green-50"
                    onClick={() => {
                      fetchPaperDetails(paper.id)
                    }}
                  >
                    <h4 className="font-medium text-gray-900 text-sm mb-1">{paper.title}</h4>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-600">{paper.author}</div>
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                        {(paper.similarity * 100).toFixed(0)}% similar
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-2">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">No semantically related papers found</p>
                  <p className="text-gray-400 text-xs mt-1">Try lowering the similarity threshold</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h4 className="font-semibold text-gray-900 mb-4">Direct Citations</h4>
             <div className="space-y-3">
              {!selectedPaper ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">
                    Connected papers will appear here when you select a research paper
                  </p>
                </div>
              ) : citationData && citationData.children && citationData.children.length > 0 ? (
                citationData.children.slice(0, 5).map((paper, index) => (
                  <div
                    key={index}
                    className={`p-3 border rounded-lg transition-all cursor-pointer ${
                      hoveredPaper?.id === paper.id ? "border-blue-300 bg-blue-50" : "border-gray-200 hover:bg-gray-50"
                    }`}
                    onClick={() => {
                      fetchPaperDetails(paper.id)
                    }}
                    onMouseEnter={() => setHoveredPaper(paper)}
                    onMouseLeave={() => setHoveredPaper(null)}
                  >
                    <h4 className="font-medium text-gray-900 text-sm mb-1">{paper.name}</h4>
                    <div className="text-xs text-gray-600">{paper.citations} citations</div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-2">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">No citations found for this paper</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && selectedPaper && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2">{selectedPaper.name}</h3>
                <div className="text-sm text-gray-600 mb-3">
                  {selectedPaper.authors} • {selectedPaper.year_published}
                </div>
                <Badge variant="secondary">{selectedPaper.citations} citations</Badge>
              </div>
              <button className="text-gray-400 hover:text-gray-600 p-1" onClick={() => setIsModalOpen(false)}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex space-x-3">
              <Button className="flex-1">
                <BookOpen className="w-4 h-4 mr-2" />
                View Paper
              </Button>
              <Button variant="outline" className="flex-1 bg-transparent">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Export & Share Modal */}
      {showExportModal && selectedPaper && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Export & Share</h3>
              <button 
                onClick={() => setShowExportModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-3">
              <Button 
                onClick={exportAsImage} 
                disabled={isExporting}
                className="w-full justify-start"
                variant="outline"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {isExporting ? 'Exporting...' : 'Export as Image (PNG)'}
              </Button>
              
              <Button 
                onClick={exportCitationData}
                className="w-full justify-start"
                variant="outline"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Citation Data (JSON)
              </Button>
              
              <Button 
                onClick={shareNetwork}
                className="w-full justify-start"
                variant="outline"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share Citation Network
              </Button>
            </div>
            
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">
                <strong>Tip:</strong> The JSON export includes all citation data, semantic relationships, and can be imported into other analysis tools.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Paper Abstract Modal */}
      {detailedPaperInfo && isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-4xl w-full max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2 pr-8">{detailedPaperInfo.title}</h2>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    <span><strong>Authors:</strong> {detailedPaperInfo.authors}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span><strong>Year:</strong> {detailedPaperInfo.year_published}</span>
                  </div>
                  <div className="flex items-center">
                    <BookOpen className="w-4 h-4 mr-1" />
                    <span><strong>Category:</strong> {detailedPaperInfo.category || 'No category'}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge variant="secondary">
                    {(detailedPaperInfo.citationCount || 0).toLocaleString()} citations
                  </Badge>
                  <Badge variant="outline">
                    {detailedPaperInfo.views || 0} views
                  </Badge>
                  {detailedPaperInfo.similarity && (
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      {(detailedPaperInfo.similarity * 100).toFixed(0)}% similar
                    </Badge>
                  )}
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0 p-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Abstract</h3>
              <div className="bg-gray-50 rounded-lg p-4 border">
                <p className="text-gray-800 leading-relaxed text-base">
                  {detailedPaperInfo.abstract || 'No abstract available for this paper.'}
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3 pt-4 border-t">
              <Button 
                onClick={() => {
                  if (bookmarkedPapers.has(detailedPaperInfo.id)) {
                    removeBookmark(detailedPaperInfo.id, detailedPaperInfo.title)
                  } else {
                    addBookmark(detailedPaperInfo.id, detailedPaperInfo.title)
                  }
                }}
                className={bookmarkedPapers.has(detailedPaperInfo.id) 
                  ? "bg-blue-600 hover:bg-blue-700 text-white" 
                  : "bg-blue-600 hover:bg-blue-700 text-white"
                }
              >
                <BookOpen className="w-4 h-4 mr-2" />
                {bookmarkedPapers.has(detailedPaperInfo.id) ? "Remove Bookmark" : "Bookmark Paper"}
              </Button>
              
              <Button 
                onClick={() => {
                  // Set the clicked paper as the new main paper to explore its citations
                  setSelectedPaper({
                    id: detailedPaperInfo.id,
                    title: detailedPaperInfo.title,
                    authors: detailedPaperInfo.authors,
                    year_published: detailedPaperInfo.year_published,
                    abstract: detailedPaperInfo.abstract,
                    category: detailedPaperInfo.category,
                    citations: detailedPaperInfo.citationCount || 0
                  })
                  setIsModalOpen(false)
                  // Clear previous citation data to force refresh
                  setCitationData(null)
                  setRelatedPapers([])
                  setSemanticSimilarities({})
                }}
                variant="outline"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Explore Citation Network
              </Button>
              
              <Button 
                onClick={() => setShowExportModal(true)}
                variant="outline"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share & Export
              </Button>
              
              <Button 
                onClick={() => setIsModalOpen(false)}
                variant="outline"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
