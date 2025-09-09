import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          歡迎使用 PCM 系統
        </h1>
        <p className="text-xl text-center mb-8 text-muted-foreground">
          Personnel Career Management System
        </p>
        <div className="flex justify-center">
          <Button size="lg" variant="default">
            開始使用
          </Button>
        </div>
      </div>
    </main>
  )
}