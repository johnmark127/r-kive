import React, { useEffect, useState } from "react";
import { useBrowseTopics } from "@/hooks/useBrowseTopics";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/supabase/client";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const SearchResults = () => {
  const navigate = useNavigate();
  const query = useQuery().get("query") || "";
  const category = useQuery().get("category") || "";
  const year = useQuery().get("year") || "";
  const { categories } = useBrowseTopics();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    setLoading(true);
    // Fetch all capstones
    supabase
      .from("research_papers")
      .select("id, title, authors, year_published, category, abstract")
      .order("year_published", { ascending: false })
      .then(({ data }) => {
        let allResults = data || [];
        let filteredResults = allResults;
        // Filter by category and year if set
        if (category) {
          // Case-insensitive category matching
          filteredResults = filteredResults.filter(p => 
            p.category && p.category.toLowerCase() === category.toLowerCase()
          );
        }
        if (year) {
          filteredResults = filteredResults.filter(p => String(p.year_published) === String(year));
        }
        // If query is set, find matching papers and move them to the top
        if (query) {
          const queryLower = query.toLowerCase();
          const matches = filteredResults.filter(p =>
            (p.title && p.title.toLowerCase().includes(queryLower)) ||
            (p.authors && p.authors.toLowerCase().includes(queryLower))
          );
          const nonMatches = filteredResults.filter(p =>
            !((p.title && p.title.toLowerCase().includes(queryLower)) ||
              (p.authors && p.authors.toLowerCase().includes(queryLower)))
          );
          setResults([...matches, ...nonMatches]);
        } else {
          setResults(filteredResults);
        }
        setLoading(false);
      });
  }, [query, category, year]);

  return (
    <main className="no-invert">
      <div className="header-container">
        <div className="nav-container d-flex align-items-center" style={{ minHeight: '70px' }}>
          <a href="/" className="btn btn-light" style={{ fontWeight: 500, borderRadius: 24, padding: '6px 18px', fontSize: '1rem', boxShadow: '0 2px 8px rgba(36,88,132,0.10)', marginLeft: '32px' }}>
            <i className="bi-arrow-left" style={{ marginRight: 8 }}></i> Back
          </a>
          {/* Navigation links removed as requested */}
        </div>
      </div>
      <section className="about-hero" style={{ minHeight: '150px', width: '100vw', background: 'linear-gradient(135deg, #245884, #4779a4)', color: 'white', display: 'flex', alignItems: 'center', padding: '0', position: 'relative' }}>
        <div className="container text-center position-relative">
          {/* Back button moved to header section above */}
          <form
            onSubmit={e => {
              e.preventDefault();
              const value = e.target.elements.search.value.trim();
              const category = e.target.elements.category.value;
              const year = e.target.elements.year.value;
              let url = `/search?query=${encodeURIComponent(value)}`;
              if (category) url += `&category=${encodeURIComponent(category)}`;
              if (year) url += `&year=${encodeURIComponent(year)}`;
              navigate(url);
            }}
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 32, marginBottom: 8, flexWrap: 'wrap' }}
            autoComplete="off"
          >
            <div style={{ position: 'relative', minWidth: 240 }}>
              <input
                type="text"
                name="search"
                defaultValue={query}
                placeholder="Search capstones..."
                style={{
                  width: '100%',
                  padding: '12px 44px 12px 20px',
                  borderRadius: '999px',
                  border: 'none',
                  fontSize: '1.08rem',
                  background: '#fff',
                  color: '#245884',
                  boxShadow: '0 2px 12px rgba(36,88,132,0.08)',
                  outline: 'none',
                  fontWeight: 500,
                  letterSpacing: '0.01em',
                  transition: 'box-shadow 0.2s',
                }}
              />
              <span style={{ position: 'absolute', right: 18, top: '50%', transform: 'translateY(-50%)', opacity: 0.7 }}>
                <svg width="22" height="22" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="9" cy="9" r="7" stroke="#245884" strokeWidth="2" />
                  <line x1="15.5" y1="15.5" x2="12.5" y2="12.5" stroke="#245884" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
            </div>
            <select 
              name="category" 
              defaultValue={category} 
              onChange={(e) => {
                const value = e.target.form.elements.search.value.trim();
                const newCategory = e.target.value;
                const currentYear = e.target.form.elements.year.value;
                let url = `/search?query=${encodeURIComponent(value)}`;
                if (newCategory) url += `&category=${encodeURIComponent(newCategory)}`;
                if (currentYear) url += `&year=${encodeURIComponent(currentYear)}`;
                navigate(url);
              }}
              style={{ borderRadius: '999px', padding: '12px 24px', border: 'none', fontSize: '1.08rem', background: '#fff', color: '#245884', fontWeight: 500, boxShadow: '0 2px 12px rgba(36,88,132,0.08)', outline: 'none', transition: 'box-shadow 0.2s', cursor: 'pointer' }}
            >
              <option value="">All Categories</option>
              {categories && categories.map((cat) => (
                <option key={cat.id || cat.name} value={cat.original_name || cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
            <select 
              name="year" 
              defaultValue={year} 
              onChange={(e) => {
                const value = e.target.form.elements.search.value.trim();
                const currentCategory = e.target.form.elements.category.value;
                const newYear = e.target.value;
                let url = `/search?query=${encodeURIComponent(value)}`;
                if (currentCategory) url += `&category=${encodeURIComponent(currentCategory)}`;
                if (newYear) url += `&year=${encodeURIComponent(newYear)}`;
                navigate(url);
              }}
              style={{ borderRadius: '999px', padding: '12px 24px', border: 'none', fontSize: '1.08rem', background: '#fff', color: '#245884', fontWeight: 500, boxShadow: '0 2px 12px rgba(36,88,132,0.08)', outline: 'none', transition: 'box-shadow 0.2s', cursor: 'pointer' }}
            >
              <option value="">All Years</option>
              {[2025,2024,2023,2022].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <button type="submit" className="btn" style={{ borderRadius: '999px', fontWeight: 500, padding: '12px 32px', fontSize: '1.08rem', marginLeft: 4, background: 'linear-gradient(90deg, #2563eb 0%, #4779a4 100%)', color: '#fff', border: 'none', boxShadow: '0 2px 12px rgba(36,88,132,0.10)', transition: 'box-shadow 0.2s' }}>Search</button>
          </form>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 8 }}>
            <span style={{
              fontSize: '0.88rem',
              fontWeight: 500,
              color: '#fff',
              background: 'none',
              padding: '0',
              letterSpacing: '0.01em',
              maxWidth: '90vw',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              Results for <span style={{ fontWeight: 700, color: '#fff', opacity: 0.92 }}>&quot;{query}&quot;</span>
            </span>
          </div>
        </div>
      </section>
      <section className="about-content" style={{ background: '#f3f4f6', minHeight: '60vh', padding: '32px 0' }}>
        <div className="container">
          {loading ? (
            <div className="text-center py-5">Loading...</div>
          ) : results.length === 0 ? (
            <div className="text-center py-5">No capstones found.</div>
          ) : (
            <div className="row justify-content-center">
              {results.map((paper) => (
                <div key={paper.id} className="col-lg-4 col-md-6 col-12 mb-4">
                  <div className="card shadow-sm h-100" style={{ borderRadius: '1rem', border: '1px solid #e5e7eb', background: '#fff', boxShadow: '0 2px 8px rgba(36,88,132,0.07)', transition: 'box-shadow 0.2s, transform 0.2s' }}>
                    <div className="card-body d-flex flex-column" style={{ padding: '1.5rem' }}>
                      <h5 className="card-title mb-2" style={{ fontWeight: 600, fontSize: '1.08rem', color: '#1e293b', lineHeight: '1.3', marginBottom: '0.5rem' }}>{paper.title}</h5>
                      <div className="mb-1 d-flex align-items-center" style={{ fontSize: 13, color: '#64748b' }}>
                        <i className="bi-person" style={{ marginRight: 6, fontSize: 15, opacity: 0.7 }}></i>
                        <span>{paper.authors || 'Unknown'}</span>
                      </div>
                      <div className="mb-1 d-flex align-items-center" style={{ fontSize: 13, color: '#64748b' }}>
                        <i className="bi-calendar" style={{ marginRight: 6, fontSize: 15, opacity: 0.7 }}></i>
                        <span>{paper.year_published}</span>
                      </div>
                      <span className="badge bg-light border text-secondary mb-2" style={{ alignSelf: 'flex-start', fontSize: '0.85em', fontWeight: 500, borderRadius: '8px', padding: '3px 10px' }}>{paper.category}</span>
                      <div className="mb-2" style={{ fontSize: 13, color: '#334155', lineHeight: '1.5', marginBottom: '0.5rem' }}>{paper.abstract?.slice(0, 120) || 'No abstract.'}...</div>
                      <div className="mt-auto d-flex justify-content-end gap-2">
                        <button
                          className="btn"
                          style={{
                            borderRadius: '999px',
                            fontWeight: 500,
                            padding: '10px 22px',
                            fontSize: '1.02em',
                            background: 'linear-gradient(90deg, #2563eb 0%, #4779a4 100%)',
                            color: '#fff',
                            border: 'none',
                            boxShadow: '0 2px 12px rgba(36,88,132,0.10)',
                            transition: 'box-shadow 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                          title="Read paper"
                          onClick={() => setShowLoginModal(true)}
                        >
                          <i className="bi-file-earmark-text" style={{ fontSize: '1.1em', marginRight: 4, opacity: 0.85 }}></i>
                          Read
                        </button>
                        <button
                          className="btn btn-outline-primary"
                          style={{
                            borderRadius: '999px',
                            fontWeight: 500,
                            padding: '10px 22px',
                            fontSize: '1.02em',
                            background: '#fff',
                            color: '#2563eb',
                            border: '1px solid #2563eb',
                            boxShadow: '0 1px 4px rgba(36,88,132,0.07)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                          title="View citation tree"
                          onClick={() => setShowLoginModal(true)}
                        >
                          <i className="bi-diagram-3" style={{ fontSize: '1.1em', marginRight: 4, opacity: 0.85 }}></i>
                          Citation
                        </button>
      {/* Login Required Modal */}
      {showLoginModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
            background: 'rgba(0,0,0,0.10)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 18,
            boxShadow: '0 4px 24px rgba(36,88,132,0.13)',
            padding: '32px 28px',
            maxWidth: 340,
            width: '90vw',
            textAlign: 'center',
            position: 'relative',
          }}>
            <button
              style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 22, color: '#245884', cursor: 'pointer' }}
              onClick={() => setShowLoginModal(false)}
              aria-label="Close"
            >×</button>
            <div style={{ marginBottom: 18 }}>
              <i className="bi-lock" style={{ fontSize: 32, color: '#2563eb', marginBottom: 8 }}></i>
              <h3 style={{ fontWeight: 700, fontSize: '1.18rem', color: '#245884', marginBottom: 6 }}>Login Required</h3>
              <div style={{ fontSize: '1rem', color: '#334155', marginBottom: 8 }}>
                You need to login or register to access capstone details.
              </div>
            </div>
            <button
              className="btn"
              style={{
                width: '100%',
                borderRadius: '999px',
                fontWeight: 600,
                padding: '12px 0',
                fontSize: '1.08em',
                background: 'linear-gradient(90deg, #2563eb 0%, #4779a4 100%)',
                color: '#fff',
                border: 'none',
                boxShadow: '0 2px 12px rgba(36,88,132,0.10)',
                marginBottom: 10,
              }}
              onClick={() => { window.location.href = '/?login=1'; }}
            >Login</button>
            <button
              className="btn btn-outline-primary"
              style={{
                width: '100%',
                borderRadius: '999px',
                fontWeight: 600,
                padding: '12px 0',
                fontSize: '1.08em',
                background: '#fff',
                color: '#2563eb',
                border: '1px solid #2563eb',
                boxShadow: '0 1px 4px rgba(36,88,132,0.07)',
              }}
              onClick={() => { window.location.href = '/?login=1&register=1'; }}
            >Register</button>
          </div>
        </div>
      )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default SearchResults;
