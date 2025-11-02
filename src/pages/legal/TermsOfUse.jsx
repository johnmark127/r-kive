import React from 'react';
import { useNavigate } from 'react-router-dom';

const TermsOfUse = () => {
    const navigate = useNavigate();

    return (
        <div style={{
            minHeight: '100vh',
            background: '#f8f9fa',
            padding: '40px 20px'
        }}>
            <div style={{
                maxWidth: '900px',
                margin: '0 auto',
                background: 'white',
                borderRadius: '15px',
                padding: '50px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}>
                <button 
                    onClick={() => navigate(-1)}
                    style={{
                        background: 'none',
                        border: '2px solid #667eea',
                        color: '#667eea',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        marginBottom: '30px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <i className='bx bx-arrow-back'></i> Back
                </button>

                <h1 style={{
                    fontSize: '36px',
                    color: '#333',
                    marginBottom: '10px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                }}>
                    Terms of Use
                </h1>
                
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '40px' }}>
                    Last Updated: November 2, 2025
                </p>

                <div style={{ lineHeight: '1.8', color: '#555' }}>
                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ color: '#333', fontSize: '24px', marginBottom: '15px' }}>1. Acceptance of Terms</h2>
                        <p>
                            By accessing and using R-kive (the "Service"), you accept and agree to be bound by the terms and provision of this agreement. 
                            If you do not agree to these terms, please do not use the Service.
                        </p>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ color: '#333', fontSize: '24px', marginBottom: '15px' }}>2. Description of Service</h2>
                        <p>
                            R-kive is a research repository platform that provides users with access to academic research papers, 
                            citation management tools, and collaborative features for educational and research purposes.
                        </p>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ color: '#333', fontSize: '24px', marginBottom: '15px' }}>3. User Accounts</h2>
                        <p><strong>3.1 Account Creation</strong></p>
                        <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
                            <li>You must provide accurate and complete information when creating an account</li>
                            <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                            <li>You must be at least 13 years old to create an account</li>
                            <li>You are responsible for all activities that occur under your account</li>
                        </ul>
                        
                        <p style={{ marginTop: '15px' }}><strong>3.2 Account Security</strong></p>
                        <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
                            <li>You must immediately notify us of any unauthorized use of your account</li>
                            <li>We are not liable for any loss or damage arising from your failure to maintain account security</li>
                        </ul>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ color: '#333', fontSize: '24px', marginBottom: '15px' }}>4. Acceptable Use Policy</h2>
                        <p>You agree NOT to:</p>
                        <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
                            <li>Upload or share content that infringes on intellectual property rights</li>
                            <li>Use the Service for any illegal or unauthorized purpose</li>
                            <li>Attempt to gain unauthorized access to any portion of the Service</li>
                            <li>Interfere with or disrupt the Service or servers</li>
                            <li>Upload viruses, malware, or any malicious code</li>
                            <li>Harass, abuse, or harm other users</li>
                            <li>Impersonate any person or entity</li>
                            <li>Collect or store personal data about other users without permission</li>
                        </ul>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ color: '#333', fontSize: '24px', marginBottom: '15px' }}>5. Intellectual Property Rights</h2>
                        <p><strong>5.1 User Content</strong></p>
                        <p>
                            You retain all rights to the content you upload. By uploading content, you grant R-kive a non-exclusive, 
                            worldwide, royalty-free license to use, store, and display your content as necessary to provide the Service.
                        </p>
                        
                        <p style={{ marginTop: '15px' }}><strong>5.2 Platform Content</strong></p>
                        <p>
                            All content, features, and functionality of the Service are owned by R-kive and are protected by 
                            copyright, trademark, and other intellectual property laws.
                        </p>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ color: '#333', fontSize: '24px', marginBottom: '15px' }}>6. Research Integrity</h2>
                        <p>
                            Users must adhere to academic integrity standards and properly cite all sources. 
                            R-kive is not responsible for plagiarism or academic misconduct by users.
                        </p>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ color: '#333', fontSize: '24px', marginBottom: '15px' }}>7. Termination</h2>
                        <p>
                            We reserve the right to suspend or terminate your account at any time for violations of these terms, 
                            without prior notice. You may also terminate your account at any time by contacting us.
                        </p>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ color: '#333', fontSize: '24px', marginBottom: '15px' }}>8. Disclaimers</h2>
                        <p>
                            THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. We do not guarantee that the Service 
                            will be uninterrupted, secure, or error-free. We are not responsible for the accuracy or reliability 
                            of content posted by users.
                        </p>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ color: '#333', fontSize: '24px', marginBottom: '15px' }}>9. Limitation of Liability</h2>
                        <p>
                            To the maximum extent permitted by law, R-kive shall not be liable for any indirect, incidental, 
                            special, consequential, or punitive damages resulting from your use of the Service.
                        </p>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ color: '#333', fontSize: '24px', marginBottom: '15px' }}>10. Changes to Terms</h2>
                        <p>
                            We reserve the right to modify these terms at any time. We will notify users of significant changes 
                            via email or through the Service. Your continued use after such modifications constitutes acceptance 
                            of the updated terms.
                        </p>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ color: '#333', fontSize: '24px', marginBottom: '15px' }}>11. Governing Law</h2>
                        <p>
                            These Terms shall be governed by and construed in accordance with applicable laws, 
                            without regard to conflict of law provisions.
                        </p>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ color: '#333', fontSize: '24px', marginBottom: '15px' }}>12. Contact Information</h2>
                        <p>
                            For questions about these Terms of Use, please contact us at:
                        </p>
                        <p style={{ marginTop: '10px' }}>
                            Email: <a href="mailto:support@r-kive.com" style={{ color: '#667eea' }}>support@r-kive.com</a>
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default TermsOfUse;
