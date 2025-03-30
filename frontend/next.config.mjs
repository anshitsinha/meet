// next.config.mjs
const nextConfig = {
    reactStrictMode: true,
    async rewrites() {
        return [
            {
                source: "/api/:path*",
                destination: "http://localhost:5000/:path*",  // Proxy to backend
            },
        ];
    },
};

export default nextConfig;   // ES module export
