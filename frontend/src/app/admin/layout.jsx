'use client';

import Layout from '@/components/Layout/Layout';

export default function AdminLayout({ children }) {
  return (
    <Layout requiredRole="admin">
      {children}
    </Layout>
  );
}
