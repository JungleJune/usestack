"use client";

import { useEffect, useState } from "react";
import {
  getProductLogo,
  productInitial,
  validMediaUrl,
} from "@/lib/products.mjs";

export { getProductLogo } from "@/lib/products.mjs";

export function ProductLogo({
  product,
  className = "",
  imageClassName = "",
  fallbackClassName = "",
}) {
  const logo = getProductLogo(product);
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    setLogoFailed(false);
  }, [logo]);

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden bg-white ${className}`}
      aria-hidden="true"
    >
      {logo && !logoFailed ? (
        <img
          src={logo}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setLogoFailed(true)}
          className={`h-full w-full object-contain ${imageClassName}`}
        />
      ) : (
        <span
          className={`flex h-full w-full items-center justify-center bg-[#ececea] font-semibold text-[#171717] ${fallbackClassName}`}
        >
          {productInitial(product)}
        </span>
      )}
    </span>
  );
}

export default function ProductCardMedia({
  product,
  className = "",
  priority = false,
}) {
  const thumbnail = validMediaUrl(product?.tool_thumbnail_url);
  const logo = getProductLogo(product);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);

  useEffect(() => {
    setThumbnailFailed(false);
  }, [thumbnail]);

  const showThumbnail = thumbnail && !thumbnailFailed;

  return (
    <div
      className={`relative isolate overflow-hidden bg-[#ececea] ${className}`}
    >
      {showThumbnail ? (
        <img
          src={thumbnail}
          alt={`${product?.name || "AI tool"} preview`}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          referrerPolicy="no-referrer"
          onError={() => setThumbnailFailed(true)}
          className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.025]"
        />
      ) : logo ? (
        <div className="flex h-full w-full items-center justify-center bg-[#f2f2f0] p-12">
          <ProductLogo
            product={product}
            className="h-20 w-20 rounded-[8px] border border-black/10 shadow-sm"
            imageClassName="p-3"
            fallbackClassName="text-3xl"
          />
        </div>
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[#e9e9e6]">
          <span className="text-5xl font-medium text-black/20">
            {productInitial(product)}
          </span>
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/5" />

      {showThumbnail && (
        <ProductLogo
          product={product}
          className="absolute bottom-3 left-3 h-11 w-11 rounded-[8px] border border-white/80 shadow-[0_4px_16px_rgba(0,0,0,0.14)]"
          imageClassName="p-1.5"
          fallbackClassName="text-base"
        />
      )}
    </div>
  );
}
