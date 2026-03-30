'use client';

import React from 'react';
import { useLazyQuery, useMutation, useQuery } from '@apollo/client/react';
import { InputBox, PopupToast } from '@/components';
import { FiCheckCircle, FiEdit2, FiGlobe, FiPower, FiRefreshCw, FiSave, FiSearch, FiTrash2 } from 'react-icons/fi';
import Link from 'next/link';
import {
  CHECK_HMS_NAME_QUERY,
  CREATE_HMS_MUTATION,
  DELETE_HMS_MUTATION,
  LIST_HMS_QUERY,
  UPDATE_HMS_MUTATION,
} from '../graphql/operations';

type HMSRow = {
  id: number;
  hmsName: string;
  subsiteUrl: string;
  hmsType: number;
  isActive: boolean;
  hmsDisplayName: string;
  adminName?: string;
  email?: string;
  mobileNumber?: string;
  timePeriod?: number;
  aboutHms?: string;
};

type HMSListData = {
  subsiteBaseDomain?: string;
  listHms: HMSRow[];
};

type HMSActionResponse = {
  success: boolean;
  message: string;
};

type CreateHMSResponse = {
  createHms: HMSActionResponse;
};

type UpdateHMSResponse = {
  updateHms: HMSActionResponse;
};

type DeleteHMSResponse = {
  deleteHms: HMSActionResponse;
};

type NameAvailabilityResponse = {
  checkHmsNameAvailability: {
    isAvailable: boolean;
    message: string;
    normalizedName: string;
    subsiteUrl: string;
  };
};

const initialForm = {
  hmsName: '',
  hmsDisplayName: '',
  hmsType: 1,
  mobileNumber: '',
  adminName: '',
  email: '',
  password: '',
  timePeriod: 12,
  aboutHms: '',
};

