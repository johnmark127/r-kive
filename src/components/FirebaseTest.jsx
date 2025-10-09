import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs } from 'firebase/firestore';

const FirebaseTest = () => {
  const [connectionStatus, setConnectionStatus] = useState('Testing...');
  const [users, setUsers] = useState([]);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      // Try to read from Firestore
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      
      setConnectionStatus('✅ Connected to Firebase successfully!');
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Firebase connection error:', error);
      setConnectionStatus(`❌ Connection failed: ${error.message}`);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      background: '#f5f5f5', 
      border: '1px solid #ddd', 
      borderRadius: '8px', 
      margin: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h3>Firebase Connection Test</h3>
      <p><strong>Status:</strong> {connectionStatus}</p>
      
      {users.length > 0 && (
        <div>
          <h4>Users in Database:</h4>
          <ul>
            {users.map(user => (
              <li key={user.id}>
                {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email} ({user.email}) - Role: {user.role}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <button 
        onClick={testConnection}
        style={{
          padding: '10px 20px',
          background: '#245884',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          marginTop: '10px'
        }}
      >
        Test Connection Again
      </button>
    </div>
  );
};

export default FirebaseTest;
