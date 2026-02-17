import { SearchProfilesManager } from '@/components/search-profiles/search-profiles-manager';

export default function SearchProfilesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="border-b p-6">
            <h1 className="text-3xl font-bold">Search Profiles</h1>
            <p className="text-gray-600 mt-2">
              Define custom filters to speed up opportunity syncing. Choose industries, budget range, and set-asides.
            </p>
          </div>

          <SearchProfilesManager />

          <div className="border-t p-6 bg-blue-50">
            <h3 className="font-semibold mb-2">💡 How Search Profiles Work</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>✅ Create profiles like "Tech Contracts > $50M" or "Small Business Construction"</li>
              <li>✅ Mark profiles as Active to use them for syncing</li>
              <li>✅ When you click "Sync SAM.gov", only active profiles will be searched</li>
              <li>✅ This reduces sync time from 15 minutes to 2-3 minutes!</li>
              <li>✅ You can have multiple profiles - all active ones will be processed</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
