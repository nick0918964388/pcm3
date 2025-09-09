export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-xl font-semibold">人員通訊錄管理系統</h1>
        </div>
      </header>
      <main className="container mx-auto px-4">
        {children}
      </main>
    </div>
  )
}