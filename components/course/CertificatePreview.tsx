import Image from "next/image";

export function CertificatePreview() {
  return (
    <div className="w-full max-w-full mx-auto md:w-[420px] lg:w-[480px] flex items-center justify-center rounded-2xl shadow-xl hover:shadow-2xl transform transition-transform duration-500 hover:scale-[1.02] border border-white/20 bg-white/5 backdrop-blur-sm overflow-hidden p-1 md:p-2">
      <Image
        src="/assets/certificates/procerix-certificate-template.png"
        alt="Sample Certificate"
        width={1414}
        height={1000}
        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 420px, 480px"
        className="w-full h-auto object-contain rounded-xl"
        loading="lazy"
        quality={100}
      />
    </div>
  );
}
