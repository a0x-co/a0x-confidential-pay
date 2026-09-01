/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@bvdaniel/confidential-pay", "@bvdaniel/confidential-pay-core"],
  poweredByHeader: false,
};

export default nextConfig;