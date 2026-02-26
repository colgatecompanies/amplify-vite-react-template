import { useState, useEffect } from 'react';
import { getCurrentUser, signOut, fetchUserAttributes } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import { Link } from 'react-router-dom';
import { isAdmin } from '../utils/authUtils';

function AuthHeader() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userIsAdmin, setUserIsAdmin] = useState(false);

  useEffect(() => {
    checkAuth();

    const hubListener = Hub.listen('auth', ({ payload }) => {
      if (payload.event === 'signedIn') {
        checkAuth();
      } else if (payload.event === 'signedOut') {
        setUserEmail(null);
        setUserIsAdmin(false);
      }
    });

    return () => hubListener();
  }, []);

  async function checkAuth() {
    try {
      await getCurrentUser();
      const attributes = await fetchUserAttributes();
      setUserEmail(attributes.email || 'User');
      isAdmin().then(setUserIsAdmin);
    } catch {
      setUserEmail(null);
      setUserIsAdmin(false);
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
      setUserEmail(null);
      setUserIsAdmin(false);
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  if (!userEmail) return null;

  return (
    <div className="auth-header">
      <span className="auth-header-email">{userEmail}</span>
      {userIsAdmin && (
        <Link to="/admin" className="auth-header-admin-link">Admin</Link>
      )}
      <button onClick={handleSignOut} className="auth-header-signout">Sign Out</button>
    </div>
  );
}

export default AuthHeader;
