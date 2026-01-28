export const metadata = {
  title: 'TBS Tax Checklist',
  description: 'The Books Solution Tax Portal',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
