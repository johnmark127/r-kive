import React from 'react';

const PrivacyPolicyModal = ({ isOpen, onClose }) => {
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
                    <h1 style={{ margin: 0, fontSize: '32px' }}>Privacy Policy</h1>
                    <p style={{ margin: '10px 0 0 0', fontSize: '14px', opacity: 0.9 }}>Last Updated: November 2, 2025</p>
                </div>

                <div style={{ padding: '40px', lineHeight: '1.8', color: '#555' }}>
                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ color: '#333', fontSize: '24px', marginBottom: '15px' }}>1. Introduction</h2>
                        <p>
                            R-kive ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains 
                            how we collect, use, disclose, and safeguard your information when you use our research repository 
                            platform (the "Service").
                        </p>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ color: '#333', fontSize: '24px', marginBottom: '15px' }}>2. Information We Collect</h2>
                        
                        <p><strong>2.1 Personal Information</strong></p>
                        <p>When you register for an account, we collect:</p>
                        <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
                            <li>Name (First name and Surname)</li>
                            <li>Email address</li>
                            <li>Password (encrypted)</li>
                            <li>Profile information you choose to provide</li>
                            <li>Institution or organization affiliation (if provided)</li>
                        </ul>
                        
                        <p style={{ marginTop: '15px' }}><strong>2.2 Research Content</strong></p>
                        <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
                            <li>Research papers and documents you upload</li>
                            <li>Citations and bibliographic data</li>
                            <li>Bookmarks and saved items</li>
                            <li>Comments and annotations</li>
                            <li>Research project information</li>
                        </ul>

                        <p style={{ marginTop: '15px' }}><strong>2.3 Usage Information</strong></p>
                        <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
                            <li>IP address</li>
                            <li>Browser type and version</li>
                            <li>Device information</li>
                            <li>Pages visited and time spent</li>
                            <li>Search queries</li>
                        </ul>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ color: '#333', fontSize: '24px', marginBottom: '15px' }}>3. How We Use Your Information</h2>
                        <p>We use the collected information to:</p>
                        <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
                            <li>Provide, operate, and maintain the Service</li>
                            <li>Create and manage your account</li>
                            <li>Process your research uploads and citations</li>
                            <li>Send you important notifications and updates</li>
                            <li>Respond to your inquiries and support requests</li>
                            <li>Improve and optimize the Service</li>
                            <li>Analyze usage patterns and trends</li>
                            <li>Prevent fraud and enhance security</li>
                            <li>Comply with legal obligations</li>
                        </ul>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ color: '#333', fontSize: '24px', marginBottom: '15px' }}>4. Information Sharing</h2>
                        
                        <p><strong>We DO NOT sell your personal information.</strong></p>
                        
                        <p style={{ marginTop: '15px' }}><strong>We may share information with:</strong></p>
                        <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
                            <li><strong>Other Users:</strong> Research content you choose to make public</li>
                            <li><strong>Service Providers:</strong> Third-party vendors who assist in operating the Service</li>
                            <li><strong>Educational Institutions:</strong> If you're affiliated with an institution</li>
                            <li><strong>Legal Authorities:</strong> When required by law</li>
                        </ul>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ color: '#333', fontSize: '24px', marginBottom: '15px' }}>5. Data Security</h2>
                        <p>
                            We implement appropriate technical and organizational measures to protect your information, including:
                        </p>
                        <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
                            <li>Encryption of data in transit and at rest</li>
                            <li>Secure authentication mechanisms</li>
                            <li>Regular security assessments</li>
                            <li>Access controls and monitoring</li>
                            <li>Regular backups</li>
                        </ul>
                        <p style={{ marginTop: '15px' }}>
                            However, no method of transmission over the Internet is 100% secure.
                        </p>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ color: '#333', fontSize: '24px', marginBottom: '15px' }}>6. Your Privacy Rights</h2>
                        <p>You have the right to:</p>
                        <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
                            <li><strong>Access:</strong> Request a copy of your personal information</li>
                            <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                            <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                            <li><strong>Data Portability:</strong> Receive your data in a structured format</li>
                            <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications</li>
                        </ul>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ color: '#333', fontSize: '24px', marginBottom: '15px' }}>7. Data Retention</h2>
                        <p>
                            We retain your information for as long as your account is active or as needed to provide the Service. 
                            We may retain certain information after account closure for legal compliance and legitimate business purposes.
                        </p>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ color: '#333', fontSize: '24px', marginBottom: '15px' }}>8. Children's Privacy</h2>
                        <p>
                            The Service is not intended for users under 13 years of age. We do not knowingly collect 
                            personal information from children under 13.
                        </p>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ color: '#333', fontSize: '24px', marginBottom: '15px' }}>9. Changes to Privacy Policy</h2>
                        <p>
                            We may update this Privacy Policy from time to time. We will notify you of significant changes 
                            by email or through a notice on the Service.
                        </p>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ color: '#333', fontSize: '24px', marginBottom: '15px' }}>10. Contact Us</h2>
                        <p>
                            If you have questions about this Privacy Policy, please contact us:
                        </p>
                        <p style={{ marginTop: '10px' }}>
                            <strong>Email:</strong> <a href="mailto:privacy@r-kive.com" style={{ color: '#667eea' }}>privacy@r-kive.com</a>
                        </p>
                        <p style={{ marginTop: '10px' }}>
                            <strong>Support:</strong> <a href="mailto:support@r-kive.com" style={{ color: '#667eea' }}>support@r-kive.com</a>
                        </p>
                    </section>

                    <div style={{ 
                        marginTop: '40px', 
                        padding: '20px', 
                        background: '#f0f9ff', 
                        borderRadius: '8px',
                        borderLeft: '4px solid #667eea'
                    }}>
                        <p style={{ margin: 0, fontSize: '14px' }}>
                            <strong>🔒 Your Privacy Matters:</strong> We are committed to transparency and protecting your rights. 
                            If you have any questions or concerns, please don't hesitate to reach out.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicyModal;
