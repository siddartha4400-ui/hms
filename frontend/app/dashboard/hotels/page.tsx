"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { ALL_TENANTS, CREATE_TENANT } from "@/lib/graphql/tenants";

const PROPERTY_TYPES = [
  { value: "hotel", label: "Hotel" },
  { value: "pg", label: "Paying Guest (PG)" },
  { value: "hostel", label: "Hostel" },
  { value: "resort", label: "Resort" },
  { value: "apartment", label: "Apartment" },
];

const TYPE_BADGES: Record<string, string> = {
  hotel: "bg-blue-100 text-blue-700",
  pg: "bg-purple-100 text-purple-700",
  hostel: "bg-orange-100 text-orange-700",
  resort: "bg-emerald-100 text-emerald-700",
  apartment: "bg-amber-100 text-amber-700",
};

interface TenantItem {
  id: string;
  name: string;
  subdomain: string;
  propertyType: string;
  domain: string | null;
  isActive: boolean;
  onTrial: boolean;
  createdAt: string;
}

export default function HotelsPage() {
  const { data, loading, refetch } = useQuery<{ allTenants: TenantItem[] }>(ALL_TENANTS);
  const [createTenant, { loading: creating }] = useMutation<{
    createTenant: { tenant: TenantItem | null; domain: string; message: string };
  }>(CREATE_TENANT);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    propertyType: "hotel",
    adminUsername: "admin",
    adminPassword: "",
    adminEmail: "",
  });
  const [message, setMessage] = useState("");

  // Auto-generate subdomain preview from name + type
  const previewSubdomain = () => {
    const slug = form.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (!slug) return "";
    return `${slug}-${form.propertyType}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await createTenant({ variables: form });
      const msg = res.data?.createTenant.message || "Created!";
      setMessage(msg);
      if (res.data?.createTenant.tenant) {
        setForm({ name: "", propertyType: "hotel", adminUsername: "admin", adminPassword: "", adminEmail: "" });
        setShowForm(false);
        refetch();
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to create property");
    }
  };

  const typeLabel = (type: string) => PROPERTY_TYPES.find((t) => t.value === type)?.label || type;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Properties (Subsites)</h1>
          <p className="mt-1 text-sm text-gray-500">
            Each property runs as an independent subsite with its own data
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {showForm ? "Cancel" : "+ New Property"}
        </button>
      </div>

      {message && (
        <div className={`rounded-lg p-3 text-sm ${message.includes("created") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {message}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Create New Property</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Property Type *</label>
              <select
                required
                value={form.propertyType}
                onChange={(e) => setForm({ ...form, propertyType: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
              >
                {PROPERTY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Property Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={form.propertyType === "pg" ? "Sunrise PG" : "Grand Palace"}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          {/* URL Preview */}
          {form.name && (
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs font-medium text-gray-500 uppercase">Auto-generated URL</p>
              <p className="mt-1 text-sm font-mono text-blue-600">
                {previewSubdomain()}.localtest.me
              </p>
            </div>
          )}

          <hr className="border-gray-200" />
          <p className="text-sm font-medium text-gray-700">Admin Account for this property</p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Username *</label>
              <input
                type="text"
                required
                value={form.adminUsername}
                onChange={(e) => setForm({ ...form, adminUsername: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password *</label>
              <input
                type="password"
                required
                value={form.adminPassword}
                onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={form.adminEmail}
                onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                placeholder="admin@property.com"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={creating}
              className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create Property"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">URL</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data?.allTenants && data.allTenants.length > 0 ? (
                data.allTenants.map((t) => (
                  <tr key={t.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{t.name}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_BADGES[t.propertyType] || "bg-gray-100 text-gray-700"}`}>
                        {typeLabel(t.propertyType)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      {t.domain && (
                        <a
                          href={`http://${t.domain}:3000`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {t.domain}
                        </a>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${t.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {t.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                    No properties created yet. Click &quot;+ New Property&quot; to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
