export const metadata = {
  title: 'Mundial Predictor',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="el">
      <body>{children}</body>
    </html>
  );
}
