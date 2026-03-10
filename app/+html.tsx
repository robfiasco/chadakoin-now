import { ScrollViewStyleReset } from 'expo-router/html';

// Customizes the web HTML document — only runs on web, ignored on native.
// Wraps the app in a phone frame for desktop previewing.
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <ScrollViewStyleReset />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <style>{`
          * { box-sizing: border-box; }

          body {
            margin: 0;
            background: #080808;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 24px 16px;
          }

          /* Phone frame — desktop only */
          #root {
            width: min(390px, 100%);
            height: 100vh;
            height: 100dvh;
            max-height: 844px;
            border-radius: 40px;
            box-shadow:
              0 30px 80px rgba(0,0,0,0.85),
              0 0 0 10px #111,
              0 0 0 11px #1a1a1a,
              0 0 60px rgba(100,100,100,0.05);
            overflow: hidden;
            position: relative;
          }

          /* On real mobile — fill edge to edge, no chrome */
          @media (max-width: 480px) {
            body {
              padding: 0;
              align-items: flex-start;
            }
            #root {
              width: 100%;
              max-height: none;
              border-radius: 0;
              border: none;
              box-shadow: none;
            }
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
