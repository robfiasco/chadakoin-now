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
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />
        <ScrollViewStyleReset />
        <meta name="description" content="Whether you're here for the weekend or the rest of your life — your guide to Jamestown, NY." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://now.chadakoindigital.com" />
        <meta property="og:title" content="Chadakoin Now" />
        <meta property="og:description" content="Whether you're here for the weekend or the rest of your life — your guide to Jamestown, NY." />
        <meta property="og:image" content="https://now.chadakoindigital.com/apple-touch-icon.png" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Chadakoin Now" />
        <meta name="twitter:description" content="Whether you're here for the weekend or the rest of your life — your guide to Jamestown, NY." />
        <meta name="twitter:image" content="https://now.chadakoindigital.com/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Chadakoin Now" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="icon" type="image/png" href="/favicon.png" sizes="any" />
        <link rel="icon" type="image/png" href="/favicon.png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500&family=Syne:wght@600;700;800&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
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
            border-radius: 40px;
            box-shadow:
              0 30px 80px rgba(0,0,0,0.85),
              0 0 0 10px #111,
              0 0 0 11px #1a1a1a,
              0 0 60px rgba(100,100,100,0.05);
            overflow: hidden;
            position: relative;
          }

          /* Crescent Tool theme — liquid glass panels */
          .crescent-glass {
            background: rgba(255,255,255,0.06) !important;
            border-color: rgba(255,255,255,0.14) !important;
            backdrop-filter: blur(40px) saturate(180%) !important;
            -webkit-backdrop-filter: blur(40px) saturate(180%) !important;
          }
          .crescent-glass-glow {
            background: rgba(255,255,255,0.09) !important;
            border-color: rgba(255,255,255,0.22) !important;
            backdrop-filter: blur(40px) saturate(200%) brightness(1.05) !important;
            -webkit-backdrop-filter: blur(40px) saturate(200%) brightness(1.05) !important;
            box-shadow: 0 0 0 0.5px rgba(255,255,255,0.1) inset !important;
          }

          /* On real mobile — fill edge to edge, no chrome */
          @media (max-width: 480px) {
            body {
              padding: 0;
              align-items: flex-start;
              min-height: 100svh;
              height: 100svh;
            }
            #root {
              width: 100%;
              height: 100svh;
              max-height: none;
              border-radius: 0;
              border: none;
              box-shadow: none;
              overflow: hidden;
            }
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
