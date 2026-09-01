/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@a0x/confidential-pay", "@a0x/confidential-pay-core"],
  poweredByHeader: false,
};

export default nextConfig;