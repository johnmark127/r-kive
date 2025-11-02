import React from 'react';

const TermsOfUseModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 3000 }}>
            <div 
                className="modal-content" 
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: 'white',
                    maxWidth: '900px',
                    maxHeight: '90vh',
                    overflow: 'auto',
                    padding: '0',
                    borderRadius: '15px',
                    position: 'relative'
                }}
            >
                <div style={{
                    position: 'sticky',
                    top: 0,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    padding: '30px',
                    borderRadius: '15px 15px 0 0',
                    zIndex: 1
                }}>
                    <span 
                        className="close-modal" 
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: '20px',
                            right: '30px',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '2rem'
                        }}
                    >
                        &times;
                    </span>
                    <h1 style={{ margin: 0, fontSize: '32px' }}>Terms of Use</h1>
                    <p style={{ margin: '10px 0 0 0', fontSize: '14px', opacity: 0.9 }}>Last Updated: November 2, 2025</p>
                </div>

                <div style={{ padding: '40px', lineHeight: '1.8', color: '#555' }}>
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
                        <h2 style={{ color: '#333', fontSize: '24px', marginBottom: '15px' }}>11. Contact Information</h2>
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

export default TermsOfUseModal;
