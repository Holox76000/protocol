import Image from "next/image";

export default function GaryLinkovQuoteSection() {
  return (
    <section className="program-gary-quote" aria-labelledby="program-gary-quote-title">
      <div className="program-gary-quote__inner">
        <div className="program-gary-quote__avatar">
          <Image
            src="/program/static/landing/images/home/new-approach/avatar.webp"
            alt="Picture of Dr Gary Linkov"
            fill
            sizes="112px"
            style={{ objectFit: "cover" }}
          />
        </div>

        <div className="program-gary-quote__content">
          <svg className="program-gary-quote__mark" width="32" height="31" viewBox="0 0 32 31" fill="none" aria-hidden="true">
            <path d="M0 30.8027V18.4724C0 10.1054 2.34862 3.79351 12.3303 0.710938V7.02286C7.63303 8.63755 6.16514 11.4265 6.31193 18.4724H12.3303V30.8027H0ZM25.8349 18.4724H32V30.8027H19.6697V18.4724C19.6697 10.1054 21.8716 3.79351 31.8532 0.710938V7.02286C27.156 8.63755 25.8349 11.4265 25.8349 18.4724Z" fill="#CDDBE1" />
          </svg>
          <h2 id="program-gary-quote-title" className="program-gary-quote__title">
            I’m thrilled by Protocol’s innovative approach to
            <span>cosmetic care</span>
          </h2>
          <p className="program-gary-quote__author">Dr Gary Linkov</p>
        </div>
      </div>
    </section>
  );
}
