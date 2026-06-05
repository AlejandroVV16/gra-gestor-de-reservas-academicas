import axiosInstance from './axiosInstance'

export const getDashboardSummary = () =>
  axiosInstance.get('/api/dashboard/summary')
