import Head from "next/head";
import Image from "next/image";
import Card from "../../components/Card";

export default function Projects() {
  return (
    <>
      <Head>
        <title>Oleh Vanin - Projects</title>
      </Head>
      <main className="container mx-auto flex justify-center items-center my-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full h-full mx-6">
          <Card
            link="https://www.huddle.uk.com/"
            title="Huddle"
            content="Huddle takes all of the stress out of organising your bills and gives you one simple payment with no hidden surprises, no hassle and no fuss."
            renderMedia={() => (
              <div className="relative w-full h-60" style={{ backgroundColor: "#6447BB" }}>
                <Image src="/images/huddle_preview.png" layout="fill" objectFit="cover" priority />
              </div>
            )}
            renderMediaBadge={() => (
              <div className="relative w-full h-16">
                <Image src="/icons/huddle_badge.svg" layout="fill" />
              </div>
            )}
            badgePosition="center"
            tags={["utilities", "tenancy", "landlords"]}
          />
          <Card
            link="https://www.thisislanguage.com/"
            title="This is Language"
            content="thisislanguage.com is an online, video-based resource for language teachers and students around the world, founded on three core principles: Authentic, Efficient, Inspiring."
            renderMedia={() => (
              <video className="w-full h-60 object-cover" autoPlay playsInline loop muted controls={false}>
                <source src="/videos/thisislanguage_preview.mp4" type="video/mp4" />
              </video>
            )}
            renderMediaBadge={() => (
              <div className="relative w-full h-16">
                <Image src="/icons/thisislanguage_badge.svg" layout="fill" />
              </div>
            )}
            badgePosition="center"
            tags={["learning", "platform", "students", "schools"]}
          />
          <Card
            link="https://tsodelivery.com"
            title="TSO Chinese Delivery"
            content="With over 200 combined years of restaurant and technology experience, this team is deeply dedicated and committed to establishing Tso as America’s #1 choice for Chinese food delivery."
            renderMedia={() => (
              <div className="relative w-full h-60">
                <Image src="/images/tso_preview.jpg" layout="fill" objectFit="cover" priority />
              </div>
            )}
            renderMediaBadge={() => (
              <div className="relative w-full h-16">
                <Image src="/icons/tso_badge.svg" layout="fill" objectFit="contain" />
              </div>
            )}
            badgePosition="center"
            tags={["restaurant", "food", "chinese"]}
          />
          <Card
            link="https://www.clearstreetbank.com/"
            title="Clear Street Bank"
            content="A new banking experience..."
            renderMedia={() => (
              <div className="relative w-full h-60">
                <Image src="/images/clear_street_preview.jpg" layout="fill" objectFit="cover" priority />
              </div>
            )}
            renderMediaBadge={() => (
              <div className="relative w-full h-16">
                <Image src="/images/clear_street_badge.png" layout="fill" objectFit="contain" />
              </div>
            )}
            badgePosition="center"
            tags={["fintech", "finances", "microservices"]}
          />
          <Card
            link="https://www.coinmena.com"
            title="CoinMENA"
            content="CoinMENA is the easiest, safest, and fastest way to buy and sell cryptocurrency. Our goal is to provide direct and regulated access to the digital asset world."
            renderMedia={() => (
              <div className="relative w-full h-60">
                <Image src="/images/coinmena_preview.jpeg" layout="fill" objectFit="cover" priority />
              </div>
            )}
            renderMediaBadge={() => (
              <div className="relative w-full h-16">
                <Image src="/images/coinmena_badge.jpg" layout="fill" objectFit="contain" />
              </div>
            )}
            badgePosition="center"
            tags={["finances", "crypto", "arabic"]}
          />
        </div>
      </main>
    </>
  );
}
