import { withWorkflow } from 'workflow/next'; 
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    turbo: {
      resolveAlias: {
        underscore: 'lodash',
      },
    },
  },
}

export default withWorkflow(nextConfig); 


