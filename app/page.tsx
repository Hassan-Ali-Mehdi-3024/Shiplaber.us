export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold mb-6">Shipping Label Management System</h1>
      <p className="text-xl mb-8">Multi-tier shipping label management integrated with GoShippo API</p>
      <div className="flex gap-4">
        <a href="/login" className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition">
          Login
        </a>
        <a href="/dashboard" className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition">
          Dashboard
        </a>
      </div>
    </main>
  );
}