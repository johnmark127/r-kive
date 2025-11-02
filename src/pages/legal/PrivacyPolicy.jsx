import React from 'react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy = () => {
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
                    Privacy Policy
                </h1>
                
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '40px' }}>
                    Last Updated: November 2, 2025
                </p>

                <div style={{ lineHeight: '1.8', color: '#555' }}>
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
                            <li>Pages visited and time spent on pages</li>
                            <li>Search queries</li>
                            <li>Interaction with features and content</li>
                        </ul>

                        <p style={{ marginTop: '15px' }}><strong>2.4 Cookies and Tracking Technologies</strong></p>
                        <p>
                            We use cookies and similar tracking technologies to improve user experience, 
                            analyze usage patterns, and maintain your session.
                        </p>
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
                        <h2 style={{ color: '#333', fontSize: '24px', marginBottom: '15px' }}>4. Information Sharing and Disclosure</h2>
                        
                        <p><strong>4.1 We DO NOT sell your personal information.</strong></p>
                        
                        <p style={{ marginTop: '15px' }}><strong>4.2 We may share information with:</strong></p>
                        <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
                            <li><strong>Other Users:</strong> Research content you choose to make public or share</li>
                            <li><strong>Service Providers:</strong> Third-party vendors who assist in operating the Service (e.g., hosting, analytics)</li>
                            <li><strong>Educational Institutions:</strong> If you're affiliated with an institution that uses our Service</li>
                            <li><strong>Legal Authorities:</strong> When required by law or to protect our rights</li>
                            <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
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
                            We cannot guarantee absolute security of your information.
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
                            <li><strong>Restriction:</strong> Request limitation of processing your information</li>
                        </ul>
                        <p style={{ marginTop: '15px' }}>
                            To exercise these rights, please contact us at the email provided below.
                        </p>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ color: '#333', fontSize: '24px', marginBottom: '15px' }}>7. Data Retention</h2>
                        <p>
                            We retain your information for as long as your account is active or as needed to provide the Service. 
                            We may retain certain information after account closure for:
                        </p>
                        <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
                            <li>Compliance with legal obligations</li>
                            <li>Resolving disputes</li>
                            <li>Enforcing our agreements</li>
                            <li>Legitimate business purposes</li>
                        </ul>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ color: '#333', fontSize: '24px', marginBottom: '15px' }}>8. Children's Privacy</h2>
                        <p>
                            The Service is not intended for users under 13 years of age. We do not knowingly collect 
                            personal information from children under 13. If you believe we have collected information 
                            from a child under 13, please contact us immediately.
                        </p>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ color: '#333', fontSize: '24px', marginBottom: '15px' }}>9. International Data Transfers</h2>
                        <p>
                            Your information may be transferred to and processed in countries other than your own. 
                            We ensure appropriate safeguards are in place to protect your information in accordance 
                            with this Privacy Policy.
                        </p>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ color: '#333', fontSize: '24px', marginBottom: '15px' }}>10. Third-Party Links</h2>
                        <p>
                            The Service may contain links to third-party websites. We are not responsible for the 
                            privacy practices of these websites. We encourage you to review their privacy policies.
                        </p>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ color: '#333', fontSize: '24px', marginBottom: '15px' }}>11. Changes to Privacy Policy</h2>
                        <p>
                            We may update this Privacy Policy from time to time. We will notify you of significant changes 
                            by email or through a notice on the Service. The "Last Updated" date at the top indicates 
                            when this policy was last revised.
                        </p>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ color: '#333', fontSize: '24px', marginBottom: '15px' }}>12. Contact Us</h2>
                        <p>
                            If you have questions or concerns about this Privacy Policy or our data practices, please contact us:
                        </p>
                        <p style={{ marginTop: '10px' }}>
                            <strong>Email:</strong> <a href="mailto:privacy@r-kive.com" style={{ color: '#667eea' }}>privacy@r-kive.com</a>
                        </p>
                        <p style={{ marginTop: '10px' }}>
                            <strong>Support:</strong> <a href="mailto:support@r-kive.com" style={{ color: '#667eea' }}>support@r-kive.com</a>
                        </p>
                    </section>

                    <section style={{ 
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
                    </section>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
