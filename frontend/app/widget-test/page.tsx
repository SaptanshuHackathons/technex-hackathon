'use client';

import AstraWidget from '../../widget/components/AstraWidget';
import { AutoCrawlWidget } from '../../widget/components/AutoCrawlWidget';

export default function WidgetTestPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Page Header */}
            <header className="border-b border-gray-200 bg-white">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <h1 className="text-3xl font-semibold text-gray-900 mb-2">
                        Astra Widget Test Page
                    </h1>
                    <p className="text-gray-600">
                        Clean environment for testing the widget with real-life enterprise examples
                    </p>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-12">
                {/* Welcome Section */}
                <section className="mb-12">
                    <div className="bg-gray-50 rounded-xl p-8">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                            Welcome to Your Test Environment
                        </h2>
                        <p className="text-gray-700 mb-4 leading-relaxed">
                            This page automatically crawls a demo website and initializes the Astra widget.
                            The widget is fully functional and ready to answer questions about the crawled content.
                        </p>
                        <p className="text-gray-700 leading-relaxed">
                            <strong>Current demo:</strong> Crawling https://rbunagpur.in automatically on page load.
                        </p>
                    </div>
                </section>

                {/* Testing Instructions */}
                <section className="mb-12">
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-8 border-2 border-orange-200">
                        <h3 className="text-xl font-semibold text-orange-900 mb-4">
                            How to Test with Different Websites
                        </h3>
                        <div className="space-y-4 text-gray-700">
                            <p>To test the widget with your own enterprise website:</p>
                            <ol className="list-decimal list-inside space-y-2 ml-4">
                                <li>Edit this page component</li>
                                <li>
                                    Change the <code className="bg-white px-2 py-1 rounded">url</code> prop in the AutoCrawlWidget:
                                    <pre className="bg-gray-800 text-green-400 p-3 rounded mt-2 text-sm overflow-x-auto">
                                        {`<AutoCrawlWidget url="https://your-site.com">`}
                                    </pre>
                                </li>
                                <li>Save the file and the page will automatically crawl your site</li>
                                <li>Open the widget and ask questions about your site's content!</li>
                            </ol>
                        </div>
                    </div>
                </section>

                {/* Manual Method */}
                <section className="mb-12">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-blue-900 mb-3">
                            Manual Crawl ID Method (Alternative)
                        </h3>
                        <p className="text-blue-800 mb-3">
                            If you prefer to manually manage crawl IDs, you can:
                        </p>
                        <div className="bg-white rounded-md p-4 space-y-3">
                            <div>
                                <p className="font-semibold text-gray-700 mb-1">1. Crawl a website:</p>
                                <pre className="bg-gray-800 text-green-400 p-3 rounded text-sm overflow-x-auto">
                                    {`curl -X POST http://localhost:8000/api/scrape \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com", "max_depth": 1}'`}
                                </pre>
                            </div>
                            <div>
                                <p className="font-semibold text-gray-700 mb-1">2. Use the crawl_id in the widget:</p>
                                <pre className="bg-gray-800 text-green-400 p-3 rounded text-sm overflow-x-auto">
                                    {`<AstraWidget crawlId="your-crawl-id-here" />`}
                                </pre>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Sample Content Sections */}
                <section className="grid md:grid-cols-2 gap-6 mb-12">
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                            Sample Section 1
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                            This is sample content to simulate a real enterprise website.
                            The widget can be tested alongside regular page content to ensure
                            it doesn't interfere with the user experience.
                        </p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                            Sample Section 2
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                            Additional sample content to provide context. You can test how
                            the widget behaves when users are viewing different parts of the page.
                        </p>
                    </div>
                </section>
            </main>

            {/* Auto-crawl and Widget Integration */}
            <AutoCrawlWidget
                url="https://rbunagpur.in"
                maxDepth={1}
                apiEndpoint="http://localhost:8000"
            >
                {(crawlId, isLoading, error) => {
                    if (isLoading) {
                        return (
                            <div className="fixed bottom-8 right-8 bg-white rounded-lg shadow-lg p-6 border-2 border-orange-200">
                                <div className="flex items-center space-x-3">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
                                    <div>
                                        <p className="font-semibold text-gray-900">Initializing widget...</p>
                                        <p className="text-sm text-gray-600">Crawling website content</p>
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    if (error) {
                        return (
                            <div className="fixed bottom-8 right-8 bg-red-50 rounded-lg shadow-lg p-6 border-2 border-red-200 max-w-sm">
                                <p className="font-semibold text-red-900 mb-2">Failed to initialize widget</p>
                                <p className="text-sm text-red-700">{error}</p>
                                <p className="text-xs text-red-600 mt-3">
                                    Make sure the backend is running at http://localhost:8000
                                </p>
                            </div>
                        );
                    }

                    if (!crawlId) {
                        return null;
                    }

                    // Widget is ready with crawl ID
                    return <AstraWidget crawlId={crawlId} />;
                }}
            </AutoCrawlWidget>
        </div>
    );
}
