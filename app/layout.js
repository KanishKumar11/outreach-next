import "./globals.css";

export const metadata = { title: "LinkedIn Outreach Tracker", description: "Team LinkedIn outreach, follow-ups and meeting calendar" };
export const viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

// Sets the saved (or system) theme before first paint to avoid a flash.
const themeInit = `try{var t=localStorage.getItem("ot_theme");if(t!=="dark"&&t!=="light")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.setAttribute("data-theme",t)}catch(e){}`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeInit }} /></head>
      <body>{children}</body>
    </html>
  );
}