export default function SubsitesOrganism() {
  const [formData, setFormData] = React.useState(initialForm);
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [statusMessage, setStatusMessage] = React.useState('');
  const [errorMessage, setErrorMessage] = React.useState('');
  const [nameCheckInfo, setNameCheckInfo] = React.useState('');

  const { data, loading, refetch } = useQuery<HMSListData>(LIST_HMS_QUERY, {
    fetchPolicy: 'network-only',
  });

  const [checkName, { loading: checkingName }] = useLazyQuery<NameAvailabilityResponse>(CHECK_HMS_NAME_QUERY, {
    fetchPolicy: 'network-only',
  });

  const [createHms, { loading: creating }] = useMutation<CreateHMSResponse>(CREATE_HMS_MUTATION);
  const [updateHms, { loading: updating }] = useMutation<UpdateHMSResponse>(UPDATE_HMS_MUTATION);
  const [deleteHms, { loading: deleting }] = useMutation<DeleteHMSResponse>(DELETE_HMS_MUTATION);

  const busy = creating || updating || deleting;
  const derivedBaseDomain = data?.subsiteBaseDomain || 'ourdomain.com';

  const onFieldChange = (key: keyof typeof initialForm, value: string | number) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (key === 'hmsName') {
      setNameCheckInfo('');
    }
  };

  const resetForm = () => {
    setFormData(initialForm);
    setEditingId(null);
    setNameCheckInfo('');
    setErrorMessage('');
    setStatusMessage('');
  };

  const checkNameAvailability = async () => {
    if (!formData.hmsName.trim()) {
      return;
    }

    try {
      const { data: checkData } = await checkName({
        variables: {
          hmsName: formData.hmsName,
          excludeHmsId: editingId,
        },
      });

      const result = checkData?.checkHmsNameAvailability;
      if (!result) {
        return;
      }

      setNameCheckInfo(
        result.isAvailable
          ? `${result.normalizedName} is available -> ${result.subsiteUrl}`
          : result.message,
      );
    } catch {
      setNameCheckInfo('Unable to validate hms_name right now');
    }
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage('');
    setStatusMessage('');

    try {
      if (editingId) {
        const response = await updateHms({
          variables: {
            hmsId: editingId,
            hmsName: formData.hmsName,
            hmsDisplayName: formData.hmsDisplayName,
            hmsType: Number(formData.hmsType),
            mobileNumber: formData.mobileNumber,
            aboutHms: formData.aboutHms,
            timePeriod: Number(formData.timePeriod),
          },
        });

        const result = response.data?.updateHms;
        if (!result?.success) {
          setErrorMessage(result?.message || 'Unable to update subsite');
          return;
        }

        setStatusMessage(result.message || 'Subsite updated successfully');
      } else {
        const response = await createHms({
          variables: {
            hmsName: formData.hmsName,
            hmsDisplayName: formData.hmsDisplayName,
            hmsType: Number(formData.hmsType),
            mobileNumber: formData.mobileNumber,
            aboutHms: formData.aboutHms,
            adminName: formData.adminName,
            email: formData.email,
            password: formData.password,
            timePeriod: Number(formData.timePeriod),
            isActive: true,
          },
        });

        const result = response.data?.createHms;
        if (!result?.success) {
          setErrorMessage(result?.message || 'Unable to create subsite');
          return;
        }

        setStatusMessage(result.message || 'Subsite created successfully');
      }

      await refetch();
      resetForm();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unexpected error while saving subsite';
      setErrorMessage(message);
    }
  };

  const handleEdit = (row: HMSRow) => {
    setEditingId(row.id);
    setFormData({
      hmsName: row.hmsName || '',
      hmsDisplayName: row.hmsDisplayName || '',
      hmsType: row.hmsType || 1,
      mobileNumber: row.mobileNumber || '',
      adminName: row.adminName || '',
      email: row.email || '',
      password: '',
      timePeriod: row.timePeriod || 12,
      aboutHms: row.aboutHms || '',
    });
    setStatusMessage('');
    setErrorMessage('');
  };

  const handleDelete = async (hmsId: number) => {
    setErrorMessage('');
    setStatusMessage('');

    try {
      const response = await deleteHms({ variables: { hmsId } });
      const result = response.data?.deleteHms;

      if (!result?.success) {
        setErrorMessage(result?.message || 'Unable to delete subsite');
        return;
      }

      setStatusMessage(result.message || 'Subsite deleted');
      await refetch();
      if (editingId === hmsId) {
        resetForm();
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unexpected error while deleting';
      setErrorMessage(message);
    }
  };

  const toggleStatus = async (row: HMSRow) => {
    setErrorMessage('');
    setStatusMessage('');

    try {
      const response = await updateHms({
        variables: {
          hmsId: row.id,
          isActive: !row.isActive,
        },
      });

      const result = response.data?.updateHms;
      if (!result?.success) {
        setErrorMessage(result?.message || 'Unable to update status');
        return;
      }

      setStatusMessage(result.message || 'Status updated successfully');
      await refetch();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unexpected error while updating status';
      setErrorMessage(message);
    }
  };

  return (
    <div className="min-h-screen p-6" style={{ background: 'var(--bg-base)' }}>
      <PopupToast message={errorMessage || statusMessage} variant={errorMessage ? 'error' : 'success'} />

      <div className="max-w-7xl mx-auto space-y-6">
        <div className="rounded-2xl p-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>Subsite Management</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Create and manage individual HMS subsites. Each hms_name maps to https://name.yourdomain.com.
          </p>
          <div className="mt-3">
            <Link
              href={editingId ? `/subsite-dashboard?subsiteId=${editingId}` : '/subsite-dashboard'}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg no-underline text-xs font-medium"
              style={{ background: 'var(--brand-dim)', color: 'var(--brand-light)', border: '1px solid var(--brand-border)' }}
            >
              Open Subsite Property Dashboard
            </Link>
          </div>
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <FiGlobe className="w-4 h-4" style={{ color: 'var(--brand)' }} />
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Base domain source: backend setting SUBSITE_BASE_DOMAIN (current: {derivedBaseDomain})
            </span>
          </div>
        </div>

        <form onSubmit={onSubmit} className="rounded-2xl p-6 space-y-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>hms_name</label>
              <InputBox
                value={formData.hmsName}
                onChange={(e) => onFieldChange('hmsName', e.target.value)}
                onBlur={checkNameAvailability}
                placeholder="sriyans"
                disabled={busy}
              />
              {nameCheckInfo ? (
                <p className="text-xs mt-1 inline-flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                  <FiSearch className="w-3.5 h-3.5" />
                  {nameCheckInfo}
                </p>
              ) : null}
            </div>

            <div>
              <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Display Name</label>
              <InputBox
                value={formData.hmsDisplayName}
                onChange={(e) => onFieldChange('hmsDisplayName', e.target.value)}
                placeholder="Sriyans Residency"
                disabled={busy}
              />
            </div>

            <div>
              <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Type</label>
              <select
                value={formData.hmsType}
                onChange={(e) => onFieldChange('hmsType', Number(e.target.value))}
                disabled={busy}
                className="form-select mobile-select-control w-full h-12 rounded-lg px-3"
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              >
                <option value={1}>Lodge</option>
                <option value={2}>PG</option>
              </select>
            </div>

            <div>
              <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Time Period (Months)</label>
              <InputBox
                type="number"
                min={1}
                value={formData.timePeriod}
                onChange={(e) => onFieldChange('timePeriod', Number(e.target.value))}
                disabled={busy}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Admin Name</label>
              <InputBox
                value={formData.adminName}
                onChange={(e) => onFieldChange('adminName', e.target.value)}
                disabled={busy || editingId !== null}
                placeholder="Subsite Admin"
              />
            </div>
            <div>
              <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Admin Email</label>
              <InputBox
                type="email"
                value={formData.email}
                onChange={(e) => onFieldChange('email', e.target.value)}
                disabled={busy || editingId !== null}
                placeholder="admin@example.com"
              />
            </div>
            <div>
              <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Admin Password</label>
              <InputBox
                type="password"
                value={formData.password}
                onChange={(e) => onFieldChange('password', e.target.value)}
                disabled={busy || editingId !== null}
                placeholder={editingId ? 'Password cannot be edited here' : 'Strong password'}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Mobile Number</label>
              <InputBox
                value={formData.mobileNumber}
                onChange={(e) => onFieldChange('mobileNumber', e.target.value)}
                disabled={busy}
                placeholder="9876543210"
              />
            </div>
            <div>
              <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>About HMS</label>
              <InputBox
                value={formData.aboutHms}
                onChange={(e) => onFieldChange('aboutHms', e.target.value)}
                disabled={busy}
                placeholder="Small description"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={busy || checkingName}
              className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              style={{ background: 'var(--brand-dim)', color: 'var(--brand-light)', border: '1px solid var(--brand-border)', boxShadow: '0 8px 20px rgba(6,182,212,0.08)' }}
            >
              <FiSave className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
              {editingId ? (updating ? 'Updating...' : 'Update Subsite') : (creating ? 'Creating...' : 'Create Subsite')}
            </button>

            <button
              type="button"
              onClick={resetForm}
              className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
              style={{ background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
            >
              <FiRefreshCw className="w-4 h-4 transition-transform duration-300 group-hover:rotate-180" />
              Reset Form
            </button>

            {editingId ? (
              <span className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-lg" style={{ color: 'var(--positive)', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <FiCheckCircle className="w-3.5 h-3.5" />
                Editing subsite id {editingId}
              </span>
            ) : null}
          </div>
        </form>

        <div className="rounded-2xl p-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Subsites</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ color: 'var(--text-secondary)' }}>
                  <th className="text-left py-2">HMS</th>
                  <th className="text-left py-2">Subsite</th>
                  <th className="text-left py-2">Type</th>
                  <th className="text-left py-2">Admin</th>
                  <th className="text-left py-2">Mobile</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="py-4" colSpan={7} style={{ color: 'var(--text-muted)' }}>Loading subsites...</td>
                  </tr>
                ) : data?.listHms?.length ? (
                  data.listHms.map((row) => (
                    <tr key={row.id} style={{ borderTop: '1px solid var(--border)' }}>
                      <td className="py-3" style={{ color: 'var(--text-primary)' }}>
                        <p className="font-medium">{row.hmsDisplayName}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{row.hmsName}</p>
                      </td>
                      <td className="py-3">
                        <a
                          href={row.subsiteUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="no-underline break-all"
                          style={{ color: 'var(--brand)' }}
                        >
                          {row.subsiteUrl}
                        </a>
                      </td>
                      <td className="py-3" style={{ color: 'var(--text-primary)' }}>{row.hmsType === 1 ? 'Lodge' : 'PG'}</td>
                      <td className="py-3" style={{ color: 'var(--text-primary)' }}>
                        <p>{row.adminName || '-'}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{row.email || '-'}</p>
                      </td>
                      <td className="py-3" style={{ color: 'var(--text-primary)' }}>{row.mobileNumber || '-'}</td>
                      <td className="py-3">
                        <span
                          className="text-xs px-2 py-1 rounded-md"
                          style={{
                            color: row.isActive ? 'var(--positive)' : 'var(--danger)',
                            background: row.isActive ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                            border: row.isActive ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(239,68,68,0.25)',
                          }}
                        >
                          {row.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/subsite-dashboard?subsiteId=${row.id}`}
                            className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs no-underline transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
                            style={{ border: '1px solid var(--border)', color: 'var(--brand-light)', background: 'var(--brand-dim)' }}
                          >
                            Open Dashboard
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleEdit(row)}
                            className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
                            style={{ border: '1px solid var(--border)', color: 'var(--text-primary)', background: 'var(--bg-elevated)' }}
                          >
                            <FiEdit2 className="w-3 h-3 transition-transform duration-200 group-hover:scale-110" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleStatus(row)}
                            className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
                            style={{ border: '1px solid var(--border)', color: 'var(--text-primary)', background: 'var(--bg-elevated)' }}
                          >
                            <FiPower className="w-3 h-3 transition-transform duration-200 group-hover:scale-110" />
                            {row.isActive ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(row.id)}
                            className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
                            style={{ border: '1px solid rgba(239,68,68,0.35)', color: 'var(--danger)', background: 'rgba(239,68,68,0.06)' }}
                          >
                            <FiTrash2 className="w-3 h-3 transition-transform duration-200 group-hover:scale-110" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-4" colSpan={7} style={{ color: 'var(--text-muted)' }}>No subsites found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
