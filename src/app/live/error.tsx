"use client";
export default function ErrorPage({ unstable_retry }: { unstable_retry: () => void }) { return <main className="loading-state"><p>直播电商数据暂时无法加载。</p><button className="button-primary mt-4" onClick={unstable_retry}>重试</button></main>; }
