"use client";

import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";
import { getDistrictReferencePoint } from "@/lib/districtGeography.js";

const ReferencePointMap = dynamic(() => import("./DivisionPointMap.js"), { ssr: false });

export default function DistrictLocationPanel({ district, locale }) {
  const isBn = locale === "bn";
  const point = getDistrictReferencePoint(district);
  const mapLocation = point ? {
    nameEn: district.nameEn,
    nameBn: district.nameBn,
    representativePoint: { latitude: point.latitude, longitude: point.longitude },
  } : null;

  return (
    <section aria-labelledby="district-location-heading" className="rounded-2xl border border-line bg-surface p-4 shadow-km-sm sm:p-5">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(260px,0.9fr)] md:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-forest dark:text-emerald-300">
            {isBn ? "বর্তমান প্রকল্পের এলাকা · কুমিল্লা ও চট্টগ্রাম" : "Current project scope · Cumilla and Chattogram"}
          </p>
          <h2 id="district-location-heading" className="mt-1 flex items-center gap-2 text-xl font-bold text-content">
            <MapPin className="h-5 w-5 shrink-0 text-forest dark:text-emerald-300" aria-hidden="true" />
            {isBn ? `${district?.nameBn || district?.nameEn || "নির্বাচিত জেলা"} জেলার অবস্থান` : `${district?.nameEn || "Selected district"} district location`}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            {isBn
              ? "নিচের POWER, GPM, SMAP ও MODIS তথ্য নির্বাচিত জেলার জন্যই দেখানো হয়। মানচিত্রের চিহ্নটি প্রকল্পে ব্যবহৃত জেলার reference coordinate—এটি আপনার খামারের সুনির্দিষ্ট অবস্থান বা পুরো জেলার সব এলাকার পরিমাপ নয়।"
              : "The POWER, GPM, SMAP and MODIS information below is scoped to the selected district. The map marker is the project-configured district reference coordinate; it is not your exact farm location or a measurement for every place in the district."}
          </p>
          {point && (
            <p className="mt-3 text-xs font-medium text-muted">
              {isBn ? "প্রকল্প reference coordinate" : "Project reference coordinate"}: {point.latitude.toFixed(5)}° N, {point.longitude.toFixed(5)}° E
            </p>
          )}
        </div>
        {mapLocation ? (
          <ReferencePointMap division={mapLocation} locale={locale} />
        ) : (
          <div role="status" className="flex min-h-40 items-center justify-center rounded-xl border border-dashed border-line bg-surface-2 p-4 text-center text-sm text-muted">
            {isBn ? "এই জেলার জন্য বৈধ reference coordinate পাওয়া যায়নি।" : "No valid project reference coordinate is available for this district."}
          </div>
        )}
      </div>
    </section>
  );
}
