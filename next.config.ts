// sucecho/next.config.ts
import type { NextConfig } from 'next';
import withPWAInit from 'next-pwa';
import withBundleAnalyzerInit from '@next/bundle-analyzer';

const withPWA = withPWAInit({
    dest: 'public',
    disable: process.env.NODE_ENV === 'development',
    register: true,
    skipWaiting: true,
});

const withTM = withBundleAnalyzerInit({
    enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
    reactStrictMode: true,
    webpack(config) {
        config.module.rules.push({
            test: /\.svg$/i,
            issuer: /\.[jt]sx?$/,
            use: ['@svgr/webpack'],
        });
        return config;
    },
};

export default withTM(withPWA(nextConfig));
