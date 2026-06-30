import Image from "next/image";

export function CertificatePreview({ user }: { user?: any }) {
  const fullName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || "Certificate Holder";
  
  return (
    <div className="w-full max-w-full mx-auto md:w-[420px] lg:w-[480px] flex items-center justify-center rounded-2xl shadow-xl hover:shadow-2xl transform transition-transform duration-500 hover:scale-[1.02] border border-white/20 bg-white/5 backdrop-blur-sm overflow-visible p-1 md:p-2 relative">
      <div className="relative w-full">
        <Image
          src="/assets/certificates/procerix-certificate-template.png"
          alt="Premium Certificate Preview"
          width={1414}
          height={1000}
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 420px, 480px"
          className="w-full h-auto object-contain rounded-xl"
          loading="lazy"
          quality={100}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
           <div className="mt-[2%] text-center px-4 w-full">
              <span className="font-serif text-[#111827] text-[1.5rem] md:text-[1.8rem] lg:text-[2rem] font-bold border-b-2 border-blue-600 pb-1 inline-block truncate max-w-[80%] drop-shadow-sm">
                {fullName}
              </span>
           </div>
        </div>
      </div>
    </div>
  );
}
