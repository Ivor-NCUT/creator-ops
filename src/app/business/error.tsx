"use client";
export default function ErrorPage({ unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) { return <main className="loading-state"><p>商务数据加载失败。</p><button className="button-secondary" onClick={() => unstable_retry()}>重试</button></main>; }
