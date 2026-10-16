import type { NextConfig } from "next";

// GitHub Pages 배포 시에만 정적 내보내기 + 하위 경로(/fortune-service) 적용.
// 로컬 개발(npm run dev)은 그대로 루트 경로를 쓴다.
const basePath = process.env.PAGES_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  ...(basePath && {
    output: "export",
    basePath,
    trailingSlash: true,
    images: { unoptimized: true },
  }),
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
