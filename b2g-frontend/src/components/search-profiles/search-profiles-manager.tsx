'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

interface SearchProfile {
  name: string;
  naics_codes: string[];
  min_budget?: number;
  max_budget?: number;
  min_days_to_deadline?: number;
  set_asides: string[];
  exclude_keywords: string[];
  is_active: boolean;
}

const NAICS_CODES = [
  { code: '541511', label: 'Custom Software Development' },
  { code: '541512', label: 'Computer Systems Design' },
  { code: '541513', label: 'Computer Facilities Management' },
  { code: '541519', label: 'Other Computer Related Services' },
  { code: '518210', label: 'Data Processing & Hosting' },
  { code: '611420', label: 'Computer Training' },
  { code: '541330', label: 'Engineering Services' },
  { code: '561210', label: 'Facilities Support Services' },
  { code: '562910', label: 'Environmental Remediation' },
];

const SET_ASIDES = ['Small Business', '8(a) Certified', 'HUBZone', 'Service Disabled Veteran', 'Woman-Owned'];

export function SearchProfilesManager() {
  const [profiles, setProfiles] = useState<SearchProfile[]>([]);
  const [editingProfile, setEditingProfile] = useState<SearchProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const res = await fetch('/api/search-profiles');
      const data = await res.json();
      setProfiles(data);
    } catch (error) {
      console.error('Failed to fetch profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingProfile?.name) return;

    try {
      const res = await fetch('/api/search-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingProfile),
      });

      if (res.ok) {
        await fetchProfiles();
        setEditingProfile(null);
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
    }
  };

  const handleDelete = async (name: string) => {
    try {
      const res = await fetch(`/api/search-profiles?name=${name}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await fetchProfiles();
      }
    } catch (error) {
      console.error('Failed to delete profile:', error);
    }
  };

  if (loading) {
    return <div className="p-4">Loading search profiles...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Search Profiles</h2>
        <Button
          onClick={() => setEditingProfile({
            name: '',
            naics_codes: [],
            set_asides: [],
            exclude_keywords: [],
            is_active: true,
          })}
        >
          + New Profile
        </Button>
      </div>

      {/* Existing Profiles */}
      <div className="grid gap-4">
        {profiles.map((profile) => (
          <div
            key={profile.name}
            className="border rounded-lg p-4 hover:bg-gray-50"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{profile.name}</h3>
                <p className="text-sm text-gray-600">
                  {profile.naics_codes.length} NAICS codes
                  {profile.min_budget && ` • Min: $${(profile.min_budget / 1000000).toFixed(1)}M`}
                  {profile.max_budget && ` • Max: $${(profile.max_budget / 1000000).toFixed(1)}M`}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEditingProfile(profile)}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(profile.name)}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              {editingProfile.name ? 'Edit Profile' : 'New Profile'}
            </h3>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-2">Profile Name</label>
                <Input
                  value={editingProfile.name}
                  onChange={(e) =>
                    setEditingProfile({
                      ...editingProfile,
                      name: e.target.value,
                    })
                  }
                  placeholder="e.g., Tech Contracts > $50M"
                />
              </div>

              {/* Budget Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Min Budget ($)</label>
                  <Input
                    type="number"
                    value={editingProfile.min_budget || ''}
                    onChange={(e) =>
                      setEditingProfile({
                        ...editingProfile,
                        min_budget: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    placeholder="e.g., 50000000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Max Budget ($)</label>
                  <Input
                    type="number"
                    value={editingProfile.max_budget || ''}
                    onChange={(e) =>
                      setEditingProfile({
                        ...editingProfile,
                        max_budget: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    placeholder="e.g., 500000000"
                  />
                </div>
              </div>

              {/* NAICS Codes */}
              <div>
                <label className="block text-sm font-medium mb-2">Industries (NAICS)</label>
                <div className="grid grid-cols-2 gap-2">
                  {NAICS_CODES.map((naics) => (
                    <div key={naics.code} className="flex items-center gap-2">
                      <Checkbox
                        checked={editingProfile.naics_codes.includes(naics.code)}
                        onChange={(checked) => {
                          const codes = editingProfile.naics_codes;
                          if (checked) {
                            codes.push(naics.code);
                          } else {
                            codes.splice(codes.indexOf(naics.code), 1);
                          }
                          setEditingProfile({
                            ...editingProfile,
                            naics_codes: [...codes],
                          });
                        }}
                      />
                      <span className="text-sm">{naics.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Set Asides */}
              <div>
                <label className="block text-sm font-medium mb-2">Set Asides (Optional)</label>
                <div className="grid grid-cols-2 gap-2">
                  {SET_ASIDES.map((aside) => (
                    <div key={aside} className="flex items-center gap-2">
                      <Checkbox
                        checked={editingProfile.set_asides.includes(aside)}
                        onChange={(checked) => {
                          const asides = editingProfile.set_asides;
                          if (checked) {
                            asides.push(aside);
                          } else {
                            asides.splice(asides.indexOf(aside), 1);
                          }
                          setEditingProfile({
                            ...editingProfile,
                            set_asides: [...asides],
                          });
                        }}
                      />
                      <span className="text-sm">{aside}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={editingProfile.is_active}
                  onChange={(checked) =>
                    setEditingProfile({
                      ...editingProfile,
                      is_active: checked,
                    })
                  }
                />
                <span className="text-sm">Active (use for syncs)</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 justify-end mt-6">
              <Button variant="outline" onClick={() => setEditingProfile(null)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save Profile</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
