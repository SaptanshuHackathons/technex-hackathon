import AstraWidget from '../components/AstraWidget';

export default function TestPage() {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-white mb-4">Astra Widget Test Page</h1>
                <p className="text-gray-400 mb-8">Look for the chat widget in the bottom-right corner</p>

                <div className="max-w-2xl mx-auto text-left space-y-4 text-gray-300">
                    <h2 className="text-2xl font-semibold text-white">Usage Examples:</h2>

                    <div className="bg-gray-900 p-4 rounded-lg">
                        <h3 className="text-lg font-medium text-white mb-2">1. Default Usage</h3>
                        <pre className="text-sm text-green-400">
                            {`<AstraWidget apiKey="your-api-key" />`}
                        </pre>
                    </div>

                    <div className="bg-gray-900 p-4 rounded-lg">
                        <h3 className="text-lg font-medium text-white mb-2">2. Custom Theme</h3>
                        <pre className="text-sm text-green-400">
                            {`<AstraWidget
  apiKey="your-api-key"
  title="Support Chat"
  appearance={{
    variables: {
      primaryColor: '#6366f1',
      borderRadius: '0.5rem',
    }
  }}
/>`}
                        </pre>
                    </div>

                    <div className="bg-gray-900 p-4 rounded-lg">
                        <h3 className="text-lg font-medium text-white mb-2">3. Compound Components</h3>
                        <pre className="text-sm text-green-400">
                            {`<AstraWidget.Root apiKey="your-api-key">
  <AstraWidget.Toggle />
  <AstraWidget.Window>
    <AstraWidget.Header />
    <AstraWidget.Messages />
    <AstraWidget.Input />
    <AstraWidget.Footer />
  </AstraWidget.Window>
</AstraWidget.Root>`}
                        </pre>
                    </div>
                </div>
            </div>

            {/* Default implementation */}
            <AstraWidget apiKey="demo-key-123" />
        </div>
    );
}
