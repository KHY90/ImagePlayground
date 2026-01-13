import { useAuth } from '../hooks/useAuth';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to ImagePlayground
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          AI-powered image generation and editing
        </p>

        {user && (
          <div className="bg-white rounded-lg shadow p-6 max-w-md mx-auto">
            <p className="text-gray-700">
              Hello, <span className="font-semibold">{user.username}</span>!
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Daily Usage: {user.dailyUsage} / {user.dailyLimit}
            </p>
          </div>
        )}

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Text to Image
            </h3>
            <p className="text-gray-600 text-sm">
              Generate images from text descriptions
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Image to Image
            </h3>
            <p className="text-gray-600 text-sm">
              Transform existing images with AI
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Inpainting
            </h3>
            <p className="text-gray-600 text-sm">
              Edit specific parts of your images
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
