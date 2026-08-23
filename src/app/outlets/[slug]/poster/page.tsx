import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { generateQrSvg } from "@/lib/qr";
import { PrintButton } from "@/components/PrintButton";

export default async function OutletPosterPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const supabase = await createClient();
  const { data: outlet } = await supabase
    .from("outlets")
    .select("slug, name")
    .eq("slug", slug)
    .maybeSingle();

  if (!outlet) notFound();

  const hdrs = await headers();
  const host = hdrs.get("host");
  const protocol = host?.startsWith("localhost") || host?.startsWith("127.0.0.1") ? "http" : "https";
  const submitUrl = `${protocol}://${host}/submit/${outlet.slug}`;
  const qrSvg = await generateQrSvg(submitUrl);

  return (
    <div className="min-h-screen bg-ink py-8 print:bg-white print:py-0">
      <style>{`
        .qr-wrap svg { width: 100%; height: 100%; display: block; }
        @media print {
          @page { size: A3 portrait; margin: 0; }
          html, body { margin: 0; padding: 0; background: #fe1c28; }
        }
      `}</style>

      <div className="mx-auto mb-6 flex max-w-[297mm] items-center justify-between px-4 print:hidden">
        <Link href="/admin/outlets" className="font-body text-[12px] text-muted hover:text-cream">
          ← Back to outlets
        </Link>
        <PrintButton />
      </div>

      <div
        className="relative mx-auto flex flex-col items-center overflow-hidden bg-signal print:shadow-none"
        style={{
          width: "297mm",
          height: "420mm",
          boxShadow: "0 20px 60px -20px rgba(0,0,0,0.6)",
        }}
      >
        <div className="mt-[26mm] flex justify-center">
          <Image
            src="/soi55-logo.jpg"
            alt="Soi 55 Thai Kitchen"
            width={1080}
            height={738}
            className="h-[46mm] w-auto rounded-[3px]"
            priority
          />
        </div>

        <h1 className="mt-[14mm] px-[10mm] text-center font-display text-[26mm] uppercase leading-[0.95] tracking-wide text-cream">
          Scan &amp;
          <br />
          tell the boss!
        </h1>

        <p className="mt-[6mm] text-center font-body text-[7mm] font-medium text-cream/90">
          Good or bad — we really want to hear it.
        </p>

        <div className="mt-[12mm] rounded-[6mm] bg-paper p-[10mm] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]">
          <div
            className="qr-wrap h-[130mm] w-[130mm]"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
        </div>

        <p className="mt-[10mm] font-display text-[16mm] uppercase tracking-wide text-cream">
          {outlet.name}
        </p>

        <div className="mt-[8mm] flex flex-col items-center gap-[3mm] rounded-[3mm] border border-dashed border-cream/40 px-[10mm] py-[5mm]">
          <p className="text-center font-body text-[6.5mm] font-semibold text-cream">
            🎁 Get RM20 OFF your next visit
          </p>
          <p className="text-center font-body text-[6.5mm] font-semibold text-cream">
            📱 Stand a chance to win an Apple iPad!
          </p>
        </div>

        <p className="mt-auto mb-[14mm] font-body text-[4.5mm] tracking-wide text-cream/70">
          {submitUrl.replace(/^https?:\/\//, "")}
        </p>
      </div>
    </div>
  );
}
