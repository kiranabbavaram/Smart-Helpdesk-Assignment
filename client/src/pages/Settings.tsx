import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, endpoints } from '../lib/api';

const Settings: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: config } = useQuery({
    queryKey: ['config'],
    queryFn: async () => {
      const res = await api.get(endpoints.config.get);
      return res.data as { autoCloseEnabled: boolean; confidenceThreshold: number; slaHours: number };
    },
  });

  const [autoCloseEnabled, setAutoCloseEnabled] = useState<boolean>(config?.autoCloseEnabled ?? true);
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(config?.confidenceThreshold ?? 0.78);
  const [slaHours, setSlaHours] = useState<number>(config?.slaHours ?? 24);

  React.useEffect(() => {
    if (config) {
      setAutoCloseEnabled(config.autoCloseEnabled);
      setConfidenceThreshold(config.confidenceThreshold);
      setSlaHours(config.slaHours);
    }
  }, [config]);

  const save = useMutation({
    mutationFn: async () => {
      const res = await api.put(endpoints.config.update, { autoCloseEnabled, confidenceThreshold, slaHours });
      return res.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['config'] });
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      <p className="mt-1 text-sm text-gray-500">Configure system settings and preferences</p>
      <div className="mt-6 bg-white shadow rounded-lg p-6 space-y-4">
        <label className="flex items-center space-x-2">
          <input type="checkbox" checked={autoCloseEnabled} onChange={(e) => setAutoCloseEnabled(e.target.checked)} />
          <span>Auto Close Enabled</span>
        </label>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Confidence Threshold</label>
          <input type="number" min={0} max={1} step={0.01} className="border rounded px-3 py-2" value={confidenceThreshold} onChange={(e) => setConfidenceThreshold(Number(e.target.value))} />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">SLA Hours</label>
          <input type="number" min={1} className="border rounded px-3 py-2" value={slaHours} onChange={(e) => setSlaHours(Number(e.target.value))} />
        </div>
        <button onClick={() => save.mutate()} className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
      </div>
    </div>
  );
};

export default Settings;

