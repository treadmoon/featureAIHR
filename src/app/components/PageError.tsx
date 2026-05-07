'use client';

export default function PageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 p-8">
      <div className="text-4xl">⚠️</div>
      <h2 className="text-lg font-semibold text-gray-900">出错了</h2>
      <p className="max-w-md text-center text-sm text-gray-500">
        {error.message || '加载页面时发生错误，请稍后重试。'}
      </p>
      <button
        onClick={reset}
        className="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        重试
      </button>
    </div>
  );
}
