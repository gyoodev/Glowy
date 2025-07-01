// This is a self-contained component with inline styles to avoid dependencies.
const FirebaseConfigErrorPage = () => {
  const pageStyle: React.CSSProperties = {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    backgroundColor: '#1a1a1a',
    color: '#e0e0e0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '2rem',
    textAlign: 'center',
    lineHeight: '1.6',
  };
  const cardStyle: React.CSSProperties = {
    backgroundColor: '#2c2c2c',
    padding: '2rem 2.5rem',
    borderRadius: '12px',
    maxWidth: '800px',
    border: '1px solid #444',
    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
  };
  const headerStyle: React.CSSProperties = {
    fontSize: '1.75rem',
    fontWeight: 'bold',
    color: '#ff5c5c',
    marginBottom: '1rem',
  };
   const codeBlockStyle: React.CSSProperties = {
    fontFamily: '"SF Mono", "Fira Code", "Fira Mono", "Roboto Mono", monospace',
    backgroundColor: '#1e1e1e',
    color: '#d4d4d4',
    padding: '1.5rem',
    borderRadius: '8px',
    textAlign: 'left',
    whiteSpace: 'pre-wrap',
    overflowWrap: 'break-word',
    border: '1px solid #555',
    marginTop: '1.5rem',
    marginBottom: '1.5rem',
    fontSize: '0.875rem'
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h1 style={headerStyle}>Критична Грешка в Конфигурацията</h1>
        <p>Приложението не може да се свърже с Firebase.</p>
        <p style={{ marginTop: '1rem' }}>Това се случва, защото необходимите за връзка с Firebase ключове липсват. За да разрешите проблема, моля, изпълнете следните стъпки:</p>
        <ol style={{ textAlign: 'left', marginTop: '1.5rem', paddingLeft: '2rem', listStyle: 'decimal' }}>
          <li>Намерете файла <strong>.env.local.example</strong> в главната директория на проекта.</li>
          <li>Направете копие на този файл и го преименувайте на <strong>.env.local</strong>.</li>
          <li>Отворете новия <strong>.env.local</strong> файл и попълнете стойностите с Вашите реални ключове от Firebase Console.</li>
          <li>След като запазите промените в <strong>.env.local</strong>, моля, рестартирайте приложението.</li>
        </ol>
        <div style={codeBlockStyle}>
          {`# .env.local

# Fill these with your actual credentials from the Firebase Console
# Web app's Firebase configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
NEXT_PUBLIC_FIREBASE_APP_ID=1:123...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-ABC...

# Service Account credentials (for backend operations)
# Go to Project Settings > Service accounts > Generate new private key
FIREBASE_ADMIN_PROJECT_ID="your-project-id"
FIREBASE_ADMIN_CLIENT_EMAIL="firebase-adminsdk-...@your-project-id.iam.gserviceaccount.com"
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nMII...\\n-----END PRIVATE KEY-----\\n"

# Add other API keys here if needed
# NEXT_PUBLIC_SOME_OTHER_API_KEY=...
`}
        </div>
        <p style={{ fontSize: '0.9rem', color: '#aaa' }}><strong>Важно:</strong> Не споделяйте файла <strong>.env.local</strong> или ключовете в него публично. Той е добавен в .gitignore и не трябва да бъде качван във Вашето git хранилище.</p>
      </div>
    </div>
  );
};

export default FirebaseConfigErrorPage;
