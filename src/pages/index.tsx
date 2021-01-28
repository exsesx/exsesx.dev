import Image from "next/image";
import useMediaQuery from "../utils/hooks/useMediaQuery";

export default function Home() {
  const isDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

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
          <h2 className="text-gray-900 dark:text-gray-50 text-xl font-bold">Oleh Vanin</h2>
          <div className="text-gray-600 dark:text-gray-300 text-lg">Software Engineer</div>
          <div className="inline-flex text-gray-600 dark:text-gray-300 mt-2 space-x-3">
            <a href="https://github.com/exsesx" className="flex items-center">
              <Image
                src={isDarkMode ? "/icons/github-light.png" : "/icons/github-dark.png"}
                objectFit="contain"
                alt="GitHub"
                width={28}
                height={28}
              />
            </a>
            <a href="https://www.linkedin.com/in/exsesx/" className="flex items-center dark:bg-white rounded">
              <Image src="/icons/linkedin.png" objectFit="contain" alt="LinkedIn" width={28} height={28} />
            </a>
            <a href="https://t.me/exsesx" className="flex items-center">
              <Image src="/icons/telegram.png" objectFit="contain" alt="Telegram" width={28} height={28} />
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
