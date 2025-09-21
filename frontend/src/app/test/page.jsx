'use client';

import Layout from '@/components/Layout/Layout';

const TestPage = () => {
  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Test Page</h1>
        <p>This is a test page to verify the sidebar is working.</p>
        <div className="mt-4 p-4 bg-green-100 rounded">
          <p className="text-green-800">If you can see this page with a sidebar on the left, the layout is working correctly!</p>
        </div>
      </div>
    </Layout>
  );
};

export default TestPage;
