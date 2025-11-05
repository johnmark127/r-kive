import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthModal from "../components/AuthModal";
import ToastManager from "../components/ToastManager";
import "../components/AuthModal.css";
import { useBrowseTopics } from "@/hooks/useBrowseTopics";
import { supabase } from "@/supabase/client";


function Index() {
    const navigate = useNavigate();
    // Hide the blue header background and Login button when scrolled down; show again at the very top
    const headerRef = useRef(null);
    const loginBtnRef = useRef(null);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    const { categories, loading } = useBrowseTopics();
    const [selectedCategoryIdx, setSelectedCategoryIdx] = useState(0);
    const [currentPaperIdx, setCurrentPaperIdx] = useState(0);

    // Search bar autocomplete state
    const [searchValue, setSearchValue] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Fetch suggestions from Supabase as user types
    useEffect(() => {
        if (searchValue.trim().length === 0) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }
        let active = true;
        const fetchSuggestions = async () => {
            const { data, error } = await supabase
                .from("research_papers")
                .select("title, authors")
                .ilike("title", `%${searchValue}%`)
                .limit(5);
            if (active) {
                setSuggestions(data ? data.map(d => ({ title: d.title, authors: d.authors || "Unknown" })) : []);
                setShowSuggestions(true);
            }
        };
        fetchSuggestions();
        return () => { active = false; };
    }, [searchValue]);

    const handleSuggestionClick = (name) => {
        navigate(`/search?query=${encodeURIComponent(name)}`);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchValue.trim()) {
            navigate(`/search?query=${encodeURIComponent(searchValue.trim())}`);
        }
    };

    const openAuthModal = () => {
        setIsAuthModalOpen(true);
    };

    const closeAuthModal = () => {
        setIsAuthModalOpen(false);
    };

    const toggleMobileNav = () => {
        setIsMobileNavOpen(!isMobileNavOpen);
    };

    const nextPaper = () => {
        if (categories[selectedCategoryIdx] && categories[selectedCategoryIdx].papers.length > 0) {
            setCurrentPaperIdx((prev) => 
                prev < categories[selectedCategoryIdx].papers.length - 1 ? prev + 1 : 0
            );
        }
    };

    const prevPaper = () => {
        if (categories[selectedCategoryIdx] && categories[selectedCategoryIdx].papers.length > 0) {
            setCurrentPaperIdx((prev) => 
                prev > 0 ? prev - 1 : categories[selectedCategoryIdx].papers.length - 1
            );
        }
    };

    // Reset paper index when category changes
    const handleCategoryChange = (newIdx) => {
        setSelectedCategoryIdx(newIdx);
        setCurrentPaperIdx(0);
    };

    useEffect(() => {
        // Auto-open login/register modal if redirected from SearchResults
        const params = new URLSearchParams(window.location.search);
        if (params.get('login') === '1') {
            setIsAuthModalOpen(true);
        }
        // Optionally, you can set register mode in AuthModal if needed
        // For now, just open modal; user can switch between login/register inside modal

        const handleScroll = () => {
            const atTop = window.scrollY <= 10;
            if (headerRef.current) {
                headerRef.current.classList.toggle("transparent", !atTop);
            }
            if (loginBtnRef.current) {
                loginBtnRef.current.classList.toggle("hidden", !atTop);
            }
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        // run once on mount to set initial state
        handleScroll();
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <main>
            <div className="header-container" ref={headerRef}>
                <div className="nav-container">
                    <button className="mobile-nav-toggle d-md-none" onClick={toggleMobileNav}>
                        ☰
                    </button>

                    <div className="logo-container">
                        <a href="#section_1">
                            <img src="/assets/images/finalg.jpg" alt="College Logo" className="logo" />
                        </a>
                    </div>
                    
                    <div className={`navigation ${isMobileNavOpen ? 'mobile-open' : ''}`}>
                        <div className="nav-links">
                            <a href="#section_1" className="click-scroll" onClick={e => { e.preventDefault(); window.scrollTo({top: 0, behavior: 'smooth'}); setIsMobileNavOpen(false); }}>HOME</a>
                            <a href="#section_2" className="click-scroll" onClick={() => setIsMobileNavOpen(false)}>BROWSE TOPICS</a>
                            <a href="#section_3" className="click-scroll" onClick={() => setIsMobileNavOpen(false)}>HOW IT WORKS</a>
                            <a href="#section_4" className="click-scroll" onClick={() => setIsMobileNavOpen(false)}>FAQS</a>
                            <a href="#section_5" className="click-scroll" onClick={() => setIsMobileNavOpen(false)}>CONTACTS</a>
                        </div>
                    </div>
                    
                    <button className="login-btn" ref={loginBtnRef} onClick={openAuthModal}>
                        LOGIN
                    </button>
                </div>
            </div>

            <section className="hero-section d-flex justify-content-center align-items-center" id="section_1">
                <div className="container">
                    <div className="row">
                        <div className="col-lg-8 col-12 mx-auto">
                            <h1 className="text-white text-center display-4 fw-bold mb-3">Discover. Explore. Learn</h1>
                            <h4 className="text-white text-center mb-5 opacity-90">Your Gateway to OMSC Capstone Projects</h4>
                            <form onSubmit={handleSearchSubmit} className="custom-form mt-4 pt-2 mb-lg-0 mb-5" role="search">
                                <div className="modern-search-container" style={{ position: 'relative' }}>
                                    <div className="search-input-wrapper">
                                        <span className="search-icon">🔍</span>
                                        <input
                                            name="keyword"
                                            type="search"
                                            className="modern-search-input"
                                            id="keyword"
                                            placeholder="Search Project Title, Author, Year ..."
                                            aria-label="Search"
                                            autoComplete="off"
                                            value={searchValue}
                                            onChange={e => setSearchValue(e.target.value)}
                                            onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                                            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                                        />
                                        <button type="submit" className="modern-search-button">Search</button>
                                    </div>
                                    {showSuggestions && suggestions.length > 0 && (
                                        <ul className="search-suggestions-list" style={{
                                            position: 'absolute',
                                            top: '100%',
                                            left: 0,
                                            right: 0,
                                            background: '#fff',
                                            border: '1px solid #e3e8ee',
                                            boxShadow: '0 4px 16px rgba(36,88,132,0.08)',
                                            borderRadius: 12,
                                            margin: 0,
                                            padding: '4px 0',
                                            zIndex: 10,
                                            listStyle: 'none',
                                            minWidth: 0,
                                        }}>
                                            {suggestions.map((name, idx) => (
                                                <li
                                                    key={idx}
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        padding: '10px 18px',
                                                        cursor: 'pointer',
                                                        fontSize: '0.98rem',
                                                        color: '#222',
                                                        background: 'none',
                                                        borderBottom: idx !== suggestions.length - 1 ? '1px solid #f3f3f3' : 'none',
                                                        transition: 'background 0.15s',
                                                    }}
                                                    onMouseDown={() => handleSuggestionClick(suggestions[idx].title)}
                                                    onMouseOver={e => e.currentTarget.style.background = '#f5f8fa'}
                                                    onMouseOut={e => e.currentTarget.style.background = 'none'}
                                                >
                                                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{suggestions[idx].title}</span>
                                                    <span style={{ marginLeft: 16, color: '#357ab8', fontSize: '0.92em', fontWeight: 500, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{suggestions[idx].authors}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </section>

            <section className="featured-section">
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-lg-4 col-12 mb-4 mb-lg-0">
                            <div className="custom-block bg-white shadow-lg">
                                <div className="d-flex">
                                    <div>
                                        <h5 className="mb-2">Capstone Showcase</h5>
                                        <p className="mb-0">Browse and explore innovative capstone projects from OMSC students. Get inspired by groundbreaking research and creative solutions across various fields.</p>
                                    </div>
                                </div>
                                <img src="/assets/images/topics/undraw_Remote_design_team_re_urdx.png" className="custom-block-image img-fluid" alt="" />
                            </div>
                        </div>

                        <div className="col-lg-6 col-12">
                            <div className="custom-block custom-block-overlay">
                                <div className="d-flex flex-column h-100">
                                    <img src="/assets/images/123.jpg" className="custom-block-image img-fluid" alt="" />
                                    <div className="custom-block-overlay-text d-flex">
                                        <div>
                                            <h5 className="text-black mb-2">Citation Tree</h5>
                                            <p className="mb-0">Effortlessly trace the connections between studies using the Citation Tree feature. Visualize references, track sources, and explore related research in a structured way.</p>
                                        </div>
                                    </div>
                                    <div className="section-overlay1"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="explore-section section-padding" id="section_2">
                <div className="container">
                    <div className="row">
                        <div className="col-12 text-center">
                            <h2 className="mb-4" style={{ fontWeight: 700, fontSize: '2.5rem' }}>Browse Topics</h2>
                        </div>
                    </div>
                </div>

                {/* Desktop Tab Bar */}
                <div className="container-fluid mb-4 d-none d-md-block">
                    <div className="row">
                        <div className="d-flex justify-content-center align-items-center gap-4 flex-wrap" style={{ fontSize: '1.2rem', fontWeight: 500 }}>
                            {categories.map((cat, idx) => (
                                <div
                                    key={cat.id}
                                    onClick={() => handleCategoryChange(idx)}
                                    style={{
                                        cursor: 'pointer',
                                        borderBottom: selectedCategoryIdx === idx ? '3px solid #222' : 'none',
                                        color: selectedCategoryIdx === idx ? '#222' : '#4a4a4a',
                                        fontWeight: selectedCategoryIdx === idx ? 700 : 500,
                                        paddingBottom: 6,
                                        transition: 'border 0.2s, color 0.2s',
                                        minWidth: 80,
                                        textAlign: 'center',
                                    }}
                                >
                                    {cat.name}
                                    <span style={{
                                        background: '#183153',
                                        color: 'white',
                                        borderRadius: 12,
                                        fontSize: 13,
                                        fontWeight: 600,
                                        marginLeft: 8,
                                        padding: '2px 10px',
                                        display: 'inline-block',
                                        verticalAlign: 'middle',
                                    }}>{cat.paper_count} papers</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Mobile Dropdown */}
                <div className="container mb-4 d-block d-md-none">
                    <div className="row justify-content-center">
                        <div className="col-12">
                            <div className="category-dropdown-wrapper">
                                <select 
                                    className="category-dropdown"
                                    value={selectedCategoryIdx}
                                    onChange={(e) => handleCategoryChange(parseInt(e.target.value))}
                                >
                                    {categories.map((cat, idx) => (
                                        <option key={cat.id} value={idx}>
                                            {cat.name} ({cat.paper_count} papers)
                                        </option>
                                    ))}
                                </select>
                                <div className="dropdown-arrow">▼</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Papers for selected category */}
                <div className="container">
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-3">Loading topics...</p>
                        </div>
                    ) : (
                        categories[selectedCategoryIdx] && categories[selectedCategoryIdx].papers.length > 0 ? (
                            <>
                                {/* Desktop: Show 3 papers in grid */}
                                <div className="papers-grid-container d-none d-md-block">
                                    <div className="row justify-content-center">
                                        {categories[selectedCategoryIdx].papers.slice(0, 3).map((paper, i) => (
                                            <div key={i} className="col-lg-4 col-md-6 col-12 mb-4 d-flex justify-content-center">
                                                <div className="card shadow-sm" style={{ width: 350, borderRadius: 20, minHeight: 340 }}>
                                                    <div className="card-body">
                                                        <h5 className="card-title mb-2" style={{ fontWeight: 700, fontSize: '1.25rem', color: '#245884' }}>{paper.title}</h5>
                                                        <div className="text-muted mb-1" style={{ fontSize: 15 }}>Year: {paper.year}</div>
                                                        {paper.image && (
                                                            <img src={paper.image} alt="paper" style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 10, margin: '10px 0' }} />
                                                        )}
                                                        {/* Abstract */}
                                                        {paper.abstract && (
                                                            <div className="mt-2" style={{ fontSize: 15, color: '#222', minHeight: 40 }}>
                                                                {paper.abstract.length > 180 ? paper.abstract.slice(0, 180) + '...' : paper.abstract}
                                                            </div>
                                                        )}
                                                        {/* Action Buttons */}
                                                        <div className="d-flex gap-2 mt-3">
                                                            <button
                                                                className="modern-btn"
                                                                style={{
                                                                    background: '#245884',
                                                                    color: '#fff',
                                                                    border: 'none',
                                                                    fontWeight: 500,
                                                                    fontSize: 15,
                                                                    borderRadius: 12,
                                                                    padding: '8px 22px',
                                                                    boxShadow: '0 2px 8px rgba(36,88,132,0.08)',
                                                                    transition: 'background 0.18s, box-shadow 0.18s',
                                                                    cursor: 'pointer',
                                                                }}
                                                                onMouseOver={e => { e.currentTarget.style.background = '#357ab8'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(36,88,132,0.12)'; }}
                                                                onMouseOut={e => { e.currentTarget.style.background = '#245884'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(36,88,132,0.08)'; }}
                                                                onClick={() => {
                                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                                    setTimeout(() => setIsAuthModalOpen(true), 400);
                                                                }}
                                                            >
                                                                Read
                                                            </button>
                                                            <button
                                                                className="modern-btn"
                                                                style={{
                                                                    background: '#f5f8fa',
                                                                    color: '#245884',
                                                                    border: '1px solid #e3e8ee',
                                                                    fontWeight: 500,
                                                                    fontSize: 15,
                                                                    borderRadius: 12,
                                                                    padding: '8px 22px',
                                                                    boxShadow: '0 2px 8px rgba(36,88,132,0.08)',
                                                                    transition: 'background 0.18s, box-shadow 0.18s',
                                                                    cursor: 'pointer',
                                                                }}
                                                                onMouseOver={e => { e.currentTarget.style.background = '#e3e8ee'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(36,88,132,0.12)'; }}
                                                                onMouseOut={e => { e.currentTarget.style.background = '#f5f8fa'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(36,88,132,0.08)'; }}
                                                                onClick={() => {
                                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                                    setTimeout(() => setIsAuthModalOpen(true), 400);
                                                                }}
                                                            >
                                                                View Citation
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Mobile: Show 1 paper with navigation */}
                                <div className="papers-carousel-container d-block d-md-none">
                                    <button className="carousel-nav-btn carousel-prev" onClick={prevPaper}>
                                        ❮
                                    </button>
                                    
                                    <div className="papers-carousel">
                                        <div className="paper-card active">
                                            <div className="card shadow-sm" style={{ borderRadius: 20, minHeight: 340 }}>
                                                <div className="card-body">
                                                    <h5 className="card-title mb-2" style={{ fontWeight: 700, fontSize: '1.25rem', color: '#245884' }}>
                                                        {categories[selectedCategoryIdx].papers[currentPaperIdx].title}
                                                    </h5>
                                                    <div className="text-muted mb-1" style={{ fontSize: 15 }}>
                                                        Year: {categories[selectedCategoryIdx].papers[currentPaperIdx].year}
                                                    </div>
                                                    {categories[selectedCategoryIdx].papers[currentPaperIdx].image && (
                                                        <img 
                                                            src={categories[selectedCategoryIdx].papers[currentPaperIdx].image} 
                                                            alt="paper" 
                                                            style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 10, margin: '10px 0' }}
                                                        />
                                                    )}
                                                    {/* Abstract */}
                                                    {categories[selectedCategoryIdx].papers[currentPaperIdx].abstract && (
                                                        <div className="mt-2" style={{ fontSize: 15, color: '#222', minHeight: 40 }}>
                                                            {categories[selectedCategoryIdx].papers[currentPaperIdx].abstract.length > 180 
                                                                ? categories[selectedCategoryIdx].papers[currentPaperIdx].abstract.slice(0, 180) + '...' 
                                                                : categories[selectedCategoryIdx].papers[currentPaperIdx].abstract}
                                                        </div>
                                                    )}
                                                    {/* Action Buttons */}
                                                    <div className="d-flex gap-2 mt-3" style={{ width: '100%' }}>
                                                        <button
                                                            className="modern-btn"
                                                            style={{
                                                                background: '#245884',
                                                                color: '#fff',
                                                                border: 'none',
                                                                fontWeight: 600,
                                                                fontSize: 14,
                                                                borderRadius: 8,
                                                                padding: '10px 16px',
                                                                flex: 1,
                                                                minWidth: 0,
                                                                boxShadow: '0 2px 6px rgba(36,88,132,0.15)',
                                                                transition: 'all 0.2s ease',
                                                                cursor: 'pointer',
                                                                whiteSpace: 'nowrap',
                                                            }}
                                                            onClick={() => {
                                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                                                setTimeout(() => setIsAuthModalOpen(true), 400);
                                                            }}
                                                        >
                                                            Read
                                                        </button>
                                                        <button
                                                            className="modern-btn"
                                                            style={{
                                                                background: '#fff',
                                                                color: '#245884',
                                                                border: '1.5px solid #245884',
                                                                fontWeight: 600,
                                                                fontSize: 14,
                                                                borderRadius: 8,
                                                                padding: '10px 16px',
                                                                flex: 1,
                                                                minWidth: 0,
                                                                boxShadow: '0 2px 6px rgba(36,88,132,0.1)',
                                                                transition: 'all 0.2s ease',
                                                                cursor: 'pointer',
                                                                whiteSpace: 'nowrap',
                                                            }}
                                                            onClick={() => {
                                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                                                setTimeout(() => setIsAuthModalOpen(true), 400);
                                                            }}
                                                        >
                                                            Citation
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <button className="carousel-nav-btn carousel-next" onClick={nextPaper}>
                                        ❯
                                    </button>

                                    <div className="carousel-indicators">
                                        <span className="current-paper">{currentPaperIdx + 1}</span>
                                        <span className="separator"> / </span>
                                        <span className="total-papers">{categories[selectedCategoryIdx].papers.length}</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="text-secondary text-center py-5">No papers found</div>
                        )
                    )}
                </div>
            </section>

            <section className="timeline-section section-padding" id="section_3">
                <div className="section-overlay"></div>
                <div className="container">
                    <div className="row">
                        <div className="col-12 text-center">
                            <h2 className="text-white mb-4">How does it work?</h2>
                        </div>

                        <div className="col-lg-10 col-12 mx-auto">
                            <div className="timeline-container">
                                <ul className="vertical-scrollable-timeline" id="vertical-scrollable-timeline">
                                    <div className="list-progress">
                                        <div className="inner"></div>
                                    </div>

                                    <li>
                                        <h4 className="text-white mb-3">Search your favourite topic</h4>
                                        <p className="text-white">Use our intuitive search bar to explore a vast collection of capstone projects and research papers. Whether you're looking for inspiration or specific studies, finding relevant content has never been easier.</p>
                                        <div className="icon-holder">
                                          <i className="bi-search"></i>
                                        </div>
                                    </li>
                                    
                                    <li>
                                        <h4 className="text-white mb-3">Bookmark &amp; Keep it for yourself</h4>
                                        <p className="text-white">Save your favorite research papers with a single click. No need to download, your bookmarks will always be there when you need them, neatly organized for quick access.</p>
                                        <div className="icon-holder">
                                          <i className="bi-bookmark"></i>
                                        </div>
                                    </li>

                                    <li>
                                        <h4 className="text-white mb-3">Read &amp; Enjoy</h4>
                                        <p className="text-white">Open and read high-quality research papers directly on our platform. Gain insights, enhance your knowledge, and explore new perspectives, all in a distraction-free, user-friendly interface.</p>
                                        <div className="icon-holder">
                                          <i className="bi-book"></i>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="faq-section section-padding" id="section_4">
                <div className="container">
                    <div className="row">
                        <div className="col-lg-6 col-12">
                            <h2 className="mb-4">Frequently Asked Questions</h2>
                        </div>

                        <div className="clearfix"></div>

                        <div className="col-lg-5 col-12">
                            <img src="/assets/images/faq_graphic-removebg-preview.png" className="img-fluid" alt="FAQs" />
                        </div>

                        <div className="col-lg-6 col-12 m-auto">
                            {/* React FAQ Accordion - styled to match screenshot */}
                            {(() => {
                                const faqs = [
                                    {
                                        question: "What is R-kive?",
                                        answer: (
                                            <>
                                                <div style={{padding: '0 0 0.5rem 0'}}>
                                                    A platform for storing and accessing capstone projects of OMSC IT students. Our system ensures seamless research management, making it easier for students and faculty to explore valuable academic work.
                                                </div>
                                                <div className="mt-3" style={{paddingLeft: 0}}>
                                                    <Link to="/about" className="btn btn-primary px-4 py-2 rounded-2 shadow-sm" style={{backgroundColor: '#245884', border: 'none', textAlign: 'left'}}>Learn More</Link>
                                                </div>
                                            </>
                                        )
                                    },
                                    {
                                        question: "How to find a topic?",
                                        answer: (
                                            <>You can search with <strong>keywords</strong> such as Author, Year, Topic, etc.</>
                                        )
                                    },
                                    {
                                        question: "Why choose our repository?",
                                        answer: (
                                            <>
                                                <div style={{marginBottom: '0.5rem', fontSize: '1.13rem'}}>
                                                    <span style={{fontWeight: 600}}>
                                                        Search & Filters
                                                    </span>
                                                    <span> - Quickly find relevant projects using categories, keywords, and filters.</span>
                                                </div>
                                                <div style={{marginBottom: '0.5rem', fontSize: '1.13rem'}}>
                                                    <span style={{fontWeight: 600}}>
                                                        Centralized Research Storage
                                                    </span>
                                                    <span> - Find all capstone projects in one place.</span>
                                                </div>
                                                <div style={{fontSize: '1.13rem'}}>
                                                    <span style={{fontWeight: 600}}>
                                                        Citation Tree
                                                    </span>
                                                    <span> - Visualize references and sources for better research tracking.</span>
                                                </div>
                                            </>
                                        )
                                    }
                                ];
                                const [openIdx, setOpenIdx] = useState(0);
                                return (
                                    <div>
                                        {faqs.map((faq, idx) => (
                                            <div key={idx} className="mb-3">
                                                <div
                                                    className={`rounded-top-4 shadow-sm`}
                                                    style={{
                                                        background: openIdx === idx ? '#245884' : 'white',
                                                        borderTopLeftRadius: '16px',
                                                        borderTopRightRadius: '16px',
                                                        borderBottomLeftRadius: openIdx === idx ? '0' : '16px',
                                                        borderBottomRightRadius: openIdx === idx ? '0' : '16px',
                                                        padding: '0',
                                                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                                                        cursor: 'pointer',
                                                        transition: 'background 0.2s',
                                                    }}
                                                    onClick={() => setOpenIdx(openIdx === idx ? -1 : idx)}
                                                >
                                                    <div
                                                        className="fw-bold"
                                                        style={{
                                                            color: openIdx === idx ? 'white' : '#245884',
                                                            fontSize: '1.2rem',
                                                            padding: '1rem 1.5rem',
                                                            borderRadius: 'inherit',
                                                            userSelect: 'none',
                                                        }}
                                                    >
                                                        {faq.question}
                                                        <span style={{float: 'right', fontWeight: 400, fontSize: '1.3rem', color: openIdx === idx ? 'white' : '#245884'}}>
                                                            {openIdx === idx ? '\u25B2' : '\u25BC'}
                                                        </span>
                                                    </div>
                                                </div>
                                                {openIdx === idx && (
                                                    <div
                                                        className="bg-white rounded-bottom-4"
                                                        style={{
                                                            padding: '1.2rem 1.5rem 1.5rem 1.5rem',
                                                            borderBottomLeftRadius: '16px',
                                                            borderBottomRightRadius: '16px',
                                                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                                                            borderTop: '1px solid #f0f0f0',
                                                            color: '#222',
                                                            fontWeight: 400
                                                        }}
                                                    >
                                                        {faq.answer}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            </section>

            <section className="contact-section section-padding section-bg" id="section_5">
                <div className="container">
                    <div className="row">
                        <div className="col-lg-12 col-12 text-center">
                            <h2 className="mb-5">Get in Touch</h2>
                        </div>

                        <div className="col-lg-5 col-12 mb-4 mb-lg-0">
                            <iframe
                                className="google-map"
                                title="OMSC San Jose Campus Map"
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3252.930515014146!2d121.06416777411027!3d12.354304528113259!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33bb033a48f77457%3A0xf81605d32df2291e!2sOccidental%20Mindoro%20State%20College%20-%20San%20Jose%20Campus!5e1!3m2!1sen!2sph!4v1746585387397!5m2!1sen!2sph"
                                width="470"
                                height="300"
                                style={{ border: 0 }}
                                allowFullScreen=""
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            ></iframe>
                        </div>

                        <div className="col-lg-3 col-md-6 col-12 mb-3 mb-lg- mb-md-0 ms-auto">
                            <h4 className="mb-3">OMSC San Jose Campus</h4>
                            <p>Quirino St, San Jose, 5100 Occidental Mindoro</p>
                            <hr />
                            <p className="d-flex align-items-center mb-1">
                                <span className="me-2">Phone</span>
                                <a href="tel: 0993-871-6201" className="site-footer-link">0993-871-6201</a>
                            </p>
                            <p className="d-flex align-items-center">
                                <span className="me-2">Email</span>
                                <a href="mailto:info@company.com" className="site-footer-link">OmscR-kive.edu.com</a>
                            </p>
                        </div>

                        <div className="col-lg-3 col-md-6 col-12 mx-auto">
                            <h4 className="mb-3">OMSC Labangan</h4>
                            <p>Labangan, San Jose, Occidental Mindoro</p>
                            <hr />
                            <p className="d-flex align-items-center mb-1">
                                <span className="me-2">Phone</span>
                                <a href="tel: 0919-491-8471" className="site-footer-link">0919-491-8471</a>
                            </p>
                            <p className="d-flex align-items-center">
                                <span className="me-2">Email</span>
                                <a href="mailto:info@company.com" className="site-footer-link">omsc.edu.com.ph</a>
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="site-footer section-padding">
                <div className="container">
                    <div className="row">
                        <div className="col-lg-3 col-12 mb-4 pb-2">
                            <a className="navbar-brand mb-2" href="/">
                                <i className="bi-back"></i>
                                <span>R-Kive</span>
                                <div className="logo-container1">
                                    <img src="/assets/images/finalg.jpg" alt="College Logo" className="logo" />
                                </div>
                            </a>
                        </div>

                        <div className="col-lg-3 col-md-4 col-6">
                            <h6 className="site-footer-title mb-3">Resources</h6>
                            <ul className="site-footer-links">
                                <li className="site-footer-link-item">
                                    <a href="#section_1" className="site-footer-link">Home</a>
                                </li>
                                <li className="site-footer-link-item">
                                    <a href="#section_3" className="site-footer-link">How it works</a>
                                </li>
                                <li className="site-footer-link-item">
                                    <a href="#section_4" className="site-footer-link">FAQs</a>
                                </li>
                                <li className="site-footer-link-item">
                                    <a href="#section_5" className="site-footer-link">Contact</a>
                                </li>
                            </ul>
                        </div>

                        <div className="col-lg-3 col-md-4 col-6 mb-4 mb-lg-0">
                            <h6 className="site-footer-title mb-3">Information</h6>
                            <p className="text-white d-flex mb-1">
                                <a href="tel: 0993-871-6201" className="site-footer-link">0993-871-6201</a>
                            </p>
                            <p className="text-white d-flex">
                                <a href="mailto:info@company.com" className="site-footer-link">omsc.edu.com</a>
                            </p>
                        </div>

                        <div className="col-lg-3 col-md-4 col-12 mt-4 mt-lg-0 ms-auto">
                            <p className="copyright-text mt-lg-5 mt-4">Copyright © 2025 OMSC R-Kive. All rights reserved.</p>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Auth Modal */}
            <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} />
            
            {/* Toast Manager */}
            <ToastManager />
        </main>
    );
}

export default Index;