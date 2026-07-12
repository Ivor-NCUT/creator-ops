"use client";
export default function ErrorPage({ reset }: { reset: () => void }) { return <main className="loading-state"><p>内容数据暂时无法加载。</p><button className="button-primary mt-4" onClick={reset}>重试</button></main>; }
