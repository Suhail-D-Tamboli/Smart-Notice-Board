import React from 'react';

interface Props {
  currentView: 'notices' | 'events' | 'dashboard';
  setCurrentView: (v: 'notices' | 'events' | 'dashboard') => void;
  language: 'en' | 'kn' | 'hi';
  handleLanguageChange: (v: 'en' | 'kn' | 'hi') => void;
  translating: boolean;
  notificationEnabled: boolean;
  checkingNotification: boolean;
  enableNotifications: () => Promise<void>;
  renderItems: () => React.ReactNode;
}

const StudentPortalHome: React.FC<Props> = ({
  currentView,
  setCurrentView,
  language,
  handleLanguageChange,
  translating,
  notificationEnabled,
  checkingNotification,
  enableNotifications,
  renderItems
}) => {
  return (
    <>
      <div className="toolbar">
        <div className="controls">
          <input
            type="text"
            placeholder="Search..."
            className="input"
          />

          <button
            onClick={enableNotifications}
            disabled={notificationEnabled || checkingNotification}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: '2px solid',
              borderColor: notificationEnabled ? '#10b981' : '#3b82f6',
              background: notificationEnabled ? '#10b981' : '#3b82f6',
              color: 'white',
              cursor: notificationEnabled ? 'default' : 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: checkingNotification ? 0.7 : 1,
              minWidth: '140px',
              justifyContent: 'center',
              transition: 'all 0.3s ease'
            }}
            title={notificationEnabled ? 'Notifications enabled' : 'Enable push notifications'}
          >
            <span style={{ fontSize: '20px' }}>
              {checkingNotification ? '⏳' : (notificationEnabled ? '🔔✅' : '🔔')}
            </span>
            <span>
              {checkingNotification ? 'Checking...' : (notificationEnabled ? 'Enabled' : 'Enable Alerts')}
            </span>
          </button>

          <div className="spacer"></div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px' }}>
          <span style={{ fontSize: '14px', color: 'var(--muted)', fontWeight: '600' }}>Language:</span>
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value as 'en' | 'kn' | 'hi')}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--input-bg)',
              color: 'var(--text)',
              fontSize: '14px'
            }}
            disabled={translating}
          >
            <option value="en">English</option>
            <option value="kn">ಕನ್ನಡ (Kannada)</option>
            <option value="hi">हिंदी (Hindi)</option>
          </select>
          {translating && (
            <span style={{ fontSize: '14px', color: 'var(--muted)' }}>Translating...</span>
          )}
        </div>
      </div>

      <div className="lists">
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>{currentView === 'notices' ? 'Notices' : 'Events'}</h2>
            <div>
              <button
                className={currentView === 'notices' ? 'active' : ''}
                onClick={() => setCurrentView('notices')}
                style={{
                  padding: '10px 20px',
                  marginRight: '10px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: currentView === 'notices' ? 'var(--accent)' : 'transparent',
                  color: currentView === 'notices' ? 'white' : 'var(--text)',
                  cursor: 'pointer'
                }}
              >
                Notices
              </button>
              <button
                className={currentView === 'events' ? 'active' : ''}
                onClick={() => setCurrentView('events')}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: currentView === 'events' ? 'var(--accent)' : 'transparent',
                  color: currentView === 'events' ? 'white' : 'var(--text)',
                  cursor: 'pointer'
                }}
              >
                Events
              </button>
            </div>
          </div>
          {renderItems()}
        </div>
      </div>
    </>
  );
};

export default StudentPortalHome;
