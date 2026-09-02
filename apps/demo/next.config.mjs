/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@bvdaniel/private-pay", "@bvdaniel/private-pay-core"],
  poweredByHeader: false,
};

export default nextConfig;