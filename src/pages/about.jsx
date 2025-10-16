import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../App.css';

function About() {
    useEffect(() => {
        // Function to check if element is in viewport
        function isInViewport(element) {
            if (!element) return false;
            const rect = element.getBoundingClientRect();
            return (
                rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
                rect.bottom >= 0 &&
                rect.left <= (window.innerWidth || document.documentElement.clientWidth) &&
                rect.right >= 0
            );
        }
        
        // Function to update active navigation link
        function updateActiveNavLink() {
            const sections = [
                { id: 'our-story', navLinkHref: '#our-story' },
                { id: 'mission-vision-section', navLinkHref: '#mission-vision-section' }
            ];
            let activeSectionNavLinkHref = null;

            for (let i = sections.length - 1; i >= 0; i--) {
                const section = sections[i];
                const element = document.getElementById(section.id);
                if (
                    element &&
                    element.getBoundingClientRect().top <= (window.innerHeight || document.documentElement.clientHeight) / 2
                ) {
                    if (isInViewport(element) || element.getBoundingClientRect().top <= 0) {
                        activeSectionNavLinkHref = section.navLinkHref;
                        break;
                    }
                }
            }

            document.querySelectorAll('.nav-links a').forEach((el) => {
                el.classList.remove('clicked');
            });
            if (activeSectionNavLinkHref) {
                const activeLink = document.querySelector(`.nav-links a[href="${activeSectionNavLinkHref}"]`);
                if (activeLink) activeLink.classList.add('clicked');
            }
        }

        // Update active link on scroll and page load
        window.addEventListener('scroll', updateActiveNavLink);

        // Initial check on page load
        updateActiveNavLink();

        // Handle click-scroll for smooth scrolling and immediate active state update
        document.querySelectorAll('.click-scroll').forEach((el) => {
            el.addEventListener('click', function (e) {
                const targetHref = el.getAttribute('href');
                if (targetHref && targetHref.startsWith('#')) {
                    e.preventDefault();
                    const targetId = targetHref.substring(1);
                    const targetElement = document.getElementById(targetId);

                    if (targetElement) {
                        window.scrollTo({
                            top: targetElement.offsetTop - 75,
                            behavior: 'smooth',
                        });
                        setTimeout(updateActiveNavLink, 500);
                    }
                }
            });
        });

        // Adjust scroll position on page load if a hash is present in the URL
        if (window.location.hash) {
            const targetId = window.location.hash.substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                setTimeout(() => {
                    window.scrollTo({
                        top: targetElement.offsetTop - 75,
                        behavior: 'auto',
                    });
                    updateActiveNavLink();
                }, 0);
            }
        }

        // Cleanup
        return () => {
            window.removeEventListener('scroll', updateActiveNavLink);
            document.querySelectorAll('.click-scroll').forEach((el) => {
                el.removeEventListener('click', () => {});
            });
        };
    }, []);

    return (
        <main>
            {/* Mobile Back Button */}
            <div className="mobile-back-button d-block d-md-none">
                <Link to="/" className="btn-back-mobile">
                    <i className="bi-arrow-left"></i>
                    <span>Back to Home</span>
                </Link>
            </div>

            {/* Header Section */}
            <div className="header-container">
                <div className="nav-container">
                    <div className="navigation">
                        <div className="nav-links">
                            <Link to="/" className="click-scroll">HOME</Link>
                            <a href="#our-story" className="click-scroll clicked">ABOUT US</a>
                            <a href="#mission-vision-section" className="click-scroll">MISSION & VISION</a>
                        </div>
                    </div>
                    <div className="logo-container">
                        <Link to="/">
                            <img src="/assets/images/finalg.jpg" alt="College Logo" className="logo" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* About Hero Section */}
            <section className="about-hero">
                <div className="container">
                    <h1 className="display-4 mb-4">About OMSC R-kive</h1>
                    <p className="lead">Empowering Research and Innovation in Occidental Mindoro State College</p>
                </div>
            </section>

            {/* About Content Section */}
            <section className="about-content" id="our-story">
                <div className="container">
                    <div className="row">
                        <div className="col-lg-6 mb-4">
                            <h2 className="mb-4">Our Story</h2>
                            <p>OMSC R-kive was established with a vision to create a centralized repository for capstone projects and research papers from the Information Technology department of Occidental Mindoro State College. Our platform serves as a bridge between past and present students, facilitating knowledge sharing and academic growth.</p>
                            <p>Since our inception, we have been committed to preserving and showcasing the innovative work of our students.</p>
                        </div>
                        <div className="col-lg-6">
                            <img src="/assets/images/about.jpg" alt="Our Story" className="img-fluid rounded shadow" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Mission & Vision Section */}
            <section className="mission-vision" id="mission-vision-section">
                <div className="container">
                    <div className="row">
                        <div className="col-lg-6 mb-4">
                            <div className="card h-100 p-4">
                                <h3 className="mb-4">Our Mission</h3>
                                <p>To provide a comprehensive digital platform that preserves, organizes, and disseminates capstone projects and research papers, fostering academic excellence and innovation within the OMSC SJ Campus.</p>
                            </div>
                        </div>
                        <div className="col-lg-6">
                            <div className="card h-100 p-4">
                                <h3 className="mb-4">Our Vision</h3>
                                <p>To become the leading digital repository for academic research in Occidental Mindoro, promoting knowledge sharing and inspiring future generations of IT professionals.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Statistics Section */}
            <section className="about-content">
                <div className="container">
                    <div className="row">
                        <div className="col-md-4">
                            <div className="stat-card">
                                <div className="stat-number">1000+</div>
                                <h4>Projects</h4>
                                <p>Capstone projects archived</p>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="stat-card">
                                <div className="stat-number">500+</div>
                                <h4>Students</h4>
                                <p>Active contributors</p>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="stat-card">
                                <div className="stat-number">50+</div>
                                <h4>Faculty</h4>
                                <p>Research supervisors</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Team Section */}
            <section className="team-section">
                <div className="container">
                    <h2 className="text-center mb-5">Our Team</h2>
                    <div className="row">
                        <div className="col-lg-4 col-md-6">
                            <div className="team-member">
                                <img src="/assets/images/team/member1.jpg" alt="Team Member" />
                                <h4>Dr. John Doe</h4>
                                <p>Project Director</p>
                            </div>
                        </div>
                        <div className="col-lg-4 col-md-6">
                            <div className="team-member">
                                <img src="/assets/images/team/member2.jpg" alt="Team Member" />
                                <h4>Jane Smith</h4>
                                <p>Technical Lead</p>
                            </div>
                        </div>
                        <div className="col-lg-4 col-md-6">
                            <div className="team-member">
                                <img src="/assets/images/team/member3.jpg" alt="Team Member" />
                                <h4>Mike Johnson</h4>
                                <p>Content Manager</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}

export default About;
