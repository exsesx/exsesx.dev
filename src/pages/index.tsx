import Image from "next/image";

export default function Home() {
  return (
    <main className="container mx-auto flex h-full justify-center items-center">
      <div className="grid grid-cols-1 gap-2 justify-center items-center">
        <Image
          className="mb-4 mx-auto"
          src="/images/main.png"
          alt="Main Picture"
          width={320}
          height={320}
          objectFit="contain"
        />
        <div className="text-center">
          <h1 className="text-gray-900 dark:text-gray-50 text-xl font-bold">Oleh Vanin</h1>
          <h2 className="text-gray-600 dark:text-gray-300 text-lg">Software Engineer</h2>
          <div className="inline-flex text-gray-600 dark:text-gray-300 mt-2 space-x-3">
            <a href="https://github.com/exsesx" className="flex items-center">
              <div className="dark:hidden flex">
                <Image src="/icons/github-dark.png" objectFit="contain" alt="GitHub" width={28} height={28} priority />
              </div>
              <div className="hidden dark:flex">
                <Image src="/icons/github-light.png" objectFit="contain" alt="GitHub" width={28} height={28} priority />
              </div>
            </a>
            <a href="https://www.linkedin.com/in/exsesx/" className="flex items-center">
              <Image src="/icons/linkedin.png" objectFit="contain" alt="LinkedIn" width={28} height={28} priority />
            </a>
            <a href="https://t.me/exsesx" className="flex items-center">
              <Image src="/icons/telegram.png" objectFit="contain" alt="Telegram" width={28} height={28} priority />
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
