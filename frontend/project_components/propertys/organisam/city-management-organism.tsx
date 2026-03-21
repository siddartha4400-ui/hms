'use client';

import React from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { InputBox, PopupToast } from '@/components';
import { FiMapPin, FiPlus } from 'react-icons/fi';
import { CREATE_CITY_MUTATION, LIST_CITIES_QUERY, UPDATE_CITY_MUTATION } from '../graphql/operations';

type City = {
  id: number;
  cityName: string;
  state?: string;
  country?: string;
  isActive: boolean;
};

type CreateCityResult = {
  createCity?: {
    success: boolean;
    message?: string;
  };
};

export default function CityManagementOrganism() {
  const [form, setForm] = React.useState({ cityName: '', state: '', country: '' });
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');
  const [cityTab, setCityTab] = React.useState<'active' | 'disabled'>('active');

  const { data, loading, refetch } = useQuery<{ listCities: City[] }>(LIST_CITIES_QUERY, {
    variables: {},
  });

  const [createCity, { loading: creating }] = useMutation<CreateCityResult>(CREATE_CITY_MUTATION);
  const [updateCity] = useMutation(UPDATE_CITY_MUTATION);

  const onSubmit = async () => {
    setError('');
    setMessage('');

    if (!form.cityName.trim()) {
      setError('City name is required');
      return;
    }

    try {
      const result = await createCity({
        variables: {
          cityName: form.cityName.trim(),
          state: form.state.trim() || null,
          country: form.country.trim() || null,
          isActive: true,
        },
      });

      const payload = result.data?.createCity;
      if (!payload?.success) {
        setError(payload?.message || 'Unable to create city');
        return;
      }

      setMessage(payload.message || 'City created');
      setForm({ cityName: '', state: '', country: '' });
      await refetch();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to create city');
    }
  };

  const cities = data?.listCities || [];
  const filteredCities = cities.filter((city) => city.isActive === (cityTab === 'active'));

  const onToggleCity = async (city: City, nextActive: boolean) => {
    setError('');
    setMessage('');
    try {
      const result = await updateCity({ variables: { cityId: city.id, isActive: nextActive } });
      const payload = result.data?.updateCity;
      if (!payload?.success) {
        setError(payload?.message || 'Unable to update city');
        return;
      }
      setMessage(payload.message || (nextActive ? 'City enabled' : 'City disabled'));
      await refetch();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to update city');
    }
  };

  return (
    <div className="min-h-screen p-3 md:p-6" style={{ background: 'var(--bg-base)' }}>
      <PopupToast message={error || message} variant={error ? 'error' : 'success'} />

      <div className="max-w-6xl mx-auto space-y-6">
        <div className="rounded-2xl p-4 md:p-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            City Management
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Create city records here, then select them in Subsite Dashboard.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-5">
            <InputBox
              placeholder="City name *"
              value={form.cityName}
              onChange={(e) => setForm((prev) => ({ ...prev, cityName: e.target.value }))}
            />
            <InputBox
              placeholder="State"
              value={form.state}
              onChange={(e) => setForm((prev) => ({ ...prev, state: e.target.value }))}
            />
            <InputBox
              placeholder="Country"
              value={form.country}
              onChange={(e) => setForm((prev) => ({ ...prev, country: e.target.value }))}
            />
            <button
              type="button"
              onClick={onSubmit}
              disabled={creating}
              className="h-12 rounded-xl inline-flex items-center justify-center gap-2"
              style={{
                background: 'var(--brand-dim)',
                color: 'var(--brand-light)',
                border: '1px solid var(--brand-border)',
                opacity: creating ? 0.75 : 1,
              }}
            >
              <FiPlus /> {creating ? 'Creating...' : 'Create City'}
            </button>
          </div>
        </div>

        <div className="rounded-2xl p-4 md:p-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Cities
            </h2>
            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                <button type="button" onClick={() => setCityTab('active')} className="px-3 py-1 text-xs" style={{ background: cityTab === 'active' ? 'var(--brand-dim)' : 'transparent', color: cityTab === 'active' ? 'var(--brand-light)' : 'var(--text-secondary)' }}>Active</button>
                <button type="button" onClick={() => setCityTab('disabled')} className="px-3 py-1 text-xs" style={{ background: cityTab === 'disabled' ? 'var(--brand-dim)' : 'transparent', color: cityTab === 'disabled' ? 'var(--brand-light)' : 'var(--text-secondary)' }}>Disabled</button>
              </div>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {filteredCities.length} total
              </span>
            </div>
          </div>

          {loading ? (
            <p className="text-sm mt-4" style={{ color: 'var(--text-secondary)' }}>
              Loading cities...
            </p>
          ) : filteredCities.length === 0 ? (
            <p className="text-sm mt-4" style={{ color: 'var(--text-secondary)' }}>
              No cities in this tab.
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredCities.map((city) => (
                <div key={city.id} className="rounded-xl p-4" style={{ border: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{city.cityName}</p>
                  <p className="text-xs mt-1 inline-flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                    <FiMapPin className="w-3 h-3" />
                    {[city.state, city.country].filter(Boolean).join(', ') || 'Location not specified'}
                  </p>
                  <div className="mt-3 flex gap-2">
                    {city.isActive ? (
                      <button type="button" onClick={() => onToggleCity(city, false)} className="px-2 py-1 rounded-lg text-xs" style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>Disable</button>
                    ) : (
                      <button type="button" onClick={() => onToggleCity(city, true)} className="px-2 py-1 rounded-lg text-xs" style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>Enable</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
